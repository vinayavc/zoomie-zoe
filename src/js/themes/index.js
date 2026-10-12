// The theme registry and which theme is picked.
//
// Each theme is one module in this folder (interface: README.md). Any field a
// theme leaves out falls back to the Bedroom's, so a theme file only needs the
// parts it changes.
//
// The picked theme is saved (doxieArcade.theme) and stays until the player
// picks another. One best score for all themes.

import { CONFIG } from '../../config.js';
import { applyPalette } from '../art/palette.js';
import { setSoundTwist } from '../audio.js';
import { getValue, setValue } from '../storage.js';
import bedroom from './bedroom.js';
import halloween from './halloween.js';
import christmas from './christmas.js';
import spring from './spring.js';

const THEME_KEY = 'doxieArcade.theme';

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
  picked: CONFIG.THEME_DEFAULT,  // the highlighted chip and the room on screen
};

function show(id) {
  themeState.picked = id;
  const t = getTheme(id);
  applyPalette(t.palette);
  setSoundTwist(t.sfx);
  try { document.body.style.background = t.letterbox; } catch { /* no DOM */ }
}

// The player tapped a chip: show it now and save it.
export function pickTheme(id) {
  show(getTheme(id).id);
  setValue(THEME_KEY, themeState.picked);
}

// Load the saved pick. Runs before the first frame on the web (localStorage).
getValue(THEME_KEY, CONFIG.THEME_DEFAULT).then((id) => show(getTheme(id).id));
show(CONFIG.THEME_DEFAULT);
