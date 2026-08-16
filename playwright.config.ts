import { defineConfig, devices } from '@playwright/test';

/**
 * E2E (ยอดพีระมิด) — รันกับ static export (dist/) ที่เสิร์ฟใต้ /bill-sync
 * เหมือน GitHub Pages จริง เพื่อให้ผล deterministic (ไม่ต้องรอ Metro bundle)
 *
 * เตรียม: npm run build:web   (expo export -p web → dist/)
 * รัน:   npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  // แอปใช้ IndexedDB ต่อ browser context — รันทีละ 1 เพื่อความชัดเจน
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173/bill-sync/',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'node scripts/serve-static.mjs dist 4173 --prefix /bill-sync',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
