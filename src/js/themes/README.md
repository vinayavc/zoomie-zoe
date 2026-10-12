# Themes: the module interface

Each theme is one file in this folder: `bedroom.js` (the default and the
reference), `halloween.js`, `christmas.js` and `spring.js`. A theme file
`export default`s one plain object. **Every field except `id`, `name` and
`chip` is optional**: anything you leave out falls back to the Bedroom's
(`index.js` → `withDefaults`). So a theme can start as a recolor and grow one
piece at a time.

A T2 artist edits **only their own theme file**, plus an optional
`<name>-sfx.js` next to it if the sound twist needs more code. Import helpers
from `../art/util.js` and colors from `../art/palette.js` freely; don't edit them.

**The rules never change between themes.** Hitboxes, speeds, spawn rules and
scoring all live in `config.js` and the game code. A theme only changes what
things look and sound like. Keep sprites about the size of the Bedroom ones
(see the table), so what the player sees matches what they can hit.

## The fields

| Field | Type | What it is |
|---|---|---|
| `id` | string | `'halloween'` etc. Also the saved value of `doxieArcade.theme`. |
| `name` | string | Shown on the picker caption: "Theme: Spooky Night". |
| `chip` | `{ color, ink }` | Picker chip paper color and its edge color. |
| `drawChipIcon(g)` | function | Draws the chip's icon with canvas calls, centred on 0, 0, about 24 × 24 arena px. Vector only: it runs before the theme's art is baked. |
| `letterbox` | CSS color | Page background around the game. |
| `palette` | object | Overrides of keys in `art/palette.js` (`P`) while this theme is showing, and while its art is baked. **Zoe's own keys are locked** (cream, paleCream, apricot, saddle, ink, nose, eye, blush, pawPad). Useful keys: bed, bedDeep, bedTone1–3, vignette (`'r,g,b'`), indigo, teal, pink, sun, sherpa/sherpaDark/sherpaLight, sock/sockStripe, shoe/shoeDark/sole, cheese/cheeseDark/cheeseTop, dog/dogDark/dogLight/dog2/dog2Dark/dogInk/dogEye, ball/ballDark/ballSeam, water/waterDeep/waterInk/foam/foamRim/ripple/bubble/bubbleRim, wetRope/wetRopeLight, rope/ropeLight (leash), dust. Confetti uses sock / shoe / cheese / ball / water / sherpa colors, so those flow through automatically. |
| `bakeBackground(k, paper)` | → layer | The whole 400 × 600 floor: backdrop, **the two hiding spots drawn on the outlines in `CONFIG.BLANKETS`** (the game uses those exact outlines), the HUD paper strip across the top `CONFIG.HUD_H` px, and the frame. |
| `bakeItem(type, k, paper)` | → layer | `type` is `'sock'` (the 1-pt item), `'shoe'` (the 3-pt item) or `'cheese'` (leash +50%). Drawn centred. Bedroom sizes: 28 × 28, 34 × 34, 28 × 28. |
| `bakeCritter(variant, k, paper)` | → layer | The two hazard critters (`variant` 0 or 1), seen from above, **facing +x**. Set `L.ox, L.oy` to the critter's centre in the layer. Bedroom: 50 × 50, body radius `CONFIG.DOG_RADIUS` (12). |
| `critterMotion` | `'waddle'` \| `'hop'` \| `'float'` | Looks only (same path, hitbox and AI). `waddle` rocks side to side. `hop` bounces with squash and stretch; `float` bobs and sways. For `hop` and `float` the renderer draws a floor shadow, so **don't bake a shadow into the sprite**. Tunables: `CRITTER_HOP_HZ`, `CRITTER_HOP_H`. |
| `bakeBall(k, paper)` | → layer | The zoomies ball, radius `CONFIG.BALL_RADIUS` (8) in a 26 × 26 layer. No shadow: the renderer bounces it over a floor shadow. |
| `bakeHazard(k, paper)` | → layer | The sliding bath puddle (hit area: ellipse `BATH_RX` × `BATH_RY`, 30 × 19). Set `L.ox, L.oy` to its centre. |
| `bakeHazardBubble(k, paper)` | → layer | A small sprite (14 × 14) that floats up off the hazard. |
| `bakeHideFlap(k, paper)` | → layer | The flap pulled over Zoe's head while she hides (40 × 40, facing +x; her eyes and nose should peek out at +x). Also the hiding-spot icon on the how-to card. |
| `costume` | object | `{ hideCollar, bake, body, head }`, see below. |
| `sfx` | object | `{ pop, catchLayer, over }`, see below. |
| `words` | object | How-to legend text: `ball, ballTip, hide, hideTip, hazard, hazardTip, critters, critterTip, critterTip2`. |

