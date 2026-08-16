import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * ไฟล์นี้ใช้เฉพาะ web — กำหนดโครง HTML ของทุกหน้า (static render)
 * เพิ่ม PWA: manifest, theme-color, apple meta และลงทะเบียน service worker
 * ฟอนต์แบรนด์ (IBM Plex Sans Thai + IBM Plex Mono) โหลดจาก Google Fonts —
 * offline จะ fallback เป็นฟอนต์ระบบ (ตัวเลข/ข้อความยังอ่านได้ครบ)
 */
const swRegistration = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service Worker registration failed:', err);
    });
  });
}
`;

// base styles — กระดาษ/หมึกของธีม "thermal slip" (ดู theme/tokens.ts)
const baseCss = `
html { background: #F6F5F1; }
body {
  font-family: 'IBM Plex Sans Thai', 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #221F1B;
  background: #F6F5F1;
}
::selection { background: #C5E4DA; }
a, button, [role="button"], input, textarea, [tabindex] { outline-offset: 2px; }
*:focus-visible { outline: 2px solid #0B6E5A; outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    // class/data-theme-id = ธีมเริ่มต้น (light) ที่ gluestack-ui inject ฝั่ง client — ใส่ใน SSR ด้วยเพื่อให้ HTML ตรงกัน
    <html lang="th" className="gs gs-light" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#0B6E5A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BillSync" />
        <meta name="description" content="BillSync — บันทึกรายรับ/รายจ่าย และสแกนบิลด้วย AI" />
        <link rel="manifest" href="manifest.json" />
        <link rel="apple-touch-icon" href="logo192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="logo192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: baseCss }} />
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: swRegistration }} />
      </head>
      <body data-theme-id="light" suppressHydrationWarning>{children}</body>
    </html>
  );
}
