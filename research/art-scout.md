# Art Scout: watercolor storybook + paper cutout, and a procedural Zoe

Phase 1 research for Doxie Arcade. Written Oct 2, 2026. Revised the same day after Vinny's reference photos (`docs/ref/Photos-1-001/`) updated the character sheet. The palette, readability rules, and eye details now follow the photo-based sheet.

## The short answer

Draw everything with **Canvas 2D**. Paint the slow, expensive watercolor work **once at load time** into offscreen canvases: paper grain, washes, torn-paper props, and the backgrounds. Each frame, draw only **Zoe and the moving pieces** as cheap vector shapes, filled with those baked textures. Zoe is a **chain of joints** (a "spine") with a smooth outline wrapped around it. Her ears and tail are small **spring chains** that lag behind, so they bounce and trail for free.

Use references for technique only. Nothing here copies a look from an existing character or game.

---

## What makes the look (ingredients any option needs)

| Effect | What it is | Cheap way to fake it |
|---|---|---|
| **Wash layering** | Many see-through layers of slightly different blobs. The edges fade softly and the middle goes deep. | Tyler Hobbs' method: deform a polygon by recursive midpoint displacement, then stack 30–100 variants at about 4% alpha. Too slow to run per frame, fine to bake once. [1][2] |
| **Edge bleed / edge darkening** | Pigment pools at the rim of a wet patch, so edges read darker than centers. | Stroke the shape's outline inside its own clip with a wide, low-alpha, darker tint. In shaders, a difference-of-Gaussians does the same. [5][6][7] |
| **Paper grain / granulation** | Pigment settles in the paper's valleys. | Bake a 256×256 noise tile once. Multiply it into each baked layer, not as a per-frame full-screen overlay. [3][9] |
| **Torn paper edges** | Ragged outline plus a thin white fibrous rim where the paper core shows. | 1D midpoint displacement along each edge [11]. Draw the shape 2–3 px larger in paper-white first, then the colored shape on top. |
| **Cutout drop shadow** | Each paper layer floats a few px above the one below. | Draw the same path offset by (3, 4) px in a cool shadow tint at about 25% alpha, with **no blur**. Use `shadowBlur` only at bake time; MDN says to avoid it per frame. [8] |
| **Handmade wobble ("line boil")** | Outlines shimmer slightly, like hand-redrawn frames. | Jitter outline points with small noise that re-seeds at about 8–12 fps, not every frame. |
| **Pigment mixing** (optional) | Mixing like paint (blue + yellow gives green, not grey). | spectral.js (Kubelka–Munk, MIT, bundle it locally) to pre-compute palette tints. Avoid Mixbox because of its non-commercial license. [12] |

---

## Option 1: Canvas 2D "paper puppet" with baked watercolor (RECOMMENDED)

**How it works.** At load (and on resize), build offscreen canvases. These hold a paper-grain tile, a few Hobbs-style wash tiles for Zoe (pale cream base and golden-apricot saddle) and her world, and fully painted background layers (room, garden, blanket piles) with torn edges and baked soft shadows. Then the game loop does only cheap work. It blits the background layers, then draws Zoe each frame as a smooth outline around her spine chain. That outline is filled with a `CanvasPattern` of her wash tile, gets an inner edge-darkening stroke and an ink outline, and has an offset no-blur shadow. Pickups (ball, cheese, socks) are pre-baked sprites drawn with `drawImage`.

**Looks like.** A storybook page. Soft, blotchy washes on the backgrounds and props. Zoe reads as a painted paper cutout with a crisp warm-brown ink line, slightly boiling, and floating above the scene on her shadow.

**Pros**
- Works everywhere, including iOS Safari. `globalCompositeOperation` (multiply, source-atop, destination-in) has been Baseline since 2015 [9].
- One self-contained file and no dependencies, so it fits the MV3 "everything local" rule.
- Zoe stays fully vector and can stretch to any length without texture smearing.
- Easy to tune, and art direction stays in plain JS.

**Cons**
- Zoe's watercolor is "textured fill + edge stroke", not true per-frame wet paint.
- Hobbs-style baking with 100 layers per shape can take 100–500 ms per large background. Mitigate with fewer layers (20–40), a smaller bake resolution, or baking across several frames behind a title screen.

