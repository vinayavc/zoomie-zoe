# Tech Scout: Doxie Arcade

Phase 1 research. Question: the simplest stack for **one codebase** that ships as (1) a web page that plays well on portrait phones and laptops, and (2) a Chrome Manifest V3 extension that opens the game in a small popup and is published on the Chrome Web Store.

> **Scope note for the orchestrator.** CLAUDE.md's Platform decision says "phone + laptop, running in the browser" and does not mention a Chrome extension. The job card adds the MV3 popup + Web Store target. This report covers both, and the recommended stack works for the plain web page alone, so nothing here is wasted if Vinny drops the extension. Worth confirming with Vinny.

---

## TL;DR

- **Pick: Option B, vanilla JavaScript + Canvas 2D + native ES modules, no build step, no dependencies.** About 8–12 small files. One `index.html` serves both the web page and the extension popup.
- The biggest MV3 constraint is **no inline scripts, no `eval`, no remote code**. Every script is a separate local `.js` file. That rules out a "single self-contained HTML file" with inline JS for the extension, which is why Option A is not the pick.
- Design the game around a **fixed logical playfield of 400 × 600 (2:3 portrait)**. That is exactly the popup size and letterboxes nicely on phones and laptops.
- **The popup is killed the moment it loses focus.** Save the best score the instant a round ends, and pause/save on `visibilitychange`. Treat a closed popup as "round over."
- Sound: one `AudioContext`, unlocked by a **"Tap to play" button**. It's required on iOS and harmless elsewhere.

---

## 1. Three stack options

### Option A: Single-file style (one `index.html` + one `game.js`, classic scripts)

**How it works.** One HTML page, one big classic `<script src="game.js">` (no modules). All game code lives in one file, organized with plain functions and objects. Canvas 2D for drawing and Web Audio for sound.

**File layout**
```
src/
  index.html      (canvas + <script src="game.js">)
  game.js         (everything: loop, input, art, audio, storage)
  style.css
  manifest.json, icons/
```

**Pros**
- Fewest files. Opens by double-clicking `index.html` (classic scripts work over `file://`; ES modules do not).
- Zero tooling, so nothing to learn.

**Cons**
- `game.js` grows to 1,500+ lines fast once the procedural watercolor art, juice, and audio land. That gets harder for several agents to edit without colliding.
- The "truly single file" version (JS inlined into the HTML) **is not allowed in an extension**: the MV3 popup forbids inline scripts. So you can't have a literal one-file build anyway.

**MV3 compatibility:** Good, as long as the script is external. **Mobile performance:** Same as B. The engine is the browser's Canvas 2D either way.

### Option B: Vanilla JS + native ES modules, no build step (RECOMMENDED)

**How it works.** `index.html` loads `<script type="module" src="js/main.js">`, which `import`s small focused modules (loop, input, audio, art, storage, scenes). No bundler, no npm, no transpiler. Browsers and the `chrome-extension://` origin both load modules natively.

**File layout:** see section 2.

**Pros**
- Each concern is its own small file, so the builder agent, art work, and audio work can proceed without clobbering each other.
- Still no build step. The `src/` folder is the shippable artifact: zip it for the Web Store, push it to GitHub Pages.
- Fully MV3-compliant out of the box: all code is local, no `eval`, no inline script.
- No third-party code, so Web Store review is fast and easy to read (reviewers penalize obfuscation; this has none).

**Cons**
- ES modules **do not load over `file://`** (CORS). Local testing needs a one-line server: `python3 -m http.server` in `src/`, or load it as an unpacked extension.
- We write our own small loop, input, and audio helpers (roughly 150 lines total). That's appropriate for a single-screen arcade game.

**MV3 compatibility:** Excellent. **Mobile performance:** Excellent for this scope. Canvas 2D with pre-rendered textures handles a jointed doxie body plus a few dozen sprites at 60 fps on mid-range phones if we follow section 5.

### Option C: Small game library vendored locally (e.g. LittleJS, ~tens of KB; or KAPLAY, ~200 KB)

**How it works.** Download the library's minified file into `src/vendor/` and load it as a local script (MV3 forbids CDN loading). LittleJS bundles a WebGL2/Canvas hybrid renderer, mouse/touch/keyboard/gamepad input, and the ZzFX sound synthesizer. KAPLAY is a friendlier "game objects + components" API.

