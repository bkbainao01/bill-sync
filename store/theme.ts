import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';

export type ColorMode = 'light' | 'dark';

interface ThemeState {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      colorMode: 'light',
      setColorMode: (colorMode) => set({ colorMode }),
      toggleColorMode: () =>
        set((s) => ({ colorMode: s.colorMode === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'billsync-theme',
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
