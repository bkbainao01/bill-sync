# BillSync — Design Document

> ต่อจาก `docs/spec.md` — เอกสารนี้ออกแบบรายละเอียดที่สเปคยังไม่ได้กำหนด เพื่อให้เริ่มเขียนโค้ดได้ทันที

---

## 1. Decision Summary (สรุปการตัดสินใจ)

| หัวข้อ | การตัดสินใจ | เหตุผล |
|---|---|---|
| Storage (Web) | **IndexedDB** ผ่าน `adapters/` (repository pattern) | expo-sqlite บน web ยังเป็น experimental (ต้องตั้งค่า wasm + SharedArrayBuffer headers มี issue เปิดอยู่ เช่น #39903) — สเปคกำหนด IndexedDB ไว้แล้ว ใช้ API เดียวกันสำหรับ native ตอน Phase 3 |
| Storage (Native) | expo-sqlite (Phase 3) | อยู่หลัง interface เดียวกันกับ web ไม่ต้องแตะ business logic |
| AI Pipeline | **Vision LLM เป็นหลัก** (อ่านรูปบิลตรงๆ), OCR on-device เป็น fallback | แม่นกว่ามากกับภาษาไทย (สระซ้อน/ไม่เว้นวรรค) และ pipeline สั้นกว่า: รูป → JSON (schema-constrained) → review |
| UI Library | **`@gluestack-ui/themed` v2** (token theming) | `gluestack-ui` บน npm คือ CLI (v5 ใช้ Tailwind/NativeWind มี known issues หลายจุด) — v2 ตรงกับสเปค "Theming ผ่านระบบ Token" และรองรับ React 19 / RN 0.86 |
| State | TanStack Query = data layer, Zustand = UI/session state | หลีกเลี่ยง data สองที่ซิงค์กันไม่ตรง (local DB ทำหน้าที่เป็น "server") |
| Phasing | **Manual-first** — MVP ใช้งานได้ก่อน AI | แอปมีประโยชน์ทันที + ได้ข้อมูลจริงไว้เทสต์ OCR/AI |

---

## 2. Data Model

หลักการ: ทุก entity ใช้ **UUID** + `createdAt` / `updatedAt` (ISO string) + soft delete (`deletedAt`) ตั้งแต่แรก เพื่อเปิดทางให้ sync/backup ในอนาคตโดยไม่ต้อง migrate

### 2.1 Transaction (รายรับ/รายจ่าย — หัวใจของแอป)

```ts
type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;                 // UUID
  type: TransactionType;
  amount: number;             // เก็บเป็นหน่วยสตางค์ (int) เสมอ — หลีกเลี่ยง float error
  categoryId: string | null;
  accountId: string | null;
  date: string;               // ISO date (YYYY-MM-DD) — เวลาไม่สำคัญสำหรับการสรุป
  merchant: string | null;    // ร้านค้า/ผู้รับเงิน
  note: string | null;
  billId: string | null;      // link กลับไปหา Bill ถ้ามาจากการสแกน
  status: TransactionStatus;  // 'confirmed' | 'reviewing' | 'rejected'
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
```

- **amount เก็บเป็นสตางค์ (int)** — ป้องกัน floating point error เวลาสรุปยอด (0.1 + 0.2 ≠ 0.3)
- มี `status` เพราะ transaction ที่มาจากสแกนจะผ่านสถานะ "reviewing" ก่อน confirm

### 2.2 Bill (ใบเสร็จ/หลักฐาน)

```ts
type BillStatus = 'scanned' | 'reviewing' | 'confirmed' | 'rejected';

interface ExtractedField<T = unknown> {
  value: T | null;
  confidence: number;        // 0..1
  source: 'llm' | 'ocr' | 'manual';
}

interface Bill {
  id: string;
  imageUri: string | null;       // path/uri ของรูป (web: object URL / File, native: camera roll)
  rawText: string | null;        // ข้อความดิบจาก OCR (ถ้ามี)
  extracted: {                    // JSON ที่ AI อ่านออกมา — schema ด้านล่าง
    merchant?: ExtractedField<string>;
    total?: ExtractedField<number>;
    date?: ExtractedField<string>;
    items?: ExtractedField<Array<{ name: string; price: number }>>;
    vat?: ExtractedField<number>;
  };
  status: BillStatus;
  transactionId: string | null;  // transaction ที่สร้างจากบิลนี้ (หลัง confirm)
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
```

### 2.3 Category / Account

```ts
interface Category {
  id: string;                // seed ใช้ id คงที่ เช่น 'food', 'transport'
  name: string;              // 'อาหาร', 'เดินทาง'
  type: TransactionType;     // income/expense — หมวดแยกตามประเภท
  icon: string;              // ชื่อไอคอน (Ionicons)
  color: string;             // hex
  isDefault: boolean;
  createdAt: string;
}

interface Account {
  id: string;
  name: string;              // 'เงินสด', 'ธนาคารกสิกร'
  type: 'cash' | 'bank' | 'ewallet';
  openingBalance: number;    // สตางค์
  createdAt: string;
}
```

### 2.4 Recurring (เตรียมไว้ Phase 2)

```ts
interface RecurringBill {
  id: string;
  categoryId: string;
  amount: number;
  merchant: string;
  cadence: 'monthly' | 'weekly' | 'yearly';
  dayOfMonth: number | null;   // วันที่ในเดือนที่มักเรียกเก็บ
  lastMatchedAt: string | null;
  enabled: boolean;
}
```

---

## 3. Repository Interfaces (core/repositories)

Business logic ห้ามรู้จัก IndexedDB/SQLite — รู้จักแค่ interface:

```ts
interface TransactionRepository {
  list(options?: { from?: string; to?: string; type?: TransactionType }): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(tx: Transaction): Promise<void>;
  update(tx: Transaction): Promise<void>;
  softDelete(id: string): Promise<void>;
  seedIfEmpty?(): Promise<void>;
}

interface CategoryRepository {
  list(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(c: Category): Promise<void>;
  seedDefaults(): Promise<void>;
}

interface BillRepository {
  list(): Promise<Bill[]>;
  getById(id: string): Promise<Bill | null>;
  create(b: Bill): Promise<void>;
  update(b: Bill): Promise<void>;
  setStatus(id: string, status: BillStatus): Promise<void>;
}
```

Adapter selector (`adapters/index.ts`):

```ts
// web → IndexedDB implementation
// native → (Phase 3) expo-sqlite implementation
export const repositories = Platform.OS === 'web'
  ? createIndexedDBRepositories()
  : createSQLiteRepositories(); // stub จนถึง Phase 3
```

---

## 4. AI Pipeline Design (Phase 2)

### 4.1 ScannerAdapter — กัน platform ออก

```ts
interface ScanResult {
  bill: Bill;                    // extracted fields + confidence
  transaction: Partial<Transaction>; // แปลงจาก extracted แล้ว
}

interface ScannerAdapter {
  scan(image: ImageSource): Promise<ScanResult>;
}

// Implementations (เลือกตาม platform/setting):
// - LlmVisionScanner  → ส่งรูปไป vision LLM (Gemini/GPT/Claude) → JSON ตาม schema
// - OcrRuleScanner    → tesseract.js (web) / ML Kit (native) + rule-based parse (offline)
// - CompositeScanner  → ลอง LLM ก่อน ถ้า offline/ไม่ยอม consent → ตกไป OCR
```

### 4.2 ทางหลัก: Vision LLM (อ่านรูปตรงๆ)

```
รูปบิล → [Provider abstraction] → JSON ตาม schema (บังคับผ่าน JSON Schema / tool calling)
       → แปลงเป็น ScanResult (ใส่ confidence ต่อ field)
```

- **Provider abstraction:** `LlmProvider` interface (OpenAI / Gemini / Claude เปลี่ยนได้) + การตั้งค่า API key ในหน้าตั้งค่า
- **Privacy:** ต้อง opt-in ก่อนส่งรูปขึ้น cloud — แสดงข้อความชัดเจนในหน้าแรกที่ใช้สแกน + ตั้งค่าปิดได้
- **Cost control:** ลดรูปให้เล็กก่อนส่ง, จำกัด tokens, cache ผลลัพธ์ตาม hash ของรูป

### 4.3 Fallback: OCR + Rule-based (offline)

- Web: `tesseract.js` (WASM, รองรับไทยระดับกลาง), Native: ML Kit text recognition (รองรับไทย)
- จากนั้น rule-based extraction: regex จับยอดรวม/วันที่ (รวมถึง **พ.ศ.**)/ชื่อร้าน
- Accuracy ต่ำกว่า LLM มาก → confidence จะต่ำ → user เห็น prompt ให้แก้ไขเยอะขึ้น (ออกแบบให้ flow นี้ทำงานได้)

### 4.4 Review / Confirm State Machine

```
        ┌──────────────────────────────────────────────────┐
        ▼                                                  │
[scanned] ──(AI อ่านแล้ว, confidence ต่ำ)──► [reviewing] ──┐
    │                                                       │
    │──(AI อ่านแล้ว, confidence สูง, ตั้ง auto-confirm)────►│
    │                                                       ▼
    │                                               [confirmed]
    │                                                   │
    │                                                   ▼
    │                                          สร้าง Transaction (status=confirmed)
    └──(ข้อมูลใช้ไม่ได้)──► [rejected] ◄──(user กด reject)
```

- **Auto-confirm:** ถ้า confidence ทุก field ≥ threshold (default 0.9) ข้าม review ได้ (ตั้งค่าได้)
- **UI หน้า Review:** badge แสดง confidence ต่อ field, แก้ไขได้ field ต่อ field, ปุ่ม Confirm/Reject
- **Batch mode:** สแกนหลายใบ → review ทีละใบในคิว

---

## 5. Thai Bill Parsing (Domain Notes)

- **วันที่แบบไทย:** `15 ส.ค. 2568` / `15/08/2568` → แปลง พ.ศ. → ค.ศ. (ลบ 543) — ต้องระวังปี ค.ศ. ที่เป็น 2 หลัก
- **VAT:** บิลไทยหลายใบมี subtotal + VAT 7% + total — ควรใช้ **total** เป็นหลัก และเก็บ vat ไว้ตรวจสอบความสอดคล้อง
- **รูปแบบที่พบบ่อย:** ใบเสร็จ 7-11/Makro/Lotus, บิลค่าไฟ MEA/PEA, ค่าโทรศัพท์, Grab — แต่ละแบบมีโครงสร้างต่างกัน
- **คลังบิลตัวอย่าง (sample bills corpus):** เก็บรูปบิลจริง (blur ข้อมูลส่วนตัว) ไว้ใน `testdata/bills/` พร้อม expected JSON → ใช้เป็น golden test วัด accuracy ทุกครั้งที่เปลี่ยน pipeline

---

## 6. Dashboard (MVP Scope)

หน้า "สรุป" แสดง:
- ยอดรายรับ / รายจ่าย / คงเหลือ ของเดือนที่เลือก (พร้อมปุ่มเปลี่ยนเดือน)
- รายจ่ายแยกตามหมวด (top N + อื่นๆ) — bar list อย่างง่าย
- เปรียบเทียบกับเดือนก่อนหน้า (▲/▼ %)

> Charts เต็มรูปแบบ (react-native-svg) รอ Phase 2 — MVP ใช้รายการ + แถบสัดส่วนง่ายๆ

---

## 7. State Management Split

- **TanStack Query:** อ่าน/เขียน DB ทั้งหมด (`useQuery` สำหรับ list, `useMutation` + `invalidateQueries` สำหรับ create/update/delete) — DB คือ "server"
- **Zustand:** UI state เท่านั้น — `colorMode` (light/dark), filter เดือนที่เลือก, draft ของฟอร์ม, สถานะ modal

---

## 8. Testing Strategy

- **Vitest (unit, ตั้งแต่ตอนนี้):** `core/calculations/*` (สรุปยอด, แปลงเดือน), `core/validators/*`, `core/parsers/*` (ตอน Phase 2: พ.ศ. → ค.ศ. ฯลฯ) — core เป็น TS ล้วน ไม่แตะ RN
- **Golden tests (Phase 2):** sample bills corpus → pipeline output เทียบ expected JSON + threshold accuracy
- **E2E (Phase 3):** Playwright บน web build

---

## 9. Roadmap

| Phase | งาน | Acceptance |
|---|---|---|
| **0–1 (กำลังทำ)** | Scaffold Expo + gluestack + core + IndexedDB + รายการ/ฟอร์ม/สรุป/ตั้งค่า + export CSV/JSON + Vitest | บันทึกรายรับ/รายจ่ายด้วยมือได้ครบวงจรบน web |
| **2** | ScannerAdapter + vision LLM (opt-in) + OCR fallback + review screen + recurring bill + charts | อัปโหลดบิล → ได้ transaction หลัง confirm |
| **3** | iOS/Android build + camera + ML Kit + expo-sqlite + notification + PWA/offline web | รันบนเครื่องจริงได้ |

---

## 10. Open Decisions (ยังไม่ตัดสินใจ — เก็บไว้ทีหลัง)

- **Sync ข้ามเครื่อง:** local-first หมายถึงไม่บังคับ cloud — ถ้าจะทำ ใช้ UUID + updatedAt + soft delete ที่ออกแบบไว้แล้ว (อาจใช้ CRDT อย่าง Automerge ถ้าต้องการ merge แบบ offline)
- **Export format:** CSV (Excel/Google Sheets) + JSON (backup เต็มรูปแบบรวมรูป) — restore จาก JSON
- **Multi-currency:** สกุลเงินเดียว (THB) ก่อน
- **Auth:** ไม่มีบัญชีผู้ใช้ใน v1
