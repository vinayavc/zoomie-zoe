# Doxie Arcade: Concept (Phase 1 result)

Starring **Zoe**, a blonde long-haired mini dachshund with warm brown eyes. Sources: `research/art-scout.md`, `research/fun-scout.md`, `research/tech-scout.md`.

## What's the same in every direction
- **Look:** a "paper puppet" on Canvas 2D. Backgrounds and textures are painted once at load: paper grain, layered watercolor washes, torn-paper props. Each frame only redraws Zoe, a stretchy cutout around a chain of joints with springy ears and tail, an ink line, and a hard paper shadow. The world is cool blue-grey, like her real blankets. Zoe is warm cream and apricot. Food is warm and bright, and hazards are cool, so you can tell friend, food, or foe by color.
- **Tech:** plain JavaScript in about 10 small files, with no build step and no libraries. The same `src/` folder is both the website (GitHub Pages) and the Chrome extension. The only extension permission is `storage`.
- **Playfield:** a fixed **400×600 portrait arena**. It fills the extension popup exactly and fits phones and laptops with a paper border around it. Everyone plays the same arena, so scores are fair.
- **Controls:** one direction plus one button. Drag a floating thumb-pad on phones, point with the mouse, or use the arrow keys or WASD and Space. Zoe turns at a limited rate, so every input feels the same.
- **Sound:** synthesized squeaks, boops, and barks. A "Tap to play" screen unlocks audio on every device.
- **Rounds:** 60 seconds, a best score to beat, and restart in under a second.

## ✅ Chosen by Vinny (Oct 2, 2026): "Leash Lasso" (Direction A, reworked)
- **No body lasso.** Zoe has slipped out of her walk and **drags her leash behind her**. When she crosses her own leash, the loop closes and catches everything inside: socks, shoes, cheese. Cheese makes the leash longer for a while, so bigger loops become possible.
- **The long body still matters, as a stretch move.** On the action button, her body shoots forward in a quick lunge, like a tape measure. Use it to snap a loop shut, grab something, or escape a dog. Her rear end catches up afterwards.
- The other traits carry over from A: other dogs are hazards, her ball gives zoomies, blanket piles are hiding spots, the bath is a hazard, and each round ends with Zoe asleep in a silly pose.

## The three directions offered

### A. Sock Lasso ⭐ recommended
Zoe zooms around the room. **When her head crosses her own body, the loop lassos everything inside it**: socks, shoes, cheese. Bigger loops and chains of loops score more. Cheese makes her longer for a while, catching her ball triggers **zoomies**, and **blanket piles** hide her from **other dogs**. The **bath** sweeps across as a hazard. Each round ends with Zoe asleep in a silly pose.
- *Why:* the long body is the action, not just the look. It's the most original of the three and uses all 8 of her traits. It's easy to learn and has real depth: a small safe loop or a big risky one.
- *Risk:* the loop detection has to feel fair, and her body could crowd a small screen. Build size is small to medium.

### B. Blanket Fort Reel
Zoe's back half stays in her blanket fort while her front half stretches out, **wraps around chair legs** to grab loot, and zips back like a tape measure.
- *Why:* a great rhythm of reaching out and reeling back, and it's very "doxie".
- *Risk:* it's the closest to existing stretchy-dachshund games, and the wrapping code is the hardest. Build size is medium.

### C. Belly Bounce
Zoe's long body is a bendy trampoline. Hold to sag it, then release to spring her ball up and knock down socks and cheese.
- *Why:* the simplest to build and instantly understood.
- *Risk:* it plays like Breakout with a dog skin. It's the least original. Build size is small.

## If we pick A, the plain-shapes prototype (Phase 2) must prove
1. Steering feels smooth on a real phone, with a mouse, and with keys.
2. Closing a loop is forgiving and **feels great**, even in grey boxes, with a brief freeze-frame, a flash, and a rising blip sound.
3. Her body length fits the 400×600 arena.
4. There's real tension between small safe loops and big risky ones.
5. New players and practiced players get clearly different scores.