A **layer** comes from `makeLayer(w, h, k)` in `art/util.js`: `{ c, g, w, h }`,
where `g` is already scaled so you draw in arena px. `paper` is the shared
grain tile; use `grain(L, paper, a)` (whole layer) or `grainAtop(L, paper, a)`
(cutouts with clear edges) for the paper texture. Bakers run once, at bake time,
so they can be as slow and layered as you like (`wash`, `deform`,
`tornOutline` ...). Seed every random choice with `makeRng(n)` so the art is
the same on every load.

### Costume (drawn live on Zoe's rig every frame: keep it cheap)
- `hideCollar: true` hides the navy collar and gold tag (e.g. under a sweater).
- `bake(k, paper)` → anything (optional). Bake costume sprites here; the result
  is passed to `body` and `head` as `sprites`.
- `body(ctx, z, sprites)`: runs after her body is painted, before her head, in
  arena space. `z = { pose, n, jx, jy, ja, jw, t }`: `n` joints from head (0) to
  rump (n − 1), their positions, forward-facing angles (radians) and half-widths; `t` is the
  rig clock in seconds; `pose.nap` is `''`, `'belly'`, `'donut'` or `'loaf'` at
  game over (her body is belly-up for `'belly'`).
- `head(ctx, z, sprites)`: runs last, over her ears, in her head's own space:
  origin = skull centre, +x toward her nose, 1 unit = 1 arena px (skull is about
  8.6 × 8, the nose tip about x = 14). It follows the lunge squash and stun wobble.
- The same costume shows on the title Zoe (3×), the how-to pictures and the nap
  (2×). Her face, coat and brown eyes must stay recognizable: keep hats behind
  the eyes (x < 1) and clear of the nose.
- No `ctx.filter`, `shadowBlur` or new canvases per frame. `ctx` is saved and
  restored around each hook.

### Sound twist (`sfx`)
- `pop: { wave, pitch, vibrato: [rateHz, depthHz] }`: data only. Changes the
  per-item catch pop (`wave` `'sine'`/`'triangle'`/`'square'`/`'sawtooth'`,
  `pitch` multiplier, `vibrato` for a wobble).
- `catchLayer(a, t, chain, n)`: an extra sound on top of every catch (`n` items,
  `chain` level). Start it at `t` or a little later.
- `over(a, t)`: plays **instead of** the round-over sigh, at time `t`.
- `a` is a small synth toolkit from `audio.js`. Every node it makes is
  disconnected when the sound ends, and errors are swallowed:
  - `a.voice(type, t, dur, peak, curve, dest?, attack?)`: one oscillator; `curve` = `[[hz, secondsAfterT], ...]`. Returns the oscillator.
  - `a.hiss(t, dur, peak, filterType, f0, f1, q, dest?, attack?)`: filtered noise sweeping f0 → f1.
  - `a.lfo(t, end, rateHz, depth, [audioParams])`: vibrato or tremolo.
  - `a.filter(type, hz, q, dest?)` and `a.env(t, attack, peak, end, dest?)` to build chains.
  - `a.out` (master), `a.ac` (the AudioContext), `a.rnd(amount)` (≈1 ± amount/2), `a.semis(n)`.
- Keep peaks around 0.1–0.4 and lengths under a second; the master compressor
  catches the rest. Mute and the volume setting apply automatically.

## Checklist for a theme artist
1. Copy the shape of `bedroom.js`; keep `id`, set `name`, `chip`, `letterbox`.
2. Start with `palette` overrides and check the result: the Bedroom bakers read
   the palette, so this alone gives a working recolor.
3. Replace the bakers one at a time: `bakeBackground` (hiding spots on
   `CONFIG.BLANKETS`!), `bakeItem` ×3, `bakeCritter` ×2, `bakeBall`,
   `bakeHazard`, `bakeHazardBubble`, `bakeHideFlap`.
4. Set `critterMotion` (`'hop'` for bunnies; `'float'` suits ghosts).
5. Add the `costume` (`body` and/or `head`, `hideCollar`); check it on the
   title card, in play, and in all three nap poses.
6. Draw `drawChipIcon`.
7. Add the `sfx` twist (data first; functions if needed, or a `<name>-sfx.js`).
8. Set `words` for the how-to legend.
9. If you add a new file (e.g. `<name>-sfx.js`), add it to `FILES` in `src/sw.js`.
10. Test: pick the theme on the title card, play a round at 400 × 600 and at the
    mobile preset, open the how-to card, finish a round (`doxie.endRound()`),
    check the nap card. Console: no errors; `doxie.art.themes` shows your bake
    time (aim for under ~150 ms on a laptop). Console helpers:
    `doxie.themes.pick('spring')`, `doxie.themes.state`, `doxie.spawnBall()`,
    `doxie.spawnBath()`.
