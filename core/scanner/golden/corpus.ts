import type { GoldenCase } from './types';

/**
 * Golden corpus — ใบเสร็จ/บิลตัวอย่าง (ไทย) พร้อม ground truth
 * ใช้ 3 ทาง:
 *  1. OCR pipeline: rawText → parseOcrText → เทียบ expected
 *  2. LLM parser:  llmResponse → parseLlmResponse → เทียบ expected
 *  3. LLM จริง (live): รูปใน golden/images/ → provider → เทียบ expected
 * เพิ่มเคสใหม่เมื่อเจอใบเสร็จรูปแบบใหม่ — ยิ่งครบ ยิ่งกัน regression ตอนแก้ prompt/provider
 */
export const corpus: GoldenCase[] = [
  {
    id: 'seven-eleven',
    label: 'เซเว่น อีเลฟเว่น — สินค้า 4 รายการ + VAT + เงินทอน',
    rawText: `เซเว่น อีเลฟเว่น สาขา 1392
ใบเสร็จรับเงิน
03/09/2569 14:23:45
แคชเชียร์ 05

โค้ก 1 15.00
ขนมปัง 2 45.00
น้ำเปล่า 1 12.50
คาปูชิโน่ 1 55.00

ภาษีมูลค่าเพิ่ม 7% 8.34
รวมทั้งสิ้น 127.50
รับเงินสด 500.00
เงินทอน 372.50`,
    llmResponse: `{
  "merchant": { "value": "เซเว่น อีเลฟเว่น", "confidence": 0.98 },
  "total": { "value": 127.5, "confidence": 0.99 },
  "date": { "value": "2026-09-03", "confidence": 0.95 },
  "vat": { "value": 8.34, "confidence": 0.9 },
  "items": { "value": [
    { "name": "โค้ก", "price": 15 },
    { "name": "ขนมปัง", "price": 45 },
    { "name": "น้ำเปล่า", "price": 12.5 },
    { "name": "คาปูชิโน่", "price": 55 }
  ], "confidence": 0.9 },
  "summary": "ใบเสร็จเซเว่น อีเลฟเว่น 3 ก.ย. 2569 รวม 127.50 บาท"
}`,
    imagePath: 'golden/images/seven-eleven.png',
    expected: {
      merchant: 'เซเว่น อีเลฟเว่น',
      total: 127.5,
      date: '2026-09-03',
      vat: 8.34,
      items: [
        { name: 'โค้ก', price: 15 },
        { name: 'ขนมปัง', price: 45 },
        { name: 'น้ำเปล่า', price: 12.5 },
        { name: 'คาปูชิโน่', price: 55 },
      ],
    },
  },
  {
    id: 'lotus',
    label: 'โลตัส — สินค้า + ส่วนลด + VAT',
    rawText: `โลตัส สาขารามอินทรา
TAX INVOICE / ใบกำกับภาษี
22/10/2568 18:42

น้ำยาล้างจาน 59.00
ผงซักฟอก 1.5kg 129.00
ข้าวหอมมะลิ 5kg 249.00
ส่วนลด -20.00
รวม 417.00
VAT 7% 27.27
รวมทั้งสิ้น 417.00
เงินสด 500.00
เงินทอน 83.00`,
    llmResponse: `{
  "merchant": { "value": "โลตัส", "confidence": 0.97 },
  "total": { "value": 417, "confidence": 0.99 },
  "date": { "value": "2025-10-22", "confidence": 0.95 },
  "vat": { "value": 27.27, "confidence": 0.9 },
  "items": { "value": [
    { "name": "น้ำยาล้างจาน", "price": 59 },
    { "name": "ผงซักฟอก 1.5kg", "price": 129 },
    { "name": "ข้าวหอมมะลิ 5kg", "price": 249 }
  ], "confidence": 0.85 },
  "summary": "ใบกำกับภาษีโลตัส รวม 417.00 บาท (หักส่วนลด 20 บาท)"
}`,
    imagePath: 'golden/images/lotus.png',
    expected: {
      merchant: 'โลตัส',
      total: 417,
      date: '2025-10-22',
      vat: 27.27,
      items: [
        { name: 'น้ำยาล้างจาน', price: 59 },
        { name: 'ผงซักฟอก 1.5kg', price: 129 },
        { name: 'ข้าวหอมมะลิ 5kg', price: 249 },
      ],
    },
  },
  {
    id: 'mea',
    label: 'การไฟฟ้านครหลวง — ใบแจ้งค่าไฟฟ้า (ไม่มีรายการสินค้า)',
    rawText: `การไฟฟ้านครหลวง
ใบแจ้งค่าไฟฟ้า
งวดที่ 08/2569
เลขที่ผู้ใช้ไฟ 123456789

ค่าไฟฟ้า 728.97
ค่าบริการ 8.19
ค่า Ft 62.84

ภาษีมูลค่าเพิ่ม 7% 56.00
ยอดชำระ 856.00
ครบกำหนดชำระ 25/08/2569`,
    llmResponse: `{
  "merchant": { "value": "การไฟฟ้านครหลวง", "confidence": 0.99 },
  "total": { "value": 856, "confidence": 0.98 },
  "date": { "value": "2026-08-25", "confidence": 0.85 },
  "vat": { "value": 56, "confidence": 0.9 },
  "items": { "value": [
    { "name": "ค่าไฟฟ้า", "price": 728.97 },
    { "name": "ค่าบริการ", "price": 8.19 },
    { "name": "ค่า Ft", "price": 62.84 }
  ], "confidence": 0.85 },
  "summary": "ใบแจ้งค่าไฟฟ้าการไฟฟ้านครหลวง งวด 08/2569 ยอดชำระ 856.00 บาท"
}`,
    imagePath: 'golden/images/mea.png',
    expected: {
      merchant: 'การไฟฟ้านครหลวง',
      total: 856,
      date: '2026-08-25',
      vat: 56,
      items: [
        { name: 'ค่าไฟฟ้า', price: 728.97 },
        { name: 'ค่าบริการ', price: 8.19 },
        { name: 'ค่า Ft', price: 62.84 },
      ],
    },
  },
  {
    id: 'ais',
    label: 'AIS — ใบแจ้งค่าใช้บริการมือถือ + VAT',
    rawText: `AIS
ใบแจ้งค่าใช้บริการ
เลขที่ใบแจ้ง 2026-08-1234
วันที่ใบแจ้ง 15/08/2569
รอบบิล 01/08/2569 - 31/08/2569

ค่าแพ็กเกจมือถือ 399.00
ค่าบริการ 30.00

ภาษีมูลค่าเพิ่ม 7% 30.03
รวมทั้งสิ้น 459.03`,
    llmResponse: `{
  "merchant": { "value": "AIS", "confidence": 0.99 },
  "total": { "value": 459.03, "confidence": 0.98 },
  "date": { "value": "2026-08-15", "confidence": 0.9 },
  "vat": { "value": 30.03, "confidence": 0.9 },
  "items": { "value": [
    { "name": "ค่าแพ็กเกจมือถือ", "price": 399 },
    { "name": "ค่าบริการ", "price": 30 }
  ], "confidence": 0.8 },
  "summary": "ใบแจ้งค่าใช้บริการ AIS รอบบิล ส.ค. 2569 รวม 459.03 บาท"
}`,
    imagePath: 'golden/images/ais.png',
    expected: {
      merchant: 'AIS',
      total: 459.03,
      date: '2026-08-15',
      vat: 30.03,
      items: [
        { name: 'ค่าแพ็กเกจมือถือ', price: 399 },
        { name: 'ค่าบริการ', price: 30 },
      ],
    },
  },
  {
    id: 'restaurant',
    label: 'ร้านอาหาร — วันที่เป็นชื่อเดือนไทย + จำนวน x ราคา',
    rawText: `ครัวคุณยาย
ใบเสร็จรับเงิน
12 ส.ค. 2569 19:30

ข้าวผัดกุ้ง 85.00
ต้มยำกุ้ง 180.00
ไก่ทอด 120.00
น้ำเปล่า 20.00
ข้าวเปล่า 2 20.00

รวมทั้งสิ้น 425.00
เงินสด 500.00
เงินทอน 75.00`,
    llmResponse: `{
  "merchant": { "value": "ครัวคุณยาย", "confidence": 0.98 },
  "total": { "value": 425, "confidence": 0.99 },
  "date": { "value": "2026-08-12", "confidence": 0.95 },
  "vat": { "value": null, "confidence": 0.9 },
  "items": { "value": [
    { "name": "ข้าวผัดกุ้ง", "price": 85 },
    { "name": "ต้มยำกุ้ง", "price": 180 },
    { "name": "ไก่ทอด", "price": 120 },
    { "name": "น้ำเปล่า", "price": 20 },
    { "name": "ข้าวเปล่า", "price": 20 }
  ], "confidence": 0.9 },
  "summary": "ใบเสร็จครัวคุณยาย รวม 425.00 บาท"
}`,
    imagePath: 'golden/images/restaurant.png',
    expected: {
      merchant: 'ครัวคุณยาย',
      total: 425,
      date: '2026-08-12',
      vat: null,
      items: [
        { name: 'ข้าวผัดกุ้ง', price: 85 },
        { name: 'ต้มยำกุ้ง', price: 180 },
        { name: 'ไก่ทอด', price: 120 },
        { name: 'น้ำเปล่า', price: 20 },
        { name: 'ข้าวเปล่า', price: 20 },
      ],
    },
  },
  {
    id: 'amazon-cafe',
    label: 'คาเฟ่ อเมซอน — ไม่มี VAT',
    rawText: `คาเฟ่ อเมซอน สาขาเซ็นทรัล
15/08/2569 10:05

อเมซอนคอฟฟี่ 65.00
ครัวซองต์ 45.00
น้ำส้ม 40.00

รวมทั้งสิ้น 150.00`,
    llmResponse: `{
  "merchant": { "value": "คาเฟ่ อเมซอน", "confidence": 0.97 },
  "total": { "value": 150, "confidence": 0.99 },
  "date": { "value": "2026-08-15", "confidence": 0.95 },
  "vat": { "value": null, "confidence": 0.95 },
  "items": { "value": [
    { "name": "อเมซอนคอฟฟี่", "price": 65 },
    { "name": "ครัวซองต์", "price": 45 },
    { "name": "น้ำส้ม", "price": 40 }
  ], "confidence": 0.9 },
  "summary": "ใบเสร็จคาเฟ่ อเมซอน รวม 150.00 บาท"
}`,
    imagePath: 'golden/images/amazon-cafe.png',
    expected: {
      merchant: 'คาเฟ่ อเมซอน',
      total: 150,
      date: '2026-08-15',
      vat: null,
      items: [
        { name: 'อเมซอนคอฟฟี่', price: 65 },
        { name: 'ครัวซองต์', price: 45 },
        { name: 'น้ำส้ม', price: 40 },
      ],
    },
  },
  {
    id: 'shop-keep',
    label: 'ร้านค้าชำ — ใบเสร็จแบบง่าย ไม่มี VAT/รายการ',
    rawText: `ร้านขายของชำคุณป้า
ใบเสร็จรับเงิน
18/08/68

รวมเป็นเงิน 250.00
รับเงิน 300.00
เงินทอน 50.00`,
    llmResponse: `{
  "merchant": { "value": "ร้านขายของชำคุณป้า", "confidence": 0.97 },
  "total": { "value": 250, "confidence": 0.98 },
  "date": { "value": "2025-08-18", "confidence": 0.9 },
  "vat": { "value": null, "confidence": 0.95 },
  "items": { "value": null, "confidence": 0.9 },
  "summary": "ใบเสร็จร้านขายของชำ รวม 250.00 บาท"
}`,
    imagePath: 'golden/images/shop-keep.png',
    expected: {
      merchant: 'ร้านขายของชำคุณป้า',
      total: 250,
      date: '2025-08-18',
      vat: null,
      items: null,
    },
  },
  {
    id: 'coffee-friend',
    label: 'ร้านกาแฟ — ปี ค.ศ. 2 หลัก (68 → 2568)',
    rawText: `ร้านกาแฟเพื่อน
15/09/68 08:30

อเมริกาโน่ 60.00
ลาเต้ 70.00

รวมทั้งสิ้น 130.00`,
    llmResponse: `{
  "merchant": { "value": "ร้านกาแฟเพื่อน", "confidence": 0.97 },
  "total": { "value": 130, "confidence": 0.99 },
  "date": { "value": "2025-09-15", "confidence": 0.9 },
  "vat": { "value": null, "confidence": 0.95 },
  "items": { "value": [
    { "name": "อเมริกาโน่", "price": 60 },
    { "name": "ลาเต้", "price": 70 }
  ], "confidence": 0.9 },
  "summary": "ใบเสร็จร้านกาแฟเพื่อน รวม 130.00 บาท"
}`,
    imagePath: 'golden/images/coffee-friend.png',
    expected: {
      merchant: 'ร้านกาแฟเพื่อน',
      total: 130,
      date: '2025-09-15',
      vat: null,
      items: [
        { name: 'อเมริกาโน่', price: 60 },
        { name: 'ลาเต้', price: 70 },
      ],
    },
  },
  {
    id: 'true-move',
    label: 'ทรูมูฟ เอช — ใบแจ้งค่าใช้บริการ พ.ศ. (2568)',
    rawText: `ทรูมูฟ เอช
ใบแจ้งค่าใช้บริการ
วันที่ใบแจ้ง 05/12/2568
รอบบิล 01/12/2568 - 31/12/2568

ค่าบริการรายเดือน 299.00
ค่าบริการ 0.00

ภาษีมูลค่าเพิ่ม 7% 20.93
รวมทั้งสิ้น 319.93`,
    llmResponse: `{
  "merchant": { "value": "ทรูมูฟ เอช", "confidence": 0.98 },
  "total": { "value": 319.93, "confidence": 0.98 },
  "date": { "value": "2025-12-05", "confidence": 0.9 },
  "vat": { "value": 20.93, "confidence": 0.9 },
  "items": { "value": [
    { "name": "ค่าบริการรายเดือน", "price": 299 }
  ], "confidence": 0.8 },
  "summary": "ใบแจ้งค่าใช้บริการทรูมูฟ เอช รวม 319.93 บาท"
}`,
    imagePath: 'golden/images/true-move.png',
    expected: {
      merchant: 'ทรูมูฟ เอช',
      total: 319.93,
      date: '2025-12-05',
      vat: 20.93,
      items: [{ name: 'ค่าบริการรายเดือน', price: 299 }],
    },
  },
  {
    id: 'noodle-shop',
    label: 'ร้านก๋วยเตี๋ยว — ทดสอบ parser ทนทานต่อ response ฟอร์แมตเพี้ยน',
    rawText: `ก๋วยเตี๋ยวเรือเจ้าอร่อย
ใบเสร็จรับเงิน
20/08/2569 12:15

ก๋วยเตี๋ยวเรือ 60.00
ลูกชิ้น 20.00
น้ำอัดลม 25.00

รวมทั้งสิ้น 105.00`,
    llmResponse: `นี่คือข้อมูลที่อ่านได้จากใบเสร็จครับ:
\`\`\`json
{
  "merchant": { "value": "ก๋วยเตี๋ยวเรือเจ้าอร่อย", "confidence": 0.96 },
  "total": { "value": 105, "confidence": 0.99 },
  "date": { "value": "2026-08-20", "confidence": 0.95 },
  "vat": { "value": null, "confidence": 0.9 },
  "items": { "value": [
    { "name": "ก๋วยเตี๋ยวเรือ", "price": 60 },
    { "name": "ลูกชิ้น", "price": 20 },
    { "name": "น้ำอัดลม", "price": 25 }
  ], "confidence": 0.9 },
  "summary": "ใบเสร็จร้านก๋วยเตี๋ยวเรือ รวม 105.00 บาท"
}
\`\`\`
หากต้องการข้อมูลเพิ่มเติมแจ้งได้ครับ`,
    imagePath: 'golden/images/noodle-shop.png',
    expected: {
      merchant: 'ก๋วยเตี๋ยวเรือเจ้าอร่อย',
      total: 105,
      date: '2026-08-20',
      vat: null,
      items: [
        { name: 'ก๋วยเตี๋ยวเรือ', price: 60 },
        { name: 'ลูกชิ้น', price: 20 },
        { name: 'น้ำอัดลม', price: 25 },
      ],
    },
  },
  {
    id: 'seven-eleven-long',
    label: 'เซเว่น แบบยาว — 16 รายการ + โปรโมชั่นส่วนลด',
    rawText: `เซเว่น อีเลฟเว่น สาขา 1392
ใบเสร็จรับเงิน
21/09/2569 15:10:22
แคชเชียร์ 07
บาร์โค้ด 8851234567890

โค้ก 1 15.00
ขนมปัง 2 45.00
น้ำเปล่า 1 12.50
คาปูชิโน่ 1 55.00
มันฝรั่งทอด 1 20.00
ช็อกโกแลต 1 25.00
ไอศกรีม 1 39.00
ยาสีฟัน 1 89.00
กระดาษทิชชู่ 1 32.00
สบู่เหลว 1 45.00
ไก่ย่าง 1 49.00
ข้าวเหนียวหมูปิ้ง 1 25.00
น้ำผลไม้ 1 30.00
ลูกอม 1 10.00
ปากกา 1 15.00
สมุด 1 22.00

โปรโมชั่น ลด 5.00
รวมทั้งสิ้น 523.50
รับเงินสด 600.00
เงินทอน 76.50

ภาษีมูลค่าเพิ่ม 7% 34.25
VAT 7% 34.25`,
    llmResponse: `{
  "merchant": { "value": "เซเว่น อีเลฟเว่น", "confidence": 0.98 },
  "total": { "value": 523.5, "confidence": 0.99 },
  "date": { "value": "2026-09-21", "confidence": 0.95 },
  "vat": { "value": 34.25, "confidence": 0.9 },
  "items": { "value": [
    { "name": "โค้ก", "price": 15 },
    { "name": "ขนมปัง", "price": 45 },
    { "name": "น้ำเปล่า", "price": 12.5 },
    { "name": "คาปูชิโน่", "price": 55 },
    { "name": "มันฝรั่งทอด", "price": 20 },
    { "name": "ช็อกโกแลต", "price": 25 },
    { "name": "ไอศกรีม", "price": 39 },
    { "name": "ยาสีฟัน", "price": 89 },
    { "name": "กระดาษทิชชู่", "price": 32 },
    { "name": "สบู่เหลว", "price": 45 },
    { "name": "ไก่ย่าง", "price": 49 },
    { "name": "ข้าวเหนียวหมูปิ้ง", "price": 25 },
    { "name": "น้ำผลไม้", "price": 30 },
    { "name": "ลูกอม", "price": 10 },
    { "name": "ปากกา", "price": 15 },
    { "name": "สมุด", "price": 22 }
  ], "confidence": 0.95 },
  "summary": "ใบเสร็จเซเว่น อีเลฟเว่น 16 รายการ รวม 523.50 บาท (หักโปรโมชั่น 5 บาท)"
}`,
    imagePath: 'golden/images/seven-eleven-long.png',
    expected: {
      merchant: 'เซเว่น อีเลฟเว่น',
      total: 523.5,
      date: '2026-09-21',
      vat: 34.25,
      items: [
        { name: 'โค้ก', price: 15 },
        { name: 'ขนมปัง', price: 45 },
        { name: 'น้ำเปล่า', price: 12.5 },
        { name: 'คาปูชิโน่', price: 55 },
        { name: 'มันฝรั่งทอด', price: 20 },
        { name: 'ช็อกโกแลต', price: 25 },
        { name: 'ไอศกรีม', price: 39 },
        { name: 'ยาสีฟัน', price: 89 },
        { name: 'กระดาษทิชชู่', price: 32 },
        { name: 'สบู่เหลว', price: 45 },
        { name: 'ไก่ย่าง', price: 49 },
        { name: 'ข้าวเหนียวหมูปิ้ง', price: 25 },
        { name: 'น้ำผลไม้', price: 30 },
        { name: 'ลูกอม', price: 10 },
        { name: 'ปากกา', price: 15 },
        { name: 'สมุด', price: 22 },
      ],
    },
  },
  {
    id: 'tax-invoice',
    label: 'ใบกำกับภาษีเต็มรูปแบบ — ที่อยู่บริษัท + ยอดก่อนภาษี + VAT แยก',
    rawText: `บริษัท เอส ดี โปรดักส์ จำกัด
เลขที่ 123/45 ถนนสุขุมวิท กรุงเทพฯ 10110
เลขประจำตัวผู้เสียภาษี 0105555123456
ใบกำกับภาษี/ใบเสร็จรับเงิน
เลขที่ INV-2026-0012 วันที่ 05/10/2569

โต๊ะทำงาน 1 2,500.00
เก้าอี้ 1 1,200.00
โคมไฟ 2 900.00
ส่วนลด -200.00
ยอดก่อนภาษี 5,300.00
ภาษีมูลค่าเพิ่ม 7% 371.00
รวมทั้งสิ้น 5,671.00`,
    llmResponse: `{
  "merchant": { "value": "บริษัท เอส ดี โปรดักส์ จำกัด", "confidence": 0.98 },
  "total": { "value": 5671, "confidence": 0.99 },
  "date": { "value": "2026-10-05", "confidence": 0.95 },
  "vat": { "value": 371, "confidence": 0.95 },
  "items": { "value": [
    { "name": "โต๊ะทำงาน", "price": 2500 },
    { "name": "เก้าอี้", "price": 1200 },
    { "name": "โคมไฟ", "price": 900 }
  ], "confidence": 0.95 },
  "summary": "ใบกำกับภาษี บริษัท เอส ดี โปรดักส์ จำกัด รวม 5,671.00 บาท (รวม VAT 371.00)"
}`,
    imagePath: 'golden/images/tax-invoice.png',
    expected: {
      merchant: 'บริษัท เอส ดี โปรดักส์ จำกัด',
      total: 5671,
      date: '2026-10-05',
      vat: 371,
      items: [
        { name: 'โต๊ะทำงาน', price: 2500 },
        { name: 'เก้าอี้', price: 1200 },
        { name: 'โคมไฟ', price: 900 },
      ],
    },
  },
  {
    id: 'water-bill',
    label: 'การประปานครหลวง — บิลค่าน้ำ (รายการ + VAT + ยอดรวมเงินทั้งสิ้น)',
    rawText: `การประปานครหลวง
ใบแจ้งค่าน้ำประปา
เลขที่ผู้ใช้น้ำ 1234567
งวดที่ 08/2569

ค่าน้ำประปา 120.34
ค่าบำรุงรักษามิเตอร์ 20.00

ภาษีมูลค่าเพิ่ม 7% 9.82
รวมเงินทั้งสิ้น 150.16
ครบกำหนดชำระ 31/08/2569`,
    llmResponse: `{
  "merchant": { "value": "การประปานครหลวง", "confidence": 0.99 },
  "total": { "value": 150.16, "confidence": 0.98 },
  "date": { "value": "2026-08-31", "confidence": 0.85 },
  "vat": { "value": 9.82, "confidence": 0.9 },
  "items": { "value": [
    { "name": "ค่าน้ำประปา", "price": 120.34 },
    { "name": "ค่าบำรุงรักษามิเตอร์", "price": 20 }
  ], "confidence": 0.85 },
  "summary": "ใบแจ้งค่าน้ำการประปานครหลวง งวด 08/2569 รวม 150.16 บาท"
}`,
    imagePath: 'golden/images/water-bill.png',
    expected: {
      merchant: 'การประปานครหลวง',
      total: 150.16,
      date: '2026-08-31',
      vat: 9.82,
      items: [
        { name: 'ค่าน้ำประปา', price: 120.34 },
        { name: 'ค่าบำรุงรักษามิเตอร์', price: 20 },
      ],
    },
  },
  {
    id: 'atm-withdrawal',
    label: 'ตู้ ATM ธนาคารกรุงไทย — ใบเสร็จถอนเงิน (ยอดคงเหลือต้องไม่หลุดเป็นรายการ/ยอดรวม)',
    rawText: `ธนาคารกรุงไทย จำกัด (มหาชน)
ใบเสร็จถอนเงินสด
31/08/2569 14:45:26
เครื่อง ATM รหัส 1234

บัญชีเลขที่ xxxxxxxx1234
ยอดถอน 2,000.00
ค่าธรรมเนียม 10.00
รวม 2,010.00
ยอดคงเหลือ 5,432.10`,
    llmResponse: `{
  "merchant": { "value": "ธนาคารกรุงไทย จำกัด (มหาชน)", "confidence": 0.98 },
  "total": { "value": 2010, "confidence": 0.95 },
  "date": { "value": "2026-08-31", "confidence": 0.95 },
  "vat": { "value": null, "confidence": 0.95 },
  "items": { "value": [
    { "name": "ยอดถอน", "price": 2000 },
    { "name": "ค่าธรรมเนียม", "price": 10 }
  ], "confidence": 0.85 },
  "summary": "ใบเสร็จถอนเงินสด ธนาคารกรุงไทย 31 ส.ค. 2569 รวม 2,010.00 บาท"
}`,
    imagePath: 'golden/images/atm-withdrawal.png',
    expected: {
      merchant: 'ธนาคารกรุงไทย จำกัด (มหาชน)',
      total: 2010,
      date: '2026-08-31',
      vat: null,
      items: [
        { name: 'ยอดถอน', price: 2000 },
        { name: 'ค่าธรรมเนียม', price: 10 },
      ],
    },
  },
  {
    id: 'coffee-long',
    label: 'ร้านกาแฟ แบบยาว — 10 รายการ ชื่อสินค้าภาษาอังกฤษ + ออเดอร์ #',
    rawText: `กาแฟสดภูเขียว ฟาร์ม
20/09/2569 09:15:44
ออเดอร์ #042

Iced Americano 75.00
Iced Latte 85.00
Espresso 65.00
Cappuccino 85.00
Matcha Latte 95.00
Hot Chocolate 75.00
Croissant 55.00
Banana Bread 45.00
Blueberry Muffin 55.00
Orange Juice 70.00

รวมทั้งสิ้น 705.00
เงินสด 1,000.00
เงินทอน 295.00`,
    llmResponse: `{
  "merchant": { "value": "กาแฟสดภูเขียว ฟาร์ม", "confidence": 0.97 },
  "total": { "value": 705, "confidence": 0.99 },
  "date": { "value": "2026-09-20", "confidence": 0.95 },
  "vat": { "value": null, "confidence": 0.95 },
  "items": { "value": [
    { "name": "Iced Americano", "price": 75 },
    { "name": "Iced Latte", "price": 85 },
    { "name": "Espresso", "price": 65 },
    { "name": "Cappuccino", "price": 85 },
    { "name": "Matcha Latte", "price": 95 },
    { "name": "Hot Chocolate", "price": 75 },
    { "name": "Croissant", "price": 55 },
    { "name": "Banana Bread", "price": 45 },
    { "name": "Blueberry Muffin", "price": 55 },
    { "name": "Orange Juice", "price": 70 }
  ], "confidence": 0.95 },
  "summary": "ใบเสร็จกาแฟสดภูเขียว ฟาร์ม 10 รายการ รวม 705.00 บาท"
}`,
    imagePath: 'golden/images/coffee-long.png',
    expected: {
      merchant: 'กาแฟสดภูเขียว ฟาร์ม',
      total: 705,
      date: '2026-09-20',
      vat: null,
      items: [
        { name: 'Iced Americano', price: 75 },
        { name: 'Iced Latte', price: 85 },
        { name: 'Espresso', price: 65 },
        { name: 'Cappuccino', price: 85 },
        { name: 'Matcha Latte', price: 95 },
        { name: 'Hot Chocolate', price: 75 },
        { name: 'Croissant', price: 55 },
        { name: 'Banana Bread', price: 45 },
        { name: 'Blueberry Muffin', price: 55 },
        { name: 'Orange Juice', price: 70 },
      ],
    },
  },
  {
    id: 'ptt-fuel',
    label: 'ปตท. สถานีบริการน้ำมัน — เลขอ็อกเทน 95 กับจำนวน, หัวจ่าย, VAT',
    rawText: `ปตท. สาขาพหลโยธิน 62
สถานีบริการน้ำมัน
ใบเสร็จรับเงิน
12/09/2569 16:20:11
หัวจ่าย 06

น้ำมันเบนซิน 95 500.00
น้ำมันดีเซล 400.00

รวมทั้งสิ้น 900.00
บัตรเครดิต xxxx 1234
VAT 7% 58.87`,
    llmResponse: `{
  "merchant": { "value": "ปตท.", "confidence": 0.98 },
  "total": { "value": 900, "confidence": 0.99 },
  "date": { "value": "2026-09-12", "confidence": 0.95 },
  "vat": { "value": 58.87, "confidence": 0.9 },
  "items": { "value": [
    { "name": "น้ำมันเบนซิน", "price": 500 },
    { "name": "น้ำมันดีเซล", "price": 400 }
  ], "confidence": 0.9 },
  "summary": "ใบเสร็จปตท. สถานีบริการน้ำมัน รวม 900.00 บาท (รวม VAT 58.87)"
}`,
    imagePath: 'golden/images/ptt-fuel.png',
    expected: {
      merchant: 'ปตท.',
      total: 900,
      date: '2026-09-12',
      vat: 58.87,
      items: [
        { name: 'น้ำมันเบนซิน', price: 500 },
        { name: 'น้ำมันดีเซล', price: 400 },
      ],
    },
  },
];
