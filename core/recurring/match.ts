import type { RecurringBill } from '../entities/recurringBill';

export interface RecurringMatch {
  recurringBillId: string;
  /** คะแนนรวม 0..1 (ยิ่งใกล้ 1 ยิ่งตรง) */
  score: number;
  /** เหตุผลที่ match เช่น 'ร้านตรงกัน', 'ยอดใกล้เคียง' */
  reasons: string[];
}

/** คำที่มักปรากฏในชื่อร้านบนบิล แต่ไม่ช่วยแยกแยะ — ตัดออกก่อนเทียบ */
const MERCHANT_STOPWORDS = [
  'บริษัท',
  'จำกัด',
  'บจก',
  'หจก',
  'ห้างหุ้นส่วน',
  'ห้าง',
  'ร้าน',
  'หุ้นส่วน',
  'สาขา',
  'สำนักงานใหญ่',
];

/** ทำให้ชื่อร้านเป็นกุญแจเทียบ: ตัวเล็ก, ตัด stopword/เครื่องหมาย, รวมช่องว่าง */
export function normalizeMerchantName(raw: string): string {
  let s = raw.toLowerCase();
  for (const w of MERCHANT_STOPWORDS) {
    s = s.split(w).join(' ');
  }
  s = s.replace(/[.,'"()\-–—\\/&:]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/** ระยะแก้ (Levenshtein) — ใช้ได้กับภาษาไทยเพราะอยู่ใน BMP (1 code unit/ตัวอักษร) */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** ความคล้ายชื่อร้าน 0..1 — เท่ากัน 1, มีอีกชื่อเป็นซับเซต 0.85, ไม่งั้นคิดจากระยะแก้ */
export function merchantSimilarity(a: string, b: string): number {
  const na = normalizeMerchantName(a);
  const nb = normalizeMerchantName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const dist = levenshtein(na, nb);
  return Math.max(0, 1 - dist / Math.max(na.length, nb.length));
}

/** ความใกล้ยอดเงิน (สตางค์) 0..1 — เท่ากัน 1, ต่าง ≤1% 0.95, ≤5% 0.7, ≤15% 0.35, เกิน 0 */
export function amountSimilarity(a: number, b: number): number {
  if (a === b) return 1;
  const ratio = Math.abs(a - b) / Math.max(a, b, 1);
  if (ratio <= 0.01) return 0.95;
  if (ratio <= 0.05) return 0.7;
  if (ratio <= 0.15) return 0.35;
  return 0;
}

/**
 * แนะนำ recurring bill ที่น่าจะตรงกับบิลที่สแกน
 * คะแนน = ร้าน 70% + ยอด 30% — ต้องมีอย่างน้อยหนึ่งอย่าง match ถึงจะผ่านเกณฑ์
 */
export function suggestRecurringLink(params: {
  merchant: string | null;
  amountSatang: number | null;
  recurringBills: RecurringBill[];
  minScore?: number;
}): RecurringMatch | null {
  const { merchant, amountSatang, recurringBills, minScore = 0.55 } = params;
  const candidates = recurringBills.filter((rb) => rb.enabled);
  if (candidates.length === 0) return null;
  if (!merchant && amountSatang == null) return null;

  let best: RecurringMatch | null = null;
  for (const rb of candidates) {
    const reasons: string[] = [];
    let score = 0;

    if (merchant) {
      const m = merchantSimilarity(merchant, rb.merchant);
      if (m >= 0.6) {
        score += 0.7 * m;
        reasons.push('ร้านตรงกัน');
      }
    }
    if (amountSatang != null) {
      const am = amountSimilarity(amountSatang, rb.amount);
      if (am >= 0.35) {
        score += 0.3 * am;
        reasons.push('ยอดใกล้เคียง');
      }
    }

    if (reasons.length > 0 && score >= minScore) {
      if (!best || score > best.score) {
        best = { recurringBillId: rb.id, score: Math.min(1, score), reasons };
      }
    }
  }
  return best;
}
