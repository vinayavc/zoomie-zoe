// One round of Leash Lasso: scenes, rules, scoring, and the minimum juice
// (hit-stop, loop flash, "+N" popups, rising blip).

import { CONFIG } from '../../config.js';
import { polygonContains } from '../geom.js';
import { sfx } from '../audio.js';
import { getBest, setBest } from '../storage.js';
import { Zoe } from './zoe.js';
import { Leash } from './leash.js';
import { Items } from './items.js';
import { makeDog, updateDog, dogTouchesZoe } from './dogs.js';

export class Game {
  constructor(input) {
    this.input = input;
    this.zoe = new Zoe();
    this.leash = new Leash(this.zoe.trail.cap);
    this.items = new Items();
    this.dogs = [];
    this.scene = 'title'; // 'title' | 'play' | 'over'
    this.paused = false;
    this.best = 0;
    this.newBest = false;
    this.overT = 0;
    this.downSinceOver = false;

    this.popups = [];
    for (let i = 0; i < 24; i++) this.popups.push({ active: false, x: 0, y: 0, t: 0, text: '', big: false });
    this.flashX = new Float32Array(this.zoe.trail.cap + 2);
    this.flashY = new Float32Array(this.zoe.trail.cap + 2);
    this.flashN = 0;
    this.flashT = 0;

    this._resetStats();
    getBest().then((b) => { this.best = Math.max(this.best, b); });
  }

  _resetStats() {
    this.score = 0;
    this.timeLeft = CONFIG.ROUND_SECONDS;
    this.elapsed = 0;
    this.chain = 0;
    this.lastCaptureT = -999;
    this.cheeseT = 0;
    this.hitStop = 0;
    this.captures = 0; // loops that caught something
    this.closes = 0;   // all loop closes, including empty ones
    this._lastEmptyClose = -999;
    this.flashT = 0;
    this.cinchPreview = false;
    for (const p of this.popups) p.active = false;
  }

  start() {
    this._resetStats();
    this.zoe.reset();
    this.leash.reset();
    this.dogs.length = 0;
    for (let i = 0; i < CONFIG.DOG_START; i++) this.dogs.push(makeDog(this.zoe));
    this.items.reset(this.zoe, this.dogs);
    this.input.clear();
    this.input.enabled = true;
    this.newBest = false;
    this.paused = false;
    this.scene = 'play';
    sfx.yip();
  }

  canRestart() {
    return this.scene === 'over' && this.overT >= CONFIG.RESTART_GUARD;
  }

  pause() {
    if (this.scene === 'play') this.paused = true;
    this.input.clear();
  }

  update(dt) {
    if (this.scene === 'over') this.overT += dt;
    if (this.scene !== 'play' || this.paused) return;

    // Freeze-frame: everything stops for a moment after a capture.
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return;
    }

    this.elapsed += dt;
    this.timeLeft -= dt;
    sfx.countdown(this.timeLeft, dt);
    if (this.cheeseT > 0) this.cheeseT -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    for (const p of this.popups) if (p.active && (p.t += dt) >= CONFIG.POPUP_TIME) p.active = false;

    const zoe = this.zoe;
    const leash = this.leash;
    leash.length = CONFIG.LEASH_LENGTH * (this.cheeseT > 0 ? CONFIG.CHEESE_LEASH_MULT : 1);

    // Stretch-cinch: lunge, and the leash snaps shut from its end to her collar.
    if (this.input.consumeAction() && zoe.tryStretch()) {
      sfx.cinch();
      if (leash.buildCinch(zoe)) this._closeLoop();
    }
    zoe.update(dt, this.input.steerAngle(zoe.x, zoe.y, zoe.heading), CONFIG.LEASH_LENGTH * CONFIG.CHEESE_LEASH_MULT);

    if (!zoe.isStunned() && leash.detectLoop(zoe)) this._closeLoop();

    this._updateDogs(dt);
    this.items.update(dt, zoe, this.dogs);
    this._updateCinchPreview();

