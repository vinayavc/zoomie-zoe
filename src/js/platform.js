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

// Touch phone or tablet? Decided up front (Phase 4C), before any touch happens:
// a coarse pointer, or no hover plus touch points. Laptops with a touch screen
// report a fine pointer that can hover, so they count as mouse + keyboard.
// `touchSeen` is set by main.js once a real touch arrives, as a fallback.
export const screenShape = { sideways: false, touchSeen: false };
let coarseMq = null, noHoverMq = null;
try {
  coarseMq = window.matchMedia('(pointer: coarse)');
  noHoverMq = window.matchMedia('(hover: none)');
} catch { /* old browser */ }

export function isTouchDevice() {
  if (isExtension) return false;
  const coarse = !!(coarseMq && coarseMq.matches);
  const noHover = !!(noHoverMq && noHoverMq.matches);
  const points = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  return coarse || (noHover && points) || screenShape.touchSeen;
}

// Sideways phone: a touch screen that is wider than tall and short (a phone
// in landscape) gets a "turn your phone" card; rounds never start or run.
// Tablets in landscape are tall enough to skip the card.
export function checkSideways(maxH) {
  const w = window.innerWidth, h = window.innerHeight;
  screenShape.sideways = !isExtension && isTouchDevice() && w > h && h < maxH;
  return screenShape.sideways;
}
