// Everything slow is painted here, once at load (and again after a resize):
// paper grain, Zoe's bedroom floor, item stickers, the other dogs, paper cards.
// The frame loop only blits these canvases and draws Zoe as live vector shapes.

import { CONFIG } from '../../config.js';
import { P } from './palette.js';
import { makeRng, makeLayer, polygon, deform, fillPts, wash, tornOutline, roundRectPts } from './util.js';

const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;
let bakeCount = 0;

export function bakeAll(mainCtx, k) {
  const t0 = performance.now();
  bakeCount++;
  const paper = bakePaperTile();
  const art = {
    k,
    pxW: mainCtx.canvas.width,   // the exact size baked for (re-bake when it changes)
    pxH: mainCtx.canvas.height,
    paper,
    bg: bakeBackground(k, paper),
    stickers: {
      sock: bakeSticker('sock', k, paper),
      shoe: bakeSticker('shoe', k, paper),
      cheese: bakeSticker('cheese', k, paper),
    },
    dogs: [bakeDog(0, k, paper), bakeDog(1, k, paper)],
    glow: bakeGlow(k),
    cardTitle: bakeCard(324, 400, k, paper, 11),
    cardOver: bakeCard(290, 230, k, paper, 23),
    zoeCream: null,
    zoeSaddle: null,
    bakeMs: 0,
  };
  const cream = bakeFurTile(k, paper, P.paleCream, [P.cream, P.cream, P.paleCream, '#E3CDA9'], 5);
  const saddle = bakeFurTile(k, paper, P.apricot, ['#E2B97F', P.saddle, P.apricot, '#C99560'], 9);
  art.zoeCream = mainCtx.createPattern(cream.c, 'repeat');
  art.zoeSaddle = mainCtx.createPattern(saddle.c, 'repeat');
  art.zoeTileK = k;
  art.bakeMs = performance.now() - t0;
  art.bakeCount = bakeCount;
  return art;
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

// Multiply the grain tile over a layer at device-pixel scale.
function grain(L, paper, alpha) {
  const g = L.g;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = alpha;
  g.fillStyle = g.createPattern(paper, 'repeat');
  g.fillRect(0, 0, L.c.width, L.c.height);
  g.restore();
}

// Same idea for cutouts with transparent edges: darken only where there is paint,
// using a "specks" tile whose alpha is the grain's darkness.
let specks = null;
function speckTile(paper) {
  if (specks && specks.src === paper) return specks.c;
  const N = paper.width;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const src = paper.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, N, N);
  const d = src.data;
  for (let i = 0; i < N * N; i++) {
    const lum = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3;
    const a = Math.max(0, Math.min(255, (250 - lum) * 3.5));
    d[i * 4] = 70; d[i * 4 + 1] = 50; d[i * 4 + 2] = 40; d[i * 4 + 3] = a;
  }
  g.putImageData(src, 0, 0);
  specks = { src: paper, c };
  return c;
}

