import type { RecurringBill } from '../entities/recurringBill';
import { createTransaction, type Transaction } from '../entities/transaction';
import { expectedDateFor, periodKeyFor, expectedDateInPeriod } from './period';

/**
 * สร้าง Transaction (expense) สำหรับบิลประจำในรอบปัจจุบัน
 * วันที่ใช้เป็นวันที่คาดว่าต้องจ่ายของรอบนั้น (เช่น วันที่ 15 ของเดือน)
 */
export function createTransactionFromRecurring(
  rb: RecurringBill,
  todayStr: string,
  now: string = new Date().toISOString(),
  id?: string,
): Transaction {
  const periodKey = periodKeyFor(rb, todayStr);
  const expected = expectedDateInPeriod(rb, periodKey) ?? expectedDateFor(rb, todayStr);

  return createTransaction(
    {
      type: 'expense',
      amountSatang: rb.amount,
      categoryId: rb.categoryId,
      date: expected ?? todayStr,
      merchant: rb.merchant,
      note: `บิลประจำ (${rb.merchant})`,
      recurringBillId: rb.id,
    },
    now,
    id,
  );
}
