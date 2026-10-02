// Boot: wire the view, input, game loop and scenes together.

import { CONFIG } from '../config.js';
import { isExtension } from './platform.js';
import { View } from './view.js';
import { Input } from './input.js';
import { createLoop } from './loop.js';
import { unlockAudio } from './audio.js';
import { Game } from './game/round.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const view = new View(canvas, stage);
const input = new Input(view);
const game = new Game(input);
const debug = { on: new URLSearchParams(location.search).has('debug'), fps: 60 };

// Handy for live tuning from the browser console: doxie.config.ZOE_SPEED = 170
globalThis.doxie = { config: CONFIG, game, isExtension };

// "Tap to play" / restart / resume. Audio is unlocked inside the gesture.
function proceed() {
  if (game.paused) {
    game.paused = false;
    input.enabled = game.scene === 'play';
  } else if (game.scene === 'title') {
    game.start();
  } else if (game.canRestart()) {
    game.start();
  }
}

input.onPointerDown = () => {
  unlockAudio(); // mouse: pointerdown is the gesture that counts
  if (game.scene === 'over') game.downSinceOver = true;
};
input.onPointerUp = () => {
  unlockAudio(); // touch: pointerup is the gesture that counts
  if (game.scene === 'over' && !game.downSinceOver) return; // finger held from gameplay
  if (game.scene !== 'play' || game.paused) proceed();
};
input.onConfirmKey = () => {
  unlockAudio();
  if (game.scene !== 'play' || game.paused) proceed();
};
input.onDebugKey = () => { debug.on = !debug.on; };
window.addEventListener('touchend', unlockAudio, { passive: true });

const loop = createLoop(
  CONFIG.STEP,
  CONFIG.MAX_STEPS_PER_FRAME,
  (dt) => game.update(dt),
  (frameDt) => {
    if (frameDt > 0) debug.fps += (1 / frameDt - debug.fps) * 0.05;
    render(ctx, view, game, input, debug);
  },
);

// Pause when hidden (tab switch, phone lock, popup closing).
function onHide() {
  game.pause();
  input.enabled = false;
  loop.stop();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') onHide();
  else loop.start();
});
window.addEventListener('pagehide', onHide);
window.addEventListener('pageshow', () => loop.start());

loop.start();
