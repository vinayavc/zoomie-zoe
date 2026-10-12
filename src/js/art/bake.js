// Everything slow is painted here, once at load (and again after a resize).
// Shared art (paper grain, Zoe's fur tiles, paper cards, menu buttons, the
// theme chips) is baked with the base palette. Each theme's own art (floor,
// items, critters, ball, hazard, hiding flap, costume) is baked by that theme's
// module in src/js/themes/, the first time the theme is shown, then cached.
// The frame loop only blits these canvases and draws Zoe as live vector shapes.

import { CONFIG } from '../../config.js';
import { P, withPalette } from './palette.js';
import { CARDS } from '../layout.js';
import { makeRng, makeLayer, polygon, deform, fillPts, wash, tornOutline, roundRectPts, pathPts, grainAtop } from './util.js';
import { THEMES } from '../themes/index.js';

let bakeCount = 0;

// Art every theme shares. Baked with the base (Bedroom) colors.
export function bakeShared(mainCtx, k) {
  return withPalette(null, () => {
    const t0 = performance.now();
    bakeCount++;
    const paper = bakePaperTile();
    const shared = {
      k,
      pxW: mainCtx.canvas.width,   // the exact size baked for (re-bake when it changes)
      pxH: mainCtx.canvas.height,
      paper,
      glow: bakeGlow(k),
      cardTitle: bakeCard(CARDS.title.w, CARDS.title.h, k, paper, 11),
      cardOver: bakeCard(CARDS.over.w, CARDS.over.h, k, paper, 23),
      cardPause: bakeCard(CARDS.pause.w, CARDS.pause.h, k, paper, 31),
      cardHowto: bakeCard(CARDS.howto.w, CARDS.howto.h, k, paper, 47),
      cardRotate: bakeCard(CARDS.rotate.w, CARDS.rotate.h, k, paper, 59),
      buttons: {},   // torn-paper menu buttons, baked on first use (see bakeButton)
      chips: {},     // theme picker chips, one per theme
      zoeCream: null,
      zoeSaddle: null,
      bakeMs: 0,
    };
    for (const t of THEMES) shared.chips[t.id] = bakeChip(t, k, paper);
    const cream = bakeFurTile(k, paper, P.paleCream, [P.cream, P.cream, P.paleCream, '#E3CDA9'], 5);
    const saddle = bakeFurTile(k, paper, P.apricot, ['#E2B97F', P.saddle, P.apricot, '#C99560'], 9);
    shared.zoeCream = mainCtx.createPattern(cream.c, 'repeat');
    shared.zoeSaddle = mainCtx.createPattern(saddle.c, 'repeat');
    shared.zoeTileK = k;
    shared.bakeMs = performance.now() - t0;
    shared.bakeCount = bakeCount;
    return shared;
  });
}

// One theme's art, baked under that theme's palette. The result is merged over
// the shared art, so the renderer reads art.bg, art.stickers.sock, art.dogs[0] ...
export function bakeTheme(theme, shared) {
  const k = shared.k, paper = shared.paper;
  return withPalette(theme.palette, () => {
    const t0 = performance.now();
    const art = Object.assign({}, shared, {
      theme,
      bg: theme.bakeBackground(k, paper),
      stickers: {
        sock: theme.bakeItem('sock', k, paper),
        shoe: theme.bakeItem('shoe', k, paper),
        cheese: theme.bakeItem('cheese', k, paper),
      },
      dogs: [theme.bakeCritter(0, k, paper), theme.bakeCritter(1, k, paper)],
      ball: theme.bakeBall(k, paper),
      bath: theme.bakeHazard(k, paper),
      bubble: theme.bakeHazardBubble(k, paper),
      tuck: theme.bakeHideFlap(k, paper),
      costume: theme.costume.bake ? theme.costume.bake(k, paper) : null,
    });
    art.themeBakeMs = performance.now() - t0;
    return art;
  });
}