**File layout**
```
src/
  index.html
  vendor/littlejs.min.js
  js/main.js, js/doxie.js, ...
  manifest.json, icons/
```

**Pros**
- Input, loop, particles, and synthesized sound for free. ZzFX is a nice fit for barks and squeaks without audio files.
- WebGL rendering has more headroom if we go particle-heavy.

**Cons**
- Our art direction is **procedural watercolor and paper cutout**: layered paths, soft edges, grain, `globalCompositeOperation` blends. That is native Canvas 2D work. A WebGL sprite engine would push us to render textures to Canvas 2D first and upload them, adding a layer.
- Another API to learn, plus another dependency whose updates and quirks we inherit. We must verify each library never fetches remote code or uses `eval`/`new Function` (MV3 forbids both, and some libraries lazy-load code).
- More code for Web Store reviewers to read.
- Phaser (≈1.3 MB minified) is overkill and is excluded.

**MV3 compatibility:** Fine if vendored and checked for dynamic code loading. **Mobile performance:** Very good (WebGL), but the gain doesn't matter at our scope.

### Comparison

| | A: one script | **B: ES modules** | C: vendored lib |
|---|---|---|---|
| Files | ~4 | ~10 | ~10 + vendor |
| Build step | none | none | none (vendored) |
| Opens from `file://` | yes | no (needs local server) | yes/no |
| Multi-agent friendly | poor | **good** | good |
| Fits procedural watercolor | yes | **yes** | indirect |
| MV3 risk | low | **lowest** | medium (audit lib) |

---

## 2. Recommended pick: Option B

**Why:** It's the simplest stack that stays clean as the game grows. It needs no tooling, has zero dependencies, is MV3-safe by construction, and is a natural fit for procedural Canvas 2D watercolor art. The same `src/` folder is both the website and the extension.

### Proposed `src/` layout
```
src/
  index.html          # the only page; used by web AND as the extension popup
  style.css           # full-bleed canvas, touch-action:none, popup size rules
  manifest.json       # ignored by the web; used by Chrome
  icons/              # 16, 32, 48, 128 px PNGs
  js/
    main.js           # boot: create canvas, wire modules, "Tap to play"
    loop.js           # rAF loop, fixed-timestep update, pause/resume
    view.js           # 400x600 logical playfield, DPR scaling, letterboxing, resize
    input.js          # Pointer Events + keyboard → unified "intent" (e.g. stretch, steer)
    audio.js          # one AudioContext, unlock, synth sfx (bark, squeak, pop)
    storage.js        # get/set best score: chrome.storage.local if present, else localStorage
    platform.js       # isExtensionPopup detection, visibility/pagehide hooks
    art/              # procedural watercolor/paper helpers, pre-rendered textures
    game/             # doxie body, hazards, scoring, scenes
```
No file is in `src/` yet. This is a proposal only.

### Minimal `manifest.json` sketch
```json
{
  "manifest_version": 3,
  "name": "Doxie Arcade",
  "version": "0.1.0",
  "description": "A watercolor dachshund arcade mini-game. Stretch, wiggle, beat your best score.",
  "action": {
    "default_popup": "index.html",
    "default_title": "Play Doxie Arcade",
    "default_icon": { "16": "icons/16.png", "32": "icons/32.png", "48": "icons/48.png", "128": "icons/128.png" }
  },
  "icons": { "16": "icons/16.png", "32": "icons/32.png", "48": "icons/48.png", "128": "icons/128.png" },
  "permissions": ["storage"]
}
```
- No `background` service worker, no `host_permissions`, no content scripts. `storage` is the only permission, and it shows no install warning.
- No `content_security_policy` key: the default (`script-src 'self'`) is exactly what we want.

### One code path for web and extension
- `platform.js`: `const isExt = location.protocol === 'chrome-extension:';`. If true, add a `popup` class to `<html>` that pins `body` to **400 × 600 px** (popups auto-size to content, so the body needs explicit dimensions; the limit is 800 × 600).
- `storage.js`: async `getBest()` / `setBest()`. Use `chrome.storage.local` when `globalThis.chrome?.storage?.local` exists, else `localStorage`. Wrap `localStorage` in try/catch, because private mode or blocked storage can throw.
- Everything else is identical.

