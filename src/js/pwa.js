// Registers the offline service worker (sw.js) on the web version only.
// Not in the Chrome extension (chrome-extension: pages), not from file://.
//
// Local dev hosts (localhost, 127.0.0.1) skip it by default, so a cached copy never
// hides fresh code edits. To test offline locally, open the page once with ?sw=1
// (remembered for that host and port); ?sw=0 turns it off and wipes the caches.

const DEV_KEY = 'doxieArcade.devSW';

function isLocalHost() {
  return ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
    || location.hostname.endsWith('.localhost');
}

function devOptIn() {
  const flag = new URLSearchParams(location.search).get('sw');
  try {
    if (flag === '1') localStorage.setItem(DEV_KEY, '1');
    if (flag === '0') localStorage.removeItem(DEV_KEY);
    return localStorage.getItem(DEV_KEY) === '1';
  } catch {
    return flag === '1';
  }
}

async function devCleanup() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  const names = await caches.keys();
  await Promise.all(names.filter((n) => n.startsWith('zoomie-zoe-')).map((n) => caches.delete(n)));
}

function start() {
  const web = location.protocol === 'https:' || location.protocol === 'http:';
  if (!web || !('serviceWorker' in navigator)) return;

  if (isLocalHost() && !devOptIn()) {
    if (new URLSearchParams(location.search).get('sw') === '0') devCleanup().catch(() => {});
    return;
  }

  // sw.js sits next to index.html, so its scope is the game's folder
  // (this also works under a GitHub Pages sub-path).
  navigator.serviceWorker.register('sw.js').catch((err) => {
    console.warn('Zoomie Zoe: offline mode unavailable', err);
  });
}

// Wait for load so caching never competes with the game's first frames.
if (document.readyState === 'complete') start();
else window.addEventListener('load', start, { once: true });
