// Greybox drawing: plain grey shapes only. Everything is drawn in arena
// coordinates (400 x 600); the view scales it to the screen.

import { CONFIG } from '../config.js';

const C = {
  floor: '#d4d4d4',
  wall: '#8a8a8a',
  leash: '#555',
  leashCheese: '#2b2b2b',
  zoeHead: '#5e5e5e',
  zoeBody: '#7d7d7d',
  zoeNose: '#222',
  sock: '#9a9a9a',
  shoe: '#6f6f6f',
  cheese: '#b8b8b8',
  itemEdge: '#3a3a3a',
  dog: '#2e2e2e',
  text: '#222',
  hudBg: 'rgba(255,255,255,0.55)',
  meterBg: 'rgba(0,0,0,0.15)',
  meterFill: '#555',
  overlay: 'rgba(40,40,40,0.72)',
  white: '#fff',
};

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function render(ctx, view, game, input, debug) {
  const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;
  ctx.setTransform(view.k, 0, 0, view.k, 0, 0);
  ctx.fillStyle = C.floor;
  ctx.fillRect(0, 0, W, H);

  if (game.scene !== 'title') {
    drawFlash(ctx, game);
    drawLeash(ctx, game);
    if (game.scene === 'play') drawCinchPreview(ctx, game);
    drawItems(ctx, game);
    drawDogs(ctx, game);
    drawZoe(ctx, game);
    drawPopups(ctx, game);
  }
  drawHud(ctx, game);
  if (game.scene === 'play' && !game.paused) drawTouchControls(ctx, input, game);

  if (game.scene === 'title') drawTitle(ctx);
  else if (game.scene === 'over') drawGameOver(ctx, game);
  else if (game.paused) drawCard(ctx, 'Paused', ['tap or press Space to resume']);

  if (debug.on && game.scene !== 'title') drawDebug(ctx, game, debug);

  ctx.strokeStyle = C.wall;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);
}

function drawFlash(ctx, game) {
  if (game.flashT <= 0 || game.flashN < 3) return;
  ctx.globalAlpha = Math.max(0, game.flashT / CONFIG.FLASH_TIME) * 0.9;
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.moveTo(game.flashX[0], game.flashY[0]);
  for (let i = 1; i < game.flashN; i++) ctx.lineTo(game.flashX[i], game.flashY[i]);
  ctx.closePath();
  ctx.fill('nonzero');
  ctx.globalAlpha = 1;
}

function drawLeash(ctx, game) {
  const zoe = game.zoe, t = zoe.trail;
  const tip = game.leash.tipOdo(zoe);
  ctx.strokeStyle = game.cheeseT > 0 ? C.leashCheese : C.leash;
  ctx.lineWidth = game.cheeseT > 0 ? 3 : 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(zoe.x, zoe.y);
  let endX = zoe.x, endY = zoe.y;
  for (let i = t.count - 1; i >= 0; i--) {
    const o = t.o(i);
    if (o < tip) {
      // interpolate the exact tip between point i and the newer one
      if (i + 1 < t.count) {
        const no = t.o(i + 1);
        const f = no - o > 0 ? (no - tip) / (no - o) : 0;
        endX = t.x(i + 1) + (t.x(i) - t.x(i + 1)) * f;
        endY = t.y(i + 1) + (t.y(i) - t.y(i + 1)) * f;
        ctx.lineTo(endX, endY);
      }
      break;
    }
    endX = t.x(i);
    endY = t.y(i);
    ctx.lineTo(endX, endY);
  }
  ctx.stroke();
  // Handle loop at the far end so the leash length is easy to read.
  ctx.beginPath();
  ctx.arc(endX, endY, 4, 0, Math.PI * 2);
  ctx.stroke();
}

