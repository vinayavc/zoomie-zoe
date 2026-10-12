// Boot: wire the view, input, game loop and scenes together.

import { CONFIG } from '../config.js';
import { isExtension, screenShape, checkSideways } from './platform.js';
import { View } from './view.js';
import { Input } from './input.js';
import { createLoop } from './loop.js';
import { unlockAudio } from './audio.js';
import { Game } from './game/round.js';
import { Menu } from './menu.js';
import { render } from './render.js';
import { themeState, pickTheme, themeRoundEnded, THEME_IDS } from './themes/index.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const view = new View(canvas, stage);
const input = new Input(view);
const game = new Game(input);
const menu = new Menu(game, input);
const debug = { on: new URLSearchParams(location.search).has('debug'), fps: 60 };

// Handy for live tuning from the browser console: doxie.config.ZOE_SPEED = 170
globalThis.doxie = {
  ...globalThis.doxie,
  config: CONFIG,
  game,
  menu,
  input,
  isExtension,
  // Test helpers for the Phase 4A extras (console only):
  spawnBall: () => game.ball.spawn(game.zoe, game.bath),
  spawnBath: () => game.bath.spawn(game.zoe),
  endRound: () => { if (game.scene === 'play') game.timeLeft = 0.01; },
  // Theme helpers (T1): doxie.themes.state, doxie.themes.pick('spring')
  themes: { state: themeState, pick: pickTheme, ids: THEME_IDS },
};

// Count finished rounds for the theme reset rule.
game.onRoundEnd = () => themeRoundEnded();

// Menus and HUD buttons get first look at taps and keys (see menu.js).
// Audio is unlocked inside each gesture.
input.uiDown = (e, x, y) => menu.pointerDown(e, x, y);
input.uiUp = (e, x, y) => menu.pointerUp(e, x, y);
input.uiMove = (x, y) => menu.pointerMove(x, y);
input.uiKey = (e) => menu.key(e);
input.onPointerDown = () => { unlockAudio(); };  // mouse: pointerdown is the gesture that counts
input.onPointerUp = () => { unlockAudio(); };    // touch: pointerup is the gesture that counts
input.onDebugKey = () => { debug.on = !debug.on; };
window.addEventListener('touchend', unlockAudio, { passive: true });

const loop = createLoop(
  CONFIG.STEP,
  CONFIG.MAX_STEPS_PER_FRAME,
  (dt) => game.update(dt),
  (frameDt) => {
    // Sideways phone: show the "turn your phone" card and pause the round.
    if (input.usedTouch) screenShape.touchSeen = true;
    if (checkSideways(CONFIG.ROTATE_MAX_H)) menu.pause();
    if (frameDt > 0) debug.fps += (1 / frameDt - debug.fps) * 0.05;
    render(ctx, view, game, input, debug, menu);
  },
);

// Pause when hidden (tab switch, phone lock, popup closing) or when the
// window loses focus. The pause card waits for Resume.
function onHide() {
  menu.pause();
  input.clear();
  loop.stop();
}
window.addEventListener('blur', () => menu.pause());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') onHide();
  else loop.start();
});
window.addEventListener('pagehide', onHide);
window.addEventListener('pageshow', () => loop.start());

loop.start();
