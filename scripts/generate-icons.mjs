/**
 * สร้างไอคอนแอป (บิล/ใบเสร็จ) เป็น PNG หลายขนาดสำหรับ PWA + favicon
 * รัน: npm run icons
 */
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CYAN = [8, 145, 178]; // #0891b2
const CYAN_LIGHT = [34, 211, 238]; // #22d3ee
const CYAN_PALE = [165, 243, 252]; // #a5f3fc
const WHITE = [255, 255, 255];

/** จุด (x,y) อยู่ในสี่เหลี่ยมมุมมน (พิกัด 512-space) */
function insideRoundRect(x, y, x0, y0, w, h, r) {
  if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) return false;
  const cx = x < x0 + r ? x0 + r : x > x0 + w - r ? x0 + w - r : x;
  const cy = y < y0 + r ? y0 + r : y > y0 + h - r ? y0 + h - r : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function insideRect(x, y, x0, y0, w, h) {
  return x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h;
}

/** สีของพิกเซลใน 512-space (คืน null = โปร่งใส) */
function pixelColor(x, y) {
  // 1) พื้นหลัง cyan มุมมน
  if (!insideRoundRect(x, y, 0, 0, 512, 512, 104)) return null;

  // 2) ตัวบิล (ใบเสร็จ) สีขาว — ตัว + ซิกแซกด้านล่าง
  if (insideRoundRect(x, y, 136, 92, 240, 288, 24)) return WHITE;
  // ซิกแซก: ฟัน 16px ลึก 20px ระหว่าง y=380..400
  if (x >= 136 && x <= 376 && y >= 380 && y <= 400) {
    const offset = (x - 136) % 16;
    const boundary = 380 + (offset < 8 ? (offset * 20) / 8 : ((16 - offset) * 20) / 8);
    if (y >= boundary) return WHITE;
    return null;
  }

  // 3) เส้นสีบนตัวบิล (เหมือนรายการ/ยอด)
  if (insideRect(x, y, 172, 168, 168, 22)) return CYAN;
  if (insideRect(x, y, 172, 210, 128, 14)) return CYAN_LIGHT;
  if (insideRect(x, y, 172, 244, 96, 14)) return CYAN_PALE;

  return null;
}

function drawIcon(size, { opaque = false } = {}) {
  const png = new PNG({ width: size, height: size });
  const scale = size / 512;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const idx = (size * py + px) << 2;
      const color = pixelColor((px + 0.5) / scale, (py + 0.5) / scale);
      if (color) {
        png.data[idx] = color[0];
        png.data[idx + 1] = color[1];
        png.data[idx + 2] = color[2];
        png.data[idx + 3] = 255;
      } else if (opaque) {
        // พื้นหลังทึบ (apple-touch-icon ต้องไม่โปร่งใส)
        png.data[idx] = CYAN[0];
        png.data[idx + 1] = CYAN[1];
        png.data[idx + 2] = CYAN[2];
        png.data[idx + 3] = 255;
      }
    }
  }
  return PNG.sync.write(png);
}

const targets = [
  { file: 'public/logo192.png', size: 192 },
  { file: 'public/logo512.png', size: 512 },
  { file: 'assets/favicon.png', size: 48 },
];

fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });

for (const t of targets) {
  fs.writeFileSync(path.join(ROOT, t.file), drawIcon(t.size));
  console.log(`✓ ${t.file} (${t.size}x${t.size})`);
}
console.log('icons done');
