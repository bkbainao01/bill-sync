import type { Bill, ExtractedField } from '../entities/bill';
import { newId, nowIso } from '../entities/base';
import { toSatang } from '../calculations/money';
import type { ExtractedItem, ImageSource, LlmExtraction } from './types';

/** Prompt ที่ใช้สั่ง LLM ให้อ่านบิลแล้วตอบ JSON ตาม schema */
export const LLM_PROMPT = `คุณคือเครื่องอ่านใบเสร็จ/บิล (receipt) ที่แม่นยำ
อ่านใบเสร็จจากรูปที่แนบมา แล้วตอบเป็น JSON เท่านั้น (ห้ามมีข้อความอื่นนอกจาก JSON)

กฎการอ่าน:
- merchant: ชื่อร้าน/บริษัท (ถ้าไม่มี ให้ null)
- total: ยอดรวมสุทธิที่ต้องจ่ายจริง ในหน่วยบาท (ตัวเลขเท่านั้น เช่น 350.5) — ใช้ยอดรวมหลังส่วนลด/VAT
- date: วันที่บนบิล แปลงเป็น YYYY-MM-DD (ถ้าเป็นปี พ.ศ. ให้ลบ 543 แล้ว) ถ้าหาอ่านไม่ได้ให้ null
- vat: ภาษีมูลค่าเพิ่ม (7%) ถ้ามี
- items: รายการสินค้า [{ "name": "...", "price": ตัวเลข }] (ถ้าไม่มีให้ null)
- confidence: ความมั่นใจของคุณต่อค่าที่อ่านได้ 0 ถึง 1 (ถ้าไม่แน่ใจให้ค่าน้อยกว่า 0.7)
- summary: สรุปสิ่งที่อ่านได้ 1 ประโยค (ภาษาไทย)

รูปแบบ JSON ที่ต้องตอบ (ห้ามมี field อื่นเพิ่ม):
{
  "merchant": { "value": string|null, "confidence": number },
  "total": { "value": number|null, "confidence": number },
  "date": { "value": "YYYY-MM-DD"|null, "confidence": number },
  "vat": { "value": number|null, "confidence": number },
  "items": { "value": [{"name": string, "price": number}]|null, "confidence": number },
  "summary": string
}`;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[,฿บาท\s]/g, '');
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** รับเฉพาะ 'YYYY-MM-DD' หรือแปลงจาก ISO timestamp */
function toIsoDate(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : trimmed;
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

function fieldOf(raw: unknown): { value: unknown; confidence: number } {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'value' in (raw as object)) {
    const obj = raw as { value?: unknown; confidence?: unknown };
    return { value: obj.value ?? null, confidence: clamp01(Number(obj.confidence)) };
  }
  return { value: raw ?? null, confidence: 0 };
}

/**
 * แปลง response ดิบจาก LLM → LlmExtraction
 * ทนทาน: รองรับ code fence (```json), ข้อความแทรก, shape ผิดบ้างบางส่วน
 * คืน null ถ้าไม่มี JSON ที่ใช้ได้เลย
 */
export function parseLlmResponse(raw: string): LlmExtraction | null {
  if (!raw) return null;
  let text = raw.trim();

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  let data: unknown;
  try {
    data = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;

  const d = data as Record<string, unknown>;

  const merchant = fieldOf(d.merchant);
  const total = fieldOf(d.total);
  const date = fieldOf(d.date);
  const vat = fieldOf(d.vat);
  const items = fieldOf(d.items);

  let itemsValue: ExtractedItem[] | null = null;
  if (Array.isArray(items.value)) {
    itemsValue = items.value
      .filter((it): it is ExtractedItem => {
        if (typeof it !== 'object' || it === null) return false;
        const o = it as Record<string, unknown>;
        return typeof o.name === 'string' && toNumber(o.price) !== null;
      })
      .map((it) => ({ name: String(it.name), price: toNumber(it.price) as number }));
    if (itemsValue.length === 0) itemsValue = null;
  }

  return {
    merchant: {
      value: typeof merchant.value === 'string' && merchant.value.trim() ? merchant.value.trim() : null,
      confidence: merchant.confidence,
    },
    total: { value: toNumber(total.value), confidence: total.confidence },
    date: { value: toIsoDate(date.value), confidence: date.confidence },
    vat: { value: toNumber(vat.value), confidence: vat.confidence },
    items: { value: itemsValue, confidence: items.confidence },
    summary: typeof d.summary === 'string' ? d.summary : undefined,
  };
}

function toField<T>(value: T | null, confidence: number): ExtractedField<T> {
  return { value, confidence: clamp01(confidence), source: 'llm' };
}

/** สร้าง Bill (สถานะ scanned) จากผลการอ่าน + รูปต้นฉบับ */
export function extractionToBill(
  extraction: LlmExtraction,
  image: ImageSource,
  now: string = nowIso(),
  id: string = newId(),
): Bill {
  return {
    id,
    imageUri: image.uri,
    rawText: null,
    extracted: {
      merchant: toField(extraction.merchant.value, extraction.merchant.confidence),
      total: toField(extraction.total.value, extraction.total.confidence),
      date: toField(extraction.date.value, extraction.date.confidence),
      vat: toField(extraction.vat.value, extraction.vat.confidence),
      items: toField(extraction.items.value, extraction.items.confidence),
      summary: extraction.summary ? toField(extraction.summary, 1) : undefined,
    },
    status: 'scanned',
    transactionId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

/** สร้าง transaction (expense) ที่แนะนำจาก Bill — ผู้ใช้ยืนยัน/แก้ไขในหน้า review */
export function suggestedTransactionFromBill(
  bill: Bill,
  now: string = todayKeyLocal(),
): { type: 'expense'; amountSatang: number; date: string; merchant: string | null; note: string | null } {
  const total = bill.extracted.total?.value;
  return {
    type: 'expense',
    amountSatang: total != null ? toSatang(total) : 0,
    date: bill.extracted.date?.value ?? now,
    merchant: bill.extracted.merchant?.value ?? null,
    note: null,
  };
}

function todayKeyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
