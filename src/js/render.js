// Watercolor + paper-cutout drawing. Everything is drawn in arena coordinates
// (400 x 600); the view scales it to the screen.
// Slow painting (paper, bedroom, stickers, dogs, cards) is baked once in
// art/bake.js; each frame only blits those and draws Zoe, the leash and juice.
// No ctx.filter or shadowBlur here: shadows are hard offset copies.

import { CONFIG } from '../config.js';
import { P, HAND } from './art/palette.js';
import { bakeAll } from './art/bake.js';
import { ZoeRig } from './art/zoe-art.js';
import { Fx } from './art/fx.js';

const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;
const MONO = 'ui-monospace, Menlo, monospace';

let art = null;
let pendingW = 0, pendingSince = 0;
let lastNow = 0;
let lastScene = '';
let clock = 0;
const rig = new ZoeRig();
const titleRig = new ZoeRig();
const fx = new Fx();
const pose = { x: 0, y: 0, heading: 0, segX: null, segY: null, n: CONFIG.SEG_COUNT, odo: 0, extra: 0, lunge: 0, stunned: false };
const titlePose = { x: 0, y: 0, heading: 0, segX: new Float32Array(CONFIG.SEG_COUNT), segY: new Float32Array(CONFIG.SEG_COUNT), n: CONFIG.SEG_COUNT, odo: 0, extra: 0, lunge: 0, stunned: false };
const leashX = new Float32Array(1100), leashY = new Float32Array(1100);

// Bake on first use; re-bake once the canvas size has been stable for 200 ms.
function ensureArt(ctx, now) {
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
  if (!art) {
    bake(ctx);
  } else if (art.pxW !== cw || art.pxH !== ch) {
    if (pendingW !== cw * 10000 + ch) { pendingW = cw * 10000 + ch; pendingSince = now; }
    else if (now - pendingSince > 200) bake(ctx);
  }
}

function bake(ctx) {
  art = bakeAll(ctx, ctx.canvas.width / W);
  // handy for checking from the console: doxie.art
  if (globalThis.doxie) globalThis.doxie.art = { bakeMs: Math.round(art.bakeMs), bakes: art.bakeCount, k: art.k };
}

export function render(ctx, view, game, input, debug) {
  const now = performance.now();
  const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0;
  lastNow = now;
  clock += dt;
  ensureArt(ctx, now);

  if (game.scene === 'play' && lastScene !== 'play') { rig.reset(); fx.reset(game); }
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
    drawFlash(ctx, game);
    drawLeash(ctx, game);
    if (game.scene === 'play') drawCinchPreview(ctx, game);
    drawItems(ctx, game);
    drawDogs(ctx, game, frozen || game.hitStop > 0);
    drawZoe(ctx, game, frozen || game.hitStop > 0 ? 0 : dt);
    fx.draw(ctx);
    drawPopups(ctx, game);
  }
  drawHud(ctx, game);
  if (game.scene === 'play' && !game.paused) drawTouchControls(ctx, input, game);

  if (game.scene === 'title') drawTitle(ctx, dt);
  else if (game.scene === 'over') drawGameOver(ctx, game);
  else if (game.paused) drawCard(ctx, art.cardOver, 'Paused', ['tap or press Space to resume']);

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
  const ex = leashX[n - 1], ey = leashY[n - 1];
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // paper shadow
  ctx.strokeStyle = P.shadowSoft;
  ctx.lineWidth = cheese ? 3.6 : 3;
  strokeLeash(ctx, n, 1.6, 2.4);
  ctx.beginPath(); ctx.arc(ex + 1.6, ey + 2.4, 4.2, 0, Math.PI * 2); ctx.stroke();
  // rope body + twisted highlight
  ctx.strokeStyle = cheese ? P.ropeCheese : P.rope;
  ctx.lineWidth = cheese ? 3.6 : 2.8;
  strokeLeash(ctx, n, 0, 0);
  ctx.beginPath(); ctx.arc(ex, ey, 4.2, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = cheese ? P.ropeCheeseLight : P.ropeLight;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3.2]);
  strokeLeash(ctx, n, -0.4, -0.4);
  ctx.setLineDash([]);
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

// ---------- other dogs: grey paper cutouts that waddle ----------
function drawDogs(ctx, game, frozen) {
  const r = CONFIG.DOG_RADIUS;
  const dogs = game.dogs;
  for (let i = 0; i < dogs.length; i++) {
    const d = dogs[i];
    const sp = art.dogs[i % 2];
    const wob = frozen ? 0 : Math.sin(clock * 13 + i * 1.7) * 0.07;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.heading + wob);
    ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h);
    ctx.restore();
    if (d.chasing) {
      const y = d.y - r - 9 + Math.sin(clock * 10) * 1.2;
      ctx.fillStyle = P.shadowSoft;
      ctx.beginPath(); ctx.ellipse(d.x + 1, y + 1.4, 5.4, 6.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.paper;
      ctx.beginPath(); ctx.ellipse(d.x, y, 5.4, 6.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = P.rope;
      ctx.font = 'bold 11px ' + HAND;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', d.x, y + 0.5);
      ctx.textBaseline = 'alphabetic';
    }
  }
}

