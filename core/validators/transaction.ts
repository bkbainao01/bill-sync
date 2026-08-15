import type { TransactionType } from '../entities/transaction';
import { toSatang } from '../calculations/money';

export interface TransactionFormInput {
  type: string;
  /** ข้อความยอดเงินจากฟอร์ม (บาท) */
  amountBaht: string;
  categoryId: string | null;
  date: string;
  merchant?: string;
  note?: string;
}

export interface TransactionValidationResult {
  ok: boolean;
  errors: Partial<Record<'type' | 'amount' | 'categoryId' | 'date' | 'merchant' | 'note', string>>;
  /** ยอดที่แปลงเป็นสตางค์แล้ว (ถ้าผ่าน validation) */
  amountSatang?: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateTransactionInput(input: TransactionFormInput): TransactionValidationResult {
  const errors: TransactionValidationResult['errors'] = {};

  if (input.type !== 'income' && input.type !== 'expense') {
    errors.type = 'กรุณาเลือกประเภทรายการ';
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

  if (!DATE_RE.test(input.date) || Number.isNaN(new Date(input.date).getTime())) {
    errors.date = 'วันที่ไม่ถูกต้อง (รูปแบบ YYYY-MM-DD)';
  }

  const merchant = input.merchant?.trim() ?? '';
  if (merchant.length > 100) {
    errors.merchant = 'ชื่อร้านยาวเกินไป (สูงสุด 100 ตัวอักษร)';
  }

  const note = input.note?.trim() ?? '';
  if (note.length > 500) {
    errors.note = 'หมายเหตุยาวเกินไป (สูงสุด 500 ตัวอักษร)';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    amountSatang: toSatang(amount),
  };
}
