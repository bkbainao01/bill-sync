import { describe, expect, it } from 'vitest';
import { monthlyExpenseTrend, niceCeil } from './trend';
import { createTransaction } from '../entities/transaction';

function tx(date: string, amount: number, overrides: object = {}) {
  return createTransaction({
    type: 'expense',
    amountSatang: amount,
    categoryId: 'food',
    date,
    ...overrides,
  });
}

describe('monthlyExpenseTrend', () => {
  it('รวมรายจ่ายรายเดือน 6 เดือนย้อนหลัง', () => {
    const txs = [
      tx('2026-08-01', 1000),
      tx('2026-08-20', 2000),
      tx('2026-07-15', 500),
      tx('2026-03-10', 999), // เกิน 6 เดือน (มี.ค. ไม่รวม)
      tx('2026-06-01', 300),
    ];
    const trend = monthlyExpenseTrend(txs, '2026-08');
    expect(trend).toHaveLength(6);
    expect(trend[5]).toEqual({ month: '2026-08', expense: 3000 });
    expect(trend[4]).toEqual({ month: '2026-07', expense: 500 });
    expect(trend[2]).toEqual({ month: '2026-05', expense: 0 });
  });

  it('ข้ามรายได้, รายการที่ลบแล้ว และ reviewing', () => {
    const txs = [
      { ...tx('2026-08-01', 1000), type: 'income' as const },
      { ...tx('2026-08-02', 1000), deletedAt: '2026-08-03T00:00:00.000Z' },
      { ...tx('2026-08-04', 1000), status: 'reviewing' as const },
      tx('2026-08-05', 2500),
    ];
    const trend = monthlyExpenseTrend(txs, '2026-08', 1);
    expect(trend[0].expense).toBe(2500);
  });

  it('ข้ามปี (ธ.ค. → ม.ค.)', () => {
    const txs = [tx('2026-01-15', 700)];
    const trend = monthlyExpenseTrend(txs, '2026-01', 3);
    expect(trend.map((t) => t.month)).toEqual(['2025-11', '2025-12', '2026-01']);
    expect(trend[2].expense).toBe(700);
  });
});

describe('niceCeil', () => {
  it('ปัดขึ้นเป็นเลขกลม 1/2/5 × 10^n', () => {
    expect(niceCeil(1)).toBe(1);
    expect(niceCeil(99)).toBe(100);
    expect(niceCeil(101)).toBe(200);
    expect(niceCeil(450)).toBe(500);
    expect(niceCeil(999)).toBe(1000);
    expect(niceCeil(12345)).toBe(20000);
  });
});
