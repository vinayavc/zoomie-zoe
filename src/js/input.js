// One control scheme for every device: a steering direction + one action.
//   Touch:    floating thumb-pad (follows the thumb past its edge);
//             action = second finger tap or the on-screen button
//   Mouse:    Zoe steers toward the cursor; action = click
//   Keyboard: arrows / WASD point Zoe toward that side of the screen (two keys
//             = a diagonal); holding keeps her running that way;
//             Shift + arrow curves her into a loop; action = Space
// Whichever device was used last is in charge of steering.
// Menus (menu.js) get first look at keys and at taps on their buttons.

import { CONFIG } from '../config.js';
import { wrapAngle } from './geom.js';

// Keyboard steering (Revision 3): each key points her toward that side of the screen.
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
    // Shift-loop (keys): Shift held, and which way she curves while looping
    // (+1 = clockwise on screen, -1 = counterclockwise).
    this.shift = false;
    this.lastDir = 'right';      // most recent arrow pressed (breaks ties for diagonals)
    this.loopSign = 0;
    this.looping = false;

    // Hooks set by main.js
    this.onPointerDown = () => {};
    this.onPointerUp = () => {};
    this.onDebugKey = () => {};
    this.uiDown = () => false;   // (e, x, y) -> true if a menu/HUD button took the press
    this.uiUp = () => {};
    this.uiMove = () => {};
    this.uiKey = () => false;    // (e) -> true if the menu used the key

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
    this.shift = false;
    this.loopSign = 0;
    this.looping = false;
  }

  consumeAction() {
    const a = this.actionQueued;
    this.actionQueued = false;
    return a;
  }

  // Desired heading for a head at (hx, hy) facing `heading`, or NaN for
  // "keep going straight". Called once per simulation step.
  steerAngle(hx, hy, heading) {
    if (this.mode === 'keys') {
      // Point: arrows aim her at that side of the screen (two keys = a diagonal),
      // turning at her normal rate, the shortest way. No key = keep going straight.
      // Shift + arrow: curve into a loop. The curve keeps the way she was turning
      // toward that arrow's heading, so it never snaps into a reversal; if she
      // already faces that way, left/up curve counterclockwise and right/down clockwise.
      const k = this.keys;
      const x = (k.right ? 1 : 0) - (k.left ? 1 : 0);
      const y = (k.down ? 1 : 0) - (k.up ? 1 : 0);
      if (x === 0 && y === 0) { this.looping = false; return NaN; }
      const target = Math.atan2(y, x);
      const d = wrapAngle(target - heading);
      if (!this.shift) {
        this.looping = false;
        return target;
      }
      if (!this.looping) {
        if (Math.abs(d) > 0.02) this.loopSign = d > 0 ? 1 : -1;
        else this.loopSign = this.lastDir === 'left' || this.lastDir === 'up' ? -1 : 1;
        this.looping = true;
      }
      return heading + this.loopSign * Math.PI / 2; // always more than one step away: full turn rate
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
    if (e.pointerType === 'mouse') { this.mode = 'mouse'; this.mouse.x = p.x; this.mouse.y = p.y; }
    else this.usedTouch = true;
    if (this.uiDown(e, p.x, p.y)) {
      this.onPointerDown(e);
      return;
    }
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
      this.uiMove(p.x, p.y);
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
    if (e.type === 'pointerup') {
      const p = this.view.toArena(e.clientX, e.clientY, this._p);
      this.uiUp(e, p.x, p.y);
      this.onPointerUp(e);
    }
  }

  _key(e, down) {
    const dir = KEY_DIRS[e.code];
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.shift = down;
    else this.shift = e.shiftKey;
    // Backquote toggles the debug overlay (Shift+D now curves Zoe into a loop).
    if (e.code === 'Backquote' && down) {
      this.onDebugKey();
      return;
    }
    if (down && this.uiKey(e)) {
      e.preventDefault();
      return;
    }
    if (dir) {
      if (down) {
        this.mode = 'keys';
        if (!e.repeat) this.lastDir = dir;
      }
      this.keys[dir] = down;
      e.preventDefault();
      return;
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (down && !e.repeat && this.enabled && e.code === 'Space') this.actionQueued = true;
    }
  }
}
