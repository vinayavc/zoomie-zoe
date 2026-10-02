// Visual-only juice derived from game state changes:
// paper confetti when items are caught, and torn scraps when a dog snaps the leash.
// Reads game state each frame and remembers just enough to spot what changed.

import { P } from './palette.js';

const CONFETTI = [P.sock, P.cheese, P.paper, P.pink, P.apricot, P.sun, P.teal];
const ITEM_COLORS = { sock: [P.sock, P.paper, P.pink], shoe: [P.shoe, P.sole, P.apricot], cheese: [P.cheese, P.sun, P.paper] };

export class Fx {
  constructor() {
    this.parts = [];
    for (let i = 0; i < 90; i++) this.parts.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, t: 0, life: 1, w: 3, h: 2, color: '#fff', flip: 0 });
    this.prevCaptures = 0;
    this.prevItems = [];
    this.prevSnap = [];
  }

  reset(game) {
    for (const p of this.parts) p.on = false;
    this.prevCaptures = game.captures;
    this._snapshot(game);
  }

  _snapshot(game) {
    const list = game.items.list;
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      const s = this.prevItems[i] || (this.prevItems[i] = { active: false, x: 0, y: 0, type: 'sock' });
      s.active = it.active; s.x = it.x; s.y = it.y; s.type = it.type;
    }
  }

  _spawn(x, y, n, colors, speed, life) {
    for (let k = 0; k < n; k++) {
      const p = this.parts.find((q) => !q.on);
      if (!p) return;
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.8);
      p.on = true; p.x = x; p.y = y;
      p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - speed * 0.3;
      p.a = Math.random() * 6; p.va = (Math.random() - 0.5) * 14;
      p.t = 0; p.life = life * (0.7 + Math.random() * 0.6);
      p.w = 3.2 + Math.random() * 3; p.h = 2.2 + Math.random() * 1.8;
      p.flip = Math.random() * 6;
      p.color = colors[(Math.random() * colors.length) | 0];
    }
  }

  // Look for new events, then move the particles.
  update(game, dt) {
    if (game.scene !== 'play') { this.prevCaptures = game.captures; this._snapshot(game); }
    if (game.captures > this.prevCaptures) {
      const list = game.items.list;
      for (let i = 0; i < list.length; i++) {
        const s = this.prevItems[i], it = list[i];
        if (!s || !s.active) continue;
        if (!it.active || it.x !== s.x || it.y !== s.y) {
          this._spawn(s.x, s.y, 12, ITEM_COLORS[s.type] || CONFETTI, 110, 0.9);
        }
      }
      this._spawn(game.flashX[game.flashN - 1] || 200, game.flashY[game.flashN - 1] || 300, 6, CONFETTI, 70, 0.6);
    }
    this.prevCaptures = game.captures;
    this._snapshot(game);

    for (let i = 0; i < game.dogs.length; i++) {
      const d = game.dogs[i];
      const was = this.prevSnap[i] || 0;
      if (d.snapFxT > was + 0.3) this._spawn(d.x, d.y, 7, [P.rope, P.ropeLight, P.paper], 60, 0.5);
      this.prevSnap[i] = d.snapFxT;
    }

    if (dt <= 0) return;
    const drag = Math.exp(-3.2 * dt);
    for (const p of this.parts) {
      if (!p.on) continue;
      p.t += dt;
      if (p.t >= p.life) { p.on = false; continue; }
      p.vx *= drag; p.vy = p.vy * drag + 40 * dt; // flutter down the page
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.a += p.va * dt;
      p.flip += dt * 9;
    }
  }

  draw(ctx) {
    for (const p of this.parts) {
      if (!p.on) continue;
      const f = p.t / p.life;
      ctx.globalAlpha = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.scale(1, Math.cos(p.flip));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
