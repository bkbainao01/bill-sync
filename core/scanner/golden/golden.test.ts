import { describe, expect, it } from 'vitest';
import { corpus } from './corpus';
import { scoreCase, summarize, printReport } from './score';
import { parseLlmResponse } from '../parse';
import { parseOcrText } from '../ocr';

/** เกณฑ์ขั้นต่ำของ OCR — ถ้าลดลงเมื่อแก้ parser/corpus ต้องรู้ตัว */
const OCR_MIN_ACCURACY = 0.9;

describe('golden corpus — LLM parser (offline)', () => {
  it('parseLlmResponse ตรงกับ expected ทุกเคส (100%)', () => {
    for (const c of corpus) {
      const parsed = parseLlmResponse(c.llmResponse);
      expect(parsed, `case ${c.id}: llmResponse ควร parse ได้`).not.toBeNull();
      const result = scoreCase(c.expected, parsed!);
      expect(result.exact, `case ${c.id}: ${result.diffs.join(' | ')}`).toBe(true);
    }
  });
});

describe('golden corpus — OCR parser (parseOcrText)', () => {
  it(`ได้ accuracy ≥ ${OCR_MIN_ACCURACY * 100}%`, () => {
    const results = corpus.map((c) => scoreCase(c.expected, parseOcrText(c.rawText)));
    const summary = summarize(corpus, results);
    printReport(summary, 'Golden corpus — OCR (parseOcrText)');

    for (let i = 0; i < corpus.length; i += 1) {
      const r = results[i];
      expect(
        r.exact,
        `case ${corpus[i].id}: ${r.diffs.join(' | ')}`,
      ).toBe(true);
    }
    expect(summary.overall).toBeGreaterThanOrEqual(OCR_MIN_ACCURACY);
  });
});
