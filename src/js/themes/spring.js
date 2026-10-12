// Theme: Spring, "Spring Garden". A sunny back lawn: grass and clover, flower
// beds in the corners, a leafy branch overhead throwing dappled shade. Zoe
// (in a flower crown) hunts tulips, carrots and cheese, dodges hopping bunnies
// and a rain puddle, and hides in two leafy bushes. Interface: README.md.

import { CONFIG } from '../../config.js';
import { P } from '../art/palette.js';
import {
  makeRng, makeLayer, polygon, deform, fillPts, wash, tornOutline,
  offsetPts, pathPts, smoothPts, grain, grainAtop,
} from '../art/util.js';

const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;
const TAU = Math.PI * 2;

// Theme-only colors (not palette keys).
const C = {
  leaf: '#6FAE4E', leafLight: '#9CCB6A', leafDark: '#3F7A36', leafInk: '#2C5A2A',
  soil: '#8A6A4C', soilDark: '#6A4E36',
  forget: '#86AEE6', blossom: '#F2A7BE', blossomDeep: '#D9789A', butter: '#F7D867', lilac: '#BFA2E0',
  white: '#FFFDF4', clover: '#4E8A3E',
  tulip: '#E04A64', tulipDark: '#A82C48', tulipLight: '#F48A9C',
  carrot: '#F08A2C', carrotDark: '#BE5E16', carrotLight: '#F8B062',
  earPink: '#EEA8B6', tail: '#FFFBF4',
  mud: '#7C6A4E',
};

export default {
  id: 'spring',
  name: 'Spring Garden',
  chip: { color: '#C4E0A2', ink: '#3E6E3A' },
  letterbox: '#3f5a3a',
  palette: {
    bed: '#9AC074', bedDeep: '#89B266', bedTone1: '#A9CA82', bedTone2: '#8EB46A', bedTone3: '#A6C77C',
    vignette: '40,70,36',
    indigo: '#2F5238',          // nap "Z"s
    teal: '#3D6A7C',            // the "?" over a confused bunny
    pink: '#F2A7BE',            // confetti petals
    sun: '#FFF3C2',
    sherpa: '#4F8C44', sherpaDark: '#2F5E2C', sherpaLight: '#8CC462', // bush fluff bits
    sock: C.tulip, sockStripe: C.tulipLight,
    shoe: C.carrot, shoeDark: C.carrotDark, sole: '#5E9E3E',
    ball: '#9AD8D6', ballDark: '#62AEB4', ballSeam: '#FBF6EC',
    water: '#A9C4D8', waterDeep: '#7598B4', waterInk: '#466078', foam: '#E4F0F6',
    foamRim: 'rgba(70,96,120,0.45)', bubble: 'rgba(200,226,240,0.6)', bubbleRim: 'rgba(70,96,120,0.75)',
    dog: '#ABA7B6', dogDark: '#837F92', dogLight: '#D8D4E0', dog2: '#767A8C', dog2Dark: '#55596C',
    dogInk: '#3C3A4A', dogEye: '#221F2A',
    dust: '#E8E2C8',
  },

  bakeBackground,
  bakeItem,
  bakeCritter: bakeBunny,
  critterMotion: 'hop',
  bakeBall,
  bakeHazard: bakePuddle,
  bakeHazardBubble: bakeDroplet,
  bakeHideFlap: bakeLeafFlap,

  costume: {
    hideCollar: false,          // her navy collar still shows under the crown
    bake: bakeCrown,
    body: null,
    head(ctx, z, sprites) {
      // The crown sits on the back of her skull, behind her eyes (x < 1).
      if (!sprites) return;
      const s = sprites.crown;
      ctx.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h);
    },
  },

  drawChipIcon,

  sfx: {
    pop: { wave: 'sine', pitch: 1.12 },
    catchLayer: birdsong,
  },

  words: {
    loot: 'tulips & carrots',
    ball: 'Ball', ballTip: 'grab it for the zoomies!',
    hide: 'Bushes', hideTip: 'hide in one: bunnies lose you',
    hazard: 'Puddle', hazardTip: 'dodge it, or your leash gets soggy',
    critters: 'Bunnies', critterTip: 'a bump makes Zoe dizzy, and a', critterTip2: 'touch on the leash snaps it',
  },
};

// ---------------------------------------------------------------- sound
// A little robin-ish "chee-rup" on every catch: quick up-swooping whistles,
// one more note per chain level (up to four), the last one trilled.
function birdsong(a, t, chain) {
  const notes = Math.min(4, 2 + (chain | 0));
  const base = 2500 * a.rnd(0.14);
  for (let i = 0; i < notes; i++) {
    const st = t + 0.05 + i * 0.075;
    const f = base * (1 + 0.07 * i) * (i % 2 ? 1.12 : 1);
    const last = i === notes - 1;
    const osc = a.voice('sine', st, last ? 0.12 : 0.055, last ? 0.09 : 0.11,
      [[f * 0.78, 0], [f * 1.3, 0.025], [f * 1.08, last ? 0.11 : 0.05]], a.out, 0.004);
    if (last && osc) a.lfo(st, st + 0.12, 34, f * 0.06, [osc.frequency]);
  }
}

// ---------------------------------------------------------------- chip icon
// A daisy: ten white petals, butter-yellow centre, two leaves.
function drawChipIcon(g) {
  g.lineJoin = 'round';
  g.fillStyle = C.leaf;
  g.strokeStyle = C.leafInk;
  g.lineWidth = 0.9;
  for (const s of [-1, 1]) {
    fillPts(g, leafPts(s * 7, 7, s > 0 ? 0.6 : Math.PI - 0.6, 9, 4.2));
    pathPts(g, leafPts(s * 7, 7, s > 0 ? 0.6 : Math.PI - 0.6, 9, 4.2));
    g.stroke();
  }
  g.fillStyle = C.white;
  g.strokeStyle = '#6B4A2F';
  g.lineWidth = 0.8;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    g.beginPath(); g.ellipse(Math.cos(a) * 6.4, Math.sin(a) * 6.4, 4, 1.9, a, 0, TAU); g.fill(); g.stroke();
  }
  g.fillStyle = '#F2C14E';
  g.beginPath(); g.arc(0, 0, 3.8, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#D9962A';
  for (let i = 0; i < 5; i++) { const a = i * 1.3; g.beginPath(); g.arc(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0.6, 0, TAU); g.fill(); }
}

