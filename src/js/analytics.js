// Anonymous visit and install counts with GoatCounter (https://www.goatcounter.com).
// Privacy wording: store/privacy.html.
//
// What is sent, and nothing else:
//   1. one pageview per page load,
//   2. the event "app-installed" when the browser installs the web app,
//   3. the event "app-launch" when the page opens as the installed app.
// No cookies, no storage, no IDs, no rounds or scores.
//
// No remote code: GoatCounter's count.js is NOT loaded. A hit is a plain image request
// to the /count endpoint (GoatCounter's documented "pixel"). It's cross-origin, so
// sw.js ignores it, and if it fails (offline, blocked) nothing happens.
//
// Hits are sent ONLY from the published site. Never from localhost, 127.0.0.1,
// file:// or the Chrome extension. Do Not Track and Global Privacy Control are respected.

const SITE_HOST = 'vinayavc.github.io';
const ENDPOINT = 'https://zoomiezoe.goatcounter.com/count';

function privacySignalOn() {
  return navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
}

function isInstalledApp() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || navigator.standalone === true; // iOS home-screen apps
}

// Builds the /count URL. Params: p = path or event name, t = title, r = referrer,
// e = event flag, rnd = cache buster (ignored by GoatCounter).
export function hitUrl({ path, title, referrer, event }) {
  const q = new URLSearchParams();
  q.set('p', path);
  if (title) q.set('t', title);
  if (referrer) q.set('r', referrer);
  if (event) q.set('e', 'true');
  q.set('rnd', Math.random().toString(36).slice(2, 10));
  return ENDPOINT + '?' + q.toString();
}

function send(hit) {
  try {
    const img = new Image();
    img.onload = img.onerror = () => {}; // fail silently
    img.src = hitUrl(hit);
  } catch {
    // never let analytics break the game
  }
}

// `host` is a parameter only so the code path can be tried from the console.
export function start(host = location.hostname) {
  if (host !== SITE_HOST) return false; // file:// and chrome-extension: never match
  if (privacySignalOn()) return false;

  const referrer = document.referrer;
  send({ path: location.pathname, title: document.title, referrer });

  if (isInstalledApp()) {
    send({ path: 'app-launch', title: 'Opened the installed app', event: true });
  }

  window.addEventListener('appinstalled', () => {
    send({ path: 'app-installed', title: 'Installed the app', event: true });
  }, { once: true });
  return true;
}

start();
