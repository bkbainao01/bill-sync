/** ประเภทข้อมูลของ golden corpus — ground truth ของแต่ละบิลตัวอย่าง */

export interface GoldenExpected {
  /** ชื่อร้าน/ผู้รับเงิน (null = บิลไม่มีร้านชัดเจน) */
  merchant: string | null;
  /** ยอดรวมสุทธิ (บาท) — null = ไม่มี */
  total: number | null;
  /** วันที่ (YYYY-MM-DD) — null = ไม่มี */
  date: string | null;
  /** VAT (บาท) — null = บิลไม่มี VAT */
  vat: number | null;
  /** รายการสินค้า — null = บิลไม่มีรายการสินค้า (เช่น ใบแจ้งหนี้) */
  items: Array<{ name: string; price: number }> | null;
}

export interface GoldenCase {
  /** id สั้นๆ ใช้ใน report เช่น 'seven-eleven' */
  id: string;
  /** คำอธิบายภาษาไทยสั้นๆ */
  label: string;
  /** ข้อความ OCR ดิบของใบเสร็จ — input ของ OCR pipeline + ใช้วาดรูปตัวอย่าง */
  rawText: string;
  /**
   * response JSON ดิบที่ LLM ควรตอบ (golden reference)
   * ใช้เทสต์ parseLlmResponse แบบ offline และเป็น benchmark ตอนเทียบ prompt/provider
   */
  llmResponse: string;
  /** path รูปใบเสร็จ (relative จาก project root) — ใช้ใน live harness (LLM ต้องเห็นรูป) */
  imagePath: string;
  expected: GoldenExpected;
}
