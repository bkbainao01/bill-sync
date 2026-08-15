import type { TransactionType } from './transaction';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  /** ชื่อไอคอน Ionicons */
  icon: string;
  /** hex color */
  color: string;
  isDefault: boolean;
  createdAt: string;
}