**Mobile performance risk: low.** About 3–6 background `drawImage` calls plus 1 complex path filled 3–4 times per frame. Follow MDN's tips [8]:
- Pre-render offscreen.
- Use `{alpha:false}` on the base canvas.
- Snap blits to integer coordinates.
- Skip `shadowBlur` in the loop.
- Cap devicePixelRatio at 2.

**Effort: medium.** About 1 day for the texture bakers and 1–2 days for Zoe's rig and outline.

---

## Option 2: SVG scene with live SVG filters

**How it works.** Zoe and the world are SVG `<path>` elements in the DOM. JS rewrites Zoe's path `d` every frame. The textures come from SVG filter chains:
- `feTurbulence` noise, fed into `feDisplacementMap`, roughens and bleeds the edges.
- `feTurbulence` plus lighting gives paper grain.
- `feGaussianBlur` and `feOffset` make the cutout shadows. [3][4][10]

**Looks like.** The most authentic edges of the three: organic, fibrous, truly irregular. It is very little code for a big visual payoff.

**Pros**
- Declarative and resolution-independent, so it stays sharp at any size and is great for the 800×600 popup.
- Torn-paper and bleed edges come almost for free.

**Cons**
- Filters re-rasterize whenever the filtered element changes, and Zoe changes every frame. Users report that animated `feTurbulence` maxes out CPU cores and heats phones [10][13]. Chrome and Firefox accelerate different primitives, and some Android GPUs accelerate none [10].
- You can't move filtered content into a canvas on iOS. Canvas `ctx.filter` (including `url(#svgFilter)`) is still **disabled by default in Safari and iOS Safari 18–27** [14][15], so you can't bake SVG filters into canvas there.
- DOM hit-testing and many path updates add per-frame overhead.

**Mobile performance risk: high**, unless filters apply only to static layers and Zoe goes unfiltered. At that point it becomes a weaker version of Option 1.

**Effort: low to start, high to make smooth on phones.**

---

## Option 3: WebGL2 watercolor post-process

**How it works.** Draw flat-colored shapes (Zoe, props, world) into a framebuffer. A full-screen fragment shader then adds:
- paper texture multiply
- granulation from the paper's height
- noise-driven UV displacement for edge bleed
- edge darkening via blur-difference [5][6][7]

Browser demos already exist: a Three.js watercolor shader, Inkwash (a single-file WebGL2 wash simulation), and a layered WebGPU/WebGL2/Canvas setup with fallbacks [7][16][17].

**Looks like.** The most "alive" watercolor. Washes respond as Zoe moves, and her whole silhouette shimmers like wet paint.

**Pros**
- Real per-frame watercolor, applied uniformly to everything.
- GPU does the work.
- Effects can be dialed up for zoomies or bath scenes.

**Cons**
- The most code: shaders, framebuffers, context-loss handling.
- Needs a Canvas 2D fallback anyway. The wtrclred write-up ships a static PNG on mobile, and it caps DPR at 1.25 and the solver size at 560 px to stay smooth [17].
- Harder for later agents to tweak, and a bigger single file.

**Mobile performance risk: medium.** Fine on mid-range phones if rendered at reduced resolution (about 540 px tall) and upscaled. A full blur chain at full DPR will drop frames.

**Effort: high.** About 3–5 days to look good and stay stable.

---

## Recommended pick: Option 1, Canvas 2D paper puppet with baked watercolor

**Why:**
- It's the only option that is low-risk on iOS Safari, Android, and the Chrome popup alike.
- It ships as one local file.
- It keeps Zoe as a live, stretchy vector puppet, which is the core mechanic.
- It puts the expensive watercolor work where it costs nothing at runtime.

The look holds up because watercolor in storybooks is mostly *still*: wet paint doesn't need to move for the page to feel painted [17]. Option 3's shader can be added later as an optional "fancy mode" over the same scene if Vinny wants more.

### Scaling for portrait phone and the 800×600 popup
- Use a fixed **logical world height**, for example 600 units. The canvas fills the container. Portrait phones see a narrower slice of the world, and the landscape popup (max 800×600 [18]) sees a wider one. Zoe's size in world units never changes.
- Re-bake textures on resize at `min(devicePixelRatio, 2)`. Baking takes a few hundred ms, so debounce it.
- Avoid scaling in `drawImage`. Bake at the final on-screen size [8].

