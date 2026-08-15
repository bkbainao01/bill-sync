import type { Bill } from '@/core/entities/bill';
import type { Category } from '@/core/entities/category';
import type { Account } from '@/core/entities/account';
import type { Transaction } from '@/core/entities/transaction';
import type { RecurringBill } from '@/core/entities/recurringBill';
import type {
  AccountRepository,
  BillRepository,
  CategoryRepository,
  RecurringBillRepository,
  Repositories,
  TransactionRepository,
} from '@/core/repositories/interfaces';
import { buildSeedCategories } from '@/core/constants/seed';
import { nowIso } from '@/core/entities/base';
import { getDb } from '../storage/sqlite';

interface Row {
  [key: string]: unknown;
}

function toTransaction(row: Row): Transaction {
  return {
    id: String(row.id),
    type: row.type as Transaction['type'],
    amount: Number(row.amount),
    categoryId: row.categoryId == null ? null : String(row.categoryId),
    accountId: row.accountId == null ? null : String(row.accountId),
    date: String(row.date),
    merchant: row.merchant == null ? null : String(row.merchant),
    note: row.note == null ? null : String(row.note),
    billId: row.billId == null ? null : String(row.billId),
    recurringBillId: row.recurringBillId == null ? null : String(row.recurringBillId),
    status: row.status as Transaction['status'],
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    deletedAt: row.deletedAt == null ? null : String(row.deletedAt),
  };
}

function toBill(row: Row): Bill {
  let extracted: Bill['extracted'] = {};
  try {
    extracted = JSON.parse(String(row.extracted)) as Bill['extracted'];
  } catch {
    extracted = {};
  }
  return {
    id: String(row.id),
    imageUri: row.imageUri == null ? null : String(row.imageUri),
    rawText: row.rawText == null ? null : String(row.rawText),
    extracted,
    status: row.status as Bill['status'],
    transactionId: row.transactionId == null ? null : String(row.transactionId),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    deletedAt: row.deletedAt == null ? null : String(row.deletedAt),
  };
}

function toRecurringBill(row: Row): RecurringBill {
  return {
    id: String(row.id),
    merchant: String(row.merchant),
    amount: Number(row.amount),
    categoryId: String(row.categoryId),
    cadence: row.cadence as RecurringBill['cadence'],
    dayOfMonth: Number(row.dayOfMonth),
    month: row.month == null ? null : Number(row.month),
    enabled: Number(row.enabled) === 1,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    deletedAt: row.deletedAt == null ? null : String(row.deletedAt),
  };
}

