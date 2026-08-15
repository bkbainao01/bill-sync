# BillSync — บันทึกรายรับ/รายจ่าย + สแกนบิลด้วย AI

แอปจัดการเงินส่วนตัว **local-first / privacy-first** — ข้อมูลทั้งหมดอยู่ในเครื่องของคุณ 100% (IndexedDB บนเว็บ, SQLite บนมือถือ) ไม่มีเซิร์ฟเวอร์ ไม่ส่งข้อมูลส่วนตัวออกนอกเครื่อง เว้นแต่คุณจะเปิดอนุญาตให้ AI อ่านบิลเอง

**🔗 Demo (PWA):** https://bkbainao01.github.io/bill-sync/

> แนะนำเปิดผ่านมือถือแล้วกด "ติดตั้งแอป" (Add to Home Screen) — ใช้งาน offline ได้

---

## ✨ คุณสมบัติ

- **บันทึกรายรับ/รายจ่าย** — หมวดหมู่สำเร็จรูป, เก็บยอดเป็นสตางค์ (ไม่มี float error), ดูตามเดือน, แก้/ลบ
- **สรุป & Charts** — การ์ดสรุป (รายรับ/รายจ่าย/คงเหลือ), กราฟแนวโน้มรายจ่าย 6 เดือน, โดนัทสัดส่วนตามหมวด (react-native-svg)
- **สแกนบิลด้วย AI** — อัปโหลดรูปบิล → Vision LLM อ่านชื่อร้าน/ยอด/วันที่ พร้อม **confidence** ต่อ field → ตรวจสอบและแก้ไขก่อนยืนยัน (opt-in: ต้องเปิดอนุญาตก่อนส่งรูปขึ้นคลาวด์, API key เก็บในเครื่อง)
- **กล้อง + OCR ในเครื่อง (มือถือ)** — ถ่ายรูปบิล → ML Kit อ่านข้อความ → rule-based parser (วันที่ พ.ศ., ยอดรวม, VAT)
- **บิลประจำ (Recurring)** — รายเดือน/สัปดาห์/รายปี, ระบบรอบบิล + สถานะ (ครบกำหนด/ถึงกำหนด/จ่ายแล้ว), ปุ่มสร้างรายการจากบิลที่ค้าง
- **Auto-detect บิลประจำ** — บิลที่สแกนเจอร้านเดิม/ยอดใกล้เคียง → แนะนำเชื่อมกับบิลประจำอัตโนมัติ
- **แจ้งเตือนก่อนครบกำหนด** — แบนเนอร์ในแอป + Notification ของระบบ (web: Notification API, มือถือ: expo-notifications) ปรับวันล่วงหน้าได้
- **PWA** — ติดตั้งได้, ทำงาน offline (service worker + manifest), ไอคอน/ธีมสีตามแบรนด์
- **ธีมมืด/สว่าง**, ส่งออก CSV / สำรองข้อมูล JSON

## 🛠 Tech Stack

| ชั้น | เทคโนโลยี |
|---|---|
| Framework | Expo SDK 57 (React Native 0.86, React 19, expo-router) |
| UI | gluestack-ui (`@gluestack-ui/themed`) + react-native-svg |
| State | Zustand (theme, UI, scanner settings, reminders) + TanStack Query (data) |
| Storage | IndexedDB (web) / expo-sqlite (native) ผ่าน repository interface |
| AI | OpenAI-compatible / Google Gemini (vision, opt-in) + ML Kit OCR (on-device) |
| Test | Vitest (core business logic 93 tests) |
| PWA | static export + service worker + manifest |

## 🏗 สถาปัตยกรรม

```
app/          expo-router: รายการ / สรุป / ตั้งค่า / สแกนบิล / บิลประจำ / กล้อง
core/         TS ล้วน ไม่แตะ React Native — entities, validators, calculations,
              recurring (รอบบิล + match + reminders), scanner (parser + OCR rules)
adapters/     IndexedDB (web) / expo-sqlite (native) / LLM providers / OCR
store/        Zustand stores (persist ผ่าน localStorage)
hooks/        TanStack Query — DB = server
components/   หน้าจอประกอบ: charts, bill review, recurring, transaction
theme/        gluestack provider + light/dark
```

หลักการสำคัญ: **business logic ทั้งหมดอยู่ใน `core/` แบบไม่พึ่ง UI/Platform** → test ด้วย Vitest ได้ตรงๆ และสลับ adapter (web/native/AI provider) ได้โดยไม่แตะ logic

## 🚀 เริ่มใช้งาน

```bash
npm install
npx expo start            # dev (กด w เพื่อเปิด web)
npx expo start --web      # web เฉพาะ
```

ทดสอบ:

```bash
npx vitest run            # 93 tests (core business logic)
npx tsc --noEmit          # typecheck
```

Build PWA (static export):

```bash
npx expo export -p web    # output ที่ dist/
```

Native (มือถือ):

```bash
npx expo prebuild         # สร้าง android/ios (ต้องมี CocoaPods บน macOS สำหรับ iOS)
npx expo run:android      # build ลงอุปกรณ์/emulator
```

## 🔒 ความเป็นส่วนตัว

- ข้อมูล (รายการ/บิล/การตั้งค่า) เก็บในเครื่อง 100%
- การสแกนบิลด้วย AI เป็น **opt-in** — ปิดเป็นค่าเริ่มต้น ต้องเปิด "อนุญาต AI อ่านบิล" ก่อนส่งรูปขึ้นคลาวด์
- API key เก็บเฉพาะในเครื่อง ไม่มีการส่งไปที่อื่นนอกจากผู้ให้บริการ AI ที่คุณเลือก
- บนมือถือมีโหมด **OCR ในเครื่อง** (ML Kit) — อ่านบิลได้โดยไม่ต้องส่งรูปขึ้นอินเทอร์เน็ต

## 📋 สถานะ & Roadmap

- ✅ เฟส 0–1: core MVP (รายการ/สรุป/ตั้งค่า) + charts + PWA
- ✅ เฟส 2: สแกนบิลด้วย AI (LLM) + review/confirm + state machine + recurring bills
- ✅ เฟส 3: native build + กล้อง + ML Kit OCR + expo-sqlite
- ✅ Auto-detect recurring + notification เตือนบิล
- 🔜 auto-confirm ตาม confidence threshold, recurring ฉบับเต็ม (edit/duplicate), backup/restore

## 📄 License

MIT
