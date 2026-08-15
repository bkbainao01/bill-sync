/**
 * Golden harness — วัด accuracy ของ pipeline (OCR/parser/LLM) เทียบ ground truth ใน corpus
 *
 * ใช้งาน:
 *   npm run golden:offline                 # เทสต์ parser กับ golden responses (ไม่ต้องใช้ API key)
 *   npm run golden:live                    # เรียก LLM จริง (ต้อง BILLSYNC_API_KEY หรือ --api-key)
 *   npm run golden:live -- --provider gemini
 *   npm run golden:live -- --prompt "prompt ใหม่..."     # วัด accuracy ตอนเปลี่ยน prompt
 *
 * ตัวเลือก:
 *   --mode offline|live    (default offline)
 *   --provider openai|gemini
 *   --api-key KEY          (หรือ env BILLSYNC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY)
 *   --model MODEL
 *   --prompt "..."         ใช้แทน LLM_PROMPT เดิม — เปรียบเทียบ accuracy ระหว่าง prompt
 *   --out file.json        (default golden-report.json)
 *   --threshold 0..1       exit code 1 ถ้า accuracy ต่ำกว่า (offline default 1.0, live 0.7)
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { corpus } from '../core/scanner/golden/corpus';
import { scoreCase, summarize, printReport } from '../core/scanner/golden/score';
import { parseLlmResponse } from '../core/scanner/parse';
import { createLlmProvider } from '../adapters/scanner/providers';
import type { LlmExtraction } from '../core/scanner/types';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function dataUrlFromFile(path: string): string {
  const buf = readFileSync(resolve(path));
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main(): Promise<void> {
  const mode = arg('mode') ?? 'offline';
  const provider = (arg('provider') ?? 'openai') as 'openai' | 'gemini';
  const apiKey =
    arg('api-key') ?? process.env.BILLSYNC_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.GEMINI_API_KEY ?? '';
  const model = arg('model') ?? '';
  const promptOverride = arg('prompt');
  const outFile = arg('out') ?? 'golden-report.json';
  const threshold = Number(arg('threshold') ?? (mode === 'offline' ? '1' : '0.7'));

  let llm: ReturnType<typeof createLlmProvider> | null = null;
  if (mode === 'live') {
    llm = createLlmProvider({
      provider,
      apiKey,
      baseUrl: 'https://api.openai.com/v1',
      model: model || (provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'),
      prompt: promptOverride,
    });
    if (!llm) {
      throw new Error('❌ โหมด live ต้องมี API key — ใส่ --api-key หรือ env BILLSYNC_API_KEY');
    }
  }

  const results = [];
  for (const c of corpus) {
    let extraction: LlmExtraction;
    if (mode === 'live') {
      const imagePath = resolve(c.imagePath);
      if (!existsSync(imagePath)) {
        throw new Error(`ไม่พบรูป ${c.imagePath} — รัน npm run golden:images ก่อน`);
      }
      extraction = await llm!.extract({
        uri: dataUrlFromFile(imagePath),
        mimeType: 'image/png',
        name: c.imagePath,
      });
    } else {
      const parsed = parseLlmResponse(c.llmResponse);
      if (!parsed) throw new Error(`case ${c.id}: llmResponse parse ไม่ได้ (corpus ผิด?)`);
      extraction = parsed;
    }
    results.push(scoreCase(c.expected, extraction));
  }

  const summary = summarize(corpus, results);
  const title =
    mode === 'live'
      ? `Golden — LIVE ${provider}${promptOverride ? ' (custom prompt)' : ''}`
      : 'Golden — offline (parseLlmResponse)';
  printReport(summary, title);

  writeFileSync(
    outFile,
    JSON.stringify(
      {
        mode,
        provider: mode === 'live' ? provider : 'parser',
        customPrompt: promptOverride ?? null,
        generatedAt: new Date().toISOString(),
        overall: summary.overall,
        exact: summary.exact,
        cases: summary.cases,
        fieldAccuracy: summary.fieldAccuracy,
        results: summary.results.map((r) => ({
          id: r.id,
          label: r.label,
          accuracy: r.accuracy,
          exact: r.exact,
          diffs: r.diffs,
        })),
      },
      null,
      2,
    ),
  );
  console.log(`report: ${outFile}`);

  if (summary.overall < threshold) {
    console.error(
      `❌ accuracy ${(summary.overall * 100).toFixed(1)}% ต่ำกว่า threshold ${(threshold * 100).toFixed(0)}%`,
    );
    process.exit(1);
  }
  console.log(`✅ accuracy ${(summary.overall * 100).toFixed(1)}% ≥ threshold ${(threshold * 100).toFixed(0)}%`);
}

main().catch((e: Error) => {
  console.error(e.message);
  process.exit(1);
});
