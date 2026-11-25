/* PWA Service Worker：缓存静态资源，支持离线打开。
 * 壁纸/天气/统计等网络请求不缓存，始终走网络（网络失败时保留默认样式）。
 * 版本变更时修改 CACHE_NAME 即可让旧缓存自动失效。
 */
const CACHE_NAME = 'desktop-web-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/config.js',
  './assets/script.js',
  './assets/style.css',
  './assets/icons/icons-data.js',
  './assets/icons/iconify-icon.min.js',
  './assets/vendor/lunar.js',
  './assets/pwa/icon-192.png',
  './assets/pwa/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // 同源静态资源：缓存优先，未命中则请求后回填
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return res;
    }).catch(() => cached))
  );
});