// ---------------------------------------------------------------- shared shapes

// A pointed leaf polygon: base at (x, y), pointing along angle a.
function leafPts(x, y, a, len, wid) {
  const c = Math.cos(a), s = Math.sin(a), pts = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {          // one side, base -> tip
    const u = i / n, v = Math.sin(Math.PI * u) * Math.pow(1 - u, 0.25) * wid / 2;
    pts.push([u * len, v]);
  }
  for (let i = n - 1; i > 0; i--) { const [u, v] = pts[i]; pts.push([u, -v]); }
  return pts.map(([u, v]) => [x + u * c - v * s, y + u * s + v * c]);
}

// A leaf cutout with an ink edge and midrib (bake time only).
function leafCut(g, x, y, a, len, wid, fill, ink, alpha = 1) {
  const pts = leafPts(x, y, a, len, wid);
  g.globalAlpha = alpha;
  g.fillStyle = fill;
  fillPts(g, pts);
  g.strokeStyle = ink;
  g.lineWidth = 0.7;
  g.globalAlpha = alpha * 0.8;
  pathPts(g, pts);
  g.stroke();
  g.globalAlpha = alpha * 0.45;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + Math.cos(a) * len * 0.8, y + Math.sin(a) * len * 0.8);
  g.stroke();
  g.globalAlpha = 1;
}

// A small five-petal flower (bake time only).
function flower(g, x, y, r, petal, centre, rot = 0, ink = null) {
  g.fillStyle = petal;
  for (let i = 0; i < 5; i++) {
    const a = rot + (i / 5) * TAU;
    g.beginPath(); g.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, 0, TAU); g.fill();
  }
  if (ink) {
    g.strokeStyle = ink;
    g.lineWidth = 0.45;
    for (let i = 0; i < 5; i++) {
      const a = rot + (i / 5) * TAU;
      g.beginPath(); g.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, a - 1.6, a + 1.6); g.stroke();
    }
  }
  g.fillStyle = centre;
  g.beginPath(); g.arc(x, y, r * 0.34, 0, TAU); g.fill();
}

function pip(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function bounds(pts) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1 };
}

// A bumpy "cloud" outline round a ring: the ring pushed outward in leafy scallops.
function bushOutline(ring, rng, bump) {
  const base = smoothPts(ring, 2);
  const out = [];
  const grown = offsetPts(base, bump * 0.4);
  for (let i = 0; i < grown.length; i++) {
    const a = grown[i], b = grown[(i + 1) % grown.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
    const steps = Math.max(2, Math.round(len / 1.5));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, nx, ny]);
    }
  }
  // scallops: |sin| bumps along the perimeter
  let acc = 0, per = 9 + rng() * 3;
  const pts = [];
  for (let i = 0; i < out.length; i++) {
    const [x, y, nx, ny] = out[i];
    const pv = out[(i - 1 + out.length) % out.length];
    acc += Math.hypot(x - pv[0], y - pv[1]);
    if (acc > per) { acc -= per; per = 8 + rng() * 5; }
    const h = Math.sin(Math.PI * acc / per) * bump;
    pts.push([x - nx * h, y - ny * h]);
  }
  // The normal's sign depends on the ring's winding: if the bumps went inward, mirror them out.
  const area = (p) => { let s = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) s += p[j][0] * p[i][1] - p[i][0] * p[j][1]; return Math.abs(s); };
  if (area(pts) < area(grown)) {
    for (let i = 0; i < out.length; i++) pts[i] = [2 * out[i][0] - pts[i][0], 2 * out[i][1] - pts[i][1]];
  }
  return pts;
}

