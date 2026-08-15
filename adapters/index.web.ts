import type { Repositories } from '@/core/repositories/interfaces';
import { createIndexedDbRepositories } from './repositories/indexedDb';

/**
 * web build — Metro เลือกไฟล์ .web.ts นี้แทน index.ts
 * ทำให้ expo-sqlite (wa-sqlite.wasm) ไม่ถูก bundle เข้าเว็บ
 */
export function createRepositories(): Repositories {
  return createIndexedDbRepositories();
}
