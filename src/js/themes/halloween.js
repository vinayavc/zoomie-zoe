// Theme: Halloween, "Spooky Night". Cute-spooky, never scary.
// A moonlit purple-indigo room: dark floorboards, an arched window of moonlight,
// a jack-o'-lantern glowing in the corner and cobwebs up top. Zoe wears a tiny
// witch hat and a bat-wing cape, catches wrapped candy, pumpkin pails and
// cheese with a bat bow, chases a pumpkin ball, hides in leaf piles, dodges
// ghost-sheet pups and a bubbling green cauldron. Interface: README.md.

import { CONFIG } from '../../config.js';
import { P } from '../art/palette.js';
import {
  makeRng, makeLayer, polygon, deform, fillPts, wash, tornOutline,
  offsetPts, pathPts, smoothPts, grain, grainAtop,
} from '../art/util.js';

const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;

// Theme-only colors (the palette keys below cover the shared ones).
const C = {
  moon: '#D6D2F4',        // moonlight on the floor
  glow: '#F7A23C',        // jack-o'-lantern light
  pumpkin: '#EE8A2E',
  pumpkinDark: '#B9561A',
  pumpkinLight: '#F8B865',
  stem: '#5E7A3A',
  night: '#241C3C',       // jack-o'-lantern face holes, bat bows
  web: '#E4DEF6',
  witch: '#45378A',       // hat brim
  cape: '#271E33',        // bat-wing cape (darker than the hat, so they separate)
  witchDark: '#1E1632',
  witchLight: '#6E5AA6',
  band: '#F08A2E',
  star: '#F6CF5A',
  brew: '#8ED155',
  brewDeep: '#3F8A35',
  brewLight: '#D6F59A',
  iron: '#2B2536',
  ironLight: '#5C5470',
  blushGhost: '#F2A7B6',
  bucketLight: '#C7AEF0',  // highlight on the violet candy bucket
};
const LEAVES = ['#D9662A', '#E8973A', '#B84A2A', '#C98A2E', '#9A4E2A', '#E2B046'];

export default {
  id: 'halloween',
  name: 'Spooky Night',
  chip: { color: '#3E3460', ink: '#E8823A' },
  letterbox: '#1d1830',
  palette: {
    bed: '#3A3162', bedDeep: '#2E2752', bedTone1: '#4A3E74', bedTone2: '#282147', bedTone3: '#54457C',
    vignette: '14,9,30',
    shadow: 'rgba(12,8,28,0.42)',
    indigo: '#1E1838', teal: '#E08A3C', pink: '#8E6FB0', sun: C.moon,
    // leaf piles (confetti uses these too)
    sherpa: '#8A4A24', sherpaDark: '#5E2E16', sherpaLight: '#E0913E',
    // wrapped candy: orange with purple stripes. The pail is a violet bucket
    // (not orange), so it never reads as the round orange pumpkin power-up.
    sock: '#F08A2E', sockStripe: '#8A5CC8',
    shoe: '#9A70DC', shoeDark: '#5B3A9A', sole: C.night,
    // pumpkin ball
    ball: C.pumpkin, ballDark: C.pumpkinDark, ballSeam: '#F8C27A',
    // cauldron brew (also the slimy leash after touching it)
    water: C.brew, waterDeep: C.brewDeep, waterInk: '#2C5A26', foam: C.brewLight,
    bubble: 'rgba(170,230,120,0.55)', bubbleRim: 'rgba(44,90,38,0.85)', foamRim: 'rgba(44,90,38,0.5)',
    ripple: 'rgba(230,255,190,0.7)',
    wetRope: '#5E9A3E', wetRopeLight: '#BFE69A',
    // ghost-sheet pups
    dog: '#F2EFF8', dogDark: '#C3BBDA', dogLight: '#FFFFFF', dog2: '#E6E0F4', dog2Dark: '#B4A9D2',
    dogInk: '#4A4466', dogEye: '#2A2240',
    dust: '#8F82B8',
  },

  bakeBackground,
  bakeItem,
  bakeCritter: bakeGhost,
  critterMotion: 'float',
  bakeBall: bakePumpkinBall,
  bakeHazard: bakeCauldron,
  bakeHazardBubble: bakeBrewBubble,
  bakeHideFlap: bakeLeafFlap,

  costume: {
    hideCollar: true,          // the cape's clasp sits where the collar was
    bake: null,
    body: drawCape,
    head: drawWitchHat,
  },

  drawChipIcon,

  sfx: {
    // a spooky "ooo" warble on every catch pop
    pop: { wave: 'sine', pitch: 0.85, vibrato: [16, 55] },
    catchLayer: ghostOoo,
    over: owlHoot,
  },

  words: {
    loot: 'candy & pails',
    ball: 'Pumpkin', ballTip: 'grab it for the zoomies!',
    hide: 'Leaf piles', hideTip: 'hide in one: ghosts lose you',
    hazard: 'Cauldron', hazardTip: 'dodge it, or your leash gets slimy',
    critters: 'Ghost pups', critterTip: 'a bump makes Zoe dizzy, and a', critterTip2: 'touch on the leash snaps it',
  },
};

