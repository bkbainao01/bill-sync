export type BillStatus = 'scanned' | 'reviewing' | 'confirmed' | 'rejected';

export interface ExtractedField<T = unknown> {
  value: T | null;
  /** confidence 0..1 */
  confidence: number;
  source: 'llm' | 'ocr' | 'manual';
}

export interface BillExtracted {
  merchant?: ExtractedField<string>;
  total?: ExtractedField<number>;
  date?: ExtractedField<string>;
  vat?: ExtractedField<number>;
  items?: ExtractedField<Array<{ name: string; price: number }>>;
  /** สรุปสั้นๆ ที่ AI อ่านเจอ (แสดงในหน้า review) */
  summary?: ExtractedField<string>;
}

export interface Bill {
  id: string;
  /** path/uri ของรูป (web: object URL / File, native: camera roll) */
  imageUri: string | null;
  /** ข้อความดิบจาก OCR */
  rawText: string | null;
  /** JSON ที่ AI อ่านออกมา */
  extracted: BillExtracted;
  status: BillStatus;
  /** Transaction ที่สร้างจากบิลนี้ (หลัง confirm) */
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
