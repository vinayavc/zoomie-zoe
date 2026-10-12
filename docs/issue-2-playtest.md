# Issue 2 playtest: phone-size double-tap cinch

Date: 2026-10-12. Build at http://localhost:8742/, Spooky Night theme, 375x812 mobile preset.
Input: synthetic touch events (pointerType "touch" plus TouchEvent) sent from the console. Mouse clicks were used only where noted.

## Test conditions (read first)
- The Browser pane was **hidden for most of the session**. rAF ran at 1 to 2 fps, and only one stretch ran at about 60 fps (game time 45 to 14). The game also auto-paused when the page lost focus.
- Because of that I did **not** reach a game-over screen, and I could not judge real-time feel (responsiveness, juice). I did not work around the throttling with code.
- Two results that looked like misses at 2 fps were retested at 60 fps and worked. They are listed as artifacts below, not as bugs.

## 1. Teaching: pass
- On the title, "Swing Zoe's leash around the candy & pails, then cinch!" plus "Drag to steer · double-tap to cinch" make the goal and controls clear.
- The pad under the arena says "hold and drag to steer / double-tap to cinch".
- The How-to card (touch version) has three illustrated steps: "hold and drag anywhere", "swing the leash round", "double-tap to pull it shut". Its footer says "The CINCH button or a 2nd finger works too". This is clear without help.
- Small gap: the CINCH button the card mentions doesn't appear until a round starts, so on the title screen the card points at something you can't see yet.

## 2. Double-tap cinch (at 60 fps): pass
- A double-tap (120 ms gap) fired a cinch, showing "missed!" or scoring a point.
- A sloppy double-tap (250 ms gap, second tap about 18 px away) also fired. The window feels forgiving.
- A double-tap 150 ms and 400 ms after the end of a steering drag both fired.
- No accidental cinch while steering:
  - three quick re-grips (lift, then drag again within 80 to 100 ms, starting at the same spot) did not cinch.
  - tap, then drag 120 ms later, did not cinch.
- Double-tap during cooldown: a "not ready" label pops above the CINCH button, and the button ring and HUD meter show the refill. The feedback is clear, but it appears at the button, about 180 px from the thumb in the pad. A small cue near the touch point would be easier to notice.

## 3. Menus: pass (game-over not tested)
- Title: a double-tap on the title text did nothing, with no zoom and no screen change.
- How-to card: a double-tap on the empty card did nothing.
- Pause: a double-tap on the empty card and on the pad kept the game paused.
- Pause, double-tap on Resume: the first tap resumed and the second tap landed in the arena without causing a cinch. Good.
- Game-over or score screen: **not reached** because of throttling. "Double-tap skips the score screen" is still unverified.

## 4. Alternatives: pass
- Touch tap on the CINCH button fired a cinch.
- Second-finger tap fired a cinch: hold one finger on the pad, then tap a second finger in the arena (held 150 ms). One earlier try at 2 fps (60 ms tap) did not register. That is likely the throttling, and it should be rechecked on a real device.

## 5. Console
- No console messages or errors during the session.

## Bugs
| # | Severity | Steps | Expected | Actual |
|---|---|---|---|---|
| B1 | Low | On the title, tap How to play, then Back, then tap Play about 300 ms after Back | Round starts | The first Play tap was ignored and a second tap was needed. This happened once, at 2 fps, so it may be a throttling artifact or a deliberate input lockout. Recheck at full speed. |
| B2 | Low (hybrid devices only) | On the mobile layout, use one mouse click | Hints stay consistent | The title, How-to and Pause cards switch to keyboard and mouse hints ("Click or Space cinches"), but the bottom pad still says "double-tap to cinch". A mouse click also failed to press Resume on the pause card once, while the page was unfocused and throttled. |
| B3 | Polish | Double-tap in the pad during cooldown | Feedback near the thumb | The "not ready" label appears only above the CINCH button. |

Throttling artifacts, not bugs: one missed double-tap and one missed second-finger tap at 1 to 2 fps. Both worked at 60 fps.

## Feel notes
- The double-tap window is generous, and steering re-grips never cinched by accident. That is the right balance.
- The labels "missed!", "snap!", "ouch!" and "not ready" read well at phone size.
- The CINCH button has a cooldown ring that is easy to read.
- The touch pad takes about 2/3 of the bottom strip, and the CINCH button is placed bottom right for the right thumb.

## Ready to ship?
**Not yet, but close.** No real bugs were found in the double-tap cinch. Before signing off, someone needs to:
1. check the game-over screen against double-tap, and
2. confirm double-tap and second-finger timing at full frame rate.

Both were blocked by the hidden pane. Run this again with the pane visible, or on a real phone.
