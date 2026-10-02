// Zoe as a paper puppet: a stretchy cutout wrapped around her segment chain,
// springy ears and tail (Verlet), stubby legs on a gait cycle, a hard paper
// shadow, and a squash-and-stretch lunge. Animation state lives here only;
// the game's Zoe is read, never written.
//
// A "pose" is { x, y, heading, segX, segY, n, odo, extra, lunge (0..1), stunned },
// plus optional { zoom (bool), nap ('' | 'belly' | 'donut' | 'loaf') }.
// A napping Zoe has closed eyes; 'belly' shows her tummy and paws in the air,
// 'loaf' and 'donut' tuck her legs away.

import { P, ZOE_ART as A } from './palette.js';
import { catmullClosed, hashNoise } from './util.js';

const MAXP = 64;

// --- a little Verlet rope anchored at one end ---
class Rope {
  constructor(n, seg) {
    this.n = n;
    this.seg = seg;
    this.x = new Float32Array(n); this.y = new Float32Array(n);
    this.px = new Float32Array(n); this.py = new Float32Array(n);
    this.ready = false;
  }

  // Pull each link toward a rest direction (angle per link), with inertia.
  step(ax, ay, angles, stiff, damp) {
    const { x, y, px, py, n, seg } = this;
    if (!this.ready) {
      let cx = ax, cy = ay;
      for (let i = 0; i < n; i++) {
        x[i] = px[i] = cx; y[i] = py[i] = cy;
        cx += Math.cos(angles[i]) * seg; cy += Math.sin(angles[i]) * seg;
      }
      this.ready = true;
    }
    x[0] = px[0] = ax; y[0] = py[0] = ay;
    let tx = ax, ty = ay;
    for (let i = 1; i < n; i++) {
      tx += Math.cos(angles[i - 1]) * seg; ty += Math.sin(angles[i - 1]) * seg;
      const vx = (x[i] - px[i]) * damp, vy = (y[i] - py[i]) * damp;
      px[i] = x[i]; py[i] = y[i];
      x[i] += vx + (tx - x[i]) * stiff;
      y[i] += vy + (ty - y[i]) * stiff;
    }
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < n; i++) {
        const dx = x[i] - x[i - 1], dy = y[i] - y[i - 1];
        const d = Math.hypot(dx, dy) || 1e-4;
        const f = (d - seg) / d;
        if (i === 1) { x[i] -= dx * f; y[i] -= dy * f; }
        else { x[i] -= dx * f * 0.5; y[i] -= dy * f * 0.5; x[i - 1] += dx * f * 0.5; y[i - 1] += dy * f * 0.5; }
      }
    }
  }
}

// Build a tapered feathered shape along a rope into scratch arrays.
// `wisp` adds little outward tufts between links (long-haired fringe).
function featherShape(rope, widths, scallop, wisp, outX, outY) {
  const n = rope.n;
  let m = 0;
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
    const a = Math.atan2(rope.y[i1] - rope.y[i0], rope.x[i1] - rope.x[i0]);
    const nx = -Math.sin(a), ny = Math.cos(a), dx = Math.cos(a), dy = Math.sin(a);
    const w = widths[i];
    L.push([rope.x[i] + nx * w, rope.y[i] + ny * w]);
    R.push([rope.x[i] - nx * w, rope.y[i] - ny * w]);
    if (wisp && i < n - 1 && i > 0) {
      const wm = (widths[i] + widths[i + 1]) / 2 + wisp;
      const back = rope.seg * 0.75;
      L.push([rope.x[i] + nx * wm + dx * back, rope.y[i] + ny * wm + dy * back]);
      R.push([rope.x[i] - nx * wm + dx * back, rope.y[i] - ny * wm + dy * back]);
    }
  }
  for (let i = 0; i < L.length; i++) { outX[m] = L[i][0]; outY[m] = L[i][1]; m++; }
  // rounded, feathered end: a half circle continuing the sides, with a wavy fringe
  const a = Math.atan2(rope.y[n - 1] - rope.y[n - 2], rope.x[n - 1] - rope.x[n - 2]);
  const tx = rope.x[n - 1], ty = rope.y[n - 1], wt = widths[n - 1];
  for (let f = -3; f <= 3; f++) {
    const fa = a - f * (Math.PI / 2) * 0.82 / 3;
    const r = wt * (f % 2 === 0 ? 1 + scallop : 1 - scallop * 0.4) * (Math.abs(f) === 3 ? 0.95 : 1);
    outX[m] = tx + Math.cos(fa) * r; outY[m] = ty + Math.sin(fa) * r; m++;
  }
  for (let i = R.length - 1; i >= 0; i--) { outX[m] = R[i][0]; outY[m] = R[i][1]; m++; }
  // rounded root
  const a0 = Math.atan2(rope.y[1] - rope.y[0], rope.x[1] - rope.x[0]);
  outX[m] = rope.x[0] - Math.cos(a0) * widths[0] * 0.8; outY[m] = rope.y[0] - Math.sin(a0) * widths[0] * 0.8; m++;
  return m;
}

