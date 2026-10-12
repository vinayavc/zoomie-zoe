# Phase 2 Plan: Greybox Prototype of "Leash Lasso"

## In plain words
We build the game with **plain grey shapes only**: no watercolor and no real art yet. Zoe is a chain of grey circles, socks are little squares, and the other dogs are dark blobs. The goal is to answer one question: **is running around and lassoing things with a leash fun?** If the shapes are fun, the art will make it lovely. If they aren't, we fix the game before spending time on art.

## In scope (build only this)
1. **Project skeleton** (the Tech scout's option B, see `research/tech-scout.md`):
   - `src/index.html` plus ES-module `.js` files, with no inline scripts and no libraries
   - `src/manifest.json`: MV3, opens `index.html` as a popup, `storage` permission only, no icons yet
   - It must run both from a local server and as an unpacked Chrome extension.
2. **Arena:** a fixed logical size of 400×600, scaled to fit with letterboxing. Device pixel ratio capped at 2.
3. **Zoe:** a grey chain of segments (head plus about 10 body segments) that follows a steering direction with a **limited turn rate**.
4. **Controls** (one scheme on every device):
   - Touch: a floating thumb-pad that follows the thumb if you drag past its edge
   - Mouse: point to steer
   - Keyboard: arrows or WASD
   - Action button: Space, mouse click, or a second-finger tap or an on-screen button on touch
5. **Leash:** a trailing polyline of fixed length that comes off Zoe's collar and follows her path.
   - When Zoe's head **crosses her own leash**, the loop closes and every item inside the polygon is caught.
   - Ignore the leash segments nearest her, so it doesn't close by accident.
   - Make detection **forgiving**, with a small tolerance radius.
6. **Stretch move:**
   - On action, the head lunges forward about 2 body lengths over about 250 ms, then the rear catches up.
   - It has a cooldown of about 2 s, shown as a small meter.
   - It counts toward closing loops.
7. **Items:**
   - Socks: 1 point
   - Shoes: 3 points, rarer
   - Cheese: 1 point, and the leash grows +50% for 8 s
   - Items spawn up to a cap.
8. **Hazard: other dogs.** There are 2 to start and more over time. They wander, and chase Zoe when she's near.
   - A dog touching **Zoe** stuns her for about 0.8 s and resets her combo.
   - A dog touching the **leash** snaps it, and any loop in progress is lost.
   - This creates the risk of small safe loops versus big risky ones.
9. **Scoring:**
   - Each item's value times a multiplier based on how many items one loop catches
   - A chain bonus for loops closed within 2 s of each other
10. **Round:** 60 s with a timer, then a "Zoe naps" game-over card showing the score, the best score, and "tap to restart". Restart takes under 1 s.
11. **Best score:** a small storage adapter that uses `chrome.storage.local` in the extension and `localStorage` on the web. Save it the moment the round ends. Pause on `visibilitychange`.
12. **Minimum juice** (so the loop-close moment can be judged):
    - 60 ms hit-stop on capture
    - a white flash of the loop polygon
    - "+N" score popups
    - a rising-pitch Web Audio blip for each chained loop
    - a "Tap to play" start screen that unlocks audio
13. **Tuning:** every number lives in `src/config.js`. Pressing `D` toggles a debug overlay showing FPS, leash length, and loop count.

## Not in this phase
Watercolor or paper art, Zoe's real look, ball and zoomies, blankets, the bath, menus, the tutorial beyond a one-line hint, icons, and the Web Store.

## What it must prove (Vinny judges this)
1. Steering feels good on a phone, with a mouse, and with the keyboard.
2. Closing a loop feels fair and satisfying.
3. The leash length suits the 400×600 arena.
4. There's real tension between safe small loops and risky big ones.
5. Practiced players clearly beat new ones.
6. It runs smoothly (60 fps target) at phone size and in the popup.

## Revision 1 (Vinny's playtest, Oct 2, 2026)
Vinny found the controls confusing: there was no way to close a loop on purpose. Changes:
1. **The action becomes a stretch-cinch.** The action button (Space, click, a second finger, or the STRETCH button) makes Zoe lunge as before, **and the leash snaps shut** in a straight line from the leash's end to her collar.
   - Everything inside the leash path plus that closing line is caught.
   - Tiny loops below a minimum area catch nothing.
   - Closing a loop by steering across the leash still works.
2. **Cinch preview.** While the stretch is ready, show a faint dashed line from the leash end to Zoe and highlight the items it would catch, so the player can see what a press will do.
3. **Keyboard steering is rotational.** ← → (A/D) turn Zoe at the turn rate, and holding one keeps her circling. ↑ ↓ (W/S) do nothing for now. Mouse and touch stay as they are.
4. **Lunge doesn't grab single items.** Items are caught by loops only (Vinny's decision).
5. Update the start-screen hint to match: steer, swing an arc, press to cinch.

## Revision 2 (Vinny, Oct 2, 2026)
Turning relative to Zoe's facing was misleading. **← / A now head her toward screen-left, and → / D toward screen-right**, turning smoothly at the normal turn rate by the shortest way. ↑ ↓ / W S stay unused. With no key held, she keeps going straight. Mouse and touch are unchanged.

## Revision 3 (Vinny, Oct 11, 2026): replaces Revision 2 and the 4B hold-to-loop
The 2-arrow scheme felt limiting. Keyboard now works like this:
- **↑ ↓ ← → (and W S A D) point Zoe toward that side of the screen.** Two keys together give a diagonal (e.g. ↑+→ = up-right). She turns there smoothly at the normal turn rate, the shortest way.
- **Holding a key keeps her running that way.** No more hold-to-loop.
- **Hold Shift plus any arrow to curve her into a loop.**
  - Curve direction: keep rotating the way she was already turning toward that arrow's heading, with no sudden reversal.
  - If she already faces that way: ← and ↑ curve counterclockwise on screen, → and ↓ clockwise.
- Space still cinches. Mouse and touch are unchanged.