function createTransactionRepository(): TransactionRepository {
  return {
    async list() {
      const db = await getDb();
      const rows = await db.getAllAsync<Row>(
        'SELECT * FROM transactions WHERE deletedAt IS NULL ORDER BY date DESC, createdAt DESC',
      );
      return rows.map(toTransaction);
    },
    async getById(id) {
      const db = await getDb();
      const row = await db.getFirstAsync<Row>('SELECT * FROM transactions WHERE id = ?', id);
      return row ? toTransaction(row) : null;
    },
    async create(tx) {
      const db = await getDb();
      await db.runAsync(
        `INSERT INTO transactions (id, type, amount, categoryId, accountId, date, merchant, note, billId, recurringBillId, status, createdAt, updatedAt, deletedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tx.id, tx.type, tx.amount, tx.categoryId, tx.accountId, tx.date, tx.merchant, tx.note,
        tx.billId, tx.recurringBillId, tx.status, tx.createdAt, tx.updatedAt, tx.deletedAt,
      );
    },
    async update(tx) {
      const db = await getDb();
      await db.runAsync(
        `UPDATE transactions SET type = ?, amount = ?, categoryId = ?, accountId = ?, date = ?, merchant = ?, note = ?, billId = ?, recurringBillId = ?, status = ?, updatedAt = ?
         WHERE id = ?`,
        tx.type, tx.amount, tx.categoryId, tx.accountId, tx.date, tx.merchant, tx.note,
        tx.billId, tx.recurringBillId, tx.status, nowIso(), tx.id,
      );
    },
    async softDelete(id) {
      const db = await getDb();
      await db.runAsync('UPDATE transactions SET deletedAt = ?, updatedAt = ? WHERE id = ?', nowIso(), nowIso(), id);
    },
  };
}

function createCategoryRepository(): CategoryRepository {
  return {
    async seedDefaults() {
      const db = await getDb();
      const row = await db.getFirstAsync<Row>('SELECT COUNT(*) AS n FROM categories');
      if (Number(row?.n ?? 0) > 0) return;
      for (const c of buildSeedCategories()) {
        await db.runAsync(
          'INSERT INTO categories (id, name, type, icon, color, isDefault, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)',
          c.id, c.name, c.type, c.icon, c.color, c.createdAt,
        );
      }
    },
    async list() {
      const db = await getDb();
      await this.seedDefaults();
      const rows = await db.getAllAsync<Row>('SELECT * FROM categories ORDER BY type, name');
      return rows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        type: r.type as Category['type'],
        icon: String(r.icon),
        color: String(r.color),
        isDefault: Number(r.isDefault) === 1,
        createdAt: String(r.createdAt),
      }));
    },
  };
}

function createAccountRepository(): AccountRepository {
  return {
    async list() {
      const db = await getDb();
      const rows = await db.getAllAsync<Row>('SELECT * FROM accounts');
      return rows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        type: r.type as Account['type'],
        openingBalance: Number(r.openingBalance),
        createdAt: String(r.createdAt),
      }));
    },
  };
}

function createBillRepository(): BillRepository {
  return {
    async list() {
      const db = await getDb();
      const rows = await db.getAllAsync<Row>(
        'SELECT * FROM bills WHERE deletedAt IS NULL ORDER BY createdAt DESC',
      );
      return rows.map(toBill);
    },
    async getById(id) {
      const db = await getDb();
      const row = await db.getFirstAsync<Row>('SELECT * FROM bills WHERE id = ?', id);
      return row ? toBill(row) : null;
    },
    async create(bill) {
      const db = await getDb();
      await db.runAsync(
        `INSERT INTO bills (id, imageUri, rawText, extracted, status, transactionId, createdAt, updatedAt, deletedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        bill.id, bill.imageUri, bill.rawText, JSON.stringify(bill.extracted), bill.status,
        bill.transactionId, bill.createdAt, bill.updatedAt, bill.deletedAt,
      );
    },
    async update(bill) {
      const db = await getDb();
      await db.runAsync(
        `UPDATE bills SET imageUri = ?, rawText = ?, extracted = ?, status = ?, transactionId = ?, updatedAt = ?
         WHERE id = ?`,
        bill.imageUri, bill.rawText, JSON.stringify(bill.extracted), bill.status,
        bill.transactionId, nowIso(), bill.id,
      );
    },
  };
}

function createRecurringBillRepository(): RecurringBillRepository {
  return {
    async list() {
      const db = await getDb();
      const rows = await db.getAllAsync<Row>(
        'SELECT * FROM recurringBills WHERE deletedAt IS NULL ORDER BY createdAt DESC',
      );
      return rows.map(toRecurringBill);
    },
    async getById(id) {
      const db = await getDb();
      const row = await db.getFirstAsync<Row>('SELECT * FROM recurringBills WHERE id = ?', id);
      return row ? toRecurringBill(row) : null;
    },
    async create(rb) {
      const db = await getDb();
      await db.runAsync(
        `INSERT INTO recurringBills (id, merchant, amount, categoryId, cadence, dayOfMonth, month, enabled, createdAt, updatedAt, deletedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        rb.id, rb.merchant, rb.amount, rb.categoryId, rb.cadence, rb.dayOfMonth, rb.month,
        rb.enabled ? 1 : 0, rb.createdAt, rb.updatedAt, rb.deletedAt,
      );
    },
    async update(rb) {
      const db = await getDb();
      await db.runAsync(
        `UPDATE recurringBills SET merchant = ?, amount = ?, categoryId = ?, cadence = ?, dayOfMonth = ?, month = ?, enabled = ?, updatedAt = ?
         WHERE id = ?`,
        rb.merchant, rb.amount, rb.categoryId, rb.cadence, rb.dayOfMonth, rb.month,
        rb.enabled ? 1 : 0, nowIso(), rb.id,
      );
    },
    async softDelete(id) {
      const db = await getDb();
      await db.runAsync('UPDATE recurringBills SET deletedAt = ?, updatedAt = ? WHERE id = ?', nowIso(), nowIso(), id);
    },
  };
}

export function createSqliteRepositories(): Repositories {
  return {
    transactions: createTransactionRepository(),
    categories: createCategoryRepository(),
    accounts: createAccountRepository(),
    bills: createBillRepository(),
    recurringBills: createRecurringBillRepository(),
  };
}
