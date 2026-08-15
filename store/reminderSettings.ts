import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';

interface ReminderSettingsState {
  /** เปิดการแจ้งเตือนบิลใกล้ครบกำหนด */
  enabled: boolean;
  /** แจ้งเตือนล่วงหน้ากี่วัน (0 = เฉพาะวันครบกำหนด) */
  leadDays: number;
  /** คีย์ `${billId}:${periodKey}` ที่แจ้งเตือนไปแล้ว — กันแจ้งซ้ำต่อรอบ */
  notifiedKeys: string[];
  markNotified: (key: string) => void;
  setEnabled: (enabled: boolean) => void;
  setLeadDays: (days: number) => void;
  resetNotified: () => void;
}

const MAX_NOTIFIED_KEYS = 200;

export const useReminderSettings = create<ReminderSettingsState>()(
  persist(
    (set) => ({
      enabled: false,
      leadDays: 2,
      notifiedKeys: [],
      markNotified: (key) =>
        set((s) =>
          s.notifiedKeys.includes(key)
            ? s
            : { notifiedKeys: [...s.notifiedKeys, key].slice(-MAX_NOTIFIED_KEYS) },
        ),
      setEnabled: (enabled) => set({ enabled }),
      setLeadDays: (leadDays) => set({ leadDays: Math.min(30, Math.max(0, Math.round(leadDays))) }),
      resetNotified: () => set({ notifiedKeys: [] }),
    }),
    {
      name: 'billsync-reminders',
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
