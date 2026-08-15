export type AccountType = 'cash' | 'bank' | 'ewallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** ยอดเปิดบัญชีในหน่วยสตางค์ */
  openingBalance: number;
  createdAt: string;
}