function grainAtop(L, paper, alpha) {
  const g = L.g;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = alpha;
  g.fillStyle = g.createPattern(speckTile(paper), 'repeat');
  g.fillRect(0, 0, L.c.width, L.c.height);
  g.restore();
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

// ---- the bedroom floor: Zoe's floral bedspread, sunny window, sherpa blankets ----
function bakeBackground(k, paper) {
  const L = makeLayer(W, H, k);
  const g = L.g;
  const rng = makeRng(2026);

  g.fillStyle = P.bed;
  g.fillRect(0, 0, W, H);

  // mottled base washes
  const tones = [P.bedDeep, '#B4BACA', P.bedDeep, '#9EA4BA', '#B9B4C4'];
  for (let i = 0; i < 12; i++) {
    const r = 70 + rng() * 90;
    wash(g, polygon(rng() * W, rng() * H, r, 9, rng), tones[i % tones.length], rng, { layers: 10, alpha: 0.05, depth: 3 });
  }

  // floral bedspread: vines, berry-cluster rosettes, dusty-pink leaves
  const step = 92;
  const centers = [];
  for (let row = -1; row < H / step + 1; row++) {
    for (let col = -1; col < W / step + 1; col++) {
      const x = col * step + (row % 2 ? step / 2 : 0) + (rng() - 0.5) * 18;
      const y = row * step + 30 + (rng() - 0.5) * 18;
      centers.push([x, y]);
    }
  }
  // vines first (under the flowers)
  g.lineCap = 'round';
  for (const [x, y] of centers) {
    for (let v = 0; v < 2; v++) {
      const a = rng() * Math.PI * 2, l = 40 + rng() * 30;
      const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l;
      const bend = (rng() - 0.5) * 50;
      const mx = (x + ex) / 2 - Math.sin(a) * bend, my = (y + ey) / 2 + Math.cos(a) * bend;
      g.strokeStyle = P.indigo;
      g.globalAlpha = 0.16;
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(mx, my, ex, ey);
      g.stroke();
      // leaves along the vine
      for (let f = 0.35; f < 1; f += 0.3) {
        const lx = (1 - f) * (1 - f) * x + 2 * (1 - f) * f * mx + f * f * ex;
        const ly = (1 - f) * (1 - f) * y + 2 * (1 - f) * f * my + f * f * ey;
        const la = a + (rng() < 0.5 ? 1 : -1) * (0.9 + rng() * 0.5);
        leaf(g, lx + Math.cos(la) * 5, ly + Math.sin(la) * 5, la, 7 + rng() * 3, rng() < 0.6 ? P.pink : P.teal, rng);
      }
    }
  }
  // rosettes: a teal wash disc ringed with indigo berries
  for (const [x, y] of centers) {
    const r = 13 + rng() * 4;
    wash(g, polygon(x, y, r, 8, rng), P.teal, rng, { layers: 8, alpha: 0.045, depth: 2, var: 0.3, rim: P.indigo, rimAlpha: 0.1 });
    g.fillStyle = P.indigo;
    for (let ring = 0; ring < 2; ring++) {
      const rr = ring ? r * 0.45 : r * 0.85, n = ring ? 5 : 11;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring;
        g.globalAlpha = 0.15 + rng() * 0.1;
        g.beginPath();
        g.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1.6 + rng() * 0.8, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }

  // sunny window light falling across the bed (two panes, mullion gap between)
  for (let p = 0; p < 2; p++) {
    const x0 = 14 + p * 78, y0 = 70, w = 66, h = 150, skew = 60;
    const quad = [[x0, y0], [x0 + w, y0], [x0 + w + skew, y0 + h], [x0 + skew, y0 + h]];
    wash(g, quad, P.sun, rng, { layers: 18, alpha: 0.022, depth: 4, var: 0.3, baseVar: 0.08 });
  }

  // sherpa blanket piles hugging the edges (decor only)
  sherpaPile(g, rng, [[W + 10, 250], [W - 30, 268], [W - 42, 318], [W - 22, 368], [W + 12, 390]]);
  sherpaPile(g, rng, [[-14, H - 112], [32, H - 92], [58, H - 46], [46, H + 12], [-14, H + 12]]);

  // gentle edge darkening
  g.globalAlpha = 1;
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.72);
  vg.addColorStop(0, 'rgba(70,72,100,0)');
  vg.addColorStop(1, 'rgba(70,72,100,0.22)');
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);

  grain(L, paper, 0.55);

  // the HUD strip: a torn strip of paper pinned across the top
  const rngH = makeRng(44);
  const strip = tornOutline([[-6, -6], [W + 6, -6], [W + 6, CONFIG.HUD_H + 1], [-6, CONFIG.HUD_H - 1]], 2.6, rngH);
  g.fillStyle = P.shadow;
  g.save();
  g.translate(0, 3);
  fillPts(g, strip);
  g.restore();
  g.fillStyle = P.paper;
  fillPts(g, strip);
  wash(g, [[0, CONFIG.HUD_H - 10], [W, CONFIG.HUD_H - 12], [W, CONFIG.HUD_H], [0, CONFIG.HUD_H]], P.linen, rngH, { layers: 8, alpha: 0.08, var: 0.1 });
  g.save();
  g.beginPath();
  g.moveTo(strip[0][0], strip[0][1]);
  for (const q of strip) g.lineTo(q[0], q[1]);
  g.closePath();
  g.clip();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = 0.5;
  g.fillStyle = g.createPattern(paper, 'repeat');
  g.fillRect(0, 0, L.c.width, Math.ceil((CONFIG.HUD_H + 6) * k));
  g.restore();

  // ink frame
  g.strokeStyle = P.ink;
  g.globalAlpha = 0.55;
  g.lineWidth = 2;
  g.strokeRect(1, 1, W - 2, H - 2);
  g.globalAlpha = 1;
  return L;
}

function leaf(g, x, y, a, len, color, rng) {
  const c = Math.cos(a), s = Math.sin(a), w = len * 0.38;
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const t = i / 8 * Math.PI * 2;
    const lx = Math.cos(t) * len * 0.5, ly = Math.sin(t) * w * 0.5 * (1 - 0.4 * Math.cos(t));
    pts.push([x + lx * c - ly * s, y + lx * s + ly * c]);
  }
  wash(g, pts, color, rng, { layers: 5, alpha: 0.11, depth: 2, var: 0.18, baseDepth: 1, baseVar: 0.1 });
}

