// Theme: Bedroom (the default). Zoe's own room: a floral bedspread, a sunny
// window, sherpa blanket piles, socks, shoes, cheese, two grumpy grey dogs and
// a soapy bath. This file is also the reference for the other themes: any
// field a theme leaves out falls back to the Bedroom's. Interface: README.md.

import { CONFIG } from '../../config.js';
import { P } from '../art/palette.js';
import {
  makeRng, makeLayer, polygon, deform, fillPts, wash, tornOutline,
  offsetPts, pathPts, smoothPts, grain, grainAtop,
} from '../art/util.js';

const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;

export default {
  id: 'bedroom',
  name: 'Bedroom',
  chip: { color: '#C9D0DF', ink: '#3F4A73' },
  letterbox: '#4a4f66',
  palette: {},                 // the base colors in art/palette.js

  bakeBackground,              // (k, paper) -> 400 x 600 layer: floor, hiding spots, HUD strip, frame
  bakeItem: bakeSticker,       // (type, k, paper), type = 'sock' (1 pt) | 'shoe' (3 pt) | 'cheese'
  bakeCritter: bakeDog,        // (variant 0 | 1, k, paper) -> layer facing +x, origin at L.ox, L.oy
  critterMotion: 'waddle',     // 'waddle' | 'hop' | 'float' (looks only)
  bakeBall,                    // (k, paper)
  bakeHazard: bakeBath,        // (k, paper) -> layer, origin at L.ox, L.oy
  bakeHazardBubble: bakeBubble,// (k, paper) -> small sprite that floats up off the hazard
  bakeHideFlap: bakeTuck,      // (k, paper) -> flap drawn over her head when she hides

  costume: {
    hideCollar: false,         // the Bedroom "costume" is just her navy collar
    bake: null,
    body: null,
    head: null,
  },

  drawChipIcon,                // (g) vector icon, about 24 x 24, centred on 0, 0
  sfx: {},                     // no sound twist

  words: {
    ball: 'Ball', ballTip: 'grab it for the zoomies!',
    hide: 'Blankets', hideTip: 'hide under one: dogs lose you',
    hazard: 'Bath', hazardTip: 'dodge it, or your leash gets soggy',
    critters: 'Dogs', critterTip: 'a bump makes Zoe dizzy, and a', critterTip2: 'touch on the leash snaps it',
  },
};

// Picker chip: a little striped sock.
function drawChipIcon(g) {
  const sock = [[-4, -9], [3, -9], [3, 1], [8.5, 2], [9.5, 6], [6, 8.5], [-2.5, 8], [-4.5, 4.5]];
  g.lineJoin = 'round';
  g.scale(1.3, 1.3);
  g.fillStyle = P.sock;
  fillPts(g, sock);
  g.fillStyle = P.sockStripe;
  g.fillRect(-4.5, -9, 8, 3);
  g.fillRect(-4.5, -4, 8, 1.6);
  g.strokeStyle = P.ink;
  g.lineWidth = 1.2;
  pathPts(g, sock);
  g.stroke();
}

// ---------------------------------------------------------------- the bakers
// Moved from art/bake.js in T1 without changes (only a few literal colors now
// read same-valued palette keys, so the other themes can recolor them).

