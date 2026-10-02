// One control scheme for every device: a steering direction + one action.
//   Touch:    floating thumb-pad (follows the thumb past its edge);
//             action = second finger tap or the on-screen button
//   Mouse:    Zoe steers toward the cursor; action = click
//   Keyboard: left/right (A/D) rotate Zoe; up/down (W/S) do nothing; action = Space
// Whichever device was used last is in charge of steering.

import { CONFIG } from '../config.js';

// Rotational keyboard steering: left/right turn her; up/down are unused for now
// (still listed so the page doesn't scroll).
const KEY_DIRS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export class Input {
  constructor(view) {
    this.view = view;
    this.enabled = false;        // true only while a round is being played
    this.mode = 'none';          // 'keys' | 'mouse' | 'touch'
    this.usedTouch = false;      // show the on-screen stretch button
    this.keys = { up: false, down: false, left: false, right: false };
    this.mouse = { x: 0, y: 0 };
    this.pad = { active: false, id: -1, cx: 0, cy: 0, kx: 0, ky: 0 };
    this.buttonId = -1;          // touch currently holding the stretch button
    this.buttonDown = false;
    this.actionQueued = false;

    // Hooks set by main.js
    this.onPointerDown = () => {};
    this.onPointerUp = () => {};
    this.onConfirmKey = () => {};
    this.onDebugKey = () => {};

    this._p = { x: 0, y: 0 };
    this._bind();
  }

  _bind() {
    const opts = { passive: false };
    window.addEventListener('pointerdown', (e) => this._down(e), opts);
    window.addEventListener('pointermove', (e) => this._move(e), opts);
    window.addEventListener('pointerup', (e) => this._up(e), opts);
    window.addEventListener('pointercancel', (e) => this._up(e), opts);
    window.addEventListener('keydown', (e) => this._key(e, true));
    window.addEventListener('keyup', (e) => this._key(e, false));
    window.addEventListener('blur', () => this.clear());
    // Belt and braces against iOS zoom / long-press menus.
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Forget held keys and touches (on blur, pause, round start).
  clear() {
    this.keys.up = this.keys.down = this.keys.left = this.keys.right = false;
    this.pad.active = false;
    this.pad.id = -1;
    this.buttonId = -1;
    this.buttonDown = false;
    this.actionQueued = false;
  }

  consumeAction() {
    const a = this.actionQueued;
    this.actionQueued = false;
    return a;
  }

  // Desired heading for a head at (hx, hy) facing `heading`, or NaN for "keep going straight".
  steerAngle(hx, hy, heading) {
    if (this.mode === 'keys') {
      // Aim 90 degrees off the current heading, so she turns at her full turn rate
      // for as long as the key is held (holding one key = circling).
      const turn = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
      return turn === 0 ? NaN : heading + turn * Math.PI / 2;
    }
    if (this.mode === 'mouse') {
      const dx = this.mouse.x - hx, dy = this.mouse.y - hy;
      return dx * dx + dy * dy < CONFIG.MOUSE_DEADZONE * CONFIG.MOUSE_DEADZONE ? NaN : Math.atan2(dy, dx);
    }
    if (this.mode === 'touch' && this.pad.active) {
      const dx = this.pad.kx - this.pad.cx, dy = this.pad.ky - this.pad.cy;
      return dx * dx + dy * dy < CONFIG.PAD_DEADZONE * CONFIG.PAD_DEADZONE ? NaN : Math.atan2(dy, dx);
    }
    return NaN;
  }

  _inButton(x, y) {
    const dx = x - CONFIG.ACTION_BTN_X, dy = y - CONFIG.ACTION_BTN_Y;
    const r = CONFIG.ACTION_BTN_R + 6; // slightly generous hit area
    return dx * dx + dy * dy <= r * r;
  }

  _down(e) {
    if (e.cancelable) e.preventDefault();
    const p = this.view.toArena(e.clientX, e.clientY, this._p);
    if (e.pointerType === 'mouse') {
      this.mode = 'mouse';
      this.mouse.x = p.x; this.mouse.y = p.y;
      if (this.enabled && e.button === 0) this.actionQueued = true;
    } else {
      this.mode = 'touch';
      this.usedTouch = true;
      if (this.enabled) {
        if (this._inButton(p.x, p.y) && this.buttonId === -1) {
          this.buttonId = e.pointerId;
          this.buttonDown = true;
          this.actionQueued = true;
        } else if (!this.pad.active) {
          const pad = this.pad;
          pad.active = true; pad.id = e.pointerId;
          pad.cx = pad.kx = p.x; pad.cy = pad.ky = p.y;
        } else {
          this.actionQueued = true; // second finger = stretch
        }
      }
    }
    this.onPointerDown(e);
  }

  _move(e) {
    const p = this.view.toArena(e.clientX, e.clientY, this._p);
    if (e.pointerType === 'mouse') {
      this.mode = 'mouse';
      this.mouse.x = p.x; this.mouse.y = p.y;
      return;
    }
    const pad = this.pad;
    if (pad.active && e.pointerId === pad.id) {
      if (e.cancelable) e.preventDefault();
      pad.kx = p.x; pad.ky = p.y;
      // Dragging past the rim pulls the whole pad along with the thumb.
      const dx = pad.kx - pad.cx, dy = pad.ky - pad.cy;
      const d = Math.hypot(dx, dy), R = CONFIG.PAD_RADIUS;
      if (d > R) {
        pad.cx = pad.kx - (dx / d) * R;
        pad.cy = pad.ky - (dy / d) * R;
      }
    }
  }

  _up(e) {
    if (e.pointerId === this.pad.id) {
      this.pad.active = false;
      this.pad.id = -1;
    }
    if (e.pointerId === this.buttonId) {
      this.buttonId = -1;
      this.buttonDown = false;
    }
    if (e.type === 'pointerup') this.onPointerUp(e);
  }

  _key(e, down) {
    const dir = KEY_DIRS[e.code];
    // Shift+D toggles the debug overlay (plain D is "steer right").
    if (down && e.code === 'KeyD' && e.shiftKey) {
      this.onDebugKey();
      e.preventDefault();
      return;
    }
    if (e.code === 'Backquote' && down) {
      this.onDebugKey();
      return;
    }
    if (dir) {
      this.keys[dir] = down;
      if (down && (dir === 'left' || dir === 'right')) this.mode = 'keys';
      e.preventDefault();
      return;
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (down && !e.repeat) {
        if (this.enabled && e.code === 'Space') this.actionQueued = true;
        this.onConfirmKey(e);
      }
    }
  }
}
