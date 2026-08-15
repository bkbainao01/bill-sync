import type { Category } from '../entities/category';
import type { TransactionType } from '../entities/transaction';

export interface SeedCategoryDef {
  key: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export const SEED_CATEGORIES: SeedCategoryDef[] = [
  { key: 'food', name: 'อาหาร', type: 'expense', icon: 'restaurant', color: '#ef4444' },
  { key: 'transport', name: 'เดินทาง', type: 'expense', icon: 'bus', color: '#3b82f6' },
  { key: 'shopping', name: 'ช้อปปิ้ง', type: 'expense', icon: 'bag-handle', color: '#a855f7' },
  { key: 'bills', name: 'บิลรายเดือน', type: 'expense', icon: 'document-text', color: '#f59e0b' },
  { key: 'health', name: 'สุขภาพ', type: 'expense', icon: 'medkit', color: '#10b981' },
  { key: 'entertainment', name: 'บันเทิง', type: 'expense', icon: 'film', color: '#ec4899' },
  { key: 'other-expense', name: 'อื่นๆ', type: 'expense', icon: 'ellipsis-horizontal', color: '#6b7280' },
  { key: 'salary', name: 'เงินเดือน', type: 'income', icon: 'cash', color: '#22c55e' },
  { key: 'extra-income', name: 'รายได้เสริม', type: 'income', icon: 'sparkles', color: '#14b8a6' },
  { key: 'other-income', name: 'อื่นๆ', type: 'income', icon: 'ellipsis-horizontal', color: '#6b7280' },
];

export function buildSeedCategories(): Category[] {
  return SEED_CATEGORIES.map((s) => ({
    id: s.key,
    name: s.name,
    type: s.type,
    icon: s.icon,
    color: s.color,
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  }));
}