// ---------------------------------------------------------------- picker chip
// A little jack-o'-lantern pumpkin (vector, runs before any bake).
function drawChipIcon(g) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // stem and leaf
  g.fillStyle = C.stem;
  g.strokeStyle = '#6B4A2F';
  g.lineWidth = 1.1;
  g.beginPath(); g.moveTo(-1.6, -6); g.lineTo(-1, -11); g.lineTo(2, -10.5); g.lineTo(1.6, -6); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(1.5, -8); g.quadraticCurveTo(7, -12, 8.5, -8); g.quadraticCurveTo(5, -6.5, 1.5, -8); g.fill(); g.stroke();
  // body: three overlapping lobes
  for (const [x, rx] of [[-4.5, 6.5], [4.5, 6.5], [0, 7]]) {
    g.fillStyle = x ? C.pumpkinDark : C.pumpkin;
    g.beginPath(); g.ellipse(x, 1.5, rx, 8, 0, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = C.pumpkin;
  g.beginPath(); g.ellipse(-4.2, 1.5, 5.6, 7.4, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(4.2, 1.5, 5.6, 7.4, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.pumpkinLight;
  g.beginPath(); g.ellipse(0, 1.5, 4.4, 7.6, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#6B4A2F';
  g.lineWidth = 1.2;
  g.beginPath(); g.ellipse(0, 1.5, 10.6, 8.2, 0, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(-4, -5.6); g.quadraticCurveTo(-6.5, 1.5, -4, 8.8); g.moveTo(4, -5.6); g.quadraticCurveTo(6.5, 1.5, 4, 8.8); g.stroke();
  // happy face
  g.fillStyle = C.night;
  g.beginPath(); g.moveTo(-5.5, 0); g.lineTo(-3.5, -3.2); g.lineTo(-1.6, 0); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(5.5, 0); g.lineTo(3.5, -3.2); g.lineTo(1.6, 0); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-5.5, 2.6); g.quadraticCurveTo(0, 8.5, 5.5, 2.6); g.quadraticCurveTo(0, 5.2, -5.5, 2.6); g.fill();
}

// ---------------------------------------------------------------- the floor
function bakeBackground(k, paper) {
  const L = makeLayer(W, H, k);
  const g = L.g;
  const rng = makeRng(1031);

  g.fillStyle = P.bed;
  g.fillRect(0, 0, W, H);

  // floorboards: long planks running across the room, each its own wash
  const plankH = 38;
  for (let row = 0, y = 30; y < H; row++, y += plankH) {
    const tone = [P.bedTone1, P.bedDeep, P.bedTone3, P.bedTone2][row % 4];
    let x = -40 + rng() * 60 - (row % 2) * 70;
    while (x < W + 20) {
      const len = 120 + rng() * 110;
      const quad = [[x + 2, y + 2], [x + len - 2, y + 2], [x + len - 2, y + plankH - 2], [x + 2, y + plankH - 2]];
      wash(g, quad, tone, rng, { layers: 6, alpha: 0.07, depth: 2, var: 0.12, baseVar: 0.04 });
      // wood grain: a few long faint strokes
      g.strokeStyle = P.bedTone2;
      g.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        const gy = y + 7 + rng() * (plankH - 14);
        g.globalAlpha = 0.25 + rng() * 0.2;
        g.beginPath();
        g.moveTo(x + 8, gy);
        g.bezierCurveTo(x + len * 0.3, gy + (rng() - 0.5) * 6, x + len * 0.7, gy + (rng() - 0.5) * 6, x + len - 8, gy);
        g.stroke();
      }
      // knot
      if (rng() < 0.35) {
        g.globalAlpha = 0.35;
        g.beginPath(); g.ellipse(x + 20 + rng() * (len - 40), y + plankH / 2, 4, 2.2, 0, 0, Math.PI * 2); g.stroke();
      }
      // board end joint
      g.globalAlpha = 0.45;
      g.strokeStyle = P.indigo;
      g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x + len, y + 1); g.lineTo(x + len, y + plankH - 1); g.stroke();
      x += len;
    }
    // seam between rows
    g.globalAlpha = 0.5;
    g.strokeStyle = P.indigo;
    g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(0, y + plankH); g.lineTo(W, y + plankH + (rng() - 0.5) * 2); g.stroke();
    g.globalAlpha = 1;
  }

  // moonlight from a four-pane window, falling across the floor
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const x0 = 24 + col * 62 + row * 34, y0 = 92 + row * 80, w = 54, h = 72, skew = 30;
      const quad = [[x0, y0], [x0 + w, y0], [x0 + w + skew, y0 + h], [x0 + skew, y0 + h]];
      wash(g, quad, C.moon, rng, { layers: 14, alpha: 0.024, depth: 3, var: 0.25, baseVar: 0.05 });
    }
  }
  // a little bat flying through the moonlight (its shadow on the floor)
  batShape(g, 120, 150, 9, -0.25, 'rgba(20,14,40,0.45)');

  // jack-o'-lantern glow in the bottom-right corner: a screen-blended warm
  // light (brightens the boards instead of muddying them), then an amber tint
  const gx = 362, gy = 566;
  g.save();
  g.globalCompositeOperation = 'screen';
  let glow = g.createRadialGradient(gx, gy, 10, gx, gy, 210);
  glow.addColorStop(0, 'rgba(255,150,40,0.5)');
  glow.addColorStop(0.4, 'rgba(240,120,40,0.18)');
  glow.addColorStop(1, 'rgba(240,120,40,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  g.restore();
  glow = g.createRadialGradient(gx, gy, 10, gx, gy, 130);
  glow.addColorStop(0, 'rgba(240,140,50,0.28)');
  glow.addColorStop(1, 'rgba(240,140,50,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  // a few fallen leaves scattered on the boards (faint, so they read as floor)
  for (let i = 0; i < 18; i++) {
    const x = 20 + rng() * (W - 40), y = 70 + rng() * (H - 120);
    g.globalAlpha = 0.28;
    leafCutout(g, x, y, rng() * 6.28, 6 + rng() * 3, LEAVES[i % LEAVES.length], rng() < 0.5 ? 'maple' : 'oval', rng, false);
    g.globalAlpha = 1;
  }

  // leaf piles hugging the edges (Zoe hides in these: CONFIG.BLANKETS)
  for (const ring of CONFIG.BLANKETS) leafPile(g, rng, ring);

  // the jack-o'-lantern itself, mostly tucked into the corner
  jackOLantern(g, rng, gx + 10, gy + 8, 26);

  // cobwebs in the two top corners, just under the HUD strip
  cobweb(g, rng, 0, CONFIG.HUD_H - 4, 0, 74, 6);
  cobweb(g, rng, W, CONFIG.HUD_H - 4, Math.PI / 2, 62, 5);
  // a tiny spider dangling from the right web
  g.strokeStyle = C.web;
  g.globalAlpha = 0.6;
  g.lineWidth = 0.7;
  g.beginPath(); g.moveTo(W - 30, CONFIG.HUD_H + 12); g.lineTo(W - 30, CONFIG.HUD_H + 50); g.stroke();
  g.globalAlpha = 1;
  spider(g, W - 30, CONFIG.HUD_H + 54);

  // edge darkening (a little stronger: it's night)
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.72);
  vg.addColorStop(0, 'rgba(' + P.vignette + ',0)');
  vg.addColorStop(1, 'rgba(' + P.vignette + ',0.38)');
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);

  grain(L, paper, 0.4);

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
  wash(g, [[0, CONFIG.HUD_H - 10], [W, CONFIG.HUD_H - 12], [W, CONFIG.HUD_H], [0, CONFIG.HUD_H]], '#CFC3E2', rngH, { layers: 8, alpha: 0.1, var: 0.1 });
  g.save();
  pathPts(g, strip);
  g.clip();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = 0.5;
  g.fillStyle = g.createPattern(paper, 'repeat');
  g.fillRect(0, 0, L.c.width, Math.ceil((CONFIG.HUD_H + 6) * k));
  g.restore();

  // ink frame
  g.strokeStyle = C.night;
  g.globalAlpha = 0.8;
  g.lineWidth = 2;
  g.strokeRect(1, 1, W - 2, H - 2);
  g.globalAlpha = 1;
  return L;
}

