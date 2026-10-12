// Theme: Christmas, "Cozy Christmas". A honey wood floor with a braided rug,
// a glowing tree in the corner, cool light from a snowy window, plaid blanket
// piles (one heaped on a spare tree skirt), glass ornaments, wrapped presents,
// cheese with holly, a jingle ball, reindeer-antler pups and a slushy puddle of
// melted snow. Zoe wears a red knit sweater and a Santa hat; catches jingle.
// Interface: README.md. Anything left out falls back to the Bedroom.

import { CONFIG } from '../../config.js';
import { P } from '../art/palette.js';
import {
  makeRng, makeLayer, polygon, deform, fillPts, wash, tornOutline,
  offsetPts, pathPts, smoothPts, grain, grainAtop,
} from '../art/util.js';

const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;

// Theme-only colors (not palette keys).
const C = {
  wood: '#9C6B45', woodTones: ['#A87650', '#8F5F3C', '#B07E55', '#94643F', '#A06E48'],
  woodGrain: '#6E4429', woodSeam: '#57351F',
  rugGreen: '#4F6E4E', rugCran: '#843836', rugOchre: '#A07E3E', rugOat: '#8E7656', rugField: '#5E6B47',
  pine: '#2F5A3A', pineDark: '#1F3F29', pineLight: '#5C8A55',
  glow: '255,206,120',
  snow: '#EEF3F7', snowShade: '#B9C9D6', frost: '#8FA9C2',
  sweater: '#B8323A', sweaterDark: '#7E1F26', knit: '#F4E4CC', knitGreen: '#3C6B47',
  hat: '#C0303A', hatDark: '#7E1F26', fur: '#FBF6EC', furShade: '#D9D2C6',
  plaidRed: '#A8343A', plaidGreen: '#2F5A3A', plaidGold: '#E3B95A', plaidCream: '#F2E6D2',
  velvet: '#9E2A33', gold: '#D9A93A', goldDark: '#9C7424', goldLight: '#F6DC8E',
  holly: '#2F6B45', hollyDark: '#1F4A2F', berry: '#C8323C',
  // silver-blue glass ornaments (kept off red and gold: those are the sweater and the jingle ball)
  silver: '#D9E1E8', silverDark: '#7E8E9C',
  pupHalo: '#F7EEDC',        // cream paper halo so the pups read on the wood floor
};

export default {
  id: 'christmas',
  name: 'Cozy Christmas',
  chip: { color: '#A8423C', ink: '#F2D27A' },
  letterbox: '#3a2622',
  palette: {
    vignette: '60,30,18',
    sun: '#FFE6B0',
    // confetti and the blanket fallback colors
    sherpa: C.plaidRed, sherpaDark: '#6E2622', sherpaLight: C.plaidCream,
    // items: ornament (sock), present (shoe), cheese
    sock: '#86A9D8', sockStripe: C.silver, shoe: '#2F7F94', shoeDark: '#1F5A6B', sole: C.gold,
    // jingle ball
    ball: C.gold, ballDark: C.goldDark, ballSeam: '#5A3A1A',
    // slush puddle
    water: '#C9D7DF', waterDeep: '#98AEBB', waterInk: '#5E7686',
    foam: C.snow, foamRim: 'rgba(94,118,134,0.5)', ripple: 'rgba(255,255,255,0.75)',
    bubble: 'rgba(238,243,247,0.9)', bubbleRim: 'rgba(94,118,134,0.8)',
    // reindeer pups
    // dark cocoa + charcoal with a cream muzzle: darker than the floorboards
    dog: '#5A3A2C', dogDark: '#3E271D', dogLight: '#E6CFAE',
    dog2: '#5E4C45', dog2Dark: '#3F322D', dogInk: '#2A1D17', dogEye: '#1E1612',
    // the leash: candy-cane red with a cream twist, so it reads on the rug
    rope: '#B8323A', ropeLight: '#F4E4CC',
    dust: '#EDE3D3',
  },

  bakeBackground,
  bakeItem,
  bakeCritter: bakePup,
  critterMotion: 'waddle',
  bakeBall: bakeJingleBall,
  bakeHazard: bakeSlush,
  bakeHazardBubble: bakeSnowflake,
  bakeHideFlap: bakePlaidFlap,

  costume: {
    hideCollar: true,          // the sweater's ribbed neck covers her collar
    bake: bakeCostume,
    body: drawSweater,
    head: drawHat,
  },

  drawChipIcon,
  sfx: {
    pop: { wave: 'sine', pitch: 1.2 },  // a glassy ornament "tink"
    catchLayer: sleighBells,
  },

  words: {
    loot: 'ornaments & gifts',
    ball: 'Jingle ball', ballTip: 'grab it for the zoomies!',
    hide: 'Blankets', hideTip: 'hide under one: pups lose you',
    hazard: 'Slush', hazardTip: 'dodge it, or your leash gets soggy',
    critters: 'Reindeer pups', critterTip: 'a bump makes Zoe dizzy, and a', critterTip2: 'touch on the leash snaps it',
  },
};

// ---------------------------------------------------------------- chip icon
// A little tiered tree with a gold star (vector only).
function drawChipIcon(g) {
  g.lineJoin = 'round';
  g.fillStyle = '#6E4429';
  g.fillRect(-1.8, 7, 3.6, 4);
  const tiers = [[-11, 3.5, 9], [-5, 6.5, 9], [0.5, 9.5, 8]]; // [top y, half width, height]
  g.strokeStyle = '#173222';
  g.lineWidth = 1.1;
  for (const [y, w, h] of tiers) {
    g.fillStyle = C.holly;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + h); g.lineTo(-w, y + h); g.closePath();
    g.fill(); g.stroke();
  }
  for (const [x, y, c] of [[-3, 5, C.plaidGold], [3.5, 7.5, '#F4E4CC'], [1, 0, '#F4E4CC'], [-5.5, 8.8, C.plaidGold]]) {
    g.fillStyle = c;
    g.beginPath(); g.arc(x, y, 1.1, 0, Math.PI * 2); g.fill();
  }
  star(g, 0, -11, 3.6, C.plaidGold, '#7A5A12');
}

function star(g, x, y, r, fill, ink) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = ink;
  g.lineWidth = 0.7;
  g.stroke();
}

