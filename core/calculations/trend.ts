import type { Transaction } from '../entities/transaction';
import { shiftMonth } from './format';
import { monthKey } from './summary';

export interface MonthExpense {
  /** YYYY-MM */
  month: string;
  /** ยอดรายจ่ายในหน่วยสตางค์ */
  expense: number;
}

/** ยอดรายจ่ายของ count เดือนย้อนหลัง (endMonth เป็นเดือนสุดท้าย) */
export function monthlyExpenseTrend(
  transactions: Transaction[],
  endMonth: string,
  count = 6,
): MonthExpense[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(shiftMonth(endMonth, -i));
  }

  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.deletedAt || t.status !== 'confirmed' || t.type !== 'expense') continue;
    const key = monthKey(t.date);
    if (!months.includes(key)) continue;
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }

  return months.map((m) => ({ month: m, expense: map.get(m) ?? 0 }));
}

/** ปัดค่ายอดสูงสุดขึ้นเป็นเลขกลมๆ (1/2/5 × 10^n) สำหรับสเกลกราฟ */
export function niceCeil(value: number): number {
  if (value <= 0) return 100;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  const frac = value / base;
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return nice * base;
}