export class ZoeRig {
  constructor() {
    this.earL = new Rope(4, 4.6);
    this.earR = new Rope(4, 4.6);
    this.tail = new Rope(5, 4.4);
    this.t = 0;
    this.acc = 0;
    this.squash = 0;     // post-lunge squash timer
    this.wasLunging = false;
    this.ox = new Float32Array(MAXP); this.oy = new Float32Array(MAXP);
    this.jx = new Float32Array(16); this.jy = new Float32Array(16); this.ja = new Float32Array(16); this.jw = new Float32Array(16);
    this.fx = new Float32Array(48); this.fy = new Float32Array(48);
    this.angles = new Float32Array(6);
  }

  reset() { this.earL.ready = this.earR.ready = this.tail.ready = false; }

  // Joints: head, then each body segment; tangent angle and half-width at each.
  _joints(pose) {
    const n = pose.n + 1;
    const { jx, jy, ja, jw } = this;
    jx[0] = pose.x; jy[0] = pose.y;
    for (let i = 0; i < pose.n; i++) { jx[i + 1] = pose.segX[i]; jy[i + 1] = pose.segY[i]; }
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
      ja[i] = i === 0 ? pose.heading : Math.atan2(jy[i0] - jy[i1], jx[i0] - jx[i1]);
    }
    // stretched body gets thinner (volume-ish)
    const base = 60;
    const thin = Math.max(0.68, Math.min(1, Math.sqrt(base / (base + pose.extra))));
    const fat = pose.nap === 'loaf' ? 1.18 : 1;
    for (let i = 0; i < n; i++) jw[i] = A.bodyW[Math.min(A.bodyW.length - 1, Math.round((i / (n - 1)) * (A.bodyW.length - 1)))] * thin * fat;
    return n;
  }

  // Advance springs at a fixed 60 Hz, independent of frame rate.
  update(pose, dt) {
    dt = Math.min(dt, 0.1);
    if (!this.tail.ready) this._stepSprings(pose); // first frame: lay ears and tail at rest
    this.acc += dt;
    if (pose.lunge > 0) this.wasLunging = true;
    else if (this.wasLunging) { this.wasLunging = false; this.squash = 0.22; }
    while (this.acc >= 1 / 60) {
      this.acc -= 1 / 60;
      this.t += 1 / 60;
      if (this.squash > 0) this.squash -= 1 / 60;
      this._stepSprings(pose);
    }
  }

  _stepSprings(pose) {
    const n = this._joints(pose);
    const h = pose.heading, c = Math.cos(h), s = Math.sin(h);
    const ang = this.angles;
    const ja = this.ja;
    const lunge = pose.lunge > 0 || pose.zoom;
    const nap = pose.nap || '';
    // Ears: hang back and outward; streaming straight back in a lunge or zoomies,
    // flopping when stunned, splayed flat when she naps belly-up.
    for (const side of [-1, 1]) {
      const ax = pose.x + c * 1.2 - s * side * 5.8, ay = pose.y + s * 1.2 + c * side * 5.8;
      let spread = pose.stunned ? 0.7 + 0.18 * Math.sin(this.t * 14) : lunge ? 0.12 : 0.3;
      if (nap) spread = nap === 'belly' ? 1.35 : 0.55;
      for (let i = 0; i < 4; i++) ang[i] = h + Math.PI - side * (spread - i * 0.05);
      (side < 0 ? this.earL : this.earR).step(ax, ay, ang, lunge ? 0.12 : 0.2, 0.86);
    }
    // Tail: plume from the rump, carried in a soft curl with a wag.
    const last = n - 1;
    const back = ja[last] + Math.PI;
    const wagSpeed = nap ? 1.3 : pose.stunned ? 4 : pose.zoom ? 17 : 11;
    const wag = Math.sin(this.t * wagSpeed) * (nap ? 0.1 : 0.38);
    const curl = nap === 'donut' ? 0.42 : 0.2; // the donut's tail wraps round her nose
    for (let i = 0; i < 5; i++) ang[i] = back + wag * (0.5 + i * 0.25) + i * curl;
    const tx = this.jx[last] + Math.cos(back) * 4.5, ty = this.jy[last] + Math.sin(back) * 4.5;
    this.tail.step(tx, ty, ang, 0.22, 0.82);
  }

  // Body outline (with fur scallops) into a Path2D.
  _bodyPath(pose, n) {
    const { jx, jy, ja, jw, ox, oy } = this;
    const boil = Math.floor(this.t * 9);
    let m = 0;
    // left side head -> rump, with a scallop point between each joint
    for (let i = 0; i < n; i++) {
      const nx = -Math.sin(ja[i]), ny = Math.cos(ja[i]);
      const w = jw[i] + hashNoise(i, boil) * 0.35;
      ox[m] = jx[i] + nx * w; oy[m] = jy[i] + ny * w; m++;
      if (i < n - 1 && i > 0) {
        const mx = (jx[i] + jx[i + 1]) / 2, my = (jy[i] + jy[i + 1]) / 2;
        const wm = (jw[i] + jw[i + 1]) / 2 + 0.45;
        ox[m] = mx + nx * wm; oy[m] = my + ny * wm; m++;
      }
    }
    // rounded rump cap
    const la = ja[n - 1], lw = jw[n - 1];
    for (let k = 1; k <= 4; k++) {
      const a = la + Math.PI / 2 + (k / 5) * Math.PI;
      ox[m] = jx[n - 1] + Math.cos(a) * lw; oy[m] = jy[n - 1] + Math.sin(a) * lw; m++;
    }
    // right side rump -> head
    for (let i = n - 1; i >= 0; i--) {
      const nx = -Math.sin(ja[i]), ny = Math.cos(ja[i]);
      const w = jw[i] + hashNoise(i + 40, boil) * 0.35;
      if (i < n - 1 && i > 0) {
        const mx = (jx[i] + jx[i + 1]) / 2, my = (jy[i] + jy[i + 1]) / 2;
        const wm = (jw[i] + jw[i + 1]) / 2 + 0.45;
        ox[m] = mx - nx * wm; oy[m] = my - ny * wm; m++;
      }
      ox[m] = jx[i] - nx * w; oy[m] = jy[i] - ny * w; m++;
    }
    const p = new Path2D();
    catmullClosed(p, ox, oy, m);
    return p;
  }

  // Open path along the back, from the neck to the rump.
  _spinePath(n) {
    const p = new Path2D();
    p.moveTo(this.jx[1], this.jy[1]);
    for (let i = 2; i < n; i++) {
      const mx = (this.jx[i - 1] + this.jx[i]) / 2, my = (this.jy[i - 1] + this.jy[i]) / 2;
      p.quadraticCurveTo(this.jx[i - 1], this.jy[i - 1], mx, my);
    }
    p.lineTo(this.jx[n - 1], this.jy[n - 1]);
    return p;
  }

  _featherPath(rope, widths, scallop, wisp = 0) {
    const m = featherShape(rope, widths, scallop, wisp, this.fx, this.fy);
    const p = new Path2D();
    catmullClosed(p, this.fx, this.fy, m);
    return p;
  }

  // Head union (skull + muzzle) in local space, as a Path2D.
  static headPath() {
    const p = new Path2D();
    p.ellipse(0, 0, A.skullRX, A.skullRY, 0, 0, Math.PI * 2);
    p.moveTo(A.muzzleX + A.muzzleRX, 0);
    p.ellipse(A.muzzleX, 0, A.muzzleRX, A.muzzleRY, 0, 0, Math.PI * 2);
    return p;
  }

  draw(ctx, pose, art, inkScale = 1) {
    const ink = A.ink * inkScale;
    const n = this._joints(pose);
    const body = this._bodyPath(pose, n);
    const tail = this._featherPath(this.tail, [1.8, 3.4, 4.4, 4.4, 3.6], 0.28, 1.4);
    const earW = [2.0, 3.4, 4.4, 4.3];
    const earL = this._featherPath(this.earL, earW, 0.16, 0.6);
    const earR = this._featherPath(this.earR, earW, 0.16, 0.6);
    const head = HEAD;
    const k = art.k;

    // pattern space: anchor the fur washes to her head so they ride along
    const pm = PAT;
    pm.a = 1 / k; pm.b = 0; pm.c = 0; pm.d = 1 / k; pm.e = pose.x * 0.5; pm.f = pose.y * 0.5;
    art.zoeCream.setTransform(pm);
    art.zoeSaddle.setTransform(pm);

    // squash and stretch for the lunge (head only; body already stretches)
    let hsx = 1, hsy = 1;
    if (pose.lunge > 0) { hsx = 1.16; hsy = 0.86; }
    else if (this.squash > 0) { const q = this.squash / 0.22; hsx = 1 - 0.12 * q; hsy = 1 + 0.12 * q; }
    let wob = 0;
    if (pose.stunned) wob = Math.sin(this.t * 22) * 0.18;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 1. hard offset paper shadow (no blur)
    ctx.save();
    ctx.translate(A.shadowDX, A.shadowDY);
    ctx.fillStyle = P.shadow;
    ctx.fill(tail);
    ctx.fill(body);
    ctx.fill(earL);
    ctx.fill(earR);
    this._headXform(ctx, pose, hsx, hsy, wob);
    ctx.fill(head);
    ctx.restore();

    // 2. tail plume: apricot root fading to a cream fringe
    ctx.fillStyle = art.zoeCream;
    ctx.fill(tail);
    ctx.save();
    ctx.clip(tail);
    ctx.strokeStyle = art.zoeSaddle;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(this.tail.x[0], this.tail.y[0]);
    ctx.lineTo(this.tail.x[1], this.tail.y[1]);
    ctx.lineTo(this.tail.x[2], this.tail.y[2]);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = ink * 0.8;
    ctx.stroke(tail);

    // 3. stubby legs on a gait cycle, behind the body (tucked away in a loaf or donut nap)
    const nap = pose.nap || '';
    if (nap === 'belly') this._pawsUp(ctx, n, art);
    else if (!nap) this._legs(ctx, pose, n, art);

    // 4. body: cream base, apricot saddle, edge darkening, ink line
    ctx.fillStyle = art.zoeCream;
    ctx.fill(body);
    ctx.save();
    ctx.clip(body);
    const spine = this._spinePath(n);
    const bw = this.jw[Math.floor(n / 2)];
    if (nap === 'belly') {
      // tummy up: pale cream with a rosy belly wash instead of the saddle
      ctx.strokeStyle = P.blush;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = bw * 0.9;
      ctx.stroke(spine);
    } else {
      ctx.strokeStyle = art.zoeSaddle;
      for (const f of [1.5, 1.25, 1.0, 0.78, 0.56]) {
        ctx.globalAlpha = 0.27;
        ctx.lineWidth = bw * f;
        ctx.stroke(spine);
      }
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(191,140,85,0.38)';
    ctx.stroke(body);
    ctx.restore();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = ink;
    ctx.stroke(body);

    // 5. head, collar, face
    ctx.save();
    this._headXform(ctx, pose, hsx, hsy, wob);
    // collar: a navy band around the neck just behind the skull, gold tag on top
    ctx.fillStyle = P.collar;
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(-8.6, 0, 2.6, 7.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = ink * 2;
    ctx.stroke(head);              // union outline: stroke wide, then fill over the inside half
    ctx.fillStyle = art.zoeCream;
    ctx.fill(head);
    ctx.save();
    ctx.clip(head);
    ctx.fillStyle = art.zoeSaddle;
    ctx.globalAlpha = nap === 'belly' ? 0.2 : 0.45; // belly-up: we see her paler chin
    ctx.beginPath(); ctx.ellipse(-1.5, 0, 8.6, 6.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = nap === 'belly' ? 0.25 : 0.7;
    ctx.beginPath(); ctx.ellipse(-2.5, 0, 6.8, 4.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.ellipse(7.5, 0, 6, 2.1, 0, 0, Math.PI * 2); ctx.fill(); // muzzle ridge
    ctx.globalAlpha = 1;
    ctx.restore();
    // gold tag on the collar
    ctx.fillStyle = P.tag;
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(-10.6, 0, 2.0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,248,220,0.8)';
    ctx.beginPath(); ctx.arc(-11.1, -0.6, 0.6, 0, Math.PI * 2); ctx.fill();
    this._face(ctx, pose);
    // saddle wash where the ears lift off the head
    ctx.fillStyle = 'rgba(191,140,85,0.42)';
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-2.2, sd * 6.4, 3.6, 2.4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();

    // 6. ears: own little cutout shadow, pale cream fill, full ink outline
    ctx.save();
    ctx.translate(1.2, 1.7);
    ctx.fillStyle = P.shadow;
    ctx.fill(earL);
    ctx.fill(earR);
    ctx.restore();
    for (const ear of [earL, earR]) {
      ctx.fillStyle = art.zoeCream;
      ctx.fill(ear);
      ctx.fillStyle = 'rgba(246,234,213,0.55)';
      ctx.fill(ear);
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = ink * 0.8;
      ctx.stroke(ear);
    }
    this._earFringe(ctx, this.earL);
    this._earFringe(ctx, this.earR);

    if (pose.stunned) this._stars(ctx, pose);
  }

  // Belly-up nap: four little legs in the air with pink paw pads, paddling in a dream.
  _pawsUp(ctx, n, art) {
    const { jx, jy, ja, jw } = this;
    const front = Math.min(2, n - 1), hind = Math.max(1, n - 3);
    ctx.lineCap = 'round';
    for (const [j, off] of [[front, 0], [hind, 1.7]]) {
      const c = Math.cos(ja[j]), s = Math.sin(ja[j]);
      for (const side of [-1, 1]) {
        const paddle = Math.sin(this.t * 3.2 + off + side) * 1.4;
        const nx = -s * side, ny = c * side;
        const bx = jx[j] + nx * (jw[j] - 2.5), by = jy[j] + ny * (jw[j] - 2.5);
        const px = bx + nx * 6 + c * (paddle + (j === front ? 2 : -2)), py = by + ny * 6 + s * (paddle + (j === front ? 2 : -2));
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 5.6;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px, py); ctx.stroke();
        ctx.strokeStyle = art.zoeCream;
        ctx.lineWidth = 3.9;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px, py); ctx.stroke();
        ctx.fillStyle = P.pawPad;
        ctx.beginPath(); ctx.arc(px, py, 1.3, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  _headXform(ctx, pose, hsx, hsy, wob) {
    ctx.translate(pose.x, pose.y);
    ctx.rotate(pose.heading + wob);
    ctx.scale(hsx, hsy);
  }

  _face(ctx, pose) {
    // soft worried brows
    ctx.strokeStyle = 'rgba(107,74,47,0.45)';
    ctx.lineWidth = 0.7;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(1.2, s * 2.4);
      ctx.quadraticCurveTo(1.6, s * 4.4, 2.6, s * 5.6);
      ctx.stroke();
    }
    if (pose.nap) { this._sleepyFace(ctx, pose); return; }
    // big soft brown eyes with an ink rim and a white highlight
    for (const s of [-1, 1]) {
      const ex = 3.6, ey = s * 3.9;
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.arc(ex, ey, 2.75, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.eye;
      ctx.beginPath(); ctx.arc(ex, ey, 2.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ex + 0.8, ey - s * 0.2 - 0.6, 0.85, 0, Math.PI * 2); ctx.fill();
    }
    // rosy liver nose: rounded triangle at the muzzle tip
    const nx = A.muzzleX + A.muzzleRX - 1.2;
    ctx.fillStyle = P.nose;
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(nx + 1.7, 0);
    ctx.quadraticCurveTo(nx + 1.3, 2.9, nx - 1.4, 2.6);
    ctx.quadraticCurveTo(nx - 2.4, 0, nx - 1.4, -2.6);
    ctx.quadraticCurveTo(nx + 1.3, -2.9, nx + 1.7, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(246,234,213,0.85)';
    ctx.beginPath(); ctx.arc(nx - 0.4, -1, 0.6, 0, Math.PI * 2); ctx.fill();
  }

  // Napping: closed eyes (soft ink curves), the same rosy nose, and a tiny
  // tongue "blep" when she's belly-up.
  _sleepyFace(ctx, pose) {
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      const ex = 3.6, ey = s * 3.9;
      ctx.beginPath();
      ctx.moveTo(ex - 1.9, ey);
      ctx.quadraticCurveTo(ex, ey + s * 1.8, ex + 1.9, ey);
      ctx.stroke();
    }
    const nx = A.muzzleX + A.muzzleRX - 1.2;
    if (pose.nap === 'belly') {
      ctx.fillStyle = '#E58C8C';
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.ellipse(nx - 2.6, 4.2, 1.5, 1.1, 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = P.nose;
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(nx + 1.7, 0);
    ctx.quadraticCurveTo(nx + 1.3, 2.9, nx - 1.4, 2.6);
    ctx.quadraticCurveTo(nx - 2.4, 0, nx - 1.4, -2.6);
    ctx.quadraticCurveTo(nx + 1.3, -2.9, nx + 1.7, 0);
    ctx.fill();
    ctx.stroke();
  }

  // wavy fringe strokes on the ears (long hair)
  _earFringe(ctx, rope) {
    ctx.strokeStyle = 'rgba(191,140,85,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 1; i < rope.n; i++) {
      const a = Math.atan2(rope.y[i] - rope.y[i - 1], rope.x[i] - rope.x[i - 1]);
      const nx = -Math.sin(a), ny = Math.cos(a);
      for (const s of [-1.2, 1.2]) {
        ctx.moveTo(rope.x[i - 1] + nx * s, rope.y[i - 1] + ny * s);
        ctx.quadraticCurveTo(rope.x[i] + nx * s * 1.6, rope.y[i] + ny * s * 1.6, rope.x[i] + nx * s * 0.6 + (rope.x[i] - rope.x[i - 1]) * 0.4, rope.y[i] + ny * s * 0.6 + (rope.y[i] - rope.y[i - 1]) * 0.4);
      }
    }
    ctx.stroke();
  }

  _legs(ctx, pose, n, art) {
    const { jx, jy, ja, jw } = this;
    const phase = pose.odo * 0.32;
    const front = Math.min(3, n - 1), hind = Math.max(1, n - 3);
    ctx.lineCap = 'round';
    for (const [j, off] of [[front, 0], [hind, Math.PI]]) {
      const c = Math.cos(ja[j]), s = Math.sin(ja[j]);
      for (const side of [-1, 1]) {
        const swing = Math.sin(phase + off + (side > 0 ? Math.PI : 0)) * 3.2;
        const nx = -s * side, ny = c * side;
        const bx = jx[j] + nx * (jw[j] - 2), by = jy[j] + ny * (jw[j] - 2);
        const px = bx + nx * 4.6 + c * swing, py = by + ny * 4.6 + s * swing;
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 5.6;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px, py); ctx.stroke();
        ctx.strokeStyle = art.zoeCream;
        ctx.lineWidth = 3.9;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px, py); ctx.stroke();
      }
    }
  }

  _stars(ctx, pose) {
    for (let i = 0; i < 3; i++) {
      const a = this.t * 5 + (i * Math.PI * 2) / 3;
      const x = pose.x + Math.cos(a) * 11, y = pose.y - 13 + Math.sin(a) * 4;
      star(ctx, x, y, 3.2, this.t * 3 + i);
    }
  }
}

function star(ctx, x, y, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = P.cheese;
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

const HEAD = ZoeRig.headPath();
const PAT = new DOMMatrix();