// ---- the bedroom floor: Zoe's floral bedspread, sunny window, sherpa blankets ----
function bakeBackground(k, paper) {
  const L = makeLayer(W, H, k);
  const g = L.g;
  const rng = makeRng(2026);

  g.fillStyle = P.bed;
  g.fillRect(0, 0, W, H);

  // mottled base washes
  const tones = [P.bedDeep, P.bedTone1, P.bedDeep, P.bedTone2, P.bedTone3];
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

  // sherpa blanket piles hugging the edges (Zoe hides in these: CONFIG.BLANKETS)
  for (const ring of CONFIG.BLANKETS) sherpaPile(g, rng, ring);

  // gentle edge darkening
  g.globalAlpha = 1;
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.72);
  vg.addColorStop(0, 'rgba(' + P.vignette + ',0)');
  vg.addColorStop(1, 'rgba(' + P.vignette + ',0.22)');
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
      g.fillStyle = P.cheeseTop;
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
    g.strokeStyle = P.dogInk;
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
  g.fillStyle = P.dogEye;
  for (const s of [-1, 1]) {
    g.beginPath(); g.arc(r * 0.95 + 2.5, s * 3, 1.3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = P.dogEye;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(r * 0.95 + 0.5, s * 5); g.lineTo(r * 0.95 + 4, s * 2.6); g.stroke();
  }
  g.beginPath(); g.ellipse(r * 0.95 + 10.4, 0, 1.6, 2, 0, 0, Math.PI * 2); g.fill();
  grainAtop(L, paper, 0.35);
  L.ox = S / 2 - 3; // sprite origin (dog centre) inside the layer
  L.oy = S / 2;
  return L;
}

// ---------------------------------------------------------------- Phase 4A sprites

// Her red-orange ball: a paper-cutout disc with a curved cream seam.
// No shadow baked in: the renderer puts a hard shadow on the floor so it can bounce.
function bakeBall(k, paper) {
  const S = 26, r = CONFIG.BALL_RADIUS;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(808);
  g.translate(S / 2, S / 2);
  const disc = polygon(0, 0, r, 28, null);
  g.fillStyle = P.paper;
  fillPts(g, tornOutline(polygon(0, 0, r + 2, 28, null), 1.1, rng));
  g.save();
  pathPts(g, disc);
  g.clip();
  g.fillStyle = P.ball;
  fillPts(g, disc);
  wash(g, polygon(-2.5, -2.5, 4.5, 7, rng), '#ffffff', rng, { layers: 6, alpha: 0.07 });
  wash(g, polygon(3, 3.5, 6, 7, rng), P.ballDark, rng, { layers: 6, alpha: 0.12 });
  g.strokeStyle = P.ballSeam;
  g.lineWidth = 1.5;
  g.lineCap = 'round';
  g.beginPath(); g.arc(-r * 1.25, 0, r * 0.95, -0.9, 0.9); g.stroke();
  g.beginPath(); g.arc(r * 1.25, 0, r * 0.95, Math.PI - 0.9, Math.PI + 0.9); g.stroke();
  g.fillStyle = 'rgba(255,248,230,0.85)';
  g.beginPath(); g.ellipse(-2.6, -3.2, 1.8, 1.1, -0.6, 0, Math.PI * 2); g.fill();
  g.restore();
  g.strokeStyle = P.ink;
  g.lineWidth = 1.1;
  pathPts(g, disc);
  g.stroke();
  grainAtop(L, paper, 0.3);
  return L;
}

