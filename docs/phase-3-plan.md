# Phase 3 Plan: Art and Sound

## In plain words
The game already works and Vinny likes it. Now we **paint over the grey boxes**: Zoe becomes a watercolor paper cutout of herself, the arena becomes her bedroom, and the socks and cheese look like little torn-paper stickers. At the same time, a second builder gives every action a sound: squeaks, boops, tiny barks. **The rules of the game don't change at all.**

## Decisions (Vinny, Oct 2, 2026)
- **Setting:** Zoe's bedroom. The floral bedspread is the floor, with blue-grey sherpa blanket piles and a sunny window, all from the reference photos.
- **Extras** (ball and zoomies, blanket hiding, the bath, napping pose) come in **Phase 4**, not now.
- **Sound:** effects only, no music. Everything is generated in code with Web Audio.

## Two builders working in parallel, each with its own files

### 3A: Art builder
**Owns:** `src/js/render.js` and any new files under `src/js/art/`, plus `src/style.css`. It may **read** game state but must not change game rules in `round.js`, `zoe.js`, `leash.js`, `items.js`, or `dogs.js`. Any animation-only state (wag timers, ear springs) lives on the render side.

Follow `research/art-scout.md` Option 1 ("paper puppet with baked watercolor") and `docs/character-sheet.md` (the photo palette and **brown eyes**).
1. **Bake once at load**, behind the title screen, into offscreen canvases:
   - paper grain
   - the bedroom floor: indigo and dusty-pink floral bedspread motifs as soft watercolor washes
   - a sunny window patch and blanket-pile props along the arena edges (decor only)
   - torn-paper item stickers: sock, shoe, cheese wedge
   - other dogs as cool-grey paper cutouts
   - keep backgrounds mid-tone and cool so cream Zoe stands out
2. **Zoe:**
   - a stretchy cutout around her existing segment chain, with a width profile and a smooth outline
   - a cream base with an apricot saddle, pale ears separated by a shadow wash and the ink line, a rosy liver nose, brown eyes with highlights, and a navy collar with a gold tag
   - springy ears and tail (Verlet), stubby legs on a gait cycle, and a hard offset paper shadow
   - the lunge squashes and stretches her
3. **Leash:** a soft rope line in a warm color, with a paper shadow. The cinch preview becomes a dotted stitched line, and the would-catch items get a gentle glow.
4. **Juice visuals:** paper-confetti particles on a catch, the existing hit-stop and flash restyled to suit watercolor, and stun stars or wobble on a dog hit.
5. **UI:** the title and game-over cards on torn paper, a warm handwritten-feel system font (no web fonts), and the HUD restyled to match.
6. **Performance:**
   - no `ctx.filter`, `shadowBlur`, or SVG filters in the frame loop
   - pixel density capped at 2
   - re-bake on resize
   - check that it still runs smoothly at 400×600 and at phone size

### 3B: Sound builder
**Owns:** `src/js/audio.js`. It may add **one-line** `play…()` calls in `round.js` at existing event points, and nothing else in `round.js`. It must not touch rendering.
1. One `AudioContext`, unlocked on "Tap to play" as now. A small master gain, plus an **M key to mute**. Keep its key listener inside `audio.js` so no other file changes. It persists through the existing storage adapter, and `audio.js` exports `isMuted()` and `toggleMute()`. The on-screen mute button comes in Phase 4 with the menus.
2. Synthesized effects, all short and cute, none harsh:
   - round start: a happy yip
   - steering: no sound
   - cinch: a rope whoosh plus a snap
   - each item caught: a soft pop, with pitch rising along the chain (keep the existing chain idea)
   - a big catch (4+ items): a little "arf!" bark
   - dog bump: a grumbly "boof" plus a bonk
   - leash snapped: a twang
   - cheese: a squeaky-toy squeak
   - last 10 seconds: a soft tick each second
   - round over: a sleepy sigh or yawn
3. Respect autoplay rules and iOS interruptions: resume the context on a gesture and on `visibilitychange`. No audio files at all.
4. Expose a tiny test page or console hook (`doxie.sfx.<name>()`) so each sound can be auditioned.

## Not in this phase
New gameplay or rule changes, ball and zoomies, blankets as hiding spots, the bath, menus, icons, and the Web Store.

## Done means (Vinny judges)
1. Zoe reads as Zoe: blonde, feathery pale ears, plumed tail, brown eyes, navy collar.
2. It looks like a watercolor storybook with paper cutouts, not like a flat vector game.
3. Every action has a sound that's satisfying and not annoying after 10 rounds.
4. It is still smooth on a phone and in the popup, with no console errors and no CSP problems.
