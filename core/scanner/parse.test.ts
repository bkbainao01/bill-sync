import { describe, expect, it } from 'vitest';
import { extractionToBill, parseLlmResponse, suggestedTransactionFromBill } from './parse';
import { LLM_PROMPT } from './parse';

describe('parseLlmResponse', () => {
  it('parse JSON ปกติ', () => {
    const raw = JSON.stringify({
      merchant: { value: '7-Eleven', confidence: 0.95 },
      total: { value: 350.5, confidence: 0.98 },
      date: { value: '2026-08-15', confidence: 0.9 },
      vat: { value: 22.94, confidence: 0.85 },
      items: { value: [{ name: 'กาแฟ', price: 350.5 }], confidence: 0.9 },
      summary: 'ร้านสะดวกซื้อ',
    });
    const r = parseLlmResponse(raw);
    expect(r).not.toBeNull();
    expect(r!.merchant.value).toBe('7-Eleven');
    expect(r!.total.value).toBe(350.5);
    expect(r!.date.value).toBe('2026-08-15');
    expect(r!.vat.value).toBe(22.94);
    expect(r!.items.value).toEqual([{ name: 'กาแฟ', price: 350.5 }]);
    expect(r!.summary).toBe('ร้านสะดวกซื้อ');
  });

  it('รองรับ code fence ```json``` และข้อความแทรก', () => {
    const raw = 'นี่คือผลลัพธ์:\n```json\n{"merchant":{"value":"Lotus","confidence":0.8},"total":{"value":120,"confidence":0.9},"date":{"value":"2026-07-01","confidence":1},"vat":{"value":0,"confidence":0.5},"items":{"value":null,"confidence":0}}\n```\nจบ';
    const r = parseLlmResponse(raw);
    expect(r).not.toBeNull();
    expect(r!.merchant.value).toBe('Lotus');
    expect(r!.total.value).toBe(120);
  });

  it('รับ total เป็น string พร้อมเครื่องหมายสกุลเงิน', () => {
    const raw = '{"merchant":{"value":null,"confidence":0},"total":{"value":"฿ 1,234.56","confidence":0.99},"date":{"value":null,"confidence":0},"vat":{"value":null,"confidence":0},"items":{"value":null,"confidence":0}}';
    const r = parseLlmResponse(raw);
    expect(r!.total.value).toBe(1234.56);
  });

  it('แปลงวันที่ พ.ศ./timestamp เป็น YYYY-MM-DD', () => {
    const raw = '{"merchant":{"value":"PEA","confidence":1},"total":{"value":800,"confidence":1},"date":{"value":"2026-08-15T00:00:00Z","confidence":1},"vat":{"value":null,"confidence":0},"items":{"value":null,"confidence":0}}';
    const r = parseLlmResponse(raw);
    expect(r!.date.value).toBe('2026-08-15');
  });

  it('clamp confidence ให้อยู่ใน 0..1', () => {
    const raw = '{"merchant":{"value":"x","confidence":2.5},"total":{"value":1,"confidence":-1},"date":{"value":"2026-01-01","confidence":0},"vat":{"value":null,"confidence":0},"items":{"value":null,"confidence":0}}';
    const r = parseLlmResponse(raw);
    expect(r!.merchant.confidence).toBe(1);
    expect(r!.total.confidence).toBe(0);
  });

  it('คืน null สำหรับ garbage ที่ไม่มี JSON', () => {
    expect(parseLlmResponse('')).toBeNull();
    expect(parseLlmResponse('ขอโทษ อ่านไม่เจอใบเสร็จ')).toBeNull();
    expect(parseLlmResponse('{invalid json')).toBeNull();
  });

  it('ค่า field ที่ model ตอบแบบ flat (ไม่มี confidence) ก็รับได้', () => {
    const raw = '{"merchant":"Makro","total":500,"date":"2026-08-01","vat":null,"items":null}';
    const r = parseLlmResponse(raw);
    expect(r!.merchant.value).toBe('Makro');
    expect(r!.total.value).toBe(500);
    expect(r!.merchant.confidence).toBe(0);
  });

  it('prompt บอกให้ตอบ JSON อย่างชัดเจน', () => {
    expect(LLM_PROMPT).toContain('JSON');
    expect(LLM_PROMPT).toContain('confidence');
  });
});

describe('extractionToBill + suggestedTransactionFromBill', () => {
  it('map ผลการอ่าน → Bill (status scanned) + transaction ที่แนะนำ', () => {
    const extraction = parseLlmResponse(
      JSON.stringify({
        merchant: { value: 'ร้านกาแฟ', confidence: 0.9 },
        total: { value: 99.5, confidence: 0.95 },
        date: { value: '2026-08-15', confidence: 0.8 },
        vat: { value: 6.51, confidence: 0.7 },
        items: { value: [{ name: 'Americano', price: 99.5 }], confidence: 0.9 },
        summary: 'คาเฟ่',
      }),
    )!;

    const bill = extractionToBill(extraction, { uri: 'data:image/jpeg;base64,xxx', name: 'rec.jpg' });
    expect(bill.status).toBe('scanned');
    expect(bill.transactionId).toBeNull();
    expect(bill.imageUri).toBe('data:image/jpeg;base64,xxx');
    expect(bill.extracted.merchant!.value).toBe('ร้านกาแฟ');
    expect(bill.extracted.total!.value).toBe(99.5);
    expect(bill.extracted.items!.value).toEqual([{ name: 'Americano', price: 99.5 }]);

    const suggested = suggestedTransactionFromBill(bill);
    expect(suggested.type).toBe('expense');
    expect(suggested.amountSatang).toBe(9950);
    expect(suggested.date).toBe('2026-08-15');
    expect(suggested.merchant).toBe('ร้านกาแฟ');
  });

  it('total หาย → amountSatang = 0 และ date ตกเป็นวันนี้', () => {
    const extraction = parseLlmResponse(
      '{"merchant":{"value":null,"confidence":0},"total":{"value":null,"confidence":0},"date":{"value":null,"confidence":0},"vat":{"value":null,"confidence":0},"items":{"value":null,"confidence":0}}',
    )!;
    const bill = extractionToBill(extraction, { uri: 'x' });
    const suggested = suggestedTransactionFromBill(bill);
    expect(suggested.amountSatang).toBe(0);
    expect(suggested.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(suggested.merchant).toBeNull();
  });
});