// The bath: a soapy watercolor puddle on a torn paper rim, foam along its edge.
function bakeBath(k, paper) {
  const rx = CONFIG.BATH_RX, ry = CONFIG.BATH_RY;
  const SW = rx * 2 + 26, SH = ry * 2 + 26;
  const L = makeLayer(SW, SH, k);
  const g = L.g;
  const rng = makeRng(4242);
  g.translate(SW / 2, SH / 2);
  g.lineJoin = 'round';
  const shape = smoothPts(deform(polygon(0, 0, rx, 12, rng, rx + 1, ry + 1), 1, 0.06, rng), 2);
  const rim = tornOutline(offsetPts(shape, 2.6), 1.6, rng);

  g.fillStyle = P.shadow;
  g.save(); g.translate(2.2, 3); fillPts(g, rim); g.restore();
  g.fillStyle = P.paper;
  fillPts(g, rim);
  g.save();
  pathPts(g, shape);
  g.clip();
  g.fillStyle = P.water;
  fillPts(g, shape);
  wash(g, polygon(4, 5, rx * 0.8, 9, rng, rx * 0.8, ry * 0.7), P.waterDeep, rng, { layers: 12, alpha: 0.07 });
  wash(g, polygon(-8, -6, rx * 0.5, 8, rng, rx * 0.5, ry * 0.4), '#ffffff', rng, { layers: 8, alpha: 0.09 });
  // ripples
  g.strokeStyle = P.ripple;
  g.lineWidth = 1;
  g.lineCap = 'round';
  for (const [x, y, w] of [[-6, 2, 9], [8, -5, 6], [5, 8, 7]]) {
    g.beginPath(); g.ellipse(x, y, w, w * 0.35, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  }
  g.restore();
  g.strokeStyle = P.waterInk;
  g.globalAlpha = 0.85;
  g.lineWidth = 1.1;
  pathPts(g, shape);
  g.stroke();
  g.globalAlpha = 1;
  // foam clumps along the rim
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rng() * 0.3;
    const fx = Math.cos(a) * rx * 0.95, fy = Math.sin(a) * ry * 0.95;
    for (let j = 0; j < 3; j++) {
      const r = 2 + rng() * 2.6;
      const x = fx + (rng() - 0.5) * 5, y = fy + (rng() - 0.5) * 4;
      g.fillStyle = P.foam;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = P.foamRim;
      g.lineWidth = 0.6;
      g.beginPath(); g.arc(x, y, r, Math.PI * 0.1, Math.PI * 0.9); g.stroke();
    }
  }
  grainAtop(L, paper, 0.25);
  L.ox = SW / 2;
  L.oy = SH / 2;
  return L;
}

// One soap bubble (drawn at several sizes as they float up from the bath).
function bakeBubble(k) {
  const S = 14;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const c = S / 2, r = S / 2 - 1.2;
  g.fillStyle = P.bubble;
  g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = P.bubbleRim;
  g.lineWidth = 0.9;
  g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.lineWidth = 1.2;
  g.beginPath(); g.arc(c, c, r - 1.6, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(c + r * 0.35, c - r * 0.4, 0.9, 0, Math.PI * 2); g.fill();
  return L;
}

// Blanket-tuck overlay: a sherpa flap laid over Zoe's head when she hides.
// Drawn facing +x; the front edge is flat-ish so her nose can peek out.
function bakeTuck(k, paper) {
  const S = 40;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(77);
  g.translate(S / 2, S / 2);
  const base = smoothPts([[-13, -11], [5, -13], [9, -6], [8, 6], [5, 13], [-13, 11], [-16, 0]], 2);
  const torn = tornOutline(deform(base, 1, 0.05, rng), 1.6, rng);
  g.fillStyle = P.shadow;
  g.save(); g.translate(1.8, 2.6); fillPts(g, torn); g.restore();
  g.fillStyle = P.sherpa;
  fillPts(g, torn);
  g.save();
  pathPts(g, torn);
  g.clip();
  wash(g, polygon(-3, -3, 9, 8, rng), P.sherpaLight, rng, { layers: 8, alpha: 0.08 });
  g.lineWidth = 1.1;
  g.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const x = -16 + rng() * 26, y = -13 + rng() * 26;
    g.strokeStyle = rng() < 0.55 ? P.sherpaDark : P.sherpaLight;
    g.globalAlpha = 0.35 + rng() * 0.3;
    g.beginPath(); g.arc(x, y, 1.2 + rng() * 1.3, rng() * 6, rng() * 6 + 3.5); g.stroke();
  }
  // the lifted front fold catches the light
  g.globalAlpha = 0.5;
  g.strokeStyle = P.sherpaLight;
  g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(5, -11); g.quadraticCurveTo(10, 0, 5, 11); g.stroke();
  g.globalAlpha = 1;
  g.restore();
  g.strokeStyle = P.paper;
  g.globalAlpha = 0.7;
  g.lineWidth = 1.2;
  pathPts(g, torn);
  g.stroke();
  g.strokeStyle = P.sherpaDark;
  g.globalAlpha = 0.8;
  g.lineWidth = 0.8;
  g.stroke();
  g.globalAlpha = 1;
  grainAtop(L, paper, 0.25);
  return L;
}
