import { Platform } from 'react-native';
import type { Repositories } from '@/core/repositories/interfaces';
import { createIndexedDbRepositories } from './repositories/indexedDb';

/**
 * เลือก storage adapter ตาม platform:
 * - web → IndexedDB (Phase 1)
 * - native → expo-sqlite (Phase 3, ยังไม่ implement)
 * Business logic ไม่รู้ว่าข้างหลังคืออะไร — รู้จักแค่ interface
 */
export function createRepositories(): Repositories {
  if (Platform.OS === 'web') {
    return createIndexedDbRepositories();
  }
  throw new Error('Native storage adapter ยังไม่พร้อม — อยู่ใน Phase 3');
}
