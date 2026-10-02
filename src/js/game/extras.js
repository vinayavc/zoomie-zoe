// Zoe's extras (Phase 4A): her ball (zoomies), the blanket piles (hiding)
// and the bath (a sliding hazard). Plain state; round.js applies the effects.

import { CONFIG } from '../../config.js';
import { polygonContains } from '../geom.js';

const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// Blanket outlines as flat arrays for polygonContains.
const BLANKET_X = CONFIG.BLANKETS.map((ring) => Float32Array.from(ring, (p) => p[0]));
const BLANKET_Y = CONFIG.BLANKETS.map((ring) => Float32Array.from(ring, (p) => p[1]));

// Index of the blanket pile containing (x, y), or -1.
export function blanketAt(x, y) {
  for (let i = 0; i < BLANKET_X.length; i++) {
    if (polygonContains(BLANKET_X[i], BLANKET_Y[i], BLANKET_X[i].length, x, y)) return i;
  }
  return -1;
}

// ---------------------------------------------------------------- ball

export class Ball {
  constructor() { this.reset(); }

  reset() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.age = 0;
    this.nextT = CONFIG.BALL_FIRST; // seconds until the next spawn
  }

  // Returns true on the step a new ball appears.
  update(dt, zoe, bath) {
    if (this.active) {
      this.age += dt;
      if (this.age >= CONFIG.BALL_LIFETIME) this._gone();
      return false;
    }
    if (zoe.zoomT > 0) return false; // no new ball during zoomies
    this.nextT -= dt;
    return this.nextT <= 0 && this.spawn(zoe, bath);
  }

  spawn(zoe, bath) {
    const e = CONFIG.BALL_EDGE;
    for (let tries = 0; tries < 20; tries++) {
      const x = rand(e, CONFIG.ARENA_W - e);
      const y = rand(CONFIG.HUD_H + e, CONFIG.ARENA_H - e);
      if (tries < 16 && Math.hypot(x - zoe.x, y - zoe.y) < CONFIG.BALL_MIN_DIST_ZOE) continue;
      if (blanketAt(x, y) >= 0) continue;
      if (bath && bath.state !== 'off' && bath.contains(x, y, CONFIG.BALL_RADIUS + 10)) continue;
      this.active = true;
      this.x = x;
      this.y = y;
      this.age = 0;
      return true;
    }
    this.nextT = 0.5; // nowhere good right now; try again shortly
    return false;
  }

  touches(zoe) {
    const r = CONFIG.HEAD_RADIUS + CONFIG.BALL_RADIUS;
    return this.active && (zoe.x - this.x) ** 2 + (zoe.y - this.y) ** 2 < r * r;
  }

  take() { this._gone(); }

  _gone() {
    this.active = false;
    this.nextT = rand(CONFIG.BALL_GAP_MIN, CONFIG.BALL_GAP_MAX);
  }
}

// ---------------------------------------------------------------- bath

export class Bath {
  constructor() { this.reset(); }

  reset() {
    this.state = 'off'; // 'off' | 'warn' | 'slide'
    this.x = 0;
    this.y = 0;
    this.dir = 1;
    this.t = 0;
    this.nextT = CONFIG.BATH_START;
  }

  // Harmful only while sliding.
  isLive() { return this.state === 'slide'; }

  // Returns 'warn' on the step a bath appears, otherwise ''.
  update(dt, zoe) {
    this.t += dt;
    if (this.state === 'off') {
      this.nextT -= dt;
      if (this.nextT <= 0) { this.spawn(zoe); return 'warn'; }
    } else if (this.state === 'warn') {
      if (this.t >= CONFIG.BATH_WARN) { this.state = 'slide'; this.t = 0; }
    } else {
      this.x += this.dir * CONFIG.BATH_SPEED * dt;
      const out = CONFIG.BATH_RX * 1.6;
      if (this.x < -out || this.x > CONFIG.ARENA_W + out) {
        this.state = 'off';
        this.nextT = rand(CONFIG.BATH_GAP_MIN, CONFIG.BATH_GAP_MAX);
      }
    }
    return '';
  }

  // Appear at the left or right edge (mostly on screen), on a row away from Zoe.
  spawn(zoe) {
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.x = this.dir > 0 ? CONFIG.BATH_RX * 0.6 : CONFIG.ARENA_W - CONFIG.BATH_RX * 0.6;
    const top = CONFIG.HUD_H + CONFIG.BATH_RY + 16, bot = CONFIG.ARENA_H - CONFIG.BATH_RY - 16;
    let y = rand(top, bot);
    for (let tries = 0; tries < 10 && Math.abs(y - zoe.y) < CONFIG.BATH_MIN_DY_ZOE; tries++) y = rand(top, bot);
    this.y = y;
    this.state = 'warn';
    this.t = 0;
  }

  // Is a circle (x, y, r) touching the puddle's ellipse?
  contains(x, y, r) {
    const a = CONFIG.BATH_RX + r, b = CONFIG.BATH_RY + r;
    const dx = (x - this.x) / a, dy = (y - this.y) / b;
    return dx * dx + dy * dy < 1;
  }

  // Dogs avoid the bath: if a dog is inside the padded ellipse, push it out
  // to the edge and return the angle pointing away from the puddle (else NaN).
  repel(dog) {
    if (!this.isLive()) return NaN;
    const a = CONFIG.BATH_RX + CONFIG.DOG_RADIUS + CONFIG.BATH_DOG_PAD;
    const b = CONFIG.BATH_RY + CONFIG.DOG_RADIUS + CONFIG.BATH_DOG_PAD;
    const dx = dog.x - this.x, dy = dog.y - this.y;
    const e = Math.sqrt((dx / a) ** 2 + (dy / b) ** 2);
    if (e >= 1) return NaN;
    // Hard push only for the real (unpadded) overlap, so they don't jitter.
    const hard = Math.sqrt((dx / (a - CONFIG.BATH_DOG_PAD)) ** 2 + (dy / (b - CONFIG.BATH_DOG_PAD)) ** 2);
    if (hard < 1 && hard > 1e-3) { dog.x = this.x + dx / hard; dog.y = this.y + dy / hard; }
    return Math.atan2(dy || 0.01, dx);
  }
}
