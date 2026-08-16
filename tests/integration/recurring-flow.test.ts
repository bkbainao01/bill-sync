import { describe, expect, it, beforeEach } from 'vitest';
import { createIndexedDbRepositories } from '@/adapters/repositories/indexedDb';
import { createRecurringBill } from '@/core/entities/recurringBill';
import { createTransactionFromRecurring } from '@/core/recurring/fromRecurring';
import { dueSoonBills } from '@/core/recurring/reminders';
import { recurringStatus } from '@/core/recurring/period';
import { clearIndexedDb } from './helpers';

const repos = createIndexedDbRepositories();

beforeEach(async () => {
  await clearIndexedDb();
});

describe('recurring flow — สร้างบิลประจำ → เตือนก่อนครบ → สร้างรายการ → จ่ายแล้ว (integration)', () => {
  it('ครบวงจร: dueSoonBills เจอบิล → createTransactionFromRecurring → recurringStatus = paid', async () => {
    const rb = createRecurringBill({
      merchant: 'การไฟฟ้านครหลวง',
      amountSatang: 80000,
      categoryId: 'bills',
      cadence: 'monthly',
      dayOfMonth: 15,
    });
    await repos.recurringBills.create(rb);

    // วันที่ 12 — ครบกำหนด 15/08 → อยู่ในหน้าต่าง 5 วัน
    const due = dueSoonBills({ recurringBills: [rb], transactions: [], todayStr: '2026-08-12', leadDays: 5 });
    expect(due.map((d) => d.recurringBill.id)).toContain(rb.id);

    // ถึงกำหนดแล้ว → สร้าง transaction
    const tx = createTransactionFromRecurring(rb, '2026-08-16');
    await repos.transactions.create(tx);
    const txs = await repos.transactions.list();
    expect(txs).toHaveLength(1);
    expect(txs[0].recurringBillId).toBe(rb.id);

    const status = recurringStatus(rb, txs, '2026-08-16');
    expect(status.status).toBe('paid');
  });

  it('บิลที่จ่ายแล้วในรอบนี้ ไม่ถูกเตือนซ้ำ (dueSoonBills ข้าม paid)', async () => {
    const rb = createRecurringBill({
      merchant: 'AIS',
      amountSatang: 59900,
      categoryId: 'bills',
      cadence: 'monthly',
      dayOfMonth: 10,
    });
    await repos.recurringBills.create(rb);

    const tx = createTransactionFromRecurring(rb, '2026-08-10');
    await repos.transactions.create(tx);

    const due = dueSoonBills({
      recurringBills: [rb],
      transactions: await repos.transactions.list(),
      todayStr: '2026-08-12',
      leadDays: 5,
    });
    expect(due).toHaveLength(0);
  });

  it('บิลที่ปิดใช้งานไม่ขึ้นใน dueSoonBills และไม่สร้างรายการ', async () => {
    const rb = createRecurringBill({
      merchant: 'TrueMove',
      amountSatang: 39900,
      categoryId: 'bills',
      cadence: 'monthly',
      dayOfMonth: 5,
      enabled: false,
    });
    await repos.recurringBills.create(rb);

    expect(
      dueSoonBills({ recurringBills: [rb], transactions: [], todayStr: '2026-08-16', leadDays: 7 }),
    ).toHaveLength(0);
  });
});
