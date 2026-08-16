import { describe, expect, it, beforeEach } from 'vitest';
import { createIndexedDbRepositories } from '@/adapters/repositories/indexedDb';
import { createTransaction } from '@/core/entities/transaction';
import { createRecurringBill } from '@/core/entities/recurringBill';
import { extractionToBill } from '@/core/scanner/parse';
import { clearIndexedDb } from './helpers';

const repos = createIndexedDbRepositories();

beforeEach(async () => {
  await clearIndexedDb();
});

describe('repositories — IndexedDB integration', () => {
  it('categories: seed อัตโนมัติเมื่อ list ครั้งแรก', async () => {
    const cats = await repos.categories.list();
    expect(cats.length).toBeGreaterThanOrEqual(8);
    expect(cats.some((c) => c.name === 'อาหาร')).toBe(true);
    // list ซ้ำไม่ seed ซ้ำ
    const again = await repos.categories.list();
    expect(again.length).toBe(cats.length);
  });

  it('transactions: create → list เรียงวันที่ล่าสุดก่อน → softDelete ซ่อนจาก list', async () => {
    const older = createTransaction({
      type: 'expense',
      amountSatang: 10000,
      categoryId: 'food',
      date: '2026-08-01',
      merchant: 'ร้านเก่า',
    });
    const newer = createTransaction({
      type: 'income',
      amountSatang: 500000,
      categoryId: 'salary',
      date: '2026-08-05',
      merchant: 'เงินเดือน',
    });
    await repos.transactions.create(older);
    await repos.transactions.create(newer);

    const list = await repos.transactions.list();
    expect(list.map((t) => t.id)).toEqual([newer.id, older.id]);

    await repos.transactions.softDelete(newer.id);
    const after = await repos.transactions.list();
    expect(after.map((t) => t.id)).toEqual([older.id]);
    // soft delete = เก็บแถวไว้ (deletedAt ถูกตั้ง) ไม่ได้ลบจริง
    const kept = await repos.transactions.getById(newer.id);
    expect(kept?.deletedAt).not.toBeNull();
  });

  it('transactions: update ตั้ง updatedAt ใหม่', async () => {
    const tx = createTransaction(
      {
        type: 'expense',
        amountSatang: 5000,
        categoryId: 'transport',
        date: '2026-08-10',
        merchant: 'BTS',
      },
      '2026-01-01T00:00:00.000Z',
    );
    await repos.transactions.create(tx);
    await repos.transactions.update({ ...tx, merchant: 'MRT' });
    const stored = await repos.transactions.getById(tx.id);
    expect(stored?.merchant).toBe('MRT');
    expect(stored?.updatedAt).not.toBe(tx.updatedAt);
  });

  it('bills: create/update ครบวงจร + list ข้าม deletedAt', async () => {
    const bill = extractionToBill(
      {
        merchant: { value: 'เซเว่น', confidence: 0.9 },
        total: { value: 120, confidence: 0.9 },
        date: { value: '2026-08-15', confidence: 0.9 },
        vat: { value: null, confidence: 0 },
        items: { value: null, confidence: 0 },
        summary: 'อ่านได้',
      },
      { uri: 'data:image/png;base64,x', name: 'x.png', mimeType: 'image/png' },
      '2026-01-01T00:00:00.000Z',
    );
    await repos.bills.create(bill);
    expect((await repos.bills.getById(bill.id))?.status).toBe('scanned');

    await repos.bills.update({ ...bill, status: 'confirmed' });
    expect((await repos.bills.getById(bill.id))?.status).toBe('confirmed');
    expect((await repos.bills.getById(bill.id))?.updatedAt).not.toBe(bill.updatedAt);

    // bill ไม่มี softDelete ใน interface — ทดสอบ list เบื้องต้น
    const all = await repos.bills.list();
    expect(all.map((b) => b.id)).toContain(bill.id);
  });

  it('recurringBills: create/update/softDelete', async () => {
    const rb = createRecurringBill({
      merchant: 'การไฟฟ้านครหลวง',
      amountSatang: 80000,
      categoryId: 'bills',
      cadence: 'monthly',
      dayOfMonth: 15,
    });
    await repos.recurringBills.create(rb);
    expect((await repos.recurringBills.list()).map((r) => r.id)).toEqual([rb.id]);

    await repos.recurringBills.update({ ...rb, enabled: false });
    expect((await repos.recurringBills.getById(rb.id))?.enabled).toBe(false);

    await repos.recurringBills.softDelete(rb.id);
    expect(await repos.recurringBills.list()).toHaveLength(0);
    expect((await repos.recurringBills.getById(rb.id))?.deletedAt).not.toBeNull();
  });
});
