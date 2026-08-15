import * as SQLite from 'expo-sqlite';

/**
 * expo-sqlite — ใช้กับ native (iOS/Android)
 * web ใช้ IndexedDB (adapters/storage/idb.ts)
 */

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  categoryId TEXT,
  accountId TEXT,
  date TEXT NOT NULL,
  merchant TEXT,
  note TEXT,
  billId TEXT,
  recurringBillId TEXT,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  isDefault INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  openingBalance INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY NOT NULL,
  imageUri TEXT,
  rawText TEXT,
  extracted TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  transactionId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE TABLE IF NOT EXISTS recurringBills (
  id TEXT PRIMARY KEY NOT NULL,
  merchant TEXT NOT NULL,
  amount INTEGER NOT NULL,
  categoryId TEXT NOT NULL,
  cadence TEXT NOT NULL,
  dayOfMonth INTEGER NOT NULL,
  month INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);
`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('billsync.db');
    await db.execAsync(SCHEMA_SQL);
    return db;
  })();
  return dbPromise;
}
