# Test Pyramid

โครงสร้างเทส 3 ชั้น — ยิ่งล่างยิ่งเยอะ/เร็ว ยิ่งบนยิ่งน้อย/ช้าจริง:

```
        ▲  E2E (Playwright, เบราว์เซอร์จริง)     18 specs
       ▲▲   สแกนทุกเคส corpus 13 + ฟอร์ม + บิลประจำ + ธีม + CSV + กราฟ
      ▲▲▲  Integration (vitest + fake-indexeddb)  23 tests
     ▲▲▲▲   repository + pipeline ทุกเคส corpus
    ▲▲▲▲▲  Unit (vitest)                         96 tests
   ▲▲▲▲▲▲   core logic ล้วน — เร็วที่สุด ฐานเยอะที่สุด
```

## ชั้นล่าง — Unit (`core/**/*.test.ts`) · 96 tests

core logic ล้วนไม่มี I/O: OCR parser, LLM parser, recurring (match/period/reminders),
calculations (money/format/summary/trend), bills state machine, validators,
golden corpus (13 เคส × parser LLM + OCR + ตรวจรูปครบ)

```bash
npm run test:unit
```

## ชั้นกลาง — Integration (`tests/integration/`) · 23 tests

ต่อ core + adapter จริง: IndexedDB จำลองด้วย `fake-indexeddb` ใน node
- `repositories.test.ts` — CRUD/seed/เรียงลำดับ/softDelete ของ repository ทั้ง 5
- `scan-pipeline.test.ts` — **ทุกเคส corpus 13 ตัว**: OCR → bill → review → confirm →
  transaction + ลิงก์บิลประจำ → paid (ค่าตรวจเทียบ expected ของ corpus) + edge cases
- `recurring-flow.test.ts` — บิลประจำ → dueSoon → สร้างรายการ → จ่ายแล้ว

```bash
npm run test:integration   # หรือ npm test (รันรวมกับ unit)
```

## ชั้นบน — E2E (`e2e/*.spec.ts`) · 18 specs

Playwright + Chromium จริง รันกับ **static export** (`expo export -p web`) ที่เสิร์ฟ
ใต้ `/bill-sync` เหมือน GitHub Pages (ไม่ต้องรอ Metro — deterministic)
- `scan.spec.ts` — **ทุกเคส corpus 13 ตัว** (parameterized `for corpus`): อัปโหลดรูปเคสนั้น
  → LLM ถูก **route mock** ด้วย `llmResponse` ของเคสนั้น (ไม่ต้องใช้ API key จริง)
  → review ตรง expected (merchant/total/date/vat) → ยืนยัน → navigate ไปเดือนที่บิลออก
  → เห็น transaction + ยอดตรง
- `add-transaction.spec.ts` — เพิ่มรายจ่ายผ่านฟอร์ม → เห็นในรายการ
- `recurring.spec.ts` — สร้างบิลประจำ → แบนเนอร์เตือนบนหน้ารายการ
- `ui.spec.ts` — ธีมมืด/สว่าง (สลับทั้งแอป + persist ข้าม reload), ส่งออก CSV
  (จับ download event + ตรวจเนื้อหาไฟล์จริง), หน้าสรุป (กราฟ `<svg>` render จริง 2 ตัว
  + ยอด/หมวดในโดนัทตามข้อมูล)

```bash
npm run build:web    # สร้าง dist/ ใหม่ก่อน (ครั้งเดียว/เมื่อแก้แอป)
npm run test:e2e
```

หมายเหตุ:
- ต้องใช้ relative URL กับ baseURL ที่ลงท้าย `/` (`goto('recurring')` ไม่ใช่ `goto('/recurring')`)
- เลือก element ด้วย `getByRole`/`getByLabel` มากกว่า `getByText` ล้วน (ข้อความไทยชนกัน
  เช่น "เพิ่มรายการ" กับ hint "กดปุ่ม + เพิ่มรายการ ...") และ text ที่ชนได้ ต้อง `{ exact: true }`
  (เช่น summary "AI อ่านเจอ: ... ยอดชำระ 856.00 บาท" มี substring "56.00 บาท" ของแถว VAT)
- ยอดเงินในแถวใช้ `formatBaht` ของแอป (มี comma สำหรับ 4 หลัก: 5,671.00) — assert ด้วย
  ฟังก์ชันเดียวกัน อย่า hardcode รูปแบบ

## CI

GitHub Actions (`.github/workflows/ci.yml`) รันทั้งสอง job ทุก push/PR:
- `test` — npm ci → typecheck → vitest → golden:offline (threshold 100%)
- `e2e` — npm ci → playwright install → build:web → playwright test