// ---- paper grain: a 256 px tile of warm off-white noise, multiplied into layers ----
function bakePaperTile() {
  const N = 256;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d', { willReadFrequently: true });
  const rng = makeRng(7);
  // coarse blotches: wrapping value noise, so the tile repeats without seams
  const G = 8;
  const grid = new Float32Array(G * G);
  for (let i = 0; i < G * G; i++) grid[i] = rng();
  const id0 = g.createImageData(N, N);
  const d0 = id0.data;
  const sm = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < N; y++) {
    const gy = (y / N) * G, y0 = Math.floor(gy), fy = sm(gy - y0);
    for (let x = 0; x < N; x++) {
      const gx = (x / N) * G, x0 = Math.floor(gx), fx = sm(gx - x0);
      const a = grid[y0 * G + x0], b = grid[y0 * G + (x0 + 1) % G];
      const c = grid[((y0 + 1) % G) * G + x0], e = grid[((y0 + 1) % G) * G + (x0 + 1) % G];
      const v = 238 + 17 * ((a + (b - a) * fx) * (1 - fy) + (c + (e - c) * fx) * fy);
      const i = (y * N + x) * 4;
      d0[i] = v; d0[i + 1] = v - 3; d0[i + 2] = v - 9; d0[i + 3] = 255;
    }
  }
  g.putImageData(id0, 0, 0);
  // fine grain + a few fibres
  const id = g.getImageData(0, 0, N, N);
  const d = id.data;
  for (let i = 0; i < N * N; i++) {
    const n = (rng() - 0.5) * 22 + (rng() < 0.02 ? -18 : 0);
    d[i * 4] = Math.min(255, d[i * 4] + n);
    d[i * 4 + 1] = Math.min(255, d[i * 4 + 1] + n);
    d[i * 4 + 2] = Math.min(255, d[i * 4 + 2] + n);
  }
  g.putImageData(id, 0, 0);
  g.strokeStyle = 'rgba(150,130,110,0.18)';
  g.lineWidth = 0.7;
  for (let i = 0; i < 40; i++) {
    const x = 12 + rng() * (N - 36), y = 12 + rng() * (N - 36), a = rng() * Math.PI, l = 3 + rng() * 9;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + rng() * 3, y + Math.sin(a) * l * 0.5 + rng() * 3, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return c;
}

// ---- Zoe's fur: seamless wash tiles used as a CanvasPattern on her body ----
function bakeFurTile(k, paper, base, tones, seed) {
  const T = 48;
  const L = makeLayer(T, T, k);
  const g = L.g;
  const rng = makeRng(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, T, T);
  for (let b = 0; b < 16; b++) {
    const cx = rng() * T, cy = rng() * T, r = 4 + rng() * 9;
    const color = tones[b % tones.length];
    const shape = deform(polygon(0, 0, r, 7, rng, r, r * (0.6 + rng() * 0.5)), 2, 0.3, rng);
    g.fillStyle = color;
    g.globalAlpha = 0.07;
    for (let l = 0; l < 7; l++) {
      const pts = deform(shape, 2, 0.4, rng);
      // draw wrapped copies so the tile repeats without seams
      for (let ox = -T; ox <= T; ox += T) for (let oy = -T; oy <= T; oy += T) {
        g.save();
        g.translate(cx + ox, cy + oy);
        fillPts(g, pts);
        g.restore();
      }
    }
  }
  // a few soft fur strokes
  g.globalAlpha = 0.12;
  g.strokeStyle = tones[1];
  g.lineWidth = 0.6;
  g.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const x = rng() * T, y = rng() * T, l = 2 + rng() * 3;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + l * 0.5, y + (rng() - 0.5) * 2, x + l, y + (rng() - 0.5) * 1.5);
    g.stroke();
  }
  g.globalAlpha = 1;
  grainAtop(L, paper, 0.12);
  return L;
}

function bakeGlow(k) {
  const S = 44;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const gr = g.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,240,190,0.95)');
  gr.addColorStop(0.45, 'rgba(250,226,160,0.55)');
  gr.addColorStop(1, 'rgba(247,233,198,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return L;
}

