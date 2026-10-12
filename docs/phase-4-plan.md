# Phase 4 Plan: Extras, Polish, Playtest, Ship

## In plain words
The game works, looks lovely, and makes happy noises. Phase 4 has four small steps, and each ends with Vinny trying it:
- **4A: Zoe's extras.** Add the rest of her personality to the game: her ball gives her the zoomies, blanket piles hide her from the other dogs, the bath slides in as a hazard, and she naps in a silly pose at the end.
- **4B: Polish.** Menus, a mute button, phone tuning, and the extension icon. A helper prepares the Chrome Web Store kit (icons, screenshots, store text, privacy note) at the same time.
- **4C: Fresh-eyes playtest.** A new agent that has never seen the code plays the game like a stranger and reports what's confusing or broken. We fix the top issues.
- **4D: Ship.** Put the web version online and package the extension. Vinny creates the Chrome Web Store developer account ($5) and clicks submit himself. We prepare everything else.

## 4A: Zoe's extras (gameplay)
The **rules stay as they are**; these are additions. Every number goes in `config.js`.
1. **Ball → zoomies.** A red-orange ball sometimes appears (at most 1 at a time). Touching it with her head starts **zoomies** for about 4 s: +40% speed, a faster turn rate, a little speed-lines and dust effect, and a happy bark. The ball is not a lasso item.
2. **Blanket piles → hiding.** The two sherpa piles already drawn become real zones. While Zoe's head is inside one, dogs **lose track of her** (they stop chasing and wander) and she is drawn partly tucked under the blanket. Her leash can still be snapped, so hiding isn't completely safe.
3. **Bath → hazard.** Every so often, starting after about 15 s, a soapy bath puddle with bubbles slides slowly across the arena, with a warning wobble first.
   - If Zoe's head touches it, she's "bath-shocked": a short stun, her leash gets wet (dragging, shorter for 3 s), and a splash sound.
   - Dogs avoid the bath too.
4. **Nap pose at the end.** At game over, Zoe flops into one of 3 odd sleeping poses (upside-down, donut curl, or loaf) before the "Zoe naps" card appears, with a sigh and floating "z"s.
5. **New sounds and art** for each of the above, in the same watercolor and paper style and the same synthesized-sound approach.

**Done means:** each extra is visible and readable at phone size, each is fun rather than annoying, the round still feels fair, and there are no console errors.

## 4B: Polish (4A approved by Vinny, Oct 2, 2026)
Already applied by the orchestrator after 4A: `ZOOMIES_SPEED_MULT` 1.3 and `DOG_LOST_TIME` 2.0.

1. **Hold-to-loop keys.** A tap of ← or → (A/D) heads Zoe toward screen-left or screen-right, as now. **Holding past `KEY_HOLD_LOOP_DELAY` (about 0.4 s) keeps her curving**, so a held key draws a circle.
   - Curve direction: keep rotating the way she was already turning to reach that side, so there's never a sudden reversal.
   - If she was already facing that side: ← curves counterclockwise on screen and → clockwise.
   - Release, or tap again, to go back to heading-mode. Mouse and touch don't change.
2. **Rename to Zoomie Zoe** everywhere the player can see it (see the carry-over list below), including regenerating the promo tile.
3. **Menus and cards**, in the same torn-paper style:
   - **Title:** Play, How to play, and a mute toggle.
   - **Pause** (Esc/P, or the tab losing focus): Resume, Restart, and mute.
   - **Game over:** Play again and the best score.
   - Everything works by tap, click, and keyboard (arrows or Tab to move, Enter or Space to choose).
4. **On-screen mute button** in the HUD, using `toggleMute()` and `isMuted()` from `audio.js`.
5. **How-to-play card** with 3 small illustrated steps (steer → swing an arc → cinch) and a legend for the ball, blankets, bath, and dogs. It shows automatically on the very first play (remember this with a storage flag) and is reachable from the title.
6. **Phone tuning:**
   - tap targets of at least 44 px, readable text at 375 px wide, the thumb-pad sized for thumbs
   - no scrolling, no pull-to-refresh, no double-tap zoom, and safe-area insets respected
   - a phone held in landscape still letterboxes cleanly
   - honor `prefers-reduced-motion` (no screen shake, gentler confetti)
7. **Manifest:** a new `description` from `store/listing.md` and `version` 1.0.0. Leave `icons` alone.
8. **Store screenshots:** 3–5 PNGs at 1280×800 in `store/screenshots/`, each showing the real game frame on a painted background with a one-line caption. Then fill in the screenshot TODO in `store/listing.md`.

**Not in 4B:** new gameplay, rule changes, retuning other numbers, and publishing anything.

## Ship kit (runs in parallel with 4A; touches no game code)
Owns `store/` and `src/icons/`, plus the `icons` and `action.default_icon` fields of `src/manifest.json` only.
- Procedurally drawn icons of Zoe's face at 16, 32, 48 and 128 px, made as PNGs by a small script.
- Store listing text: name, short description, long description, and single-purpose statement.
- Permission justification for `storage`, plus "no data collected, no remote code" answers.
- A short privacy policy page.
- A promo tile at 440×280, and screenshots at 1280×800 taken from the real game.
- A web-hosting guide (GitHub Pages).
- A step-by-step "what Vinny clicks" submission checklist.

## Carry-over to 4B (from the Ship kit)
- Replace the manifest `description` (it still says "Greybox prototype…") with the short description from `store/listing.md`, and raise `version` before the first zip.
- Take store screenshots (1280×800) once 4B is done, then fill the TODO in `store/listing.md`.
- **Rename to "Zoomie Zoe"** (tagline "a leash-lasso sock heist") everywhere the player can see it:
  - the title card, the page `<title>`, and the HUD
  - manifest `name`, `action.default_title`, and `description`
  - `store/listing.md`, `store/privacy.html`, and `store/web-hosting.md`
  - the promo tile, regenerated with `store/tools/icon-maker.html`

  Keep the internal storage keys (`doxieArcade.*`) so saved best scores aren't lost. Before submitting, search the Chrome Web Store for name clashes.
