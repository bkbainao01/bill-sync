import { describe, expect, it } from 'vitest';
import { extractDate, extractMerchant, extractItems, extractTotal, extractVat, parseOcrText } from './ocr';

const SEVEN_ELEVEN = `
7-Eleven สาขาสุขุมวิท 39
ขายปลีก
18/08/2568 14:32
--------------------------------
นมสด ตรามะลิ         15.00
บะหมี่กึ่งสำเร็จรูป      12.50
กาแฟเย็น             45.00
--------------------------------
รวมทั้งสิ้น            72.50
เงินสด              100.00
เงินทอน              27.50
VAT 7%              4.74
`;

const MEA_BILL = `
การไฟฟ้านครหลวง
ใบแจ้งค่าไฟฟ้า
งวดวันที่ 15 ส.ค. 2568
เลขผู้ใช้ไฟฟ้า 1234567890
--------------------------------
ค่ากระแสไฟฟ้า       700.00
ค่าบริการ            38.22
ภาษีมูลค่าเพิ่ม      51.68
รวมทั้งสิ้น          789.90
`;

describe('extractDate', () => {
  it('วันที่แบบไทย 18/08/2568 (พ.ศ.) → ค.ศ.', () => {
    expect(extractDate(SEVEN_ELEVEN)).toBe('2025-08-18');
  });

  it('วันที่แบบชื่อเดือนไทย "15 ส.ค. 2568"', () => {
    expect(extractDate(MEA_BILL)).toBe('2025-08-15');
  });

  it('ปี 2 หลัก (68 → 2568)', () => {
    expect(extractDate('ใบเสร็จ 12/01/68')).toBe('2025-01-12');
  });

  it('ไม่มีวันที่ → null', () => {
    expect(extractDate('รวมทั้งสิ้น 100 บาท')).toBeNull();
  });
});

describe('extractTotal', () => {
  it('อ่าน "รวมทั้งสิ้น" บรรทัดสุดท้าย', () => {
    expect(extractTotal(SEVEN_ELEVEN)).toBe(72.5);
  });

  it('อ่าน MEA bill (รวมทั้งสิ้น 789.90)', () => {
    expect(extractTotal(MEA_BILL)).toBe(789.9);
  });

  it('ไม่มี total → fallback ตัวเลขสุดท้าย', () => {
    expect(extractTotal('บางรายการ\n150')).toBe(150);
  });
});

describe('extractVat', () => {
  it('ข้าม "VAT 7%" แล้วเอายอด VAT', () => {
    expect(extractVat(SEVEN_ELEVEN)).toBe(4.74);
  });

  it('"ภาษีมูลค่าเพิ่ม 51.68"', () => {
    expect(extractVat(MEA_BILL)).toBe(51.68);
  });
});

describe('extractMerchant', () => {
  it('ได้บรรทัดแรกที่ดูเป็นชื่อร้าน (ตัด สาขา ทิ้ง)', () => {
    expect(extractMerchant(SEVEN_ELEVEN)).toBe('7-Eleven');
    expect(extractMerchant(MEA_BILL)).toBe('การไฟฟ้านครหลวง');
  });

  it('ข้ามหัวข้อ เช่น "ใบแจ้งค่าไฟฟ้า"', () => {
    const merchant = extractMerchant(MEA_BILL);
    expect(merchant).not.toContain('ใบแจ้ง');
  });
});

describe('extractItems', () => {
  it('แยกรายการ ชื่อ + ราคา', () => {
    const items = extractItems(SEVEN_ELEVEN);
    expect(items).not.toBeNull();
    expect(items!.length).toBe(3);
    expect(items![0]).toEqual({ name: 'นมสด ตรามะลิ', price: 15 });
    expect(items![2]).toEqual({ name: 'กาแฟเย็น', price: 45 });
  });

  it('ข้ามบรรทัดรวม (รวมทั้งสิ้น/เงินสด/ทอน)', () => {
    const items = extractItems(SEVEN_ELEVEN);
    expect(items!.some((i) => i.name.includes('รวมทั้งสิ้น'))).toBe(false);
    expect(items!.some((i) => i.name.includes('เงินทอน'))).toBe(false);
  });

  it('บิลค่าไฟได้รายการค่าบริการ (ไม่รวม VAT/รวมทั้งสิ้น)', () => {
    const items = extractItems(MEA_BILL);
    expect(items).not.toBeNull();
    expect(items!.map((i) => i.name)).toEqual(['ค่ากระแสไฟฟ้า', 'ค่าบริการ']);
    expect(items!.some((i) => i.name.includes('ภาษี'))).toBe(false);
    expect(items!.some((i) => i.name.includes('รวมทั้งสิ้น'))).toBe(false);
  });
});

describe('parseOcrText', () => {
  it('รวมผลเป็น LlmExtraction (source ocr)', () => {
    const r = parseOcrText(SEVEN_ELEVEN);
    expect(r.merchant.value).toBe('7-Eleven');
    expect(r.total.value).toBe(72.5);
    expect(r.date.value).toBe('2025-08-18');
    expect(r.total.confidence).toBe(0.85);
    expect(r.items.value!.length).toBe(3);
  });

  it('ข้อความเปล่า → ทุก field null', () => {
    const r = parseOcrText('');
    expect(r.total.value).toBeNull();
    expect(r.merchant.value).toBeNull();
  });
});
