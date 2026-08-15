import { describe, expect, it } from 'vitest';
import { validateTransactionInput } from './transaction';

const valid = {
  type: 'expense',
  amountBaht: '250.50',
  categoryId: 'food',
  date: '2026-08-15',
  merchant: 'ร้านกาแฟ',
  note: '',
};

describe('validateTransactionInput', () => {
  it('input ที่ถูกต้องผ่าน validation และแปลงยอดเป็นสตางค์', () => {
    const r = validateTransactionInput(valid);
    expect(r.ok).toBe(true);
    expect(r.amountSatang).toBe(25050);
  });

  it('ยอดว่าง → error', () => {
    const r = validateTransactionInput({ ...valid, amountBaht: '' });
    expect(r.ok).toBe(false);
    expect(r.errors.amount).toBeDefined();
  });

  it('ยอด 0 หรือติดลบ → error', () => {
    expect(validateTransactionInput({ ...valid, amountBaht: '0' }).ok).toBe(false);
    expect(validateTransactionInput({ ...valid, amountBaht: '-5' }).ok).toBe(false);
  });

  it('ยอดที่ไม่ใช่ตัวเลข → error', () => {
    const r = validateTransactionInput({ ...valid, amountBaht: 'abc' });
    expect(r.ok).toBe(false);
    expect(r.errors.amount).toBeDefined();
  });

  it('วันที่ผิดรูปแบบ → error', () => {
    expect(validateTransactionInput({ ...valid, date: '15/08/2026' }).ok).toBe(false);
    expect(validateTransactionInput({ ...valid, date: '2026-13-99' }).ok).toBe(false);
  });

  it('ไม่เลือกหมวด → error', () => {
    const r = validateTransactionInput({ ...valid, categoryId: null });
    expect(r.ok).toBe(false);
    expect(r.errors.categoryId).toBeDefined();
  });

  it('type ที่ไม่รู้จัก → error', () => {
    const r = validateTransactionInput({ ...valid, type: 'transfer' });
    expect(r.ok).toBe(false);
    expect(r.errors.type).toBeDefined();
  });
});
