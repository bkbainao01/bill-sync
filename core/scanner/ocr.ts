import { THAI_MONTHS, THAI_MONTHS_SHORT } from '../calculations/format';
import type { ExtractedItem, LlmExtraction } from './types';

/**
 * Rule-based parser: แปลงข้อความดิบจาก OCR → โครงสร้างเดียวกับที่ LLM ตอบ
 * ใช้เป็นทาง offline/privacy (ไม่ต้องส่งรูปขึ้นคลาวด์)
 * ความแม่นยำต่ำกว่า LLM → confidence ตั้งไว้ต่ำกว่า
 */

const HEADER_KEYWORDS = [
  'receipt', 'invoice', 'cash sale', 'tax invoice', 'bill', 'order', 'จ่ายแล้ว',
  'ใบเสร็จ', 'ใบกำกับภาษี', 'บิลเงินสด', 'สำเนา', 'ลอก', 'copy', 'sale', 'จอง',
];

const TOTAL_KEYWORDS = [
  'รวมทั้งสิ้น', 'ยอดรวม', 'รวมสุทธิ', 'ยอดเงิน', 'รวมเป็นเงิน', 'รวมเป็นจำนวน',
  'รวม', 'subtotal', 'grand total', 'total due', 'amount due', 'net total', 'ยอดชำระ', 'total',
];

const VAT_KEYWORDS = ['vat', 'v.a.t', 'ภาษีมูลค่าเพิ่ม', 'ภาษี'];

const SKIP_TOTAL_LINE = ['%', 'rate', 'อัตรา'];

const ITEM_SKIP_KEYWORDS = [
  ...TOTAL_KEYWORDS,
  ...VAT_KEYWORDS,
  ...HEADER_KEYWORDS,
  'เงินสด', 'เงินทอน', 'รับมา', 'รับเงิน', 'ทอน', 'cash', 'change',
  'แคชเชียร์', 'cashier', 'บาร์โค้ด', 'barcode', 'สมาชิก', 'เลขอ้างอิง', 'ชำระ',
];

const NUM_RE = /-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/;

function toNumber(s: string): number | null {
  const cleaned = s.replace(/,/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** แปลงปี (พ.ศ./ค.ศ./2 หลัก) → ค.ศ. 4 หลัก */
function toCeYear(y: number): number {
  if (y >= 2500) return y - 543; // พ.ศ.
  if (y >= 1900 && y <= 2100) return y; // ค.ศ.
  if (y >= 40 && y <= 99) return y + 2500 - 543; // 2 หลัก แบบพ.ศ. (68 → 2568)
  if (y < 40) return y + 2000;
  return y;
}

/** ค้นหาวันที่ในข้อความ → 'YYYY-MM-DD' หรือ null */
export function extractDate(text: string): string | null {
  // ตัวเลขล้วน: 15/08/2568, 15-08-68, 15.08.2026
  const numeric = /(?:^|[^\d])(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{2,4})(?:[^\d]|$)/.exec(text);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    const year = toCeYear(Number(numeric[3]));
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  // ชื่อเดือนไทย: "15 ส.ค. 68", "15 สิงหาคม 2568"
  const months: string[] = [...THAI_MONTHS, ...THAI_MONTHS_SHORT].sort((a, b) => b.length - a.length);
  const monthPattern = months.join('|').replace(/\./g, '\\.');
  const thai = new RegExp(
    `(?:^|[^\\d])(\\d{1,2})\\s*(${monthPattern})\\s*(?:พ\\.?ศ\\.?\\s*)?(\\d{2,4})(?:[^\\d]|$)`,
    'i',
  ).exec(text);
  if (thai) {
    const day = Number(thai[1]);
    const year = toCeYear(Number(thai[3]));
    const month = (Math.max(months.indexOf(thai[2]), 0) % 12) + 1;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }
  return null;
}

function lineHasKeyword(line: string, keywords: string[]): boolean {
  const lower = line.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

/** ค้นหายอดรวมสุทธิ — คืน (ค่า, บรรทัดที่เจอ) */
export function extractTotal(text: string): number | null {
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (!lineHasKeyword(line, TOTAL_KEYWORDS)) continue;
    if (SKIP_TOTAL_LINE.some((s) => line.toLowerCase().includes(s))) continue;
    const matches = [...line.matchAll(new RegExp(NUM_RE, 'g'))];
    if (matches.length > 0) {
      const last = matches[matches.length - 1][0];
      const n = toNumber(last);
      if (n !== null && n > 0) return n;
    }
  }
  // fallback: ตัวเลขสุดท้ายในข้อความ
  const all = [...text.matchAll(new RegExp(NUM_RE, 'g'))];
  for (let i = all.length - 1; i >= 0; i -= 1) {
    const n = toNumber(all[i][0]);
    if (n !== null && n > 1) return n;
  }
  return null;
}

export function extractVat(text: string): number | null {
  const lines = text.split('\n');
  for (const line of lines) {
    if (!lineHasKeyword(line, VAT_KEYWORDS)) continue;
    const matches = [...line.matchAll(new RegExp(NUM_RE, 'g'))];
    for (const m of matches) {
      const n = toNumber(m[0]);
      // ข้ามตัวเลขที่เป็นเปอร์เซ็นต์ (7) ใน "VAT 7%"
      if (n !== null && n !== 7 && n > 0 && n < 1000000) return n;
    }
  }
  return null;
}

function looksLikeMerchant(line: string): boolean {
  const t = line.trim();
  if (t.length < 2 || t.length > 80) return false;
  if (/^[\d\s,./\-:()]+$/.test(t)) return false;
  if (lineHasKeyword(t, HEADER_KEYWORDS)) return false;
  // ต้องมีตัวอักษร
  return /[\u0E00-\u0E7Fa-zA-Z]/.test(t);
}

export function extractMerchant(text: string): string | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (!looksLikeMerchant(line)) continue;
    // ตัดคำต่อท้าย 'สาขา …' (รวม OCR อ่าน 'สาข์') — ชื่อร้านจบที่ชื่อแบรนด์
    const branch = line.search(/สาข[า์]/);
    const name = branch >= 0 ? line.slice(0, branch) : line;
    const cleaned = name.replace(/\s+/g, ' ').trim();
    if (cleaned.length >= 2) return cleaned.slice(0, 100);
  }
  return null;
}