// ---------------------------------------------------------------- the floor
function bakeBackground(k, paper) {
  const L = makeLayer(W, H, k);
  const g = L.g;
  const rng = makeRng(1225);

  woodFloor(g, rng);

  // warm light pooling around the tree (top-left corner)
  const tx = -16, ty = 58;
  const glow = g.createRadialGradient(tx, ty, 10, tx, ty, 230);
  glow.addColorStop(0, 'rgba(' + C.glow + ',0.42)');
  glow.addColorStop(0.5, 'rgba(' + C.glow + ',0.14)');
  glow.addColorStop(1, 'rgba(' + C.glow + ',0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  // cool light from the snowy window (top-right), with drifting snow shadows
  for (let p = 0; p < 2; p++) {
    const x0 = 268 + p * 70, y0 = 56, w = 58, h = 150, skew = -70;
    const quad = [[x0, y0], [x0 + w, y0], [x0 + w + skew, y0 + h], [x0 + skew, y0 + h]];
    g.globalCompositeOperation = 'screen';
    wash(g, quad, C.frost, rng, { layers: 12, alpha: 0.04, depth: 3, var: 0.15, baseVar: 0.05 });
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 14; i++) {
      const u = rng(), v = rng();
      const x = x0 + u * w + v * skew, y = y0 + v * h;
      g.globalAlpha = 0.18 + rng() * 0.2;
      g.beginPath(); g.arc(x, y, 0.9 + rng() * 1.3, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }

  braidedRug(g, rng, 205, 345, 140, 182);

  // a spare tree skirt under the bottom-left blanket pile
  treeSkirt(g, rng, -8, 606, 92);

  // plaid blanket piles (Zoe hides in these: CONFIG.BLANKETS)
  CONFIG.BLANKETS.forEach((ring, i) => plaidPile(g, rng, ring, i));

  // the tree, mostly off the edge, glowing
  tree(g, rng, tx, ty);

  // gentle edge darkening
  g.globalAlpha = 1;
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.72);
  vg.addColorStop(0, 'rgba(' + P.vignette + ',0)');
  vg.addColorStop(1, 'rgba(' + P.vignette + ',0.26)');
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

// Honey planks running across, staggered seams, painted grain.
function woodFloor(g, rng) {
  g.fillStyle = C.wood;
  g.fillRect(0, 0, W, H);
  const rowH = 27;
  // drawing is batched into a few big paths so the bake stays quick
  const grainLo = new Path2D(), grainHi = new Path2D(), knots = new Path2D(), seams = new Path2D(), lips = new Path2D();
  for (let y = 0; y < H; y += rowH) {
    let x = -rng() * 120;
    while (x < W) {
      const len = 110 + rng() * 120;
      g.fillStyle = C.woodTones[Math.floor(rng() * C.woodTones.length)];
      g.globalAlpha = 0.6;
      g.fillRect(x, y, len, rowH);
      // a soft darker end, as if the board were stained unevenly
      g.globalAlpha = 0.08;
      g.fillStyle = C.woodGrain;
      g.fillRect(x + len * (0.55 + rng() * 0.3), y, len * 0.2, rowH);
      for (let i = 0; i < 3; i++) {
        const gy = y + 5 + rng() * (rowH - 10), amp = 1 + rng() * 2, ph = rng() * 6;
        const path = rng() < 0.5 ? grainLo : grainHi;
        for (let s = 0; s <= 12; s++) {
          const px = x + 4 + (len - 8) * s / 12;
          const py = gy + Math.sin(ph + s * 0.7) * amp;
          if (s) path.lineTo(px, py); else path.moveTo(px, py);
        }
      }
      if (rng() < 0.25) {
        const kx = x + 20 + rng() * (len - 40), ky = y + 8 + rng() * (rowH - 16);
        knots.moveTo(kx + 4, ky); knots.ellipse(kx, ky, 4, 2, 0, 0, Math.PI * 2);
        knots.moveTo(kx + 1.6, ky); knots.ellipse(kx, ky, 1.6, 0.8, 0, 0, Math.PI * 2);
      }
      seams.moveTo(x + len, y + 1); seams.lineTo(x + len, y + rowH - 1);
      x += len;
    }
    seams.moveTo(0, y + rowH); seams.lineTo(W, y + rowH);
    lips.moveTo(0, y + rowH + 1.2); lips.lineTo(W, y + rowH + 1.2);
  }
  g.lineCap = 'round';
  g.strokeStyle = C.woodGrain;
  g.lineWidth = 0.7; g.globalAlpha = 0.12; g.stroke(grainLo);
  g.lineWidth = 1; g.globalAlpha = 0.18; g.stroke(grainHi);
  g.lineWidth = 0.8; g.globalAlpha = 0.22; g.stroke(knots);
  g.strokeStyle = C.woodSeam;
  g.lineWidth = 1.05; g.globalAlpha = 0.5; g.stroke(seams);
  g.strokeStyle = '#F2D2A8';
  g.lineWidth = 1; g.globalAlpha = 0.12; g.stroke(lips);
  g.globalAlpha = 1;
  // a few big watercolor washes so the floor isn't too even
  for (let i = 0; i < 6; i++) {
    wash(g, polygon(rng() * W, rng() * H, 70 + rng() * 60, 8, rng), rng() < 0.5 ? C.woodGrain : '#E0B07A', rng, { layers: 6, alpha: 0.035, depth: 2 });
  }
}

// An oval braided rug: concentric braids in muted green, cranberry, ochre and oat.
function braidedRug(g, rng, cx, cy, rx, ry) {
  const outline = polygon(cx, cy, rx, 48, null, rx, ry);
  // soft baked shadow
  g.fillStyle = 'rgba(52,30,20,0.08)';
  for (let i = 0; i < 4; i++) {
    g.save(); g.translate(-1 - i, 2 + i); fillPts(g, outline); g.restore();
  }
  // a few braids round the edge, then a plain wool field
  const seq = [C.rugGreen, C.rugCran, C.rugOchre, C.rugCran, C.rugGreen, C.rugOat];
  const bw = 8.6;
  g.lineCap = 'round';
  for (let i = 0; i <= seq.length; i++) {
    const rxi = rx - i * bw, ryi = ry - i * bw;
    const col = i < seq.length ? seq[i] : C.rugField;
    g.fillStyle = col;
    g.beginPath(); g.ellipse(cx, cy, rxi, ryi, 0, 0, Math.PI * 2); g.fill();
    if (i < seq.length) {
      // braid ticks along the middle of this ring
      const mr = rxi - bw / 2, mry = ryi - bw / 2;
      const per = Math.PI * (3 * (mr + mry) - Math.sqrt((3 * mr + mry) * (mr + 3 * mry)));
      const m = Math.floor(per / 3.6);
      const dir = i % 2 ? 1 : -1;
      g.lineWidth = 1.4;
      for (const dark of [0, 1]) {
        g.strokeStyle = dark ? '#000000' : '#ffffff';
        g.globalAlpha = dark ? 0.14 : 0.08;
        g.beginPath();
        for (let s = dark; s < m; s += 2) {
          const a = (s / m) * Math.PI * 2;
          const x = cx + Math.cos(a) * mr, y = cy + Math.sin(a) * mry;
          const tx = -Math.sin(a) * mr, ty = Math.cos(a) * mry, tl = Math.hypot(tx, ty);
          const ux = tx / tl, uy = ty / tl, nx = uy, ny = -ux;
          g.moveTo(x - ux * 1.5 * dir - nx * 3.3, y - uy * 1.5 * dir - ny * 3.3);
          g.lineTo(x + ux * 1.5 * dir + nx * 3.3, y + uy * 1.5 * dir + ny * 3.3);
        }
        g.stroke();
      }
    }
    // a dark line where the braids meet
    g.strokeStyle = '#2A1D17';
    g.globalAlpha = 0.2;
    g.lineWidth = 0.7;
    g.beginPath(); g.ellipse(cx, cy, rxi, ryi, 0, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 1;
  }
  // a stitched holly-sprig border motif inside the field
  const frx = rx - seq.length * bw - 12, fry = ry - seq.length * bw - 12;
  g.strokeStyle = C.rugOchre;
  g.globalAlpha = 0.35;
  g.lineWidth = 1;
  g.setLineDash([3, 3]);
  g.beginPath(); g.ellipse(cx, cy, frx, fry, 0, 0, Math.PI * 2); g.stroke();
  g.setLineDash([]);
  g.globalAlpha = 1;
  // watercolor mottling over the whole rug
  g.save();
  pathPts(g, outline);
  g.clip();
  for (let i = 0; i < 7; i++) {
    const x = cx + (rng() - 0.5) * rx * 1.6, y = cy + (rng() - 0.5) * ry * 1.6;
    wash(g, polygon(x, y, 40 + rng() * 40, 8, rng), rng() < 0.3 ? '#2A1D17' : '#F6DFC0', rng, { layers: 8, alpha: 0.02 });
  }
  g.restore();
  g.strokeStyle = '#3A271E';
  g.globalAlpha = 0.5;
  g.lineWidth = 1.2;
  pathPts(g, outline);
  g.stroke();
  g.globalAlpha = 1;
}

// Tartan inside the current clip: base color, crossing see-through bands, fine lines.
function plaid(g, cx, cy, R, angle, base, scale, rng) {
  g.save();
  g.translate(cx, cy);
  g.rotate(angle);
  g.fillStyle = base;
  g.fillRect(-R, -R, R * 2, R * 2);
  const p = 22 * scale;
  const bands = [
    [C.plaidGreen, 0, 8 * scale, 0.45],
    [C.plaidGreen, 10 * scale, 2.2 * scale, 0.4],
    [C.plaidGold, 15 * scale, 1 * scale, 0.75],
    [C.plaidCream, 19 * scale, 0.8 * scale, 0.55],
  ];
  for (const [col, off, w, a] of bands) {
    g.fillStyle = col;
    g.globalAlpha = a;
    for (let x = -R - (R % p); x < R; x += p) g.fillRect(x + off, -R, w, R * 2);
    for (let y = -R - (R % p); y < R; y += p) g.fillRect(-R, y + off, R * 2, w);
  }
  g.globalAlpha = 1;
  g.restore();
}

function bbox(pts) {
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, r: Math.hypot(maxX - minX, maxY - minY) / 2 };
}

// A heaped plaid blanket on the hiding outline: tartan, fold shadows, fringe.
function plaidPile(g, rng, ring, idx) {
  const base = deform(ring, 3, 0.18, rng);
  const torn = tornOutline(base, 2.2, rng);
  const b = bbox(torn);
  g.fillStyle = 'rgba(52,30,20,0.08)';
  for (let i = 0; i < 5; i++) {
    g.save(); g.translate(-2 - i, 3 + i); fillPts(g, torn); g.restore();
  }
  g.save();
  pathPts(g, torn);
  g.clip();
  plaid(g, b.cx, b.cy, b.r + 10, idx ? 0.5 : -0.35, C.plaidRed, 1, rng);
  // heaped folds: darker troughs and lit ridges
  g.lineCap = 'round';
  for (let f = 0; f < 5; f++) {
    const x0 = b.minX + rng() * (b.maxX - b.minX), y0 = b.minY + rng() * (b.maxY - b.minY);
    const a = rng() * Math.PI, l = 20 + rng() * 20;
    const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l;
    const mx = (x0 + x1) / 2 + (rng() - 0.5) * 16, my = (y0 + y1) / 2 + (rng() - 0.5) * 16;
    g.strokeStyle = '#3A0F14';
    g.globalAlpha = 0.22;
    g.lineWidth = 5;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
    g.strokeStyle = '#FFE8D0';
    g.globalAlpha = 0.18;
    g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x0 + 3, y0 - 3); g.quadraticCurveTo(mx + 3, my - 3, x1 + 3, y1 - 3); g.stroke();
  }
  wash(g, polygon(b.cx, b.cy, b.r * 0.6, 8, rng), '#FFE8D0', rng, { layers: 8, alpha: 0.03 });
  g.globalAlpha = 1;
  g.restore();
  // fringe along the in-arena edge
  g.strokeStyle = C.plaidCream;
  g.lineWidth = 1;
  g.lineCap = 'round';
  for (let i = 0; i < torn.length; i += 2) {
    const [x, y] = torn[i];
    if (x < 2 || x > W - 2 || y > H - 2) continue;
    const dx = x - b.cx, dy = y - b.cy, d = Math.hypot(dx, dy) || 1;
    g.globalAlpha = 0.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx / d * 3.2, y + dy / d * 3.2); g.stroke();
  }
  g.globalAlpha = 1;
  // torn paper rim + ink edge
  g.strokeStyle = P.paper;
  g.globalAlpha = 0.7;
  g.lineWidth = 1.2;
  pathPts(g, torn);
  g.stroke();
  g.strokeStyle = '#4A1A1C';
  g.globalAlpha = 0.6;
  g.lineWidth = 0.8;
  g.stroke();
  g.globalAlpha = 1;
}

