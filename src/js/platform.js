// Web page or Chrome extension popup? Everything else is shared.

export const isExtension = location.protocol === 'chrome-extension:';

if (isExtension) {
  // Popups size themselves to their content, so pin the page to 400x600.
  document.documentElement.classList.add('popup');
}

// prefers-reduced-motion: gentler confetti and no wobbly card motion.
// Kept live, so changing the OS setting mid-game takes effect at once.
export const motion = { reduced: false };
try {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.reduced = mq.matches;
  const onChange = () => { motion.reduced = mq.matches; };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
} catch {
  // matchMedia missing: keep full motion
}

// Sideways phone (T1): a touch screen that is wider than tall and short (a
// phone in landscape) gets a "turn your phone" card and the round pauses.
// Laptops with touch screens report a fine pointer and are left alone;
// tablets in landscape are tall enough to skip the card.
// `touchSeen` is set by main.js once a real touch arrives.
export const screenShape = { sideways: false, touchSeen: false };
let coarseMq = null;
try { coarseMq = window.matchMedia('(pointer: coarse)'); } catch { /* old browser */ }

export function checkSideways(maxH) {
  const touch = (coarseMq && coarseMq.matches) || screenShape.touchSeen;
  const w = window.innerWidth, h = window.innerHeight;
  screenShape.sideways = !isExtension && touch && w > h && h < maxH;
  return screenShape.sideways;
}
