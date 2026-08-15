import { describe, expect, it } from 'vitest';
import { formatBaht, formatDateThai, monthLabel, shiftMonth } from './format';

describe('format', () => {
  it('formatBaht แปลงสตางค์ → สตริงบาท', () => {
    expect(formatBaht(123456)).toBe('1,234.56 บาท');
    expect(formatBaht(0)).toBe('0.00 บาท');
  });

  it('monthLabel แปลง ค.ศ. → เดือนไทย + พ.ศ.', () => {
    expect(monthLabel('2026-08')).toBe('สิงหาคม 2569');
    expect(monthLabel('2025-01')).toBe('มกราคม 2568');
  });

  it('shiftMonth ข้ามปีถูกต้อง', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2025-12', 1)).toBe('2026-01');
  });

  it('formatDateThai ใช้เดือนย่อ + พ.ศ.', () => {
    expect(formatDateThai('2026-08-15')).toBe('15 ส.ค. 2569');
  });

  it('ค่าที่ไม่ถูกต้องคืนค่าเดิม', () => {
    expect(monthLabel('not-a-month')).toBe('not-a-month');
    expect(formatDateThai('bad')).toBe('bad');
  });
});
