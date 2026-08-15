import type { Bill } from '../entities/bill';
import type { TransactionType } from '../entities/transaction';

export interface ImageSource {
  /** data URL (web: base64) หรือ URL ของรูป */
  uri: string;
  name?: string;
  mimeType?: string;
}

export interface ExtractedItem {
  name: string;
  price: number;
}

/**
 * โครงสร้าง JSON ที่ LLM ต้องตอบ — ทุก field มีค่า + confidence (0..1)
 * ใช้ schema นี้บังคับใน prompt และ normalize ใน parse.ts
 */
export interface LlmExtraction {
  merchant: { value: string | null; confidence: number };
  total: { value: number | null; confidence: number };
  date: { value: string | null; confidence: number };
  vat: { value: number | null; confidence: number };
  items: { value: ExtractedItem[] | null; confidence: number };
  /** เหตุผลสั้นๆ ของ AI (แสดงให้ผู้ใช้เห็นได้) */
  summary?: string;
}

export interface ScanResult {
  bill: Bill;
  suggested: {
    type: TransactionType;
    amountSatang: number;
    date: string;
    merchant: string | null;
    note: string | null;
  };
}

/**
 * Adapter ที่อ่านบิลจากรูป → โครงสร้าง JSON
 * Platform ไหนก็ได้: vision LLM (cloud), OCR+rule (offline) — business logic ไม่รู้
 */
export interface ScannerAdapter {
  readonly id: string;
  readonly label: string;
  /** ตั้งค่า API key ครบหรือยัง (ถ้ายัง → ต้องไปตั้งค่าก่อน) */
  isConfigured(): boolean;
  scan(image: ImageSource): Promise<LlmExtraction>;
}
