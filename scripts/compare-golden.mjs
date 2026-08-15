/**
 * เทียบ 2 golden reports (JSON จาก run-golden.ts) แบบ side-by-side
 * ใช้ตอน A/B prompt หรือ provider:
 *   node scripts/compare-golden.mjs report-v1.json report-v2.json
 */
import { readFileSync } from 'fs';

const [aPath, bPath] = process.argv.slice(2);
if (!aPath || !bPath) {
  console.error('ใช้: node scripts/compare-golden.mjs <report-A.json> <report-B.json>');
  process.exit(1);
}

const a = JSON.parse(readFileSync(aPath, 'utf8'));
const b = JSON.parse(readFileSync(bPath, 'utf8'));

const pct = (n) => `${(n * 100).toFixed(1)}%`;
const fields = ['merchant', 'total', 'date', 'vat', 'items'];

console.log('\n=== เทียบ accuracy ===');
console.log(
  `${''.padEnd(10)} ${a.generatedAt ? a.generatedAt.slice(0, 10) : 'A'.padEnd(10)}  ${b.generatedAt ? b.generatedAt.slice(0, 10) : 'B'.padEnd(10)}`,
);
console.log(`overall     ${pct(a.overall).padEnd(10)}  ${pct(b.overall).padEnd(10)}`);
console.log(`exact       ${String(a.exact).padEnd(10)}  ${String(b.exact).padEnd(10)}  (จาก ${a.cases} เคส)`);
for (const f of fields) {
  const fa = a.fieldAccuracy?.[f] ?? 0;
  const fb = b.fieldAccuracy?.[f] ?? 0;
  const diff = fb - fa;
  const mark = diff > 0.0001 ? `▲ +${pct(diff)}` : diff < -0.0001 ? `▼ ${pct(diff)}` : '  =';
  console.log(`${f.padEnd(10)} ${pct(fa).padEnd(10)}  ${pct(fb).padEnd(10)}  ${mark}`);
}

console.log('\n=== diff รายเคส ===');
const byId = new Map(b.results.map((r) => [r.id, r]));
let changed = 0;
for (const ra of a.results) {
  const rb = byId.get(ra.id);
  if (!rb) continue;
  const aOk = ra.exact;
  const bOk = rb.exact;
  if (aOk !== bOk) {
    changed += 1;
    console.log(`  ${ra.id.padEnd(16)} A: ${aOk ? '✓' : '✗ ' + ra.diffs.join(' | ')}`);
    console.log(`  ${''.padEnd(16)} B: ${bOk ? '✓' : '✗ ' + rb.diffs.join(' | ')}`);
  } else if (ra.accuracy !== rb.accuracy) {
    changed += 1;
    console.log(`  ${ra.id.padEnd(16)} A: ${pct(ra.accuracy)}  B: ${pct(rb.accuracy)}  (ทั้งคู่ไม่ exact)`);
  }
}
if (changed === 0) console.log('  (ไม่มีเคสที่ผลเปลี่ยน)');

console.log('\nสรุป: ' + (a.overall < b.overall ? 'B ดีกว่า A' : a.overall > b.overall ? 'A ดีกว่า B' : 'เท่ากัน'));
