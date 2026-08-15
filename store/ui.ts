import { create } from 'zustand';
import { currentMonthKey } from '@/core/calculations/format';

interface UiState {
  /** เดือนที่เลือก รูปแบบ YYYY-MM — ใช้ร่วมกันระหว่างหน้ารายการกับหน้าสรุป */
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  selectedMonth: currentMonthKey(),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
}));
