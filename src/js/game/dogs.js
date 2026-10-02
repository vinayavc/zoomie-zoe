// Other dogs: they wander, chase Zoe when she's close, and back off after a bite.

import { CONFIG } from '../../config.js';
import { turnToward } from '../geom.js';

export function makeDog(zoe) {
  const dog = { x: 0, y: 0, heading: 0, wanderAngle: 0, wanderT: 0, retreatT: 0, chasing: false, snapFxT: 0 };
  // Pick an edge spot far from Zoe.
  const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H, r = CONFIG.DOG_RADIUS;
  let bestX = r, bestY = H - r, bestD = -1;
  for (let i = 0; i < 12; i++) {
    const side = Math.floor(Math.random() * 4);
    const x = side === 0 ? r : side === 1 ? W - r : r + Math.random() * (W - 2 * r);
    const y = side === 2 ? CONFIG.HUD_H + r : side === 3 ? H - r : CONFIG.HUD_H + r + Math.random() * (H - CONFIG.HUD_H - 2 * r);
    const d = Math.hypot(x - zoe.x, y - zoe.y);
    if (d > bestD) { bestD = d; bestX = x; bestY = y; }
    if (d >= CONFIG.DOG_SPAWN_MIN_DIST) break;
  }
  dog.x = bestX;
  dog.y = bestY;
  dog.heading = Math.atan2(H / 2 - bestY, W / 2 - bestX); // walk in toward the middle
  dog.wanderAngle = dog.heading;
  return dog;
}

export function updateDog(dog, dt, zoe) {
  const dx = zoe.x - dog.x, dy = zoe.y - dog.y;
  const dist = Math.hypot(dx, dy);
  let target, speed;
  dog.chasing = false;
  if (dog.snapFxT > 0) dog.snapFxT -= dt;

  if (dog.retreatT > 0) {
    dog.retreatT -= dt;
    target = Math.atan2(-dy, -dx);
    speed = CONFIG.DOG_WANDER_SPEED;
  } else if (dist < CONFIG.DOG_CHASE_RADIUS && !zoe.isStunned()) {
    dog.chasing = true;
    target = Math.atan2(dy, dx);
    speed = CONFIG.DOG_CHASE_SPEED;
  } else {
    dog.wanderT -= dt;
    if (dog.wanderT <= 0) {
      dog.wanderAngle = dog.heading + (Math.random() - 0.5) * 2.4;
      dog.wanderT = 0.8 + Math.random() * 1.2;
    }
    target = dog.wanderAngle;
    speed = CONFIG.DOG_WANDER_SPEED;
  }

  dog.heading = turnToward(dog.heading, target, CONFIG.DOG_TURN_RATE * dt);
  dog.x += Math.cos(dog.heading) * speed * dt;
  dog.y += Math.sin(dog.heading) * speed * dt;

  // Bounce off the walls (the HUD strip counts as wall for dogs).
  const r = CONFIG.DOG_RADIUS, W = CONFIG.ARENA_W, H = CONFIG.ARENA_H, top = CONFIG.HUD_H;
  let c = Math.cos(dog.heading), s = Math.sin(dog.heading), hit = false;
  if (dog.x < r) { dog.x = r; c = Math.abs(c); hit = true; }
  else if (dog.x > W - r) { dog.x = W - r; c = -Math.abs(c); hit = true; }
  if (dog.y < top + r) { dog.y = top + r; s = Math.abs(s); hit = true; }
  else if (dog.y > H - r) { dog.y = H - r; s = -Math.abs(s); hit = true; }
  if (hit) {
    dog.heading = Math.atan2(s, c);
    dog.wanderAngle = dog.heading;
  }
}

// Does the dog overlap Zoe's head or any body segment?
export function dogTouchesZoe(dog, zoe) {
  const rh = CONFIG.DOG_RADIUS + CONFIG.HEAD_RADIUS;
  let dx = dog.x - zoe.x, dy = dog.y - zoe.y;
  if (dx * dx + dy * dy < rh * rh) return true;
  const rs = CONFIG.DOG_RADIUS + CONFIG.SEG_RADIUS;
  for (let i = 0; i < CONFIG.SEG_COUNT; i++) {
    dx = dog.x - zoe.segX[i];
    dy = dog.y - zoe.segY[i];
    if (dx * dx + dy * dy < rs * rs) return true;
  }
  return false;
}
