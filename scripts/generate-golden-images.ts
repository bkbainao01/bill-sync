/**
 * วาดรูปใบเสร็จตัวอย่าง (จาก rawText ของแต่ละเคสใน golden corpus) → golden/images/*.png
 * ใช้ node-canvas + ฟอนต์ไทยจากระบบ (Windows: Leelawadee UI, macOS: Thonburi)
 * รัน: npm run golden:images
 */
import { createCanvas, registerFont } from 'canvas';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { corpus } from '../core/scanner/golden/corpus';

const FONT_CANDIDATES = [
  'C:/Windows/Fonts/leelawui.ttf', // Leelawadee UI (Windows 8+)
  'C:/Windows/Fonts/tahoma.ttf',
  '/System/Library/Fonts/Thonburi.ttc', // macOS
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', // Linux (ไม่มี Thai — fallback)
];

const FONT = 'GoldenThai';
const WIDTH = 640;
const PAD = 36;
const FONT_SIZE = 22;
const LINE_H = 34;
const HEADER_GAP = 28;

function findThaiFont(): string | null {
  for (const f of FONT_CANDIDATES) {
    if (existsSync(f)) return f;
  }
  return null;
}

function drawReceipt(lines: string[]): Buffer {
  const titleH = 64;
  const height = titleH + lines.length * LINE_H + PAD * 2 + HEADER_GAP;
  const canvas = createCanvas(WIDTH, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, height);

  // ขอบใบเสร็จ
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(PAD - 6, 16, WIDTH - (PAD - 6) * 2, height - 32);

  // หัวใบเสร็จ
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 24px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('ใบเสร็จรับเงิน', WIDTH / 2, 46);

  // เส้นคั่นหัว
  ctx.strokeStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(PAD, 70);
  ctx.lineTo(WIDTH - PAD, 70);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = `${FONT_SIZE}px ${FONT}`;
  let y = titleH;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      y += LINE_H * 0.6;
      continue;
    }
    // บรรทัดแรก = ชื่อร้าน → ตัวหนา
    const isMerchant = y === titleH;
    ctx.font = `${isMerchant ? 'bold' : 'normal'} ${isMerchant ? FONT_SIZE + 2 : FONT_SIZE}px ${FONT}`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(line, PAD, y + 8);
    y += LINE_H;
  }

  return canvas.toBuffer('image/png');
}

function main(): void {
  const font = findThaiFont();
  if (!font) {
    console.error('⚠️ ไม่พบฟอนต์ไทยในระบบ — รูปจะอ่านไม่ออก ใส่ path ฟอนต์ใน FONT_CANDIDATES');
  } else {
    registerFont(font, { family: FONT });
  }

  const outDir = resolve('golden/images');
  mkdirSync(outDir, { recursive: true });

  for (const c of corpus) {
    const lines = c.rawText.split('\n');
    const png = drawReceipt(lines);
    const out = join(outDir, `${c.id}.png`);
    writeFileSync(out, png);
    console.log(`  ✓ ${c.id}.png (${lines.length} บรรทัด, ${png.length} bytes)`);
  }
  console.log(`\nวาดรูปครบ ${corpus.length} เคส → golden/images/`);
}

main();
