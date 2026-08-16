import { test, expect } from '@playwright/test';

test('เพิ่มรายจ่ายผ่านฟอร์ม → เห็นในรายการ', async ({ page }) => {
  await page.goto(''); // baseURL http://localhost:4173/bill-sync/ — ต้อง relative (ไม่มี / นำหน้า)
  await expect(page.getByRole('heading', { name: 'รายการ' })).toBeVisible();

  // role-based — getByText('เพิ่มรายการ') ชนกับ hint text "กดปุ่ม + เพิ่มรายการ ..."
  await page.getByRole('button', { name: /เพิ่มรายการ/ }).click();

  await page.getByPlaceholder('0.00').fill('250');
  await page.getByText('อาหาร', { exact: true }).click();
  await page.getByPlaceholder('เช่น ร้านกาแฟ').fill('ร้านข้าวมันไก่');
  await page.getByPlaceholder('บันทึกเพิ่มเติม (ไม่บังคับ)').fill('กลางวัน');
  await page.getByRole('button', { name: /บันทึกรายการ/ }).click();

  // กลับมาที่หน้ารายการ → เห็นรายการใหม่
  await expect(page.getByText('ร้านข้าวมันไก่')).toBeVisible();
  await expect(page.getByText('250.00 บาท')).toBeVisible();
});
