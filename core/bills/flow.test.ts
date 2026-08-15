import { describe, expect, it } from 'vitest';
import { canTransition, nextStatus, transitionBill } from './flow';
import type { Bill } from '../entities/bill';

function makeBill(status: Bill['status']): Bill {
  return {
    id: 'b1',
    imageUri: null,
    rawText: null,
    extracted: {},
    status,
    transactionId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
  };
}

describe('bill state machine', () => {
  it('scanned → startReview → reviewing → confirm → confirmed', () => {
    expect(canTransition('scanned', 'startReview')).toBe(true);
    expect(nextStatus('scanned', 'startReview')).toBe('reviewing');
    expect(nextStatus('reviewing', 'confirm')).toBe('confirmed');
  });

  it('scanned/reviewing → reject → rejected', () => {
    expect(nextStatus('scanned', 'reject')).toBe('rejected');
    expect(nextStatus('reviewing', 'reject')).toBe('rejected');
  });

  it('confirmed/rejected ไม่มี transition ออก (สถานะจบ)', () => {
    expect(canTransition('confirmed', 'confirm')).toBe(false);
    expect(canTransition('confirmed', 'reject')).toBe(false);
    expect(canTransition('rejected', 'startReview')).toBe(false);
    expect(() => nextStatus('confirmed', 'reject')).toThrow();
  });

  it('transitionBill คืน bill ใหม่พร้อม status ที่เปลี่ยน + updatedAt ใหม่', () => {
    const bill = makeBill('scanned');
    const next = transitionBill(bill, 'startReview', '2026-08-15T00:00:00.000Z');
    expect(next.status).toBe('reviewing');
    expect(next.updatedAt).toBe('2026-08-15T00:00:00.000Z');
    expect(bill.status).toBe('scanned'); // ไม่ mutate ต้นฉบับ
  });
});
