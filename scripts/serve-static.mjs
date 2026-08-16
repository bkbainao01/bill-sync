/**
 * Static file server เล็กๆ สำหรับเสิร์ฟ expo web export (dist/) ให้ E2E (Playwright)
 * ใช้งาน: node scripts/serve-static.mjs [rootDir] [port]
 *   rootDir  default dist
 *   port     default 4173
 *
 * แผนที่ path → ไฟล์:
 *   /bill-sync/            → <root>/bill-sync/index.html
 *   /bill-sync/recurring   → <root>/bill-sync/recurring.html  (expo route file)
 *   /bill-sync/entry-x.js  → ไฟล์ตรงๆ
 */
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, resolve, sep } from 'path';

const args = process.argv.slice(2);
const root = resolve(args[0] ?? 'dist');
const port = Number(args[1] ?? 4173);
/** เช่น '/bill-sync' — path ขอเริ่มด้วย prefix นี้แล้วจะถูกตัดออกก่อน map ไปไฟล์ */
const prefix = args[2] === '--prefix' ? args[3] ?? '' : '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

async function resolveFile(urlPath) {
  let p = decodeURIComponent((urlPath ?? '/').split('?')[0]);
  if (prefix) {
    if (!p.startsWith(prefix)) return null;
    p = p.slice(prefix.length) || '/';
  }
  if (p.endsWith('/')) p += 'index.html';

  const candidates = [join(root, p)];
  // route ที่ไม่มีนามสกุล → ลองไฟล์ .html (expo static export สร้าง per-route html)
  if (!extname(candidates[0])) {
    candidates.push(`${candidates[0]}.html`, join(candidates[0], 'index.html'));
  }

  for (const file of candidates) {
    const abs = resolve(file);
    if (!abs.startsWith(root + sep) && abs !== root) continue; // กัน path traversal
    try {
      const info = await stat(abs);
      if (info.isFile()) return abs;
    } catch {
      /* ลอง candidate ถัดไป */
    }
  }
  return null;
}

createServer(async (req, res) => {
  try {
    // health check ของ playwright webServer เรียก GET / — ตอบ 200 ตรงๆ (redirect อาจไม่นับว่า up)
    if (prefix) {
      const pathOnly = (req.url ?? '/').split('?')[0];
      if (pathOnly === '/' || pathOnly === '') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
        return;
      }
    }
    const file = await resolveFile(req.url);
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not found');
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`server error: ${err.message}`);
  }
}).listen(port, () => {
  console.log(`serving ${root} on http://localhost:${port}`);
});
