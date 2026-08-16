import { Platform } from 'react-native';
import { Color } from 'expo-router';
import { BRAND, INK, PAPER, SEAM, SLATE } from './tokens';

/**
 * สี semantic — ฝั่ง native (iOS/Android) ใช้สีระบบของแต่ละ platform ให้แอป
 * กลมกลืนกับ OS (เปลี่ยนตาม light/dark + อุปกรณ์อัตโนมัติ) ส่วน web ใช้ hex
 * แบรนด์ของเรา (theme/tokens.ts) เป็น fallback
 *
 * หมายเหตุ: สีแบรนด์ (teal/paper/ink) ตั้งใจใช้ hex เดียวกันทุก platform —
 * เป็น identity ของแอป ไม่อิงระบบ
 */
export const colors = {
  /** ข้อความหลัก */
  label: Platform.select({
    ios: Color.ios.label,
    android: Color.android.dynamic.onSurface,
    default: INK,
  })!,
  /** ข้อความรอง/คำอธิบาย */
  secondaryLabel: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: SLATE,
  })!,
  /** เส้นคั่น/ขอบ */
  separator: Platform.select({
    ios: Color.ios.separator,
    android: Color.android.dynamic.outlineVariant,
    default: SEAM,
  })!,
  /** พื้นหลังระบบ (header/tab bar) */
  systemBackground: Platform.select({
    ios: Color.ios.systemBackground,
    android: Color.android.dynamic.surface,
    default: PAPER,
  })!,
  /** สี accent — ตั้งใจใช้แบรนด์ teal เดียวกันทุก platform (identity ของแอป) */
  tint: BRAND,
};

export type SemanticColor = keyof typeof colors;
