import { describe, expect, it } from 'vitest';
import { fromSatang, toSatang } from './money';
import { monthKey, summarizeMonth } from './summary';
import { createTransaction } from '../entities/transaction';

function tx(overrides: Partial<Parameters<typeof createTransaction>[0]> = {}) {
  return createTransaction({
    type: 'expense',
    amountSatang: 1000,
    categoryId: 'food',
    date: '2026-08-15',
    ...overrides,
  });
}

describe('money (บาท ↔ สตางค์)', () => {
  it('แปลงบาท → สตางค์ โดยปัดเศษ', () => {
    expect(toSatang(1.5)).toBe(150);
    expect(toSatang(0.1)).toBe(10);
  });

  it('แปลงสตางค์ → บาท', () => {
    expect(fromSatang(123456)).toBe(1234.56);
  });

  it('0.1 + 0.2 === 0.3 เมื่อเก็บเป็นสตางค์', () => {
    expect(toSatang(0.1) + toSatang(0.2)).toBe(toSatang(0.3));
  });
});

describe('summary', () => {
  it('monthKey ตัดจาก YYYY-MM-DD', () => {
    expect(monthKey('2026-08-15')).toBe('2026-08');
  });

  it('สรุปรายรับ/รายจ่าย/คงเหลือ ของเดือนที่กำหนด', () => {
    const txs = [
      tx({ type: 'income', amountSatang: 30000, date: '2026-08-01' }),
      tx({ amountSatang: 12000, date: '2026-08-05' }),
      tx({ amountSatang: 8000, date: '2026-08-20', categoryId: 'bills' }),
      tx({ amountSatang: 9999, date: '2026-07-31' }), // เดือนอื่น — ต้องไม่นับ
    ];
    const s = summarizeMonth(txs, '2026-08');
    expect(s.income).toBe(30000);
    expect(s.expense).toBe(20000);
    expect(s.balance).toBe(10000);
    expect(s.count).toBe(3);
    expect(s.byCategory.food).toBe(12000);
    expect(s.byCategory.bills).toBe(8000);
  });

  it('ข้ามรายการที่ถูกลบ, rejected และ reviewing', () => {
    const base = tx({ amountSatang: 1000 });
    const txs = [
      base,
      { ...base, id: 'del', deletedAt: '2026-08-10T00:00:00.000Z' },
      { ...base, id: 'rej', status: 'rejected' as const },
      { ...base, id: 'rev', status: 'reviewing' as const },
    ];
    const s = summarizeMonth(txs, '2026-08');
    expect(s.count).toBe(1);
    expect(s.expense).toBe(1000);
  });

  it('เดือนที่ไม่มีรายการ → สรุปเป็น 0', () => {
    const s = summarizeMonth([], '2026-01');
    expect(s).toEqual({ income: 0, expense: 0, balance: 0, byCategory: {}, count: 0 });
  });
});
