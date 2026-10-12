// Where the paper cards and their buttons sit, in arena pixels (400 x 600).
// Shared by the baker (card sizes), the menu (hit tests) and the renderer
// (drawing), so a button is always drawn exactly where it can be tapped.
//
// Phase 4C: the canvas fills the whole screen and the 400 x 600 arena sits
// inside it. Everything still uses arena pixels; the bands around the arena
// just have y < 0 (HUD band) or y > 600 (thumb-pad + CINCH band), and the
// sides have x < 0 or x > 400. The arena's walls and bounds never change.

import { CONFIG } from '../config.js';

const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;

// The live screen layout, rebuilt by fitFrame() on every resize (view.js).
//   banded: the HUD sits in its own band above the arena (else on the paper
//           strip at the top of the arena, as before)
//   ctrlH:  height of the touch band below the arena (0 = none; CINCH sits in the arena)
//   vx0..vy1: the visible screen edges, in arena px
//   hudY: centre line of the HUD's top row; cinchX/Y/R: the touch CINCH button
export const FRAME = {
  rev: 0, banded: false, touch: false, ctrlH: 0, scale: 1,
  ox: 0, oy: 0, vx0: 0, vy0: 0, vx1: W, vy1: H,
  hudY: CONFIG.HUD_BTN_Y,
  cinchX: CONFIG.ACTION_BTN_X, cinchY: CONFIG.ACTION_BTN_Y, cinchR: CONFIG.ACTION_BTN_R,
};

// Fit the arena (plus bands, when they fit) into a cssW x cssH screen.
// `pinned` (the extension popup) keeps the classic 400 x 600 layout.
export function fitFrame(cssW, cssH, touch, pinned) {
  const s0 = Math.min(cssW / W, cssH / H);
  let s = s0, banded = false, ctrlH = 0, top = 0;
  if (!pinned) {
    const hb = CONFIG.HUD_BAND_H;
    const need = H + hb + (touch ? CONFIG.CTRL_BAND_MIN : 0);
    const s1 = Math.min(cssW / W, cssH / need);
    if (s1 >= CONFIG.BAND_MIN_SCALE * s0) {
      banded = true;
      s = s1;
      const spare = cssH / s - H - hb;
      ctrlH = touch ? Math.min(CONFIG.CTRL_BAND_MAX, spare) : 0;
      top = (cssH / s - (hb + H + ctrlH)) / 2 + hb;
    }
  }
  if (!banded) top = (cssH / s - H) / 2;
  const F = FRAME;
  F.rev++;
  F.banded = banded;
  F.touch = touch;
  F.ctrlH = ctrlH;
  F.scale = s;
  F.ox = Math.round(((cssW / s - W) / 2) * s);   // arena origin, CSS px from the canvas corner
  F.oy = Math.round(top * s);
  F.vx0 = -F.ox / s; F.vy0 = -F.oy / s;
  F.vx1 = F.vx0 + cssW / s; F.vy1 = F.vy0 + cssH / s;
  F.hudY = banded ? -CONFIG.HUD_BAND_H + 22 : CONFIG.HUD_BTN_Y;
  if (ctrlH > 0) {
    F.cinchR = CONFIG.CTRL_CINCH_R;
    F.cinchX = Math.min(W, F.vx1) - F.cinchR - 22;
    F.cinchY = H + ctrlH / 2;
  } else {
    F.cinchR = CONFIG.ACTION_BTN_R;
    F.cinchX = CONFIG.ACTION_BTN_X;
    F.cinchY = CONFIG.ACTION_BTN_Y;
  }
  return F;
}

// w/h = the paper card's inner size; cy = its centre line.
export const CARDS = {
  title: { w: 324, h: 512, cy: 312 },
  howto: { w: 368, h: 540, cy: 324 },
  pause: { w: 290, h: 400, cy: H / 2 },
  over: { w: 290, h: 304, cy: H - 152 - 12 },   // always at the bottom of the arena; she naps above it
  rotate: { w: 360, h: 420, cy: H / 2 },
};

// Where the theme chip row sits on a card (offset of the chips' centre line from the card top).
export const CHIP_ROW = { title: 422, over: 266 };

// Top-left corner of a card's inner box.
export function cardBox(name, cy = CARDS[name].cy) {
  const c = CARDS[name];
  return { x: W / 2 - c.w / 2, y: cy - c.h / 2, w: c.w, h: c.h };
}

function btn(id, label, cx, cy, w, h, kind = 'wide') {
  return { id, label, x: cx - w / 2, y: cy - h / 2, w, h, cx, cy, kind };
}

// The buttons of one screen, in keyboard (Tab / arrow) order.
// `s` = { screen, muted, howtoFirst, themes: [ids] }
export function buttonsFor(s) {
  const BH = CONFIG.MENU_BTN_H;
  const sound = s.muted ? 'Sound: off' : 'Sound: on';
  if (s.screen === 'title') {
    const b = cardBox('title');
    return [
      btn('play', 'Play', W / 2, b.y + 268, 200, BH + 6, 'big'),
      btn('howto', 'How to play', W / 2 - 80, b.y + 336, 148, BH - 2),
      btn('sound', sound, W / 2 + 80, b.y + 336, 148, BH - 2, 'sound'),
      ...chipRow(s.themes, b.y + CHIP_ROW.title),
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
      btn('quit', 'Quit to title', W / 2, b.y + 298, 200, BH),
    ];
  }
  if (s.screen === 'over') {
    const b = cardBox('over');
    return [
      btn('again', 'Play again', W / 2, b.y + 176, 190, BH - 2, 'big'),
      ...chipRow(s.themes, b.y + CHIP_ROW.over),
    ];
  }
  if (s.screen === 'play') {
    const r = CONFIG.HUD_BTN_HIT * 2;
    return [
      btn('mute', 'Sound', CONFIG.MUTE_BTN_X, FRAME.hudY, r, r, 'hud'),
      btn('pause', 'Pause', CONFIG.PAUSE_BTN_X, FRAME.hudY, r, r, 'hud'),
    ];
  }
  return [];
}

// A row of theme chips (one per theme), centred on the arena.
function chipRow(ids, cy) {
  const w = CONFIG.THEME_CHIP_W, h = CONFIG.THEME_CHIP_H, gap = CONFIG.THEME_CHIP_GAP;
  const x0 = W / 2 - (ids.length * w + (ids.length - 1) * gap) / 2 + w / 2;
  return ids.map((id, i) => {
    const b = btn('theme', id, x0 + i * (w + gap), cy, w, h, 'chip');
    b.themeId = id;
    return b;
  });
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
