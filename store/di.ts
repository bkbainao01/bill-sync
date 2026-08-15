import { createRepositories } from '@/adapters';
import type { Repositories } from '@/core/repositories/interfaces';

/** ตัวเดียวทั้งแอป — UI เรียกผ่าน hooks (TanStack Query) เท่านั้น */
export const repositories: Repositories = createRepositories();