// Faint dashed line from the leash end to Zoe, plus rings on the items a press would catch.
function drawCinchPreview(ctx, game) {
  if (!game.cinchPreview) return;
  const z = game.zoe;
  ctx.save();
  ctx.globalAlpha = CONFIG.CINCH_PREVIEW_ALPHA;
  ctx.strokeStyle = C.leash;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([CONFIG.CINCH_DASH, CONFIG.CINCH_DASH]);
  ctx.beginPath();
  ctx.moveTo(game.cinchTipX, game.cinchTipY);
  ctx.lineTo(z.x, z.y);
  ctx.stroke();
  ctx.restore();
  if (!game.cinchOk) return;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2.5;
  for (const it of game.items.list) {
    if (!it.active || !it.inCinch) continue;
    ctx.beginPath();
    ctx.arc(it.x, it.y, it.r * 1.4 + CONFIG.CINCH_HIGHLIGHT_PAD, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawItems(ctx, game) {
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = C.itemEdge;
  for (const it of game.items.list) {
    if (!it.active) continue;
    const s = Math.min(1, it.age / 0.15); // quick pop-in so new items are noticed
    ctx.beginPath();
    if (it.type === 'sock') {
      const h = it.r * s;
      ctx.rect(it.x - h, it.y - h, h * 2, h * 2);
      ctx.fillStyle = C.sock;
    } else if (it.type === 'shoe') {
      const w = it.r * 1.4 * s, h = it.r * 0.8 * s;
      ctx.rect(it.x - w, it.y - h, w * 2, h * 2);
      ctx.fillStyle = C.shoe;
    } else {
      const r = it.r * 1.3 * s;
      ctx.moveTo(it.x, it.y - r);
      ctx.lineTo(it.x + r * 0.95, it.y + r * 0.7);
      ctx.lineTo(it.x - r * 0.95, it.y + r * 0.7);
      ctx.closePath();
      ctx.fillStyle = C.cheese;
    }
    ctx.fill();
    ctx.stroke();
  }
}

function drawDogs(ctx, game) {
  const r = CONFIG.DOG_RADIUS;
  for (const d of game.dogs) {
    ctx.fillStyle = C.dog;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, r * 1.15, r * 0.9, d.heading, 0, Math.PI * 2);
    ctx.fill();
    // snout nub shows which way it's facing
    ctx.beginPath();
    ctx.arc(d.x + Math.cos(d.heading) * r, d.y + Math.sin(d.heading) * r, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    if (d.chasing) {
      ctx.fillStyle = C.text;
      ctx.font = 'bold 14px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('!', d.x, d.y - r - 4);
    }
  }
}

function drawZoe(ctx, game) {
  const z = game.zoe;
  // Blink while she can't be hit again.
  if (z.invulnT > 0 && Math.floor(z.invulnT * 12) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.fillStyle = C.zoeBody;
  for (let i = CONFIG.SEG_COUNT - 1; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(z.segX[i], z.segY[i], CONFIG.SEG_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = C.zoeHead;
  ctx.beginPath();
  ctx.arc(z.x, z.y, CONFIG.HEAD_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.zoeNose;
  ctx.beginPath();
  ctx.arc(z.x + Math.cos(z.heading) * CONFIG.HEAD_RADIUS, z.y + Math.sin(z.heading) * CONFIG.HEAD_RADIUS, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (z.isStunned()) {
    ctx.fillStyle = C.text;
    ctx.font = 'bold 12px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('* * *', z.x, z.y - CONFIG.HEAD_RADIUS - 6);
  }
}

function drawPopups(ctx, game) {
  ctx.textAlign = 'center';
  for (const p of game.popups) {
    if (!p.active) continue;
    const f = p.t / CONFIG.POPUP_TIME;
    ctx.globalAlpha = 1 - f * f;
    ctx.font = (p.big ? 'bold 22px ' : 'bold 13px ') + FONT;
    const y = p.y - CONFIG.POPUP_RISE * (1 - (1 - f) * (1 - f));
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.white;
    ctx.strokeText(p.text, p.x, y);
    ctx.fillStyle = C.text;
    ctx.fillText(p.text, p.x, y);
  }
  ctx.globalAlpha = 1;
}

function meter(ctx, x, y, w, frac, label) {
  ctx.fillStyle = C.meterBg;
  ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = C.meterFill;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), 6);
  ctx.fillStyle = C.text;
  ctx.font = '10px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + w + 5, y + 6);
}

function drawHud(ctx, game) {
  const W = CONFIG.ARENA_W;
  ctx.fillStyle = C.hudBg;
  ctx.fillRect(0, 0, W, CONFIG.HUD_H);
  ctx.fillStyle = C.text;
  ctx.font = 'bold 16px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText('Score ' + game.score, 10, 20);
  ctx.textAlign = 'right';
  ctx.fillText('Best ' + game.best, W - 10, 20);
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px ' + FONT;
  ctx.fillText(String(Math.ceil(game.timeLeft)), W / 2, 22);

  if (game.scene !== 'play') return;
  const z = game.zoe;
  meter(ctx, 10, 30, 50, 1 - z.cooldown / CONFIG.STRETCH_COOLDOWN, z.stretchReady() ? 'cinch ready' : 'cinch');
  if (game.cheeseT > 0) meter(ctx, W - 110, 30, 50, game.cheeseT / CONFIG.CHEESE_TIME, 'long leash');
  const since = game.elapsed - game.lastCaptureT;
  if (game.chain >= 1 && since <= CONFIG.CHAIN_WINDOW) {
    ctx.fillStyle = C.meterFill;
    ctx.fillRect(W / 2 - 30, 30, 60 * (1 - since / CONFIG.CHAIN_WINDOW), 4);
    if (game.chain > 1) {
      ctx.fillStyle = C.text;
      ctx.font = 'bold 10px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('chain x' + game.chain, W / 2, 43);
    }
  }
}

function drawTouchControls(ctx, input, game) {
  const pad = input.pad;
  if (pad.active) {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pad.cx, pad.cy, CONFIG.PAD_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(pad.kx, pad.ky, 16, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!input.usedTouch) return;
  // On-screen stretch button with its cooldown ring.
  const x = CONFIG.ACTION_BTN_X, y = CONFIG.ACTION_BTN_Y, r = CONFIG.ACTION_BTN_R;
  ctx.fillStyle = input.buttonDown ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  const ready = 1 - Math.max(0, game.zoe.cooldown) / CONFIG.STRETCH_COOLDOWN;
  ctx.strokeStyle = C.meterFill;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ready);
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.font = 'bold 11px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText('CINCH', x, y + 4);
}

function drawCard(ctx, title, lines) {
  const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;
  ctx.fillStyle = C.overlay;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px ' + FONT;
  ctx.fillText(title, W / 2, H / 2 - 40);
  ctx.font = '16px ' + FONT;
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], W / 2, H / 2 + i * 26);
}

function drawTitle(ctx) {
  const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;
  drawCard(ctx, 'Doxie Arcade', ['Leash Lasso  (greybox prototype)', '', 'Tap to play']);
  ctx.font = '13px ' + FONT;
  ctx.fillStyle = C.white;
  ctx.fillText('Steer to swing your leash in an arc around socks,', W / 2, H - 120);
  ctx.fillText('then press to cinch it shut and catch them!', W / 2, H - 102);
  ctx.globalAlpha = 0.8;
  ctx.font = '11px ' + FONT;
  ctx.fillText('Steer: drag / mouse / \u2190 \u2192 or A D', W / 2, H - 70);
  ctx.fillText('Cinch: 2nd finger or button / click / Space', W / 2, H - 54);
  ctx.globalAlpha = 1;
}

function drawGameOver(ctx, game) {
  const lines = ['Score ' + game.score, (game.newBest ? 'New best! ' : 'Best ') + game.best, ''];
  lines.push(game.canRestart() ? 'tap to restart' : '');
  drawCard(ctx, 'Zoe naps', lines);
}

function drawDebug(ctx, game, debug) {
  const L = game.leash, z = game.zoe;
  const rows = [
    'fps ' + debug.fps.toFixed(0),
    'leash ' + L.liveLength(z).toFixed(0) + ' / ' + L.length.toFixed(0),
    'loops ' + game.captures + ' caught / ' + game.closes + ' closed',
    'dogs ' + game.dogs.length + '  items ' + game.items.activeCount(),
  ];
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(4, CONFIG.ARENA_H - 70, 170, 66);
  ctx.fillStyle = '#0f0';
  ctx.font = '11px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'left';
  for (let i = 0; i < rows.length; i++) ctx.fillText(rows[i], 10, CONFIG.ARENA_H - 54 + i * 14);
}
