// Art-only constants: colors, fonts and sizes used by the renderer.
// Game rules and collision sizes live in config.js; nothing here changes play.
// Zoe's colors come from docs/character-sheet.md (photo palette, brown eyes).

export const P = {
  // Zoe
  cream: '#F6EAD5',      // brightest fur
  paleCream: '#EBD9BC',  // ears, chest, belly, paws, tail fringe
  apricot: '#D9AA6E',    // saddle: back and top of head
  saddle: '#BF8C55',     // saddle shadow, ear-root wash, edge darkening
  ink: '#6B4A2F',        // warm burnt-umber outline
  nose: '#8C5B52',       // rosy liver, never black
  eye: '#2E211A',        // both eyes warm dark brown
  collar: '#2E3646',     // navy
  tag: '#C9A84C',        // gold
  blush: '#E7A79A',

  // Paper and shadows
  paper: '#FBF6EC',
  shadow: 'rgba(52,50,78,0.30)',   // indigo-grey cutout shadow, never black
  shadowSoft: 'rgba(52,50,78,0.18)',

  // Zoe's bedroom
  bed: '#A9B1C2',          // mid-value cool bedspread base
  bedDeep: '#949DB2',
  bedTone1: '#B4BACA',     // mottled washes on the bedspread
  bedTone2: '#9EA4BA',
  bedTone3: '#B9B4C4',
  vignette: '70,72,100',   // r,g,b of the gentle edge darkening
  indigo: '#3F4A73',
  teal: '#4E6A82',
  pink: '#D4A3A0',
  sherpa: '#7E8C9C',
  sherpaDark: '#5F6B7B',
  sherpaLight: '#A3AFBD',
  sun: '#F7E9C6',
  linen: '#D8D0C2',

  // Items (warm and saturated so they read as "loot")
  sock: '#CF5D6E',
  sockStripe: '#F6EAD5',
  shoe: '#9A5B34',
  shoeDark: '#6E3F24',
  sole: '#EFE4CF',
  cheese: '#F2C14E',
  cheeseDark: '#D49A2A',
  cheeseTop: '#F8D982',

  // Other dogs (cool, dark: "not Zoe")
  dog: '#5D5A68',
  dogDark: '#3E3B48',
  dogLight: '#8A8B98',
  dog2: '#6B7383',
  dog2Dark: '#474E5C',
  dogInk: '#2E2B36',       // critter outline
  dogEye: '#1E1B24',

  // Leash
  rope: '#C0654A',
  ropeLight: '#E59A7C',
  ropeCheese: '#D99A2B',
  ropeCheeseLight: '#F6D47E',
  thread: '#FBF6EC',

  // Phase 4A extras
  ball: '#E2603A',         // her red-orange ball
  ballDark: '#B2432A',
  ballSeam: '#F6EAD5',
  water: '#C4E0EA',        // soapy bath puddle
  waterDeep: '#86B3C8',
  waterInk: '#4E6A82',
  foam: '#FFFFFF',
  wetRope: '#6F8FA3',      // leash after a bath
  wetRopeLight: '#B4D0DC',
  dust: '#E6DCCB',         // zoomies dust puffs
  pawPad: '#D99A92',
  bubble: 'rgba(214,236,244,0.45)',     // bubbles rising off the bath
  bubbleRim: 'rgba(78,106,130,0.75)',
  foamRim: 'rgba(78,106,130,0.45)',
  ripple: 'rgba(255,255,255,0.7)',
};

// ---- Themes (T1) ----
// The Bedroom colors above are the base. A theme's `palette` overrides some of
// them while it is showing (see src/js/themes/README.md). Zoe's own colors are
// locked, so she always looks like Zoe.
export const BASE_P = { ...P };
export const LOCKED = ['cream', 'paleCream', 'apricot', 'saddle', 'ink', 'nose', 'eye', 'blush', 'pawPad'];

// Make P = base colors + these overrides (locked keys are ignored).
export function applyPalette(over) {
  Object.assign(P, BASE_P);
  if (!over) return;
  for (const key in over) if (!LOCKED.includes(key)) P[key] = over[key];
}

// Run fn() with P temporarily set to base + overrides, then put P back.
export function withPalette(over, fn) {
  const saved = { ...P };
  applyPalette(over);
  try { return fn(); } finally { Object.assign(P, saved); }
}

// Warm, handwritten-feeling system fonts. No web fonts are loaded.
export const HAND = '"Chalkboard SE", "Chalkboard", "Segoe Print", "Bradley Hand", "Marker Felt", "Comic Neue", ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif';

// Zoe's drawn proportions, in arena pixels (collision sizes are in config.js).
export const ZOE_ART = {
  skullRX: 8.6,
  skullRY: 8.0,
  muzzleX: 7.6,
  muzzleRX: 6.6,
  muzzleRY: 4.7,
  bodyW: [6.2, 8.0, 8.6, 8.4, 8.1, 7.9, 7.8, 7.8, 7.7, 7.3, 6.4], // half-widths, head -> rump
  ink: 1.6,
  shadowDX: 2.6,
  shadowDY: 3.6,
};