---

## 3. MV3 gotchas (and the fix for each)

| Gotcha | What happens | Fix |
|---|---|---|
| **CSP: no inline scripts** | `<script>…</script>` and `onclick="…"` attributes are blocked in extension pages | All JS in external files; attach listeners in JS |
| **CSP: no `eval` / `new Function` / remote code** | Default `extension_pages` CSP is `script-src 'self'`. It cannot be relaxed to allow `unsafe-eval` or remote hosts | No CDNs; vendor nothing that lazy-loads code. Fetching data (JSON) is still allowed, but we don't need it |
| **Popup size** | Must be between 25×25 and 800×600 px. Excess content scrolls. Browser zoom can push it over | Pin the popup to 400×600. Keep some headroom under the clamp |
| **Popup closes on blur** | Clicking anywhere outside closes the popup and destroys the page and its JS. There's no way to keep it open | Write the best score **immediately** at game over. On `visibilitychange → hidden` (and `pagehide`), pause and save. Don't rely on `unload`/`beforeunload`. A closed popup counts as "round over" (simplest), or snapshot the round to `chrome.storage.session` if we want resume later |
| **Async writes on close** | An async storage write fired during close may not finish | Save on change (game over / new best), not on close |
| **`localStorage` in extensions** | Works in popups, but Chrome recommends `chrome.storage`. `localStorage` is wiped when users clear browsing data | Use `chrome.storage.local` in the extension (10 MB quota, needs `"storage"`) |
| **ES modules** | Work fine at the `chrome-extension://` origin | Nothing to do |

---

## 4. Input, scroll/zoom, and resizing

**Pointer Events** (`pointerdown/move/up/cancel`) cover mouse, touch, and pen with one code path. Call `canvas.setPointerCapture(e.pointerId)` on down so drags that leave the canvas keep tracking. Treat `pointercancel` like `pointerup`.

**Keyboard:** `keydown`/`keyup` on `window`, mapped to the same "intent" as pointer input (e.g. arrows/WASD to steer, Space to stretch). `preventDefault()` on Space and the arrow keys stops page scrolling on the web build.

**Stopping scroll and zoom on phones**
- CSS: `touch-action: none` on the canvas (and `manipulation` on html/body and any HTML buttons). Without it, the browser takes over pan gestures and fires `pointercancel`.
- `html, body { overflow: hidden; overscroll-behavior: none; height: 100%; }` and size the container with `100dvh` so iOS's collapsing toolbars don't cut the playfield.
- **iOS Safari ignores `user-scalable=no`.** For double-tap zoom, rely on `touch-action`. As a belt-and-braces fix, cancel Safari's `gesturestart` and `dblclick`. Keep the HTML UI minimal and draw most buttons on the canvas.
- Viewport meta: `width=device-width, initial-scale=1, viewport-fit=cover` and respect `env(safe-area-inset-*)` for the notch.

**High-DPI and fit-to-screen (`view.js`)**
1. Logical playfield is fixed at **400 × 600** CSS-pixel units. All game math uses these units.
2. On resize, compute `scale = min(availW/400, availH/600)` and set the canvas CSS size to `400*scale × 600*scale`, centered. Fill the letterbox with a paper-texture CSS background so it looks intentional.
3. Backing store = CSS size × `devicePixelRatio`, **capped at 2**. DPR 3 phones otherwise push 2.25× more pixels for little visible gain. Then `ctx.setTransform(dpr*scale, 0, 0, dpr*scale, 0, 0)`.
4. Listen to `resize` (plus a `matchMedia('(resolution: Xdppx)')` change listener for DPR/zoom changes). A `ResizeObserver` on the container is the cleanest single hook.
5. Convert pointer coordinates to logical units using `canvas.getBoundingClientRect()`.

The popup is 400×600 at scale 1. A portrait phone (e.g. 390×844) gets scale ≈0.975 with bands top and bottom. A laptop gets a centered portrait board.

---

## 5. Sound (Web Audio)

