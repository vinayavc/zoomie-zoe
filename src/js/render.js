// Watercolor + paper-cutout drawing. Everything is drawn in arena coordinates
// (400 x 600); the view scales it to the screen.
// Slow painting is baked once: shared art (paper, cards, buttons, chips, fur)
// in art/bake.js, and each theme's art (floor, items, critters ...) by its
// module in themes/, the first time that theme is shown. Each frame only blits
// those and draws Zoe, the leash and juice.
// No ctx.filter or shadowBlur here: shadows are hard offset copies.

import { CONFIG } from '../config.js';
import { P, HAND } from './art/palette.js';
import { bakeShared, bakeTheme, bakeButton } from './art/bake.js';
import { CARDS, CHIP_ROW } from './layout.js';
import { themeState, getTheme } from './themes/index.js';
import { isMuted } from './audio.js';
import { ZoeRig } from './art/zoe-art.js';
import { Fx } from './art/fx.js';
import { motion } from './platform.js';

const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;
const MONO = 'ui-monospace, Menlo, monospace';

let shared = null;          // art every theme shares
const themeArt = {};        // theme id -> shared + that theme's art (baked on first use)
let art = null;             // the art for the theme on screen now
let pendingW = 0, pendingSince = 0;
let lastNow = 0;
let lastScene = '';
let clock = 0;
const rig = new ZoeRig();
const titleRig = new ZoeRig();
const rotRig = new ZoeRig();
const napRig = new ZoeRig();
const howRigs = [new ZoeRig(), new ZoeRig(), new ZoeRig()];
const fx = new Fx();
const pose = { x: 0, y: 0, heading: 0, segX: null, segY: null, n: CONFIG.SEG_COUNT, odo: 0, extra: 0, lunge: 0, stunned: false, zoom: false, nap: '' };
let tuckA = 0; // 0..1: how far the blanket flap is pulled over her head
const titlePose = { x: 0, y: 0, heading: 0, segX: new Float32Array(CONFIG.SEG_COUNT), segY: new Float32Array(CONFIG.SEG_COUNT), n: CONFIG.SEG_COUNT, odo: 0, extra: 0, lunge: 0, stunned: false };
const leashX = new Float32Array(1100), leashY = new Float32Array(1100);

// Bake on first use; re-bake once the canvas size has been stable for 200 ms.
// A re-bake drops every cached theme; only the one on screen is baked again.
function ensureArt(ctx, now) {
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
  if (!shared) {
    bake(ctx);
  } else if (shared.pxW !== cw || shared.pxH !== ch) {
    if (pendingW !== cw * 10000 + ch) { pendingW = cw * 10000 + ch; pendingSince = now; }
    else if (now - pendingSince > 200) bake(ctx);
  }
  art = artFor(ctx, themeState.picked);
}

function bake(ctx) {
  shared = bakeShared(ctx, ctx.canvas.width / W);
  for (const id in themeArt) delete themeArt[id];
}

// A theme's art, baked the first time it's needed and cached after that.
function artFor(ctx, id) {
  if (!themeArt[id]) {
    themeArt[id] = bakeTheme(getTheme(id), shared);
    prewarm(ctx, themeArt[id]);
  }
  return themeArt[id];
}

// Bake times, for checking from the console: doxie.art (see main.js).
export function artInfo() {
  if (!shared) return null;
  return {
    bakeMs: Math.round(shared.bakeMs), bakes: shared.bakeCount, k: shared.k,
    themes: Object.fromEntries(Object.entries(themeArt).map(([t, a]) => [t, Math.round(a.themeBakeMs)])),
  };
}

// Draw every freshly baked sprite once, tiny, onto the game canvas, so the GPU
// upload happens now (while a menu card is up) and not the first time the
// sprite shows up in play (the first zoomies ball used to cost one 17-22 ms
// frame). This runs just before the floor is blitted over the whole canvas,
// so none of it is ever seen.
function prewarm(ctx, a) {
  const layers = [a.bg, a.stickers.sock, a.stickers.shoe, a.stickers.cheese, ...a.dogs,
    a.ball, a.bath, a.bubble, a.tuck, a.glow];
  const cos = a.costume;
  if (cos && typeof cos === 'object') for (const v of Object.values(cos)) if (v && v.c) layers.push(v);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const L of layers) if (L && L.c) ctx.drawImage(L.c, 0, 0, 2, 2);
  ctx.restore();
}

export function render(ctx, view, game, input, debug, menu) {
  const now = performance.now();
  const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0;
  lastNow = now;
  clock += dt;
  ensureArt(ctx, now);

  if (game.scene === 'play' && lastScene !== 'play') { rig.reset(); fx.reset(game); tuckA = 0; }
  if (game.scene === 'over' && lastScene !== 'over') { startNap(game); menu.overCardY = nap.cardY; }
  lastScene = game.scene;

  // background (baked: bedspread, sun patch, blankets, HUD paper strip)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (art.pxW === ctx.canvas.width && art.pxH === ctx.canvas.height) ctx.drawImage(art.bg.c, 0, 0);
  else { ctx.setTransform(view.k, 0, 0, view.k, 0, 0); ctx.drawImage(art.bg.c, 0, 0, W, H); }
  ctx.setTransform(view.k, 0, 0, view.k, 0, 0);

  const frozen = game.paused || game.scene !== 'play';
  fx.update(game, game.paused ? 0 : dt);

  if (game.scene !== 'title') {
    drawBath(ctx, game);
    drawFlash(ctx, game);
    // at game over the leash fades away while she flops into her nap
    const leashA = game.scene === 'over' ? 1 - game.overT / CONFIG.NAP_FLOP_TIME : 1;
    if (leashA > 0) { ctx.globalAlpha = leashA; drawLeash(ctx, game); ctx.globalAlpha = 1; }
    if (game.scene === 'play') drawCinchPreview(ctx, game);
    drawItems(ctx, game);
    drawBall(ctx, game, frozen || game.hitStop > 0);
    drawDogs(ctx, game, frozen || game.hitStop > 0);
    if (game.scene !== 'over') {
      drawSpeedLines(ctx, game);
      drawZoe(ctx, game, frozen || game.hitStop > 0 ? 0 : dt);
      drawTuck(ctx, game, game.paused ? 0 : dt);
    }
    fx.draw(ctx);
    if (game.scene !== 'over') drawPopups(ctx, game);
  }
  drawHud(ctx, game, menu);
  if (game.scene === 'play' && !game.paused) drawTouchControls(ctx, input, game);

  const screen = menu.screen();
  if (screen === 'howto' || (screen === 'rotate' && menu.howto)) drawHowto(ctx, menu, dt);
  else if (game.scene === 'title') drawTitle(ctx, dt, menu);
  else if (game.scene === 'over') drawGameOver(ctx, game, dt, menu);
  else if (game.paused) drawPause(ctx, menu);

  if (screen === 'rotate') drawRotate(ctx, dt);

  if (debug.on && game.scene !== 'title') drawDebug(ctx, game, debug);

}

