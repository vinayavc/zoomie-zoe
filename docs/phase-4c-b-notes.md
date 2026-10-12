# Phase 4C notes: Builder B (gameplay fairness)

Built Oct 11–12, 2026. Scope: `docs/phase-4c-fix-plan.md`, section "Builder B". No other rules or numbers changed.

## What changed
| Item | Where | How it plays |
|---|---|---|
| **3 s calm start** | `round.js` (`isCalm()`, `_updateDogs`), `dogs.js` (`updateDog(..., calm)`) | For the first `CALM_START` (3) s, dogs wander and never chase. Bumps and leash snaps are skipped. A dog that comes within `CALM_KEEP_AWAY` (140 px) of her head walks away from her, so no dog is on top of her when calm ends. Without this rule, bumps spiked in the second right after calm ended. |
| **Spawn away from Zoe** | `dogs.js` `makeDog` | Every dog spawn (at the start and later) is an edge spot at least `DOG_SPAWN_MIN_DIST` (170) from her head and is not in front of her: never within ±`DOG_SPAWN_AHEAD_ANGLE` (0.8 rad, about 46°) of her heading and closer than `DOG_SPAWN_AHEAD_DIST` (260). It tries 40 spots. If none passes, it takes the best one (far, and not ahead). |
| **Late crowding cap** | `config.js` `DOG_MAX` 5 → 4 | One dog is added at 15 s and one at 30 s, then it stops. Before, a fifth dog arrived at 45 s. |
| **Cinch miss** | `round.js` | If a cinch catches nothing (loop too small or empty), the game sets `game.cinchMissT = CINCH_MISS_TIME` (0.6 s, counting down to 0) and calls `sfx.whiff?.()`. `_closeLoop()` now returns how many items it caught. |

New config entries, all at the end of `CONFIG`: `CALM_START 3`, `DOG_SPAWN_AHEAD_DIST 260`, `DOG_SPAWN_AHEAD_ANGLE 0.8`, `CINCH_MISS_TIME 0.6`, `CALM_KEEP_AWAY 140`. The only existing number changed is `DOG_MAX` (5 → 4).

For the render side (Builder A): `game.isCalm()` is true during the calm start, and `game.cinchMissT > 0` means "show the whiff now". It goes from 0.6 down to 0.

## Measurements
I used a scripted bot that holds arrow keys (with Shift for loops) toward the nearest item, flees close chasers, and presses Space when the cinch preview covers an item, plus an occasional hopeful cinch. It runs the real `game.update` at 1/60 s, with no teleporting. It uses a seeded `Math.random`, and each setup ran 100 full rounds (2 seeds × 50). "Before" is the same code with `CALM_START 0`, `DOG_SPAWN_AHEAD_DIST 0` and `DOG_MAX 5`, which matches the old behavior. A 30-round run on the untouched old code gave the same picture.

| Per round (100 rounds) | Before | After (DOG_MAX 4) |
|---|---|---|
| Rounds with a stun or snap in the first 5 s | 61% | 27% |
| Stuns in the first 5 s | 0.55 | 0.13 |
| Snaps in the first 5 s | 0.64 | 0.24 |
| Stuns or snaps in the 0–3 s calm | (not split out) | 0 |
| Stuns, whole round | 11.3 | 10.6 |
| Snaps, whole round | 20.2 | 20.5 |
| Stuns / snaps in 45–60 s | 3.73 / 7.25 | 3.34 / 6.65 |
| Max critters at once | 5 | 4 |
| Median spawn distance from her head | 335 px | 310 px |
| Min spawn distance | 170 px | 172 px |
| Average bot score | 27.8 | 29.1 |

- With the calm rule alone and no keep-away, stuns spiked in the 3–4 s second: 11 in 60 rounds. The keep-away rule removed that spike.
- The median spawn distance dropped a little because the "not ahead" rule rules out the far top edge, which is in front of her at the start. All 800 spawns I checked were at least 170 px away and none were ahead.
- The cap mostly affects the last 15 s, where stuns and snaps fell about 10%. The whole-round totals barely move. The bot dives at items without caution, so its absolute counts are higher than a person's. Read the numbers as relative.

## Verified
- Logic: across 200 rounds (800 spawns), no spawn was too close or ahead. With both dogs placed 20 px from her at the start, none chased, there were 0 bumps or snaps in the 3 s calm, and the nearest dog was 404 px away when calm ended. An empty-field cinch set `cinchMissT` to 0.6 and it counted down to 0.
- Live, on localhost:8745 in the Christmas theme: I clicked Play and pressed real arrow and Space keys. Dogs didn't chase during calm, Space with nothing in the loop set the miss timer, and `sfx.whiff` already exists (Builder A). No console errors.
- Not tested: touch input, other themes live (the gameplay code is shared by every theme), and how the whiff renders (Builder A's part).

## Open questions
- Snaps, not bumps, are still the main source of hits all round, at about 20 per bot round. That's beyond this scope: no retuning was allowed. If playtests still feel snap-heavy, the next knob is `DOG_SNAP_PAD` or having wandering dogs avoid the leash.
