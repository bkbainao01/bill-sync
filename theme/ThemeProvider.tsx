import type { ReactNode } from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { useThemeStore } from '@/store/theme';

/**
 * ครอบทั้งแอปด้วย gluestack provider
 * colorMode (light/dark) มากจาก Zustand store → สลับ theme ทั้งแอปได้ทันที
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorMode = useThemeStore((s) => s.colorMode);
  return (
    <GluestackUIProvider config={config} colorMode={colorMode}>
      {children}
    </GluestackUIProvider>
  );
}
