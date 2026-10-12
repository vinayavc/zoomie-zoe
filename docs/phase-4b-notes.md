# Phase 4B notes: Polish

Built in two sittings. The first 4B builder was stopped partway through, and this second pass checked its work in the running game, filled the gaps and finished the store rename. Store screenshots (plan item 8) are deliberately **not** done yet: they wait until the theme system is in.

## What changed in 4B (compared with `archive/phase-4a-extras/`)
- **Hold-to-loop keys** (`src/js/input.js`, `KEY_HOLD_LOOP_DELAY` 0.4 s in `config.js`). A tap of ← / → heads Zoe to that side, as before. If you hold the key longer, she keeps curving in a circle in the direction she was already turning. If she already faced that side, ← curves counterclockwise and → clockwise. Release the key or tap it again to go back to heading-mode.
- **Menus** (`src/js/menu.js` new, `src/js/layout.js` new). There are torn-paper cards for Title (Play, How to play, Sound), Pause (Resume, Restart, Sound) and Game over (Play again, best score). `layout.js` holds every card and button rectangle, so drawing and hit-testing always match. Cards and buttons are baked in `art/bake.js` and drawn in `render.js`.
- **HUD sound and pause buttons** on either side of the timer. They call `toggleMute()` and `isMuted()` from `audio.js`.
- **How-to-play card**: three illustrated steps (steer, swing, cinch) plus a legend for the ball, blankets, bath and dogs, and the hold-to-circle tip. It shows automatically before the very first round (storage flag `doxieArcade.howtoSeen`) and can be opened from the title.
- **Phone tuning** (`style.css`, `index.html`). The body is pinned (no scroll, rubber-band or pull-to-refresh). `touch-action: none` stops double-tap zoom, the page uses `viewport-fit=cover` with safe-area padding, the thumb knob is bigger (`PAD_KNOB_R`), and tap targets are at least 44 CSS px on a 375 px-wide phone.
- **Reduced motion** (`platform.js` → `motion.reduced`, kept live). Confetti and puffs are fewer and slower (`REDUCED_CONFETTI`). *This pass also added:* the game-over card fades in place instead of sliding (`render.js`, `drawNapCard`). The game has no screen shake, so there was nothing to turn off there.
- **Rename to Zoomie Zoe** in the page `<title>`, canvas label, title card, comments, manifest `name`, `action.default_title` and `description`, and manifest `version` 1.0.0. The `icons` fields and `src/icons/*.png` are untouched. The storage keys stay `doxieArcade.*`.
- **Pause on focus loss.** Blur, a hidden tab and pagehide all open the Pause card, which waits for Resume.
- **Store (this pass).** `listing.md`, `privacy.html`, `web-hosting.md` and `submit-checklist.md` now say "Zoomie Zoe" with the tagline "a leash-lasso sock heist". The suggested GitHub repo and Pages slug changed from `doxie-arcade` to `zoomie-zoe`. The listing now mentions the 4A extras and the on-screen pause and sound buttons. The storage justification and the privacy page now list **three** saved values (best, sound, how-to seen) instead of two. The old "Action for the Builder" note about the manifest is resolved.
- **Promo tile regenerated**: `store/promo-440x280.png` now reads "Zoomie / Zoe" with "a leash-lasso / sock heist" (text changed in `store/tools/icon-maker.html`). It is saved as a 24-bit PNG with no alpha, which the store's image rules ask for.

## Controls
| Action | Touch | Mouse | Keyboard |
|---|---|---|---|
| Steer | thumb-pad (drag anywhere) | Zoe follows the cursor | ↑ ↓ ← → or W A S D point her toward that side (two keys = diagonal); hold to keep running that way |
| Loop | n/a | n/a | Shift + arrow: curve into a circle (Revision 3) |
| Cinch | CINCH button or a second finger | click | Space |
| Pause | ⏸ HUD button | ⏸ HUD button | Esc or P (also automatic when the window loses focus) |
| Sound on/off | 🔈 HUD button, or the Sound button on cards | same | M |
| Menu: move | tap a button directly | hover | ↑ ↓ ← → / W A S D, Tab / Shift+Tab |
| Menu: choose | tap (fires on release) | click | Enter or Space |
| Menu: back | n/a | n/a | Esc closes How to play or resumes from Pause |
| Play again | the button, or a tap anywhere on the card | same | Enter or Space |

**Revision 3 (Vinny, Oct 11, 2026).** Keyboard steering changed after 4B, see `docs/phase-2-plan.md`. Hold-to-loop and `KEY_HOLD_LOOP_DELAY` are gone. Arrows and WASD now point Zoe toward that screen direction at the normal turn rate, the shortest way, with diagonals when two keys are held. Shift + arrow curves her into a loop. The loop keeps the way she was turning toward that arrow's heading, so it never reverses. If she already faces that way, ← and ↑ curve counterclockwise and → and ↓ clockwise. Releasing Shift goes back to pointing. When a card is open, Shift + arrow just moves menu focus. The debug overlay is now **Backquote only**, because Shift+D is a loop key. Only `src/js/input.js` and `config.js` changed.

