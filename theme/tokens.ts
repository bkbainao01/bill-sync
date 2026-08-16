import { Platform } from 'react-native';

/**
 * Design tokens — "Thermal slip & bank ink"
 * ภาษาภาพจากใบเสร็จไทย: กระดาษอุ่นๆ + หมึกดำ + ตัวเลขแบบเครื่องพิมพ์เงินสด (mono)
 * แหล่งเดียวของสี/ฟอนต์ที่ใช้ hardcode ใน components (กันกระจัดกระจาย)
 */

/** สีแบรนด์หลัก — หมึกเขียวเข้ม (แทน cyan #0891b2 เดิม) */
export const BRAND = '#0B6E5A';
export const BRAND_DEEP = '#09594A';
export const BRAND_SOFT = '#E6F2EE'; // พื้น tint อ่อน (เช่น chip เลือก)

/** กระดาษ/หมึก */
export const PAPER = '#F6F5F1'; // พื้นหลังหน้าจอ — กระดาษ thermal
export const INK = '#221F1B'; // ข้อความหลัก — หมึกดำอุ่น
export const SLATE = '#6F6A62'; // ข้อความรอง/คำอธิบาย — เทาแบบพิมพ์
export const SEAM = '#E7E3DA'; // เส้นคั่น/ขอบ — รอยพับกระดาษ

/** ยอดบวก/ลบ */
export const INCOME = '#2F7D4F';
export const EXPENSE = '#B3422F';

/** โหมดมืด */
export const PAPER_DARK = '#171410';
export const CARD_DARK = '#1F1B16';
export const INK_DARK = '#EDE9E1';
export const SLATE_DARK = '#9C968B';
export const SEAM_DARK = '#2E2A23';
export const BRAND_DARK = '#3FB59B';

/** ฟอนต์ — ใช้บน web (Google Fonts ใน app/+html.tsx); native fallback เป็นระบบ */
const WEB_FONT = (family: string): string | undefined =>
  Platform.OS === 'web' ? `${family}, 'IBM Plex Sans Thai', -apple-system, sans-serif` : undefined;

/** ตัวอักษรหลัก (Thai) */
export const FONT_BODY = WEB_FONT("'IBM Plex Sans Thai'");
/** ยอดเงิน — mono แบบพิมพ์ใบเสร็จ */
export const FONT_MONO = WEB_FONT("'IBM Plex Mono'");
