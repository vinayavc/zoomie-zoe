# Phase 4C, Builder A notes: UI, layout and teaching

Built Oct 12, 2026, from `docs/phase-4c-fix-plan.md` ("Builder A"). The arena is still 400 × 600 and its walls, bounds and spawn areas are unchanged. Only the HUD and the touch controls moved.

## What changed
1. **Restart rule** (`menu.js`). Game over can only be restarted by the Play again button, Enter, or Space. That works only once the card has been up for `RESTART_LOCK` (0.75 s, new in config). Taps on empty space do nothing. A press has to *start* on Play again after the lock-out to count, so a drag held across the end of the round, or a press made during the lock-out, never restarts. Enter on a focused theme chip still picks that theme. Menu no longer uses `game.canRestart()` or `downSinceOver`.
2. **Layout** (`layout.js` → `FRAME` + `fitFrame()`, `view.js`, `render.js`). The canvas now fills the whole screen. The arena is placed inside it, and everything still uses arena px: the HUD band is at y < 0 and the touch band at y > 600.
   - **Banded layout** is used when it keeps at least `BAND_MIN_SCALE` (88%) of the arena's size. The HUD sits on its own paper band (`HUD_BAND_H` 64) above the arena, and runs straight into the arena's old top strip. That strip is still a wall and is now just a paper border. On touch devices, a band below the arena (`CTRL_BAND_MIN`..`CTRL_BAND_MAX`) holds a "hold and drag to steer" pad and the **CINCH button** (radius 40). The thumb-pad can still start anywhere.
   - On wide screens, the sides show the theme's letterbox color under paper grain, with a paper shadow under the arena. This is baked once per size and theme (`bakeSurround`), so each frame costs one blit.
   - The **extension popup** (and any screen too short for the bands, such as 400 × 600) keeps the classic layout: HUD on the strip, CINCH in the arena.
   - Art is now baked for `view.k` rather than for the canvas size.
   - The room is clipped to the arena, so critters and the bath sliding in never paint over the bands.
   - **Game-over card:** always in the same spot, at the bottom of the arena. Zoe naps in the room above it. At 1280 × 800 it is fully on screen (bottom edge at 797 of 800 CSS px).
   - **Popups** ("snap!", "+6"...) are clamped inside the arena and below the strip.
3. **Rotate card from load** (`platform.js` → `isTouchDevice()`: coarse pointer, or no-hover plus touch points, or a touch seen). `main.js` checks for a sideways phone before every update and every frame. Play, Restart, Resume and Play again are blocked while sideways (`menu.activate`). On the title, the card says "Play opens once it's upright."
4. **Hints match the device.** Touch shows "Hold and drag to steer · tap CINCH" (15 px, about 14 CSS px at 375 wide). Mouse and keyboard show "Mouse or arrows steer · Shift + arrow loops / Click or Space cinches · Esc pauses · M mutes". The how-to steps and tip line change the same way. The "cinch ready!" label is 14 px in the band (about 13 CSS px). The CINCH button shows from the start on touch devices.
5. **Title goal line:** "Swing Zoe's leash around the / *{theme loot}*, then cinch!" The title Zoe was made slightly smaller and flatter to make room.
6. **Cinch miss:** `sfx.whiff()` (a soft paper hiss and a falling note) is in `audio.js`. `render.js` watches `game.cinchMissT` jump up, then draws a paper and dust puff, a small "missed!" and an opening dashed ring.
7. **Snap warning** (render only). Where a critter is within `SNAP_WARN_DIST` (18) of snapping the part of the leash that can snap (past her body), that stretch trembles and flashes paper/red. It is off while `game.isCalm()`.
8. **Space** on the title always means Play. On game over it means Play again. Enter chooses the focused button.
9. **Theme caption** always shows the picked theme. Focus is shown by the dashed ring only.
10. **Pause card:** a **Quit to title** button was added (card height 400). It drops the round and resets the HUD to 0 / 60.
11. **How-to legend:** a Cheese row was added ("longer leash for a while"; a theme can override it with `words.cheese` / `words.cheeseTip`).
12. **Accessibility:** the canvas has `role="img"` and a descriptive `aria-label`. A visually hidden `#announce` live region says "Round over: score N, best M".
- **Ghost fix (orchestrator note):** 'float' critters now bob around their hitbox (lift ±2.5) instead of 5–7.5 px above it. The shadow stays at the hitbox.
- `doxie.frame` in the console shows the live layout.
- `sw.js`: no new files. `CACHE_VERSION` is now `'v4'`, and `check-precache.py` passes.

## Verified (built-in browser, localhost:8742)
- **375 × 812 touch:**
  - Banded layout: scale 0.9375, HUD band, a 190-unit touch band, and CINCH at (338, 695).
  - Title, how-to, play, pause and game-over cards all look right.
  - Snap warning seen on a staged dog. "missed!" seen. A "snap!" placed at y = 46 was drawn below the strip.
  - The HUD pause button in the band works, and Quit to title works.
- **Restart (scripted pointer and key events):**
  - A touch drag held across the round end and released on Play again → no restart.
  - Taps on the arena and on the band → no restart.
  - Button, Space and Enter during the lock-out → no restart.
  - A press during the lock-out released after it → no restart.
  - After the lock-out, Space, Enter and the button tap each restart.
  - Enter on a focused chip picks the theme.
  - Space on the title starts the game, even with another button focused.
- **740 × 360 (touch emulated):** the rotate card shows at load with no touch, and Play, Space and Enter don't start a round. Rotating mid-round pauses at once (timer frozen).
- **400 × 600:** classic layout. HUD on the strip, CINCH in the arena, and "splash!" below the strip.
- **1280 × 800:** banded, no touch band, scale 1.205. Arena spans x 399–881. Game-over card bottom at 797 of 800 CSS px (checked by numbers). The 800 × 500 look matches.
- The live region text was set after a round. No console errors. One Canvas2D `willReadFrequently` *warning* shows on load. It isn't from these changes (the paper-tile readback), and I left it.

## Not verified
- **812 × 375 with touch.** The pane only emulates touch below 768 px wide, so I tested 740 × 360 instead. The rule is the same on a real phone, since a coarse pointer gives a sideways rotate card.
- **Screenshots at 1280 × 800.** The pane's screenshots are wrong when the emulated size is larger than the pane: they show a half-size stale image. I checked the canvas pixels and the geometry directly, and used 800 × 500 for the look.
- Real phones, the real MV3 popup, audio by ear (whiff), and the safe-area insets with the new bands.

## Slim header (Vinny, Oct 12)
- In the banded layout, the old 44 px strip is now drawn slim (`render.js` → `bakeSlimStrip`, baked once per theme). The floor just below the strip is mirrored up over it, so it continues seamlessly. A light shade toward the top marks the edge zone, and a thin torn paper border (about 5 px) hangs off the HUD band.
- The strip is still a wall, and the bounds are unchanged.
- The popup and short-screen layout (400 × 600) is unchanged.
- Checked at 375 × 812 and 400 × 600 in Bedroom and Spring. No console errors.
- In Spring, the mirroring is faintly visible on the vine near the top-left.

## Notes / open questions
- The touch band's "hold and drag to steer" label stays under the thumb-pad while steering.
