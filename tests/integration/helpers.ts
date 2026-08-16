const DB_NAME = 'billsync';
const DB_VERSION = 2;
// mirror ของ adapters/storage/idb.ts — ถ้า schema เปลี่ยนต้องอัปเดตทั้งสองที่
const STORES = ['transactions', 'categories', 'accounts', 'bills', 'recurringBills'];

/**
 * ล้างข้อมูลทุก store — เรียกใน beforeEach เพื่อให้แต่ละ test เริ่มจาก DB ว่าง
 * ต้องสร้าง schema เองด้วย (onupgradeneeded) เพราะถ้าเปิดครั้งแรกตอน DB ยังไม่มี
 * โดยไม่มี upgrade handler → จะได้ DB ว่างที่ version 2 และ idb.ts เปิดทีหลัง
 * version เท่าเดิมก็ไม่ trigger upgrade → ไม่มี store เลย
 */
export async function clearIndexedDb(): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      for (const storeName of STORES) {
        if (!d.objectStoreNames.contains(storeName)) {
          d.createObjectStore(storeName, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('open failed'));
  });
  for (const storeName of STORES) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error(`clear ${storeName} failed`));
    });
  }
  db.close();
}