// ---------------------------------------------------------------- the lawn
function bakeBackground(k, paper) {
  const L = makeLayer(W, H, k);
  const g = L.g;
  const rng = makeRng(4404);

  g.fillStyle = P.bed;
  g.fillRect(0, 0, W, H);

  // mottled grass washes
  const tones = [P.bedDeep, P.bedTone1, P.bedTone2, P.bedTone3, P.bedTone1];
  for (let i = 0; i < 12; i++) {
    const r = 70 + rng() * 90;
    wash(g, polygon(rng() * W, rng() * H, r, 9, rng), tones[i % tones.length], rng, { layers: 9, alpha: 0.045, depth: 3 });
  }

  // grass blades: short ink-free strokes in light and dark greens
  g.lineCap = 'round';
  const blades = ['#6E9A50', '#B4D28A', '#5F8C46', '#C6DE9C'];
  for (let i = 0; i < 2000; i++) {
    const x = rng() * W, y = rng() * H, l = 3 + rng() * 4, a = -Math.PI / 2 + (rng() - 0.5) * 0.9;
    g.strokeStyle = blades[i % 4];
    g.globalAlpha = 0.18 + rng() * 0.2;
    g.lineWidth = 0.8 + rng() * 0.5;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 1, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  g.globalAlpha = 1;

  // a few broad, very soft sunny warm spots
  for (let i = 0; i < 6; i++) {
    const x = 60 + rng() * (W - 120), y = 200 + rng() * (H - 260);
    wash(g, polygon(x, y, 40 + rng() * 30, 8, rng), P.sun, rng, { layers: 6, alpha: 0.035, depth: 2, var: 0.4 });
  }

  // clover patches: little trefoils, a few white clover puffs
  for (let p = 0; p < 26; p++) {
    const cx = 20 + rng() * (W - 40), cy = 60 + rng() * (H - 80);
    const n = 4 + Math.floor(rng() * 6);
    for (let i = 0; i < n; i++) {
      const x = cx + (rng() - 0.5) * 30, y = cy + (rng() - 0.5) * 22;
      trefoil(g, x, y, 2.2 + rng() * 1.2, rng() * TAU, rng() < 0.5 ? C.clover : '#5E9A48', 0.42 + rng() * 0.2);
    }
    if (rng() < 0.45) cloverPuff(g, cx + (rng() - 0.5) * 16, cy + (rng() - 0.5) * 12, rng);
  }

  // a few lawn daisies (small, so they never look like the tulip loot)
  for (let i = 0; i < 16; i++) {
    const x = 20 + rng() * (W - 40), y = 70 + rng() * (H - 90);
    g.globalAlpha = 0.8;
    flower(g, x, y, 3.4, C.white, '#F2C14E', rng() * TAU);
    g.globalAlpha = 1;
  }

  // flower beds in three corners (clear of the bushes)
  flowerBed(g, rng, [[300, 44], [400, 44], [400, 150], [366, 138], [330, 112], [298, 78]], 1);
  flowerBed(g, rng, [[0, 168], [30, 178], [46, 220], [44, 282], [26, 330], [0, 342]], 2);
  flowerBed(g, rng, [[400, 492], [400, 600], [276, 600], [292, 566], [330, 528], [368, 512]], 3);

  // the leafy branch overhead: a pool of shade under it, flecked with sun
  wash(g, polygon(100, 105, 110, 10, rng, 125, 62), '#3D6A34', rng, { layers: 8, alpha: 0.022, depth: 3, var: 0.5 });
  for (let i = 0; i < 46; i++) {
    const a = rng() * TAU, d = Math.sqrt(rng());
    const x = 100 + Math.cos(a) * d * 115, y = 105 + Math.sin(a) * d * 58;
    g.globalAlpha = 0.12 + rng() * 0.14;
    g.fillStyle = P.sun;
    g.beginPath(); g.ellipse(x, y, 2 + rng() * 4.5, 1.5 + rng() * 3, rng() * 3, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  branch(g, rng);

  // the two bushes Zoe hides in, on CONFIG.BLANKETS
  CONFIG.BLANKETS.forEach((ring, i) => leafyBush(g, makeRng(77 + i * 13), ring));

  // gentle edge darkening
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.72);
  vg.addColorStop(0, 'rgba(' + P.vignette + ',0)');
  vg.addColorStop(1, 'rgba(' + P.vignette + ',0.22)');
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);

  grain(L, paper, 0.5);
  hudStrip(L, paper);

  // ink frame
  g.strokeStyle = P.ink;
  g.globalAlpha = 0.55;
  g.lineWidth = 2;
  g.strokeRect(1, 1, W - 2, H - 2);
  g.globalAlpha = 1;
  return L;
}

function trefoil(g, x, y, r, rot, color, alpha) {
  g.fillStyle = color;
  g.globalAlpha = alpha;
  for (let i = 0; i < 3; i++) {
    const a = rot + (i / 3) * TAU;
    // a heart-ish leaf: two overlapping circles
    for (const s of [-0.38, 0.38]) {
      g.beginPath(); g.arc(x + Math.cos(a + s) * r * 0.85, y + Math.sin(a + s) * r * 0.85, r * 0.58, 0, TAU); g.fill();
    }
  }
  g.globalAlpha = 1;
}

function cloverPuff(g, x, y, rng) {
  g.globalAlpha = 0.85;
  g.fillStyle = '#F4E8EC';
  g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill();
  g.strokeStyle = '#D9A8BA';
  g.lineWidth = 0.6;
  for (let i = 0; i < 9; i++) {
    const a = rng() * TAU, r = rng() * 2.6;
    g.beginPath(); g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a) * (r + 0.9), y + Math.sin(a) * (r + 0.9)); g.stroke();
  }
  g.globalAlpha = 1;
}

// A soft soil-and-foliage patch full of forget-me-nots, pink blossoms and buttercups.
function flowerBed(g, rng, ring, kind) {
  const shape = deform(ring, 2, 0.08, rng);
  wash(g, shape, C.soil, rng, { layers: 8, alpha: 0.06, depth: 2, var: 0.18, baseDepth: 1, baseVar: 0.05 });
  const b = bounds(ring);
  // foliage clumps
  for (let i = 0; i < 14; i++) {
    const x = b.x0 + rng() * (b.x1 - b.x0), y = b.y0 + rng() * (b.y1 - b.y0);
    if (!pip(x, y, ring)) continue;
    wash(g, polygon(x, y, 8 + rng() * 6, 7, rng), i % 2 ? C.leafDark : C.leaf, rng, { layers: 5, alpha: 0.09, depth: 2, var: 0.35 });
  }
  for (let i = 0; i < 26; i++) {
    const x = b.x0 + rng() * (b.x1 - b.x0), y = b.y0 + rng() * (b.y1 - b.y0);
    if (!pip(x, y, ring)) continue;
    leafCut(g, x, y, rng() * TAU, 7 + rng() * 4, 3.4, rng() < 0.5 ? C.leaf : '#5E9E46', C.leafInk, 0.75);
  }
  // flowers
  const sets = {
    1: [[C.forget, '#F7E07A'], [C.blossom, '#FFF4D8'], [C.white, '#F2C14E']],
    2: [[C.lilac, '#FFF4D8'], [C.butter, '#E8A030'], [C.forget, '#F7E07A']],
    3: [[C.blossom, '#FFF4D8'], [C.forget, '#F7E07A'], [C.butter, '#E8A030']],
  }[kind];
  for (let i = 0; i < 60; i++) {
    const x = b.x0 + rng() * (b.x1 - b.x0), y = b.y0 + rng() * (b.y1 - b.y0);
    if (!pip(x, y, ring)) continue;
    const [pc, cc] = sets[Math.floor(rng() * sets.length)];
    g.globalAlpha = 0.9;
    flower(g, x, y, 3 + rng() * 2.2, pc, cc, rng() * TAU, 'rgba(60,70,60,0.5)');
    g.globalAlpha = 1;
  }
}

