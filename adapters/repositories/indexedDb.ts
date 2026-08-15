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
import { idbDelete, idbGet, idbGetAll, idbPut } from '../storage/idb';

function compareDateDesc(a: Transaction, b: Transaction): number {
  if (a.date === b.date) return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
  return a.date < b.date ? 1 : -1;
}

function createTransactionRepository(): TransactionRepository {
  return {
    async list() {
      const all = await idbGetAll<Transaction>('transactions');
      return all.filter((t) => !t.deletedAt).sort(compareDateDesc);
    },
    async getById(id) {
      return (await idbGet<Transaction>('transactions', id)) ?? null;
    },
    async create(tx) {
      await idbPut('transactions', tx);
    },
    async update(tx) {
      await idbPut('transactions', { ...tx, updatedAt: nowIso() });
    },
    async softDelete(id) {
      const existing = await idbGet<Transaction>('transactions', id);
      if (!existing) return;
      await idbPut('transactions', { ...existing, deletedAt: nowIso(), updatedAt: nowIso() });
    },
  };
}

function createCategoryRepository(): CategoryRepository {
  return {
    async seedDefaults() {
      const existing = await idbGetAll<Category>('categories');
      if (existing.length > 0) return;
      for (const c of buildSeedCategories()) {
        await idbPut('categories', c);
      }
    },
    async list() {
      const all = await idbGetAll<Category>('categories');
      if (all.length === 0) {
        await this.seedDefaults();
        return idbGetAll<Category>('categories');
      }
      return all;
    },
  };
}

function createAccountRepository(): AccountRepository {
  return {
    async list() {
      return idbGetAll<Account>('accounts');
    },
  };
}

function createBillRepository(): BillRepository {
  return {
    async list() {
      const all = await idbGetAll<Bill>('bills');
      return all.filter((b) => !b.deletedAt);
    },
    async getById(id) {
      return (await idbGet<Bill>('bills', id)) ?? null;
    },
    async create(bill) {
      await idbPut('bills', bill);
    },
    async update(bill) {
      await idbPut('bills', { ...bill, updatedAt: nowIso() });
    },
  };
}

function createRecurringBillRepository(): RecurringBillRepository {
  return {
    async list() {
      const all = await idbGetAll<RecurringBill>('recurringBills');
      return all.filter((rb) => !rb.deletedAt);
    },
    async getById(id) {
      return (await idbGet<RecurringBill>('recurringBills', id)) ?? null;
    },
    async create(rb) {
      await idbPut('recurringBills', rb);
    },
    async update(rb) {
      await idbPut('recurringBills', { ...rb, updatedAt: nowIso() });
    },
    async softDelete(id) {
      const existing = await idbGet<RecurringBill>('recurringBills', id);
      if (!existing) return;
      await idbPut('recurringBills', { ...existing, deletedAt: nowIso(), updatedAt: nowIso() });
    },
  };
}

export function createIndexedDbRepositories(): Repositories {
  return {
    transactions: createTransactionRepository(),
    categories: createCategoryRepository(),
    accounts: createAccountRepository(),
    bills: createBillRepository(),
    recurringBills: createRecurringBillRepository(),
  };
}