### Drawing Zoe so she reads at small sizes
- **Spine:** about 10–16 joints spaced evenly. Each joint is pulled to a fixed distance behind the one in front, with a max bend angle per joint so she curves smoothly and never kinks. This is the argonaut / "simple procedural animation" technique [19][20][21].
- **Body width per joint:** small head (about 0.8×), neck taper, a long even torso, a slight hip, and a quick taper into the tail root. Build the outline from left and right offsets at each joint, close it with nose and rump caps, and smooth it with Catmull–Rom converted to `bezierCurveTo` [22].
- **Stretch mechanic:** add or remove joints as she lengthens rather than spreading the gaps. That keeps the curvature smooth and the fur texture density even.
- **Legs:** four short rounded stubs, two at the shoulder joint and two at the hip joint. They swing on a sine phase driven by distance traveled, and they blur into little arcs during zoomies.
- **Ears and tail (secondary motion):** each is a 4–6 point Verlet chain anchored to a head or rump joint, with gravity, damping of about 0.9, and 2–3 constraint passes [23][24]. Draw each as a tapered feathered shape:
  - Ears: pale cream (`#EBD9BC`), long, with 3–5 wavy fringe strokes that hang below the jaw.
  - Tail: a feathered plume, usually carried up in a soft curve. Golden-apricot at the root, fading to pale cream in the fringe.
- **Readability rules:**
  - Keep the silhouette first.
  - Use a 2–3 px warm-brown ink outline.
  - **Two-tone coat:** bake two wash tiles, a golden-apricot saddle (`#D9AA6E` to `#BF8C55`) for the back and top of the head, and pale cream (`#EBD9BC` / `#F6EAD5`) for the chest, belly, and paws. Clip the saddle to the top half of the body outline, using an offset copy of the spine, so the color boundary bends with her.
  - **Ears are paler than the body, so they can't rely on being darker.** Three things separate them:
    1. The ink line goes all the way around each ear.
    2. A soft shadow wash (saddle `#BF8C55` at about 40% alpha) runs where the ear meets the head and under the ear's top edge. It reads as the ear lifting off the head, like a cutout layer.
    3. The ears sit against the darker golden saddle and head-top, so pale on warm gives the contrast.
    Add the ear's own small unblurred cutout shadow on the neck so it floats.
  - **Nose:** a rosy liver-brown (`#8C5B52`) rounded triangle with a 1 px cream highlight, outlined in ink. Never a black dot. It should read as clearly warmer and pinker than the eyes.
  - **Eyes:** both brown; see Eyes below.
  - **Collar:** a dark navy band (`#2E3646`) with a gold tag dot (`#C9A84C`). It's a cheap, strong marker for where the head ends and the body starts, and it helps readability at small sizes.
  - The background must be mid-value and cooler than Zoe so the cream dog pops.
