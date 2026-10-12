# Phase 4A notes: Zoe's extras

Built Oct 2, 2026 by the Builder. Scope: `docs/phase-4-plan.md`, section "4A: Zoe's extras". The existing rules and numbers are unchanged. One timing rule moved: the restart guard now starts when the "Zoe naps" card appears (see below). All new numbers are in `config.js`, under "Zoe's extras (Phase 4A)".

## What's added

| Extra | How it plays | How it looks and sounds |
|---|---|---|
| **Ball → zoomies** | A red-orange ball appears 6 s into the round, then 7–12 s after the last one is gone. Only one is on the floor at a time, and none spawn during zoomies. It never spawns within 130 px of her head, inside a blanket pile, or on a bath. If she doesn't grab it, it stays 7 s, blinking for the last 1.5 s. Touching it with her head starts **zoomies** for 4 s: ×1.4 speed and ×1.4 turn rate. It is not a lasso item. | Baked paper-cutout ball (cream seam, ink line, grain) that bounces over a hard floor shadow, with a pulsing sunny glow. On grab: ball-colored confetti and a "zoomies!" popup. During zoomies: ink speed lines along her sides, dust puffs behind her rump, ears streaming back, and a faster tail wag. Sounds: `bounce` (a rubbery "boing" when a ball appears) and `zoomies` (a happy "arf-arf!" over a rising whoosh). |
| **Blanket piles → hiding** | The two sherpa piles are now real zones, and the art and the game read the same outlines (`CONFIG.BLANKETS`). While her head is inside one, no dog chases her. After she leaves, dogs stay confused for `DOG_LOST_TIME` (1 s) and keep wandering. Dogs can still bump her, and they can still snap her leash. | A baked sherpa "tuck" flap is pulled over her head and front half, with her eyes and nose peeking out. Nearby dogs that lost her show a teal "?" tag. Sound: `rustle` (soft fabric) and a puff of sherpa fluff as she dives in. |
| **Bath → hazard** | From 15 s, and then 7–11 s after the previous bath leaves, a soapy puddle appears at the left or right edge, on a row at least 70 px from her head if possible. For 1.4 s it is a see-through, wobbling warning with a "!" tag, and it's harmless. Then it slides across at 45 px/s and leaves. If her head touches it while she isn't invulnerable, she's "bath-shocked": a 0.5 s stun (plus the usual 1.5 s invulnerability) and a wet leash for 3 s at ×0.6 length. Dogs steer away from the puddle and are pushed out if they overlap it. | A baked watercolor puddle on a torn paper rim with foam clumps, plus baked bubbles floating up. The wet leash turns blue-grey and drips. On a splash: water droplets, foam puffs, and a "splash!" popup. Sounds: `bubbles` ("blub-blub" on the warning) and `splash` (a falling noise splash, a plop, and bubbles). |
| **Nap pose at game over** | A random pose, never the same one twice in a row: **belly-up flop**, **donut curl**, or **bread loaf**. | Over 0.6 s she hops and flops from where she stopped into the pose, growing to 2× size so it reads on phones. The room dims and the leash fades. Eyes close; belly-up shows a rosy tummy, four paddling legs with pink paw pads, and a tiny tongue "blep"; loaf and donut tuck the legs away, and the donut's tail wraps round her nose. Floating "z Z z"s and a dust puff on landing. At 1.6 s the "Zoe naps" card fades in, in the *other* half of the screen, and names the pose. Sounds: `flop` (a soft thud), then the existing `sigh`, now 0.35 s later. |

### Files
- **New:** `src/js/game/extras.js` holds the `Ball` and `Bath` state and `blanketAt(x, y)`.
- **`round.js`:** `_updateExtras()` handles the ball, hiding and bath. The wet leash multiplier is applied to `leash.length`. It also adds event counters (`zoomCount`, `splashCount`, `hideCount`) that the renderer diffs, `napPose`, and the new `canRestart` timing.
- **`zoe.js`:** adds `zoomT`, `startZoomies()`, `hidden`, and `stun(time)`, which still defaults to `STUN_TIME`.
- **`dogs.js`:** dogs avoid the bath, `lostT` and `confused` for hiding, and no chase while she's hidden.
- **`config.js`:** the new block of numbers.
- **`audio.js`:** 6 new sounds, and `sigh(delay)`.
- **`art/bake.js`:** new baked sprites `ball`, `bath`, `bubble` and `tuck`. The piles are now drawn from `CONFIG.BLANKETS`, with identical coordinates and RNG order, so the room looks the same.
- **`art/palette.js`:** ball, water, wet-rope, dust and paw-pad colors.
- **`art/zoe-art.js`:** the pose takes `zoom` and `nap`. Adds closed eyes, belly-up paws, a chubbier loaf, and a curled donut tail.
- **`art/fx.js`:** a puff pool (dust and foam) plus confetti for the ball, splash and blanket.
- **`render.js`:** draws the bath, ball, speed lines, tuck flap, wet leash, "?" tags and the nap sequence. Popups and dog tags are hidden while she naps.
- **`main.js`:** console helpers.
- **Not touched:** `src/manifest.json` and `src/icons/`.