// A red velvet tree skirt with a fluffy white trim, quarter-circle in the corner.
function treeSkirt(g, rng, cx, cy, r) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const a = -Math.PI / 2 - 0.25 + (i / 24) * (Math.PI / 2 + 0.5);
    const rr = r + Math.sin(i * Math.PI / 2) * 3; // gentle scallops
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  pts.push([cx, cy]);
  const shape = deform(pts, 1, 0.02, rng);
  g.fillStyle = 'rgba(52,30,20,0.12)';
  g.save(); g.translate(-2, 3); fillPts(g, shape); g.restore();
  g.fillStyle = C.velvet;
  fillPts(g, shape);
  g.save();
  pathPts(g, shape);
  g.clip();
  wash(g, polygon(cx + 30, cy - 30, 40, 8, rng), '#E06A6A', rng, { layers: 8, alpha: 0.05 });
  g.restore();
  // fluffy trim along the curved edge
  for (let i = 0; i <= 40; i++) {
    const a = -Math.PI / 2 - 0.25 + (i / 40) * (Math.PI / 2 + 0.5);
    const x = cx + Math.cos(a) * (r - 1), y = cy + Math.sin(a) * (r - 1);
    g.fillStyle = C.fur;
    g.beginPath(); g.arc(x + (rng() - 0.5) * 2, y + (rng() - 0.5) * 2, 3 + rng() * 1.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.furShade;
    g.globalAlpha = 0.6;
    g.beginPath(); g.arc(x + 1, y + 1.4, 1.6, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
  }
  // embroidered gold snowflakes
  g.strokeStyle = C.plaidGold;
  g.lineWidth = 0.9;
  g.globalAlpha = 0.85;
  for (const [x, y] of [[cx + 70, cy - 36], [cx + 30, cy - 76], [cx + 58, cy - 66]]) snowflakeLines(g, x, y, 4.5);
  g.globalAlpha = 1;
}

function snowflakeLines(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI / 3;
    g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.stroke();
}

// The tree from above: star-shaped tiers of pine, lighter toward the top,
// with warm string lights, a few ornaments and a gold star.
function tree(g, rng, cx, cy) {
  const tiers = [[70, C.pineDark, 13], [55, C.pine, 11], [39, '#3D7046', 9], [23, C.pineLight, 7]];
  // hard paper shadow of the whole tree
  g.fillStyle = 'rgba(40,24,16,0.28)';
  g.beginPath(); g.arc(cx + 4, cy + 6, 70, 0, Math.PI * 2); g.fill();
  for (const [r, col, n] of tiers) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + rng() * 0.1;
      const rr = i % 2 ? r * 0.78 : r;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    const shape = smoothPts(pts, 1);
    g.fillStyle = 'rgba(20,30,18,0.3)';
    g.save(); g.translate(2, 3); fillPts(g, shape); g.restore();
    g.fillStyle = col;
    fillPts(g, shape);
    // needle strokes radiating out (two batched paths)
    g.save();
    pathPts(g, shape);
    g.clip();
    const light = new Path2D(), dark = new Path2D();
    for (let i = 0; i < r * 5; i++) {
      const a = rng() * Math.PI * 2, d = r * (0.3 + rng() * 0.7);
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      const p = rng() < 0.5 ? light : dark;
      p.moveTo(x, y); p.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4);
    }
    g.lineCap = 'round';
    g.globalAlpha = 0.35;
    g.lineWidth = 0.8;
    g.strokeStyle = C.pineLight; g.stroke(light);
    g.strokeStyle = C.pineDark; g.stroke(dark);
    g.globalAlpha = 1;
    g.restore();
    g.strokeStyle = '#173222';
    g.globalAlpha = 0.55;
    g.lineWidth = 0.9;
    pathPts(g, shape);
    g.stroke();
    g.globalAlpha = 1;
  }
  // ornaments
  for (let i = 0; i < 9; i++) {
    const a = rng() * Math.PI * 2, d = 18 + rng() * 44;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    g.fillStyle = [C.berry, C.gold, '#2F7F94'][i % 3];
    g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#2A1D17'; g.lineWidth = 0.6; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.beginPath(); g.arc(x - 0.8, y - 0.8, 0.8, 0, Math.PI * 2); g.fill();
  }
  // string lights: a spiral of glowing bulbs (halos batched into two soft fills)
  const bulbs = [];
  for (let i = 0; i < 46; i++) {
    const a = i * 0.62, d = 12 + i * 1.25;
    if (d > 66) break;
    bulbs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d]);
  }
  g.fillStyle = 'rgb(' + C.glow + ')';
  for (const [rr, al] of [[8, 0.07], [5.5, 0.1], [3.4, 0.22]]) {
    const halo = new Path2D();
    for (const [x, y] of bulbs) { halo.moveTo(x + rr, y); halo.arc(x, y, rr, 0, Math.PI * 2); }
    g.globalAlpha = al;
    g.fill(halo);
  }
  g.globalAlpha = 1;
  bulbs.forEach(([x, y], i) => {
    g.fillStyle = ['#FFE7A8', '#FFB8A0', '#FFF4D6'][i % 3];
    g.beginPath(); g.arc(x, y, 1.4, 0, Math.PI * 2); g.fill();
  });
  star(g, cx + 8, cy + 2, 7, C.plaidGold, '#7A5A12');
}

