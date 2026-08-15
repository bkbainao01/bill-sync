# Golden Test Corpus — วัดความแม่นยำของ pipeline สแกนบิล

คลังใบเสร็จ/บิลตัวอย่าง (ไทย) พร้อม ground truth (`expected`) สำหรับวัดว่า
OCR / parser / vision-LLM อ่านบิลได้แม่นแค่ไหน — โดยเฉพาะตอน**เปลี่ยน prompt หรือ provider**

## โครงสร้าง

```
core/scanner/golden/
  types.ts        ประเภทของ golden case + ground truth
  corpus.ts       10 ใบเสร็จตัวอย่าง (rawText + llmResponse + expected + imagePath)
  score.ts        scoring (field-level) + report
  golden.test.ts  vitest: กัน regression ของ parseLlmResponse + parseOcrText
golden/images/    รูปใบเสร็จที่วาดจาก rawText (ใช้เทสต์ LLM จริง)
scripts/
  generate-golden-images.ts   วาดรูปจาก corpus → golden/images/
  run-golden.ts               harness: รัน pipeline แล้วรายงาน accuracy
```

แต่ละเคสมีข้อมูล 3 ชั้น:

| ชั้น | ใช้ทำอะไร |
|---|---|
| `rawText` | ข้อความ OCR ดิบ → ทดสอบ `parseOcrText` (offline, ไม่ต้องใช้ AI) |
| `llmResponse` | response JSON ที่ LLM ควรตอบ → ทดสอบ `parseLlmResponse` (offline) |
| `imagePath` | รูปจริง → เรียก vision LLM (live, ต้องใช้ API key) |

## ใช้งาน

### เทสต์อัตโนมัติ (ทุกครั้งที่รัน `vitest`)

```bash
npm test
```

- `parseLlmResponse` ต้องตรงกับ expected **ทุกเคส (100%)**
- `parseOcrText` ต้องได้ accuracy ≥ 90% (พิมพ์ตาราง report ให้ดูใน log)

### Offline harness — วัด parser กับ golden responses

```bash
npm run golden:offline
```

### Live harness — วัด LLM จริง (ต้องมี API key)

```bash
npm run golden:images        # วาดรูปใบเสร็จ (ครั้งเดียว หรือเมื่อแก้ corpus)
npm run golden:live          # openai (env: BILLSYNC_API_KEY)
npm run golden:live -- --provider gemini
```

### วัด accuracy ตอนเปลี่ยน prompt / provider

หัวใจของ corpus นี้ — ใช้ `--prompt` ลอง prompt ใหม่แล้วเทียบ accuracy:

```bash
# prompt เดิม (baseline)
npm run golden:live -- --out report-baseline.json

# ลอง prompt ใหม่
npm run golden:live -- --prompt "คุณคือเครื่องอ่านใบเสร็จ..." --out report-v2.json
```

หรือสลับ provider ดูว่าตัวไหนแม่นกว่า:

```bash
npm run golden:live -- --provider openai --out report-openai.json
npm run golden:live -- --provider gemini --model gemini-2.5-flash --out report-gemini.json
```

report เป็น JSON (`golden-report.json` หรือ `--out`) มี overall accuracy, accuracy ราย field
(merchant/total/date/vat/items) และ diff ของแต่ละเคส — เทียบระหว่างรันได้เลย

### ตัวเลือกทั้งหมดของ harness

```
--mode offline|live     default: offline
--provider openai|gemini
--api-key KEY           หรือ env BILLSYNC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY
--model MODEL
--prompt "..."          ใช้แทน LLM_PROMPT เดิม (เฉพาะ live)
--out file.json         default: golden-report.json
--threshold 0..1        exit code 1 ถ้า accuracy ต่ำกว่า (offline default 1.0, live 0.7)
```

## หลักการ scoring

- 5 fields: `merchant`, `total`, `date`, `vat`, `items`
- `total`/`vat`: อนุโลมต่าง ≤1% หรือ 0.01 บาท (กัน rounding ของ AI)
- `merchant`: เทียบแบบ normalized (ตัดช่องว่าง/ตัวพิมพ์เล็ก)
- `items`: เทียบเป็นชุด — ชื่อตรง + ราคาใกล้เคียง, ต้องครบจำนวน
- `expected: null` ก็เป็นข้อมูล (กัน AI "มโน" ข้อมูลที่บิลไม่มี) — ถ้าได้ค่าแต่คาด null ถือว่าผิด
- `exact` = ครบทั้ง 5 field, accuracy รวม = field ถูก / field ทั้งหมด

## เพิ่มเคสใหม่

1. เอารูปบิลจริงลง `golden/images/<id>.png` (หรือเพิ่ม rawText + รัน `npm run golden:images` วาดรูป)
2. เพิ่มเคสใน `core/scanner/golden/corpus.ts`: rawText + llmResponse + expected
3. รัน `npm run golden:offline` — ถ้า OCR/parser อ่านเคสใหม่ไม่ได้ ให้แก้ parser (ไม่ใช่แก้ expected)
4. รัน `npx vitest run core/scanner/golden` — ต้องผ่าน 100%

> หลักสำคัญ: `expected` คือความจริงของใบเสร็จ (อ่านเอง) — ถ้า pipeline อ่านผิด ให้แก้ pipeline
> ไม่ใช่แก้ expected เพื่อให้ test ผ่าน

## เคสปัจจุบัน (10)

| id | บิล | จุดที่ทดสอบ |
|---|---|---|
| seven-eleven | เซเว่น 4 รายการ + VAT + เงินทอน | จำนวน x ราคา, สาขา, แคชเชียร์ |
| lotus | โลตัส + ส่วนลด + VAT | ส่วนลดติดลบ, subtotal |
| mea | ใบแจ้งค่าไฟฟ้า | บิลไม่มีสินค้า (charges = items) |
| ais | AIS รอบบิล | วันที่ใบแจ้ง vs รอบบิล |
| restaurant | ร้านอาหาร | วันที่ชื่อเดือนไทย |
| amazon-cafe | คาเฟ่ ไม่มี VAT | ตรวจ hallucination (vat=null) |
| shop-keep | ร้านชำง่ายๆ | ปี 2 หลัก, รวมเป็นเงิน, ไม่มีรายการ |
| coffee-friend | ร้านกาแฟ | ปี 2 หลัก (68 → 2025) |
| true-move | ทรูมูฟ พ.ศ. | 2568, ค่าบริการ 0.00 |
| noodle-shop | ร้านก๋วยเตี๋ยว | parser ทน response ฟอร์แมตเพี้ยน (fence) |
