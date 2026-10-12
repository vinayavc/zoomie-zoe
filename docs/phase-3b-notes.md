# Phase 3B notes: Sound

All sound lives in `src/js/audio.js`. No audio files: every effect is a few oscillators and/or a looped white-noise buffer, through a Biquad filter, shaped by a gain envelope, into one master gain (`CONFIG.MASTER_VOLUME`, 0.25) and a gentle compressor so stacked sounds never clip.

## Sounds

| Event (where) | Call | Recipe | Length |
|---|---|---|---|
| Round start (`Game.start`) | `sfx.yip()` | Two quick "yip-yip" chirps: triangle + a little square, pitch 700→1150→820 Hz (second one ~2 semitones higher), through a 2.6 kHz lowpass | ~0.25 s |
| Steering | none | | |
| Cinch / stretch (`update`, when the stretch fires) | `sfx.cinch()` | Whoosh: bandpass noise sweeping 350→2600 Hz with a soft swell. Snap at +0.14 s: tiny highpass noise click + sine 1400→350 Hz | ~0.2 s |
| Items caught (`_closeLoop`) | `sfx.caught(chain, n)` | One soft pop per item (max 6), staggered 55 ms. Pop = sine with a quick pitch drop (1.5×→1×) + faint triangle overtone. Pitch starts at `BLIP_BASE_HZ` and climbs `BLIP_SEMITONES_PER_CHAIN` per chain step and +2 semitones per item in the loop, capped at +19 semitones (~1.6 kHz) so it never gets shrill. Random ±1% detune | 0.09 s per pop, ≤0.4 s |
| Big catch, 4+ items (inside `caught`) | `sfx.arf()` | Small bark after the pops: sawtooth (lowpassed 1.7 kHz) + triangle, pitch 420→610→480→320 Hz, with a short breathy noise onset | ~0.17 s |
| Cheese caught (`_closeLoop`) | `sfx.squeak()` | Squeaky toy "squee-eek": sine 900→1750→1350 Hz with fast 28 Hz vibrato, a faint airy hiss, then a shorter second squeak. Starts 60 ms late so the first pop lands first | ~0.37 s |
| Dog bump (`_updateDogs`) | `sfx.boof()` | Bonk (sine 320→120 Hz + triangle click), then a low "boof": sawtooth 150→210→110 Hz through a 650 Hz lowpass with a 32 Hz amplitude wobble (the grumble) | ~0.33 s |
| Leash snapped (`_updateDogs`) | `sfx.twang()` | Plucked string: triangle + quiet sawtooth 262→200 Hz, 7 Hz vibrato, lowpass sweeping 3.2 kHz→500 Hz, short noise transient | ~0.42 s |
| Last 10 seconds (`update`, every step) | `sfx.countdown(timeLeft, dt)` → `sfx.tick(sec)` | Soft woodblock: sine 1150 Hz with a small drop + faint overtone; 1500 Hz for the last 3. Fires once per whole second, 10 down to 1 (silent at 0) | ~0.05 s |
| Round over (`_endRound`) | `sfx.sigh()` | Sleepy yawn "aah-ooo": sawtooth through a resonant lowpass (vowel sweep 700→1500→450 Hz) + triangle, pitch 330→440→220 Hz, slow vibrato, breathy noise | ~1 s |

## Context, autoplay, mute

- One `AudioContext`, created/resumed by `unlockAudio()` inside the existing tap/click/Space/Enter handlers in `main.js`, plus a keydown listener in `audio.js` (so arrow keys and M also count). Resumes from `'suspended'` and iOS `'interrupted'`; plays a silent 1-sample buffer for old iOS.
- `visibilitychange`: hidden → `suspend()`; visible → try `resume()` (if the browser refuses, the next tap/key does it).
- Sounds only play when the context is running (or within 400 ms of a resume request, so the first round's yip isn't lost). Nothing is queued into a long-suspended context.
- **M key** toggles mute (ignored with Cmd/Ctrl/Alt and on key repeat). The master gain glides to 0 over ~15 ms (no click). Saved via `storage.js` (`doxieArcade.muted`, chrome.storage.local in the extension, localStorage on the web). `audio.js` exports `isMuted()` and `toggleMute()`.

## Click and leak safety

- Every envelope starts at 0.0001 (−80 dB), ramps up (2–200 ms attack), and ramps back to 0.0001 before its source stops (stop = end + 20 ms).
- Each sound collects its nodes in a small "kit"; when its last source ends, every node is disconnected. Verified in the browser by counting node creation vs `disconnect()`: 170 created, 170 disconnected across all auditions plus live play.
- Each sound is wrapped in try/catch, so a sound failure can never break the game.

## Audition

From the console after one tap/click: `doxie.sfx.yip()`, `.cinch()`, `.pop(chain, i)`, `.arf()`, `.caught(chain, n)`, `.boof()`, `.twang()`, `.squeak()`, `.tick(sec)`, `.sigh()`, `.toggleMute()`, `.isMuted()`, `.state()` (AudioContext state).

## Files touched outside audio.js

- `src/js/game/round.js`: import line changed to `import { sfx }`; one-line calls added at: start, cinch, cheese, catch (replaces `blip`), dog bump and leash snap (replace `bonk`), round over, and `sfx.countdown(...)` after the clock decrements (the "last 10 s" event point didn't exist; the check itself lives in `audio.js`).
- `src/js/main.js`: one line, `globalThis.doxie = { ...globalThis.doxie, ... }`, so it keeps the `sfx` that `audio.js` registers.
- `src/js/storage.js`: added `getMuted()` / `setMuted()` (same adapter pattern as the best score).
- `blip()` and `bonk()` were removed from `audio.js` (nothing else used them). The `BLIP_*` config values are still used by the pops.

## Known issues / not tested

- I can't hear audio: the recipes are checked in code and by node counts only. Vinny should listen for balance (twang and boof can fire often when dogs crowd the leash).
- Not tested on a real iPhone (interrupted state, silent switch). `navigator.audioSession` was not used: the hardware silent switch still mutes the game, which is arguably polite.
- `visibilitychange` suspend/resume not exercised (the test browser can't hide the tab).
- The dev server sends no cache headers, so the browser kept stale modules after edits. A hard reload (or cache-bypassing fetch) was needed.
- The on-screen mute button is Phase 4.