// One paper leaf: 'maple' (five pointed lobes) or 'oval'. Bake time only.
function leafCutout(g, x, y, a, size, color, kind, rng, inked = true) {
  const pts = [];
  if (kind === 'maple') {
    const n = 20;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const lobe = Math.abs(Math.cos(t * 2.5));
      const r = size * (0.42 + 0.58 * Math.pow(lobe, 3)) * (t > 2.4 && t < 3.9 ? 0.6 : 1);
      pts.push([Math.cos(t) * r, Math.sin(t) * r]);
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      pts.push([Math.cos(t) * size * 0.62, Math.sin(t) * size * 0.3 * (1 - 0.35 * Math.cos(t))]);
    }
  }
  const c = Math.cos(a), s = Math.sin(a);
  const out = pts.map(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
  g.fillStyle = color;
  fillPts(g, out);
  // a lighter half and a midrib
  g.save();
  const ga = g.globalAlpha;
  g.globalAlpha = ga * 0.25;
  g.fillStyle = '#FFE2B0';
  g.beginPath(); g.ellipse(x - s * size * 0.15, y + c * size * 0.15, size * 0.45, size * 0.22, a, 0, Math.PI * 2); g.fill();
  g.globalAlpha = ga * 0.5;
  g.strokeStyle = '#5A2A14';
  g.lineWidth = 0.6;
  g.beginPath(); g.moveTo(x - c * size * 0.55, y - s * size * 0.55); g.lineTo(x + c * size * 0.5, y + s * size * 0.5); g.stroke();
  if (inked) {
    g.globalAlpha = ga * 0.55;
    pathPts(g, out);
    g.stroke();
  }
  g.restore();
  // stem for the oval leaves
  if (kind === 'oval') {
    g.strokeStyle = '#5A2A14';
    g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(x - c * size * 0.6, y - s * size * 0.6); g.lineTo(x - c * size * 0.85, y - s * size * 0.85 + 1); g.stroke();
  }
}

function leafPile(g, rng, ring) {
  const base = deform(ring, 3, 0.16, rng);
  const torn = tornOutline(base, 2.2, rng);
  // baked soft shadow
  g.fillStyle = 'rgba(10,6,24,0.12)';
  for (let i = 0; i < 5; i++) {
    g.save();
    g.translate(-2 - i, 3 + i);
    fillPts(g, torn);
    g.restore();
  }
  g.fillStyle = P.sherpaDark;
  fillPts(g, torn);
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const [x, y] of torn) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  g.save();
  pathPts(g, torn);
  g.clip();
  wash(g, polygon((minX + maxX) / 2, (minY + maxY) / 2, 40, 8, rng), P.sherpa, rng, { layers: 10, alpha: 0.12 });
  // layers of paper leaves, darker underneath, brighter on top
  const count = Math.round((maxX - minX) * (maxY - minY) / 26);
  for (let i = 0; i < count; i++) {
    const x = minX + rng() * (maxX - minX), y = minY + rng() * (maxY - minY);
    const top = i / count;
    g.globalAlpha = 0.55 + top * 0.45;
    leafCutout(g, x, y, rng() * 6.28, 6.5 + rng() * 3.5, LEAVES[Math.floor(rng() * LEAVES.length)], rng() < 0.55 ? 'maple' : 'oval', rng);
  }
  g.globalAlpha = 1;
  g.restore();
  // a few leaves spilling over the rim, so the edge reads as leafy
  for (let i = 0; i < torn.length; i += 5) {
    const [x, y] = torn[i];
    if (x < 2 || x > W - 2 || y > H - 2) continue;
    leafCutout(g, x + (rng() - 0.5) * 3, y + (rng() - 0.5) * 3, rng() * 6.28, 5.5 + rng() * 2.5, LEAVES[Math.floor(rng() * LEAVES.length)], rng() < 0.6 ? 'maple' : 'oval', rng);
  }
  // torn paper rim
  g.strokeStyle = P.paper;
  g.globalAlpha = 0.35;
  g.lineWidth = 1.1;
  pathPts(g, torn);
  g.stroke();
  g.globalAlpha = 1;
}

