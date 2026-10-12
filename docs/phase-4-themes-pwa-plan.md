# Phase 4 (continued): Themes and the Offline Web App

## In plain words
We dress the game up for the seasons. Before a round, you pick a theme. Each theme repaints Zoe's world, swaps the socks and dogs for seasonal versions, puts Zoe in a little costume, and gives the sounds a seasonal twist. **The rules stay exactly the same**, so your best score means the same thing in every theme. After 3 rounds in a theme, the game switches back to the Bedroom.

At the same time, we turn the website into an **app you can install** that **works without internet** after the first visit.

## Decisions (Vinny, Oct 11, 2026)
- Launch as an **installable offline web app (PWA)** only. The Chrome Web Store is shelved, but `manifest.json` and `store/` are kept.
- Themes are **full makeovers** with **theme critters** in place of the dogs.
- **Reset rule:** after 3 completed rounds in a non-default theme, switch back to the Bedroom. The player can pick again any time.

## The four themes (rules are the same in all of them)
| Role | Bedroom (default) | Halloween: "Spooky Night" | Christmas: "Cozy Christmas" | Spring: "Spring Garden" |
|---|---|---|---|---|
| Backdrop | floral bedspread, sunny window | moonlit purple-indigo room, jack-o'-lantern glow, cobweb corners | warm rug and wood floor, glowing tree corner, snowy window | grass and clover, flower beds, fresh green leaves, dappled sun |
| 1-pt item (sock) | sock | wrapped candy | glass ornament | tulip or daisy |
| 3-pt item (shoe) | shoe | trick-or-treat pumpkin pail | wrapped present | carrot |
| Cheese (leash +50%) | cheese | cheese (with a tiny bat bow) | cheese (with a holly sprig) | cheese (with a little flower) |
| Ball (zoomies) | red-orange ball | pumpkin ball | jingle ball | robin's-egg blue ball |
| Critters (bump = stun, touch leash = snap) | other dogs | ghost-sheet pups | pups in reindeer antlers | **hopping bunnies** |
| Hiding spots | sherpa blanket piles | leaf piles | plaid blanket piles with tree skirt | leafy bushes |
| Bath hazard | soapy puddle | bubbling green cauldron puddle | slushy melted-snow puddle | rain puddle |
| Zoe costume | navy collar (none) | tiny witch hat plus bat-wing cape | red knit sweater plus Santa hat | flower crown |
| Sound twist | — | catch pops get a spooky "ooo" wobble, and the round-over sigh becomes an owl hoot | sleigh-bell jingle on catches | birdsong chirp on catches |

Costumes must read from above at in-game size. Zoe's face, coat, and brown eyes stay recognizable in every theme.

## T1: Theme engine and picker (one builder; starts after 4B is finished)
- A **theme registry**. Each theme is a data and drawing module: `src/js/themes/bedroom.js`, `halloween.js`, `christmas.js`, `spring.js`.
  - Each module provides: palette, a bake function for the backdrop and hiding spots, sprite bakers for the items, ball, critter, and puddle, a Zoe costume overlay, and sound-twist settings.
- **Refactor Bedroom** into `themes/bedroom.js` with **no visual change**. Compare screenshots before and after.
- **Lazy bake:** a theme's art is baked when it's first selected, then cached. Switching themes never drops frames during a round.
- **Theme picker** on the title card and the game-over card: a row of 4 small chips with a tiny icon each. It works by tap, click, and keyboard, and the current theme is highlighted.
- **Reset rule:** count completed rounds in the current theme. After the 3rd one in a non-default theme, switch back to the Bedroom and show a small note on the game-over card ("Back to the bedroom! Pick a theme any time."). Store the theme and count under `doxieArcade.theme` and `doxieArcade.themeRounds`. **One best score is shared** across all themes.
- **Placeholder themes:** Halloween, Christmas, and Spring are stubs that recolor the Bedroom, so the picker can be tested end to end.

## T2: Three theme artists in parallel (after T1)
Each artist owns **only its own theme file**, plus a matching `src/js/themes/<name>-sfx.js` if the sound twist needs code. Each paints a full theme from the table above, in the established watercolor and paper-cutout style, and verifies it at 400×600 and at phone size.

## PWA: installable and offline (one builder; can run now, in parallel with 4B-finish)
- **Owns:**
  - `src/manifest.webmanifest`
  - `src/sw.js`
  - `src/js/pwa.js` (service-worker registration, loaded by its own `<script type="module">` tag)
  - the PWA `<head>` tags in `src/index.html` (manifest link, theme-color, apple-touch-icon, apple-mobile-web-app tags)
  - new icon sizes in `src/icons/`: 180, 192, 512, and a maskable 512, made with `store/tools/icon-maker.html`
  - `docs/pwa-notes.md`
- The service worker is a **versioned cache**:
  - same-origin requests are cache-first with a background refresh (stale-while-revalidate)
  - HTML is network-first with a cache fallback
  - old caches are deleted on activate
  - one constant to bump for each release
  - The art is procedural, so the code is the whole app. Everything loaded on the first visit must be enough to play offline.
- **Must not** break the MV3 extension: no inline scripts, and service-worker registration skipped when running as an extension.
- **Verify:**
  - the app installs (Chrome's install criteria are met; check in DevTools Application, or via `navigator.serviceWorker` and the manifest in JS)
  - it plays with the network cut (go offline after the first load, reload, play a round)
  - a version bump updates cleanly.
- **iOS:** document how "Add to Home Screen" behaves, and note that Safari can clear the offline cache after weeks of non-use.

## After themes and PWA
1. Store-style screenshots of each theme, for the launch page and share images.
2. **4C:** the fresh-eyes playtester plays everything on phone size and desktop.
3. **4D: Ship.**
   - Publish to GitHub Pages under Vinny's account. Vinny OKs the repo name and public visibility first.
   - Share the link, and test "install" on Vinny's phone.

## Added Oct 11 (Vinny, after approving 4B)
- **Sideways phone → "turn your phone" card.** On a touch device in landscape, show a friendly torn-paper card with Zoe asking the player to rotate to portrait, and pause the round. This goes in T1.
- **Web address:** `zoomie-zoe` (GitHub Pages, `<username>.github.io/zoomie-zoe`).

## PWA done (Oct 11): follow-ups
- **The offline file list in `src/sw.js` is maintained by hand.** Every builder that adds a src file must add it to `FILES` and bump `CACHE_VERSION`. The ship step re-checks that the list matches `src/` exactly.
- **Dev rule:** test at `localhost:8742`, which has no service worker. `127.0.0.1:8742` and the live site run the PWA.
- Ship step: `store/web-hosting.md` should mention that `sw.js`, `manifest.webmanifest`, and `icons/` are uploaded too. A select-all of `src/` covers them. Don't upload `archive/`.
- Questions for Vinny at ship time: splash and status-bar color (indigo `#3F4A73` or paper cream?), and on iOS the installed app keeps its own best score, separate from Safari.

## Change (Vinny, Oct 11): the 3-round reset is dropped
- Remove the "N more rounds here" line, the "Back to the bedroom!" note, and the reset logic (`THEME_ROUNDS`, the `doxieArcade.themeRounds` counting, and the `onRoundEnd` theme hook if nothing else uses it).
- The picked theme simply persists (`doxieArcade.theme`) until the player picks another. The picker stays on the title and game-over cards, so it's available before every play.