// Fresh leaves on a branch reaching in from the top-left, under the HUD strip.
function branch(g, rng) {
  // twig
  g.strokeStyle = '#7A5A3C';
  g.lineCap = 'round';
  g.lineWidth = 3.2;
  g.globalAlpha = 0.9;
  g.beginPath(); g.moveTo(-6, 58); g.quadraticCurveTo(70, 46, 150, 54); g.stroke();
  g.lineWidth = 1.8;
  g.beginPath(); g.moveTo(60, 50); g.quadraticCurveTo(90, 66, 112, 84); g.stroke();
  g.beginPath(); g.moveTo(120, 52); g.quadraticCurveTo(170, 50, 205, 62); g.stroke();
  g.globalAlpha = 1;
  const along = [[-4, 58, 150, 54, 70, 46], [60, 50, 112, 84, 90, 66], [120, 52, 205, 62, 170, 50]];
  const greens = [C.leafLight, C.leaf, '#B6D87E', '#84BE58'];
  for (const [x0, y0, x1, y1, mx, my] of along) {
    for (let f = 0.05; f < 1.02; f += 0.09 + rng() * 0.05) {
      const x = (1 - f) * (1 - f) * x0 + 2 * (1 - f) * f * mx + f * f * x1;
      const y = (1 - f) * (1 - f) * y0 + 2 * (1 - f) * f * my + f * f * y1;
      for (const side of [-1, 1]) {
        const a = Math.atan2(y1 - y0, x1 - x0) + side * (0.7 + rng() * 0.6);
        const len = 10 + rng() * 6;
        // cutout shadow, then the leaf
        g.save(); g.translate(2.4, 3.4);
        g.fillStyle = P.shadow; fillPts(g, leafPts(x, y, a, len, len * 0.5));
        g.restore();
        leafCut(g, x, y, a, len, len * 0.5, greens[Math.floor(rng() * greens.length)], C.leafInk);
      }
      if (rng() < 0.3) flower(g, x + (rng() - 0.5) * 4, y + (rng() - 0.5) * 4, 5, '#F8CCD8', '#E8873A', rng() * TAU, C.blossomDeep);
    }
  }
}

// A leafy bush on one of the hiding outlines.
function leafyBush(g, rng, ring) {
  const outline = bushOutline(deform(ring, 2, 0.05, rng), rng, 4.5);
  // hard paper shadow, a few soft steps
  g.fillStyle = 'rgba(30,60,30,0.08)';
  for (let i = 0; i < 5; i++) {
    g.save(); g.translate(-2 - i, 3 + i); fillPts(g, outline); g.restore();
  }
  g.fillStyle = P.shadow;
  g.save(); g.translate(-2.5, 3.5); fillPts(g, outline); g.restore();
  // paper rim + dark foliage base
  g.fillStyle = P.paper;
  fillPts(g, tornOutline(offsetPts(outline, 1.2), 1.2, rng));
  g.fillStyle = P.sherpaDark;
  fillPts(g, outline);
  g.save();
  pathPts(g, outline);
  g.clip();
  const b = bounds(outline);
  wash(g, polygon((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.x1 - b.x0) * 0.4, 8, rng), P.sherpa, rng, { layers: 8, alpha: 0.12 });
  // three passes of leaves, dark to light, so it has depth
  const passes = [[P.sherpa, 0.9, 1.1], ['#5E9E4C', 0.95, 1], [P.sherpaLight, 1, 0.55]];
  const area = (b.x1 - b.x0) * (b.y1 - b.y0);
  for (const [col, alpha, dens] of passes) {
    for (let i = 0; i < area / 26 * dens; i++) {
      const x = b.x0 + rng() * (b.x1 - b.x0), y = b.y0 + rng() * (b.y1 - b.y0);
      if (!pip(x, y, outline)) continue;
      leafCut(g, x, y, rng() * TAU, 6 + rng() * 4, 3.4 + rng() * 1.2, col, C.leafInk, alpha);
    }
  }
  // a few tiny white blossoms
  for (let i = 0; i < 7; i++) {
    const x = b.x0 + rng() * (b.x1 - b.x0), y = b.y0 + rng() * (b.y1 - b.y0);
    if (!pip(x, y, offsetPts(outline, -6))) continue;
    flower(g, x, y, 3.2, C.white, '#F2C14E', rng() * TAU, 'rgba(44,90,42,0.6)');
  }
  g.restore();
  // leaves breaking the edge
  for (let i = 0; i < outline.length; i += 5) {
    const [x, y] = outline[i];
    if (x < -4 || x > W + 4 || y > H + 4) continue;
    if (rng() < 0.5) leafCut(g, x, y, rng() * TAU, 6 + rng() * 3, 3.4, rng() < 0.5 ? P.sherpa : '#5E9E4C', C.leafInk);
  }
  g.strokeStyle = C.leafInk;
  g.globalAlpha = 0.6;
  g.lineWidth = 0.9;
  pathPts(g, outline);
  g.stroke();
  g.globalAlpha = 1;
}

// The torn paper strip pinned across the top, behind the score (same as the Bedroom's).
function hudStrip(L, paper) {
  const g = L.g;
  const rngH = makeRng(44);
  const strip = tornOutline([[-6, -6], [W + 6, -6], [W + 6, CONFIG.HUD_H + 1], [-6, CONFIG.HUD_H - 1]], 2.6, rngH);
  g.fillStyle = P.shadow;
  g.save(); g.translate(0, 3); fillPts(g, strip); g.restore();
  g.fillStyle = P.paper;
  fillPts(g, strip);
  wash(g, [[0, CONFIG.HUD_H - 10], [W, CONFIG.HUD_H - 12], [W, CONFIG.HUD_H], [0, CONFIG.HUD_H]], '#D6E2C2', rngH, { layers: 8, alpha: 0.1, var: 0.1 });
  g.save();
  pathPts(g, strip);
  g.clip();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = 0.5;
  g.fillStyle = g.createPattern(paper, 'repeat');
  g.fillRect(0, 0, L.c.width, Math.ceil((CONFIG.HUD_H + 6) * (L.c.width / W)));
  g.restore();
}

