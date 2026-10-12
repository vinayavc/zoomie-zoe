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
