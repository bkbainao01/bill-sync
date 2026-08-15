import type { RecurringBill } from '../entities/recurringBill';
import type { Transaction } from '../entities/transaction';
import { recurringStatus } from './period';
import { parseDate } from './period';

export interface DueReminder {
  recurringBill: RecurringBill;
  /** คีย์ของรอบ เช่น '2026-08' — ใช้กันซ้ำการแจ้งเตือนต่อรอบ */
  periodKey: string;
  /** วันที่คาดว่าต้องจ่าย (YYYY-MM-DD) */
  expectedDate: string;
  /** จำนวนวันก่อนครบกำหนด (0 = วันนี้, ลบ = เลยกำหนดแล้ว) */
  daysUntil: number;
}

/** จำนวนวันจากวันนี้ถึงวันครบกำหนด (ปัดเป็นวัน) */
export function daysUntil(expectedDate: string, todayStr: string): number {
  const a = parseDate(expectedDate);
  const b = parseDate(todayStr);
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

/**
 * บิลประจำที่ใกล้ครบกำหนด (หรือเลยกำหนด) ในหน้าต่าง leadDays วัน
 * ข้ามบิลที่ปิด / จ่ายแล้ว — เรียงจากใกล้สุดก่อน
 */
export function dueSoonBills(params: {
  recurringBills: RecurringBill[];
  transactions: Transaction[];
  todayStr: string;
  /** แจ้งเตือนล่วงหน้ากี่วัน (0 = เฉพาะวันครบกำหนด) */
  leadDays: number;
}): DueReminder[] {
  const { recurringBills, transactions, todayStr, leadDays } = params;
  const out: DueReminder[] = [];

  for (const rb of recurringBills) {
    const info = recurringStatus(rb, transactions, todayStr);
    if (info.status === 'disabled' || info.status === 'paid') continue;
    if (!info.expectedDate) continue;
    const d = daysUntil(info.expectedDate, todayStr);
    if (d <= leadDays) {
      out.push({
        recurringBill: rb,
        periodKey: info.periodKey,
        expectedDate: info.expectedDate,
        daysUntil: d,
      });
    }
  }

  out.sort((a, b) => a.daysUntil - b.daysUntil);
  return out;
}
