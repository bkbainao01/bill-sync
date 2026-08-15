import type { ImageSource, LlmExtraction } from '@/core/scanner/types';
import { LLM_PROMPT, parseLlmResponse } from '@/core/scanner/parse';
import type { LlmProviderId } from '@/store/scannerSettings';

export interface LlmConfig {
  provider: LlmProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface LlmProvider {
  readonly id: string;
  readonly label: string;
  extract(image: ImageSource): Promise<LlmExtraction>;
}

function extractFromContent(content: string | null | undefined): LlmExtraction {
  const extraction = content ? parseLlmResponse(content) : null;
  if (!extraction) {
    throw new Error('AI ไม่สามารถอ่านข้อมูลจากบิลได้ (รูปแบบตอบกลับไม่ถูกต้อง)');
  }
  return extraction;
}

function apiError(res: Response, body: string): Error {
  let message = `LLM API error (${res.status})`;
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) message = parsed.error.message;
  } catch {
    if (body) message += `: ${body.slice(0, 200)}`;
  }
  return new Error(message);
}

/** OpenAI-compatible chat completions (ใช้ได้กับ OpenAI และ API หลายเจ้า) */
class OpenAiCompatibleProvider implements LlmProvider {
  readonly id = 'openai' as const;
  readonly label = 'OpenAI-compatible';

  constructor(private readonly cfg: LlmConfig) {}

  async extract(image: ImageSource): Promise<LlmExtraction> {
    const base = this.cfg.baseUrl.replace(/\/+$/, '');
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: LLM_PROMPT },
              { type: 'image_url', image_url: { url: image.uri } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw apiError(res, await res.text());
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return extractFromContent(data.choices?.[0]?.message?.content);
  }
}

/** Google Gemini (Generative Language API) */
class GeminiProvider implements LlmProvider {
  readonly id = 'gemini' as const;
  readonly label = 'Google Gemini';

  constructor(private readonly cfg: LlmConfig) {}

  async extract(image: ImageSource): Promise<LlmExtraction> {
    const comma = image.uri.indexOf(',');
    const header = image.uri.slice(0, comma);
    const mimeType = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
    const base64 = image.uri.slice(comma + 1);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.cfg.model}:generateContent?key=${encodeURIComponent(this.cfg.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: LLM_PROMPT },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
    });
    if (!res.ok) throw apiError(res, await res.text());
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const content = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join('\n');
    return extractFromContent(content);
  }
}

/** สร้าง provider ตามการตั้งค่า — คืน null ถ้ายังไม่มี API key */
export function createLlmProvider(cfg: LlmConfig): LlmProvider | null {
  if (!cfg.apiKey.trim()) return null;
  if (cfg.provider === 'gemini') {
    return new GeminiProvider({ ...cfg, model: cfg.model.trim() || 'gemini-2.5-flash' });
  }
  return new OpenAiCompatibleProvider({ ...cfg, model: cfg.model.trim() || 'gpt-4o-mini' });
}
