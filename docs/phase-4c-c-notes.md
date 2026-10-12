# Phase 4C, Builder C: theme readability

Files changed: `src/js/themes/halloween.js` and `src/js/themes/christmas.js`. `spring.js` and `bedroom.js` were checked and left unchanged. No new files, so `sw.js` is untouched.

## Changes
**Spooky Night**
- **Pail (3 pt):** it's now a **violet trick-or-treat bucket** (palette `shoe` `#9A70DC`, `shoeDark` `#5B3A9A`). The bucket shape has a flat rolled rim, a tapered base and the same handle and candy. Its jack-o'-lantern face glows gold. The power-up stays a small round orange pumpkin with its glow, so the two differ in both colour (violet vs orange) and silhouette (handled bucket vs disc). Confetti from pails is now violet.
- **Ghosts:** the drawing is scaled to 0.82 (`g.scale` at the top of `bakeGhost`). The sheet went from about 35 x 28 px to about 29 x 23 px, close to the Bedroom dogs and the 12 px hitbox (crop with hitbox circles: `4c-c-after-halloween.jpg`).

**Cozy Christmas**
- **Ornaments (1 pt):** they're now silver-blue glass (`sock` `#86A9D8`) with a silver band, cap and loop. No gold or red is left on them, so red now means only Zoe's sweater and gold only the jingle ball (unchanged, still has its glow).
- **Reindeer pups:** variant 0 is now dark cocoa (`#5A3A2C`) with a cream muzzle, and both pups have a **cream paper halo** (`C.pupHalo`, 2.6 px). They now stand out on the wood floor as well as on the rug (`4c-c-before/after-christmas-pups-*.jpg`).
- Item stickers (ornament, present, cheese) now get their paper rim on the outside. See the bug below.

## Bug found (not my file): `offsetPts` in `art/util.js`
For shapes from `polygon()` (and any shape with the same winding), `offsetPts(pts, +d)` moves the outline **inward**. The "paper rim" and drop shadow behind those shapes are therefore hidden under the fill. This affects the Bedroom dogs' rim and shadow, Halloween's candy and ghost head, and others. In `christmas.js` I added a small local `outset()` that flips the sign if the shape shrank. I didn't touch `util.js` (Builder A/T-owned). Fixing it globally would visibly change every theme, so it's a decision for the orchestrator.

## Verified
- Port 8746, my own tab. For each of the four themes I set up an identical scene with a frozen frame: two of each item, cheese, the ball and two critters. I compared crops at 400x600 before and after (`docs/screens/4c-c-before-*.jpg`, `4c-c-after-*.jpg`) and took full frames at the mobile preset (`4c-c-after-<theme>-mobile.jpg`).
- At phone size, collectibles, power-up and critters were easy to tell apart in all four themes. Spring and Bedroom needed no change.
- No console errors. Bake times: christmas 19–25 ms, halloween 24–49 ms, spring 53–70 ms, bedroom 45 ms.
- Viewport reset and my tab closed.

## Not done / notes
- **Not tested:** a full played round in each theme, the how-to card and nap card for the recoloured items. The bakers are shared, so they should match.
- **Float lift:** the renderer draws `float` critters 5–7.5 px above their hitbox (shadow at the true spot). Ghosts can still look slightly "higher" than where they hit. That's in `render.js` (Builder A).
- **Bedroom yellow wedge:** this is the cheese (leash +50%). The how-to legend has no `words` field for cheese, so explaining it needs an interface or UI change (Builder A).
