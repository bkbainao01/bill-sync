import { test, expect } from '@playwright/test';

/** เพิ่มรายจ่าย 250 บาท หมวดอาหาร (เดือนปัจจุบัน) ผ่านฟอร์ม — ข้อมูลพื้นฐานของ 2 เคสด้านล่าง */
async function addExpense(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(''); // relative ต่อ baseURL (http://localhost:4173/bill-sync/)
  await expect(page.getByRole('heading', { name: 'รายการ' })).toBeVisible();
  await page.getByRole('button', { name: /เพิ่มรายการ/ }).click();
  await page.getByPlaceholder('0.00').fill('250');
  await page.getByText('อาหาร', { exact: true }).click();
  await page.getByPlaceholder('เช่น ร้านกาแฟ').fill('ร้านข้าวมันไก่');
  await page.getByPlaceholder('บันทึกเพิ่มเติม (ไม่บังคับ)').fill('กลางวัน');
  await page.getByRole('button', { name: /บันทึกรายการ/ }).click();
  await expect(page.getByText('ร้านข้าวมันไก่')).toBeVisible();
}

test('ธีมมืด/สว่าง — สลับทั้งแอป + จำค่าไว้ข้าม reload', async ({ page }) => {
  await page.goto('settings');
  await expect(page.getByRole('heading', { name: 'ตั้งค่า' })).toBeVisible();

  // gluestack บน web: body ได้ data-theme-id, html ได้ class gs-light / gs-dark
  await expect(page.locator('body')).toHaveAttribute('data-theme-id', 'light');
  await expect(page.locator('html')).toHaveClass(/gs-light/);

  // สลับเป็นมืด (switch ตัวแรก = ธีมมืด)
  await page.getByRole('switch').first().click();
  await expect(page.locator('body')).toHaveAttribute('data-theme-id', 'dark');
  await expect(page.locator('html')).toHaveClass(/gs-dark/);

  // reload → ยังมืดอยู่ (persist ใน localStorage billsync-theme)
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme-id', 'dark');

  // สลับกลับเป็นสว่าง
  await page.getByRole('switch').first().click();
  await expect(page.locator('body')).toHaveAttribute('data-theme-id', 'light');
});

test('ส่งออก CSV — ดาวน์โหลดไฟล์ที่มี header + แถวรายการ', async ({ page }) => {
  await addExpense(page);

  await page.goto('settings');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /ส่งออก CSV/ }).click();
  const download = await downloadPromise;

  // ชื่อไฟล์ billsync-YYYY-MM-DD.csv
  expect(download.suggestedFilename()).toMatch(/^billsync-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(await download.failure()).toBeNull();

  // เนื้อหา: BOM + header ไทย + แถวรายการที่เพิ่งเพิ่ม
  const stream = await download.createReadStream();
  let content = '';
  for await (const chunk of stream) content += chunk.toString('utf8');
  expect(content).toContain('วันที่,ประเภท,หมวด,ร้านค้า,หมายเหตุ,ยอด (บาท)');
  expect(content).toContain('รายจ่าย,อาหาร,ร้านข้าวมันไก่,กลางวัน');
  expect(content).toContain('250.00');
});

test('หน้าสรุป — กราฟ render จริง (เส้นแนวโน้ม + โดนัท) ตามข้อมูล', async ({ page }) => {
  await addExpense(page);

  await page.goto('dashboard');
  await expect(page.getByRole('heading', { name: 'สรุป' })).toBeVisible();
  await expect(page.getByText('แนวโน้มรายจ่าย 6 เดือน')).toBeVisible();
  await expect(page.getByText('รายจ่ายแยกตามหมวด')).toBeVisible();

  // react-native-svg บน web → <svg> จริง: เส้นแนวโน้ม + โดนัท = 2 ตัว
  await expect(page.locator('svg')).toHaveCount(2);

  // โดนัท: ยอดรวมตรงกลาง + ตำนานหมวดอาหาร 100% (first() — ยอด 250.00 ชนกับ SummaryCards)
  await expect(page.getByText('250.00 บาท', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('อาหาร', { exact: true })).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
});
