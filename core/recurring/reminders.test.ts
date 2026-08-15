import { describe, expect, it } from 'vitest';
import { daysUntil, dueSoonBills } from './reminders';
import { createRecurringBill } from '../entities/recurringBill';
import { createTransaction } from '../entities/transaction';

function rb(overrides: Partial<Parameters<typeof createRecurringBill>[0]> = {}) {
  return createRecurringBill({
    merchant: 'การไฟฟ้านครหลวง',
    amountSatang: 80_000,
    categoryId: 'bills',
    cadence: 'monthly',
    dayOfMonth: 15,
    ...overrides,
  });
}

describe('daysUntil', () => {
  it('คำนวณจำนวนวันก่อนครบกำหนด', () => {
    expect(daysUntil('2026-08-17', '2026-08-15')).toBe(2);
    expect(daysUntil('2026-08-15', '2026-08-15')).toBe(0);
    expect(daysUntil('2026-08-10', '2026-08-15')).toBe(-5);
  });
});

describe('dueSoonBills', () => {
  const today = '2026-08-15';

  it('เจอบิลที่ครบกำหนดในหน้าต่าง leadDays', () => {
    const bills = [rb(), rb({ merchant: 'AIS', dayOfMonth: 20 }), rb({ merchant: 'True', dayOfMonth: 30 })];
    const due = dueSoonBills({ recurringBills: bills, transactions: [], todayStr: today, leadDays: 5 });
    // 15 ส.ค. (0 วัน) + 20 ส.ค. (5 วัน) — 30 ส.ค. เกิน window
    expect(due).toHaveLength(2);
    expect(due[0].recurringBill.merchant).toBe('การไฟฟ้านครหลวง');
    expect(due[0].daysUntil).toBe(0);
    expect(due[1].daysUntil).toBe(5);
  });

  it('รวมบิลที่เลยกำหนดแล้วด้วย', () => {
    const bills = [rb({ merchant: 'AIS', dayOfMonth: 10 })];
    const due = dueSoonBills({ recurringBills: bills, transactions: [], todayStr: today, leadDays: 3 });
    expect(due).toHaveLength(1);
    expect(due[0].daysUntil).toBe(-5);
  });

  it('ข้ามบิลที่ปิดใช้งานและจ่ายแล้ว', () => {
    const bills = [
      rb({ merchant: 'ปิด', enabled: false }),
      rb({ merchant: 'จ่ายแล้ว', dayOfMonth: 15 }),
    ];
    const paidTx = createTransaction({
      type: 'expense',
      amountSatang: 80_000,
      date: '2026-08-15',
      recurringBillId: bills[1].id,
    });
    const due = dueSoonBills({
      recurringBills: bills,
      transactions: [paidTx],
      todayStr: today,
      leadDays: 0,
    });
    expect(due).toHaveLength(0);
  });

  it('leadDays = 0 เจอเฉพาะวันครบกำหนด', () => {
    const bills = [rb(), rb({ merchant: 'AIS', dayOfMonth: 20 })];
    const due = dueSoonBills({ recurringBills: bills, transactions: [], todayStr: today, leadDays: 0 });
    expect(due).toHaveLength(1);
    expect(due[0].recurringBill.merchant).toBe('การไฟฟ้านครหลวง');
  });

  it('มี periodKey ต่อรอบ (กันแจ้งซ้ำ)', () => {
    const due = dueSoonBills({ recurringBills: [rb()], transactions: [], todayStr: today, leadDays: 2 });
    expect(due[0].periodKey).toBe('2026-08');
    expect(due[0].expectedDate).toBe('2026-08-15');
  });
});
