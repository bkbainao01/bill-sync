/* BillSync Service Worker — offline support (web) */
const CACHE_NAME = 'billsync-v1';
// สโคปของ SW (รองรับการโฮสต์ใต้ subpath เช่น GitHub Pages /bill-sync/)
const SCOPE = new URL('./', self.location.href).href;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // ข้าม request ของ dev server (metro): dev bundle + endpoints ภายใน dev เท่านั้น
  // (production bundle อยู่ใต้ /_expo/static/ ซึ่งต้อง cache ไว้ใช้ offline)
  const isDevRequest =
    url.search.includes('dev=true') ||
    url.pathname.endsWith('.bundle') ||
    url.pathname.startsWith('/sockjs') ||
    url.pathname.startsWith('/_expo/loading');
  if (isDevRequest) return;

  // Navigation (หน้า HTML): network-first, ตกไป cache — ได้เวอร์ชันใหม่เสมอเมื่อออนไลน์
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const root = await caches.match(SCOPE);
          return root ?? Response.error();
        }),
    );
    return;
  }

  // Assets (bundle, fonts, icons): cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      });
    }),
  );
});
