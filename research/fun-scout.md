# Fun Scout Report: Doxie Arcade

**Question:** What short-round arcade mechanic makes Zoe's long body the core hook, and how do we make it feel great?
**Author:** Fun scout (Phase 1). **Date:** Oct 2, 2026. Research only, no code.

---

## 1. What I learned from games where body length or a tether is the mechanic

| Inspiration | What the long body does | Lesson for us (learn, don't copy) |
|---|---|---|
| **Snake / Nokia Snake** | The body is a growing wall. Self-collision is the only threat. | "The threat grows because the player succeeded." Your own body as the hazard gives an automatic difficulty curve. |
| **Slither.io** | Body is a wall for others. Only the head is vulnerable. Boosting costs length. Pros encircle and trap. | Head-only vulnerability is forgiving and readable. Encircling with your own body is a skill players discover on their own and love. Spending length as a resource is a neat tradeoff. |
| **Qix / Paper.io** | Your trail encloses space; closing a loop claims it. A long open trail is exposed and risky. | Loops are inherently satisfying (the "fill" moment). Bigger loop = bigger reward = bigger risk. Qix pays double for the slow, risky draw. |
| **Snakebird** | Body is both a tool (bridge, hang) and the main obstacle; solving is like "untangling a knot." | Puzzle-depth is great but too slow for 30–90 s arcade rounds. Keep the "body is help and hindrance" idea. |
| **Snake Pass** | You wrap the body around poles to grip and climb. | Wrapping around pegs reads instantly as physical and funny. |
| **Noby Noby Boy** | Front and back ends move separately; stretching is the score. | Two-ended control is charming but needs two sticks. Too complex for our one-scheme rule. |
| **Silly Sausage in Meat Land** | Swipe a direction; the dog stretches until it latches onto ground, then pulls the body along. | Proven that a stretchy dachshund on one finger works. **We must not make a swipe-and-latch platformer** or we drift toward cloning it. |
| **Long Puppy** (Playdate) / **Long Dog** (Playdate, WIP) / **Very Long Dog** (itch) | Dachshund that grows by eating, stretches and retracts to fetch a ball; puzzle levels. | The "eat to grow, stretch to fetch the ball" space is already taken. Our concepts avoid "eat food → grow → puzzle." |
| **Untitled Goose Game** | Stealing items, and people chasing you to get them back, is the core joke. | Stealing is funny when someone *reacts*. Every stolen thing needs its own sound. |

**Originality check:** none of the three concepts below is a swipe-latch platformer or a grow-by-eating puzzle. Each combines a known shape (loop/enclose, tether/reel, bounce) with Zoe's own traits, in an original world.

---

## 2. One input scheme for touch, mouse, and keyboard

All three concepts use the **same abstraction: one steering direction + one action button.**

| Device | Steering direction | Action |
|---|---|---|
| **Touch (phone, portrait)** | **Floating, draggable thumb-pad.** Touch anywhere; that point is the center; drag to steer. If the thumb drags past the pad edge, the pad follows it. Zoe stays visible because your finger isn't on her. | Quick tap (or second finger) |
| **Mouse** | Head steers toward the cursor (direction = cursor minus head, with a small dead zone) | Click |
| **Keyboard** | Arrows / WASD, 8-way, smoothed so turns curve instead of snapping | Space |

Why: direct "put your finger on Zoe" control hides the dog under the thumb in portrait; Suzy Cube's dev found a floating, draggable pad feels best on phones. Steering by direction (not position) keeps one rule set across all devices. Make the turn rate limited (Zoe turns in arcs), so keyboard and touch feel the same as mouse. Design the arena in a fixed logical size that letterboxes to portrait phones and the 800×600 popup.

---

## 3. Three game concepts

### Concept A: "Sock Lasso" (recommended)

**Pitch:** Zoe zooms around the living room and loops her long body around stolen socks, shoes, and cheese to scoop them up, while dodging the neighbor dogs and the bath.

**Core loop (60 s round):**
1. Steer Zoe's head. Her body trails behind at a fixed length (like a ribbon).
2. When the head crosses her own body, the closed loop "lassos" everything inside it. Items pop out with a flourish and score.
3. More items per loop = multiplier. Lassoing a **ball** (rare, bouncing around) triggers **Zoomies**.
4. Timer runs out → Zoe flops into an odd sleep pose on the score screen. Tap to restart in under 1 second.

**How the long body matters:** the body *is* the lasso. Length = how big a loop you can draw. Cheese makes her **longer for 8 seconds** (bigger loops, but more body to protect). Crossing yourself is the *goal*, a playful twist on Snake, where crossing is death.

**Controls:** steer (thumb-pad / cursor / arrows). Action = **"Bark"**: a short shove that scares nearby dogs away (cooldown ~3 s). That's the whole game.

**Scoring:** items × loop size bonus × combo (loops chained within 1.5 s). Score to beat shown at top. Qix-style risk: a loop drawn at full length scores extra.

**Hazards:**
- **Other dogs** wander in. If one touches Zoe's *head*, she yelps and drops her last haul (items scatter back). If one is inside a loop, the loop "fails" and is wasted (and they growl).
- **Bath:** a tub with a sudsy puddle. Bubbles drift out; touching one makes Zoe slide (less turning) for 2 s. Head in the tub = lose 5 seconds of timer.
- **Your own body during Zoomies:** speed doubles, so loops close fast but control is twitchy.

**Zoe traits used:** ball (Zoomies trigger), cheese (length power-up), stealing (all loot), zoomies (frenzy mode), blankets (a **blanket pile** that hides Zoe's body from dogs while she passes under it), sleeping poses (game-over), other dogs, baths. **All 8.**

**Juice list:**
- **Loop close:** 60–90 ms hit-stop, small trauma screen-shake, the enclosed area flashes like a paper cutout "stamp," items squash then spring upward.
- **Rising pitch:** each item in a combo plays a squeak a few semitones higher (Web Audio, with slight random detune so it never sounds robotic).
- **Body:** segments bunch and stretch with speed. Ears and tail are little chains that trail and overshoot when she turns (follow-through). Ears flap on every bark.
- **Paper-scrap particles** for loot, soap bubbles for bath hits, speed lines during Zoomies.
- **Score pop-ups** that ease out with overshoot (spring curve).
- **Dropped haul:** big shake, items scatter with knockback, sad "awoo."
- **Last 5 seconds:** clock ticks, music pitch rises. **Score screen:** Zoe flops belly-up, slow tail wag.

**Why it's fun:** everyone can draw a circle. Depth comes from loop size vs. risk, chaining, routing around dogs, and timing the cheese. The "enclosing" pleasure is proven by Qix and Paper.io, and here it's a dog hugging her loot with her body, which is very on-character and funny.

**Risks:**
- Loop detection must be forgiving (snap the loop closed if the head is within a few pixels of the body), or it feels unfair.
- If loops are too easy, there's no tension. Tune dog count and item spawn.
- A trailing body on a small portrait screen may crowd the arena. Tune length vs. arena size.
- The thumb-pad needs a quick tutorial ghost-hand.

**Build size:** **Small–medium.** Follow-the-leader body (a list of points), segment-crossing test, point-in-polygon for loot. No real physics needed.

---

### Concept B: "Blanket Fort Reel"

**Pitch:** Zoe's back half stays snug in her blanket fort while her front half stretches out across the room, winding around chair legs to snatch stuff, then *zips* back like a tape measure.

**Core loop (60–90 s round):**
1. Hold to stretch: Zoe's head moves out from the blanket fort; her body unrolls behind her and **wraps around furniture legs** (pegs) as she turns past them.
2. Grab loot by touching it (socks, shoes, cheese, the ball).
3. Release to **reel in**: the body retracts along its path, unwinding around pegs, carrying the loot home. Reel speed builds with path length, so long hauls feel like a slingshot.
4. Loot only scores once it's back in the fort.

**How the long body matters:** the body is a tether with a path. Wrapping around pegs is how you steer around obstacles (and how you get tangled). The longer you stretch, the more you can reach, but the more body is exposed.

**Controls:** steer (thumb-pad / cursor / arrows). Action = **hold to stretch, release to reel in.** On keyboard, hold Space.

**Scoring:** item value × "reel combo" (multiple items in one trip) × wrap bonus (items grabbed after wrapping 2+ pegs).

**Hazards:**
- **Other dog** patrols the room. If it steps over Zoe's stretched body, it "pins" her and she drops one item.
- **Bath hose:** a water spray sweeps across a lane on a rhythm. Getting sprayed snaps Zoe straight back to the fort with nothing.
- **Max length:** stretch too far and she twangs back automatically.

**Zoe traits used:** blankets (home base), stealing, ball (top-value prize), cheese (extends max length), zoomies (a 5 s super-fast reel after 3 perfect trips), other dogs, bath. Odd sleep pose as game-over.

**Juice list:**
- **Stretch tension:** body thins slightly and creaks (rising tone) as it nears max length.
- **Reel snap:** whip-crack "zip" sound, speed lines, body thickens as it retracts, items spin around pegs on the way home.
- **Arrival at the fort:** blanket squash-and-bounce, loot "pops" into a pile, 60 ms hit-stop on big hauls.
- **Wrapping:** soft "thunk" each time the body catches a peg, the chair leg wobbles.
- **Pinned by dog:** shake, yelp, dog wags smugly.

**Why it's fun:** a clean risk/reward rhythm (go out, get greedy, come home). The reel-in is a big satisfying payoff each trip. Wrapping around legs feels physical (Snake Pass showed how good wrapping feels).

**Risks:**
- **Closest to existing stretchy-dachshund games** (stretch/retract to fetch). Wrapping and reeling differentiate it, but it is the least original of the three.
- Rope-wrapping around pegs is the trickiest code of the three (path bending at pegs, unwinding in order).
- Rounds may feel slower and more deliberate than "arcade."

**Build size:** **Medium.**

---

### Concept C: "Belly Bounce"

**Pitch:** Zoe's long body is a bouncy trampoline at the bottom of the screen, and you keep her beloved ball in the air, aiming it at clotheslines full of socks and drifting cheese.

**Core loop (60 s, or until the ball drops 3 times):**
1. Zoe lies stretched across the bottom of the screen. Steering slides her left/right and lets you **bend** her into a curve. Where the ball hits her body, the curve's angle decides where it flies.
2. Hold action to **sag** her body (pull it down like a slingshot). Release just as the ball lands for a super-bounce.
3. The ball knocks down socks, shoes, and cheese from above. Catch falling loot on her back for points.

**How the long body matters:** her body is the paddle. Cheese makes it longer (easier); a dog stealing the ball makes the round chaotic. Bending her body is the aiming skill.

**Controls:** steer (thumb-pad / cursor / arrows) slides and tilts her. Action = hold to sag, release to spring.

**Scoring:** bounces in a row (combo), items knocked down, perfect-timed super-bounces.

**Hazards:**
- **Other dogs** jump in from the sides to steal the ball.
- **Bath bubbles** float down; bouncing one bursts it and splashes Zoe (she shakes off, short stun).
- Ball speed increases with each bounce.

**Zoe traits used:** ball (center of everything), cheese, stealing (knocking down socks), zoomies (frenzy where she dashes side to side automatically for a few seconds), other dogs, baths. Blankets are weak here (maybe a blanket "safety net" power-up).

**Juice list:** squash on her belly at impact (the classic squash-and-stretch case), a pitch that climbs with combo, ball trail, screen-shake on super-bounce, hit-stop on a perfect bounce, socks flutter down like paper, ears flop up on every bounce.

**Why it's fun:** instantly readable (keep the ball up), a strong rhythm, and the slingshot timing gives skill depth.

**Risks:** the long body is more of a **paddle** than a body. It's the most generic of the three (it reads as Breakout or Pong with a dog skin). Bending physics needs tuning. Uses fewer of Zoe's traits.

**Build size:** **Small.**

---

## 4. Juice and game-feel toolbox (shared by all concepts)

Pulled from *Juice It or Lose It* (Jonasson & Purho), *The Art of Screenshake* (Nijman), *Juicing Your Cameras With Math* (Eiserloh), *Game Feel* (Swink), and web game-feel write-ups.

| Technique | Starting numbers | Notes |
|---|---|---|
| **Responsiveness first** | Input to visible reaction in under 100 ms | Swink's definition of "real-time control." Zoe's head must react the same frame. |
| **Hit-stop (freeze frame)** | 35 ms light, 60–90 ms big, never over ~120 ms | Use on loop close, big haul, and getting hit. |
| **Screen shake (trauma model)** | Trauma 0–1, decays linearly; shake = trauma² × max offset; add a little rotation | Use smooth noise, not pure random. A few tenths of a degree of rotation reads as force. Respect `prefers-reduced-motion`. |
| **Squash and stretch** | Keep area constant (wider = shorter); ~300–420 ms with overshoot ease | Zoe's body naturally suits this. Anchor squash at the ground. |
| **Easing** | Spring/overshoot curve for pop-ups and UI, ease-out for movement | Linear motion feels mechanical. |
| **Follow-through** | Ears and tail as short chains (2–4 links) that lag and overshoot | Disney's follow-through/overlap principle. Her feathery ears are the signature, so they should always be moving. |
| **Particles** | 10–40 per event, varied lifetimes 0.5–1 s, upward bias | Use paper scraps and bubbles to fit the collage art style. |
| **Escalating tiers** | Small effects always, big shake only at high combos | Keeps big effects special. |
| **Sound** | Short Web Audio blips (~120 ms), pitch rises with combo, small random detune | sfxr-style presets (pickup, hit, power-up, jump) are a good starting point for barks and squeaks. |
| **Knockback** | Push things away from impacts | Use on dropped loot and on dog-bark shoves. |
| **Instant restart** | Under 1 s from death to playing | Super Hexagon's "one more try" loop. Show best score right on the game-over card. |

---

## 5. Recommended pick: Concept A, "Sock Lasso"

**Why:**
- **The body is the verb.** You don't just *have* a long body, you *use* it to hug your loot. That's the most direct answer to "long body is the core hook."
- **The most original** of the three. It's far from the existing stretchy-dachshund games (swipe-latch, eat-to-grow puzzles).
- **Uses all 8 of Zoe's traits** naturally.
- **Easy to learn, deep to master:** draw circles → bigger circles → chained circles around moving dogs during Zoomies.
- **Small–medium build.** Plain math, no physics engine. Ideal for one HTML file.

**Runner-up:** Concept B (stronger "go out, come back" rhythm, but riskier to build and closer to existing games).

### What the greybox prototype must prove (plain shapes only)
1. **Steering feels good on all three inputs.** Thumb-pad on a real phone in portrait, mouse, and arrows all produce smooth arcs, with no fighting the controls. Tune turn rate and speed.
2. **Closing a loop is reliable and forgiving.** It's never "I clearly crossed and nothing happened."
3. **The loop moment is satisfying even as grey boxes.** Add hit-stop + flash + rising-pitch blip in the greybox, since juice is part of the core here.
4. **Body length vs. arena size.** Find a length where big loops are possible but the screen isn't clogged, on both portrait phone and 800×600.
5. **There's real tension.** With 2–3 wandering "dog" circles, players have to choose between a safe small loop and a risky big one.
6. **60 seconds feels right**, and testers say "one more" after a round (restart in under 1 s).
7. **Score spread.** A first-timer and a 10-round player should differ a lot in score, showing there's skill to master.

---

## 6. Sources

**Juice and game feel**
- Juice It or Lose It, GDC Europe 2012 (Jonasson & Purho): https://www.gdcvault.com/play/1016487/juice-it-or-lose
- Summary of the talk: https://roblog.co.uk/2024/03/juicy-games/
- The Art of Screenshake (Jan Willem Nijman, Vlambeer), video: https://www.youtube.com/watch?v=SkgkIXZ_13Y
- Experiments based on The Art of Screenshake: https://www.bluetengu.com/2014/12/12/art-of-screenshake-experiments/
- Juicing Your Cameras With Math (Squirrel Eiserloh, GDC 2016), slides: http://www.mathforgameprogrammers.com/gdc2016/GDC2016_Eiserloh_Squirrel_JuicingYourCameras.pdf
- The same talk, archived: https://archive.org/details/GDC2016Eiserloh
- Game feel (Steve Swink's definition): https://en.wikipedia.org/wiki/Game_feel
- Review of Swink's *Game Feel*: https://lizengland.com/blog/review-game-feel-by-steve-swink/
- Designing Game Feel, a survey (Pichlmair & Johansen): https://arxiv.org/pdf/2011.09201
- Game feel on the web (squash, hit-stop, shake, Web Audio, with numbers): https://valdemird.com/blog/game-feel-on-the-web/
- Hit-stop durations: https://swordarcade.xyz/guides/game-feel-hitstop-and-screen-shake/
- 12 principles of animation (follow-through, overlap): https://www.cgspectrum.com/blog/12-principles-of-animation
- jsfxr (procedural sound presets): https://github.com/chr15m/jsfxr

**Long-body and tether mechanics**
- Snake genre: https://en.wikipedia.org/wiki/Snake_(video_game_genre)
- Why Snake works (self-collision as the threat): https://dinogame.gg/blog/why-snake-wont-die/
- Slither.io advanced tactics (encircling, boosting): https://iogameguide.com/guides/slither-io-advanced-guide
- Qix (claim area, slow-draw risk/reward): https://en.wikipedia.org/wiki/Qix
- Qix history: https://retroarcade.com/2026/05/06/qix-arcade-history/
- Paper.io 2's natural difficulty curve: https://www.gamedeveloper.com/design/paper-io-2-a-natural-difficulty-curve
- Snakebird (body as tool and obstacle): https://en.wikipedia.org/wiki/Snakebird_(video_game)
- Snakebird design essay: https://www.electrondance.com/tail-meets-head/
- Snake Pass (wrapping around poles): https://en.wikipedia.org/wiki/Snake_Pass_(video_game)
- Noby Noby Boy (two-ended stretching): https://en.wikipedia.org/wiki/Noby_Noby_Boy
- Untitled Goose Game Q&A (stealing and reactions): https://www.gamedeveloper.com/design/behind-the-honk-an-i-untitled-goose-game-i-q-a
- Procedural follow-the-leader and Verlet bodies: https://www.lexaloffle.com/bbs/?tid=154658

**Existing stretchy-dachshund games (to avoid cloning)**
- Silly Sausage in Meat Land, TouchArcade review: https://toucharcade.com/2015/03/26/silly-sausage-in-meat-land-review/
- Silly Sausage, Pocket Gamer review: https://www.pocketgamer.com/silly-sausage/review/
- Long Puppy (Playdate): https://www.heypoorplayer.com/2025/06/17/long-puppy-is-a-quirky-and-fun-puzzle-experience/
- Long Dog (Playdate WIP): https://devforum.play.date/t/long-dog-katamari-but-you-are-a-dachshund-that-likes-to-eat/18962
- Very Long Dog (itch.io): https://ccmcc.itch.io/very-long-dog

**Short rounds and controls**
- Super Hexagon (instant restart, "one more try"): https://en.wikipedia.org/wiki/Super_Hexagon
- Super Hexagon review: https://hardcoregamer.com/reviews/review-super-hexagon/20092/
- Lessons from Suzy Cube (floating and draggable touch pads): https://www.gamedeveloper.com/design/lessons-from-suzy-cube-mobile-controls-that-feel-great
- Touch control patterns (drag vs. joystick): https://cursa.app/en/page/touch-controls-for-mobile-games-input-patterns-and-feedback