// ---------------------------------------------------------------- items
// Paper-cutout stickers made of several parts: every part gets a torn paper
// rim and one shared hard shadow, then its paint and ink.
function sticker(g, rng, parts, extra = 2.2) {
  const rims = parts.map((p) => tornOutline(offsetPts(p.pts, extra), 1.2, rng));
  g.fillStyle = P.shadow;
  g.save(); g.translate(1.6, 2.2); for (const r of rims) fillPts(g, r); g.restore();
  g.fillStyle = P.paper;
  for (const r of rims) fillPts(g, r);
  for (const p of parts) {
    g.save();
    pathPts(g, p.pts);
    g.clip();
    g.fillStyle = p.fill;
    fillPts(g, p.pts);
    if (p.paint) p.paint();
    g.restore();
    g.strokeStyle = p.ink || P.ink;
    g.lineWidth = p.lw || 1;
    pathPts(g, p.pts);
    g.stroke();
  }
}

function bakeItem(type, k, paper) {
  const S = type === 'shoe' ? 34 : 28;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(type.length * 131 + 9);
  g.translate(S / 2, S / 2);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  if (type === 'sock') tulip(g, rng);
  else if (type === 'shoe') carrot(g, rng);
  else cheese(g, rng);
  grainAtop(L, paper, 0.3);
  return L;
}

// 1 pt: a red tulip on a short stem with two leaves, tilted a little.
function tulip(g, rng) {
  g.rotate(-0.18);
  g.scale(0.92, 0.92);
  const stem = [[-1, -1], [1, -1], [1.4, 10.5], [-1.2, 10.5]];
  const leafL = leafPts(-0.5, 10, -Math.PI / 2 - 0.55, 11, 4.6);
  const leafR = leafPts(0.5, 10, -Math.PI / 2 + 0.5, 9.5, 4.2);
  const cup = smoothPts([[-6.5, -4], [-7.5, -10.5], [-3.6, -8], [0, -12.5], [3.6, -8], [7.5, -10.5], [6.5, -4], [4.5, 0.5], [-4.5, 0.5]], 2);
  sticker(g, rng, [
    { pts: stem, fill: '#5E9E3E', ink: C.leafInk, lw: 0.8 },
    { pts: leafL, fill: '#6FAE4E', ink: C.leafInk, lw: 0.9, paint: () => wash(g, polygon(-4, 4, 3, 6, rng), C.leafDark, rng, { layers: 3, alpha: 0.12 }) },
    { pts: leafR, fill: '#7DB85A', ink: C.leafInk, lw: 0.9 },
    {
      pts: cup, fill: C.tulip, lw: 1.1, paint: () => {
        wash(g, polygon(-2, -8, 4, 6, rng), C.tulipLight, rng, { layers: 5, alpha: 0.12 });
        wash(g, polygon(3, -2, 5, 6, rng), C.tulipDark, rng, { layers: 5, alpha: 0.12 });
        // the petal seams
        g.strokeStyle = C.tulipDark;
        g.globalAlpha = 0.7;
        g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(-3.6, -8); g.quadraticCurveTo(-2.5, -3, -1, 0.5); g.stroke();
        g.beginPath(); g.moveTo(3.6, -8); g.quadraticCurveTo(2.5, -3, 1, 0.5); g.stroke();
        g.globalAlpha = 0.85;
        g.fillStyle = '#FFE2E6';
        g.beginPath(); g.ellipse(-4.2, -6.5, 0.9, 2.2, 0.2, 0, TAU); g.fill();
        g.globalAlpha = 1;
      },
    },
  ]);
}

// 3 pts: a fat carrot, leafy top up-left, tip down-right.
function carrot(g, rng) {
  const a = Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
  const rot = (pts) => pts.map(([x, y]) => [x * c - y * s, x * s + y * c]);
  const body = rot(smoothPts([[-8, -6], [-4, -7], [4, -4.6], [12, -1.6], [15.5, 0], [12, 1.6], [4, 4.6], [-4, 7], [-8, 6], [-9, 0]], 2));
  const tops = [-0.5, 0, 0.5].map((d, i) => rot(leafPts(-8.5, d * 4, Math.PI + d * 1.1, 9.5 + (i === 1 ? 2 : 0), 5)));
  sticker(g, rng, [
    ...tops.map((pts, i) => ({
      pts, fill: i === 1 ? '#5EA642' : '#78B850', ink: C.leafInk, lw: 0.9,
      paint: () => {
        g.strokeStyle = C.leafDark; g.lineWidth = 0.6; g.globalAlpha = 0.6;
        const [bx, by] = pts[0], [tx, ty] = pts[10];
        g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke(); g.globalAlpha = 1;
      },
    })),
    {
      pts: body, fill: C.carrot, lw: 1.1, paint: () => {
        g.save(); g.rotate(a);
        wash(g, polygon(0, -3.5, 7, 6, rng, 9, 2.5), C.carrotLight, rng, { layers: 5, alpha: 0.14 });
        wash(g, polygon(2, 4, 7, 6, rng, 10, 2.5), C.carrotDark, rng, { layers: 5, alpha: 0.12 });
        // the little root rings
        g.strokeStyle = C.carrotDark;
        g.lineWidth = 0.8;
        g.globalAlpha = 0.85;
        for (const [x, w, sd] of [[-3, 3.2, -1], [1.5, 2.6, 1], [5.5, 2.4, -1], [9, 1.6, 1]]) {
          g.beginPath(); g.moveTo(x, sd * 6.5); g.quadraticCurveTo(x + 0.8, sd * (6.5 - w * 0.6), x + 0.3, sd * (6.5 - w)); g.stroke();
        }
        g.globalAlpha = 1;
        g.restore();
      },
    },
  ]);
}

