import type { Transaction } from '../entities/transaction';

export interface Summary {
  /** ยอดรวมในหน่วยสตางค์ */
  income: number;
  expense: number;
  balance: number;
  /** categoryId → ยอดรายจ่าย (สตางค์) */
  byCategory: Record<string, number>;
  /** จำนวนรายการที่นับรวม */
  count: number;
}

/** 'YYYY-MM-DD' → 'YYYY-MM' */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function emptySummary(): Summary {
  return { income: 0, expense: 0, balance: 0, byCategory: {}, count: 0 };
}

/**
 * สรุปยอดของเดือนที่กำหนด
 * ข้าม: รายการที่ถูกลบ (deletedAt), rejected, และ reviewing (ยังไม่ confirm)
 */
export function summarizeMonth(transactions: Transaction[], month: string): Summary {
  const summary = emptySummary();
  for (const t of transactions) {
    if (t.deletedAt || t.status === 'rejected' || t.status === 'reviewing') continue;
    if (monthKey(t.date) !== month) continue;
    summary.count += 1;
    if (t.type === 'income') {
      summary.income += t.amount;
    } else {
      summary.expense += t.amount;
      if (t.categoryId) {
        summary.byCategory[t.categoryId] = (summary.byCategory[t.categoryId] ?? 0) + t.amount;
      }
    }
  }
  summary.balance = summary.income - summary.expense;
  return summary;
}

/** เปรียบเทียบยอดรายจ่ายกับเดือนก่อนหน้า — คืนค่า % ที่เปลี่ยนแปลง (เช่น -12.5) */
export function expenseDeltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
