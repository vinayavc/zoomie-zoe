// Floor items: socks (1), shoes (3, rarer), cheese (1 + longer leash).
// A fixed pool; inactive slots get reused.

import { CONFIG } from '../../config.js';

const TYPES = ['sock', 'shoe', 'cheese'];

export class Items {
  constructor() {
    this.list = [];
    for (let i = 0; i < 16; i++) this.list.push({ active: false, type: 'sock', x: 0, y: 0, r: 6, points: 1, age: 0 });
    this.spawnT = 0;
  }

  reset(zoe, dogs) {
    for (const it of this.list) it.active = false;
    for (let i = 0; i < CONFIG.ITEM_START; i++) this.spawn(zoe, dogs);
    this.spawnT = CONFIG.ITEM_SPAWN_INTERVAL;
  }

  activeCount(type) {
    let n = 0;
    for (const it of this.list) if (it.active && (!type || it.type === type)) n++;
    return n;
  }

  update(dt, zoe, dogs) {
    for (const it of this.list) if (it.active) it.age += dt;
    if (this.activeCount() >= CONFIG.ITEM_CAP) return;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawn(zoe, dogs);
      this.spawnT = CONFIG.ITEM_SPAWN_INTERVAL;
    }
  }

  _pickType() {
    let total = 0;
    for (const t of TYPES) total += this._weight(t);
    let r = Math.random() * total;
    for (const t of TYPES) {
      r -= this._weight(t);
      if (r <= 0) return t;
    }
    return 'sock';
  }

  _weight(type) {
    const def = CONFIG.ITEMS[type];
    if (def.maxOnField !== undefined && this.activeCount(type) >= def.maxOnField) return 0;
    return def.weight;
  }

  spawn(zoe, dogs) {
    const slot = this.list.find((it) => !it.active);
    if (!slot) return;
    const type = this._pickType();
    const def = CONFIG.ITEMS[type];
    const e = CONFIG.ITEM_EDGE;
    for (let tries = 0; tries < 12; tries++) {
      const x = e + Math.random() * (CONFIG.ARENA_W - 2 * e);
      const y = CONFIG.HUD_H + e + Math.random() * (CONFIG.ARENA_H - CONFIG.HUD_H - 2 * e);
      if (Math.hypot(x - zoe.x, y - zoe.y) < CONFIG.ITEM_MIN_DIST_ZOE) continue;
      if (this.list.some((o) => o.active && Math.hypot(o.x - x, o.y - y) < CONFIG.ITEM_MIN_GAP)) continue;
      if (dogs.some((d) => Math.hypot(d.x - x, d.y - y) < CONFIG.DOG_RADIUS + 10)) continue;
      slot.active = true;
      slot.type = type;
      slot.x = x;
      slot.y = y;
      slot.r = def.radius;
      slot.points = def.points;
      slot.age = 0;
      return;
    }
  }
}
