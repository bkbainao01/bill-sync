import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';

export type LlmProviderId = 'openai' | 'gemini';

interface ScannerSettingsState {
  provider: LlmProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  /** opt-in ก่อนส่งรูปขึ้นคลาวด์ (privacy-first) */
  allowCloud: boolean;
  set: (patch: Partial<Omit<ScannerSettingsState, 'set'>>) => void;
}

export const useScannerSettings = create<ScannerSettingsState>()(
  persist(
    (set) => ({
      provider: 'openai',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      allowCloud: false,
      set: (patch) => set(patch),
    }),
    {
      name: 'billsync-scanner',
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