// ---------- Zoe ----------
function drawZoe(ctx, game, dt) {
  const z = game.zoe;
  pose.x = z.x; pose.y = z.y; pose.heading = z.heading;
  pose.segX = z.segX; pose.segY = z.segY;
  pose.odo = z.odo; pose.extra = z.extra;
  pose.lunge = z.isLunging() ? 1 : 0;
  pose.stunned = z.isStunned();
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
  ctx.font = '10px ' + HAND;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + w + 5, y + 6.5);
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

function drawHud(ctx, game) {
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
    ctx.fillStyle = P.shadowSoft;
    ctx.beginPath(); ctx.arc(pad.kx + 1.5, pad.ky + 2.2, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(251,246,236,0.85)';
    ctx.beginPath(); ctx.arc(pad.kx, pad.ky, 16, 0, Math.PI * 2); ctx.fill();
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
function placeCard(ctx, card, cy) {
  ctx.fillStyle = 'rgba(52,50,78,0.28)';
  ctx.fillRect(0, 0, W, H);
  const x = Math.round(W / 2 - card.w / 2), y = Math.round(cy - card.h / 2);
  ctx.drawImage(card.c, x, y, card.w, card.h);
  return { x: x + card.pad, y: y + card.pad, w: card.w - card.pad * 2, h: card.h - card.pad * 2 };
}

function drawCard(ctx, card, title, lines) {
  const b = placeCard(ctx, card, H / 2);
  ctx.textAlign = 'center';
  inkText(ctx, title, W / 2, b.y + 62, 34, P.rope, null);
  for (let i = 0; i < lines.length; i++) inkText(ctx, lines[i], W / 2, b.y + 108 + i * 26, 17, P.ink, null, 'normal');
}

function drawTitle(ctx, dt) {
  const b = placeCard(ctx, art.cardTitle, H / 2 - 4);
  ctx.textAlign = 'center';
  inkText(ctx, 'Doxie Arcade', W / 2, b.y + 50, 36, P.rope, null);
  inkText(ctx, 'Leash Lasso, starring Zoe', W / 2, b.y + 76, 15, P.ink, null, 'normal');

  // Zoe herself, big, in a gentle curl
  const s = 3;
  const p = titlePose;
  const bob = Math.sin(clock * 2.2) * 0.6;
  p.heading = 0.1 + Math.sin(clock * 1.3) * 0.05;
  p.x = 0; p.y = bob;
  let px = 0, py = bob;
  for (let i = 0; i < p.n; i++) {
    const a = p.heading - (i + 1) * 0.085;
    px -= Math.cos(a) * CONFIG.SEG_SPACING;
    py -= Math.sin(a) * CONFIG.SEG_SPACING;
    p.segX[i] = px; p.segY[i] = py;
  }
  titleRig.update(p, dt);
  ctx.save();
  ctx.translate(W / 2 + 84, b.y + 150);
  ctx.scale(s, s);
  titleRig.draw(ctx, p, art, 0.6);
  ctx.restore();

  const pulse = 1 + Math.sin(clock * 4) * 0.04;
  ctx.save();
  ctx.translate(W / 2, b.y + 268);
  ctx.scale(pulse, pulse);
  inkText(ctx, 'Tap to play', 0, 0, 24, P.ink, P.sun);
  ctx.restore();
  inkText(ctx, 'Steer to swing your leash around socks,', W / 2, b.y + 304, 13, P.ink, null, 'normal');
  inkText(ctx, 'then cinch it shut to catch them!', W / 2, b.y + 322, 13, P.ink, null, 'normal');
  ctx.globalAlpha = 0.75;
  inkText(ctx, 'Steer: drag / mouse / ← → or A D', W / 2, b.y + 348, 11, P.ink, null, 'normal');
  inkText(ctx, 'Cinch: 2nd finger or button / click / Space', W / 2, b.y + 364, 11, P.ink, null, 'normal');
  ctx.globalAlpha = 1;
}

function drawGameOver(ctx, game) {
  const lines = ['Score ' + game.score, (game.newBest ? 'New best! ' : 'Best ') + game.best, ''];
  lines.push(game.canRestart() ? 'tap to restart' : '');
  drawCard(ctx, art.cardOver, 'Zoe naps', lines);
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
