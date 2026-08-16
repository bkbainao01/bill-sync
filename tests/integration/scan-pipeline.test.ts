import { describe, expect, it, beforeEach } from 'vitest';
import { createIndexedDbRepositories } from '@/adapters/repositories/indexedDb';
import { parseOcrText } from '@/core/scanner/ocr';
import { extractionToBill, suggestedTransactionFromBill } from '@/core/scanner/parse';
import { transitionBill } from '@/core/bills/flow';
import { createTransaction } from '@/core/entities/transaction';
import { createRecurringBill } from '@/core/entities/recurringBill';
import { nowIso } from '@/core/entities/base';
import { suggestRecurringLink } from '@/core/recurring/match';
import { recurringStatus } from '@/core/recurring/period';
import { corpus } from '@/core/scanner/golden/corpus';
import { clearIndexedDb } from './helpers';

const repos = createIndexedDbRepositories();

beforeEach(async () => {
  await clearIndexedDb();
});

describe('scan pipeline — ทุกเคสใน corpus: OCR → bill → review → confirm → transaction (integration)', () => {
  for (const c of corpus) {
    it(`${c.id}: ${c.label}`, async () => {
      // 1. OCR (offline) → Bill สถานะ scanned → บันทึกลง repository
      const extraction = parseOcrText(c.rawText);
      const bill = extractionToBill(
        extraction,
        { uri: 'data:image/png;base64,x', name: `${c.id}.png`, mimeType: 'image/png' },
      );
      await repos.bills.create(bill);

      // 2. เริ่ม review (scanned → reviewing)
      const reviewing = transitionBill(bill, 'startReview', nowIso());
      await repos.bills.update(reviewing);
      expect((await repos.bills.getById(bill.id))?.status).toBe('reviewing');

      // 3. แนะนำลิงก์เข้ารายการบิลประจำ (มีบิลที่ร้าน/ยอดตรงกันในระบบ)
      const rb = createRecurringBill({
        merchant: c.expected.merchant!,
        amountSatang: Math.round(c.expected.total! * 100),
        categoryId: 'food',
        cadence: 'monthly',
        dayOfMonth: 5,
      });
      await repos.recurringBills.create(rb);
      const match = suggestRecurringLink({
        merchant: bill.extracted.merchant?.value ?? null,
        amountSatang: bill.extracted.total?.value != null ? Math.round(bill.extracted.total.value * 100) : null,
        recurringBills: [rb],
      });
      expect(match, `case ${c.id}: ควร match recurring bill`).not.toBeNull();
      expect(match!.recurringBillId).toBe(rb.id);

      // 4. ผู้ใช้ยืนยัน → transaction + ลิงก์ recurringBillId
      const suggested = suggestedTransactionFromBill(bill);
      const tx = createTransaction({
        type: 'expense',
        amountSatang: suggested.amountSatang,
        categoryId: 'food',
        date: suggested.date,
        merchant: suggested.merchant,
        recurringBillId: match!.recurringBillId,
      });
      await repos.transactions.create(tx);
      const confirmed = { ...transitionBill(reviewing, 'confirm', nowIso()), transactionId: tx.id };
      await repos.bills.update(confirmed);

      // 5. ตรวจผลลัพธ์ใน repository เทียบ expected ของ corpus
      const stored = await repos.bills.getById(bill.id);
      expect(stored?.status).toBe('confirmed');
      expect(stored?.transactionId).toBe(tx.id);

      const txs = await repos.transactions.list();
      expect(txs).toHaveLength(1);
      expect(txs[0].merchant).toBe(c.expected.merchant);
      expect(txs[0].amount).toBe(Math.round(c.expected.total! * 100));
      expect(txs[0].date).toBe(c.expected.date);

      // บิลประจำนับเป็น "จ่ายแล้ว" ในรอบเดียวกันกับวันที่บิล
      const todayInSamePeriod = `${c.expected.date!.slice(0, 8)}10`;
      const status = recurringStatus(rb, txs, todayInSamePeriod);
      expect(status.status, `case ${c.id}: recurring ควรเป็น paid`).toBe('paid');
    });
  }
});

describe('scan pipeline — edge cases', () => {
  it('ผู้ใช้ปฏิเสธบิล → สถานะ rejected และไม่มี transaction', async () => {
    const c = corpus[0];
    const extraction = parseOcrText(c.rawText);
    const bill = extractionToBill(
      extraction,
      { uri: 'data:image/png;base64,x', name: 'x.png', mimeType: 'image/png' },
    );
    await repos.bills.create(bill);

    const reviewing = transitionBill(bill, 'startReview', nowIso());
    await repos.bills.update(reviewing);
    await repos.bills.update(transitionBill(reviewing, 'reject', nowIso()));

    expect((await repos.bills.getById(bill.id))?.status).toBe('rejected');
    expect(await repos.transactions.list()).toHaveLength(0);
  });

  it('บิล confirmed แล้วไม่มี transition ออก (state machine เข้มงวด)', async () => {
    const c = corpus[0];
    const extraction = parseOcrText(c.rawText);
    const bill = extractionToBill(
      extraction,
      { uri: 'data:image/png;base64,x', name: 'x.png', mimeType: 'image/png' },
    );
    const reviewing = transitionBill(bill, 'startReview', nowIso());
    const confirmed = transitionBill(reviewing, 'confirm', nowIso());
    expect(() => transitionBill(confirmed, 'reject', nowIso())).toThrow();
  });
});
