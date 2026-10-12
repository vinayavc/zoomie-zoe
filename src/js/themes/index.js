// The theme registry and which theme is picked.
//
// Each theme is one module in this folder (interface: README.md). Any field a
// theme leaves out falls back to the Bedroom's, so a theme file only needs the
// parts it changes.
//
// Rules (docs/phase-4-themes-pwa-plan.md, T1):
// - The picked theme and its finished-round count are saved
//   (doxieArcade.theme, doxieArcade.themeRounds). One best score for all themes.
// - After CONFIG.THEME_ROUNDS finished rounds in a non-default theme, the pick
//   goes back to the Bedroom and the game-over card says so. The room on screen
//   only changes when the next round starts (or when the player picks a chip).

import { CONFIG } from '../../config.js';
import { applyPalette } from '../art/palette.js';
import { setSoundTwist } from '../audio.js';
import { getValue, setValue } from '../storage.js';
import bedroom from './bedroom.js';
import halloween from './halloween.js';
import christmas from './christmas.js';
import spring from './spring.js';

const THEME_KEY = 'doxieArcade.theme';
const ROUNDS_KEY = 'doxieArcade.themeRounds';

// Fill in anything a theme leaves out from the Bedroom.
function withDefaults(t) {
  return {
    ...bedroom,
    ...t,
    chip: { ...bedroom.chip, ...t.chip },
    costume: { ...bedroom.costume, ...t.costume },
    words: { ...bedroom.words, ...t.words },
    sfx: t.sfx || {},
    palette: t.palette || {},
  };
}

// Picker order.
export const THEMES = [bedroom, halloween, christmas, spring].map(withDefaults);
export const THEME_IDS = THEMES.map((t) => t.id);

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export const themeState = {
  picked: CONFIG.THEME_DEFAULT,  // the chip that is highlighted; next round plays in it
  shown: CONFIG.THEME_DEFAULT,   // the room on screen now
  rounds: 0,                     // finished rounds in the picked theme
  resetNote: false,              // true on the game-over card right after the auto-reset
};

function show(id) {
  themeState.shown = id;
  const t = getTheme(id);
  applyPalette(t.palette);
  setSoundTwist(t.sfx);
  try { document.body.style.background = t.letterbox; } catch { /* no DOM */ }
}

function save() {
  setValue(THEME_KEY, themeState.picked);
  setValue(ROUNDS_KEY, themeState.rounds);
}

// The player tapped a chip: show it now and start counting from zero.
export function pickTheme(id) {
  themeState.picked = getTheme(id).id;
  themeState.rounds = 0;
  themeState.resetNote = false;
  show(themeState.picked);
  save();
}

// A round is starting: if the pick changed behind the card (auto-reset), show it now.
export function themeRoundStarted() {
  themeState.resetNote = false;
  if (themeState.shown !== themeState.picked) show(themeState.picked);
}

// A round finished (time ran out). Returns true if the pick went back to the Bedroom.
export function themeRoundEnded() {
  if (themeState.picked === CONFIG.THEME_DEFAULT) return false;
  themeState.rounds++;
  if (themeState.rounds >= CONFIG.THEME_ROUNDS) {
    themeState.picked = CONFIG.THEME_DEFAULT;
    themeState.rounds = 0;
    themeState.resetNote = true;
  }
  save();
  return themeState.resetNote;
}

// Rounds left before the auto-reset (for the game-over card), or 0 in the Bedroom.
export function roundsLeft() {
  if (themeState.picked === CONFIG.THEME_DEFAULT) return 0;
  return CONFIG.THEME_ROUNDS - themeState.rounds;
}

// Load the saved pick. Runs before the first frame on the web (localStorage).
Promise.all([getValue(THEME_KEY, CONFIG.THEME_DEFAULT), getValue(ROUNDS_KEY, '0')]).then(([id, n]) => {
  themeState.picked = getTheme(id).id;
  themeState.rounds = Math.max(0, Math.min(CONFIG.THEME_ROUNDS - 1, Number(n) || 0));
  show(themeState.picked);
});
show(CONFIG.THEME_DEFAULT);
