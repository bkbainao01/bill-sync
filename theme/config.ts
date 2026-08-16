import { config as baseConfig } from '@gluestack-ui/config';
import {
  BRAND,
  BRAND_DEEP,
  BRAND_SOFT,
  EXPENSE,
  INK,
  INCOME,
  INK_DARK,
  PAPER,
  PAPER_DARK,
  SEAM,
  SLATE,
} from './tokens';

/**
 * gluestack config ที่ปรับ token ของ default config (กลายเป็นแบรนด์ของเรา)
 * — ใช้ชื่อ token เดิมทั้งหมด (component theme อ้างอิงตามชื่อ) เปลี่ยนแค่ค่า
 * ทำให้ทุก $token ที่ใช้ในแอปเปลี่ยนสีตามโดยไม่ต้องแก้ component
 * (โครงสร้างเดียวกับที่ @gluestack-ui/config สร้างเอง: { aliases, tokens, components })
 */

// แรมป์ teal (primary) — แทน blue default
const TEAL_RAMP: Record<string, string> = {
  primary0: '#F2F8F6',
  primary50: BRAND_SOFT,
  primary100: '#C5E4DA',
  primary200: '#93CEBD',
  primary300: '#5CB39C',
  primary400: '#2E967D',
  primary500: BRAND,
  primary600: BRAND_DEEP,
  primary700: '#09493D',
  primary800: '#07382F',
  primary900: '#052A23',
  primary950: '#031D18',
};

const COLOR_OVERRIDES: Record<string, string> = {
  // แบรนด์ + info (link/emphasis)
  ...TEAL_RAMP,
  info50: '#F2F8F6',
  info100: BRAND_SOFT,
  info200: '#C5E4DA',
  info300: '#5CB39C',
  info400: '#2E967D',
  info500: BRAND,
  info600: BRAND_DEEP,
  info700: '#09493D',
  info800: '#07382F',

  // กระดาษ/หมึก (โหมดสว่าง)
  backgroundLight50: PAPER,
  backgroundLight100: '#F1EFE9',
  borderLight100: SEAM,
  borderLight200: '#DDD8CC',
  textLight400: SLATE,
  textLight500: '#5C5850',
  textLight600: '#4A463E',
  textLight700: '#3A3731',
  textLight800: '#2E2B26',
  textLight900: INK,
  textLight950: '#1B1915',

  // กระดาษ/หมึก (โหมดมืด)
  backgroundDark950: PAPER_DARK,
  backgroundDark900: '#1B1813',
  backgroundDark800: '#221E18',
  backgroundDark0: '#1F1B16',
  borderDark100: '#2E2A23',
  borderDark200: '#38342C',
  textDark300: '#8A8479',
  textDark400: '#9C968B',
  textDark500: '#ABA59A',
  textDark600: '#BAB4A9',
  textDark700: '#C9C3B8',
  textDark800: '#D6D1C7',
  textDark900: INK_DARK,
  textDark950: '#F5F2EB',

  // ความหมาย (บวก/ลบ)
  success500: INCOME,
  success600: '#286B43',
  success700: '#215838',
  success800: '#1B472E',
  error500: EXPENSE,
  error600: '#9E3A29',
  error700: '#8C3222',
};

type BaseConfig = typeof baseConfig;
interface TokenBag {
  colors?: Record<string, string>;
}

const baseTokens = (baseConfig as unknown as { tokens?: TokenBag }).tokens;

// โครงสร้าง runtime เดียวกับที่ @gluestack-ui/config สร้าง — cast ผ่าน type เพราะ
// เราตั้งใจเปลี่ยนแค่ค่า token (ชื่อ/รูปร่างไม่เปลี่ยน)
export const config = {
  ...baseConfig,
  tokens: {
    ...(baseTokens ?? {}),
    colors: {
      ...(baseTokens?.colors ?? {}),
      ...COLOR_OVERRIDES,
    },
  },
} as BaseConfig;
