# Phase 3A notes: Art (watercolor + paper cutout)

Built Oct 2, 2026 by the Art builder. Scope: `docs/phase-3-plan.md`, section 3A. **No gameplay changes.** Game files (`round.js`, `zoe.js`, `leash.js`, `items.js`, `dogs.js`, `input.js`, `main.js`, `config.js`, `audio.js`) were only read, never edited.

## What changed

| File | What it does |
|---|---|
| `src/js/render.js` | Rewritten. It blits the baked layers, then draws the leash, cinch preview, item stickers, dogs, Zoe, confetti, popups, the HUD, touch controls and the cards. It re-bakes when the canvas size changes, after 200 ms of stability. |
| `src/js/art/palette.js` (new) | All art colors (photo palette from the character sheet, **brown eyes**), the handwritten system-font stack, and Zoe's drawn proportions. |
| `src/js/art/util.js` (new) | Seeded RNG, hash noise, offscreen layers, closed Catmull-Rom spline, Hobbs-style midpoint deform, the `wash()` watercolor blob, and torn-paper outlines. |
| `src/js/art/bake.js` (new) | Baked once at load and on resize: a seamless paper-grain tile; the bedroom floor (an indigo/teal and dusty-pink floral bedspread as soft washes, a sunny two-pane window patch, two blue-grey sherpa blanket piles hugging the edges, gentle edge darkening, and the HUD's torn paper strip); torn-paper stickers for the sock, shoe and cheese; two cool-grey paper-cutout dogs; a glow sprite; two torn paper cards; and Zoe's two seamless fur-wash tiles (cream and apricot). |
| `src/js/art/zoe-art.js` (new) | Zoe as a paper puppet (see below). |
| `src/js/art/fx.js` (new) | Paper confetti when items are caught, and rope scraps when a dog snaps the leash. Both are detected render-side by diffing game state (`captures`, item slots, `dog.snapFxT`). |
| `src/style.css` | The letterbox is now a deep indigo-grey (`#4a4f66`) instead of flat grey. |

### Zoe (`zoe-art.js`)
- **Body:** a smooth closed outline around head + 10 segments, with a width profile and small fur scallops. Fill: cream wash pattern, apricot saddle along the spine (stacked soft strokes, so it fades out at the edges), an edge-darkening stroke, and a warm ink line that boils subtly at about 9 fps. She gets thinner as she stretches.
- **Head:** skull + muzzle union, saddle-toned top, a rosy liver nose with a highlight, and **two big brown eyes** with an ink rim and a white highlight. Soft worried brows.
- **Navy collar with a gold tag** behind the skull.
- **Ears:** pale cream, feathered, fully inked Verlet ropes, with a saddle shadow wash at the root and their own small cutout shadow. They stream back in a lunge and flop out when she's stunned.
- **Tail:** a feathered plume rope with an apricot root fading to a cream fringe, and a wag.
- **Legs:** four stubby cream legs on a gait cycle driven by her odometer.
- **Shadow:** a hard offset paper shadow (indigo-grey, no blur).
- **Lunge:** squash and stretch on the head (stretch during the lunge, squash after).
- **Stun:** head wobble and three orbiting gold stars.
- All animation state lives in `ZoeRig`, and springs step at a fixed 60 Hz. The title card draws a second, 3x-scale Zoe with the same rig.

### Other visuals
- **Leash:** a terracotta rope with a lighter twisted dash and a paper shadow. During cheese time it turns into a golden rope.
- **Cinch preview:** a stitched dashed thread with a shadow. Items it would catch get a pulsing sunny glow and a dotted thread ring.
- **Catch flash:** the loop fills with a sunlight wash and a stitched outline, then fades.
- **Dogs:** they waddle, and a paper "!" tag bobs over a chasing dog.
- **HUD and cards:** set in the handwritten system font. The timer sits in a watercolor stamp and turns rose in the last 10 seconds. Meters are rounded bars.
- **Touch controls:** paper discs, with a stitched pad ring and a cinch button ring.

## Screenshot description
Saved in `docs/screens/`:
- `3a-title-400x600.jpg`: a torn paper card over the dimmed bedroom, with "Doxie Arcade" in terracotta and a big Zoe across the middle: golden saddle, pale feathered ears framing the face, brown eyes, pink-brown nose, navy collar with a gold tag, and a feathery plume tail.
- `3a-play-cinch-preview-400x600.jpg`: Zoe curving through a turn with a curly rope leash. The stitched cinch line runs to a glowing shoe.
- `3a-play-catch-flash-400x600.jpg`: the caught loop washed in sunlight with a stitched outline, a "+1", and two dogs with "!" tags chasing.
- `3a-play-mobile-375x812.jpg`: phone size, with the indigo letterbox and the CINCH paper button.

## Performance (desktop Chrome, built-in browser)
- **Bake:** about 45–70 ms total (paper, room, stickers, dogs, cards, fur tiles) at k = 2 or 1.875. It runs synchronously before the first frame and once more after a resize.
- **Per frame:** about **0.6 ms** render time at an 800×1200 backing store, a steady 60 fps, and **0 `getImageData` calls** during play.
- **Never in the frame loop:** `ctx.filter`, `shadowBlur`, or SVG filters. All shadows are hard offset fills.
- **Per frame, Zoe allocates** about 5 small `Path2D` objects plus a few tiny arrays for the feather shapes. Everything else is blits.
- **DPR:** still capped at 2 by `view.js`.
- **Bug found and fixed:** at the phone size, the canvas height (1124) didn't match a computed size (1125), which caused a re-bake every 200 ms. The bake now records the real canvas size.

## Verified
- Title, play, game-over and paused cards at 400×600 and at the mobile preset (375×812).
- Played with keyboard events (← → steering, Space to start and cinch). Catches, the cheese leash, stun, dog snap, and a full 60-second round to game over all work.
- No console errors after the final reload.
- Resize re-bake happens exactly once.

## Not verified
- Real touch devices, iOS Safari, and the Chrome MV3 popup.
- CPU-throttled or low-end phone performance.
- The sounds (that's the 3B builder's work).

## Known issues and notes
- At in-game size, Zoe is small (about 60×17 px in the arena). Her ears read as a pale frame around the head rather than detailed ears. The title card shows her at full detail.
- The fur pattern is anchored at half of her head position, so the wash drifts slightly along her body as she runs. This is intended (it looks like paint), but it can be pinned if it bothers Vinny.
- Fonts: Chalkboard SE on Apple devices and Segoe Print on Windows. Android falls back to a rounded or system sans font.
- The blanket piles and window light are decor only. Zoe and items pass over them.
- **Seen once, not confirmed, pre-existing input behavior, not touched:** after pressing Space on the title, Zoe's cinch meter was already empty at 60 s. That suggests the start key may also queue a lunge. Worth a look in `input.js` or `round.js` by whoever owns them.
