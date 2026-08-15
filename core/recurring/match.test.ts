import { describe, expect, it } from 'vitest';
import {
  amountSimilarity,
  levenshtein,
  merchantSimilarity,
  normalizeMerchantName,
  suggestRecurringLink,
} from './match';
import { createRecurringBill, type NewRecurringBillInput } from '../entities/recurringBill';

function rb(overrides: Partial<NewRecurringBillInput> & { id?: string } = {}) {
  return createRecurringBill(
    {
      merchant: 'การไฟฟ้านครหลวง',
      amountSatang: 80_000,
      categoryId: 'bills',
      cadence: 'monthly',
      dayOfMonth: 15,
      ...overrides,
    },
    undefined,
    overrides.id,
  );
}

describe('normalizeMerchantName', () => {
  it('ตัด stopword และเครื่องหมายออก', () => {
    expect(normalizeMerchantName('บริษัท การไฟฟ้านครหลวง จำกัด (มหาชน)')).toBe('การไฟฟ้านครหลวง มหาชน');
    expect(normalizeMerchantName('ร้าน 7-Eleven')).toBe('7 eleven');
  });

  it('รวมช่องว่างซ้ำและตัวพิมพ์เล็ก', () => {
    expect(normalizeMerchantName('  TRUE   MOVE  ')).toBe('true move');
  });
});

describe('levenshtein', () => {
  it('คำนวณระยะแก้', () => {
    expect(levenshtein('', '')).toBe(0);
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('การไฟฟ้านครหลวง', 'การไฟฟานครหลวง')).toBe(1);
  });
});

describe('merchantSimilarity', () => {
  it('ชื่อเดียวกัน = 1 แม้ต่าง stopword/การันต์', () => {
    expect(merchantSimilarity('การไฟฟ้านครหลวง', 'การไฟฟ้านครหลวง')).toBe(1);
    expect(merchantSimilarity('ร้านกาแฟ อเมซอน', 'กาแฟ อเมซอน')).toBe(1);
    expect(merchantSimilarity('การไฟฟ้านครหลวง', 'การไฟฟานครหลวง')).toBeGreaterThan(0.7);
  });

  it('ชื่อต่างกันสิ้นเชิงได้คะแนนต่ำ (ต่ำกว่าเกณฑ์ match)', () => {
    expect(merchantSimilarity('ร้านกาแฟ', 'การไฟฟ้านครหลวง')).toBeLessThan(0.5);
  });
});

describe('amountSimilarity', () => {
  it('ยอดเท่ากัน = 1', () => {
    expect(amountSimilarity(80_000, 80_000)).toBe(1);
  });

  it('ใกล้เคียงได้คะแนนลดหลั่น', () => {
    expect(amountSimilarity(80_000, 80_500)).toBeGreaterThan(0.9); // ~0.6%
    expect(amountSimilarity(80_000, 83_000)).toBeGreaterThan(0.5); // ~3.6%
    expect(amountSimilarity(80_000, 90_000)).toBe(0.35); // ~11% — เกิน 5% แต่ยังใน 15%
  });
});

describe('suggestRecurringLink', () => {
  it('คืน match เมื่อร้านตรง + ยอดใกล้เคียง', () => {
    const rb1 = rb();
    const match = suggestRecurringLink({
      merchant: 'การไฟฟ้านครหลวง',
      amountSatang: 80_500,
      recurringBills: [rb1],
    });
    expect(match).not.toBeNull();
    expect(match?.recurringBillId).toBe(rb1.id);
    expect(match?.reasons).toContain('ร้านตรงกัน');
    expect(match?.reasons).toContain('ยอดใกล้เคียง');
    expect(match!.score).toBeGreaterThan(0.7);
  });

  it('ไม่คืน match เมื่อร้านต่างกัน (แม้ยอดตรง)', () => {
    const match = suggestRecurringLink({
      merchant: 'ร้านกาแฟ อเมซอน',
      amountSatang: 80_000,
      recurringBills: [rb()],
    });
    expect(match).toBeNull();
  });

  it('ไม่คืน match เมื่อไม่มีข้อมูลพอ (ไม่มีชื่อร้านและยอด)', () => {
    expect(suggestRecurringLink({ merchant: null, amountSatang: null, recurringBills: [rb()] })).toBeNull();
  });

  it('ไม่ match บิลที่ปิดใช้งาน', () => {
    const disabled = rb({ enabled: false });
    expect(
      suggestRecurringLink({
        merchant: 'การไฟฟ้านครหลวง',
        amountSatang: 80_000,
        recurringBills: [disabled],
      }),
    ).toBeNull();
  });

  it('เลือกรายที่คะแนนสูงสุด', () => {
    const exact = rb();
    const far = rb({ merchant: 'การไฟฟ้านครหลวง', amountSatang: 50_000, id: 'other' });
    const match = suggestRecurringLink({
      merchant: 'การไฟฟ้านครหลวง',
      amountSatang: 80_000,
      recurringBills: [far, exact],
    });
    expect(match?.recurringBillId).toBe(exact.id);
  });
});
