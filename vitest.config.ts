import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@': root },
  },
  test: {
    environment: 'node',
    include: ['core/**/*.test.ts', 'tests/**/*.test.ts'],
    setupFiles: ['tests/integration/setup.ts'],
  },
});
