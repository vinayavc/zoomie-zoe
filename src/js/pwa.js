// Registers the offline service worker (sw.js) on the web version only.
// Not in the Chrome extension (chrome-extension: pages), not from file://.
//
// Dev rule:  localhost            = dev, no service worker (always fresh code)
//            127.0.0.1 or the site = PWA (service worker on, cached offline copy)
// On localhost any leftover service worker is removed and its caches are cleared.

function isDevHost() {
  return location.hostname === 'localhost' || location.hostname.endsWith('.localhost');
}

async function removeServiceWorker() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  if (window.caches) {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('zoomie-zoe-')).map((n) => caches.delete(n)));
  }
}

function start() {
  const web = location.protocol === 'https:' || location.protocol === 'http:';
  if (!web || !('serviceWorker' in navigator)) return;

  if (isDevHost()) {
    removeServiceWorker().catch(() => {});
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