function sherpaPile(g, rng, ring) {
  const base = deform(ring, 3, 0.18, rng);
  const torn = tornOutline(base, 2.2, rng);
  // baked soft shadow (several offset fills; this is bake time, so it's free)
  g.fillStyle = 'rgba(52,50,78,0.07)';
  for (let i = 0; i < 5; i++) {
    g.save();
    g.translate(-2 - i, 3 + i);
    fillPts(g, torn);
    g.restore();
  }
  g.fillStyle = P.sherpa;
  fillPts(g, torn);
  g.save();
  g.beginPath();
  g.moveTo(torn[0][0], torn[0][1]);
  for (const q of torn) g.lineTo(q[0], q[1]);
  g.closePath();
  g.clip();
  wash(g, polygon(ring[2][0], ring[2][1], 34, 8, rng), P.sherpaLight, rng, { layers: 10, alpha: 0.06 });
  // nubbly sherpa curls
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const [x, y] of torn) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  g.lineWidth = 1.1;
  g.lineCap = 'round';
  for (let i = 0; i < (maxX - minX) * (maxY - minY) / 14; i++) {
    const x = minX + rng() * (maxX - minX), y = minY + rng() * (maxY - minY);
    g.strokeStyle = rng() < 0.55 ? P.sherpaDark : P.sherpaLight;
    g.globalAlpha = 0.35 + rng() * 0.3;
    g.beginPath();
    g.arc(x, y, 1.2 + rng() * 1.3, rng() * 6, rng() * 6 + 3.5);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
  // torn paper rim + ink edge
  g.strokeStyle = P.paper;
  g.globalAlpha = 0.7;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(torn[0][0], torn[0][1]);
  for (const q of torn) g.lineTo(q[0], q[1]);
  g.closePath();
  g.stroke();
  g.strokeStyle = P.sherpaDark;
  g.globalAlpha = 0.6;
  g.lineWidth = 0.8;
  g.stroke();
  g.globalAlpha = 1;
}

// Grow a closed polygon outward by d along each vertex's averaged normal.
function offsetPts(pts, d) {
  // signed area tells us which side is "out"
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  const sgn = a > 0 ? -1 : 1;
  return pts.map((p, i) => {
    const prev = pts[(i - 1 + pts.length) % pts.length], next = pts[(i + 1) % pts.length];
    let nx = (next[1] - prev[1]) * sgn, ny = -(next[0] - prev[0]) * sgn;
    const l = Math.hypot(nx, ny) || 1;
    return [p[0] + (nx / l) * d, p[1] + (ny / l) * d];
  });
}

function pathPts(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}

