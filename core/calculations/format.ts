export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
] as const;

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
] as const;

const numberFormat = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 123456 → '1,234.56 บาท' */
export function formatBaht(satang: number): string {
  return `${numberFormat.format(satang / 100)} บาท`;
}

/** 123456 → '1,235 บาท' (ไม่มีทศนิยม) */
export function formatBahtWhole(satang: number): string {
  return `${new Intl.NumberFormat('th-TH').format(Math.round(satang / 100))} บาท`;
}

/** '2026-08' → 'สิงหาคม 2569' (พ.ศ. = ค.ศ. + 543) */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return month;
  return `${THAI_MONTHS[m - 1]} ${y + 543}`;
}

/** เลื่อนเดือน ±delta: shiftMonth('2026-01', -1) → '2025-12' */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** '2026-08-15' → '15 ส.ค. 2569' */
export function formatDateThai(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return date;
  return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${y + 543}`;
}

/** วันที่ของวันนี้ในรูปแบบ YYYY-MM-DD */
export function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' ของเมื่อวาน */
export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
