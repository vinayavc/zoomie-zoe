# Phase 4 T3 notes: theme integration pass

Oct 11, 2026. No gameplay or number changes. No inline scripts, remote assets or per-frame filters.

## What changed
1. **How-to step 2 is a theme word.** New `words.loot` key, used for the last line of step 2 ("Swing / the leash round / *loot*"). Bedroom "socks & shoes", Halloween "candy & pails", Christmas "ornaments & gifts", Spring "tulips & carrots". It's documented in `src/js/themes/README.md` (keep it to about 17 characters). Files: `src/js/render.js` (drawHowto), the 4 theme files.
2. **`doxie.art` is now a live getter** (`main.js` → `artInfo()` in `render.js`). It returns `{ bakeMs, bakes, k, themes: { id: ms } }` and is `null` before the first bake. Before, it was a snapshot that was only written when a theme baked.
3. **Pre-warm after each theme bake** (`render.js` → `prewarm`). Right after `bakeTheme`, every theme sprite (floor, 3 items, 2 critters, ball, hazard, bubble, hide flap, glow, and any baked costume layers) is drawn once at 2×2 px onto the game canvas. This happens just before the floor blit covers the whole canvas, so it's never seen. It runs only when a theme bakes, which is on a menu card or at load.
4. **Offline list:** `src/sw.js` FILES gained `icons/32.png` (the favicon in index.html was missing). `CACHE_VERSION` is now `'v3'`. New `store/tools/check-precache.py` compares FILES with every .js/.css/.html/.webmanifest under src/ plus the icons that index.html and manifest.webmanifest reference. It deliberately leaves out `sw.js` (the browser fetches the worker itself, never from the cache), `manifest.json` and its 16/48/128 icons (extension only), README.md and .DS_Store. It also flags duplicates and listed files that aren't on disk. Result: `OK: FILES matches src/` (39 entries including `./`), and every entry returns 200 from :8742. The README checklist and the sw.js header now point to the script.

## Item 3: Zoe in normal movement. Verdict: test artifact, not a bug
In all 4 themes I played with real key events dispatched to `window` through the real input handlers and the real rAF loop (no position writes). Each run was: steer right, then a diagonal turn, a 1.5 s Shift+Left loop, a Space cinch (4 frames 45 ms apart), then catching a spawned ball by steering with arrows, plus a zoomies run and a Shift-loop during zoomies. Zoomed crops (4× canvas) are in `docs/screens/t3-<theme>-{turn,loop,cinchseq0-3,zoomies,zoomies-loop}-zoom.jpg`, with full frames `t3-<theme>-turn-400x600.jpg` and `-zoomies-400x600.jpg`.
- Body outline, ears, tail, witch hat and bat cape, sweater and Santa hat, and flower crown all stay attached and coherent in turns, loops and zoomies.
- The splayed look in `t2-halloween-play-400x600.jpg` (huge ears, kinked body) didn't reproduce, which matches the artist's account that its script teleported her.
- **Expected, and the same in the Bedroom:** during a cinch lunge her ears flip back, and her body stretches long and straight as the head shoots ahead (the STRETCH mechanic). The cape and sweater follow the spine joints, so they stretch along with it for that half second (see `t3-halloween-play-mobile-375x812.jpg`). This looks a bit odd in a single still but is consistent with the rig, so I left it alone.
- **Naps (Christmas, Spring):** belly-up and donut both look right (`t3-{christmas,spring}-nap-{belly,donut}-{400x600,zoom}.jpg`). Belly-up shows the sweater front over her tummy with the hat on her head, or the crown with closed eyes. Donut shows the hat or crown on her tucked head and the sweater on the curl. No fix needed.

## Item 4: first-ball hitch
I couldn't reproduce it in this pane, before or after the change. With pre-warm disabled (a temporary toggle, now removed), cold-baked Halloween and Christmas showed first-ball rAF frames of 15–18 ms, the same as normal frames. With pre-warm on: 16–17.5 ms. The `render()` CPU time on the first ball frame is 0.1–0.3 ms either way, so any hitch would be GPU-side (texture upload). Pre-warm is the standard cure, but **I can't claim it measurably fixed the hitch here.** It needs a check on the machine that showed the 17–22 ms frame.

## Also verified
- How-to card at the mobile preset (375×812) in all 4 themes: "ornaments & gifts", the longest, fits inside the 112 px column (`t3-<theme>-howto-mobile-375x812.jpg`).
- Play at 400×600 and the mobile preset in all 4 themes (`t3-<theme>-play-mobile-375x812.jpg`). No console errors. Bake times at k = 1.875: bedroom 45, halloween 33, christmas 27, spring 71 ms.
- localStorage restored (theme halloween, best 9). Viewport reset; my tab closed.

## Not verified
- The service worker install with v3 (localhost:8742 has no SW by design). I only checked the file list and the 200 responses.
- A real phone, and the hitch on other hardware (see above).

## Note
- Partway through, the first browser tab reloaded on its own (its saved theme changed to bedroom). I moved to a fresh tab. If another session was also on :8742, it shares localStorage.
