import type { Bill, BillStatus } from '../entities/bill';
import { nowIso } from '../entities/base';

export type BillAction = 'startReview' | 'confirm' | 'reject';

/**
 * State machine ของ Bill:
 *   scanned ──startReview──► reviewing ──confirm──► confirmed
 *      │                        │
 *      └────reject──────────────┴────reject──► rejected
 */
const TRANSITIONS: Record<BillStatus, Partial<Record<BillAction, BillStatus>>> = {
  scanned: { startReview: 'reviewing', reject: 'rejected' },
  reviewing: { confirm: 'confirmed', reject: 'rejected' },
  confirmed: {},
  rejected: {},
};

export function canTransition(status: BillStatus, action: BillAction): boolean {
  return Boolean(TRANSITIONS[status]?.[action]);
}

export function nextStatus(status: BillStatus, action: BillAction): BillStatus {
  const next = TRANSITIONS[status]?.[action];
  if (!next) {
    throw new Error(`Invalid bill transition: ${status} → ${action}`);
  }
  return next;
}

export function transitionBill(bill: Bill, action: BillAction, now: string = nowIso()): Bill {
  return { ...bill, status: nextStatus(bill.status, action), updatedAt: now };
}
