# Phase 4 T1 notes: theme engine, picker and the sideways-phone card

Built Oct 11, 2026. Scope: `docs/phase-4-themes-pwa-plan.md`, section "T1" and "Added Oct 11". There are no gameplay changes: rules, numbers and hitboxes are identical in every theme.

## What's built
- **Theme registry** in `src/js/themes/`: `index.js` (registry and pick state), `bedroom.js` (the default and reference), and the placeholder stubs `halloween.js`, `christmas.js` and `spring.js`. **`src/js/themes/README.md` documents the module interface and has a checklist for the T2 artists.** A theme can leave out any field except `id`, `name` and `chip`; missing fields fall back to the Bedroom's.
- **Bedroom moved** into `themes/bedroom.js` (backdrop, hiding piles, sock/shoe/cheese, dogs, ball, bath, bubble, blanket flap). The shared helpers it needs (`offsetPts`, `pathPts`, `smoothPts`, `grain`, `grainAtop`) moved from `art/bake.js` to `art/util.js`. A few literal colors became same-valued palette keys (`bedTone1–3`, `vignette`, `cheeseTop`, `dogInk`, `dogEye`, `bubble`, `bubbleRim`, `foamRim`, `ripple`) so the other themes can recolor them.
- **Palette swap** (`art/palette.js`): `BASE_P`, `LOCKED` (Zoe's own colors can't be overridden), `applyPalette()` and `withPalette()`. Shared art (cards, buttons, chips, fur tiles) is always baked in the base colors. `fx.js` now reads confetti colors when an effect fires, so they follow the theme.
- **Bake split** (`art/bake.js`): `bakeShared()` (paper, glow, cards, buttons, chips, fur) and `bakeTheme(theme, shared)`. The renderer caches one baked art set per theme. The first time a theme is shown, it gets baked (~50–70 ms; ~160 ms for the very first bake after a cold load). After that it's cached. A resize drops the cache and re-bakes only the theme on screen.
- **No bakes during play:** a theme is only baked when picked (on a card) or at load. The theme on screen is always the picked one, so it is already baked when a round starts.
- **Costume hooks** on Zoe's rig (`art/zoe-art.js`): `costume.body` (after her body, in arena space), `costume.head` (last, over her ears, in head space), and `costume.hideCollar`. They apply to play, the title Zoe, the how-to pictures and the nap.
- **Critter motion** (`render.js` → `drawDogs`): `'waddle'` (as before), `'hop'` (bounce with squash/stretch plus a floor shadow), `'float'` (bob plus a floor shadow). This is visual only.
- **Sound twists** (`audio.js`): `setSoundTwist(spec)`. `pop` is data (`wave`, `pitch`, `vibrato`). `catchLayer(a, t, chain, n)` plays on top of each catch. `over(a, t)` replaces the round-over sigh. `a` is a small synth toolkit (`voice`, `hiss`, `lfo`, `filter`, `env`, `out`, `rnd`, `semis`), and every node it makes is cleaned up.
- **Picker:** a row of 4 torn-paper chips (60×48) on the title and game-over cards, with a "Theme: …" caption showing the focused or picked theme. The picked chip is lifted with a rope-colored ring, and keyboard focus is a dashed ring. Chips work by tap, click, arrows/Tab and Enter/Space. Choosing a chip re-skins the room at once. The title card grew (h 512, cy 312), as did the game-over card (h 304) and the pause card (h 340).
- **Theme persistence:** the picked theme is saved in `doxieArcade.theme` and stays until the player picks another. One best score is shared by all themes. `storage.js` gained `getValue` / `setValue`. *(The 3-round auto-reset built first was dropped by Vinny on Oct 11 and removed: no `THEME_ROUNDS`, no `doxieArcade.themeRounds`, no `Game.onRoundEnd`, no rounds or reset lines on the game-over card. The game-over card shrank to h 304.)*
- **Theme letterbox:** the page background around the canvas follows the theme.
- **Sideways phone** (`platform.js` → `checkSideways`, checked every frame in `main.js`): the card shows on a coarse-pointer device (or once a real touch has been seen) when the screen is wider than tall and under `ROTATE_MAX_H` (520 CSS px) tall. It never shows in the extension, on laptops (fine pointer) or on tablets (too tall). It shows a torn-paper card: "Turn your phone!", a sketched phone turning upright, and Zoe standing tall. The round pauses, and once you rotate back the normal Pause card waits for Resume. While the card is up, taps and keys are swallowed.
- **Control text (Revision 3)** is updated on the title, pause and how-to cards to "Arrows / WASD steer · Shift + arrow loops · Space cinches" (split over two lines with "Esc or P pauses · M mutes"). How-to step 1 now reads "or arrow keys". I didn't touch `input.js` or the `KEY_*` config.
- **Config** (new): `THEME_DEFAULT`, `THEME_ROUNDS`, `THEME_CHIP_W/H/GAP`, `CRITTER_HOP_HZ`, `CRITTER_HOP_H`, `ROTATE_MAX_H`.
- **`src/sw.js`:** the 5 theme JS files were added to `FILES` and `CACHE_VERSION` is now `'v2'`. All listed paths return 200. Nothing else changed.
- **Placeholders:** each stub has stand-in art so every hook is exercised. Halloween has a witch-hat head, `float` ghosts, a pop vibrato and an owl "hoo-hoo" for the round-over sound. Christmas has a red sweater band on her body, `hideCollar` and a bell jingle. Spring has a flower-dot crown, `hop` bunnies and a chirp. Each also has a chip icon and words. T2 replaces all of this.