function jackOLantern(g, rng, x, y, r) {
  // shadow + paper rim
  g.fillStyle = P.shadow;
  g.beginPath(); g.ellipse(x - 3, y + 4, r * 1.25 + 2, r + 2, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = P.paper;
  fillPts(g, tornOutline(polygon(x, y, r, 30, null, r * 1.25 + 2.5, r + 2.5), 1.6, rng));
  // ribbed body
  for (const [dx, f, col] of [[-0.55, 0.6, C.pumpkinDark], [0.55, 0.6, C.pumpkinDark], [-0.28, 0.7, C.pumpkin], [0.28, 0.7, C.pumpkin], [0, 0.55, C.pumpkinLight]]) {
    g.fillStyle = col;
    g.beginPath(); g.ellipse(x + dx * r, y, r * f, r * 0.98, 0, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = '#6B3A16';
  g.lineWidth = 1.3;
  g.beginPath(); g.ellipse(x, y, r * 1.25, r, 0, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 0.9;
  g.globalAlpha = 0.7;
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(x + s * r * 0.35, y - r * 0.92); g.quadraticCurveTo(x + s * r * 0.62, y, x + s * r * 0.35, y + r * 0.92); g.stroke();
  }
  g.globalAlpha = 1;
  // glowing face (warm light inside the holes)
  const holes = [
    [[x - r * 0.62, y - r * 0.05], [x - r * 0.38, y - r * 0.48], [x - r * 0.14, y - r * 0.05]],
    [[x + r * 0.14, y - r * 0.05], [x + r * 0.38, y - r * 0.48], [x + r * 0.62, y - r * 0.05]],
  ];
  const mouth = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, mx = x - r * 0.72 + t * r * 1.44;
    mouth.push([mx, y + r * 0.2 + Math.sin(t * Math.PI) * r * 0.42 + (i % 2 ? -r * 0.1 : 0)]);
  }
  for (let i = 10; i >= 0; i--) {
    const t = i / 10, mx = x - r * 0.72 + t * r * 1.44;
    mouth.push([mx, y + r * 0.2 + Math.sin(t * Math.PI) * r * 0.18]);
  }
  for (const h of [...holes, mouth]) {
    g.fillStyle = '#FFC94A';
    fillPts(g, h);
    g.fillStyle = '#FFF1B0';
    g.globalAlpha = 0.7;
    fillPts(g, offsetPts(h, -1.4));
    g.globalAlpha = 1;
    g.strokeStyle = '#6B3A16';
    g.lineWidth = 1;
    pathPts(g, h);
    g.stroke();
  }
  // stem
  g.fillStyle = C.stem;
  g.strokeStyle = '#3E4E22';
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(x - 3, y - r + 2); g.lineTo(x - 5, y - r - 8); g.lineTo(x + 2, y - r - 9); g.lineTo(x + 3, y - r + 2); g.closePath(); g.fill(); g.stroke();
}

// Cobweb in a corner at (cx, cy), spokes fanning over a quarter turn from a0.
function cobweb(g, rng, cx, cy, a0, R, rings) {
  const spokes = 6;
  const ang = [], len = [];
  for (let i = 0; i < spokes; i++) {
    ang.push(a0 + (i / (spokes - 1)) * (Math.PI / 2) + (rng() - 0.5) * 0.08);
    len.push(R * (0.85 + rng() * 0.25));
  }
  g.strokeStyle = C.web;
  g.lineCap = 'round';
  g.lineWidth = 0.9;
  g.globalAlpha = 0.55;
  for (let i = 0; i < spokes; i++) {
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang[i]) * len[i], cy + Math.sin(ang[i]) * len[i]); g.stroke();
  }
  g.lineWidth = 0.75;
  g.globalAlpha = 0.45;
  for (let r = 1; r <= rings; r++) {
    const f = r / rings;
    g.beginPath();
    for (let i = 0; i < spokes - 1; i++) {
      const ax = cx + Math.cos(ang[i]) * len[i] * f, ay = cy + Math.sin(ang[i]) * len[i] * f;
      const bx = cx + Math.cos(ang[i + 1]) * len[i + 1] * f, by = cy + Math.sin(ang[i + 1]) * len[i + 1] * f;
      // sag toward the corner
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const sx = cx + (mx - cx) * 0.82, sy = cy + (my - cy) * 0.82;
      if (i === 0) g.moveTo(ax, ay);
      g.quadraticCurveTo(sx, sy, bx, by);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
}

function spider(g, x, y) {
  g.strokeStyle = C.night;
  g.lineWidth = 1;
  g.lineCap = 'round';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const a = -0.9 + i * 0.6;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + s * 5, y + a * 5 - 2, x + s * 7, y + a * 6 + 2);
      g.stroke();
    }
  }
  g.fillStyle = C.night;
  g.beginPath(); g.ellipse(x, y + 1, 3.4, 4, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#FFFFFF';
  for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * 1.3, y + 2.2, 0.8, 0, Math.PI * 2); g.fill(); }
}

// A small bat silhouette: two scalloped wings and a round body. Used on the
// floor (moon shadow) and as the cheese's bow.
function batShape(g, x, y, s, a, color, ink) {
  g.save();
  g.translate(x, y);
  g.rotate(a);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, -0.25 * s);
  for (const side of [1, -1]) {
    g.lineTo(side * 0.35 * s, -0.4 * s);
    g.quadraticCurveTo(side * 0.7 * s, -0.75 * s, side * 1.05 * s, -0.45 * s);
    g.quadraticCurveTo(side * 0.9 * s, 0, side * 0.95 * s, 0.25 * s);
    g.quadraticCurveTo(side * 0.75 * s, 0.05 * s, side * 0.62 * s, 0.32 * s);
    g.quadraticCurveTo(side * 0.48 * s, 0.1 * s, side * 0.32 * s, 0.32 * s);
    g.lineTo(0, 0.2 * s);
    if (side === 1) g.moveTo(0, -0.25 * s);
  }
  g.closePath();
  g.fill();
  if (ink) { g.strokeStyle = ink; g.lineWidth = 0.6; g.stroke(); }
  // body and ears
  g.beginPath(); g.ellipse(0, 0, 0.26 * s, 0.34 * s, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(-0.2 * s, -0.2 * s); g.lineTo(-0.16 * s, -0.48 * s); g.lineTo(-0.04 * s, -0.28 * s); g.fill();
  g.beginPath(); g.moveTo(0.2 * s, -0.2 * s); g.lineTo(0.16 * s, -0.48 * s); g.lineTo(0.04 * s, -0.28 * s); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- items
// 'sock' -> wrapped candy, 'shoe' -> pumpkin pail, 'cheese' -> cheese with a bat bow.
function bakeItem(type, k, paper) {
  if (type === 'shoe') return bakePail(k, paper);
  if (type === 'cheese') return bakeCheese(k, paper);
  return bakeCandy(k, paper);
}

// Shared sticker finish: shadow + torn paper rim behind a set of shapes.
function stickerBack(g, shapes, rng, pad = 2.4) {
  const rims = shapes.map((s) => tornOutline(offsetPts(s, pad), 1.3, rng));
  g.fillStyle = P.shadow;
  g.save(); g.translate(1.6, 2.2); for (const r of rims) fillPts(g, r); g.restore();
  g.fillStyle = P.paper;
  for (const r of rims) fillPts(g, r);
}

function bakeCandy(k, paper) {
  const S = 28;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(31);
  g.translate(S / 2, S / 2);
  g.rotate(-0.4);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const body = polygon(0, 0, 6.6, 22, null, 6.8, 5.2);
  const fanL = smoothPts([[-5.5, -1.2], [-11.8, -6], [-13, -2], [-13, 2], [-11.8, 6], [-5.5, 1.2]], 1);
  const fanR = fanL.map(([x, y]) => [-x, y]);
  stickerBack(g, [fanL, fanR, body], rng);

  const part = (pts, fill) => {
    g.fillStyle = fill;
    fillPts(g, pts);
    g.strokeStyle = P.ink;
    g.lineWidth = 1;
    pathPts(g, pts);
    g.stroke();
  };
  // twisted wrapper ends with pleats
  for (const f of [fanL, fanR]) {
    part(f, '#F7B25E');
    g.save();
    pathPts(g, f);
    g.clip();
    const sx = f === fanL ? -1 : 1;
    g.strokeStyle = '#C9661C';
    g.lineWidth = 0.7;
    g.globalAlpha = 0.8;
    for (const yy of [-3.6, 0, 3.6]) {
      g.beginPath(); g.moveTo(sx * 6, 0); g.lineTo(sx * 13, yy * 1.4); g.stroke();
    }
    g.globalAlpha = 1;
    g.restore();
  }
  // the candy: orange with purple stripes
  g.save();
  pathPts(g, body);
  g.clip();
  g.fillStyle = P.sock;
  fillPts(g, body);
  g.strokeStyle = P.sockStripe;
  g.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    g.beginPath(); g.moveTo(i * 3.6 - 4, -7); g.lineTo(i * 3.6 + 4, 7); g.stroke();
  }
  wash(g, polygon(-2, -2, 4, 7, rng), '#ffffff', rng, { layers: 5, alpha: 0.08 });
  g.fillStyle = 'rgba(255,248,230,0.85)';
  g.beginPath(); g.ellipse(-2.4, -2.6, 2, 1, -0.5, 0, Math.PI * 2); g.fill();
  g.restore();
  g.strokeStyle = P.ink;
  g.lineWidth = 1.1;
  pathPts(g, body);
  g.stroke();
  // twist knots
  g.fillStyle = '#C9661C';
  for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 6.4, 0, 1.2, 1.9, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
  grainAtop(L, paper, 0.3);
  return L;
}

