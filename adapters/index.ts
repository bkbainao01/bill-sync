import type { Repositories } from '@/core/repositories/interfaces';
import { createSqliteRepositories } from './repositories/sqlite';

/**
 * native (iOS/Android) — expo-sqlite
 * (web ใช้ adapters/index.web.ts → IndexedDB)
 */
export function createRepositories(): Repositories {
  return createSqliteRepositories();
}
