import type { ExtractedItem, LlmExtraction } from '../types';
import type { GoldenCase, GoldenExpected } from './types';

export type GoldenField = 'merchant' | 'total' | 'date' | 'vat' | 'items';

export const GOLDEN_FIELDS: GoldenField[] = ['merchant', 'total', 'date', 'vat', 'items'];

export interface FieldScore {
  field: GoldenField;
  correct: boolean;
  expected: unknown;
  actual: unknown;
  /** ข้อความอธิบายเมื่อผิด */
  note?: string;
}

export interface CaseScore {
  id: string;
  label: string;
  /** สัดส่วน field ที่ถูก 0..1 */
  accuracy: number;
  /** ทุก field ถูกต้อง (รวม null-null) */
  exact: boolean;
  fields: FieldScore[];
  /** ข้อความสรุป field ที่ผิด เช่น 'total: ได้ 127.50 คาด 128.00' */
  diffs: string[];
}

export interface GoldenSummary {
  /** จำนวนเคส */
  cases: number;
  /** accuracy รวม = field ถูกทั้งหมด / field ทั้งหมด */
  overall: number;
  /** จำนวนเคสที่ exact (5/5) */
  exact: number;
  fieldAccuracy: Record<GoldenField, number>;
  results: CaseScore[];
}

function normText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** เทียบยอดเงิน (บาท) — อนุโลมต่าง ≤1% หรือ 0.01 บาท (กัน rounding ของ AI) */
function closeEnough(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return a === b;
  if (a === b) return true;
  const diff = Math.abs(a - b);
  return diff <= Math.max(Math.abs(b) * 0.01, 0.01);
}

function itemsMatch(
  expected: Array<{ name: string; price: number }> | null,
  actual: ExtractedItem[] | null,
): boolean {
  if (expected === null) return actual === null || actual.length === 0;
  if (!actual || actual.length !== expected.length) return false;
  const remaining = [...actual];
  for (const exp of expected) {
    const idx = remaining.findIndex(
      (a) => normText(a.name) === normText(exp.name) && closeEnough(a.price, exp.price),
    );
    if (idx === -1) return false;
    remaining.splice(idx, 1);
  }
  return true;
}

/** เปรียบเทียบ extraction กับ ground truth → คะแนนราย field + สรุป */
export function scoreCase(expected: GoldenExpected, actual: LlmExtraction): CaseScore {
  const fields: FieldScore[] = [];
  const diffs: string[] = [];

  const aMerchant = actual.merchant?.value ?? null;
  const merchantOk = normText(aMerchant ?? '') === normText(expected.merchant ?? '');
  fields.push({
    field: 'merchant',
    correct: merchantOk,
    expected: expected.merchant,
    actual: aMerchant,
    note: merchantOk ? undefined : `ได้ "${aMerchant ?? 'null'}" คาด "${expected.merchant ?? 'null'}"`,
  });

  const aTotal = actual.total?.value ?? null;
  const totalOk = closeEnough(aTotal, expected.total);
  fields.push({
    field: 'total',
    correct: totalOk,
    expected: expected.total,
    actual: aTotal,
    note: totalOk ? undefined : `ได้ ${fmtNum(aTotal)} คาด ${fmtNum(expected.total)}`,
  });

  const aDate = actual.date?.value ?? null;
  const dateOk = (aDate ?? '').trim() === (expected.date ?? '').trim();
  fields.push({
    field: 'date',
    correct: dateOk,
    expected: expected.date,
    actual: aDate,
    note: dateOk ? undefined : `ได้ "${aDate ?? 'null'}" คาด "${expected.date ?? 'null'}"`,
  });

  const aVat = actual.vat?.value ?? null;
  const vatOk = closeEnough(aVat, expected.vat);
  fields.push({
    field: 'vat',
    correct: vatOk,
    expected: expected.vat,
    actual: aVat,
    note: vatOk ? undefined : `ได้ ${fmtNum(aVat)} คาด ${fmtNum(expected.vat)}`,
  });

  const aItems = actual.items?.value ?? null;
  const itemsOk = itemsMatch(expected.items, aItems);
  fields.push({
    field: 'items',
    correct: itemsOk,
    expected: expected.items,
    actual: aItems,
    note: itemsOk
      ? undefined
      : `ได้ ${fmtItems(aItems)} คาด ${fmtItems(expected.items)}`,
  });

  const correctCount = fields.filter((f) => f.correct).length;
  return {
    id: '',
    label: '',
    accuracy: correctCount / fields.length,
    exact: correctCount === fields.length,
    fields,
    diffs: fields.filter((f) => !f.correct).map((f) => `${f.field}: ${f.note}`),
  };
}

function fmtNum(n: number | null): string {
  return n === null ? 'null' : String(n);
}

function fmtItems(items: ExtractedItem[] | null): string {
  if (!items) return 'null';
  return `[${items.map((i) => `${i.name}=${i.price}`).join(', ')}]`;
}

/** รวมคะแนนทั้ง corpus → summary (ใช้ report + กัน regression ใน test) */
export function summarize(cases: GoldenCase[], results: CaseScore[]): GoldenSummary {
  const fieldAccuracy = Object.fromEntries(
    GOLDEN_FIELDS.map((f) => {
      const total = results.reduce((n, r) => n + r.fields.filter((s) => s.field === f).length, 0);
      const correct = results.reduce(
        (n, r) => n + r.fields.filter((s) => s.field === f && s.correct).length,
        0,
      );
      return [f, total === 0 ? 0 : correct / total];
    }),
  ) as Record<GoldenField, number>;

  const totalFields = results.reduce((n, r) => n + r.fields.length, 0);
  const totalCorrect = results.reduce((n, r) => n + r.fields.filter((f) => f.correct).length, 0);

  return {
    cases: results.length,
    overall: totalFields === 0 ? 0 : totalCorrect / totalFields,
    exact: results.filter((r) => r.exact).length,
    fieldAccuracy,
    results: results.map((r, i) => ({ ...r, id: cases[i]?.id ?? r.id, label: cases[i]?.label ?? r.label })),
  };
}

/** แสดง report เป็นตารางใน console */
export function printReport(summary: GoldenSummary, title: string): void {
  console.log(`\n=== ${title} ===`);
  console.log(
    `overall: ${(summary.overall * 100).toFixed(1)}% · exact ${summary.exact}/${summary.cases} เคส`,
  );
  console.log(
    `fields: ${GOLDEN_FIELDS.map((f) => `${f}=${(summary.fieldAccuracy[f] * 100).toFixed(0)}%`).join('  ')}`,
  );
  for (const r of summary.results) {
    const mark = r.exact ? '✓' : `✗ (${(r.accuracy * 100).toFixed(0)}%)`;
    console.log(`  ${r.id.padEnd(14)} ${mark}${r.exact ? '' : '  ' + r.diffs.join(' | ')}`);
  }
  console.log('');
}