// ---- torn paper cards for the title, pause and game-over screens ----
function bakeCard(w, h, k, paper, seed) {
  const pad = 10;
  const L = makeLayer(w + pad * 2, h + pad * 2, k);
  const g = L.g;
  const rng = makeRng(seed);
  g.translate(pad, pad);
  const edge = tornOutline(deform(roundRectPts(0, 0, w, h, 6, 3), 1, 0.02, rng), 3, rng);
  g.fillStyle = 'rgba(40,38,60,0.08)';
  for (let i = 1; i <= 5; i++) { g.save(); g.translate(i * 0.8, i * 1.1); fillPts(g, edge); g.restore(); }
  g.fillStyle = P.paper;
  fillPts(g, edge);
  g.save();
  pathPts(g, edge);
  g.clip();
  // warm washes around the border, clean in the middle
  for (let i = 0; i < 10; i++) {
    const side = i % 4;
    const x = side === 0 ? rng() * w : side === 1 ? w : side === 2 ? rng() * w : 0;
    const y = side === 0 ? 0 : side === 1 ? rng() * h : side === 2 ? h : rng() * h;
    wash(g, polygon(x, y, 40 + rng() * 30, 8, rng), i % 3 ? P.sun : P.pink, rng, { layers: 8, alpha: 0.05 });
  }
  g.restore();
  g.strokeStyle = 'rgba(191,140,85,0.35)';
  g.lineWidth = 1;
  pathPts(g, edge);
  g.stroke();
  grainAtop(L, paper, 0.22);
  L.pad = pad;
  return L;
}

// ---- torn paper menu buttons (Phase 4B). `big` = the sunny main choice. ----
// Baked on first use per size; the renderer caches them in art.buttons.
// Always baked in the base colors, whichever theme is showing.
export function bakeButton(w, h, big, art) {
  return withPalette(null, () => bakeButtonNow(w, h, big, art));
}

function bakeButtonNow(w, h, big, art) {
  const k = art.k, paper = art.paper;
  const pad = 6;
  const L = makeLayer(w + pad * 2, h + pad * 2, k);
  const g = L.g;
  const rng = makeRng(Math.round(w * 7 + h * 13 + (big ? 5 : 0)));
  g.translate(pad, pad);
  const edge = tornOutline(deform(roundRectPts(0, 0, w, h, 9, 3), 1, 0.015, rng), 1.8, rng);
  g.fillStyle = big ? P.sun : P.paper;
  fillPts(g, edge);
  g.save();
  pathPts(g, edge);
  g.clip();
  for (let i = 0; i < 6; i++) {
    const x = (i / 5) * w, y = i % 2 ? h : 0;
    wash(g, polygon(x, y, h * 0.55, 7, rng), big ? P.cheese : i % 2 ? P.sun : P.pink, rng, { layers: 6, alpha: big ? 0.07 : 0.05 });
  }
  g.restore();
  g.strokeStyle = 'rgba(107,74,47,0.55)';
  g.lineWidth = 1.1;
  pathPts(g, edge);
  g.stroke();
  grainAtop(L, paper, 0.2);
  L.pad = pad;
  return L;
}

// ---- theme picker chip: a torn paper tag in the theme's color with its icon ----
function bakeChip(theme, k, paper) {
  const w = CONFIG.THEME_CHIP_W, h = CONFIG.THEME_CHIP_H;
  const pad = 6;
  const L = makeLayer(w + pad * 2, h + pad * 2, k);
  const g = L.g;
  const rng = makeRng(theme.id.length * 31 + 7);
  g.translate(pad, pad);
  const edge = tornOutline(deform(roundRectPts(0, 0, w, h, 9, 3), 1, 0.015, rng), 1.6, rng);
  g.fillStyle = theme.chip.color;
  fillPts(g, edge);
  g.save();
  pathPts(g, edge);
  g.clip();
  wash(g, polygon(w * 0.3, h * 0.25, h * 0.6, 7, rng), '#ffffff', rng, { layers: 6, alpha: 0.06 });
  wash(g, polygon(w * 0.75, h * 0.85, h * 0.6, 7, rng), '#000000', rng, { layers: 5, alpha: 0.04 });
  g.restore();
  g.strokeStyle = theme.chip.ink;
  g.globalAlpha = 0.6;
  g.lineWidth = 1.1;
  pathPts(g, edge);
  g.stroke();
  g.globalAlpha = 1;
  // the theme draws its own icon, in its own colors
  withPalette(theme.palette, () => {
    g.save();
    g.translate(w / 2, h / 2);
    theme.drawChipIcon(g);
    g.restore();
  });
  grainAtop(L, paper, 0.2);
  L.pad = pad;
  return L;
}