// ---------- juice: the caught loop glows like a fresh wash of sunlight ----------
function drawFlash(ctx, game) {
  if (game.flashT <= 0 || game.flashN < 3) return;
  const f = Math.max(0, game.flashT / CONFIG.FLASH_TIME);
  ctx.beginPath();
  ctx.moveTo(game.flashX[0], game.flashY[0]);
  for (let i = 1; i < game.flashN; i++) ctx.lineTo(game.flashX[i], game.flashY[i]);
  ctx.closePath();
  ctx.globalAlpha = f * 0.7;
  ctx.fillStyle = P.sun;
  ctx.fill('nonzero');
  ctx.globalAlpha = f;
  ctx.strokeStyle = P.thread;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

// ---------- leash: a soft rope with a paper shadow ----------
function leashPoints(game) {
  const zoe = game.zoe, t = zoe.trail;
  const tip = game.leash.tipOdo(zoe);
  let n = 0;
  leashX[n] = zoe.x; leashY[n] = zoe.y; n++;
  for (let i = t.count - 1; i >= 0 && n < leashX.length; i--) {
    const o = t.o(i);
    if (o < tip) {
      if (i + 1 < t.count) {
        const no = t.o(i + 1);
        const f = no - o > 0 ? (no - tip) / (no - o) : 0;
        leashX[n] = t.x(i + 1) + (t.x(i) - t.x(i + 1)) * f;
        leashY[n] = t.y(i + 1) + (t.y(i) - t.y(i + 1)) * f;
        n++;
      }
      break;
    }
    leashX[n] = t.x(i); leashY[n] = t.y(i); n++;
  }
  return n;
}

function strokeLeash(ctx, n, dx, dy) {
  ctx.beginPath();
  ctx.moveTo(leashX[0] + dx, leashY[0] + dy);
  for (let i = 1; i < n; i++) ctx.lineTo(leashX[i] + dx, leashY[i] + dy);
  ctx.stroke();
}

function drawLeash(ctx, game) {
  const n = leashPoints(game);
  const cheese = game.cheeseT > 0;
  const wet = game.wetT > 0;
  const ex = leashX[n - 1], ey = leashY[n - 1];
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // paper shadow
  ctx.strokeStyle = P.shadowSoft;
  ctx.lineWidth = cheese ? 3.6 : 3;
  strokeLeash(ctx, n, 1.6, 2.4);
  ctx.beginPath(); ctx.arc(ex + 1.6, ey + 2.4, 4.2, 0, Math.PI * 2); ctx.stroke();
  // rope body + twisted highlight
  ctx.strokeStyle = wet ? P.wetRope : cheese ? P.ropeCheese : P.rope;
  ctx.lineWidth = cheese ? 3.6 : 2.8;
  strokeLeash(ctx, n, 0, 0);
  ctx.beginPath(); ctx.arc(ex, ey, 4.2, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = wet ? P.wetRopeLight : cheese ? P.ropeCheeseLight : P.ropeLight;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3.2]);
  strokeLeash(ctx, n, -0.4, -0.4);
  ctx.setLineDash([]);
  if (wet) {
    // soggy: drips falling off the rope
    ctx.fillStyle = P.waterDeep;
    for (let i = 6; i < n; i += 9) {
      const f = (clock * 1.6 + i * 0.37) % 1;
      ctx.globalAlpha = 0.85 * (1 - f);
      ctx.beginPath(); ctx.ellipse(leashX[i], leashY[i] + 2 + f * 6, 1.1, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// Stitched dotted line from the leash end to Zoe; would-catch items glow.
function drawCinchPreview(ctx, game) {
  if (!game.cinchPreview) return;
  const z = game.zoe;
  ctx.lineCap = 'round';
  ctx.globalAlpha = Math.min(1, CONFIG.CINCH_PREVIEW_ALPHA + 0.35);
  ctx.setLineDash([3.4, 3.4]);
  ctx.strokeStyle = P.shadowSoft;
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(game.cinchTipX + 0.8, game.cinchTipY + 1.2); ctx.lineTo(z.x + 0.8, z.y + 1.2); ctx.stroke();
  ctx.strokeStyle = P.thread;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(game.cinchTipX, game.cinchTipY); ctx.lineTo(z.x, z.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawItemGlows(ctx, game) {
  if (!game.cinchPreview || !game.cinchOk) return;
  const g = art.glow;
  const pulse = 0.75 + 0.25 * Math.sin(clock * 6);
  for (const it of game.items.list) {
    if (!it.active || !it.inCinch) continue;
    const s = (it.r * 1.4 + CONFIG.CINCH_HIGHLIGHT_PAD) * 2.6 * (0.92 + 0.08 * pulse);
    ctx.globalAlpha = pulse;
    ctx.drawImage(g.c, it.x - s / 2, it.y - s / 2, s, s);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = P.thread;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2.5, 2.5]);
    ctx.beginPath();
    ctx.arc(it.x, it.y, it.r * 1.4 + CONFIG.CINCH_HIGHLIGHT_PAD + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = 1;
}

// ---------- items: torn-paper stickers ----------
function drawItems(ctx, game) {
  drawItemGlows(ctx, game);
  const list = game.items.list;
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    if (!it.active) continue;
    const sp = art.stickers[it.type];
    // pop-in with a little overshoot
    const a = Math.min(1, it.age / 0.22) - 1;
    const sc = 1 + 2.7 * a * a * a + 1.7 * a * a; // ease-out-back
    const rot = ((i * 47) % 50 - 25) * 0.012;
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    ctx.drawImage(sp.c, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
    ctx.restore();
  }
}

// ---------- critters (the Bedroom's other dogs): paper cutouts that waddle ----------
// A theme's critterMotion changes only how they look moving: 'waddle' (rock side
// to side), 'hop' (bounce, with a floor shadow) or 'float' (bob, with a floor
// shadow). Position, hitbox and AI are the same in every theme.
function drawDogs(ctx, game, frozen) {
  const r = CONFIG.DOG_RADIUS;
  const dogs = game.dogs;
  const style = art.theme.critterMotion;
  for (let i = 0; i < dogs.length; i++) {
    const d = dogs[i];
    const sp = art.dogs[i % 2];
    let wob = frozen ? 0 : Math.sin(clock * 13 + i * 1.7) * 0.07;
    let lift = 0, sx = 1, sy = 1;
    if (style === 'hop') {
      const ph = (clock * CONFIG.CRITTER_HOP_HZ + i * 0.37) % 1;
      wob = 0;
      if (!frozen) {
        lift = Math.sin(ph * Math.PI) * CONFIG.CRITTER_HOP_H;
        if (ph < 0.1 || ph > 0.92) { sx = 0.9; sy = 1.1; }   // squash on landing
        else { sx = 1.08; sy = 0.94; }                        // stretch in the air
      }
    } else if (style === 'float') {
      wob = frozen ? 0 : Math.sin(clock * 2 + i) * 0.12;
      lift = 5 + (frozen ? 0 : Math.sin(clock * 2.6 + i * 1.3) * 2.5);
    }
    if (lift > 0 || style !== 'waddle') {
      const sh = 1 - lift / 30;
      ctx.fillStyle = P.shadow;
      ctx.beginPath(); ctx.ellipse(d.x + 1.6, d.y + 2.6, r * 1.15 * sh, r * 0.85 * sh, d.heading, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save();
    ctx.translate(d.x, d.y - lift);
    ctx.rotate(d.heading + wob);
    if (sx !== 1) ctx.scale(sx, sy);
    ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h);
    ctx.restore();
    if (game.scene !== 'play') continue; // no "!"/"?" tags while she naps
    if (d.chasing) tag(ctx, d.x, d.y - lift - r - 9 + Math.sin(clock * 10) * 1.2, '!', P.rope);
    else if (d.confused) tag(ctx, d.x + Math.sin(clock * 3 + i) * 1.5, d.y - lift - r - 9, '?', P.teal);
  }
}

// A little paper tag with one bold character ("!" chasing, "?" lost her).
function tag(ctx, x, y, ch, color) {
  ctx.fillStyle = P.shadowSoft;
  ctx.beginPath(); ctx.ellipse(x + 1, y + 1.4, 5.4, 6.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.paper;
  ctx.beginPath(); ctx.ellipse(x, y, 5.4, 6.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 11px ' + HAND;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, x, y + 0.5);
  ctx.textBaseline = 'alphabetic';
}

// ---------- the ball: a bouncing paper ball with a sunny glow ----------
function drawBall(ctx, game, frozen) {
  const b = game.ball;
  if (!b.active) return;
  const left = CONFIG.BALL_LIFETIME - b.age;
  if (left < CONFIG.BALL_BLINK && Math.floor(left * 8) % 2 === 0) return; // about to roll away
  const a = Math.min(1, b.age / 0.25) - 1;
  const pop = 1 + 2.7 * a * a * a + 1.7 * a * a;
  const hop = frozen ? 0 : Math.abs(Math.sin(clock * 5.5)) * 4.5;
  const g = art.glow;
  const gs = 34 * (0.9 + 0.1 * Math.sin(clock * 6));
  ctx.globalAlpha = 0.7;
  ctx.drawImage(g.c, b.x - gs / 2, b.y - gs / 2, gs, gs);
  ctx.globalAlpha = 1;
  // hard shadow stays on the floor and shrinks as the ball rises
  const sh = 1 - hop / 12;
  ctx.fillStyle = P.shadow;
  ctx.beginPath(); ctx.ellipse(b.x + 1.6, b.y + 2.6, CONFIG.BALL_RADIUS * sh, CONFIG.BALL_RADIUS * 0.75 * sh, 0, 0, Math.PI * 2); ctx.fill();
  const sp = art.ball;
  ctx.save();
  ctx.translate(b.x, b.y - hop);
  ctx.rotate(Math.sin(clock * 2) * 0.5);
  ctx.scale(pop, pop);
  ctx.drawImage(sp.c, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
  ctx.restore();
}

// ---------- the bath: a soapy puddle that wobbles a warning, then slides ----------
function drawBath(ctx, game) {
  const bath = game.bath;
  if (bath.state === 'off') return;
  const warn = bath.state === 'warn';
  const sp = art.bath;
  ctx.save();
  ctx.translate(bath.x, bath.y);
  if (warn) {
    ctx.globalAlpha = 0.45 + 0.2 * Math.sin(clock * 12);
    ctx.rotate(Math.sin(clock * 15) * 0.07);
    const sc = 1 + 0.05 * Math.sin(clock * 10);
    ctx.scale(sc, 1 / sc);
  } else {
    ctx.rotate(Math.sin(clock * 3) * 0.025);
  }
  ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h);
  ctx.restore();
  ctx.globalAlpha = 1;
  // bubbles float up off the suds
  const bb = art.bubble;
  for (let i = 0; i < 5; i++) {
    const ph = (clock * 0.55 + i / 5) % 1;
    const size = (5 + (i % 3) * 2.2) * (0.7 + ph * 0.5);
    const x = bath.x + Math.sin(i * 2.3 + clock * 1.4) * CONFIG.BATH_RX * 0.55;
    const y = bath.y - CONFIG.BATH_RY * 0.2 - ph * 30;
    ctx.globalAlpha = (warn ? 0.6 : 1) * (1 - ph);
    ctx.drawImage(bb.c, x - size / 2, y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;
  if (warn) tag(ctx, bath.x, bath.y - CONFIG.BATH_RY - 12 + Math.sin(clock * 10) * 1.2, '!', P.waterInk);
}

// ---------- zoomies: ink speed lines streaming off her sides ----------
function drawSpeedLines(ctx, game) {
  const z = game.zoe;
  if (z.zoomT <= 0) return;
  const fade = Math.min(1, z.zoomT / 0.5);
  const c = Math.cos(z.heading), s = Math.sin(z.heading);
  ctx.lineCap = 'round';
  for (let k = -2; k <= 2; k++) {
    if (k === 0) continue;
    const flick = (clock * 6 + k * 0.29) % 1;
    const side = k * 6 + Math.sign(k) * (5 + flick * 2);   // just outside her body and ears
    const b0 = 4 + Math.abs(k) * 9 + flick * 12, len = 14 + (1 - flick) * 12;
    const x0 = z.x - c * b0 - s * side, y0 = z.y - s * b0 + c * side;
    const x1 = x0 - c * len, y1 = y0 - s * len;
    ctx.globalAlpha = fade * (1 - flick * 0.7);
    ctx.strokeStyle = P.paper;
    ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ---------- hiding: a sherpa flap pulled over her head (eyes peek out) ----------
function drawTuck(ctx, game, dt) {
  const z = game.zoe;
  tuckA += ((z.hidden ? 1 : 0) - tuckA) * Math.min(1, dt * 12);
  if (tuckA < 0.02) return;
  const sp = art.tuck;
  const c = Math.cos(z.heading), s = Math.sin(z.heading);
  ctx.save();
  ctx.globalAlpha = Math.min(1, tuckA * 1.3);
  ctx.translate(z.x - c * 8, z.y - s * 8);
  ctx.rotate(z.heading);
  const sc = 0.8 + 0.45 * tuckA;  // covers her head and front half; eyes and nose peek out
  ctx.scale(sc, sc);
  ctx.drawImage(sp.c, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---------- Zoe ----------
function drawZoe(ctx, game, dt) {
  const z = game.zoe;
  pose.x = z.x; pose.y = z.y; pose.heading = z.heading;
  pose.segX = z.segX; pose.segY = z.segY;
  pose.odo = z.odo; pose.extra = z.extra;
  pose.lunge = z.isLunging() ? 1 : 0;
  pose.stunned = z.isStunned();
  pose.zoom = z.zoomT > 0;
  rig.update(pose, dt);
  // gentle blink while she can't be hit again
  if (z.invulnT > 0 && !pose.stunned && Math.floor(z.invulnT * 10) % 2 === 0) ctx.globalAlpha = 0.55;
  rig.draw(ctx, pose, art);
  ctx.globalAlpha = 1;
}

// ---------- text ----------
function inkText(ctx, text, x, y, size, color, outline = P.paper, weight = 'bold') {
  ctx.font = weight + ' ' + size + 'px ' + HAND;
  ctx.lineJoin = 'round';
  if (outline) {
    ctx.lineWidth = Math.max(2.5, size * 0.2);
    ctx.strokeStyle = outline;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawPopups(ctx, game) {
  ctx.textAlign = 'center';
  for (const p of game.popups) {
    if (!p.active) continue;
    const f = p.t / CONFIG.POPUP_TIME;
    ctx.globalAlpha = 1 - f * f;
    const y = p.y - CONFIG.POPUP_RISE * (1 - (1 - f) * (1 - f));
    const pop = p.big ? 1 + 0.35 * Math.max(0, 1 - f * 6) : 1;
    inkText(ctx, p.text, p.x, y, Math.round((p.big ? 24 : 13) * pop), p.big ? P.rope : P.ink);
  }
  ctx.globalAlpha = 1;
}

// ---------- HUD on the paper strip ----------
function meter(ctx, x, y, w, frac, fill, label) {
  frac = Math.max(0, Math.min(1, frac));
  ctx.fillStyle = 'rgba(191,140,85,0.18)';
  roundRect(ctx, x, y, w, 6, 3); ctx.fill();
  if (frac > 0) { ctx.fillStyle = fill; roundRect(ctx, x, y, Math.max(6, w * frac), 6, 3); ctx.fill(); }
  ctx.strokeStyle = 'rgba(107,74,47,0.6)';
  ctx.lineWidth = 0.8;
  roundRect(ctx, x, y, w, 6, 3); ctx.stroke();
  ctx.fillStyle = P.ink;
  ctx.font = '11px ' + HAND;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + w + 5, y + 7);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHud(ctx, game, menu) {
  ctx.textAlign = 'left';
  inkText(ctx, 'Score ' + game.score, 10, 21, 16, P.ink, null);
  ctx.textAlign = 'right';
  inkText(ctx, 'Best ' + game.best, W - 10, 21, 16, P.ink, null);

  // timer: a little watercolor stamp in the middle
  const low = game.scene === 'play' && game.timeLeft <= 10;
  ctx.fillStyle = low ? 'rgba(207,93,110,0.28)' : 'rgba(247,233,198,0.95)';
  ctx.beginPath(); ctx.arc(W / 2, 17, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(107,74,47,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.textAlign = 'center';
  inkText(ctx, String(Math.ceil(game.timeLeft)), W / 2, 24, 19, low ? P.rope : P.ink, null);

  if (game.scene !== 'play') return;
  if (!game.paused) for (const b of menu.buttons()) drawHudButton(ctx, b, menu.isPressed(b));
  const z = game.zoe;
  meter(ctx, 10, 31, 50, 1 - z.cooldown / CONFIG.STRETCH_COOLDOWN, z.stretchReady() ? P.apricot : P.saddle, z.stretchReady() ? 'cinch ready!' : 'cinch');
  if (game.cheeseT > 0) meter(ctx, W - 116, 31, 50, game.cheeseT / CONFIG.CHEESE_TIME, P.cheese, 'long leash');
  const since = game.elapsed - game.lastCaptureT;
  if (game.chain >= 1 && since <= CONFIG.CHAIN_WINDOW) {
    ctx.fillStyle = P.rope;
    roundRect(ctx, W / 2 - 30, 34, Math.max(3, 60 * (1 - since / CONFIG.CHAIN_WINDOW)), 3, 1.5);
    ctx.fill();
    if (game.chain > 1) {
      ctx.textAlign = 'center';
      inkText(ctx, 'chain x' + game.chain, W / 2, 46, 10, P.rope, P.paper);
    }
  }
}

// ---------- touch controls: paper discs and stitched rings ----------
function drawTouchControls(ctx, input, game) {
  const pad = input.pad;
  if (pad.active) {
    ctx.strokeStyle = 'rgba(251,246,236,0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(pad.cx, pad.cy, CONFIG.PAD_RADIUS, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    const kr = CONFIG.PAD_KNOB_R;
    ctx.fillStyle = P.shadowSoft;
    ctx.beginPath(); ctx.arc(pad.kx + 1.5, pad.ky + 2.2, kr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(251,246,236,0.85)';
    ctx.beginPath(); ctx.arc(pad.kx, pad.ky, kr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(107,74,47,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (!input.usedTouch) return;
  const x = CONFIG.ACTION_BTN_X, y = CONFIG.ACTION_BTN_Y, r = CONFIG.ACTION_BTN_R;
  const down = input.buttonDown ? 1.5 : 0;
  ctx.fillStyle = P.shadow;
  ctx.beginPath(); ctx.arc(x + 2.5, y + 3.5, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(251,246,236,0.88)';
  ctx.beginPath(); ctx.arc(x + down, y + down, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(107,74,47,0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const ready = 1 - Math.max(0, game.zoe.cooldown) / CONFIG.STRETCH_COOLDOWN;
  ctx.strokeStyle = ready >= 1 ? P.rope : P.apricot;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x + down, y + down, r - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ready);
  ctx.stroke();
  ctx.textAlign = 'center';
  inkText(ctx, 'CINCH', x + down, y + down + 4, 12, P.ink, null);
}

// ---------- cards on torn paper ----------
function placeCard(ctx, card, cy, dim = true) {
  if (dim) dimScreen(ctx, 1);
  const x = Math.round(W / 2 - card.w / 2), y = Math.round(cy - card.h / 2);
  ctx.drawImage(card.c, x, y, card.w, card.h);
  return { x: x + card.pad, y: y + card.pad, w: card.w - card.pad * 2, h: card.h - card.pad * 2 };
}

function dimScreen(ctx, a) {
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(52,50,78,0.28)';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}

// ---------- menu buttons: torn paper, stitched focus ring ----------
function buttonArt(b) {
  const big = b.kind === 'big';
  const key = b.w + 'x' + b.h + (big ? 'b' : '');
  return art.buttons[key] || (art.buttons[key] = bakeButton(b.w, b.h, big, art));
}

function drawMenuButtons(ctx, menu, alpha = 1) {
  const f = menu.focused();
  for (const b of menu.buttons()) {
    if (b.kind === 'hud') continue;
    if (b.kind === 'chip') drawChip(ctx, b, b === f, menu.isPressed(b), alpha);
    else drawButton(ctx, b, b === f, menu.isPressed(b), menu.enabled(b), alpha);
  }
}

// ---------- theme picker: a row of paper chips, the picked one lifted and ringed ----------
function drawChip(ctx, b, focused, pressed, alpha) {
  const sp = art.chips[b.themeId];
  const picked = b.themeId === themeState.picked;
  const off = pressed ? 1.5 : picked ? -1.5 : 0;
  ctx.globalAlpha = alpha * (picked ? 1 : 0.88);
  ctx.fillStyle = P.shadow;
  roundRect(ctx, b.x + 2, b.y + 3, b.w, b.h, 9);
  ctx.fill();
  ctx.drawImage(sp.c, b.x - sp.pad + off, b.y - sp.pad + off, sp.w, sp.h);
  ctx.globalAlpha = alpha;
  if (picked) {
    ctx.strokeStyle = P.rope;
    ctx.lineWidth = 2.6;
    roundRect(ctx, b.x - 2 + off, b.y - 2 + off, b.w + 4, b.h + 4, 10);
    ctx.stroke();
  }
  if (focused) {
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    roundRect(ctx, b.x - 6 + off, b.y - 6 + off, b.w + 12, b.h + 12, 13);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// "Theme: Spooky Night" above the chips: the focused chip's name, else the picked one.
function chipCaption(ctx, menu, y) {
  const f = menu.focused();
  const id = f && f.kind === 'chip' ? f.themeId : themeState.picked;
  ctx.textAlign = 'center';
  inkText(ctx, 'Theme: ' + getTheme(id).name, W / 2, y, 14, P.ink, null, 'normal');
}

function drawButton(ctx, b, focused, pressed, enabled, alpha) {
  const sp = buttonArt(b);
  const off = pressed ? 1.5 : 0;
  ctx.globalAlpha = alpha * (enabled ? 1 : 0.45);
  // hard paper shadow
  ctx.fillStyle = P.shadow;
  roundRect(ctx, b.x + 2.5, b.y + 3.5, b.w, b.h, 9);
  ctx.fill();
  if (focused && enabled) {
    ctx.strokeStyle = P.rope;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3.5]);
    roundRect(ctx, b.x - 5 + off, b.y - 5 + off, b.w + 10, b.h + 10, 13);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.drawImage(sp.c, b.x - sp.pad + off, b.y - sp.pad + off, sp.w, sp.h);
  const big = b.kind === 'big';
  const size = big ? (b.h > 52 ? 26 : 21) : 17;
  const cx = b.cx + off, cy = b.cy + off;
  ctx.textAlign = 'center';
  if (b.kind === 'sound') {
    const muted = isMuted();
    ctx.font = 'bold ' + size + 'px ' + HAND;
    const tw = ctx.measureText(b.label).width;
    drawSpeaker(ctx, cx - tw / 2 - 4, cy - 1, 0.85, muted);
    inkText(ctx, b.label, cx + 10, cy + size * 0.36, size, P.ink, null);
  } else {
    inkText(ctx, b.label, cx, cy + size * 0.36, size, big ? P.rope : P.ink, null);
  }
  ctx.globalAlpha = alpha;
}

// A little paper speaker: two arcs of sound, or a cross when muted.
function drawSpeaker(ctx, x, y, s, muted) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = P.ink;
  ctx.beginPath();
  ctx.moveTo(-9, -3.5); ctx.lineTo(-5, -3.5); ctx.lineTo(0, -8); ctx.lineTo(0, 8); ctx.lineTo(-5, 3.5); ctx.lineTo(-9, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = muted ? P.rope : P.ink;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (muted) {
    ctx.moveTo(3.5, -4); ctx.lineTo(10.5, 4);
    ctx.moveTo(10.5, -4); ctx.lineTo(3.5, 4);
  } else {
    ctx.arc(0, 0, 5, -0.8, 0.8);
    ctx.moveTo(Math.cos(-0.8) * 9.5, Math.sin(-0.8) * 9.5);
    ctx.arc(0, 0, 9.5, -0.8, 0.8);
  }
  ctx.stroke();
  ctx.restore();
}

// HUD paper discs: sound (speaker) and pause (two bars).
function drawHudButton(ctx, b, pressed) {
  const r = CONFIG.HUD_BTN_R;
  const off = pressed ? 1.2 : 0;
  const x = b.cx + off, y = b.cy + off;
  ctx.fillStyle = P.shadowSoft;
  ctx.beginPath(); ctx.arc(b.cx + 1.5, b.cy + 2.2, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(251,246,236,0.95)';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(107,74,47,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  if (b.id === 'mute') {
    drawSpeaker(ctx, x + 0.5, y, 0.8, isMuted());
  } else {
    ctx.fillStyle = P.ink;
    roundRect(ctx, x - 5.5, y - 6.5, 4, 13, 1.5); ctx.fill();
    roundRect(ctx, x + 1.5, y - 6.5, 4, 13, 1.5); ctx.fill();
  }
}

// ---------- title, pause and how-to cards ----------
function drawPause(ctx, menu) {
  const b = placeCard(ctx, art.cardPause, CARDS.pause.cy);
  ctx.textAlign = 'center';
  inkText(ctx, 'Paused', W / 2, b.y + 58, 34, P.rope, null);
  drawMenuButtons(ctx, menu);
  controlsHint(ctx, b.y + 294);
}

// The keyboard reminder, on two lines (Revision 3 wording).
function controlsHint(ctx, y) {
  ctx.globalAlpha = 0.75;
  ctx.textAlign = 'center';
  inkText(ctx, 'Arrows / WASD steer  ·  Shift + arrow loops', W / 2, y, 13, P.ink, null, 'normal');
  inkText(ctx, 'Space cinches  ·  Esc or P pauses  ·  M mutes', W / 2, y + 18, 13, P.ink, null, 'normal');
  ctx.globalAlpha = 1;
}

// A curled Zoe pose: head at (x, y), body bending `bend` radians per segment.
function curlPose(p, x, y, heading, bend) {
  p.x = x; p.y = y; p.heading = heading;
  let px = x, py = y;
  for (let i = 0; i < p.n; i++) {
    const a = heading - (i + 1) * bend;
    px -= Math.cos(a) * CONFIG.SEG_SPACING;
    py -= Math.sin(a) * CONFIG.SEG_SPACING;
    p.segX[i] = px; p.segY[i] = py;
  }
}

function drawTitle(ctx, dt, menu) {
  const b = placeCard(ctx, art.cardTitle, CARDS.title.cy);
  ctx.textAlign = 'center';
  inkText(ctx, 'Zoomie Zoe', W / 2, b.y + 54, 42, P.rope, null);
  inkText(ctx, 'a leash-lasso sock heist', W / 2, b.y + 82, 17, P.ink, null, 'normal');

  // Zoe herself, big, in a gentle curl
  const s = 3;
  const p = titlePose;
  curlPose(p, 0, Math.sin(clock * 2.2) * 0.6, 0.1 + Math.sin(clock * 1.3) * 0.05, 0.085);
  titleRig.update(p, dt);
  ctx.save();
  ctx.translate(W / 2 + 84, b.y + 146);
  ctx.scale(s, s);
  titleRig.draw(ctx, p, art, 0.6);
  ctx.restore();

  chipCaption(ctx, menu, b.y + CHIP_ROW.title - 36);
  drawMenuButtons(ctx, menu);
  controlsHint(ctx, b.y + 474);
}

// How to play: three little pictures (steer, swing, cinch) and a legend.
const howPoses = [0, 1, 2].map(() => ({ x: 0, y: 0, heading: 0, segX: new Float32Array(CONFIG.SEG_COUNT), segY: new Float32Array(CONFIG.SEG_COUNT), n: CONFIG.SEG_COUNT, odo: 0, extra: 0, lunge: 0, stunned: false, zoom: false, nap: '' }));
const HOW_R = 27;   // radius of the leash loop in the pictures
const HOW_SPACING = CONFIG.SEG_SPACING;

// Zoe running clockwise round a circle, head at angle `phi`.
function circlePose(p, cx, cy, phi) {
  p.x = cx + Math.cos(phi) * HOW_R;
  p.y = cy + Math.sin(phi) * HOW_R;
  p.heading = phi + Math.PI / 2;
  for (let i = 0; i < p.n; i++) {
    const a = phi - ((i + 1) * HOW_SPACING) / HOW_R;
    p.segX[i] = cx + Math.cos(a) * HOW_R;
    p.segY[i] = cy + Math.sin(a) * HOW_R;
  }
}

function ropeArc(ctx, cx, cy, a0, a1) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = P.shadowSoft;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx + 1.6, cy + 2.4, HOW_R, a0, a1); ctx.stroke();
  ctx.strokeStyle = P.rope;
  ctx.lineWidth = 2.8;
  ctx.beginPath(); ctx.arc(cx, cy, HOW_R, a0, a1); ctx.stroke();
  ctx.strokeStyle = P.ropeLight;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3.2]);
  ctx.beginPath(); ctx.arc(cx - 0.4, cy - 0.4, HOW_R, a0, a1); ctx.stroke();
  ctx.setLineDash([]);
  const ex = cx + Math.cos(a0) * HOW_R, ey = cy + Math.sin(a0) * HOW_R;
  ctx.strokeStyle = P.rope;
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(ex, ey, 3.6, 0, Math.PI * 2); ctx.stroke();
}

function sticker(ctx, type, x, y, rot, sc = 1) {
  const sp = art.stickers[type];
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.drawImage(sp.c, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
  ctx.restore();
}

function howPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(247,233,198,0.7)';
  roundRect(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(191,140,85,0.55)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 2.5]);
  roundRect(ctx, x + 2.5, y + 2.5, w - 5, h - 5, 6); ctx.stroke();
  ctx.setLineDash([]);
}

function drawHowto(ctx, menu, dt) {
  const b = placeCard(ctx, art.cardHowto, CARDS.howto.cy);
  ctx.textAlign = 'center';
  inkText(ctx, 'How to play', W / 2, b.y + 42, 30, P.rope, null);

  const colW = 112, gap = 6, top = b.y + 60, ph = 88;
  const x0 = W / 2 - colW * 1.5 - gap;
  const steps = [
    ['1. Steer', 'drag, mouse,', 'or arrow keys'],
    ['2. Swing', 'the leash round', art.theme.words.loot],
    ['3. Cinch!', 'CINCH button,', 'click or Space'],
  ];
  for (let i = 0; i < 3; i++) {
    const px = x0 + i * (colW + gap), cx = px + colW / 2, cy = top + ph / 2;
    howPanel(ctx, px, top, colW, ph);
    const p = howPoses[i];
    p.odo = clock * 70;
    if (i === 0) {
      // Zoe trotting along a curve, with a dotted "steer" arrow ahead of her
      const hx = cx + 20, hy = cy + 2;
      curlPose(p, hx, hy, -0.2, 0.05);
      ctx.strokeStyle = P.rope;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(hx + 12, hy - 4); ctx.quadraticCurveTo(hx + 28, hy - 8, hx + 28, hy - 26); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = P.rope;
      ctx.beginPath(); ctx.moveTo(hx + 28, hy - 33); ctx.lineTo(hx + 23, hy - 24); ctx.lineTo(hx + 33, hy - 24); ctx.closePath(); ctx.fill();
      howRigs[i].update(p, dt);
      howRigs[i].draw(ctx, p, art, 0.9);
    } else {
      // the leash swings round the loot; the cinch snaps it shut
      const lx = cx + 2, ly = cy + 6;
      const phi = -0.3;
      const tipA = phi - (i === 1 ? 4.4 : 5.3);
      if (i === 2) {
        ctx.globalAlpha = 0.55 + 0.25 * Math.sin(clock * 4);
        ctx.fillStyle = P.sun;
        ctx.beginPath(); ctx.arc(lx, ly, HOW_R, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      sticker(ctx, 'sock', lx - 7, ly - 5, -0.3);
      sticker(ctx, 'shoe', lx + 7, ly + 7, 0.25, 0.85);
      ctx.save();
      ctx.translate(lx, ly); ctx.scale(0.85, 0.85); ctx.translate(-lx, -ly);
      ropeArc(ctx, lx, ly, tipA, phi);
      if (i === 2) {
        const tx = lx + Math.cos(tipA) * HOW_R, ty = ly + Math.sin(tipA) * HOW_R;
        const hx = lx + Math.cos(phi) * HOW_R, hy = ly + Math.sin(phi) * HOW_R;
        ctx.strokeStyle = P.thread;
        ctx.lineWidth = 2;
        ctx.setLineDash([3.4, 3.4]);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.setLineDash([]);
      }
      circlePose(p, lx, ly, phi);
      howRigs[i].update(p, dt);
      howRigs[i].draw(ctx, p, art, 0.9);
      ctx.restore();
      if (i === 2) inkText(ctx, '+6', px + colW - 16, top + ph - 10, 16, P.rope);
    }
    ctx.textAlign = 'center';
    inkText(ctx, steps[i][0], cx, top + ph + 22, 16, P.rope, null);
    inkText(ctx, steps[i][1], cx, top + ph + 40, 13, P.ink, null, 'normal');
    inkText(ctx, steps[i][2], cx, top + ph + 56, 13, P.ink, null, 'normal');
  }

  // stitched divider
  const dy = b.y + 228;
  ctx.strokeStyle = 'rgba(191,140,85,0.6)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(b.x + 24, dy); ctx.lineTo(b.x + b.w - 24, dy); ctx.stroke();
  ctx.setLineDash([]);

  // legend: what's what in Zoe's room
  const wd = art.theme.words;
  const rows = [
    ['ball', wd.ball, wd.ballTip],
    ['blanket', wd.hide, wd.hideTip],
    ['bath', wd.hazard, wd.hazardTip],
    ['dog', wd.critters, wd.critterTip],
  ];
  const ix = b.x + 42, tx = b.x + 80;
  for (let r = 0; r < rows.length; r++) {
    const ry = b.y + 254 + r * 46;
    const [icon, label, text] = rows[r];
    drawLegendIcon(ctx, icon, ix, ry + 4);
    ctx.textAlign = 'left';
    inkText(ctx, label, tx, ry, 15, P.rope, null);
    inkText(ctx, text, tx, ry + 18, 13, P.ink, null, 'normal');
    if (icon === 'dog') inkText(ctx, wd.critterTip2, tx, ry + 34, 13, P.ink, null, 'normal');
  }
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.8;
  inkText(ctx, 'Arrows / WASD steer  ·  Shift + arrow loops', W / 2, b.y + 454, 13, P.ink, null, 'normal');
  inkText(ctx, 'Space cinches', W / 2, b.y + 471, 13, P.ink, null, 'normal');
  ctx.globalAlpha = 1;
  drawMenuButtons(ctx, menu);
}

function drawLegendIcon(ctx, icon, x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (icon === 'ball') {
    const sp = art.ball;
    ctx.fillStyle = P.shadow;
    ctx.beginPath(); ctx.ellipse(1.6, 4, CONFIG.BALL_RADIUS * 1.3, CONFIG.BALL_RADIUS, 0, 0, Math.PI * 2); ctx.fill();
    ctx.scale(1.4, 1.4);
    ctx.drawImage(sp.c, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
  } else if (icon === 'blanket') {
    const sp = art.tuck;
    ctx.rotate(-Math.PI / 2);
    ctx.scale(1.1, 1.1);
    ctx.drawImage(sp.c, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
  } else if (icon === 'bath') {
    const sp = art.bath;
    ctx.scale(0.58, 0.58);
    ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h);
  } else {
    const sp = art.dogs[0];
    ctx.rotate(-0.4);
    ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h);
  }
  ctx.restore();
}

// ---------- game over: Zoe flops into a nap pose, then the card slides in ----------
const NAP_CAPTION = { belly: '(belly-up flop)', donut: '(donut curl)', loaf: '(bread loaf)' };
const NAP_SHAPE = {          // spacing between joints, bend per joint, heading
  belly: [6, 0.13, -2.5],
  donut: [6, 0.52, -0.6],
  loaf: [2.6, 0, -0.35],
};
const NJ = CONFIG.SEG_COUNT + 1;
const nap = {
  sx: new Float32Array(NJ), sy: new Float32Array(NJ), sh: 0,   // where she was (local, scale 1)
  tx: new Float32Array(NJ), ty: new Float32Array(NJ), th: 0,   // the sleeping pose (local)
  cx: 0, cy: 0, cardY: H / 2, landed: false,
  pose: { x: 0, y: 0, heading: 0, segX: new Float32Array(CONFIG.SEG_COUNT), segY: new Float32Array(CONFIG.SEG_COUNT), n: CONFIG.SEG_COUNT, odo: 0, extra: 0, lunge: 0, stunned: false, zoom: false, nap: '' },
};

function startNap(game) {
  const z = game.zoe;
  // Build the sleeping pose as a chain from the head, then centre it.
  const [sp, bend, h] = NAP_SHAPE[game.napPose] || NAP_SHAPE.donut;
  nap.th = h;
  let x = 0, y = 0, mxs = 0, mys = 0;
  for (let j = 0; j < NJ; j++) {
    if (j > 0) {
      const a = h + Math.PI + bend * j;
      x += Math.cos(a) * sp; y += Math.sin(a) * sp;
    }
    nap.tx[j] = x; nap.ty[j] = y;
    mxs += x; mys += y;
  }
  for (let j = 0; j < NJ; j++) { nap.tx[j] -= mxs / NJ; nap.ty[j] -= mys / NJ; }

  // Nap in her half of the room (the card goes in the other half), with the
  // whole grown-up pose on screen. 22 px pads for ears, tail and paws.
  const S = CONFIG.NAP_SCALE, pad = 22;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let j = 0; j < NJ; j++) {
    x0 = Math.min(x0, nap.tx[j]); x1 = Math.max(x1, nap.tx[j]);
    y0 = Math.min(y0, nap.ty[j]); y1 = Math.max(y1, nap.ty[j]);
  }
  x0 = (x0 - pad) * S; x1 = (x1 + pad) * S; y0 = (y0 - pad) * S; y1 = (y1 + pad) * S;
  const fit = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
  const cardH = art.cardOver.h;
  const mx = z.segX[4], my = z.segY[4];
  let top, bot;
  if (my < (CONFIG.HUD_H + H) / 2) {
    nap.cardY = H - cardH / 2 - 10;
    top = CONFIG.HUD_H + 4; bot = nap.cardY - cardH / 2;
  } else {
    nap.cardY = CONFIG.HUD_H + cardH / 2 + 10;
    top = nap.cardY + cardH / 2; bot = H - 4;
  }
  nap.cx = fit(mx, 4 - x0, W - 4 - x1);
  nap.cy = fit(my, top - y0, bot - y1);

  nap.sx[0] = z.x - nap.cx; nap.sy[0] = z.y - nap.cy;
  for (let i = 0; i < CONFIG.SEG_COUNT; i++) { nap.sx[i + 1] = z.segX[i] - nap.cx; nap.sy[i + 1] = z.segY[i] - nap.cy; }
  nap.sh = z.heading;
  nap.landed = false;
  napRig.reset();
}

function drawGameOver(ctx, game, dt, menu) {
  const t = game.overT;
  const flop = CONFIG.NAP_FLOP_TIME;
  const u = Math.min(1, t / flop);
  const back = u - 1;
  const e = 1 + 2.2 * back * back * back + 1.2 * back * back;   // ease-out-back
  const sc = 1 + (CONFIG.NAP_SCALE - 1) * (1 - (1 - u) * (1 - u));
  const hop = -Math.sin(Math.PI * u) * 10;

  dimScreen(ctx, Math.min(1, t / flop));

  // pose in local space (centre of the nap spot, scale 1)
  const p = nap.pose;
  const lx = (j) => nap.sx[j] + (nap.tx[j] - nap.sx[j]) * e;
  const ly = (j) => nap.sy[j] + (nap.ty[j] - nap.sy[j]) * e + hop / sc;
  p.x = lx(0); p.y = ly(0);
  for (let i = 0; i < CONFIG.SEG_COUNT; i++) { p.segX[i] = lx(i + 1); p.segY[i] = ly(i + 1); }
  let dh = nap.th - nap.sh;
  while (dh > Math.PI) dh -= Math.PI * 2;
  while (dh < -Math.PI) dh += Math.PI * 2;
  p.heading = nap.sh + dh * e;
  p.nap = u > 0.45 ? game.napPose : '';
  napRig.update(p, dt);
  ctx.save();
  ctx.translate(nap.cx, nap.cy);
  ctx.scale(sc, sc);
  napRig.draw(ctx, p, art, 1 / sc + 0.3);
  ctx.restore();

  if (u >= 1 && !nap.landed) {
    nap.landed = true;
    fx.puff(nap.cx, nap.cy + 8, 7, P.dust, 60, 0.5, 5);
  }

  if (t >= CONFIG.NAP_CARD_DELAY) drawNapCard(ctx, game, t, menu);
  drawZs(ctx, p, t - flop, sc);
}

function drawNapCard(ctx, game, t, menu) {
  const ct = Math.min(1, (t - CONFIG.NAP_CARD_DELAY) / 0.25);
  const dy = motion.reduced ? 0 : (1 - ct) * 14; // reduced motion: fade in place, no slide
  ctx.globalAlpha = ct;
  const b = placeCard(ctx, art.cardOver, nap.cardY + dy, false);
  ctx.textAlign = 'center';
  inkText(ctx, 'Zoe naps', W / 2, b.y + 46, 34, P.rope, null);
  inkText(ctx, 'Score ' + game.score, W / 2, b.y + 80, 20, P.ink, null);
  inkText(ctx, (game.newBest ? 'New best! ' : 'Best ') + game.best, W / 2, b.y + 106, game.newBest ? 19 : 17, game.newBest ? P.rope : P.ink, null, game.newBest ? 'bold' : 'normal');
  inkText(ctx, NAP_CAPTION[game.napPose] || '', W / 2, b.y + 128, 14, P.ink, null, 'normal');
  ctx.save();
  ctx.translate(0, dy);
  chipCaption(ctx, menu, b.y - dy + CHIP_ROW.over - 36);
  drawMenuButtons(ctx, menu, ct);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawDebug(ctx, game, debug) {
  const L = game.leash, z = game.zoe;
  const rows = [
    'fps ' + debug.fps.toFixed(0) + '  bake ' + art.bakeMs.toFixed(0) + 'ms',
    'leash ' + L.liveLength(z).toFixed(0) + ' / ' + L.length.toFixed(0),
    'loops ' + game.captures + ' caught / ' + game.closes + ' closed',
    'dogs ' + game.dogs.length + '  items ' + game.items.activeCount(),
  ];
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(4, H - 70, 170, 66);
  ctx.fillStyle = '#0f0';
  ctx.font = '11px ' + MONO;
  ctx.textAlign = 'left';
  for (let i = 0; i < rows.length; i++) ctx.fillText(rows[i], 10, H - 54 + i * 14);
}

// floating "z"s once she's settled (drawn over the card so they never hide)
function drawZs(ctx, p, zt, sc) {
  if (zt >= 0) {
    const hx = nap.cx + p.x * sc, hy = nap.cy + p.y * sc;
    ctx.textAlign = 'center';
    for (let k = 0; k < 3; k++) {
      const raw = zt * 0.5 - k / 3;
      if (raw < 0) continue;
      const ph = raw % 1;
      const a = ph < 0.15 ? ph / 0.15 : 1 - (ph - 0.15) / 0.85;
      ctx.globalAlpha = a;
      inkText(ctx, k === 1 ? 'Z' : 'z', hx + 8 + ph * 18 + Math.sin(ph * 6) * 3, hy - 12 - ph * 36, Math.round(11 + ph * 10), P.indigo, P.paper);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- sideways phone: Zoe asks the player to turn the phone upright ----------
const rotPose = { x: 0, y: 0, heading: 0, segX: new Float32Array(CONFIG.SEG_COUNT), segY: new Float32Array(CONFIG.SEG_COUNT), n: CONFIG.SEG_COUNT, odo: 0, extra: 0, lunge: 0, stunned: false, zoom: false, nap: '' };

function drawRotate(ctx, dt) {
  dimScreen(ctx, 1);
  const b = placeCard(ctx, art.cardRotate, CARDS.rotate.cy, false);
  ctx.textAlign = 'center';
  inkText(ctx, 'Turn your phone!', W / 2, b.y + 52, 32, P.rope, null);
  inkText(ctx, 'Zoe needs the long way', W / 2, b.y + 84, 17, P.ink, null, 'normal');
  inkText(ctx, 'to stretch out.', W / 2, b.y + 106, 17, P.ink, null, 'normal');

  // a sketched phone turning upright, again and again
  const cx = W / 2 - 70, cy = b.y + 236;
  const ph = (clock * 0.5) % 1;
  const turn = ph < 0.25 ? 0 : ph < 0.6 ? (ph - 0.25) / 0.35 : 1;
  const ease = turn * turn * (3 - 2 * turn);
  const ang = (motion.reduced ? 0 : -Math.PI / 2 * (1 - ease));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.fillStyle = P.shadow;
  roundRect(ctx, -30 + 2.5, -52 + 3.5, 60, 104, 10); ctx.fill();
  ctx.fillStyle = P.paper;
  roundRect(ctx, -30, -52, 60, 104, 10); ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(169,177,194,0.6)';
  roundRect(ctx, -23, -42, 46, 80, 4); ctx.fill();
  ctx.fillStyle = P.ink;
  ctx.beginPath(); ctx.arc(0, 44, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // a curved arrow
  ctx.strokeStyle = P.rope;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, 72, -2.7, -1.9); ctx.stroke();
  ctx.setLineDash([]);
  const ax = cx + Math.cos(-1.9) * 72, ay = cy + Math.sin(-1.9) * 72;
  ctx.fillStyle = P.rope;
  ctx.beginPath(); ctx.moveTo(ax + 8, ay + 1); ctx.lineTo(ax - 3, ay - 6); ctx.lineTo(ax - 2, ay + 7); ctx.closePath(); ctx.fill();

  // Zoe standing tall beside it, looking up at the player
  const p = rotPose;
  curlPose(p, 0, 0, -Math.PI / 2 + Math.sin(clock * 1.6) * 0.06, 0.02);
  p.odo = 0;
  rotRig.update(p, dt);
  ctx.save();
  ctx.translate(W / 2 + 70, b.y + 170);
  ctx.scale(2.2, 2.2);
  rotRig.draw(ctx, p, art, 0.7);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.8;
  inkText(ctx, 'The round is paused.', W / 2, b.y + 392, 15, P.ink, null, 'normal');
  ctx.globalAlpha = 1;
}