function bakePail(k, paper) {
  const S = 34;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(77);
  g.translate(S / 2, S / 2 + 1.5);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // a bucket: wide flat rim at the top, tapering to a rounded base
  const body = smoothPts([[-11.6, -5.4], [11.6, -5.4], [9.4, 11.6], [-9.4, 11.6]], 1);
  const handle = smoothPts([[-10.5, -1], [-9, -10.5], [0, -14], [9, -10.5], [10.5, -1], [8.6, -1], [7.4, -9], [0, -11.8], [-7.4, -9], [-8.6, -1]], 1);
  stickerBack(g, [handle, body], rng, 2.2);

  // handle (dark, behind the body)
  g.fillStyle = P.sole;
  fillPts(g, handle);
  // candy peeking out of the top
  for (const [x, y, c, r] of [[-4.5, -5.2, '#8A5CC8', 2.8], [0.5, -6.4, '#F2C14E', 2.6], [5, -5, '#E86A8A', 2.6], [-1.5, -4, '#7FC25A', 2.2]]) {
    g.fillStyle = c;
    g.strokeStyle = P.ink;
    g.lineWidth = 0.8;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  // pumpkin body
  g.save();
  pathPts(g, body);
  g.clip();
  g.fillStyle = P.shoe;
  fillPts(g, body);
  g.fillStyle = C.bucketLight;
  g.globalAlpha = 0.5;
  g.beginPath(); g.ellipse(-5.5, 3, 2.6, 7.5, 0.1, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
  wash(g, polygon(5, 7, 7, 7, rng), P.shoeDark, rng, { layers: 5, alpha: 0.14 });
  // rim of the pail opening
  g.fillStyle = 'rgba(0,0,0,0.0)';
  g.restore();
  g.strokeStyle = P.ink;
  g.lineWidth = 1.1;
  pathPts(g, body);
  g.stroke();
  // rolled rim along the top
  g.fillStyle = P.shoeDark;
  g.beginPath(); g.roundRect(-12.4, -6.6, 24.8, 3, 1.4); g.fill(); g.stroke();
  // jack-o'-lantern face, lit from inside so it glows gold on the violet
  g.fillStyle = C.star;
  g.beginPath(); g.moveTo(-6.5, 1.6); g.lineTo(-4.2, -2.2); g.lineTo(-2, 1.6); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(6.5, 1.6); g.lineTo(4.2, -2.2); g.lineTo(2, 1.6); g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(-7, 4.4);
  g.quadraticCurveTo(0, 12.5, 7, 4.4);
  g.lineTo(4.5, 5.6); g.lineTo(3, 4.6); g.lineTo(1, 6.2); g.lineTo(-1, 5.0); g.lineTo(-3, 6.2); g.lineTo(-4.6, 5);
  g.closePath();
  g.fill();
  // handle bolts
  g.fillStyle = P.sole;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 9.6, -1.2, 1.5, 0, Math.PI * 2); g.fill(); }
  grainAtop(L, paper, 0.3);
  return L;
}