/** แยกรายการสินค้า: "ชื่อ... ราคา" หรือ "ชื่อ... จำนวน ราคา" (ตัวเลขต่อท้ายบรรทัด) */
export function extractItems(text: string): ExtractedItem[] | null {
  const items: ExtractedItem[] = [];
  const lines = text.split('\n');
  for (const rawLine of lines) {
    if (items.length >= 30) break;
    const line = rawLine.trim();
    // "ชื่อ จำนวน ราคา" เช่น 'โค้ก 1 15.00' — ตัวเลขตัวสุดท้ายคือราคา
    const qty = /^(.+?)\s+(\d{1,3})\s+(-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*$/.exec(line);
    const m = qty ?? /^(.+?)\s+(-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*$/.exec(line);
    if (!m) continue;
    const name = m[1].trim();
    // qty pattern มี 3 groups (name, จำนวน, ราคา) — ราคาคือกลุ่มสุดท้าย
    const price = toNumber(m[m.length - 1]);
    if (price === null || price <= 0) continue;
    if (name.length < 2 || name.length > 60) continue;
    if (/^[\d\s,./\-:()]+$/.test(name)) continue;
    if (name.includes('สาขา')) continue; // ข้อมูลหัวบิลร้านสาขา
    if (lineHasKeyword(name, ITEM_SKIP_KEYWORDS)) continue;
    items.push({ name: name.replace(/\s+/g, ' '), price });
  }
  return items.length > 0 ? items : null;
}

/** parse ข้อความ OCR → LlmExtraction (source 'ocr', confidence ตามความน่าจะเป็นของ rule) */
export function parseOcrText(rawText: string): LlmExtraction {
  const total = extractTotal(rawText);
  const date = extractDate(rawText);
  const merchant = extractMerchant(rawText);
  const vat = extractVat(rawText);
  const items = extractItems(rawText);

  return {
    merchant: { value: merchant, confidence: merchant ? 0.6 : 0 },
    total: { value: total, confidence: total != null ? 0.85 : 0 },
    date: { value: date, confidence: date ? 0.8 : 0 },
    vat: { value: vat, confidence: vat != null ? 0.5 : 0 },
    items: { value: items, confidence: items ? 0.5 : 0 },
    summary: merchant || total != null ? `อ่านจากข้อความในใบเสร็จ (${merchant ?? 'ไม่ระบุร้าน'})` : undefined,
  };
}
