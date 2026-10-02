// Zoe: a head that always runs forward and turns at a limited rate,
// plus a chain of body segments laid along the path she just ran.
// The stretch move makes the head lunge while the body lengthens,
// then the rear catches up.

import { CONFIG } from '../../config.js';
import { Trail } from './trail.js';
import { turnToward } from '../geom.js';

export class Zoe {
  constructor() {
    this.trail = new Trail(1024);
    this.segX = new Float32Array(CONFIG.SEG_COUNT);
    this.segY = new Float32Array(CONFIG.SEG_COUNT);
    this.reset();
  }

  reset() {
    this.x = CONFIG.ZOE_START_X;
    this.y = CONFIG.ZOE_START_Y;
    this.prevX = this.x;
    this.prevY = this.y;
    this.heading = -Math.PI / 2; // facing up
    this.odo = 0;
    this.lastPushOdo = 0;
    this.lungeT = 0;
    this.extra = 0;      // extra body length from stretching
    this.cooldown = 0;
    this.stunT = 0;
    this.invulnT = 0;
    this.zoomT = 0;      // zoomies time left (ball)
    this.hidden = false; // head is inside a blanket pile (set by the round)

    // Lay a straight path behind her so the body starts stretched out.
    this.trail.clear();
    const back = this.bodyLength() + 20;
    for (let d = back; d > 0; d -= CONFIG.TRAIL_SAMPLE) {
      this.trail.push(this.x, this.y + d, -d);
    }
    this.trail.push(this.x, this.y, 0);
    this._layBody();
  }

  bodyLength() {
    return CONFIG.SEG_COUNT * CONFIG.SEG_SPACING + this.extra;
  }

  isLunging() { return this.lungeT > 0; }
  isStunned() { return this.stunT > 0; }
  isZooming() { return this.zoomT > 0; }
  startZoomies() { this.zoomT = CONFIG.ZOOMIES_TIME; }
  stretchReady() { return this.cooldown <= 0; }

  tryStretch() {
    if (this.cooldown > 0 || this.stunT > 0) return false;
    this.lungeT = CONFIG.STRETCH_TIME;
    this.cooldown = CONFIG.STRETCH_COOLDOWN;
    return true;
  }

  stun(time = CONFIG.STUN_TIME) {
    this.stunT = time;
    this.invulnT = CONFIG.HIT_INVULN;
    this.lungeT = 0;
  }

  // keepOdo: how far back along the path we must remember (for the leash).
  update(dt, desiredAngle, keepDist) {
    this.prevX = this.x;
    this.prevY = this.y;
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.invulnT > 0) this.invulnT -= dt;
    if (this.zoomT > 0) this.zoomT -= dt;
    const zoom = this.zoomT > 0;

    // Rear catches up after a lunge.
    if (this.lungeT <= 0 && this.extra > 0) {
      this.extra = Math.max(0, this.extra - (CONFIG.STRETCH_DISTANCE / CONFIG.STRETCH_CATCHUP) * dt);
    }

    if (this.stunT > 0) {
      this.stunT -= dt;
      this._layBody();
      return;
    }

    if (!Number.isNaN(desiredAngle)) {
      this.heading = turnToward(this.heading, desiredAngle, CONFIG.ZOE_TURN_RATE * (zoom ? CONFIG.ZOOMIES_TURN_MULT : 1) * dt);
    }

    let speed = CONFIG.ZOE_SPEED * (zoom ? CONFIG.ZOOMIES_SPEED_MULT : 1);
    if (this.lungeT > 0) {
      const lunge = CONFIG.STRETCH_DISTANCE / CONFIG.STRETCH_TIME;
      speed += lunge;
      this.extra += lunge * dt; // body stretches as the head shoots ahead
      this.lungeT -= dt;
    }

    this.x += Math.cos(this.heading) * speed * dt;
    this.y += Math.sin(this.heading) * speed * dt;
    this._bounceOffWalls();

    this.odo += Math.hypot(this.x - this.prevX, this.y - this.prevY);
    if (this.odo - this.lastPushOdo >= CONFIG.TRAIL_SAMPLE) {
      this.trail.push(this.x, this.y, this.odo);
      this.lastPushOdo = this.odo;
    }
    this.trail.trim(this.odo - Math.max(keepDist, this.bodyLength()) - 20);
    this._layBody();
  }

  _bounceOffWalls() {
    const r = CONFIG.HEAD_RADIUS;
    const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;
    let c = Math.cos(this.heading), s = Math.sin(this.heading);
    let bounced = false;
    if (this.x < r) { this.x = r; c = Math.abs(c); bounced = true; }
    else if (this.x > W - r) { this.x = W - r; c = -Math.abs(c); bounced = true; }
    const top = CONFIG.HUD_H + r; // the score bar counts as wall
    if (this.y < top) { this.y = top; s = Math.abs(s); bounced = true; }
    else if (this.y > H - r) { this.y = H - r; s = -Math.abs(s); bounced = true; }
    if (bounced) this.heading = Math.atan2(s, c);
  }

  // Place each body segment at an even distance back along the path.
  _layBody() {
    const t = this.trail;
    const spacing = this.bodyLength() / CONFIG.SEG_COUNT;
    let ax = this.x, ay = this.y, ao = this.odo;
    let i = t.count - 1;
    for (let s = 0; s < CONFIG.SEG_COUNT; s++) {
      const target = this.odo - spacing * (s + 1);
      while (i >= 0 && t.o(i) > target) {
        ax = t.x(i); ay = t.y(i); ao = t.o(i);
        i--;
      }
      if (i < 0) {
        this.segX[s] = ax;
        this.segY[s] = ay;
        continue;
      }
      const bo = t.o(i);
      const f = ao - bo > 0 ? (ao - target) / (ao - bo) : 0;
      this.segX[s] = ax + (t.x(i) - ax) * f;
      this.segY[s] = ay + (t.y(i) - ay) * f;
    }
  }
}
