// The leash is the stretch of Zoe's path from her head back `length` px,
// cut short wherever a dog last snapped it (`startOdo`).
// It closes a loop when her head crosses (or comes within LEASH_TOLERANCE of)
// any part of the leash except the nearest LEASH_IGNORE px.

import { CONFIG } from '../../config.js';
import { segIntersect, distToSeg2 } from '../geom.js';

const tmp = { x: 0, y: 0 };

export class Leash {
  constructor(capacity) {
    // The polygon of the last closed loop.
    this.polyX = new Float32Array(capacity + 2);
    this.polyY = new Float32Array(capacity + 2);
    this.polyN = 0;
    this.cinchArea = 0;
    this.reset();
  }

  reset() {
    this.startOdo = 0; // leash pays out from her collar at the start
    this.length = CONFIG.LEASH_LENGTH;
  }

  // Odometer value where the live leash ends (its far tip).
  tipOdo(zoe) {
    return Math.max(this.startOdo, zoe.odo - this.length);
  }

  liveLength(zoe) {
    return zoe.odo - this.tipOdo(zoe);
  }

  // Did the head just close a loop? If so, fills polyX/polyY/polyN and returns true.
  detectLoop(zoe) {
    const t = zoe.trail;
    const newestAllowed = zoe.odo - CONFIG.LEASH_IGNORE;
    const tip = this.tipOdo(zoe);
    const tol2 = CONFIG.LEASH_TOLERANCE * CONFIG.LEASH_TOLERANCE;

    // Walk leash segments from newest to oldest; the first hit makes the tightest loop.
    for (let i = t.count - 1; i >= 1; i--) {
      if (t.o(i) > newestAllowed) continue;
      if (t.o(i - 1) < tip) break;
      const ax = t.x(i - 1), ay = t.y(i - 1), bx = t.x(i), by = t.y(i);
      let hit = segIntersect(zoe.prevX, zoe.prevY, zoe.x, zoe.y, ax, ay, bx, by, tmp);
      if (!hit) hit = distToSeg2(zoe.x, zoe.y, ax, ay, bx, by, tmp) <= tol2;
      if (!hit) continue;

      // Polygon: crossing point -> path points newer than it -> head.
      let n = 0;
      this.polyX[n] = tmp.x; this.polyY[n] = tmp.y; n++;
      for (let k = i; k < t.count; k++) {
        this.polyX[n] = t.x(k); this.polyY[n] = t.y(k); n++;
      }
      this.polyX[n] = zoe.x; this.polyY[n] = zoe.y; n++;
      this.polyN = n;
      return true;
    }
    return false;
  }

  // Stretch-cinch: close the leash with a straight line from its far end to Zoe.
  // Fills polyX/polyY/polyN; returns false if the loop is smaller than CINCH_MIN_AREA.
  buildCinch(zoe) {
    const t = zoe.trail;
    const tip = this.tipOdo(zoe);
    // Oldest trail point still on the leash.
    let first = t.count - 1;
    while (first > 0 && t.o(first - 1) >= tip) first--;
    let n = 0;
    // Exact tip point, interpolated between the point just beyond it and `first`.
    if (first > 0 && t.o(first) > tip) {
      const oo = t.o(first - 1), no = t.o(first);
      const f = (no - tip) / (no - oo);
      this.polyX[n] = t.x(first) + (t.x(first - 1) - t.x(first)) * f;
      this.polyY[n] = t.y(first) + (t.y(first - 1) - t.y(first)) * f;
      n++;
    }
    for (let k = first; k < t.count; k++) {
      this.polyX[n] = t.x(k); this.polyY[n] = t.y(k); n++;
    }
    this.polyX[n] = zoe.x; this.polyY[n] = zoe.y; n++;
    this.polyN = n;
    if (n < 3) return false;
    // Shoelace area of the closed shape.
    let a = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) a += this.polyX[j] * this.polyY[i] - this.polyX[i] * this.polyY[j];
    this.cinchArea = Math.abs(a) / 2;
    return this.cinchArea >= CONFIG.CINCH_MIN_AREA;
  }

  // Does a circle (a dog) touch the leash behind Zoe's body?
  // If so, the leash is cut there and everything beyond is lost. Returns true on a cut.
  snapIfTouched(zoe, cx, cy, radius) {
    const t = zoe.trail;
    const behindBody = zoe.odo - zoe.bodyLength() - CONFIG.SEG_RADIUS * 2;
    const tip = this.tipOdo(zoe);
    const r = radius + CONFIG.DOG_SNAP_PAD;
    const r2 = r * r;
    for (let i = t.count - 1; i >= 1; i--) {
      if (t.o(i) > behindBody) continue;
      if (t.o(i - 1) < tip) break;
      if (distToSeg2(cx, cy, t.x(i - 1), t.y(i - 1), t.x(i), t.y(i), tmp) <= r2) {
        this.startOdo = t.o(i);
        return true;
      }
    }
    return false;
  }
}
