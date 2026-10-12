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