- **One shared `AudioContext`**, created lazily. Every sound is a short graph: `OscillatorNode`/noise `AudioBuffer` → `BiquadFilter` → `GainNode` with an envelope → master gain. A bark is a noise burst plus a pitched oscillator sweep through a bandpass. A squeak is a fast sine sweep up. A pop is a short sine with a pitch drop. No audio files.
- **Autoplay rules:** a context created before any user gesture starts in `suspended`. Call `ctx.resume()` *inside* a `pointerdown`/`click`/`keydown` handler. A **"Tap to play" start button** does this on every platform.
- **iOS Safari specifics:**
  - `resume()` only works when called synchronously inside a gesture handler. `touchend`/`click` are the safest. Do the unlock on the start button, and also re-attempt on the next tap if `state !== 'running'`.
  - After switching apps or locking the screen, the context can go to `"interrupted"`. On `visibilitychange → visible`, check the state and resume on the next tap.
  - The **hardware silent switch mutes Web Audio** by default. `navigator.audioSession.type = 'playback'` routes around it on recent Safari, but it's experimental and not Baseline. Feature-detect it, and consider making it opt-in (respecting the mute switch is arguably polite for an arcade toy).
- **Extension popup:** treat it like any page. It's unverified whether the toolbar click counts as a user gesture inside the popup document, so the "Tap to play" button removes the question entirely.
- Add a mute toggle stored with the best score.

---

## 6. Performance on mid-range phones

- **Loop:** `requestAnimationFrame` with a **fixed-timestep update** (e.g. 60 Hz accumulator, clamp the catch-up to about 5 steps) and render once per frame. This keeps the long-body physics (verlet chain/springs) stable regardless of frame rate. On `visibilitychange → hidden`, stop the loop. On return, reset `lastTime` so we don't "simulate" the gap (treat it as a pause).
- **Pre-render expensive art** (watercolor washes, paper grain, cutout shapes with soft shadows) **once** into offscreen canvases (`document.createElement('canvas')`, or `OffscreenCanvas` where supported), then `drawImage` them each frame. The per-frame watercolor effect must not be recomputed every frame.
- **Layering:** the static background (paper, scenery) lives on its own canvas or CSS background. Only the play layer redraws each frame. Use `getContext('2d', { alpha: false })` on the bottom layer.
- **Avoid per-frame cost traps:** `shadowBlur` and `filter: blur()` in the loop, large text redraws, many `save/restore` calls, and scaling images inside `drawImage`. Cache a pre-blurred version instead.
- **Avoid GC hitches:** no object or array allocation in the hot loop. Pool particles and body segments, reuse arrays, avoid closures and `forEach` in the update loop, and preallocate typed arrays for the doxie's joint positions.
- **Budget check:** keep a debug FPS/frame-time overlay from Phase 2 onward and test on a real mid-range Android phone (Chrome) and an iPhone (Safari) at the end of every phase.

---

## 7. Shipping

### Web page: GitHub Pages (free)
- Publish `src/` from a public repo (Pages → deploy from branch/folder, or a small Actions workflow). Limits: site ≤ 1 GB, soft 100 GB/month bandwidth. Both are far beyond our needs.
- HTTPS by default, so ES modules and Web Audio work with no extra setup. Netlify or Cloudflare Pages are equal alternatives.

### Chrome Web Store checklist
- [ ] **Developer account:** one-time **US $5** registration fee. Pick the publisher email carefully, because it can't be changed later. (Expect Google to require 2-Step Verification on the account; confirm at signup.)
- [ ] **Package:** zip the contents of `src/` with `manifest.json` at the zip root. Exclude dev and debug files. Use readable, non-obfuscated code (minify is OK but unnecessary).
- [ ] **Manifest:** MV3, name ≤ 75 characters, clear description, `version` bumped every upload, icons 16/32/48/128.
- [ ] **Permissions:** only `"storage"`. No host permissions, no `tabs`, no content scripts. Minimal permissions mean a faster, smoother review.
- [ ] **Store icon:** 128×128 PNG (96×96 art + 16 px transparent padding).
- [ ] **Screenshots:** at least 1, up to 5, **1280×800 or 640×400**, full bleed, square corners. (Our 400×600 popup needs to be composed onto a 1280×800 frame.)
- [ ] **Small promo tile:** **440×280**, required. Marquee 1400×560 is optional and only needed for featuring.
- [ ] **Privacy practices tab:**
  - *Single purpose:* "A dachshund arcade mini-game played in the toolbar popup." The game has one narrow purpose, which complies with the single-purpose policy.
  - *Permission justification:* "`storage`: saves the player's best score and mute setting locally on the device."
  - *Remote code:* "No, I am not using remote code."
  - *Data usage:* tick no collected data categories. Certify the three Limited Use statements.
  - *Privacy policy:* only **required if the product handles user data**. Google's FAQ says that if you don't, you should state that in your policy. Recommended: publish a two-line `privacy.html` on GitHub Pages ("Doxie Arcade collects no data; your best score is stored only on your device") and link it. It's cheap insurance.
