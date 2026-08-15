/**
 * Minimal promise wrapper รอบ IndexedDB
 * ใช้สำหรับ web adapter เท่านั้น (native ใช้ expo-sqlite ใน Phase 3)
 */

const DB_NAME = 'billsync';
const DB_VERSION = 2;

export interface StoreSpec {
  name: string;
  index?: { name: string; keyPath: string };
}

const STORES: StoreSpec[] = [
  { name: 'transactions', index: { name: 'by-date', keyPath: 'date' } },
  { name: 'categories' },
  { name: 'accounts' },
  { name: 'bills' },
  { name: 'recurringBills' },
];

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const spec of STORES) {
        if (!db.objectStoreNames.contains(spec.name)) {
          const store = db.createObjectStore(spec.name, { keyPath: 'id' });
          if (spec.index) {
            store.createIndex(spec.index.name, spec.index.keyPath);
          }
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });

  return dbPromise;
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await open();
  return new Promise<T[]>((resolve, reject) => {
    const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await open();
  return new Promise<T | undefined>((resolve, reject) => {
    const req = db.transaction(storeName, 'readonly').objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut(storeName: string, value: unknown): Promise<void> {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbDelete(storeName: string, id: string): Promise<void> {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
