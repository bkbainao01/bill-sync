import { describe, expect, it } from 'vitest';
import { createRecurringBill } from '../entities/recurringBill';
import { createTransactionFromRecurring } from './fromRecurring';

describe('createTransactionFromRecurring', () => {
  it('สร้าง expense transaction จากบิลประจำที่ครบกำหนด', () => {
    const rb = createRecurringBill({
      merchant: 'การไฟฟ้านครหลวง',
      amountSatang: 80000,
      categoryId: 'bills',
      cadence: 'monthly',
      dayOfMonth: 15,
    });
    const t = createTransactionFromRecurring(rb, '2026-08-18', '2026-08-18T10:00:00.000Z');
    expect(t.type).toBe('expense');
    expect(t.amount).toBe(80000);
    expect(t.categoryId).toBe('bills');
    expect(t.merchant).toBe('การไฟฟ้านครหลวง');
    expect(t.date).toBe('2026-08-15'); // ใช้วันครบกำหนดของรอบ
    expect(t.recurringBillId).toBe(rb.id);
    expect(t.status).toBe('confirmed');
    expect(t.billId).toBeNull();
  });

  it('ใช้ปีปัจจุบันสำหรับ yearly', () => {
    const rb = createRecurringBill({
      merchant: 'ประกัน',
      amountSatang: 1200000,
      categoryId: 'bills',
      cadence: 'yearly',
      dayOfMonth: 10,
      month: 3,
    });
    const t = createTransactionFromRecurring(rb, '2026-08-18');
    expect(t.date).toBe('2026-03-10');
  });
});
