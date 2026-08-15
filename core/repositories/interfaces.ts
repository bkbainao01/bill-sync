import type { Bill } from '../entities/bill';
import type { Category } from '../entities/category';
import type { Account } from '../entities/account';
import type { Transaction } from '../entities/transaction';
import type { RecurringBill } from '../entities/recurringBill';

export interface TransactionRepository {
  /** รายการทั้งหมดที่ยังไม่ถูกลบ เรียงวันที่ล่าสุดก่อน */
  list(): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(tx: Transaction): Promise<void>;
  update(tx: Transaction): Promise<void>;
  softDelete(id: string): Promise<void>;
}

export interface CategoryRepository {
  /** คืนค่าหมวดทั้งหมด — seed ค่าเริ่มต้นให้อัตโนมัติถ้ายังว่าง */
  list(): Promise<Category[]>;
  seedDefaults(): Promise<void>;
}

export interface AccountRepository {
  list(): Promise<Account[]>;
}

export interface BillRepository {
  list(): Promise<Bill[]>;
  getById(id: string): Promise<Bill | null>;
  create(bill: Bill): Promise<void>;
  update(bill: Bill): Promise<void>;
}

export interface RecurringBillRepository {
  list(): Promise<RecurringBill[]>;
  getById(id: string): Promise<RecurringBill | null>;
  create(rb: RecurringBill): Promise<void>;
  update(rb: RecurringBill): Promise<void>;
  softDelete(id: string): Promise<void>;
}

export interface Repositories {
  transactions: TransactionRepository;
  categories: CategoryRepository;
  accounts: AccountRepository;
  bills: BillRepository;
  recurringBills: RecurringBillRepository;
}