Game-over guard: nothing restarts until `NAP_CARD_DELAY` (1.6 s) plus `RESTART_GUARD` (0.35 s) has passed, and a finger or mouse button held down since gameplay doesn't count when it lifts.

## What I verified (Chromium in the desktop app's browser pane, dev server :8742)
- **No console errors** on load, in play, on any card, or in the icon maker.
- **400×600:** title, how-to (shown automatically on first Play, and the flag gets saved), play HUD, pause and game-over cards all render correctly with no overlaps.
- **Hold-to-loop:** I called `steerAngle()` directly. Facing right and holding → turns clockwise. Facing left and holding ← turns counterclockwise. Facing up, a tap of → turns clockwise and a hold keeps going clockwise. Facing down, holding → keeps going counterclockwise (no reversal). Releasing goes back to straight. I also held a key live and Zoe's heading kept rotating past a full circle.
- **Pause:** Esc pauses. Arrows and Tab move focus (with wrap-around). Enter on Sound toggles it and saves `doxieArcade.muted`. P resumes. The HUD sound and pause buttons work by click. Restart works by click. A window blur pauses the game.
- **Game-over card (re-tested):** Enter during the nap and during the guard does nothing. A click on Play again and a tap elsewhere during the guard do nothing. After the guard, Enter restarts, Space restarts, a click on Play again restarts, and a tap anywhere restarts. An auto-repeating held Space doesn't restart. A pointer held down since gameplay and released after the guard doesn't restart.
- **Title keyboard:** Tab and Shift+Tab cycle Play, How to play and Sound. Esc closes How to play. M toggles mute.
- **Mobile preset (375×812):** the canvas scales to 0.9375 (375×562, letterboxed top and bottom) with no page scroll. Touch-type pointer events resume from Pause and bring up the thumb-pad and CINCH button. Smallest tap targets: menu side buttons and Play again ≈45 CSS px, HUD buttons ≈45 px.
- **812×375 landscape phone:** it letterboxes cleanly at 250×375 with no scroll.
- **Promo tile:** I read the PNG back. It is 440×280, 8-bit RGB, and the title and tagline fit inside the paper card.

## Not verified / needs real hardware
- **Real phone:** safe-area insets (notch and home bar), pull-to-refresh and double-tap zoom actually being blocked, how the thumb-pad feels under a thumb, audio unlocking on iOS Safari, and whether pagehide or visibilitychange pauses correctly on lock.
- **Real Chrome popup:** the extension wasn't loaded unpacked in this pass. Still to check: the 400×600 pin, `chrome.storage` for the new how-to flag, and that blur fires when the popup closes (the popup is destroyed anyway, so a lost round is expected).
- **prefers-reduced-motion:** checked by reading the code only. I didn't emulate the OS setting.
- **Hold-to-loop timing** used synthetic key events. Real OS key-repeat delays vary, but the code only uses `e.repeat` to tell a fresh press from a repeat, so the timing shouldn't matter.

## Known issues
- In phone **landscape**, the whole game is scaled down to 0.625, so tap targets drop to about 30 CSS px. This is inherent to letterboxing a portrait game. Portrait is the intended phone orientation.
- Some secondary text (the "cinch ready!" label and the "Esc or P pauses · M mutes" hint) is 13 arena px, about 12 CSS px on a 375 px phone. It's readable but small.
- The zip filename from `store/tools/make-zip.sh` is still `doxie-arcade-<version>.zip`. Players never see it, so I left it alone.

## Theme picker: where it would hook in (not started)
- `layout.js` → `buttonsFor()` title branch: add a row such as `btn('theme', 'Theme: Cozy', ...)`. The title card (`CARDS.title`, 324×420) has its free space at the bottom, where the "Esc or P pauses · M mutes" hint sits (`render.js` `drawTitle`, `b.y + 394`). Either replace that hint line with the row, or raise `CARDS.title.h` (the card is baked from `CARDS`, so its art follows automatically).
- `menu.js` → `activate()`: add a `case 'theme'`. The button cache key in `buttons()` would need the current theme name, like the muted flag, so the label refreshes.
- Saving the choice: reuse the `storage.js` adapter with a key such as `doxieArcade.theme`.

## Open questions for Vinny
1. Is the GitHub repo and Pages address `zoomie-zoe` OK, instead of `doxie-arcade`?
2. Is landscape on phones a "works, but small" case, or should it show a "turn your phone" hint later?
