// Small drawing helpers shared by the bakers and the live renderer.

// Seeded random numbers, so the room looks the same every load.
export function makeRng(seed) {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rnd.range = (lo, hi) => lo + rnd() * (hi - lo);
  rnd.gauss = () => {
    const u = Math.max(1e-9, rnd()), v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return rnd;
}

// Cheap repeatable hash noise in [-1, 1] (used for the line "boil").
export function hashNoise(i, seed) {
  let h = Math.imul(i * 374761393 + seed * 668265263, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return (((h ^ (h >>> 16)) >>> 0) / 4294967296) * 2 - 1;
}

// An offscreen canvas sized in arena units at k device pixels per unit.
// Returns { c, g, w, h } where g is already scaled so you draw in arena units.
export function makeLayer(w, h, k) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * k));
  c.height = Math.max(1, Math.ceil(h * k));
  const g = c.getContext('2d');
  g.setTransform(k, 0, 0, k, 0, 0);
  return { c, g, w, h };
}

// Closed Catmull-Rom spline through points xs/ys (n points) into a path or context.
export function catmullClosed(path, xs, ys, n) {
  path.moveTo(xs[0], ys[0]);
  for (let i = 0; i < n; i++) {
    const i0 = (i - 1 + n) % n, i2 = (i + 1) % n, i3 = (i + 2) % n;
    path.bezierCurveTo(
      xs[i] + (xs[i2] - xs[i0]) / 6, ys[i] + (ys[i2] - ys[i0]) / 6,
      xs[i2] - (xs[i3] - xs[i]) / 6, ys[i2] - (ys[i3] - ys[i]) / 6,
      xs[i2], ys[i2],
    );
  }
  path.closePath();
}

// Regular polygon as a list of [x, y].
export function polygon(cx, cy, r, n, rng, rx = r, ry = r) {
  const pts = [];
  const a0 = rng ? rng() * Math.PI : 0;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

// Recursive midpoint displacement (Tyler Hobbs' watercolor deform).
export function deform(pts, depth, variance, rng) {
  let cur = pts;
  let v = variance;
  for (let d = 0; d < depth; d++) {
    const out = [];
    for (let i = 0; i < cur.length; i++) {
      const a = cur[i], b = cur[(i + 1) % cur.length];
      out.push(a);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ang = rng() * Math.PI * 2;
      const off = rng.gauss() * len * v;
      out.push([(a[0] + b[0]) / 2 + Math.cos(ang) * off, (a[1] + b[1]) / 2 + Math.sin(ang) * off]);
    }
    cur = out;
    v *= 0.55;
  }
  return cur;
}

export function fillPts(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fill();
}

// A watercolor wash blob: many see-through deformed layers, plus a darker rim.
// Only for baking (never per frame).
export function wash(g, base, color, rng, opts = {}) {
  const layers = opts.layers || 18;
  const alpha = opts.alpha || 0.05;
  const shape = deform(base, opts.baseDepth ?? 2, opts.baseVar ?? 0.35, rng);
  g.fillStyle = color;
  g.globalAlpha = alpha;
  for (let l = 0; l < layers; l++) fillPts(g, deform(shape, opts.depth ?? 3, opts.var ?? 0.45, rng));
  if (opts.rim) {
    g.globalAlpha = opts.rimAlpha ?? 0.12;
    g.strokeStyle = opts.rim;
    g.lineWidth = opts.rimWidth ?? 1.2;
    g.lineJoin = 'round';
    const p = deform(shape, 2, 0.2, rng);
    g.beginPath();
    g.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]);
    g.closePath();
    g.stroke();
  }
  g.globalAlpha = 1;
}

// Ragged torn-paper outline around a closed shape given as [x, y] points.
export function tornOutline(pts, amount, rng) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(1, Math.round(len / 2.2));
    const nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const j = (rng() - 0.5) * amount;
      out.push([a[0] + (b[0] - a[0]) * t + nx * j, a[1] + (b[1] - a[1]) * t + ny * j]);
    }
  }
  return out;
}

export function roundRectPts(x, y, w, h, r, per = 4) {
  const pts = [];
  const corners = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= per; i++) {
      const a = a0 + (i / per) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  return pts;
}
