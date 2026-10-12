// Where the paper cards and their buttons sit, in arena pixels (400 x 600).
// Shared by the baker (card sizes), the menu (hit tests) and the renderer
// (drawing), so a button is always drawn exactly where it can be tapped.

import { CONFIG } from '../config.js';

const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;

// w/h = the paper card's inner size; cy = its centre line.
export const CARDS = {
  title: { w: 324, h: 420, cy: 322 },
  howto: { w: 368, h: 540, cy: 324 },
  pause: { w: 290, h: 300, cy: H / 2 },
  over: { w: 290, h: 250 },            // its centre is picked at game over (opposite her nap spot)
};

// Top-left corner of a card's inner box.
export function cardBox(name, cy = CARDS[name].cy) {
  const c = CARDS[name];
  return { x: W / 2 - c.w / 2, y: cy - c.h / 2, w: c.w, h: c.h };
}

function btn(id, label, cx, cy, w, h, kind = 'wide') {
  return { id, label, x: cx - w / 2, y: cy - h / 2, w, h, cx, cy, kind };
}

// The buttons of one screen, in keyboard (Tab / arrow) order.
// `s` = { screen, muted, howtoFirst, overCardY }
export function buttonsFor(s) {
  const BH = CONFIG.MENU_BTN_H;
  const sound = s.muted ? 'Sound: off' : 'Sound: on';
  if (s.screen === 'title') {
    const b = cardBox('title');
    return [
      btn('play', 'Play', W / 2, b.y + 268, 200, BH + 6, 'big'),
      btn('howto', 'How to play', W / 2 - 80, b.y + 336, 148, BH - 2),
      btn('sound', sound, W / 2 + 80, b.y + 336, 148, BH - 2, 'sound'),
    ];
  }
  if (s.screen === 'howto') {
    const b = cardBox('howto');
    return [btn('go', s.howtoFirst ? "Let's go!" : 'Back', W / 2, b.y + 506, 180, BH, 'big')];
  }
  if (s.screen === 'pause') {
    const b = cardBox('pause');
    return [
      btn('resume', 'Resume', W / 2, b.y + 112, 200, BH, 'big'),
      btn('restart', 'Restart', W / 2, b.y + 174, 200, BH),
      btn('sound', sound, W / 2, b.y + 236, 200, BH, 'sound'),
    ];
  }
  if (s.screen === 'over') {
    const b = cardBox('over', s.overCardY);
    return [btn('again', 'Play again', W / 2, b.y + 198, 190, BH - 2, 'big')];
  }
  if (s.screen === 'play') {
    const r = CONFIG.HUD_BTN_HIT * 2;
    return [
      btn('mute', 'Sound', CONFIG.MUTE_BTN_X, CONFIG.HUD_BTN_Y, r, r, 'hud'),
      btn('pause', 'Pause', CONFIG.PAUSE_BTN_X, CONFIG.HUD_BTN_Y, r, r, 'hud'),
    ];
  }
  return [];
}

export function hitButton(list, x, y) {
  for (const b of list) {
    if (b.kind === 'hud') {
      const dx = x - b.cx, dy = y - b.cy;
      if (dx * dx + dy * dy <= CONFIG.HUD_BTN_HIT * CONFIG.HUD_BTN_HIT) return b;
    } else if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return b;
    }
  }
  return null;
}