## Verified (built-in browser, http://localhost:8742)
- **Bedroom unchanged, pixel for pixel:** I hashed every baked Bedroom layer (bg, sock, shoe, cheese, both dogs, ball, bath, bubble, tuck, glow, a menu button) at k=2 before and after the refactor. All 12 match. The before/after gameplay screenshots at 400×600 (seeded spawns, frozen update) look the same: `docs/screens/t1-bedroom-before-400x600.jpg` and `t1-bedroom-after-400x600.jpg`. The only intended visual changes are the menu cards (picker row, hint text).
- **Picker:** a click on the Halloween chip at 400×600 and a tap on the Spring chip at the mobile preset each re-skinned the room and the letterbox. Keyboard: Tab×3 then Enter on the game-over card picked Christmas.
- **All three placeholders** show in play, on the title and on the game-over card. No console errors.
- **Persistence (after dropping the reset, tested on :8747):** 5 rounds finished in Spring via `doxie.endRound()` all stayed Spring; after a reload it was still Spring; the game-over card shows no rounds line; no console errors; `doxieArcade.themeRounds` is never written.
- **Shared best:** a new best of 12 set in Spring showed as "Best 12" in the Bedroom and Christmas too.
- **Reload:** a saved theme (and count) comes back after a reload, and the first frame bakes only that theme.
- **Sound hooks:** with the AudioContext running, each stub's `catchLayer` / `over` ran without errors through `caught()` and `sigh()`. I couldn't hear them.
- **Frame time:** 600 scripted play frames in Halloween with the ball and bath active took median 0.30 ms render CPU, p99 0.9 ms, max 1.4 ms. No bake ran during play (`doxie.art.themes` only listed the picked themes).
- **Sideways:** at 767×375 (touch emulated, coarse pointer) the card showed and the round paused. Back at the mobile preset, the Pause card showed. At 812×375 the pane doesn't emulate touch, so there was no card (correct for desktop), and with `touchSeen` forced on, the card showed.
- **Resize:** a size change re-baked once and kept only the shown theme.

## Not verified
- Real phones (actual rotation, `pointer: coarse` on iOS/Android), the MV3 popup and real audio.
- A live rAF frame-rate trace: the browser pane was hidden for most of the session, so I timed `render()` directly instead.
- `prefers-reduced-motion` on the rotate card (it stops the phone animation, by reading the code).

## Known issues and notes
- Testing used shared `localStorage` on localhost:8742. I restored `doxieArcade.best` to 9 and the theme to `bedroom/0` afterwards.
- The placeholder art is deliberately rough (for example, the critter recolors don't touch every shade, and the stand-in costumes are crude).
- In landscape on a phone, the rotate card is drawn inside the letterboxed 250×375 canvas, so it's small but readable.
