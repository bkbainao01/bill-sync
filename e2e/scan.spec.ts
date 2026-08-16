import { test, expect, type Page } from '@playwright/test';
import { corpus } from '../core/scanner/golden/corpus';
import { formatBaht } from '../core/calculations/format';

// ทุกเคสใน golden corpus — แต่ละเคส: อัปโหลดรูป → LLM mock (llmResponse ของเคสนั้น) → review ตรง expected → ยืนยัน → เห็นในรายการเดือนที่บิลออก
for (const c of corpus) {
  test(`สแกนบิล ${c.id} → review → ยืนยัน → เห็นในรายการ (${c.expected.merchant})`, async ({ page }) => {
    // ตั้งค่า scanner: เปิด allowCloud + key ปลอม (LLM ถูก mock ด้านล่าง)
    await page.addInitScript(() => {
      localStorage.setItem(
        'billsync-scanner',
        JSON.stringify({
          state: {
            provider: 'openai',
            apiKey: 'test-key-not-real',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o-mini',
            allowCloud: true,
          },
        }),
      );
    });
    // mock OpenAI chat completions ด้วย llmResponse ของเคสนี้
    await page.route('**/chat/completions', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { content: c.llmResponse } }],
        }),
      }),
    );

    await page.goto(''); // baseURL http://localhost:4173/bill-sync/ — ต้อง relative (ไม่มี / นำหน้า)
    await page.getByRole('button', { name: /สแกนบิลด้วย AI/ }).click();

    // อัปโหลดรูปของเคสนี้จาก golden corpus
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /เลือกภาพบิล/ }).click(),
    ]);
    await chooser.setFiles(c.imagePath);

    // หน้า review แสดงค่าที่ AI อ่าน — เทียบ expected ของเคสนี้
    await expect(page.getByText('ยืนยันและบันทึก')).toBeVisible();
    await expect(page.getByPlaceholder('ชื่อร้าน')).toHaveValue(c.expected.merchant!);
    await expect(page.getByPlaceholder('0.00')).toHaveValue(String(c.expected.total!));
    await expect(page.getByPlaceholder('YYYY-MM-DD')).toHaveValue(c.expected.date!);
    if (c.expected.vat != null) {
      await expect(page.getByText(`${c.expected.vat.toFixed(2)} บาท`, { exact: true })).toBeVisible();
    } else {
      await expect(page.getByText('VAT (7%)')).toHaveCount(0);
    }

    // เลือกหมวดแล้วยืนยัน
    await page.getByText('อาหาร', { exact: true }).click();
    await page.getByRole('button', { name: /ยืนยันและบันทึก/ }).click();

    // รอให้กลับมาที่หน้ารายการจริง (review อาจยัง mount ค้างตอน transition)
    await expect(page.getByRole('heading', { name: 'รายการ' })).toBeVisible();

    // ไปยังเดือนที่บิลออก (หน้าบ้านเริ่มที่เดือนปัจจุบัน)
    await gotoMonth(page, c.expected.date!);

    // รายการใหม่ + ยอดถูกต้อง (เทียบ expected)
    // exact:true — กันชนกับ summary "AI อ่านเจอ: ..." ของ review ที่ยัง mount ค้าง
    // formatBaht ตัวเดียวกันกับแอป (รวม comma เช่น 5,671.00 บาท)
    await expect(page.getByText(c.expected.merchant!, { exact: true })).toBeVisible();
    const bahtText = formatBaht(Math.round(c.expected.total! * 100));
    await expect(page.getByText(`-${bahtText}`, { exact: true })).toBeVisible();
  });
}

/** คลิก เดือนถัดไป/เดือนก่อนหน้า จนถึงเดือนของวันที่เป้าหมาย */
async function gotoMonth(page: Page, dateStr: string): Promise<void> {
  const [ty, tm] = dateStr.slice(0, 7).split('-').map(Number);
  const now = new Date();
  const diff = (ty - now.getFullYear()) * 12 + (tm - (now.getMonth() + 1));
  if (diff === 0) return;
  const label = diff > 0 ? 'เดือนถัดไป' : 'เดือนก่อนหน้า';
  for (let i = 0; i < Math.abs(diff); i += 1) {
    await page.getByLabel(label).click();
  }
}
