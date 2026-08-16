import { test, expect } from '@playwright/test';

test('สร้างบิลประจำ → แบนเนอร์เตือนปรากฏบนหน้ารายการ', async ({ page }) => {
  await page.goto('recurring'); // relative ต่อ baseURL (ไม่มี / นำหน้า — ไม่งั้นไป root)
  await page.getByRole('button', { name: /เพิ่มบิลประจำ/ }).click();

  await page.getByPlaceholder('เช่น การไฟฟ้านครหลวง').fill('บิลอินเทอร์เน็ต');
  await page.getByPlaceholder('0.00').fill('599');
  await page.getByText('บิลรายเดือน', { exact: true }).click();
  // cadence = รายเดือน (default), dayOfMonth = 1 (default) → ครบกำหนดวันที่ 1 ของเดือนนี้
  await page.getByRole('button', { name: /บันทึกบิลประจำ/ }).click();

  await expect(page.getByText('บิลอินเทอร์เน็ต')).toBeVisible();

  // ไปหน้ารายการ → เห็นแบนเนอร์ "บิลใกล้ครบกำหนด" (due/เลยกำหนดของเดือนนี้)
  await page.goto('');
  await expect(page.getByText('บิลใกล้ครบกำหนด')).toBeVisible();
  await expect(page.getByText('บิลอินเทอร์เน็ต')).toBeVisible();
});
