# Phase 4C Fix Plan (from `docs/playtest-report.md`)

## In plain words
A stranger played the game and found the rough edges. We fix them before launch:
- **Score screen:** stop accidental restarts that wipe it.
- **Screen space:** use the empty space on phones for the score and the buttons.
- **Fairness:** give every round a calm start.
- **Teaching:** make it clearer what to do.
- **Themes:** make each theme's items easy to tell apart.

The play area stays exactly the same size, so scores stay fair.

## Vinny's decisions (Oct 11, 2026)
1. **Layout:** the HUD and controls move into the empty bars. The 400×600 arena and its playable bounds stay unchanged.
2. **Calm start:** for the first 3 s, critters wander but don't chase, and they spawn away from Zoe. Cap the crowding late in the round.
3. **Restart:** only the Play again button, Enter, or Space restarts, and only after the card has been up about 0.75 s.
4. **Scope:** the top 5 plus the minor fixes. Accessibility is basic labels only.

## Builder A: UI, layout, and teaching
**Owns:** `layout.js`, `menu.js`, `render.js`, `input.js`, `main.js`, `platform.js`, `audio.js`, `style.css`, `index.html` (body and canvas attributes only; keep the PWA `<head>`), and `art/*`.
1. **Restart rule** (decision 3). Taps on empty space do nothing on the game-over card. A drag still going when the round ends can never restart. The lock-out time goes in config.
2. **Layout** (decision 1). On a portrait phone, the HUD (score, timer, best, sound, pause, cinch meter) sits in a band **above** the arena, and the thumb-pad area plus the **CINCH button** sit in a band **below** it. On wide screens, the sides are filled with the theme's backdrop or paper, so it's not a bare column. The HUD can sit above the arena there too.
   - **The playable bounds and walls must not change.** If the old in-arena HUD strip is now empty, paint it as a border, but keep it a wall.
   - The **game-over card is fully on screen at 1280×800** and in a stable position.
   - Popups ("snap!", "splash!", "ouch!") always draw inside the arena and never under the HUD.
3. **Rotate card from load.** Detect a touch phone up front (`(pointer: coarse)` and `(hover: none)`, or touch support), before any touch happens. Never start or run a round while the phone is sideways, and block Play.
4. **Hints match the device.** Touch devices see touch hints ("hold and drag to steer · tap CINCH"). Keyboard and mouse users see the key hints. Hint text is at least 12 CSS px on a 375 px phone, and the same goes for the "cinch ready!" label.
5. **Title goal line,** using the theme word: e.g. "Swing Zoe's leash around the socks & shoes, then cinch!"
6. **Cinch-miss feedback.** If a cinch catches nothing, show a soft paper "whiff" puff plus a small "missed!", with a gentle sound. Define `sfx.whiff()` in `audio.js`. Builder B calls `sfx.whiff?.()` from `round.js` and sets `game.cinchMissT`; render reads it.
7. **Snap warning.** When a critter is close to the leash, that part of the leash trembles or flashes. Compute it on the render side from the game state.
8. **Space on the title** starts the game.
9. **Theme caption** shows the *selected* theme. Keyboard focus is shown by the ring only.
10. **Pause card:** add **Quit to title**.
11. **How-to legend:** add the **cheese** ("Cheese: longer leash for a while").
12. **Basic accessibility:** an `aria-label` on the canvas, plus a visually hidden live region that announces "Round over: score N, best M".

## Builder B: gameplay fairness
**Owns:** `js/game/round.js`, `dogs.js`, `items.js`, `extras.js`, `zoe.js`, `leash.js`, `trail.js`, and **new** config entries only. Don't change existing numbers except `DOG_MAX` if needed for crowding.
1. **3 s calm start** (`CALM_START` in config):
   - critters wander and don't chase
   - bumps and leash snaps are ignored during calm
   - every critter spawn (at round start and later) is at least `DOG_SPAWN_MIN_DIST` from Zoe's head **and** not ahead of her within that distance
2. **Late crowding cap.** Cap simultaneous critters, e.g. `DOG_MAX` 5 → 4. Check the numbers with bot rounds and report before and after (stuns per round, spawn times).
3. **Cinch miss:** set `this.cinchMissT = <time>` and call `sfx.whiff?.()` when a cinch catches nothing.
4. Nothing else. No retuning beyond this.

## Builder C: theme readability
**Owns:** `js/themes/halloween.js`, `christmas.js`, `spring.js`, and `bedroom.js` only.
1. **Halloween:** the 3-pt **pail** and the **pumpkin ball** power-up must be told apart instantly. Change one of them so they differ in silhouette **and** colour (e.g. a purple or black candy bucket, or a power-up with a distinct shape and glow).
2. **Christmas:** the **ornaments**, the **gold jingle ball**, and **Zoe's red sweater** blur together.
   - Recolour the ornaments, e.g. silver-blue glass, so no collectible is red like the sweater.
   - Keep the ball clearly the power-up.
   - Make the brown **reindeer pups** readable on the wood floor, e.g. a lighter cream rim or belly, or a paper halo.
3. **Halloween ghosts:** check the drawn size against the hitbox. If they look bigger than they hit, trim them so the crowding reads fairly.
4. **All themes:** a quick pass so collectibles vs power-up vs critters are distinguishable at phone size. Keep changes minimal.

## Shared rules
- Rules and existing numbers are unchanged except as stated.
- No inline scripts, no remote assets, no per-frame filters.
- New files are added to `sw.js` FILES. Run `store/tools/check-precache.py`. Builder A bumps `CACHE_VERSION` at the end.
- Ports: A uses `localhost:8742`, B uses `localhost:8745`, C uses `localhost:8746`. Each builder closes only its own tab.
