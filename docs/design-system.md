# Design System — "Thermal slip & bank ink"

ภาษาภาพของ BillSync หยิบมาจาก**ใบเสร็จไทย** (ใบเสร็จรับเงิน/สลิป/ใบแจ้งหนี้):
กระดาษอุ่นๆ ตัวอักษรหมึกดำ ตัวเลขแบบเครื่องพิมพ์เงินสด (mono) เส้นประคั่น label-ยอด
และจังหวะ "รวมทั้งสิ้น" ที่ก้นใบเสร็จ — ตัวเลขคือพระเอกของแอปนี้

## Tokens (`theme/tokens.ts` — แหล่งเดียวของสี/ฟอนต์)

| role | light | dark |
|---|---|---|
| paper (พื้นหลัง) | `#F6F5F1` | `#171410` |
| card | `#FFFFFF` | `#1F1B16` |
| ink (ข้อความหลัก) | `#221F1B` | `#EDE9E1` |
| slate (ข้อความรอง) | `#6F6A62` | `#9C968B` |
| seam (เส้นคั่น/ขอบ) | `#E7E3DA` | `#2E2A23` |
| **brand (teal หมึก)** | `#0B6E5A` | `#3FB59B` |
| income | `#2F7D4F` | — |
| expense/error | `#B3422F` | — |

- **Brand teal `#0B6E5A`** แทนที่ cyan `#0891b2` เดิม (template default) — อ่านเป็นหมึก/ตรา
  ประทับของธนาคาร ไม่ใช่ cyan โฆษณา
- ฟอนต์: **IBM Plex Sans Thai** (ตัวอักษรหลัก) + **IBM Plex Mono** (ยอดเงิน — tabular,
  แบบพิมพ์ใบเสร็จ) — ครอบครัว Plex เดียวกัน โหลดบน web ผ่าน Google Fonts
  (`app/+html.tsx`); native fallback เป็นฟอนต์ระบบ

## วิธีใช้

- gluestack token: ค่าข้างบนถูก map ลง `theme/config.ts` (override token ของ
  `@gluestack-ui/config` ด้วยชื่อเดิม) — component ที่ใช้ `$textLight400`, `$primary500`,
  `$backgroundLight50` ฯลฯ เปลี่ยนสีตามอัตโนมัติ รวม dark mode
- สีที่ hardcode ใน component ใช้ import จาก `@/theme/tokens` (BRAND, INK, SEAM, FONT_MONO …)
  — ห้าม hardcode hex ซ้ำที่อื่น
- ยอดเงินที่ต้องการลุค "พิมพ์" ใส่ `fontFamily: FONT_MONO` + `fontVariant: ['tabular-nums']`

## Signature — แถบ "รวมทั้งสิ้น"

องค์ประกอบเดียวที่แอปจำได้ (ที่เหลือเงียบ): `components/MonthPicker.tsx` เมื่อรับ
`totalSatang` จะวาดหัวแถบแบบใบเสร็จ — เดือนซ้าย + **เส้นประคั่น** + ยอดรายจ่ายเดือน
(mono, bold, ใหญ่) + **เส้นหมึกหนาใต้แถบ** (2px INK) เหมือนก้นใบเสร็จ

- หน้ารายการ: `MonthPicker totalSatang={monthExpense}` (ยอดรายจ่ายเดือนที่เลือก)
- หน้าสรุป: ไม่ส่ง totalSatang (SummaryCards แสดงยอดอยู่แล้ว) → แถบเหลือแค่เดือน + เส้นใต้

## Native-feel (iOS/Android — building-native-ui guidelines)

- **Semantic colors** `theme/colors.ts` — label/secondaryLabel/separator/systemBackground
  ใช้ `Color` จาก expo-router (iOS: UIKit colors, Android: Material dynamic) ปรับตามระบบ
  อัตโนมัติ; web fallback = hex แบรนด์ สีแบรนด์ (teal/paper/ink) ตั้งใจใช้ hex เดียวกันทุก
  platform (identity ไม่เปลี่ยน)
- **Haptics** `lib/haptics.ts` — expo-haptics แบบ iOS/Android เท่านั้น (web: no-op);
  ใส่ที่ action สำคัญ: บันทึกรายการ, ยืนยันบิล, ปฏิเสธบิล, บันทึกบิลประจำ
- **Scroll/safe-area** — หน้าจอหลักเป็น ScrollView/FlatList คู่ `contentInsetAdjustmentBehavior="automatic"`
  (settings, transaction form, bill review, รายการ); header/tab bar ใช้พื้นหลัง semantic
- **Animation** — reanimated `FadeIn/FadeOut` กับยอด "รวมทั้งสิ้น" ตอนเปลี่ยนเดือน
  (จังหวะเดียวกับเครื่องคิดเงินสด); เคารพ prefers-reduced-motion
- **selectable** — ยอดเงิน/วันที่/ข้อความที่อาจคัดลอก ใส่ `selectable`
- **ไอคอน** — ใช้ Ionicons (cross-platform: web/Android/iOS) แทน SF Symbols เพราะแอปต้อง
  ทำงานครบทุก platform; ถ้าทำ iOS-only แยกค่อยพิจารณา `expo-image sf:`

## หลักปฏิบัติ

- ใช้จังหวะที่กล้าหนึ่งจุด (แถบรวมทั้งสิ้น) ที่เหลือเรียบ — ตัวเลข mono + เส้น seam บางๆ
- การ์ดแบบ "สลิป": ขอบ hairline (`SEAM`) แทน shadow หนัก (SummaryCards)
- เคารพ accessibility: `:focus-visible` โชว์ teal ring, `prefers-reduced-motion` ปิด animation
- เปลี่ยนสีแบรนด์ = แก้ `theme/tokens.ts` + `theme/config.ts` แล้วรัน `npm run icons`
  (ไอคอน PWA) — ไม่ต้องไล่แก้ component