- **Eyes (Vinny's call, Oct 2, 2026): both warm dark brown (`#2E211A`).** No heterochromia in the game.
  - **Normal size and up (head about 40 px or more):** round irises with a 1–1.5 px ink rim and a 1 px white highlight. The highlight is what makes them read as soft and alive.
  - **Small size (head under about 40 px):** make the eyes slightly oversized (about 12–15% of head width) and keep the highlight dot.

---

## Palette (watercolor, provisional until the photo arrives)

Earth-pigment logic: Zoe lives in the yellow-ochre / raw-sienna family [25]. Her world is cooler and greyed so she stands out. Zoe's swatches are now the photo-based ones from the character sheet.

**Her real world supports the "cool world, warm Zoe" plan.** In the photos she lives on a blue-grey sherpa pillow and blanket (`#7E8C9C`), an indigo and dusty-pink floral bedspread, sunlit windowsills, and soft linen sofas. The world colors below now draw on those. The blue-grey sherpa becomes the main burrow-blanket color, and the indigo and dusty-pink floral becomes the bedspread pattern. Both are cool or muted, so her warm cream and apricot coat pops against them.

| Role | Hex | Pigment idea | Use |
|---|---|---|---|
| Zoe highlight | `#F6EAD5` | very diluted yellow ochre | brightest fur, highlights |
| Zoe pale cream | `#EBD9BC` | diluted yellow ochre | ears, chest, belly, paws, leg feathering, tail fringe |
| Zoe golden-apricot | `#D9AA6E` | yellow ochre + raw sienna | saddle: back and top of head |
| Zoe saddle shadow | `#BF8C55` | raw sienna | saddle shading, ear-to-head shadow wash, edge darkening |
| Ink line | `#6B4A2F` | burnt umber | outline (kept from v1; not a sheet color, art-direction choice) |
| Nose | `#8C5B52` | rosy liver: burnt sienna + rose | nose only, never black |
| Brown eye | `#2E211A` | burnt umber, dark | her right eye, both pupils |
| Collar / tag | `#2E3646` / `#C9A84C` | indigo / gold ochre | navy collar, small gold tag |
| Blush | `#E7A79A` | rose + ochre | inner ear, tongue (kept from v1) |
| Paper | `#FBF6EC` | warm white | page base, torn-edge rims |
| Shadow tint | `#4B4A63` at 25% | indigo-grey | cutout drop shadows (never pure black) |
| Home wall | `#C9D3BE` | sage wash | indoor backgrounds |
| Floor / wood | `#B98E6A` | burnt sienna, light | floorboards |
| Sherpa blanket | `#7E8C9C` | Payne's grey + white | blanket piles and pillow, her real burrow spot (from photos) |
| Bedspread indigo | `#3F4A73` (est.) | indigo | floral bedspread base or flowers (from photos) |
| Bedspread pink | `#D4A3A0` (est.) | rose madder, greyed | floral bedspread flowers (from photos) |
| Linen sofa | `#D8D0C2` (est.) | greyed raw umber, diluted | sofas and cushions, mid-light neutral |
| Window light | `#F7E9C6` (est.) at 30% | diluted aureolin | sunlit windowsill glow patches |
| Garden green | `#8DA56B` / `#5E7A4A` | sap / olive | grass, hedges |
| Sky | `#D4E4E8` | very diluted cerulean | outdoor top |
| Ball | `#D9644A` | cadmium-red, light | the ball, the main collectible; must pop |
| Cheese | `#F2C14E` | Hansa yellow | power-up |
| Bath water | `#7FB3C8` + white | turquoise-grey | bath hazard, bubbles with blue rims |
| Other dogs | `#7D7F8C` / `#55515E` | Payne's grey | hazards, cool and dark, read as "not Zoe" |

Value check: Zoe (light) on mid-value cool grounds, with hazards dark and cool and treats saturated warm. A player can tell **friend, food, or foe** by color alone.

---

## Performance budget (mid-range phone, 60 fps target)

- **Bake once:**
  - paper tile (256²)
  - 2–3 Zoe wash tiles (256²)
  - background layers at screen size
  - all prop sprites with baked soft shadows and torn edges
  - Hobbs layering at 20–40 layers, not 100
- **Per frame:**
  - 3–6 background blits
  - Zoe: 1 path (about 60–100 bezier segments) drawn 4× (shadow, fill pattern, edge stroke, ink line)
  - 2 ears and 1 tail
  - up to about 30 sprite blits
- **Never per frame:** `shadowBlur`, `ctx.filter` (it doesn't work on iOS anyway), SVG filters, `getImageData`, text re-layout.
- `{alpha:false}` on the main canvas, integer blit coordinates, devicePixelRatio capped at 2 [8].
- OffscreenCanvas is fully supported in Safari 17+ [26], but a plain hidden `<canvas>` works everywhere and is enough, since baking needn't run in a worker.

---

## Code sketch: Zoe's body, Option 1

```js
// ---- bake once ----
const paper = bakePaperTile(256);              // value noise -> warm off-white with grain
const zoeCream  = ctx.createPattern(bakeWash(256, ['#F6EAD5','#EBD9BC'], {layers: 30, alpha: 0.04, grain: paper}), 'repeat');
const zoeSaddle = ctx.createPattern(bakeWash(256, ['#D9AA6E','#BF8C55'], {layers: 30, alpha: 0.04, grain: paper}), 'repeat');
const zoePattern = zoeCream;   // base fill; saddle drawn on top, clipped to the back

// ---- spine: chain of joints with distance + angle constraints ----
class Spine {
  constructor(n, gap) { this.gap = gap; this.j = Array.from({length:n}, (_,i)=>({x:-i*gap, y:0, a:0})); }
  update(headX, headY, maxBend = 0.35) {
    const j = this.j; j[0].x = headX; j[0].y = headY;
    for (let i = 1; i < j.length; i++) {
      let a = Math.atan2(j[i-1].y - j[i].y, j[i-1].x - j[i].x);
      if (i > 1) a = clampAngle(a, j[i-1].a, maxBend);       // no kinks
      j[i].a = a;
      j[i].x = j[i-1].x - Math.cos(a) * this.gap;           // fixed spacing
      j[i].y = j[i-1].y - Math.sin(a) * this.gap;
    }
    j[0].a = j[1].a;
  }
  setLength(n) { /* push/pop joints at the hip so stretch keeps even spacing */ }
}

// width profile: head small, long even torso, taper to tail root
const widthAt = t => t < .12 ? 9 : t < .2 ? 7 : t < .85 ? 11 : lerp(11, 5, (t-.85)/.15);

function outline(spine, boil) {
  const L = [], R = [], n = spine.j.length;
  spine.j.forEach((p, i) => {
    const w = widthAt(i/(n-1)) + boil.noise(i) * 0.6;       // wobble re-seeded ~10 fps
    const nx = -Math.sin(p.a), ny = Math.cos(p.a);
    L.push({x: p.x + nx*w, y: p.y + ny*w});
    R.push({x: p.x - nx*w, y: p.y - ny*w});
  });
  return catmullRomClosed([...L, ...R.reverse()]);          // -> Path2D via bezierCurveTo
}

// ---- draw each frame ----
function drawZoe(ctx, zoe) {
  const body = outline(zoe.spine, zoe.boil);
  ctx.save(); ctx.translate(3, 4);                           // 1. cutout shadow, no blur
  ctx.fillStyle = 'rgba(75,74,99,.25)'; ctx.fill(body); ctx.restore();
  drawLegs(ctx, zoe);                                        // stubs behind body
  zoePattern.setTransform(new DOMMatrix().translate(zoe.spine.j[0].x, zoe.spine.j[0].y));
  ctx.fillStyle = zoePattern; ctx.fill(body);                // 2a. pale cream base wash
  ctx.save(); ctx.clip(body); ctx.fillStyle = zoeSaddle;     // 2b. golden-apricot saddle on the back
  ctx.fill(saddleBand(zoe.spine)); ctx.restore();
  ctx.save(); ctx.clip(body);                                // 3. edge darkening (pigment pooling)
  ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(191,140,85,.35)'; ctx.stroke(body); ctx.restore();
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#6B4A2F'; ctx.stroke(body); // 4. ink line
  drawFeather(ctx, zoe.tail);  drawFeather(ctx, zoe.earBack);       // verlet chains
  drawHead(ctx, zoe);   // saddle-topped head, collar, liver nose, blue + brown eyes (drawn last, crisp)
  earShadowWash(ctx, zoe.earFront);                          // saddle-tone wash where ear meets head
  drawFeather(ctx, zoe.earFront);                            // pale cream ear, full ink outline
}

// ears/tail: 5-point Verlet rope anchored to a joint, gravity + damping, 2-3 passes
function stepRope(r, anchor, g = 0.4, damp = 0.9) {
  r.p[0] = {...anchor};
  for (const q of r.p.slice(1)) { const vx=(q.x-q.px)*damp, vy=(q.y-q.py)*damp;
    q.px=q.x; q.py=q.y; q.x+=vx; q.y+=vy+g; }
  for (let k = 0; k < 3; k++) for (let i = 1; i < r.p.length; i++) constrainDist(r.p[i-1], r.p[i], r.seg);
}
```

`bakeWash` uses Hobbs' recursive deform (Gaussian midpoint offsets, variance halving each pass), with many layers at about 4% alpha [1][2]. Each layer gets a random circle mask via `destination-in` [9], and the result is multiplied with the paper tile.

---

## Top risks
1. **Bake time on cheap phones.** Watercolor layering is CPU-heavy. Keep layer counts at 20–40, bake behind the title screen, and cache by size.
2. **"Textured fill" can look flat or digital** if the wash tile is too uniform or slides visibly. Anchor the pattern to the head, use 2–3 tiles, and keep the line boil subtle.
3. **Readability at popup and phone scale.** A cream dog on cream paper will vanish, and her pale ears are the easiest part to lose. Keep backgrounds mid-value and cool, keep the ink line on, keep the shadow wash at the ear root, and ink-rim the eyes.
4. **The palette is eyeballed from photos.** Expect small tweaks after the first in-game test; the swatches are isolated in one table, so tuning stays cheap.
5. **Don't use `ctx.filter` or SVG filters per frame.** Safari has `ctx.filter` disabled by default, and SVG filters are a known mobile CPU and heat problem [10][13][14].

---

## Sources
1. Tyler Hobbs, "A Guide to Simulating Watercolor Paint with Generative Art": https://www.tylerxhobbs.com/words/a-guide-to-simulating-watercolor-paint-with-generative-art
2. Sighack, "Generative Watercolor in Processing": https://sighack.com/post/generative-watercolor-in-processing
3. Codrops, "SVG Filter Effects: Creating Texture with feTurbulence": https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/
4. Ben Gammon, "Rough CSS borders with SVG filters": https://bengammon.co.uk/rough-css-borders-with-svg-filters/
5. Curtis et al., "Computer-Generated Watercolor" (SIGGRAPH 97), edge darkening, glazing, granulation: https://maverick.inria.fr/Members/Cyril.Soler/DEA/NonPhotoRealisticRendering/Papers/p421-curtis.pdf
6. Montesdeoca et al., "Art-directed watercolor stylization of 3D animations in real-time" (DoG edge darkening, paper granulation): https://www.researchgate.net/publication/315928841_Art-directed_watercolor_stylization_of_3D_animations_in_real-time and https://artineering.io/styles/watercolor
7. CS 184 WebGL watercolor shader (edge darkening via inverted blur, paper texture multiply): https://c-chen99.github.io/watercolorShader/final.html
8. MDN, "Optimizing canvas": https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
9. MDN, `globalCompositeOperation`: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
10. Taylor Hunt, "Improving SVG Runtime Performance": https://codepen.io/tigt/post/improving-svg-rendering-performance
11. Steve Losh, "Midpoint Displacement": https://stevelosh.com/blog/2016/02/midpoint-displacement/
12. spectral.js (Kubelka–Munk paint mixing, MIT): https://github.com/rvanwijnen/spectral.js/
13. GSAP forum, "feTurbulence mobile performance": https://gsap.com/community/forums/topic/33075-gsap-and-feturbulence-mobile-performance/
14. MDN, `CanvasRenderingContext2D.filter` (url() to SVG filters; "Limited availability"): https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter
15. Can I Use, canvas `filter` (Safari/iOS 18–27: disabled by default): https://caniuse.com/mdn-api_canvasrenderingcontext2d_filter
16. Inkwash, a single-file WebGL2 watercolor (how it works): https://johnowhitaker.github.io/inkwash/about
17. "The Tech Behind Transparent Watercolor on the Web" (layered fallbacks, DPR cap, static mobile paper): https://wtrclred.io/posts/16
18. Chrome Extensions `chrome.action` (popup max 800×600): https://developer.chrome.com/docs/extensions/reference/api/action
19. argonaut, "A simple procedural animation technique" (video): https://www.youtube.com/watch?v=qlfh_rv6khY
20. argonautcode/animal-proc-anim, `Util.pde` (constrainDistance / constrainAngle): https://github.com/argonautcode/animal-proc-anim/blob/main/Util.pde
21. "Procedural Animation of Serpent Bodies" devlog: https://sixthgear.itch.io/below/devlog/994739/procedural-animation-of-serpent-bodies
22. Wikipedia, Catmull–Rom spline: https://en.wikipedia.org/wiki/Catmull%E2%80%93Rom_spline
23. Pikuma, "Verlet Integration and Cloth Physics": https://pikuma.com/blog/verlet-integration-2d-cloth-physics-simulation
24. "Verlet Rope in Games": https://toqoz.fyi/game-rope.html
25. Handprint, "a basic palette" (earth pigments): https://www.handprint.com/HP/WCL/palette5.html and Jane Blundell, "Earth Colours": https://www.janeblundellart.com/earth-colours.html
26. Can I Use, OffscreenCanvas (Safari/iOS 17+ full): https://caniuse.com/offscreencanvas

Note: source [3] returned HTTP 403 when fetched. Its technique is cross-checked by [4] and [10].
