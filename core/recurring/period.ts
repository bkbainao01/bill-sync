import type { RecurringBill } from '../entities/recurringBill';
import type { Transaction } from '../entities/transaction';
import { THAI_MONTHS_SHORT } from '../calculations/format';

export const WEEKDAY_THAI = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'] as const;

export type RecurringStatus = 'due' | 'upcoming' | 'paid' | 'disabled';

export interface RecurringStatusInfo {
  status: RecurringStatus;
  /** คีย์ของรอบปัจจุบัน เช่น '2026-08' (monthly), '2026-08-10' (weekly: วันจันทร์), '2026' (yearly) */
  periodKey: string;
  /** วันที่คาดว่าต้องจ่ายในรอบนี้ (YYYY-MM-DD) */
  expectedDate: string | null;
  /** วันที่จ่ายจริง (ถ้าจ่ายแล้ว) */
  paidDate: string | null;
}

export function parseDate(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}

function lastDayOfMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

function clamp(day: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(day), min), max);
}

/** จันทร์ของสัปดาห์ที่มีวันที่ d */
function mondayOf(d: Date): Date {
  const day = d.getUTCDay();
  return addDays(d, (day + 6) % 7 === 0 ? 0 : -((day + 6) % 7));
}

/** คีย์ของรอบ (period) ที่มีวันที่นี้อยู่ */
export function periodKeyFor(rb: RecurringBill, dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return '';
  switch (rb.cadence) {
    case 'monthly':
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
    case 'weekly':
      return toKey(mondayOf(d));
    case 'yearly':
      return `${d.getUTCFullYear()}`;
  }
}

/** วันที่คาดว่าต้องจ่ายในรอบที่ระบุ — null ถ้ารอบไม่รู้จัก */
export function expectedDateInPeriod(rb: RecurringBill, periodKey: string): string | null {
  switch (rb.cadence) {
    case 'monthly': {
      const m = /^(\d{4})-(\d{2})$/.exec(periodKey);
      if (!m) return null;
      const y = Number(m[1]);
      const month = Number(m[2]);
      const day = clamp(rb.dayOfMonth, 1, lastDayOfMonth(y, month));
      return `${y}-${pad(month)}-${pad(day)}`;
    }
    case 'weekly': {
      const monday = parseDate(periodKey);
      if (!monday) return null;
      // dayOfMonth = เลขวันในสัปดาห์ตาม JS getDay() (0=อาทิตย์ … 6=เสาร์)
      const weekday = clamp(rb.dayOfMonth, 0, 6);
      const offsetFromMonday = (weekday + 6) % 7;
      return toKey(addDays(monday, offsetFromMonday));
    }
    case 'yearly': {
      const m = /^(\d{4})$/.exec(periodKey);
      if (!m) return null;
      const y = Number(m[1]);
      const month = clamp(rb.month ?? 1, 1, 12);
      const day = clamp(rb.dayOfMonth, 1, lastDayOfMonth(y, month));
      return `${y}-${pad(month)}-${pad(day)}`;
    }
  }
}

/** วันที่คาดว่าต้องจ่ายของรอบที่มีวันที่นี้อยู่ */
export function expectedDateFor(rb: RecurringBill, dateStr: string): string | null {
  return expectedDateInPeriod(rb, periodKeyFor(rb, dateStr));
}

/** คำนวณสถานะของบิลประจำในรอบปัจจุบัน */
export function recurringStatus(
  rb: RecurringBill,
  transactions: Transaction[],
  todayStr: string,
): RecurringStatusInfo {
  if (!rb.enabled) {
    return { status: 'disabled', periodKey: '', expectedDate: null, paidDate: null };
  }

  const periodKey = periodKeyFor(rb, todayStr);
  const expectedDate = expectedDateInPeriod(rb, periodKey);

  const paid = transactions.find(
    (t) =>
      !t.deletedAt &&
      t.status === 'confirmed' &&
      t.recurringBillId === rb.id &&
      periodKeyFor(rb, t.date) === periodKey,
  );

  if (paid) {
    return { status: 'paid', periodKey, expectedDate, paidDate: paid.date };
  }
  if (expectedDate && todayStr >= expectedDate) {
    return { status: 'due', periodKey, expectedDate, paidDate: null };
  }
  return { status: 'upcoming', periodKey, expectedDate, paidDate: null };
}

/** ป้ายกำกับรอบ เช่น 'ทุกวันที่ 15' / 'ทุกวันจันทร์' / 'ทุกปี 15 ส.ค.' */
export function cadenceLabel(rb: RecurringBill): string {
  switch (rb.cadence) {
    case 'monthly':
      return `ทุกวันที่ ${rb.dayOfMonth}`;
    case 'weekly': {
      const weekday = WEEKDAY_THAI[clamp(rb.dayOfMonth, 0, 6)];
      return `ทุกวัน${weekday}`;
    }
    case 'yearly': {
      const month = clamp(rb.month ?? 1, 1, 12);
      return `ทุกปี ${rb.dayOfMonth} ${THAI_MONTHS_SHORT[month - 1]}`;
    }
  }
}