    if (this.timeLeft <= 0) this._endRound();
  }

  _closeLoop() {
    const L = this.leash;
    let base = 0, n = 0, sx = 0, sy = 0, gotCheese = false;
    for (const it of this.items.list) {
      if (!it.active || !polygonContains(L.polyX, L.polyY, L.polyN, it.x, it.y)) continue;
      it.active = false;
      base += it.points;
      n++;
      sx += it.x;
      sy += it.y;
      if (it.type === 'cheese') gotCheese = true;
    }
    if (n === 0) {
      // An empty loop does nothing; the leash stays as it is.
      if (this.elapsed - this._lastEmptyClose > 0.3) this.closes++;
      this._lastEmptyClose = this.elapsed;
      return;
    }
    this.closes++;
    this.captures++;
    this._lastEmptyClose = this.elapsed; // don't count the next few frames as extra closes
    if (gotCheese) this.cheeseT = CONFIG.CHEESE_TIME;
    if (gotCheese) sfx.squeak();

    this.chain = this.elapsed - this.lastCaptureT <= CONFIG.CHAIN_WINDOW ? this.chain + 1 : 1;
    this.lastCaptureT = this.elapsed;
    const mult = (1 + CONFIG.LOOP_SIZE_BONUS * (n - 1)) * (1 + CONFIG.CHAIN_BONUS * (this.chain - 1));
    const pts = Math.round(base * mult);
    this.score += pts;

    // Juice
    this.hitStop = CONFIG.HITSTOP;
    this.flashN = L.polyN;
    this.flashX.set(L.polyX.subarray(0, L.polyN));
    this.flashY.set(L.polyY.subarray(0, L.polyN));
    this.flashT = CONFIG.FLASH_TIME;
    const cx = sx / n, cy = sy / n;
    this._popup(cx, cy, '+' + pts, true);
    if (this.chain > 1) this._popup(cx, cy + 22, 'chain x' + this.chain, false);
    else if (n > 1) this._popup(cx, cy + 22, n + ' in one loop', false);
    sfx.caught(this.chain, n);
  }

  // While the stretch is ready, mark the items a press would catch.
  _updateCinchPreview() {
    const zoe = this.zoe, L = this.leash;
    this.cinchPreview = zoe.stretchReady() && !zoe.isStunned();
    const ok = this.cinchPreview && L.buildCinch(zoe);
    this.cinchOk = ok;
    this.cinchTipX = L.polyX[0];
    this.cinchTipY = L.polyY[0];
    for (const it of this.items.list) {
      it.inCinch = ok && it.active && polygonContains(L.polyX, L.polyY, L.polyN, it.x, it.y);
    }
  }

  _updateDogs(dt) {
    const zoe = this.zoe;
    const want = Math.min(CONFIG.DOG_MAX, CONFIG.DOG_START + Math.floor(this.elapsed / CONFIG.DOG_ADD_EVERY));
    while (this.dogs.length < want) this.dogs.push(makeDog(zoe));

    for (const dog of this.dogs) {
      updateDog(dog, dt, zoe);

      if (zoe.invulnT <= 0 && dogTouchesZoe(dog, zoe)) {
        zoe.stun();
        dog.retreatT = CONFIG.DOG_RETREAT_TIME;
        this.chain = 0; // combo reset
        this.lastCaptureT = -999;
        this._popup(zoe.x, zoe.y - 16, 'ouch!', false);
        sfx.boof();
      }

      if (this.leash.snapIfTouched(zoe, dog.x, dog.y, CONFIG.DOG_RADIUS) && dog.snapFxT <= 0) {
        dog.snapFxT = 0.6;
        this._popup(dog.x, dog.y - 18, 'snap!', false);
        sfx.twang();
      }
    }
  }

  _endRound() {
    this.timeLeft = 0;
    this.scene = 'over';
    this.overT = 0;
    this.downSinceOver = false;
    this.input.enabled = false;
    this.input.clear();
    sfx.sigh();
    if (this.score > this.best) {
      this.best = this.score;
      this.newBest = true;
      setBest(this.best); // save right away: a popup can close at any moment
    }
  }

  _popup(x, y, text, big) {
    const p = this.popups.find((q) => !q.active) || this.popups[0];
    p.active = true;
    p.x = x;
    p.y = y;
    p.t = 0;
    p.text = text;
    p.big = big;
  }
}
