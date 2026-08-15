import { describe, expect, it } from 'vitest';
import type { RecurringBill } from '../entities/recurringBill';
import { createRecurringBill } from '../entities/recurringBill';
import { createTransaction } from '../entities/transaction';
import { cadenceLabel, expectedDateFor, periodKeyFor, recurringStatus } from './period';

function rb(overrides: Partial<Parameters<typeof createRecurringBill>[0]> = {}): RecurringBill {
  return createRecurringBill({
    merchant: 'การไฟฟ้านครหลวง',
    amountSatang: 80000,
    categoryId: 'bills',
    cadence: 'monthly',
    dayOfMonth: 15,
    ...overrides,
  });
}

function tx(date: string, recurringBillId: string | null = null, overrides: object = {}) {
  return createTransaction({
    type: 'expense',
    amountSatang: 80000,
    categoryId: 'bills',
    date,
    merchant: 'การไฟฟ้านครหลวง',
    recurringBillId,
    ...overrides,
  });
}

describe('periodKeyFor', () => {
  it('monthly → YYYY-MM', () => {
    expect(periodKeyFor(rb(), '2026-08-15')).toBe('2026-08');
  });

  it('weekly → วันที่ของวันจันทร์ในสัปดาห์นั้น', () => {
    const weekly = rb({ cadence: 'weekly', dayOfMonth: 1 });
    expect(periodKeyFor(weekly, '2026-08-19')).toBe('2026-08-17'); // พุธ → จันทร์
    expect(periodKeyFor(weekly, '2026-08-17')).toBe('2026-08-17');
  });

  it('yearly → ปี', () => {
    expect(periodKeyFor(rb({ cadence: 'yearly', month: 8 }), '2026-08-15')).toBe('2026');
  });
});

describe('expectedDateFor', () => {
  it('monthly: วันที่ 15 ของเดือน', () => {
    expect(expectedDateFor(rb({ dayOfMonth: 15 }), '2026-08-10')).toBe('2026-08-15');
  });

  it('monthly: clamp วันที่ 31 ในเดือนกุมภาพันธ์', () => {
    expect(expectedDateFor(rb({ dayOfMonth: 31 }), '2026-02-01')).toBe('2026-02-28');
  });

  it('weekly: จันทร์ + วันในสัปดาห์ (0=อาทิตย์ … 6=เสาร์)', () => {
    const weekly = rb({ cadence: 'weekly', dayOfMonth: 3 }); // พุธ
    expect(expectedDateFor(weekly, '2026-08-19')).toBe('2026-08-19');
    expect(expectedDateFor(weekly, '2026-08-23')).toBe('2026-08-19');
    // อาทิตย์ = 6 วันหลังจากจันทร์
    const sunday = rb({ cadence: 'weekly', dayOfMonth: 0 });
    expect(expectedDateFor(sunday, '2026-08-19')).toBe('2026-08-23');
  });

  it('yearly: เดือน+วัน ที่ระบุ', () => {
    const yearly = rb({ cadence: 'yearly', dayOfMonth: 15, month: 8 });
    expect(expectedDateFor(yearly, '2026-03-01')).toBe('2026-08-15');
  });
});

describe('recurringStatus', () => {
  it('ยังไม่ถึงกำหนด → upcoming', () => {
    const info = recurringStatus(rb({ dayOfMonth: 15 }), [], '2026-08-10');
    expect(info.status).toBe('upcoming');
    expect(info.expectedDate).toBe('2026-08-15');
  });

  it('ถึงกำหนดแล้วยังไม่จ่าย → due', () => {
    const info = recurringStatus(rb({ dayOfMonth: 15 }), [], '2026-08-18');
    expect(info.status).toBe('due');
  });

  it('จ่ายแล้วในรอบนี้ → paid (ทั้งรายการที่ link recurringBillId)', () => {
    const bill = rb({ dayOfMonth: 15 });
    const txs = [tx('2026-08-15', bill.id)];
    const info = recurringStatus(bill, txs, '2026-08-18');
    expect(info.status).toBe('paid');
    expect(info.paidDate).toBe('2026-08-15');
  });

  it('จ่ายเดือนก่อน ไม่นับเป็น paid ของเดือนนี้', () => {
    const bill = rb({ dayOfMonth: 15 });
    const txs = [tx('2026-07-15', bill.id)];
    const info = recurringStatus(bill, txs, '2026-08-18');
    expect(info.status).toBe('due');
  });

  it('ปิดอยู่ → disabled (แม้จะถึงกำหนด)', () => {
    const info = recurringStatus(rb({ dayOfMonth: 15, enabled: false }), [], '2026-08-18');
    expect(info.status).toBe('disabled');
  });

  it('รายการที่ถูกลบ/reviewing ไม่นับเป็น paid', () => {
    const bill = rb({ dayOfMonth: 15 });
    const txs = [
      { ...tx('2026-08-15', bill.id), deletedAt: '2026-08-16T00:00:00.000Z' },
      { ...tx('2026-08-15', bill.id), status: 'reviewing' as const },
    ];
    const info = recurringStatus(bill, txs, '2026-08-18');
    expect(info.status).toBe('due');
  });
});

describe('cadenceLabel', () => {
  it('monthly/weekly/yearly', () => {
    expect(cadenceLabel(rb({ cadence: 'monthly', dayOfMonth: 15 }))).toBe('ทุกวันที่ 15');
    expect(cadenceLabel(rb({ cadence: 'weekly', dayOfMonth: 1 }))).toBe('ทุกวันจันทร์');
    expect(cadenceLabel(rb({ cadence: 'yearly', dayOfMonth: 15, month: 8 }))).toBe('ทุกปี 15 ส.ค.');
  });
});