// The HUD strip: a torn strip of paper pinned across the top, with a little
// string of lights hanging along its lower edge.
function hudStrip(L, paper) {
  const g = L.g;
  const rngH = makeRng(44);
  const HH = CONFIG.HUD_H;
  const strip = tornOutline([[-6, -6], [W + 6, -6], [W + 6, HH + 1], [-6, HH - 1]], 2.6, rngH);
  g.fillStyle = P.shadow;
  g.save(); g.translate(0, 3); fillPts(g, strip); g.restore();
  g.fillStyle = P.paper;
  fillPts(g, strip);
  wash(g, [[0, HH - 10], [W, HH - 12], [W, HH], [0, HH]], '#E8D2C0', rngH, { layers: 8, alpha: 0.08, var: 0.1 });
  g.save();
  pathPts(g, strip);
  g.clip();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = 0.5;
  g.fillStyle = g.createPattern(paper, 'repeat');
  g.fillRect(0, 0, L.c.width, Math.ceil((HH + 6) * L.c.height / H));
  g.restore();
  // string of lights: a sagging wire with small bulbs, just under the strip
  g.strokeStyle = '#2F3A2A';
  g.lineWidth = 0.8;
  g.globalAlpha = 0.8;
  const bulbs = [];
  g.beginPath();
  for (let s = 0; s <= 8; s++) {
    const x0 = s * 50, y0 = HH + 1;
    if (s === 0) g.moveTo(x0, y0);
    else g.quadraticCurveTo(x0 - 25, y0 + 7, x0, y0);
    if (s < 8) for (const f of [0.3, 0.7]) bulbs.push([x0 + f * 50, y0 + 3.6 * (1 - Math.abs(f - 0.5) * 1.2)]);
  }
  g.stroke();
  g.globalAlpha = 1;
  const cols = [C.berry, C.plaidGold, '#2F7F94', C.holly];
  bulbs.forEach(([x, y], i) => {
    g.fillStyle = cols[i % 4];
    g.strokeStyle = '#2A1D17';
    g.lineWidth = 0.5;
    g.beginPath(); g.ellipse(x, y + 1.6, 1.4, 2.1, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath(); g.arc(x - 0.4, y + 1, 0.5, 0, Math.PI * 2); g.fill();
  });
}

// ---------------------------------------------------------------- items
// Torn-paper stickers, same sizes as the Bedroom: ornament (sock), present (shoe), cheese.
function bakeItem(type, k, paper) {
  const S = type === 'shoe' ? 34 : 28;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(type.length * 131 + 25);
  g.translate(S / 2, S / 2);
  g.lineJoin = 'round';
  g.lineCap = 'round';

  let shape, color, details, extra = null;
  if (type === 'sock') {
    // glass ornament: round bauble with a gold cap and wire loop
    shape = polygon(0, 2, 9.2, 28, null);
    color = P.sock;
    extra = [[-3.2, -9.6], [3.2, -9.6], [3.2, -6], [-3.2, -6]];
    details = () => {
      // silver band with a zigzag
      g.fillStyle = P.sockStripe;
      g.fillRect(-10, 0.2, 20, 3.4);
      g.strokeStyle = C.silverDark;
      g.lineWidth = 0.8;
      g.beginPath();
      for (let i = 0; i <= 8; i++) g.lineTo(-10 + i * 2.5, i % 2 ? 0.8 : 3);
      g.stroke();
      // glassy shine
      wash(g, polygon(4, 6, 6, 7, rng), '#1E3350', rng, { layers: 5, alpha: 0.1 });
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.beginPath(); g.ellipse(-4, -3, 2.4, 1.3, -0.7, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.beginPath(); g.arc(-1.3, -5.2, 0.8, 0, Math.PI * 2); g.fill();
    };
  } else if (type === 'shoe') {
    // wrapped present: a box with a gold ribbon cross and a big bow on top
    shape = smoothPts([[-11, -6], [11, -6], [11, 11], [-11, 11]], 1);
    color = P.shoe;
    extra = smoothPts([[-6, -15], [-1, -8], [1, -8], [6, -15], [9, -11], [3, -6], [-3, -6], [-9, -11]], 1);
    details = () => {
      // little white dots on the wrapping paper
      g.fillStyle = 'rgba(244,228,204,0.7)';
      for (let y = -4; y < 11; y += 4.5) for (let x = -9 + (y % 2 ? 2 : 0); x < 11; x += 5) {
        g.beginPath(); g.arc(x, y, 0.8, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,0.12)';
      g.fillRect(-11, -6, 22, 4); // lid
      g.fillStyle = P.sole;
      g.fillRect(-2.2, -7, 4.4, 19);
      g.fillRect(-12, 2, 24, 3.6);
      g.fillStyle = C.goldLight;
      g.fillRect(-1.2, -7, 1, 19);
    };
  } else {
    // cheese wedge with a holly sprig
    shape = smoothPts([[-10, 6], [-10, -1], [9, -7], [10, 6]], 1);
    color = P.cheese;
    details = () => {
      g.fillStyle = P.cheeseTop;
      g.beginPath(); g.moveTo(-10, -1); g.lineTo(9, -7); g.lineTo(10, -4); g.lineTo(-9, 2); g.closePath(); g.fill();
      g.fillStyle = P.cheeseDark;
      for (const [x, y, r] of [[-5, 3, 1.8], [1, 2.2, 1.3], [5.5, 3.8, 2]]) {
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    };
  }
  const outer = extra ? [shape, extra] : [shape];
  const rims = outer.map((s) => tornOutline(outset(s, 2.4), 1.4, rng));

  g.fillStyle = P.shadow;
  g.save(); g.translate(1.6, 2.2); for (const r of rims) fillPts(g, r); g.restore();
  g.fillStyle = P.paper;
  for (const r of rims) fillPts(g, r);

  // the ornament cap / the present's bow sit under the ink of the main shape
  if (type === 'sock') {
    g.fillStyle = C.silver;
    fillPts(g, extra);
    g.strokeStyle = P.ink;
    g.lineWidth = 1;
    pathPts(g, extra);
    g.stroke();
    g.strokeStyle = C.silverDark;
    g.lineWidth = 1.1;
    g.beginPath(); g.arc(0, -11.2, 1.9, Math.PI * 0.9, Math.PI * 2.1); g.stroke();
  }

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

  if (type === 'shoe') {
    // the bow, over the lid
    g.fillStyle = P.sole;
    fillPts(g, extra);
    g.fillStyle = C.goldDark;
    g.globalAlpha = 0.5;
    g.beginPath(); g.ellipse(-4.5, -10.5, 1.6, 2.2, 0.6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(4.5, -10.5, 1.6, 2.2, -0.6, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = P.ink;
    g.lineWidth = 1;
    pathPts(g, extra);
    g.stroke();
    g.fillStyle = C.goldDark;
    g.beginPath(); g.arc(0, -7.6, 2, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  if (type === 'cheese') holly(g, 4, -8);
  grainAtop(L, paper, 0.3);
  return L;
}

// A holly sprig: two spiky leaves and three berries.
function holly(g, x, y) {
  for (const [a, s] of [[-0.5, 1], [0.7, -1]]) {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    const pts = [[0, 0], [2, -2.4], [3.4, -1.2], [5, -3], [6.4, -1.4], [8.4, -2.2], [9, 0], [8.4, 2.2], [6.4, 1.4], [5, 3], [3.4, 1.2], [2, 2.4]];
    if (s < 0) g.scale(-1, 1);
    g.fillStyle = C.holly;
    fillPts(g, pts);
    g.strokeStyle = C.hollyDark;
    g.lineWidth = 0.7;
    pathPts(g, pts);
    g.stroke();
    g.beginPath(); g.moveTo(0.5, 0); g.lineTo(8.4, 0); g.stroke();
    g.restore();
  }
  for (const [bx, by] of [[0, 0.6], [-2, -1.6], [1.8, -2]]) {
    g.fillStyle = C.berry;
    g.strokeStyle = '#5A1218';
    g.lineWidth = 0.6;
    g.beginPath(); g.arc(x + bx, y + by, 1.8, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath(); g.arc(x + bx - 0.5, y + by - 0.6, 0.5, 0, Math.PI * 2); g.fill();
  }
}

// ---------------------------------------------------------------- reindeer pups
// Grow a shape outward by d. offsetPts pushes some windings inward (e.g. the
// polygon() ovals), so try one sign and flip it if the shape shrank.
function area(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  return Math.abs(a);
}
function outset(pts, d) {
  const o = offsetPts(pts, d);
  return area(o) >= area(pts) ? o : offsetPts(pts, -d);
}

// Brown pups seen from above, facing +x, wearing felt antlers and a bell collar.
function bakePup(variant, k, paper) {
  const S = 50;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(1300 + variant);
  const body = variant ? P.dog2 : P.dog;
  const dark = variant ? P.dog2Dark : P.dogDark;
  g.translate(S / 2 - 3, S / 2);
  g.lineJoin = 'round';
  g.lineCap = 'round';

  const r = CONFIG.DOG_RADIUS;
  const hx = r * 0.95;
  const bodyPts = polygon(0, 0, r, 22, null, r * 1.15, r * 0.88);
  const headPts = polygon(hx, 0, 7.4, 16, null, 7.6, 7);
  const snoutPts = polygon(hx + 6.5, 0, 4, 12, null, 4.6, 3.6);
  const tailPts = smoothPts([[-r * 1.1, -1.6], [-r * 1.1 - 5, -2.4], [-r * 1.1 - 6, 0], [-r * 1.1 - 5, 2.4], [-r * 1.1, 1.6]], 1);
  const ears = [smoothPts([[hx - 3, -5], [hx - 6, -10], [hx - 0.5, -7.6]], 1), smoothPts([[hx - 3, 5], [hx - 6, 10], [hx - 0.5, 7.6]], 1)];
  // felt antlers: a beam out to the side with two tines each
  const antler = (s) => smoothPts([
    [hx - 1, s * 4], [hx - 2, s * 10], [hx - 5, s * 14.5], [hx - 3.2, s * 15.6], [hx - 0.6, s * 12.4],
    [hx + 3, s * 15.4], [hx + 4.6, s * 14], [hx + 0.6, s * 10.4], [hx + 2, s * 8.6], [hx + 4.4, s * 9.6],
    [hx + 5, s * 8], [hx + 1.6, s * 6.4], [hx + 1.4, s * 4],
  ], 1);
  const antlers = [antler(-1), antler(1)];
  const all = [tailPts, bodyPts, headPts, snoutPts, ...ears, ...antlers];

  g.fillStyle = P.shadow;
  g.save(); g.translate(2, 2.8); for (const s of all) fillPts(g, outset(s, 2.6)); g.restore();
  g.fillStyle = C.pupHalo;
  for (const s of all) fillPts(g, tornOutline(outset(s, 2.6), 0.9, rng));

  const part = (pts, fill, ink = P.dogInk) => {
    g.fillStyle = fill;
    fillPts(g, pts);
    g.strokeStyle = ink;
    g.lineWidth = 1;
    pathPts(g, pts);
    g.stroke();
  };
  part(tailPts, dark);
  part(bodyPts, body);
  g.save(); pathPts(g, bodyPts); g.clip();
  wash(g, polygon(-3, 0, 7, 8, rng, 9, 5), dark, rng, { layers: 8, alpha: 0.1 });
  g.restore();
  // a collar with a gold jingle bell, behind the head
  g.strokeStyle = variant ? C.holly : C.berry;
  g.lineWidth = 3;
  g.beginPath(); g.ellipse(r * 0.55, 0, 2, 7.6, 0, 0, Math.PI * 2); g.stroke();
  part(headPts, body);
  for (const a of antlers) part(a, '#D8B98C', '#4A3020');
  part(snoutPts, P.dogLight);
  for (const e of ears) part(e, dark);
  g.fillStyle = C.gold;
  g.strokeStyle = '#5A3A1A';
  g.lineWidth = 0.7;
  g.beginPath(); g.arc(r * 0.55 - 2.4, 0, 2.2, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(r * 0.55 - 3.6, 0); g.lineTo(r * 0.55 - 1.2, 0); g.stroke();
  // grumpy eyes, brows, nose
  g.fillStyle = P.dogEye;
  for (const s of [-1, 1]) {
    g.beginPath(); g.arc(hx + 2.5, s * 3, 1.3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = P.dogEye;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(hx + 0.5, s * 5); g.lineTo(hx + 4, s * 2.6); g.stroke();
  }
  g.beginPath(); g.ellipse(hx + 10.4, 0, 1.6, 2, 0, 0, Math.PI * 2); g.fill();
  grainAtop(L, paper, 0.35);
  L.ox = S / 2 - 3;
  L.oy = S / 2;
  return L;
}

// ---------------------------------------------------------------- jingle ball
// A gold sleigh bell: a round paper disc with the slot and sound holes.
function bakeJingleBall(k, paper) {
  const S = 26, r = CONFIG.BALL_RADIUS;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(1224);
  g.translate(S / 2, S / 2);
  const disc = polygon(0, 0, r, 28, null);
  g.fillStyle = P.paper;
  fillPts(g, tornOutline(polygon(0, 0, r + 2, 28, null), 1.1, rng));
  g.save();
  pathPts(g, disc);
  g.clip();
  g.fillStyle = P.ball;
  fillPts(g, disc);
  wash(g, polygon(-2.5, -2.5, 4.5, 7, rng), '#ffffff', rng, { layers: 6, alpha: 0.1 });
  wash(g, polygon(3, 3.5, 6, 7, rng), P.ballDark, rng, { layers: 6, alpha: 0.16 });
  // seam around the middle
  g.strokeStyle = P.ballDark;
  g.lineWidth = 1;
  g.beginPath(); g.ellipse(0, -0.5, r, 2.2, 0, 0, Math.PI); g.stroke();
  // the slot with a round hole at each end
  g.strokeStyle = P.ballSeam;
  g.fillStyle = P.ballSeam;
  g.lineWidth = 1.3;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(-3.2, 3.6); g.lineTo(3.2, 3.6); g.stroke();
  g.beginPath(); g.arc(-3.6, 3.6, 1.3, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(3.6, 3.6, 1.3, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,250,225,0.9)';
  g.beginPath(); g.ellipse(-2.8, -3.4, 2, 1.2, -0.6, 0, Math.PI * 2); g.fill();
  g.restore();
  g.strokeStyle = P.ink;
  g.lineWidth = 1.1;
  pathPts(g, disc);
  g.stroke();
  // little red bow on top
  g.fillStyle = C.berry;
  g.strokeStyle = '#5A1218';
  g.lineWidth = 0.6;
  for (const s of [-1, 1]) {
    g.beginPath(); g.ellipse(s * 2.2, -r + 0.6, 2.2, 1.3, s * 0.4, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  g.beginPath(); g.arc(0, -r + 0.8, 1, 0, Math.PI * 2); g.fill(); g.stroke();
  grainAtop(L, paper, 0.3);
  return L;
}

// ---------------------------------------------------------------- slush puddle
// Melted snow: a grey-blue puddle with lumpy slush clumps along its rim.
function bakeSlush(k, paper) {
  const rx = CONFIG.BATH_RX, ry = CONFIG.BATH_RY;
  const SW = rx * 2 + 26, SH = ry * 2 + 26;
  const L = makeLayer(SW, SH, k);
  const g = L.g;
  const rng = makeRng(1231);
  g.translate(SW / 2, SH / 2);
  g.lineJoin = 'round';
  const shape = smoothPts(deform(polygon(0, 0, rx, 12, rng, rx + 1, ry + 1), 1, 0.07, rng), 2);
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
  wash(g, polygon(4, 5, rx * 0.8, 9, rng, rx * 0.8, ry * 0.7), P.waterDeep, rng, { layers: 12, alpha: 0.08 });
  wash(g, polygon(-6, 2, rx * 0.4, 8, rng, rx * 0.4, ry * 0.3), '#8A7A6A', rng, { layers: 6, alpha: 0.05 });
  // floating slush islands
  for (let i = 0; i < 7; i++) {
    const x = (rng() - 0.5) * rx * 1.3, y = (rng() - 0.5) * ry * 1.2, s = 2 + rng() * 3;
    const blob = deform(polygon(x, y, s, 6, rng), 1, 0.15, rng);
    g.fillStyle = C.snow;
    g.globalAlpha = 0.85;
    fillPts(g, blob);
    g.fillStyle = C.snowShade;
    g.globalAlpha = 0.6;
    g.save(); g.translate(0.8, 1); fillPts(g, offsetPts(blob, -1)); g.restore();
  }
  g.globalAlpha = 1;
  g.strokeStyle = P.ripple;
  g.lineWidth = 1;
  g.lineCap = 'round';
  for (const [x, y, w] of [[-8, -4, 8], [9, 6, 6]]) {
    g.beginPath(); g.ellipse(x, y, w, w * 0.35, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  }
  g.restore();
  g.strokeStyle = P.waterInk;
  g.globalAlpha = 0.85;
  g.lineWidth = 1.1;
  pathPts(g, shape);
  g.stroke();
  g.globalAlpha = 1;
  // snow clumps along the rim
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rng() * 0.3;
    const fx = Math.cos(a) * rx * 0.96, fy = Math.sin(a) * ry * 0.96;
    for (let j = 0; j < 3; j++) {
      const r = 2 + rng() * 2.4;
      const x = fx + (rng() - 0.5) * 5, y = fy + (rng() - 0.5) * 4;
      g.fillStyle = C.snow;
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

// A small snowflake that drifts up off the slush.
function bakeSnowflake(k) {
  const S = 14;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const c = S / 2;
  g.lineCap = 'round';
  for (const [col, w] of [[P.bubbleRim, 2.4], [C.snow, 1.2]]) {
    g.strokeStyle = col;
    g.lineWidth = w;
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3 + 0.3, r = 5.2;
      const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
      g.beginPath(); g.moveTo(c - dx, c - dy); g.lineTo(c + dx, c + dy); g.stroke();
      // little side twigs near each tip
      for (const s of [-1, 1]) {
        const tx = c + s * dx * 0.6, ty = c + s * dy * 0.6;
        for (const t of [-1, 1]) {
          const b = a + t * 0.8 + (s < 0 ? Math.PI : 0);
          g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + Math.cos(b) * 1.8, ty + Math.sin(b) * 1.8); g.stroke();
        }
      }
    }
  }
  return L;
}

// ---------------------------------------------------------------- hiding flap
// A plaid blanket fold laid over Zoe's head; flat-ish front so her face peeks out.
function bakePlaidFlap(k, paper) {
  const S = 40;
  const L = makeLayer(S, S, k);
  const g = L.g;
  const rng = makeRng(1226);
  g.translate(S / 2, S / 2);
  const base = smoothPts([[-13, -11], [5, -13], [9, -6], [8, 6], [5, 13], [-13, 11], [-16, 0]], 2);
  const torn = tornOutline(deform(base, 1, 0.05, rng), 1.6, rng);
  g.fillStyle = P.shadow;
  g.save(); g.translate(1.8, 2.6); fillPts(g, torn); g.restore();
  g.save();
  pathPts(g, torn);
  g.clip();
  plaid(g, 0, 0, 30, 0.3, C.plaidRed, 0.75, rng);
  wash(g, polygon(-6, 4, 9, 8, rng), '#3A0F14', rng, { layers: 6, alpha: 0.06 });
  // the lifted front fold catches the light
  g.globalAlpha = 0.45;
  g.strokeStyle = '#FFE8D0';
  g.lineWidth = 2.2;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(5, -11); g.quadraticCurveTo(10, 0, 5, 11); g.stroke();
  g.globalAlpha = 1;
  g.restore();
  g.strokeStyle = P.paper;
  g.globalAlpha = 0.7;
  g.lineWidth = 1.2;
  pathPts(g, torn);
  g.stroke();
  g.strokeStyle = '#4A1A1C';
  g.globalAlpha = 0.8;
  g.lineWidth = 0.8;
  g.stroke();
  g.globalAlpha = 1;
  grainAtop(L, paper, 0.25);
  return L;
}

// ---------------------------------------------------------------- Zoe's costume
// Baked once: the Santa hat (without its pom-pom, which sways live).
// Baked at 3x so it stays crisp on the big title Zoe.
const HAT = { x: -18, y: -11, w: 24, h: 22 };   // the sprite's box in head space
const POM = { x: -15.2, y: 3.4 };

function bakeCostume(k, paper) {
  const L = makeLayer(HAT.w, HAT.h, k * 3);
  const g = L.g;
  const rng = makeRng(1227);
  g.translate(-HAT.x, -HAT.y);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // the red cone, flopping back and a little to one side; its front tucks under the brim
  const cone = smoothPts([[-0.5, -6.6], [-6, -5.8], [-11, -2.6], [-14.6, 1.6], [-15.6, 4.2], [-13.2, 5], [-8.5, 5.6], [-4, 6.6], [-0.5, 6.6]], 2);
  g.fillStyle = P.shadow;
  g.save(); g.translate(1.2, 1.6); fillPts(g, cone); g.restore();
  g.fillStyle = C.hat;
  fillPts(g, cone);
  g.save();
  pathPts(g, cone);
  g.clip();
  wash(g, polygon(-6, -2, 5, 7, rng), '#F07070', rng, { layers: 5, alpha: 0.08 });
  wash(g, polygon(-9, 4, 6, 7, rng), C.hatDark, rng, { layers: 5, alpha: 0.12 });
  // a fold crease
  g.strokeStyle = C.hatDark;
  g.globalAlpha = 0.5;
  g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(-3, 1); g.quadraticCurveTo(-8, 0.5, -12, 2.6); g.stroke();
  g.globalAlpha = 1;
  g.restore();
  g.strokeStyle = P.ink;
  g.lineWidth = 0.9;
  pathPts(g, cone);
  g.stroke();
  // fluffy white brim across the back of her skull, kept behind her eyes (x < 1)
  const brim = [];
  for (let i = 0; i <= 10; i++) {
    const y = -7.6 + i * 1.52;
    brim.push([-1.4 + Math.cos((y / 7.6) * 1.2) * 1.2, y]);
  }
  for (const [x, y] of brim) {
    g.fillStyle = P.ink;
    g.beginPath(); g.arc(x, y, 2.35, 0, Math.PI * 2); g.fill();
  }
  for (const [x, y] of brim) {
    g.fillStyle = C.fur;
    g.beginPath(); g.arc(x, y, 1.75, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = C.furShade;
  for (const [x, y] of brim) { g.beginPath(); g.arc(x - 0.7, y + 0.6, 0.8, 0, Math.PI * 2); g.fill(); }
  grainAtop(L, paper, 0.25);
  return { hat: L };
}

// Live: the hat sprite plus a swaying pom-pom (two arcs).
function drawHat(ctx, z, s) {
  if (!s || !s.hat) return;
  ctx.drawImage(s.hat.c, HAT.x, HAT.y, HAT.w, HAT.h);
  const sway = Math.sin(z.t * 5) * 0.8;
  const px = POM.x - 0.4, py = POM.y + sway;
  ctx.fillStyle = P.ink;
  ctx.beginPath(); ctx.arc(px, py, 3.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.fur;
  ctx.beginPath(); ctx.arc(px, py, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.furShade;
  ctx.beginPath(); ctx.arc(px - 0.6, py + 0.7, 1.1, 0, Math.PI * 2); ctx.fill();
}

// Live: a red knit sweater wrapped over her back, neck to hips, with cream
// ribbed cuffs, a zigzag fair-isle band and a row of little knit dots.
// Built from her joints every frame (one fill and a few strokes).
function drawSweater(ctx, z) {
  const { jx, jy, ja, jw } = z;
  const i0 = 1, i1 = Math.max(i0 + 2, z.n - 4);
  ctx.beginPath();
  for (let i = i0; i <= i1; i++) {
    const nx = -Math.sin(ja[i]), ny = Math.cos(ja[i]), w = jw[i] + 0.7;
    ctx.lineTo(jx[i] - nx * w, jy[i] - ny * w);
  }
  for (let i = i1; i >= i0; i--) {
    const nx = -Math.sin(ja[i]), ny = Math.cos(ja[i]), w = jw[i] + 0.7;
    ctx.lineTo(jx[i] + nx * w, jy[i] + ny * w);
  }
  ctx.closePath();
  ctx.fillStyle = C.sweater;
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = C.sweaterDark;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 0.9;
  ctx.stroke();

  ctx.lineCap = 'round';
  // ribbed cuffs (cream bands) at the neck and the hem
  for (const i of [i0, i1]) {
    const nx = -Math.sin(ja[i]), ny = Math.cos(ja[i]), w = jw[i] + 0.2;
    ctx.strokeStyle = C.knit;
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(jx[i] - nx * w, jy[i] - ny * w); ctx.lineTo(jx[i] + nx * w, jy[i] + ny * w); ctx.stroke();
    ctx.strokeStyle = 'rgba(126,31,38,0.5)';
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(jx[i] - nx * w, jy[i] - ny * w); ctx.lineTo(jx[i] + nx * w, jy[i] + ny * w); ctx.stroke();
  }
  // fair-isle zigzag bands across the back
  ctx.strokeStyle = C.knit;
  ctx.lineWidth = 1.1;
  for (const i of [i0 + 2, i1 - 2]) {
    if (i <= i0 || i >= i1) continue;
    const c = Math.cos(ja[i]), s = Math.sin(ja[i]), nx = -s, ny = c, w = jw[i] - 0.4;
    ctx.beginPath();
    for (let q = 0; q <= 6; q++) {
      const off = -w + (2 * w * q) / 6, along = q % 2 ? 1.3 : -1.3;
      ctx.lineTo(jx[i] + nx * off + c * along, jy[i] + ny * off + s * along);
    }
    ctx.stroke();
  }
  // knit dots down the middle, green and cream
  for (let i = i0 + 3; i <= i1 - 3; i++) {
    ctx.fillStyle = i % 2 ? C.knit : C.knitGreen;
    ctx.beginPath(); ctx.arc(jx[i], jy[i], 1.2, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------------------------------------------------------------- sound twist
// Sleigh bells on every catch: a quick shake of small inharmonic bell hits,
// more hits for a bigger loop or a longer chain.
function sleighBells(a, t, chain, n) {
  const hits = Math.min(4 + n + Math.min(chain, 4), 10);
  const start = t + 0.04;
  for (let i = 0; i < hits; i++) {
    const s = start + i * 0.032 + (a.rnd(0.6) - 1) * 0.01;
    const f = 2500 * a.rnd(0.25) * (i % 2 ? 1.12 : 1);
    const peak = 0.07 * (1 - i / (hits * 1.6));
    a.voice('sine', s, 0.16, peak, [[f, 0], [f * 0.995, 0.15]], a.out, 0.001);
    a.voice('sine', s, 0.09, peak * 0.5, [[f * 2.76, 0], [f * 2.74, 0.08]], a.out, 0.001);
  }
  a.hiss(start, hits * 0.032 + 0.08, 0.05, 'highpass', 7000, 6000, 0.7, a.out, 0.003);
}
