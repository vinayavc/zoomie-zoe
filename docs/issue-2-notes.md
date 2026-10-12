# Issue #2 notes: double-tap to cinch (phones)

Built Oct 12, 2026 on branch `issue-2-double-tap-cinch`.

## What changed
- **`src/js/input.js`**: the steering finger (the touch that starts the thumb-pad) is watched. A *tap* is down < `TAP_MAX_MS` (250 ms) and moves ≤ `TAP_MAX_MOVE` (12 CSS px). If a tap starts within `DOUBLE_TAP_MS` (300 ms) of the previous tap ending, and within `DOUBLE_TAP_DIST` (60 CSS px) of it, the cinch fires when the second tap lifts. This is the same action the CINCH button queues.
  - The thumb-pad still starts on pointerdown, so steering has no added delay. A single tap never waits.
  - A third tap starts a new pair, so a triple tap cinches once.
  - A second finger (an existing cinch) cancels the pending tap. A drag, a long press, or a cancel also resets it.
  - Menus, cards and HUD buttons never reach this code, because `menu.pointerDown` takes those presses and `input.enabled` is false off-round. `clear()` (round start, pause) forgets the last tap.
- **Cooldown cue**: `main.js` sets `input.canCinch` (ready and not stunned). A double-tap while she isn't ready does not cinch. It sets `input.notReadyAt`, and the CINCH button wiggles with a small "not ready" note for `NOT_READY_CUE` (0.5 s). No sound.
- **Hints (`render.js`)**:
  - The title and pause hint now reads "Drag to steer · double-tap to cinch". "Hold and" was dropped so the line fits the card.
  - The touch-band pad now has a second line, "double-tap to cinch".
  - How-to step 3 reads "double-tap / to pull it shut", with the tip "The CINCH button or a 2nd finger works too".
- **`config.js`**: the new tunables are at the end. No existing number changed.
- **`sw.js`**: `CACHE_VERSION` is `v7`. `check-precache.py` reports OK and no files were added.
- The CINCH button's size and spot are unchanged. Double-tap is the fix for reach.

## Verified (built-in browser, 375 × 812 mobile preset, scripted touch PointerEvents)
- Cinches:
  - a double-tap on the arena
  - a double-tap in the control band
  - two taps with a small wiggle (about 6 px)
  - the CINCH button and a second-finger tap (both still work)
- No cinch:
  - a drag then a tap
  - a tap then a drag
  - taps 450 ms apart
  - two 320 ms holds
  - two taps far apart
  - four steering drags back to back
- A triple tap gives one cinch. A quadruple tap gives one cinch plus a "not ready" cue.
- **During the cooldown**, a double-tap does not cinch and the cue shows. I checked it in a screenshot.
- **The thumb-pad** is active right at pointerdown.
- **Cards**:
  - A double-tap on the title (card, band, Play) only starts the round, with no cinch.
  - On the pause card, a double-tap on empty space keeps it paused. A double-tap on Resume resumes, with no cinch.
  - A double-tap while she naps does nothing.
  - On game over, a double-tap on Play again during the lock-out does nothing, and so does one on empty space after it.
  - After the lock-out, a double-tap on Play again restarts once, with no cinch.
- No zoom: `visualViewport.scale` stays 1, and `touch-action: none` is on the body and canvas. The existing `dblclick` and `gesturestart` preventDefault are still in place.
- No console errors. I looked at the how-to card and the band labels in screenshots.

## Not verified
- Real phones (iOS Safari, Android Chrome). This includes real double-tap zoom, which the emulator can't fully show, and how 250 / 300 ms feel under a thumb.
- The 400 × 600 popup layout after this change. The code path is the same, and the cue draws above the in-arena CINCH button.
- A double-tap right after Play again, in the same script. The test pane kept going hidden, which pauses the game, so this run was flaky. The same case passed after tapping Play on the title.

## Notes
- The cinch fires on the second tap's *release*, so it lands about 50–100 ms after the finger goes down. Firing on the second press would be faster, but a tap-then-drag would then cinch.
- The touch hint shown can switch to the mouse version after a real mouse click in the emulator. That is how the existing device detection behaves and was not changed here.

## Follow-up from the playtest (docs/issue-2-playtest.md)
- **B3, cue by the thumb**:
  - A touch cinch during the cooldown or a stun now goes through `input._touchCinch(x, y)`. That covers a double-tap, a second finger and the CINCH button.
  - It stores `notReadyX/Y`, and `render.js` → `drawNotReady` draws "not ready" just above that point.
  - The note is kept inside the arena: x between 40 and 360, and y below the HUD strip and above the arena bottom. So a tap in the control band shows the note just above the band.
  - If the CINCH button was pressed, the note stays above the button.
  - The button wiggle stays.
  - New: pressing the CINCH button during the cooldown now shows the cue too. Before, it silently did nothing.
- **B1, Play after How-to → Back: not reproducible.** Play started on the first tap 5 times out of 5, with gaps of 30, 100, 300, 300 and 500 ms after Back. The menu code has no lock-out there. The playtester's miss happened at 1–2 fps, so it was most likely the throttling.
- **B2, pad hint on hybrid devices: fixed.**
  - The baked touch-band pad now follows the same last-input rule as the card hints. With mouse or keys it reads "mouse or arrows steer / click or Space cinches".
  - The bake key includes this mode, so it rebakes only when the mode changes.
  - Limit: a touch on a menu card does not switch the mode back to touch, because `uiDown` returns before the mode is set. This was already the case. The first touch in play switches the cards and the pad back together, so they stay consistent.
- `CACHE_VERSION` stays `v7`, and `check-precache.py` passes.
- Verified at 375 × 812 with the mobile preset, with screenshots of the cue placement (band, top edge, button) and of the mouse pad hint. No console errors.