function smoothPts(pts, n = 3) {
  // Chaikin corner cutting for soft shapes
  let cur = pts;
  for (let k = 0; k < n; k++) {
    const out = [];
    for (let i = 0; i < cur.length; i++) {
      const a = cur[i], b = cur[(i + 1) % cur.length];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    cur = out;
  }
  return cur;
}

// ---- torn-paper item stickers (sock, shoe, cheese wedge) ----
function bakeSticker(type, k, paper) {
  const S = type === 'shoe' ? 34 : 28;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(type.length * 97 + 3);
  g.translate(S / 2, S / 2);
  g.lineJoin = 'round';
  g.lineCap = 'round';

  let shape, details;
  if (type === 'sock') {
    shape = smoothPts([[-4.5, -9], [3, -9], [3, 1.5], [9, 2], [10, 6.5], [6, 9], [-2.5, 8.5], [-5, 5]], 2);
    details = () => {
      g.fillStyle = P.sockStripe;
      g.globalAlpha = 0.95;
      g.fillRect(-5, -9.5, 8.5, 3.2);                 // cuff
      g.globalAlpha = 0.75;
      g.fillRect(-5, -4.4, 8.5, 1.6);                 // stripe
      g.beginPath(); g.ellipse(-2.6, 6.3, 3.6, 3, 0, 0, Math.PI * 2); g.fill(); // heel
      g.beginPath(); g.ellipse(8, 4.6, 3, 3.2, 0, 0, Math.PI * 2); g.fill();    // toe
      g.globalAlpha = 1;
    };
  } else if (type === 'shoe') {
    shape = smoothPts([[-13, -2], [-11, -7], [-5, -7.5], [-1, -3], [7, -2], [12.5, 1.5], [13, 6], [-13, 6]], 2);
    details = () => {
      g.fillStyle = P.sole;
      g.fillRect(-14, 3.5, 28, 3.5);                  // sole
      g.fillStyle = P.shoeDark;
      g.globalAlpha = 0.6;
      g.beginPath(); g.ellipse(-8.5, -5, 3.2, 1.6, 0, 0, Math.PI * 2); g.fill(); // ankle opening
      g.globalAlpha = 1;
      g.strokeStyle = P.sole;
      g.lineWidth = 1.1;
      for (let i = 0; i < 3; i++) {                    // laces
        g.beginPath(); g.moveTo(-3 + i * 2.6, -4.5 + i * 0.6); g.lineTo(-0.8 + i * 2.6, -1.4 + i * 0.4); g.stroke();
      }
    };
  } else {
    shape = smoothPts([[-10, 6], [-10, -1], [9, -7], [10, 6]], 1);
    details = () => {
      g.fillStyle = '#F8D982';
      g.beginPath(); g.moveTo(-10, -1); g.lineTo(9, -7); g.lineTo(10, -4); g.lineTo(-9, 2); g.closePath(); g.fill(); // top face
      g.fillStyle = P.cheeseDark;
      for (const [x, y, r] of [[-5, 3, 1.8], [1, 2.2, 1.3], [5.5, 3.8, 2], [3, -2.2, 1]]) {
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    };
  }
  const color = type === 'sock' ? P.sock : type === 'shoe' ? P.shoe : P.cheese;
  const rim = tornOutline(offsetPts(shape, 2.4), 1.4, rng);

  // shadow, then paper rim
  g.fillStyle = P.shadow;
  g.save(); g.translate(1.6, 2.2); fillPts(g, rim); g.restore();
  g.fillStyle = P.paper;
  fillPts(g, rim);

  // painted shape: flat base + a few wash layers
  g.save();
  pathPts(g, shape);
  g.clip();
  g.fillStyle = color;
  fillPts(g, shape);
  wash(g, polygon(-2, -2, 7, 7, rng), '#ffffff', rng, { layers: 5, alpha: 0.06 });
  wash(g, polygon(4, 4, 8, 7, rng), '#000000', rng, { layers: 4, alpha: 0.05 });
  details();
  g.restore();

  g.strokeStyle = P.ink;
  g.lineWidth = 1.1;
  pathPts(g, shape);
  g.stroke();
  grainAtop(L, paper, 0.3);
  return L;
}

// ---- other dogs: cool-grey paper cutouts, seen from above, facing +x ----
function bakeDog(variant, k, paper) {
  const S = 50;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(300 + variant);
  const body = variant ? P.dog2 : P.dog;
  const dark = variant ? P.dog2Dark : P.dogDark;
  g.translate(S / 2 - 3, S / 2);
  g.lineJoin = 'round';
  g.lineCap = 'round';

  const r = CONFIG.DOG_RADIUS;
  const bodyPts = polygon(0, 0, r, 22, null, r * 1.15, r * 0.88);
  const headPts = polygon(r * 0.95, 0, 7.4, 16, null, 7.6, 7);
  const snoutPts = polygon(r * 0.95 + 6.5, 0, 4, 12, null, 4.6, 3.6);
  const tailPts = smoothPts([[-r * 1.1, -1.6], [-r * 1.1 - 6, -2.6], [-r * 1.1 - 7.5, 0], [-r * 1.1 - 6, 2.6], [-r * 1.1, 1.6]], 1);
  const ears = [smoothPts([[r * 0.7, -5], [r * 0.6 - 2, -10.5], [r * 0.95 + 1, -7]], 1), smoothPts([[r * 0.7, 5], [r * 0.6 - 2, 10.5], [r * 0.95 + 1, 7]], 1)];
  const all = [tailPts, bodyPts, headPts, snoutPts, ...ears];

  // shadow + paper rim behind every part
  g.fillStyle = P.shadow;
  g.save(); g.translate(2, 2.8); for (const s of all) fillPts(g, offsetPts(s, 1.6)); g.restore();
  g.fillStyle = P.paper;
  for (const s of all) fillPts(g, tornOutline(offsetPts(s, 1.6), 0.9, rng));

  const part = (pts, fill) => {
    g.fillStyle = fill;
    fillPts(g, pts);
    g.strokeStyle = '#2E2B36';
    g.lineWidth = 1;
    pathPts(g, pts);
    g.stroke();
  };
  part(tailPts, dark);
  part(bodyPts, body);
  // darker back patch
  g.save(); pathPts(g, bodyPts); g.clip();
  wash(g, polygon(-3, 0, 7, 8, rng, 9, 5), dark, rng, { layers: 8, alpha: 0.1 });
  g.restore();
  part(headPts, body);
  part(snoutPts, P.dogLight);
  for (const e of ears) part(e, dark);
  // grumpy eyes + brows, nose
  g.fillStyle = '#1E1B24';
  for (const s of [-1, 1]) {
    g.beginPath(); g.arc(r * 0.95 + 2.5, s * 3, 1.3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#1E1B24';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(r * 0.95 + 0.5, s * 5); g.lineTo(r * 0.95 + 4, s * 2.6); g.stroke();
  }
  g.beginPath(); g.ellipse(r * 0.95 + 10.4, 0, 1.6, 2, 0, 0, Math.PI * 2); g.fill();
  grainAtop(L, paper, 0.35);
  L.ox = S / 2 - 3; // sprite origin (dog centre) inside the layer
  L.oy = S / 2;
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
