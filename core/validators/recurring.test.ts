import { describe, expect, it } from 'vitest';
import { validateRecurringInput } from './recurring';

const valid = {
  merchant: 'การไฟฟ้านครหลวง',
  amountBaht: '800.50',
  categoryId: 'bills',
  cadence: 'monthly',
  dayOfMonth: '15',
  month: '',
};

describe('validateRecurringInput', () => {
  it('input ที่ถูกต้องผ่าน', () => {
    const r = validateRecurringInput(valid);
    expect(r.ok).toBe(true);
    expect(r.amountSatang).toBe(80050);
    expect(r.dayOfMonth).toBe(15);
  });

  it('ต้องกรอกชื่อผู้รับเงิน', () => {
    const r = validateRecurringInput({ ...valid, merchant: '  ' });
    expect(r.ok).toBe(false);
    expect(r.errors.merchant).toBeDefined();
  });

  it('ยอด 0/ติดลบ/ไม่ใช่ตัวเลข → error', () => {
    expect(validateRecurringInput({ ...valid, amountBaht: '0' }).ok).toBe(false);
    expect(validateRecurringInput({ ...valid, amountBaht: '-1' }).ok).toBe(false);
    expect(validateRecurringInput({ ...valid, amountBaht: 'abc' }).ok).toBe(false);
  });

  it('dayOfMonth เกินช่วงของ cadence → error', () => {
    expect(validateRecurringInput({ ...valid, dayOfMonth: '32' }).ok).toBe(false);
    expect(validateRecurringInput({ ...valid, dayOfMonth: '0' }).ok).toBe(false);
    const weekly = validateRecurringInput({ ...valid, cadence: 'weekly', dayOfMonth: '7' });
    expect(weekly.ok).toBe(false);
    expect(validateRecurringInput({ ...valid, cadence: 'weekly', dayOfMonth: '6' }).ok).toBe(true);
  });

  it('yearly ต้องกรอกเดือน 1-12', () => {
    const yearly = { ...valid, cadence: 'yearly' as const, month: '13' };
    expect(validateRecurringInput(yearly).ok).toBe(false);
    expect(validateRecurringInput({ ...yearly, month: '8' }).ok).toBe(true);
  });

  it('ต้องเลือกหมวด', () => {
    const r = validateRecurringInput({ ...valid, categoryId: null });
    expect(r.ok).toBe(false);
    expect(r.errors.categoryId).toBeDefined();
  });
});
