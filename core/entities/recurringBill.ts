import { newId, nowIso } from './base';

export type RecurringCadence = 'monthly' | 'weekly' | 'yearly';

export interface RecurringBill {
  id: string;
  /** ชื่อผู้รับเงิน เช่น 'การไฟฟ้านครหลวง' */
  merchant: string;
  /** ยอดในหน่วยสตางค์ */
  amount: number;
  categoryId: string;
  cadence: RecurringCadence;
  /**
   * monthly: วันที่ของเดือน 1-31 (clamp ตามเดือน)
   * weekly: วันในสัปดาห์ 0-6 ตาม JS getDay() (0=อาทิตย์, 1=จันทร์ … 6=เสาร์)
   * yearly: วันที่ของเดือน 1-31
   */
  dayOfMonth: number;
  /** เฉพาะ yearly: เดือน 1-12 (null สำหรับ monthly/weekly) */
  month: number | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface NewRecurringBillInput {
  merchant: string;
  amountSatang: number;
  categoryId: string;
  cadence: RecurringCadence;
  dayOfMonth: number;
  month?: number | null;
  enabled?: boolean;
}

export function createRecurringBill(
  input: NewRecurringBillInput,
  now: string = nowIso(),
  id: string = newId(),
): RecurringBill {
  return {
    id,
    merchant: input.merchant.trim(),
    amount: input.amountSatang,
    categoryId: input.categoryId,
    cadence: input.cadence,
    dayOfMonth: input.dayOfMonth,
    month: input.cadence === 'yearly' ? (input.month ?? 1) : null,
    enabled: input.enabled ?? true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