- [ ] **Listing:** category Games/Fun, description, and support link (GitHub repo or issues).
- [ ] **Review time:** usually **a few days**, sometimes up to a few weeks. Contact support if pending > 3 weeks. Minimal permissions, no remote code, and readable code all speed it up.
- [ ] **Originality:** the store listing art must be our original doxie, with no third-party characters or brands (matches the CLAUDE.md rule).

---

## Sources

**Chrome extensions (MV3)**
- Add a popup (closes on blur, external JS only): https://developer.chrome.com/docs/extensions/develop/ui/add-popup
- `chrome.action` (popup size 25×25 to 800×600): https://developer.chrome.com/docs/extensions/reference/api/action
- Manifest CSP (default `script-src 'self'`, cannot be relaxed): https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy
- Remote hosted code rules (bundle libs locally; fetching data OK): https://developer.chrome.com/docs/extensions/develop/migrate/improve-security
- `chrome.storage` (10 MB local quota, `storage` permission, vs `localStorage`): https://developer.chrome.com/docs/extensions/reference/api/storage
- Popup size clamp discussion: https://issues.chromium.org/issues/40655432
- Popup state-preservation pattern (save on change, not on close): https://mv3-extension.com/uiux-patterns-interactive-components/popup-interface-design/preserving-popup-state-when-it-closes/
- Page Lifecycle API: https://developer.chrome.com/docs/web-platform/page-lifecycle-api

**Chrome Web Store**
- Registration (one-time fee): https://developer.chrome.com/docs/webstore/register
- Fee amount ($5) reporting: https://9to5google.com/2020/03/12/chrome-web-store-fee/
- Images (icon, screenshots, promo tiles): https://developer.chrome.com/docs/webstore/images
- Privacy practices tab: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- User data FAQ (privacy policy only if handling user data): https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- Quality guidelines / single purpose: https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines
- Review process and timing: https://developer.chrome.com/docs/webstore/review-process

**Web platform (MDN)**
- Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- `touch-action`: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
- `devicePixelRatio` / crisp canvas: https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
- `ResizeObserver`: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
- Optimizing canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- `OffscreenCanvas`: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- Anatomy of a video game (rAF loop, fixed timestep, hidden tabs): https://developer.mozilla.org/en-US/docs/Games/Anatomy
- `visibilitychange` (last reliable save point): https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
- JavaScript modules (no `file://`): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- Web Audio best practices (create/resume in a gesture): https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- Autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- `AudioContext.state`: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state
- `navigator.audioSession` (experimental): https://developer.mozilla.org/en-US/docs/Web/API/Navigator/audioSession
- Chrome autoplay policy (suspended until gesture): https://developer.chrome.com/blog/autoplay

**iOS Safari quirks**
- AudioContext stuck "interrupted": https://github.com/WebAudio/web-audio-api/issues/2585
- Silent switch mutes web audio: https://bugnet.io/blog/how-to-fix-ios-web-game-audio-muted-by-the-silent-switch
- iOS ignores `user-scalable=no`: https://dev.to/jasperreddin/disabling-viewport-zoom-on-ios-14-web-browsers-l13

**Libraries (Option C) and hosting**
- LittleJS: https://github.com/KilledByAPixel/LittleJS
- KAPLAY: https://kaplayjs.com/
- Phaser: https://github.com/phaserjs/phaser
- GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