// Cheese wedge (as in the Bedroom) with a little pink flower tucked on top.
function cheese(g, rng) {
  const shape = smoothPts([[-10, 7], [-10, 0], [9, -6], [10, 7]], 1);
  sticker(g, rng, [{
    pts: shape, fill: P.cheese, lw: 1.1, paint: () => {
      g.fillStyle = P.cheeseTop;
      g.beginPath(); g.moveTo(-10, 0); g.lineTo(9, -6); g.lineTo(10, -3); g.lineTo(-9, 3); g.closePath(); g.fill();
      g.fillStyle = P.cheeseDark;
      for (const [x, y, r] of [[-5, 4, 1.8], [1, 3.2, 1.3], [5.5, 4.8, 2], [3, -1.2, 1]]) {
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
    },
  }]);
  // the flower sits on its own: leaf, then five pink petals with an ink edge
  leafCut(g, -4, -2, -2.4, 7, 3.4, '#6FAE4E', C.leafInk);
  leafCut(g, -4, -2, -0.9, 6, 3, '#86BE58', C.leafInk);
  g.fillStyle = P.shadow;
  g.beginPath(); g.arc(-3, -1, 4.2, 0, TAU); g.fill();
  flower(g, -4, -2.4, 6.4, C.blossom, '#FFF0C0', 0.3, P.ink);
  g.fillStyle = '#F2C14E';
  g.beginPath(); g.arc(-4, -2.4, 1.6, 0, TAU); g.fill();
}

// ---------------------------------------------------------------- bunnies
// Seen from above facing +x: round body, long ears laid back, big white cotton
// tail, little feet. Cool greys so they never read as Zoe. No shadow baked in
// (the 'hop' motion draws one on the ground).
function bakeBunny(variant, k, paper) {
  const S = 54;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(510 + variant * 7);
  const body = variant ? P.dog2 : P.dog;
  const dark = variant ? P.dog2Dark : P.dogDark;
  const light = variant ? '#A4A8B8' : P.dogLight;
  const ox = 25, oy = S / 2;
  g.translate(ox, oy);
  g.lineJoin = 'round';
  g.lineCap = 'round';

  const r = CONFIG.DOG_RADIUS;
  const bodyPts = smoothPts([[-r * 1.1, -r * 0.6], [-r * 0.5, -r * 0.95], [r * 0.45, -r * 0.82], [r * 0.85, -r * 0.4], [r * 0.85, r * 0.4], [r * 0.45, r * 0.82], [-r * 0.5, r * 0.95], [-r * 1.1, r * 0.6]], 3);
  const hx = r * 0.95;
  const headPts = polygon(hx, 0, 7, 18, null, 7.2, 6.6);
  const cheeks = polygon(hx + 4, 0, 4, 14, null, 4.2, 4.6);
  const feet = [-1, 1].map((sd) => polygon(-r * 0.75, sd * r * 0.92, 3, 10, null, 5, 2.6));
  const paws = [-1, 1].map((sd) => polygon(hx + 1.5, sd * 6.6, 2, 8, null, 2.4, 1.7));
  // ears: long, laid back over the shoulders, splayed a touch
  const ears = [-1, 1].map((sd) => leafPts(hx - 0.5, sd * 2.4, Math.PI - sd * 0.38, 16, 7.4));
  const inner = [-1, 1].map((sd) => leafPts(hx - 2.8, sd * 3.2, Math.PI - sd * 0.38, 11.5, 3.6));
  const tail = polygon(-r * 1.15, 0, 4.6, 12, null);

  // paper rim behind every part (the ground shadow comes from the renderer)
  const parts = [...feet, ...paws, bodyPts, headPts, cheeks, ...ears, tail];
  g.fillStyle = P.paper;
  for (const p of parts) fillPts(g, tornOutline(offsetPts(p, 1.5), 0.9, rng));

  const part = (pts, fill, lw = 1) => {
    g.fillStyle = fill;
    fillPts(g, pts);
    g.strokeStyle = P.dogInk;
    g.lineWidth = lw;
    pathPts(g, pts);
    g.stroke();
  };
  for (const f of feet) part(f, dark, 0.9);
  for (const p of paws) part(p, light, 0.8);
  part(bodyPts, body);
  // soft darker back and lighter flanks
  g.save(); pathPts(g, bodyPts); g.clip();
  wash(g, polygon(-2, 0, 6, 8, rng, 9, 4), dark, rng, { layers: 7, alpha: 0.1 });
  wash(g, polygon(2, -8, 5, 6, rng, 7, 3), light, rng, { layers: 5, alpha: 0.1 });
  wash(g, polygon(2, 8, 5, 6, rng, 7, 3), light, rng, { layers: 5, alpha: 0.1 });
  // a few fur ticks
  g.strokeStyle = dark; g.lineWidth = 0.6; g.globalAlpha = 0.5;
  for (let i = 0; i < 14; i++) {
    const x = -10 + rng() * 18, y = (rng() - 0.5) * 16;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1.8, y + (rng() - 0.5) * 0.8); g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
  // fluffy cotton tail: a scalloped white puff
  const puff = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU, rr = 4.6 + (i % 2 ? 0.9 : -0.2);
    puff.push([-r * 1.15 + Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  part(smoothPts(puff, 1), C.tail, 0.9);
  g.fillStyle = 'rgba(160,160,180,0.25)';
  g.beginPath(); g.arc(-r * 1.15 + 1.2, 1.2, 2.6, 0, TAU); g.fill();

  part(headPts, body);
  part(cheeks, light, 0.8);
  // ears last so they lie over the head and back
  for (let i = 0; i < 2; i++) {
    part(ears[i], body, 0.95);
    g.fillStyle = C.earPink;
    fillPts(g, inner[i]);
  }
  // eyes on the sides of the head, with a bright highlight
  for (const sd of [-1, 1]) {
    g.fillStyle = P.dogEye;
    g.beginPath(); g.ellipse(hx + 3, sd * 4.6, 1.5, 1.9, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(hx + 3.5, sd * 4.6 - 0.7, 0.6, 0, TAU); g.fill();
    // pink blush
    g.fillStyle = 'rgba(238,150,170,0.55)';
    g.beginPath(); g.ellipse(hx + 6.2, sd * 3.6, 1.4, 1, 0, 0, TAU); g.fill();
  }
  // pink nose and whiskers
  g.fillStyle = '#E58A9E';
  g.strokeStyle = P.dogInk;
  g.lineWidth = 0.6;
  g.beginPath(); g.moveTo(hx + 9.2, 0); g.lineTo(hx + 7.8, -1.3); g.lineTo(hx + 7.8, 1.3); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(60,58,74,0.6)';
  g.lineWidth = 0.45;
  for (const sd of [-1, 1]) for (const d of [-0.25, 0.15]) {
    g.beginPath(); g.moveTo(hx + 7.5, sd * 1.4); g.lineTo(hx + 11.5, sd * (3.2 + d * 8)); g.stroke();
  }
  grainAtop(L, paper, 0.3);
  L.ox = ox;
  L.oy = oy;
  return L;
}

// ---------------------------------------------------------------- the ball
// Robin's-egg blue, with soft brown speckles and a cream seam.
function bakeBall(k, paper) {
  const S = 26, r = CONFIG.BALL_RADIUS;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(919);
  g.translate(S / 2, S / 2);
  const disc = polygon(0, 0, r, 28, null);
  g.fillStyle = P.paper;
  fillPts(g, tornOutline(polygon(0, 0, r + 2, 28, null), 1.1, rng));
  g.save();
  pathPts(g, disc);
  g.clip();
  g.fillStyle = P.ball;
  fillPts(g, disc);
  wash(g, polygon(-2.5, -2.5, 4.5, 7, rng), '#ffffff', rng, { layers: 6, alpha: 0.08 });
  wash(g, polygon(3, 3.5, 6, 7, rng), P.ballDark, rng, { layers: 6, alpha: 0.13 });
  g.fillStyle = '#8A6A4C';
  for (let i = 0; i < 11; i++) {
    const a = rng() * TAU, d = rng() * r * 0.9;
    g.globalAlpha = 0.35 + rng() * 0.3;
    g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, 0.35 + rng() * 0.45, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  g.strokeStyle = P.ballSeam;
  g.lineWidth = 1.5;
  g.lineCap = 'round';
  g.beginPath(); g.arc(-r * 1.25, 0, r * 0.95, -0.9, 0.9); g.stroke();
  g.beginPath(); g.arc(r * 1.25, 0, r * 0.95, Math.PI - 0.9, Math.PI + 0.9); g.stroke();
  g.fillStyle = 'rgba(255,255,250,0.9)';
  g.beginPath(); g.ellipse(-2.6, -3.2, 1.8, 1.1, -0.6, 0, TAU); g.fill();
  g.restore();
  g.strokeStyle = P.ink;
  g.lineWidth = 1.1;
  pathPts(g, disc);
  g.stroke();
  grainAtop(L, paper, 0.3);
  return L;
}

// ---------------------------------------------------------------- the rain puddle
// A lobed grey-blue puddle on a damp muddy halo, sky reflected in it, raindrop
// rings, and one pink petal floating.
function bakePuddle(k, paper) {
  const rx = CONFIG.BATH_RX, ry = CONFIG.BATH_RY;
  const SW = rx * 2 + 28, SH = ry * 2 + 28;
  const L = makeLayer(SW, SH, k);
  const g = L.g;
  const rng = makeRng(5151);
  g.translate(SW / 2, SH / 2);
  g.lineJoin = 'round';
  // lobed outline: a wobbly ellipse with a couple of side pools
  const base = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU;
    const lobe = 1 + 0.08 * Math.sin(a * 3 + 0.6) + 0.05 * Math.sin(a * 5 + 1.7);
    base.push([Math.cos(a) * (rx + 1) * lobe, Math.sin(a) * (ry + 1) * lobe]);
  }
  const shape = smoothPts(base, 2);
  // damp mud halo
  wash(g, offsetPts(shape, 4), C.mud, rng, { layers: 7, alpha: 0.07, depth: 2, var: 0.15, baseDepth: 1, baseVar: 0.04 });
  const rim = tornOutline(offsetPts(shape, 2.4), 1.5, rng);
  g.fillStyle = P.shadow;
  g.save(); g.translate(2, 2.8); fillPts(g, rim); g.restore();
  g.fillStyle = P.paper;
  fillPts(g, rim);
  g.save();
  pathPts(g, shape);
  g.clip();
  g.fillStyle = P.water;
  fillPts(g, shape);
  wash(g, polygon(5, 6, rx * 0.8, 9, rng, rx * 0.8, ry * 0.7), P.waterDeep, rng, { layers: 12, alpha: 0.08 });
  // reflected sky: a pale streak and a little cloud
  wash(g, [[-rx, -4], [rx * 0.4, -ry], [rx * 0.6, -ry + 4], [-rx + 4, 2]], '#ffffff', rng, { layers: 6, alpha: 0.1, var: 0.2 });
  g.fillStyle = 'rgba(255,255,255,0.45)';
  for (const [x, y, rr] of [[-10, -6, 3.6], [-6, -7.5, 4.2], [-2, -6, 3.2]]) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
  // raindrop rings
  g.strokeStyle = P.ripple;
  g.lineCap = 'round';
  for (const [x, y, w] of [[-12, 6, 5], [9, -4, 6], [13, 8, 3.6], [-1, 2, 4]]) {
    g.lineWidth = 1;
    g.beginPath(); g.ellipse(x, y, w, w * 0.45, 0, 0, TAU); g.stroke();
    g.lineWidth = 0.7;
    g.globalAlpha = 0.6;
    g.beginPath(); g.ellipse(x, y, w * 0.45, w * 0.2, 0, 0, TAU); g.stroke();
    g.globalAlpha = 1;
  }
  g.restore();
  g.strokeStyle = P.waterInk;
  g.globalAlpha = 0.85;
  g.lineWidth = 1.1;
  pathPts(g, shape);
  g.stroke();
  g.globalAlpha = 1;
  // a floating petal and a fallen leaf on the rim
  g.fillStyle = C.blossom;
  g.strokeStyle = C.blossomDeep;
  g.lineWidth = 0.6;
  g.beginPath(); g.ellipse(6, 4, 2.6, 1.6, 0.6, 0, TAU); g.fill(); g.stroke();
  leafCut(g, -rx + 2, ry - 4, 2.6, 8, 4, C.leaf, C.leafInk);
  grainAtop(L, paper, 0.25);
  L.ox = SW / 2;
  L.oy = SH / 2;
  return L;
}

// A raindrop splashing up off the puddle.
function bakeDroplet(k) {
  const S = 14;
  const L = makeLayer(S, S, k);
  const g = L.g;
  g.translate(S / 2, S / 2 + 1);
  g.beginPath();
  g.moveTo(0, -5.6);
  g.quadraticCurveTo(4.6, 0, 3.8, 2.2);
  g.arc(0, 1.8, 3.8, 0.1, Math.PI - 0.1);
  g.quadraticCurveTo(-4.6, 0, 0, -5.6);
  g.closePath();
  g.fillStyle = P.bubble;
  g.fill();
  g.strokeStyle = P.bubbleRim;
  g.lineWidth = 0.9;
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath(); g.ellipse(-1.4, 0.8, 0.9, 1.6, 0.3, 0, TAU); g.fill();
  return L;
}

// ---------------------------------------------------------------- hiding
// A leafy sprig laid over Zoe's head when she hides in a bush. Facing +x; the
// front edge stops short so her eyes and nose peek out.
function bakeLeafFlap(k, paper) {
  const S = 40;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(818);
  g.translate(S / 2, S / 2);
  const base = smoothPts([[-13, -11], [3, -13], [7, -6], [6, 6], [3, 13], [-13, 11], [-16, 0]], 2);
  const torn = tornOutline(deform(base, 1, 0.05, rng), 1.4, rng);
  g.fillStyle = P.shadow;
  g.save(); g.translate(1.8, 2.6); fillPts(g, torn); g.restore();
  g.fillStyle = P.sherpaDark;
  fillPts(g, torn);
  g.save();
  pathPts(g, torn);
  g.clip();
  for (const [col, n] of [[P.sherpa, 26], ['#5E9E4C', 20], [P.sherpaLight, 10]]) {
    for (let i = 0; i < n; i++) {
      leafCut(g, -16 + rng() * 22, -13 + rng() * 26, rng() * TAU, 6 + rng() * 3, 3.4, col, C.leafInk);
    }
  }
  g.restore();
  // leaves fanning past the edge, pointing forward around her face
  for (const [x, y, a] of [[3, -11, -0.5], [5, 10, 0.5], [-8, -12, -1.6], [-8, 12, 1.6], [-15, 0, Math.PI]]) {
    g.save(); g.translate(1.2, 1.8); g.fillStyle = P.shadow; fillPts(g, leafPts(x, y, a, 9, 4.6)); g.restore();
    leafCut(g, x, y, a, 9, 4.6, rng() < 0.5 ? P.sherpa : '#6FAE4E', C.leafInk);
  }
  flower(g, -4, -4, 4, C.white, '#F2C14E', 0.4, 'rgba(44,90,42,0.6)');
  g.strokeStyle = C.leafInk;
  g.globalAlpha = 0.7;
  g.lineWidth = 0.8;
  pathPts(g, torn);
  g.stroke();
  g.globalAlpha = 1;
  grainAtop(L, paper, 0.25);
  return L;
}

// ---------------------------------------------------------------- Zoe's flower crown
// Baked once at 3x so it's crisp on the title card. Drawn in her head space:
// a vine arc round the BACK of her skull (x from about -8 to -0.5), with five
// bright flowers and leaves. Her eyes (x 0.8 to 6.4) and nose stay clear.
function bakeCrown(k) {
  const S = 28;
  const L = makeLayer(S, S, k * 3);
  const g = L.g;
  g.translate(S / 2, S / 2);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const cx = -2.8, rx = 5.0, ry = 7.6;
  const a0 = Math.PI / 2 - 0.1, a1 = Math.PI * 1.5 + 0.1;
  const at = (a) => [cx + Math.cos(a) * rx, Math.sin(a) * ry];
  // hard shadow under the whole crown
  g.strokeStyle = P.shadow;
  g.lineWidth = 2.6;
  g.beginPath(); g.ellipse(cx + 0.9, 1.2, rx, ry, 0, a0, a1); g.stroke();
  // vine
  g.strokeStyle = C.leafInk;
  g.lineWidth = 2.4;
  g.beginPath(); g.ellipse(cx, 0, rx, ry, 0, a0, a1); g.stroke();
  g.strokeStyle = '#6FAE4E';
  g.lineWidth = 1.3;
  g.beginPath(); g.ellipse(cx, 0, rx, ry, 0, a0, a1); g.stroke();
  // leaves between the flowers, pointing back along the vine
  for (const a of [0.66, 0.86, 1.14, 1.34].map((f) => f * Math.PI)) {
    const [x, y] = at(a);
    const tang = Math.atan2(Math.cos(a) * ry, -Math.sin(a) * rx);
    for (const sd of [-1, 1]) {
      const ang = tang + sd * 0.5 + (sd > 0 ? Math.PI : 0);
      leafCut(g, x, y, ang, 3.4, 2, sd > 0 ? '#86BE58' : '#6FAE4E', C.leafInk);
    }
  }
  // flowers: lilac at the ends (they sit on her pale ear roots), pink, butter, coral
  const flowers = [
    [a0 + 0.06, 2.3, C.lilac, '#FFF0C0'],
    [Math.PI * 0.76, 2.6, C.blossom, '#F7D867'],
    [Math.PI, 2.9, C.butter, '#E8873A'],
    [Math.PI * 1.24, 2.6, '#F08A70', '#FFF0C0'],
    [a1 - 0.06, 2.3, C.lilac, '#FFF0C0'],
  ];
  for (const [a, r, pc, cc] of flowers) {
    const [x, y] = at(a);
    g.fillStyle = P.shadow;
    g.beginPath(); g.arc(x + 0.7, y + 0.9, r * 1.05, 0, TAU); g.fill();
    // ink halo so the petals read on cream fur
    g.fillStyle = P.ink;
    for (let i = 0; i < 5; i++) {
      const pa = a + (i / 5) * TAU;
      g.beginPath(); g.arc(x + Math.cos(pa) * r * 0.55, y + Math.sin(pa) * r * 0.55, r * 0.5 + 0.45, 0, TAU); g.fill();
    }
    flower(g, x, y, r, pc, cc, a);
  }
  return { crown: L };
}
