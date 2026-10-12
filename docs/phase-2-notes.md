# Phase 2 Notes: Greybox "Leash Lasso"

The game is built from plain grey shapes. Zoe is a grey chain of circles with a black nose dot that shows which way she's facing. Socks are small squares, shoes are wide rectangles, cheese is a triangle, and the other dogs are dark blobs. A "!" over a dog means it's chasing her.

## How to run it

### On the web (laptop or phone on the same Wi-Fi)
1. Open the Terminal app.
2. Type `cd ` (with a space), drag the `src` folder into the Terminal window, and press Return.
3. Type `python3 -m http.server 8000` and press Return. Leave the window open.
4. In Chrome or Safari, go to **http://localhost:8000**.
   - To play on a phone on the same Wi-Fi, use `python3 -m http.server 8000 --bind 0.0.0.0` instead, find your Mac's IP address (System Settings → Wi-Fi → Details), and open `http://<that-ip>:8000` on the phone.
5. To show the FPS/debug box, add `?debug` to the address (`http://localhost:8000/?debug`) or press the **backtick key** (`` ` ``) during play. (Shift+D became a loop key in Revision 3.)
6. To stop the server, click the Terminal window and press Ctrl+C.

Double-clicking `index.html` **won't work**: browsers block ES modules on `file://` pages. You need either the server above or the extension below.

### As a Chrome extension (popup)
1. In Chrome, go to **chrome://extensions**.
2. Turn on **Developer mode** (top-right switch).
3. Click **Load unpacked** and choose the `src` folder (the one that contains `manifest.json`).
4. "Doxie Arcade" appears in the list. Click the puzzle-piece icon in Chrome's toolbar and pin it.
5. Click the Doxie Arcade toolbar icon. The game opens in a 400×600 popup. (There's no icon yet, so Chrome shows a grey letter "D".)
6. After changing any file, click the circular **reload** arrow on the extension's card in chrome://extensions, then reopen the popup.

Clicking outside the popup closes it, and that ends the round. The best score is saved the moment a round ends, so it's kept.

## Controls (Revision 2)
| Device | Steer | Cinch (stretch + snap the leash shut) |
|---|---|---|
| Phone | Touch anywhere and drag (a floating pad appears and follows your thumb if you drag past its rim) | Tap with a second finger, or tap the round CINCH button (bottom right) |
| Mouse | Zoe steers toward the cursor | Click |
| Keyboard | **← / A heads Zoe toward screen-left, → / D toward screen-right.** She turns there at the normal turn rate, the shortest way. With no key (or both keys) held she goes straight. ↑ ↓ / W S do nothing for now | Space |

Zoe always runs forward and turns at a limited rate. With no input, she goes straight. She bounces off the walls.

## How to play (Revision 1)
1. Steer so the leash trailing behind Zoe swings in an arc around some socks, shoes, or cheese.
2. While the cinch is ready, a **faint dashed line** runs from the end of the leash to Zoe, and the items a press would catch get a **white ring**.
3. Press the action (Space, click, a second finger, or CINCH). Zoe lunges, and the leash snaps shut in a straight line from its end to her collar. Everything inside is caught.
4. Loops smaller than `CINCH_MIN_AREA` (1500 sq px, about a 39×39 box) catch nothing.
5. Cinching shares the stretch's 2 s cooldown. Steering across your own leash still closes a loop too, and it doesn't need the cooldown.
6. Items are caught by loops only. Touching or lunging into a single item doesn't grab it.

## Rules as built
- **Leash:** it's her path from the head back 480 px. It pays out from the collar at the start of the round. A small ring marks the end.
- **Closing a loop:** her head crosses the leash, or comes within 9 px of it. The nearest 70 px of leash is ignored. Everything inside the loop is caught (non-zero winding, so overlapping loops are generous).
- **Stretch-cinch (Revision 1):** pressing the action cinches the leash shut (end → collar) and catches what's inside, if the area is at least `CINCH_MIN_AREA`. Scoring and juice are the same as a steered loop, and cinches count toward chains. The leash isn't used up by a cinch. The preview only shows while the cinch is ready.
- **Stretch:** the head lunges 120 px (about 2 body lengths) over 0.25 s and the body stretches. The rear catches up over 0.35 s. Cooldown is 2 s, shown in the HUD meter and as a ring on the touch button. A lunge can close loops.
- **Items:** sock 1, shoe 3 (rarer), cheese 1 plus a 50% longer leash for 8 s (with a HUD meter, and the leash draws thicker). The field holds at most 7 items, with at most 1 cheese at a time.
- **Dogs:** 2 at the start, then 1 more every 15 s, up to 5. They wander and chase when Zoe's head is within 110 px.
  - A dog touching Zoe stuns her for 0.8 s, resets the chain, and backs the dog off for 1.5 s. Zoe blinks and can't be hit again for 1.5 s in total.
  - A dog touching the leash behind her body cuts it there. Everything beyond the cut is lost, and the leash pays out again.
- **Score:** item points × (1 + 0.5 per extra item in the same loop) × (1 + 0.5 per chained loop). Loops chain when they're closed within 2 s of each other.
- **Round:** 60 s, then the "Zoe naps" card shows the score and best ("New best!" when beaten). Tap, click, or press Space to restart. Restart is instant after a 0.35 s guard.
- **Juice:** 60 ms freeze-frame on a capture, a white flash of the loop, "+N" popups (with "chain xN" or "N in one loop"), and a triangle-wave blip that rises 3 semitones per chained loop. Audio unlocks on "Tap to play".
- **Pause:** switching tabs, locking the phone, or hiding the page pauses the game. Tap or press Space to resume.
- **Best score:** stored in `chrome.storage.local` in the extension and in `localStorage` on the web.

## Decisions the plan didn't cover (I took the simplest option)
1. **D key conflict.** WASD uses D for "right", so the debug overlay was on **Shift+D**; since Revision 3 it is only the backtick key `` ` ``, or `?debug` in the URL).
2. **Empty loops do nothing.** Crossing the leash with nothing inside doesn't use up or reset the leash. A capture doesn't use it up either, so you can keep lassoing with the same leash.
3. **Leash snap cuts at the dog.** You keep the part between Zoe and the dog. Only the part beyond the dog (the "loop in progress") is lost.
4. **The HUD strip counts as wall.** Zoe and the dogs bounce off the top 44 px, and items don't spawn there. Otherwise the area under the score bar would be a safe hiding spot.
5. **Hit invulnerability** (1.5 s) and dog back-off (1.5 s) prevent stun-lock.
6. **A low "bonk" sound plays on a stun or a snap**, using the same synth as the blip. Without it, those moments felt silent and confusing. No other sounds were added.
7. **Items are only caught by loops.** Vinny confirmed this in Revision 1.
8. **File layout:** `config.js` sits at `src/config.js` as the plan says. The other modules are in `src/js/` and `src/js/game/`, following the Tech scout's layout.
9. **Revision 1 choices:**
   - The cinch happens at the moment of the press, using the leash as it is right then, so it matches the preview exactly. The lunge starts on the same press.
   - (Superseded by Revision 2: keyboard steering is now screen-left/right, not rotation.)
   - The touch button and HUD meter now read "CINCH".

## What I verified (in Claude's built-in browser)
- Served `src/` locally. The page loads with **no console errors**, at 400×600 (popup size), at the mobile preset (375×812, letterboxed, scale 0.94, DPR 2 backing store), and at desktop size (centered portrait board).
- **Extension CSP:** I served `src/` with Chrome MV3's default extension CSP header (`script-src 'self'`) and forced the popup layout class. The game loaded and started with no CSP violations, and the page measured exactly 400×600 with no scrollbars.
- **Keyboard (real key presses):** Space starts the round, arrows set keyboard steering, Space triggers the stretch, and Shift+D toggles debug.
- **Mouse (real clicks and hover):** a click starts and restarts the round, and hover makes Zoe steer toward the cursor (I checked the angle matches).
- **Touch (synthetic pointer events, not a real finger):** the pad appears, follows the thumb past its rim, and gives the right steering angle. A second finger and the STRETCH button both trigger the stretch, and releasing clears the pad.
- **Loop closing:** a keyboard-driven circle closes a loop and catches the sock and shoe inside it (score 6 = (1+3)×1.5), while an item outside stays put. A mouse-orbit run caught items repeatedly. I saw the flash, the "+6" popup, and the "2 in one loop" label on screen.
- **Scoring math:** checked a chain (×1.5 at chain 2), a chain reset after a 2.5 s gap, and cheese (leash grows to 720 px, 8 s timer).
- **Stretch:** the head moved 155 px in 0.25 s (35 normal + 120 lunge), the body stretched to 180 px and recovered to 60 px, and pressing again during cooldown was ignored.
- **Dogs:** a touch stuns her (she doesn't move for 0.8 s) and resets the chain. A dog on the leash cut it from 475 to 139 px and showed "snap!". The dog count grows to 5 by 45 s.
- **Full 60 s round** (simulated with a scripted bot): no errors. It ends on the "Zoe naps" card, and the best score was saved and still there after a page reload. Restart works with a real click.
- **Pause:** a page-hide pauses and freezes the timer, and Space resumes.
- **Cost:** about 0.006 ms per simulation step and about 0.04 ms CPU per frame to draw, so frame time is far from a concern.

### Revision 1 checks (port 8742 dev server)
- No console errors after the reload.
- The start screen shows the new hint.
- **Holding ←** (Revision 1 behavior, since replaced): Zoe's heading turned steadily at about 258°/s and she circled. Holding ↑ changed nothing.

### Revision 2 checks (port 8742, own tab, hard-reloaded modules)
- Holding ← from facing up ended heading left (-90° → -133° → -176° → 180°). From facing down it did the same (90° → 133° → 176° → 180°).
- Holding → (or D) from facing left turned her around to heading right (180° → 137° → … → 0°).
- With no key, both keys, or ↑ held, she kept going straight.
- No console errors.
- **Cinch:** I steered a U-shaped arc (about 9,800 sq px). The preview ringed the 2 items inside and not the 2 outside. Pressing Space caught exactly the 2 inside (score 6 = (1+3)×1.5), left the outside ones, and started the lunge and cooldown.
- **Tiny loop:** a cinch right at round start (area 0) caught nothing.
- I saw the dashed line and white rings in a screenshot.

## What I could NOT test
- **Real-time feel.** The browser pane was hidden during my session, so the page ran at only about 6 frames per second. I tested the game logic by stepping the simulation directly, so **nobody has judged steering feel, speed, or loop satisfaction at 60 fps yet.** That's Vinny's playtest.
- **A real phone or real touch** (iOS Safari audio unlock, the mute switch, thumb-pad comfort, notch and safe areas).
- **The actual Chrome extension popup** (Load unpacked). I simulated its CSP and size, but didn't load it in chrome://extensions.
- **Hearing the audio.** No errors were thrown, but I couldn't listen.

## Known issues
- **High-refresh screens (120 Hz):** the simulation runs at a fixed 60 Hz with no interpolation, so motion may look slightly less smooth on 120 Hz displays. Easy to add later if anyone notices.
- **A bounce straight back along the leash** can count an "empty close" in the debug counter. This is harmless.
- **A simple circling bot got stunned about 15 times per round.** Dogs may be too sticky for players who loop in place. Watch this in playtests.
- With only 7 items on the field, small safe loops often catch nothing, so players have to aim for clusters. This is probably good for the risk/reward tension, but it's worth watching.

## Most important numbers in `src/config.js`
1. `ZOE_SPEED` (140) and `ZOE_TURN_RATE` (4.5): steering feel. Speed ÷ turn rate gives the tightest circle radius (about 31 px).
2. `LEASH_LENGTH` (480): the biggest loop you can make. Ties directly to "does the leash suit the arena".
3. `LEASH_TOLERANCE` (9) and `LEASH_IGNORE` (70): how forgiving loop closing is, and how small the smallest loop can be.
4. `DOG_CHASE_SPEED` (95), `DOG_CHASE_RADIUS` (110), `DOG_ADD_EVERY` (15), `DOG_MAX` (5): how much risk a big loop carries.
5. `ITEM_CAP` (7) and the item `weight`s: how often loops pay off.
6. `LOOP_SIZE_BONUS` (0.5), `CHAIN_BONUS` (0.5), `CHAIN_WINDOW` (2): how much skill raises the score.
7. `STRETCH_DISTANCE` (120) and `STRETCH_COOLDOWN` (2): how strong the lunge is, and how often you can cinch.
8. `CINCH_MIN_AREA` (1500): the smallest loop a cinch can catch with. `CINCH_PREVIEW_ALPHA` (0.45) sets how faint the preview line is.

You can change any of these live without reloading: open the browser console and type, for example, `doxie.config.ZOE_SPEED = 170`.
