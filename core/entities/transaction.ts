import { newId, nowIso } from './base';

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'confirmed' | 'reviewing' | 'rejected';

export interface Transaction {
  id: string;
  type: TransactionType;
  /** ยอดเงินในหน่วยสตางค์ (int) — หลีกเลี่ยง floating point error */
  amount: number;
  categoryId: string | null;
  accountId: string | null;
  /** วันที่ในรูปแบบ YYYY-MM-DD */
  date: string;
  merchant: string | null;
  note: string | null;
  /** link กลับไปหา Bill ถ้ามาจากการสแกน */
  billId: string | null;
  /** link ไปหา RecurringBill ถ้าสร้างจากบิลประจำ */
  recurringBillId: string | null;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface NewTransactionInput {
  type: TransactionType;
  /** ยอดในหน่วยสตางค์ */
  amountSatang: number;
  categoryId?: string | null;
  date: string;
  merchant?: string | null;
  note?: string | null;
  recurringBillId?: string | null;
}

export function createTransaction(
  input: NewTransactionInput,
  now: string = nowIso(),
  id: string = newId(),
): Transaction {
  return {
    id,
    type: input.type,
    amount: input.amountSatang,
    categoryId: input.categoryId ?? null,
    accountId: null,
    date: input.date,
    merchant: input.merchant?.trim() || null,
    note: input.note?.trim() || null,
    billId: null,
    recurringBillId: input.recurringBillId ?? null,
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
