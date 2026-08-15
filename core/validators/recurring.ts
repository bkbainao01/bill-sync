import type { RecurringCadence } from '../entities/recurringBill';
import { toSatang } from '../calculations/money';

export interface RecurringFormInput {
  merchant: string;
  amountBaht: string;
  categoryId: string | null;
  cadence: string;
  dayOfMonth: string;
  month: string;
}

export interface RecurringValidationResult {
  ok: boolean;
  errors: Partial<Record<'merchant' | 'amount' | 'categoryId' | 'cadence' | 'dayOfMonth' | 'month', string>>;
  dayOfMonth?: number;
  month?: number;
  amountSatang?: number;
}

export const CADENCE_RANGES: Record<RecurringCadence, { min: number; max: number; label: string }> = {
  monthly: { min: 1, max: 31, label: 'วันที่ของเดือน (1-31)' },
  weekly: { min: 0, max: 6, label: 'วันในสัปดาห์ (0=อาทิตย์ … 6=เสาร์)' },
  yearly: { min: 1, max: 31, label: 'วันที่ของเดือน (1-31)' },
};

export function validateRecurringInput(input: RecurringFormInput): RecurringValidationResult {
  const errors: RecurringValidationResult['errors'] = {};

  if (!input.merchant.trim()) {
    errors.merchant = 'กรุณากรอกชื่อผู้รับเงิน';
  } else if (input.merchant.trim().length > 100) {
    errors.merchant = 'ชื่อยาวเกินไป (สูงสุด 100 ตัวอักษร)';
  }

  const amount = Number(input.amountBaht);
  if (!input.amountBaht.trim()) {
    errors.amount = 'กรุณากรอกยอดเงิน';
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'ยอดเงินต้องมากกว่า 0';
  }

  if (input.categoryId === null) {
    errors.categoryId = 'กรุณาเลือกหมวดหมู่';
  }

  if (input.cadence !== 'monthly' && input.cadence !== 'weekly' && input.cadence !== 'yearly') {
    errors.cadence = 'กรุณาเลือกรอบบิล';
  }

  const cadence = input.cadence as RecurringCadence;
  const range = CADENCE_RANGES[cadence];
  const day = Number(input.dayOfMonth);
  if (!input.dayOfMonth.trim() || !Number.isInteger(day) || day < range.min || day > range.max) {
    errors.dayOfMonth = range.label;
  }

  if (cadence === 'yearly') {
    const month = Number(input.month);
    if (!input.month.trim() || !Number.isInteger(month) || month < 1 || month > 12) {
      errors.month = 'เดือนต้องอยู่ระหว่าง 1-12';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    amountSatang: toSatang(amount),
    dayOfMonth: Number(input.dayOfMonth),
    month: cadence === 'yearly' ? Number(input.month) : undefined,
  };
}