function bakeCheese(k, paper) {
  const S = 28;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(6 * 97 + 3);
  g.translate(S / 2, S / 2 + 1);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const shape = smoothPts([[-10, 6], [-10, -1], [9, -7], [10, 6]], 1);
  stickerBack(g, [shape], rng);
  g.save();
  pathPts(g, shape);
  g.clip();
  g.fillStyle = P.cheese;
  fillPts(g, shape);
  wash(g, polygon(-2, -2, 7, 7, rng), '#ffffff', rng, { layers: 5, alpha: 0.06 });
  wash(g, polygon(4, 4, 8, 7, rng), '#000000', rng, { layers: 4, alpha: 0.05 });
  g.fillStyle = P.cheeseTop;
  g.beginPath(); g.moveTo(-10, -1); g.lineTo(9, -7); g.lineTo(10, -4); g.lineTo(-9, 2); g.closePath(); g.fill();
  g.fillStyle = P.cheeseDark;
  for (const [x, y, r] of [[-5, 3.4, 1.8], [1.5, 3.2, 1.3], [6, 3.8, 2], [3.5, -2.4, 1]]) {
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  g.strokeStyle = P.ink;
  g.lineWidth = 1.1;
  pathPts(g, shape);
  g.stroke();
  // the tiny bat bow, on the wedge's top corner, on its own paper rim
  g.fillStyle = P.paper;
  g.beginPath(); g.ellipse(-4.5, -3.4, 8.2, 4.4, -0.3, 0, Math.PI * 2); g.fill();
  batShape(g, -4.5, -3.4, 7.2, -0.3, '#4A3A82', C.night);
  g.fillStyle = C.band;
  g.beginPath(); g.arc(-4.5, -3.2, 1, 0, Math.PI * 2); g.fill();
  grainAtop(L, paper, 0.3);
  return L;
}

// ---------------------------------------------------------------- ghost-sheet pups
// A pup under a bedsheet, seen from above, facing +x: a round sheet with a
// wavy hem trailing behind, ear bumps, two eye holes and a little "ooo" mouth.
// No baked shadow ('float' motion: the renderer draws the floor shadow).
function bakeGhost(variant, k, paper) {
  const S = 50;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(610 + variant);
  const body = variant ? P.dog2 : P.dog;
  const dark = variant ? P.dog2Dark : P.dogDark;
  const cx = S / 2 - 1, cy = S / 2;
  g.translate(cx, cy);
  // Trimmed so the sheet is about the size of the hitbox (DOG_RADIUS 12) and
  // the Bedroom dogs: untrimmed it ran about 35 x 28 px.
  g.scale(0.82, 0.82);
  g.lineJoin = 'round';
  g.lineCap = 'round';

  // sheet: an oval whose back half ripples into a scalloped hem
  const sheet = [];
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    const back = Math.max(0, -Math.cos(t));
    const r = 1 + back * 0.16 * Math.cos(t * 7 + variant);
    sheet.push([-2 + Math.cos(t) * 14.5 * r, Math.sin(t) * 12 * r]);
  }
  const head = polygon(7.5, 0, 8.6, 20, null, 8.8, 8.2);
  const ears = [polygon(4, -8.6, 3.4, 10, null), polygon(4, 8.6, 3.4, 10, null)];
  const parts = [sheet, head, ...ears];

  // paper rim behind every part
  g.fillStyle = P.paper;
  for (const s of parts) fillPts(g, tornOutline(offsetPts(s, 1.7), 0.9, rng));
  // union outline: stroke wide, then fill over it
  g.strokeStyle = P.dogInk;
  g.lineWidth = 2;
  for (const s of parts) { pathPts(g, s); g.stroke(); }
  g.fillStyle = body;
  for (const s of parts) fillPts(g, s);

  // soft folds draping from the head down to the hem
  g.save();
  g.beginPath();
  for (const s of parts) { g.moveTo(s[0][0], s[0][1]); for (const q of s) g.lineTo(q[0], q[1]); g.closePath(); }
  g.clip();
  wash(g, polygon(-9, 0, 8, 9, rng, 9, 9), dark, rng, { layers: 8, alpha: 0.1 });
  wash(g, polygon(8, -2, 5, 7, rng), '#ffffff', rng, { layers: 5, alpha: 0.12 });
  g.strokeStyle = dark;
  g.lineWidth = 1;
  g.globalAlpha = 0.7;
  for (const s of [-1, 0, 1]) {
    g.beginPath(); g.moveTo(1, s * 4); g.quadraticCurveTo(-7, s * 7, -15, s * 8.5 + (s ? 0 : 1)); g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
  // ear bump shading
  g.fillStyle = dark;
  g.globalAlpha = 0.45;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(3.6, s * 9.2, 1.8, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  // variant 1: a little stitched star patch on the back
  if (variant) {
    g.save();
    g.translate(-6, 3);
    g.rotate(0.3);
    const star = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 1.6 : 3.8;
      star.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    g.fillStyle = C.star;
    fillPts(g, star);
    g.strokeStyle = '#B88A2A';
    g.lineWidth = 0.6;
    g.setLineDash([0.9, 0.7]);
    pathPts(g, star);
    g.stroke();
    g.setLineDash([]);
    g.restore();
  }
  // eye holes, cheeks and the "ooo" mouth
  g.fillStyle = P.dogEye;
  for (const s of [-1, 1]) {
    g.beginPath(); g.ellipse(10.4, s * 3.5, 1.9, 2.3, 0, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#ffffff';
  for (const s of [-1, 1]) { g.beginPath(); g.arc(11, s * 3.5 - 0.8, 0.6, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = C.blushGhost;
  g.globalAlpha = 0.7;
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(12.4, s * 6.4, 1.6, 1.1, 0, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  g.strokeStyle = P.dogEye;
  g.lineWidth = 1.1;
  g.beginPath(); g.ellipse(14.2, 0, 1.2, 1.5, 0, 0, Math.PI * 2); g.stroke();

  grainAtop(L, paper, 0.3);
  L.ox = cx;
  L.oy = cy;
  return L;
}

// ---------------------------------------------------------------- pumpkin ball
// Seen from above: an orange disc with ribs fanning out from a green stem.
function bakePumpkinBall(k, paper) {
  const S = 26, r = CONFIG.BALL_RADIUS;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(919);
  g.translate(S / 2, S / 2);
  const disc = [];
  for (let i = 0; i < 40; i++) {
    const t = (i / 40) * Math.PI * 2;
    const rr = r * (1 - 0.05 * Math.pow(Math.abs(Math.sin(t * 3)), 0.5)); // gentle lobes
    disc.push([Math.cos(t) * rr, Math.sin(t) * rr]);
  }
  g.fillStyle = P.paper;
  fillPts(g, tornOutline(polygon(0, 0, r + 2, 28, null), 1.1, rng));
  g.save();
  pathPts(g, disc);
  g.clip();
  g.fillStyle = P.ball;
  fillPts(g, disc);
  wash(g, polygon(-2.5, -2.5, 4.5, 7, rng), C.pumpkinLight, rng, { layers: 6, alpha: 0.14 });
  wash(g, polygon(3, 3.5, 6, 7, rng), P.ballDark, rng, { layers: 6, alpha: 0.12 });
  g.strokeStyle = P.ballDark;
  g.lineWidth = 0.9;
  g.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const c = Math.cos(a), s = Math.sin(a);
    g.beginPath();
    g.moveTo(c * 1.8, s * 1.8);
    g.quadraticCurveTo(c * 5 - s * 1.2, s * 5 + c * 1.2, c * r, s * r);
    g.stroke();
  }
  g.fillStyle = 'rgba(255,240,210,0.8)';
  g.beginPath(); g.ellipse(-3.2, -3.4, 1.7, 1, -0.6, 0, Math.PI * 2); g.fill();
  g.restore();
  g.strokeStyle = P.ink;
  g.lineWidth = 1.1;
  pathPts(g, disc);
  g.stroke();
  // stem and a curly vine
  g.fillStyle = C.stem;
  g.strokeStyle = '#3E4E22';
  g.lineWidth = 0.8;
  g.beginPath(); g.ellipse(0, 0, 2, 1.8, 0.4, 0, Math.PI * 2); g.fill(); g.stroke();
  g.strokeStyle = C.stem;
  g.lineWidth = 0.9;
  g.beginPath(); g.moveTo(1.5, 0.5); g.bezierCurveTo(4, 3, 6, 0, 4.5, -1.5); g.stroke();
  grainAtop(L, paper, 0.3);
  return L;
}

// ---------------------------------------------------------------- the cauldron
// A little iron cauldron seen from above, brim-full of bubbling green brew
// that slops over the rim. Hit area: the BATH_RX x BATH_RY ellipse.
function bakeCauldron(k, paper) {
  const rx = CONFIG.BATH_RX, ry = CONFIG.BATH_RY;
  const SW = rx * 2 + 26, SH = ry * 2 + 26;
  const L = makeLayer(SW, SH, k);
  const g = L.g;
  const rng = makeRng(1313);
  g.translate(SW / 2, SH / 2);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const outer = polygon(0, 0, rx, 40, null, rx + 1, ry + 1);
  const inner = polygon(0, 0, rx, 40, null, rx - 4.2, ry - 4);
  // drips of brew slopping over the rim
  const drips = [];
  for (const a of [0.5, 2.3, 3.7, 5.3]) {
    const x = Math.cos(a) * (rx - 1), y = Math.sin(a) * (ry - 1);
    drips.push(smoothPts(deform(polygon(x + Math.cos(a) * 2.5, y + Math.sin(a) * 2, 4.2, 7, rng, 5, 3.6), 1, 0.08, rng), 1));
  }
  const rim = tornOutline(offsetPts(outer, 2.6), 1.6, rng);

  g.fillStyle = P.shadow;
  g.save(); g.translate(2.2, 3); fillPts(g, rim); for (const d of drips) fillPts(g, offsetPts(d, 2)); g.restore();
  g.fillStyle = P.paper;
  fillPts(g, rim);
  for (const d of drips) fillPts(g, tornOutline(offsetPts(d, 1.8), 1, rng));

  // iron rim
  g.fillStyle = C.iron;
  fillPts(g, outer);
  g.strokeStyle = C.ironLight;
  g.lineWidth = 1.4;
  g.globalAlpha = 0.8;
  g.beginPath(); g.ellipse(0, 0, rx - 1.6, ry - 1.4, 0, Math.PI * 1.05, Math.PI * 1.7); g.stroke();
  g.globalAlpha = 1;
  // the brew
  g.save();
  pathPts(g, inner);
  g.clip();
  g.fillStyle = P.water;
  fillPts(g, inner);
  wash(g, polygon(5, 4, rx * 0.7, 9, rng, rx * 0.7, ry * 0.6), P.waterDeep, rng, { layers: 10, alpha: 0.08 });
  wash(g, polygon(-4, -3, rx * 0.4, 8, rng, rx * 0.4, ry * 0.35), P.foam, rng, { layers: 8, alpha: 0.12 });
  g.restore();
  // brew drips over the iron
  for (const d of drips) {
    g.fillStyle = P.water;
    fillPts(g, d);
    g.strokeStyle = P.waterInk;
    g.lineWidth = 0.8;
    pathPts(g, d);
    g.stroke();
    g.fillStyle = P.foam;
    g.globalAlpha = 0.6;
    const [x, y] = d[2];
    g.beginPath(); g.arc(x * 0.98, y * 0.98, 1, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
  }
  // bubbles popping on the surface
  for (const [x, y, r] of [[-9, 3, 3.2], [-3, -5, 2.2], [7, -2, 3.6], [12, 5, 2], [1, 6, 2.6], [-14, -3, 1.6], [15, -6, 1.4]]) {
    g.fillStyle = P.foam;
    g.globalAlpha = 0.85;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = P.waterInk;
    g.lineWidth = 0.7;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(x - r * 0.35, y - r * 0.4, r * 0.28, 0, Math.PI * 2); g.fill();
  }
  // ink lines
  g.strokeStyle = C.witchDark;
  g.lineWidth = 1.2;
  pathPts(g, outer);
  g.stroke();
  g.strokeStyle = P.waterInk;
  g.lineWidth = 0.9;
  pathPts(g, inner);
  g.stroke();
  grainAtop(L, paper, 0.25);
  L.ox = SW / 2;
  L.oy = SH / 2;
  return L;
}

// One green bubble rising off the brew.
function bakeBrewBubble(k) {
  const S = 14;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const c = S / 2, r = S / 2 - 1.2;
  g.fillStyle = P.bubble;
  g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = P.bubbleRim;
  g.lineWidth = 0.9;
  g.stroke();
  g.strokeStyle = 'rgba(240,255,220,0.95)';
  g.lineWidth = 1.2;
  g.beginPath(); g.arc(c, c, r - 1.6, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(c + r * 0.35, c - r * 0.4, 0.9, 0, Math.PI * 2); g.fill();
  return L;
}

// ---------------------------------------------------------------- hide flap
// A little heap of leaves pulled over Zoe's head; the front edge stays low so
// her eyes and nose can peek out at +x.
function bakeLeafFlap(k, paper) {
  const S = 40;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(88);
  g.translate(S / 2, S / 2);
  const base = smoothPts([[-13, -11], [5, -13], [9, -6], [8, 6], [5, 13], [-13, 11], [-16, 0]], 2);
  const torn = tornOutline(deform(base, 1, 0.05, rng), 1.6, rng);
  g.fillStyle = P.shadow;
  g.save(); g.translate(1.8, 2.6); fillPts(g, torn); g.restore();
  g.fillStyle = P.sherpaDark;
  fillPts(g, torn);
  g.save();
  pathPts(g, torn);
  g.clip();
  for (let i = 0; i < 34; i++) {
    const x = -16 + rng() * 25, y = -13 + rng() * 26;
    leafCutout(g, x, y, rng() * 6.28, 6 + rng() * 3, LEAVES[Math.floor(rng() * LEAVES.length)], rng() < 0.55 ? 'maple' : 'oval', rng);
  }
  g.restore();
  // a few leaves along the front edge, overlapping the rim
  for (const [x, y] of [[7, -9], [9, -2], [8, 5], [5, 11], [-8, -12], [-10, 11]]) {
    leafCutout(g, x, y, rng() * 6.28, 6 + rng() * 2, LEAVES[Math.floor(rng() * LEAVES.length)], 'maple', rng);
  }
  grainAtop(L, paper, 0.25);
  return L;
}

// ---------------------------------------------------------------- costume
// Drawn live every frame on Zoe's rig: plain path calls only, no new canvases.

// Point on her spine at a fractional joint index, pushed sideways by w.
// Writes into PT to avoid making garbage every frame.
const PT = [0, 0];
function sidePt(z, f, w) {
  const n = z.n;
  f = Math.max(0, Math.min(n - 1.001, f));
  const i = Math.floor(f), t = f - i;
  const x = z.jx[i] + (z.jx[i + 1] - z.jx[i]) * t;
  const y = z.jy[i] + (z.jy[i + 1] - z.jy[i]) * t;
  const a = z.ja[i] + angDiff(z.ja[i + 1], z.ja[i]) * t;
  const hw = (z.jw[i] + (z.jw[i + 1] - z.jw[i]) * t) * w;
  PT[0] = x - Math.sin(a) * hw;
  PT[1] = y + Math.cos(a) * hw;
  return PT;
}
function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// The bat-wing cape: from her shoulders it spreads into two scalloped wing
// points on each side and ends at a point mid-back. The tips flap a little.
function capePath(ctx, z, flap) {
  const t1 = 1.85 * flap, t2 = 1.65 * flap, t3 = 1.35 * flap;
  ctx.beginPath();
  let p = sidePt(z, 1.5, -0.9);
  ctx.moveTo(p[0], p[1]);
  // left side: shoulder -> three wing tips with scallops between -> back point
  curveTo(ctx, z, 1.8, -1.9 * flap, 2.6, -t1);
  curveTo(ctx, z, 3.1, -0.75, 3.7, -t2);
  curveTo(ctx, z, 4.2, -0.7, 4.8, -t3);
  curveTo(ctx, z, 5.3, -0.4, 5.9, 0);
  // right side, the same in reverse
  curveTo(ctx, z, 5.3, 0.4, 4.8, t3);
  curveTo(ctx, z, 4.2, 0.7, 3.7, t2);
  curveTo(ctx, z, 3.1, 0.75, 2.6, t1);
  curveTo(ctx, z, 1.8, 1.9 * flap, 1.5, 0.9);
  // neckline
  curveTo(ctx, z, 1.1, 0, 1.5, -0.9);
  ctx.closePath();
}
function curveTo(ctx, z, cf, cw, f, w) {
  let p = sidePt(z, cf, cw);
  const cx = p[0], cy = p[1];
  p = sidePt(z, f, w);
  ctx.quadraticCurveTo(cx, cy, p[0], p[1]);
}

function drawCape(ctx, z) {
  if (z.pose.nap === 'belly' || z.n < 6) return; // belly-up: the cape is underneath her
  const flap = z.pose.nap ? 0.72 : 1 + 0.08 * Math.sin(z.t * 7); // folded while she naps
  ctx.lineJoin = 'round';
  // hard paper shadow
  ctx.save();
  ctx.translate(1.4, 2);
  capePath(ctx, z, flap);
  ctx.fillStyle = P.shadow;
  ctx.fill();
  ctx.restore();
  capePath(ctx, z, flap);
  ctx.fillStyle = C.cape;
  ctx.fill();
  ctx.strokeStyle = '#120C1C';
  ctx.lineWidth = 1.1;
  ctx.stroke();
  // wing bones
  ctx.strokeStyle = C.witchLight;
  ctx.lineWidth = 0.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const s of [-1, 1]) {
    let p = sidePt(z, 1.7, 0.3 * s); const x0 = p[0], y0 = p[1];
    p = sidePt(z, 2.6, 1.85 * s * flap); ctx.moveTo(x0, y0); ctx.lineTo(p[0], p[1]);
    p = sidePt(z, 3.7, 1.65 * s * flap); ctx.moveTo(x0, y0); ctx.lineTo(p[0], p[1]);
    p = sidePt(z, 4.8, 1.3 * s * flap); ctx.moveTo(x0, y0); ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
  // orange clasp at the neck
  const p = sidePt(z, 1.55, 0);
  ctx.fillStyle = C.band;
  ctx.strokeStyle = C.witchDark;
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.arc(p[0], p[1], 1.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

// The witch hat, seen from above in head space (+x = nose). A wide brim sits
// behind her eyes (x < 1); the pointy crown leans back over her neck with a
// bent tip, like a paper cutout laid flat.
function drawWitchHat(ctx, z) {
  const sway = Math.sin(z.t * 3.2) * 0.7;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // shadow on her head
  ctx.fillStyle = P.shadow;
  ctx.beginPath(); ctx.ellipse(-5.2, 1.2, 5.7, 8.8, 0, 0, Math.PI * 2); ctx.fill();
  // brim, wider than her skull
  ctx.fillStyle = C.witch;
  ctx.strokeStyle = C.witchDark;
  ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.ellipse(-6, 0, 5.6, 8.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = C.witchLight;
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(-6, 0, 4.5, 7.6, 0, -Math.PI * 0.5, Math.PI * 0.4); ctx.stroke();
  // crown: leans back, then the tip bends off to one side
  const crown = () => {
    ctx.beginPath();
    ctx.moveTo(-4.6, -3.8);
    ctx.quadraticCurveTo(-9, -3.4, -12.4, -2.6);
    ctx.lineTo(-17.2, -6.6 + sway);
    ctx.lineTo(-13.4, 0.4);
    ctx.quadraticCurveTo(-9, 2.8, -4.6, 3.8);
    ctx.quadraticCurveTo(-3.4, 0, -4.6, -3.8);
    ctx.closePath();
  };
  ctx.save();
  ctx.translate(0.9, 1.3);
  crown();
  ctx.fillStyle = P.shadow;
  ctx.fill();
  ctx.restore();
  crown();
  ctx.fillStyle = '#5E4BAA';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#8B78CC';
  ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.ellipse(-9, -1.6, 5, 1.2, 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.band;
  ctx.fillRect(-7.6, -5, 1.9, 10);   // orange hat band
  ctx.restore();
  crown();
  ctx.strokeStyle = C.witchDark;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  // a gold star on the tip
  ctx.fillStyle = C.star;
  ctx.strokeStyle = C.witchDark;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.arc(-17.2, -6.6 + sway, 1.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

// ---------------------------------------------------------------- sound twist
// A soft ghostly "ooo" glide on top of every catch, higher for longer chains.
function ghostOoo(a, t, chain) {
  const base = 300 * a.semis(Math.min(chain - 1, 6) * 2) * a.rnd(0.06);
  const s = t + 0.04;
  const curve = [[base * 0.85, 0], [base * 1.1, 0.2], [base * 0.95, 0.5]];
  const lp = a.filter('lowpass', 1400, 0.7);
  const o = a.voice('sine', s, 0.5, 0.13, curve, lp, 0.12);
  a.voice('triangle', s, 0.5, 0.035, curve.map(([f, d]) => [f * 2, d]), lp, 0.12);
  a.lfo(s, s + 0.5, 6.5, base * 0.035, [o.frequency]);
}

// The owl: "hoo ... hoo-hoo", instead of the round-over sigh. About 0.9 s.
function owlHoot(a, t) {
  const hoot = (s, d, f, peak) => {
    const lp = a.filter('lowpass', 900, 0.8);
    a.voice('sine', s, d, peak, [[f * 0.92, 0], [f, 0.05], [f * 0.9, d]], lp, 0.04);
    a.voice('triangle', s, d, peak * 0.15, [[f * 1.84, 0], [f * 2, 0.05], [f * 1.8, d]], lp, 0.04);
    a.hiss(s, d * 0.8, 0.025, 'bandpass', f * 2.2, f * 1.8, 3, a.out, 0.03);
  };
  hoot(t, 0.32, 400, 0.32);
  hoot(t + 0.45, 0.14, 380, 0.26);
  hoot(t + 0.63, 0.3, 360, 0.3);
}
