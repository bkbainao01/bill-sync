import type { Category } from '@/core/entities/category';
import type { Transaction } from '@/core/entities/transaction';
import { fromSatang } from '@/core/calculations/money';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function transactionsToCsv(transactions: Transaction[], categories: Category[]): string {
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? '';
  const rows = [
    ['วันที่', 'ประเภท', 'หมวด', 'ร้านค้า', 'หมายเหตุ', 'ยอด (บาท)'],
    ...transactions.map((t) => [
      t.date,
      t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      catName(t.categoryId),
      t.merchant ?? '',
      t.note ?? '',
      fromSatang(t.amount).toFixed(2),
    ]),
  ];
  // BOM (\uFEFF) เพื่อให้ Excel เปิดภาษาไทยได้ถูกต้อง
  return '\uFEFF' + rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

/** ดาวน์โหลดไฟล์บน web (no-op บน native) */
export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
