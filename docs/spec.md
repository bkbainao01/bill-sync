# BillSync - Personal Bill & Expense Tracker
## Development & Architecture Specification

> **App Name:** BillSync
> **Project Direction:** Unified App (Expo + React Native Web)  
> **Primary Goal:** ถ่าย/อัปโหลดบิล → OCR + AI อ่านข้อมูล → ตรวจสอบ → สร้างรายรับ/รายจ่าย → สรุปการเงินอัตโนมัติ

---

# 1. Product Vision

แอปจัดการรายรับรายจ่ายส่วนตัวที่ลดการกรอกข้อมูลด้วยมือให้มากที่สุด โดยให้ผู้ใช้สามารถ:

```text
ถ่าย/อัปโหลดบิล → OCR อ่านข้อความ → AI วิเคราะห์ข้อมูล → ตรวจสอบข้อมูล → Confirm → สร้าง Expense อัตโนมัติ → Dashboard / Report
```

แนวคิดหลัก:
> **“ถ่ายบิลครั้งเดียว ที่เหลือแอปจัดการให้”**

หลักการสำคัญ:
- Local-first & Offline-first
- AI-assisted & Human-confirmed
- Privacy-first
- Exportable & Backupable
- Single Codebase (Write once, run on Web, iOS, Android)

---

# 2. Development Strategy

## Unified App (React Native + Expo)

ใช้ **Expo** เป็นแกนหลักเพื่อทำ **React Native Web** ทำให้เขียน UI และ Business Logic เพียงชุดเดียว แต่สามารถใช้งานได้ทั้งบน Web (พัฒนาและทดสอบได้ทันที) และ Mobile (นำไปบิลด์แอปทีหลัง)

```text
Phase 1: Expo Web
Build Core + UI (gluestack-ui) + Local DB Adapter
    ↓
Phase 2: AI & OCR Pipeline
    ↓
Phase 3: Mobile Native Builds
iOS & Android (Camera, SQLite, FileSystem)
```

แนวคิด:
> **Write Once, Run Anywhere (Web, iOS, Android)**

---

# 3. Architecture Overview

```text
                         ┌──────────────────────┐
                         │    Shared Core       │
                         │      TypeScript      │
                         ├──────────────────────┤
                         │ Entities             │
                         │ Business Rules       │
                         │ Services             │
                         │ Validation           │
                         │ Repository Interfaces│
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          ┌──────────────────────────────────────────────────┐
          │                  Expo App                        │
          │         (React Native + Expo Router)             │
          │         UI: gluestack-ui (with Theming)          │
          └─────────┬──────────────────────────────┬─────────┘
                    │                              │
             Web Environment                Native Environment
             (Browser API)                  (iOS / Android API)
                    │                              │
             IndexedDB / FS                 SQLite / Expo FS
```

---

# 4. Recommended Project Structure

ใช้โครงสร้างของ Expo Router เป็นหลัก

```text
billsync/
├── app/                  # Expo Router (Pages/Screens)
│   ├── (tabs)/
│   ├── _layout.tsx
│   └── index.tsx
├── core/                 # Shared Core Business Logic
│   ├── entities/
│   ├── services/
│   ├── repositories/
│   ├── validators/
│   └── calculations/
├── components/           # UI Components (gluestack-ui)
├── theme/                # gluestack-ui custom themes (Light/Dark/Custom)
├── store/                # Zustand state management
├── adapters/             # Platform-specific adapters (DB, Storage, Scanner)
└── assets/               # Images, Fonts
```

---

# 5. Technology Stack

## Core
- **Framework:** Expo (React Native + Web)
- **Routing:** Expo Router
- **Language:** TypeScript
- **State Management:** Zustand
- **Data Fetching:** TanStack Query

## UI & Theming
- **UI Library:** **gluestack-ui** (รองรับ Accessible, Customizable และ Cross-platform)
- **Theming:** รองรับ Light/Dark mode และ Custom Themes ผ่านระบบ Token ของ gluestack

## Local Data & Storage
- **Native:** SQLite, Expo FileSystem
- **Web:** IndexedDB, Browser File API (เขียน Abstraction Layer คลุมไว้ใน `adapters/`)

---

# 6. Repository Pattern (Platform Adapters)

ห้ามผูก Business Logic เข้ากับ Database โดยตรง ต้องใช้ Interface

```ts
interface BillRepository {
  getBills(): Promise<Bill[]>
  createBill(bill: Bill): Promise<void>
}
```

- **Web Adapter:** แปลงคำสั่งไปใช้ IndexedDB
- **Mobile Adapter:** แปลงคำสั่งไปใช้ expo-sqlite

*(ส่วนที่เหลือเช่น Entities, OCR Pipeline, Dashboard ยังคงใช้หลักการ Business Logic ร่วมกันเหมือนเดิม)*