### Console helpers
`doxie.spawnBall()`, `doxie.spawnBath()` (starts the warning), `doxie.endRound()`, plus `doxie.game.ball`, `doxie.game.bath` and `doxie.game.timeLeft` / `doxie.game.elapsed` to jump the clock. To audition the new sounds: `doxie.sfx.bounce()`, `.zoomies()`, `.rustle()`, `.bubbles()`, `.splash()`, `.flop()`, `.sigh(0.35)`.

## New config numbers
`BALL_FIRST 6, BALL_GAP_MIN 7, BALL_GAP_MAX 12, BALL_LIFETIME 7, BALL_BLINK 1.5, BALL_RADIUS 8, BALL_MIN_DIST_ZOE 130, BALL_EDGE 30, ZOOMIES_TIME 4, ZOOMIES_SPEED_MULT 1.4, ZOOMIES_TURN_MULT 1.4, BLANKETS [2 outlines], DOG_LOST_TIME 1.0, BATH_START 15, BATH_GAP_MIN 7, BATH_GAP_MAX 11, BATH_WARN 1.4, BATH_SPEED 45, BATH_RX 30, BATH_RY 19, BATH_MIN_DY_ZOE 70, BATH_STUN_TIME 0.5, BATH_WET_TIME 3, BATH_LEASH_MULT 0.6, BATH_DOG_PAD 14, NAP_FLOP_TIME 0.6, NAP_CARD_DELAY 1.6, NAP_SCALE 2.`

## Verified
Tested in the built-in browser at 400×600 and at the mobile preset (375×812). I drove the game with console helpers and also let it play on its own.
- **Ball → zoomies:** a ball placed in her path was taken on contact. `zoomT` was 4, "zoomies!" popped up, and the speed lines and dust showed. A natural ball also spawned on its own.
- **Hiding:** a dog 80 px away chased her in the open (`chasing: true`). With her head in the right-edge pile, it stopped (`hidden: true, chasing: false, confused: true`). It stayed off her for about 1 s after she left the pile.
- **Bath:** warning, then slide, then exit. A hit gave `stunT` 0.5 and `wetT` 3. Leash length went 480 → 288, then back to 480 after 3 s. A dog walking straight at a live bath turned away and never overlapped it (closest normalized distance 1.34). A natural bath spawned after 15 s.
- **Nap poses:** I forced each one in turn: belly (top and bottom half), donut, and loaf. Each fits on screen, opposite the card, at both sizes. `canRestart` is false at 1.0 s and true at 2.1 s, and a tap restarts cleanly: ball, bath, wet, zoomies and hiding all reset.
- **Sound:** the audio context was running and the new sounds played in live play without errors. Node counts: each new sound creates the expected nodes, and over a long window created = disconnected (175/175), so there are no leaks.
- **Performance:** with zoomies, a sliding bath, the ball and a wet leash all active at the same time, `render()` takes about **0.19 ms** of CPU per frame at the mobile backing size (750×1124). The median frame is 16.7 ms, a steady 60 fps. The bake takes about 64–94 ms, once. There is no `ctx.filter`, `shadowBlur` or SVG filter anywhere in the frame loop; all new shadows are hard offset fills.
- **Console:** no errors or warnings throughout.

Screenshots (`docs/screens/`):
- `4a-zoomies-ball-bath-warning-400x600.jpg`: zoomies speed lines and dust, the ball, and a bath warning.
- `4a-hiding-confused-dog-wet-leash-400x600.jpg`: Zoe tucked under the right pile, a dog with a "?" tag, a wet dripping leash, and a sliding bath.
- `4a-nap-donut-400x600.jpg`: the donut nap with "z"s and the card.
- `4a-nap-belly-mobile-375x812.jpg`: the belly-up nap at phone size.

## Not verified
- Real touch devices, iOS Safari, and the MV3 popup.
- Whether the sounds are pleasant. I can't hear them, so Vinny should listen.
- A whole round played by hand for feel. My runs were scripted or hands-off.

## Known issues and decisions
- **Restart guard:** it now counts from the card appearing (`NAP_CARD_DELAY + RESTART_GUARD` = 1.95 s after time's up), so a frantic last tap can't skip the nap and the score. `RESTART_GUARD` itself is unchanged.
- **Blanket zones** use the un-deformed pile outlines, which can sit a few pixels inside or outside the painted ragged edge. The piles are narrow (about 40 px against her ~31 px turning radius), so hiding is a dash-through refuge, not a parking spot. The 1 s "lost" time is what makes it useful.
- **Speed lines** follow her heading, not her curved body, so in tight turns a line can cross the body for a moment.
- A bath can slide over floor items. They stay catchable.
- `CONFIG.BLANKETS` is read once at load. Editing it live doesn't move the zones or the art.

## Suggested tuning (for Vinny's playtest)
- If zoomies feel too wild: `ZOOMIES_SPEED_MULT` 1.3. Too rare: `BALL_GAP_MAX` 10.
- If the bath feels unfair: `BATH_SPEED` 35 or `BATH_WARN` 2. If it's too easy: `BATH_LEASH_MULT` 0.5 or `BATH_WET_TIME` 4.
- If hiding feels pointless: `DOG_LOST_TIME` 1.5–2.
- If the nap is too slow before restart: `NAP_CARD_DELAY` 1.2.
