// Menus: which paper card is showing, its buttons, keyboard focus, and what
// each button does. Works the same by tap, click and keyboard:
//   arrows or Tab / Shift+Tab move the focus, Enter or Space chooses,
//   Esc or P pause and resume, M mutes (handled in audio.js).
// The title and game-over cards also carry the theme picker: one chip per theme.

import { CONFIG } from '../config.js';
import { buttonsFor, hitButton } from './layout.js';
import { isMuted, toggleMute, unlockAudio } from './audio.js';
import { getFlag, setFlag } from './storage.js';
import { THEME_IDS, pickTheme, themeRoundStarted, themeState } from './themes/index.js';
import { screenShape } from './platform.js';

const HOWTO_KEY = 'doxieArcade.howtoSeen';

export class Menu {
  constructor(game, input) {
    this.game = game;
    this.input = input;
    this.howto = '';          // '' | 'first' (before the very first round) | 'title' (opened from the title)
    this.howtoSeen = false;
    this.focus = 0;           // index into the current screen's buttons
    this.pressId = -1;        // pointer holding a button down
    this.pressBtn = null;
    this.overCardY = CONFIG.ARENA_H / 2; // set by the renderer at game over
    this._key = '';
    this._list = [];
    this._screen = '';
    getFlag(HOWTO_KEY).then((v) => { if (v) this.howtoSeen = true; });
  }

  // 'rotate' (sideways phone) | 'title' | 'howto' | 'play' | 'pause' | 'over' | 'napping' (before the card shows)
  screen() {
    const g = this.game;
    if (screenShape.sideways) return 'rotate';
    if (this.howto) return 'howto';
    if (g.scene === 'title') return 'title';
    if (g.scene === 'play') return g.paused ? 'pause' : 'play';
    return g.overT >= CONFIG.NAP_CARD_DELAY ? 'over' : 'napping';
  }

  isOpen() {
    const s = this.screen();
    return s !== 'play';
  }

  // Current buttons (rebuilt only when something they show changes).
  buttons() {
    const screen = this.screen();
    const muted = isMuted();
    const key = screen + '|' + muted + '|' + this.howto + '|' + Math.round(this.overCardY) + '|' + themeState.picked;
    if (key !== this._key) {
      this._key = key;
      this._list = buttonsFor({ screen, muted, howtoFirst: this.howto === 'first', overCardY: this.overCardY, themes: THEME_IDS });
      if (screen !== this._screen) { this.focus = 0; this._screen = screen; }
      if (this.focus >= this._list.length) this.focus = 0;
    }
    return this._list;
  }

  focused() {
    const s = this.screen();
    if (s === 'play' || s === 'napping' || s === 'rotate') return null;
    return this.buttons()[this.focus] || null;
  }

  // A button is enabled unless it's "Play again" during the restart guard.
  enabled(b) {
    return b.id !== 'again' || this.game.canRestart();
  }

  // ---------------------------------------------------------------- actions

  activate(b) {
    if (!b || !this.enabled(b)) return;
    unlockAudio();
    switch (b.id) {
      case 'play':
        if (!this.howtoSeen) this._openHowto('first');
        else this._start();
        break;
      case 'howto':
        this._openHowto('title');
        break;
      case 'go': {
        const first = this.howto === 'first';
        this.howto = '';
        if (first) this._start();
        break;
      }
      case 'sound':
      case 'mute':
        toggleMute();
        break;
      case 'pause':
        this.pause();
        break;
      case 'resume':
        this.resume();
        break;
      case 'restart':
      case 'again':
        this._start();
        break;
      case 'theme':
        pickTheme(b.themeId);   // the renderer bakes its art on the next (menu) frame
        break;
      default:
        break;
    }
  }

  _openHowto(mode) {
    this.howto = mode;
    if (!this.howtoSeen) {
      this.howtoSeen = true;
      setFlag(HOWTO_KEY, true);
    }
  }

  _start() {
    this.howto = '';
    themeRoundStarted();
    this.game.start();
  }

  pause() {
    if (this.game.scene !== 'play' || this.game.paused) return;
    this.game.pause();
    this.input.enabled = false;
  }

  resume() {
    if (!this.game.paused) return;
    this.game.paused = false;
    this.input.clear();
    this.input.enabled = this.game.scene === 'play';
  }

  // ---------------------------------------------------------------- pointer

  // Returns true if the pointer landed on a button (so it doesn't steer or cinch).
  pointerDown(e, x, y) {
    const s = this.screen();
    if (s === 'rotate') return true;
    if (s === 'over' || s === 'napping') this.game.downSinceOver = true;
    if (s === 'napping') return true;
    const b = hitButton(this.buttons(), x, y);
    if (!b) return s !== 'play'; // on a card screen, taps never reach the game
    this.pressId = e.pointerId;
    this.pressBtn = b;
    if (b.kind !== 'hud') this.focus = this.buttons().indexOf(b);
    return true;
  }

  // Activate on release over the same button (touch audio unlocks on pointerup).
  pointerUp(e, x, y) {
    const s = this.screen();
    if (s === 'rotate') { this.pressId = -1; this.pressBtn = null; return; }
    const was = this.pressId === e.pointerId ? this.pressBtn : null;
    this.pressId = -1;
    this.pressBtn = null;
    if (was) {
      const b = hitButton(this.buttons(), x, y);
      if (b && b.id === was.id) { this.activate(b); return; }
    }
    // Game over: a tap anywhere also means "Play again" (unless the finger was held from gameplay).
    if (s === 'over' && this.game.downSinceOver && this.game.canRestart()) this._start();
  }

  // Mouse hover moves the focus, so the highlighted button is the one under the cursor.
  pointerMove(x, y) {
    const s = this.screen();
    if (s === 'play' || s === 'napping' || s === 'rotate') return;
    const list = this.buttons();
    const b = hitButton(list, x, y);
    if (b) this.focus = list.indexOf(b);
  }

  isPressed(b) {
    return this.pressBtn !== null && this.pressBtn.id === b.id;
  }

  // ---------------------------------------------------------------- keyboard

  // Called on every keydown. Returns true if the menu used the key.
  key(e) {
    const s = this.screen();
    const code = e.code;
    if (s === 'play') {
      if ((code === 'Escape' || code === 'KeyP') && !e.repeat) { this.pause(); return true; }
      return false;
    }
    if (code === 'KeyM') return false; // audio.js toggles mute
    if (s === 'napping' || s === 'rotate') return true; // nothing to choose
    const list = this.buttons();
    const n = list.length;
    if (code === 'ArrowUp' || code === 'ArrowLeft' || code === 'KeyW' || code === 'KeyA' || (code === 'Tab' && e.shiftKey)) {
      this.focus = (this.focus - 1 + n) % n;
      return true;
    }
    if (code === 'ArrowDown' || code === 'ArrowRight' || code === 'KeyS' || code === 'KeyD' || code === 'Tab') {
      this.focus = (this.focus + 1) % n;
      return true;
    }
    if ((code === 'Enter' || code === 'Space' || code === 'NumpadEnter') && !e.repeat) {
      this.activate(list[this.focus]);
      return true;
    }
    if ((code === 'Escape' || code === 'KeyP') && !e.repeat) {
      if (s === 'pause') this.resume();
      else if (s === 'howto' && code === 'Escape') this.howto = '';
      return true;
    }
    return false;
  }
}
