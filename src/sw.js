// Zoomie Zoe service worker: makes the web app work offline.
// The art and sound are drawn by code, so these files ARE the whole game.
//
// RELEASE RULE: bump CACHE_VERSION every time you publish changed files.
// Players' browsers then download a fresh copy and delete the old one.
// If you add a new .js file, add it to FILES too (see docs/pwa-notes.md), then
// run: python3 store/tools/check-precache.py

const CACHE_VERSION = 'v4';
const CACHE_NAME = 'zoomie-zoe-' + CACHE_VERSION;

// Every file the game needs, relative to this file. Fetched on the first visit.
const FILES = [
  './',
  'index.html',
  'style.css',
  'config.js',
  'manifest.webmanifest',
  'icons/32.png',
  'icons/180.png',
  'icons/192.png',
  'icons/512.png',
  'icons/maskable-512.png',
  'js/main.js',
  'js/audio.js',
  'js/geom.js',
  'js/input.js',
  'js/layout.js',
  'js/loop.js',
  'js/menu.js',
  'js/platform.js',
  'js/pwa.js',
  'js/render.js',
  'js/storage.js',
  'js/view.js',
  'js/art/bake.js',
  'js/art/fx.js',
  'js/art/palette.js',
  'js/art/util.js',
  'js/art/zoe-art.js',
  'js/game/dogs.js',
  'js/game/extras.js',
  'js/game/items.js',
  'js/game/leash.js',
  'js/game/round.js',
  'js/game/trail.js',
  'js/game/zoe.js',
  'js/themes/index.js',
  'js/themes/bedroom.js',
  'js/themes/halloween.js',
  'js/themes/christmas.js',
  'js/themes/spring.js',
];

// Install: download everything into a fresh cache. 'reload' skips the HTTP cache,
// so a new version never stores stale copies. If any file is missing, the install
// fails and the previous version keeps running.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

// Activate: delete caches from older versions, then take over open pages.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((n) => n.startsWith('zoomie-zoe-') && n !== CACHE_NAME)
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // never touch other sites

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(staleWhileRevalidate(req, event));
  }
});

// Pages (HTML): try the network so a new release shows up at once; fall back to the
// cache when offline or when the network is too slow.
async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await withTimeout(fetch(req), 4000);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true }))
      || (await cache.match('index.html'))
      || new Response('Zoomie Zoe is offline and not cached yet.', { status: 503 });
  }
}

// Everything else: answer from the cache right away, refresh the copy in the background.
async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req, { ignoreSearch: true });
  const refresh = fetch(req)
    .then((res) => {
      if (res.ok) return cache.put(req, res.clone()).then(() => res);
      return res;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  return (await refresh) || new Response('', { status: 504 });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
