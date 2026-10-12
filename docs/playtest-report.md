# Zoomie Zoe: Fresh-Eyes Playtest Report

Date: 2026-10-11. Build: http://localhost:8742/. Tester: playtester agent (no source read).

## How it was tested (and the limits)

- Sizes: 400x600, 800x600 (the Chrome popup size), 1280x800 desktop, 375x812 phone (touch), and 812x375 sideways phone.
- Input: mouse clicks and drags, keyboard (arrows, WASD, Shift+arrow, Space, Enter, Esc, M), and touch drags with the on-screen CINCH button. Inputs were sent as real pointer and key events. Long stretches were scripted (steer in loops, then cinch), so my scores show what a clumsy player gets, not a skilled one.
- Rounds: at least one full 60 s round in each theme (Bedroom x3, Spooky Night x2, Cozy Christmas x1, Spring Garden x1), plus several short starts.
- **Caveat:** the browser pane was hidden for most of the session, so the page was throttled to about 1-4 fps. The game handled this well: the timer seems to run on game time, so nothing raced ahead. But I could not judge real-time smoothness or how responsive it feels, and I heard no audio at any point. Once, the browser tab closed by itself in the middle of a round ("target closed"). I could not tell whether the game or the pane caused it, and it did not happen again.
- No console errors or warnings appeared at any point.

## First impressions

- The title card looks charming: watercolor paper card, Zoe with a theme costume, a big Play button and four theme tiles. The tagline "a leash-lasso sock heist" hints at the idea, but **the title screen never says what the goal is.** You only learn it from "How to play".
- The **How-to card is good.** Steer, Swing and Cinch are shown as three pictures, followed by four theme-specific rows (power-up, hiding spot, puddle hazard, chaser). After reading it, I understood the loop: drag the leash around goodies, then cinch.
- What still confused me after reading it:
  - "Steer: drag, mouse" made me think Zoe follows the mouse pointer. Hovering does nothing; you have to press and drag, which works like a virtual joystick. Say "click and drag" or "hold and drag".
  - "Shift + arrow loops": I couldn't see clearly what this does differently from normal steering.
  - The "cinch" meter under the score is tiny and only labelled "cinch" / "cinch ready!". It's not clear what it is for, or why a cinch sometimes scores nothing.
  - "Best 29" was already showing before my first round (saved from an earlier session). That's fine, but Best is **one number shared by all four themes**, which is odd when the themes play differently.
- The touch CINCH button only shows up after your first touch. Before that, a phone player sees the keyboard hints and no button.

## Bugs

| # | Severity | Bug |
|---|---|---|
| 1 | Major | Tapping anywhere on the game-over screen starts a new round |
| 2 | Major | Phone portrait is letterboxed and wastes about 30% of the screen |
| 3 | Major | Desktop game-over card runs off the bottom of the screen |
| 4 | Major | Sideways phone: the round starts and runs before "Turn your phone!" appears |
| 5 | Minor | Floating hit words ("snap!", "splash!", "ouch!") overlap the HUD |
| 6 | Minor | Chasers hit Zoe and snap the leash in the first seconds of a round |
| 7 | Minor | Hazards and items can sit under the CINCH button |
| 8 | Minor | Keyboard hints show on touch phones, and some text is tiny |
| 9 | Minor | Space doesn't start a game from the title screen |
| 10 | Minor | Theme label follows keyboard focus, not the selected theme |
| 11 | Minor | No accessible names; the whole UI is one canvas |
| 12 | Minor | The pause menu has no "Quit to title" |

### 1. Tapping anywhere on the game-over screen starts a new round (Major)
- Steps: phone 375x812, play a round to the end. When the "Zoe naps" card shows, tap empty playfield below the card (not on "Play again"). Space does the same on desktop.
- Expected: only "Play again" (or Enter) restarts, ideally after a short lock-out so a late cinch can't trigger it.
- Actual: a new round starts at once and the final score card disappears. During my scripted touch play, a drag that was still going at the end of the round restarted the game, and I never saw my score. A player mashing CINCH or Space in the last second will hit this.

### 2. Phone portrait is letterboxed and wastes about 30% of the screen (Major)
- Steps: 375x812 mobile preset, open the game.
- Expected: the playfield fills the tall phone screen.
- Actual: the game is drawn in a band of about 375x560, with large empty slate bars above and below (roughly 125 px each). Items look small, and the CINCH button sits on top of the playfield even though the empty bar below has room for it. 1280x800 desktop has the same problem: a narrow portrait strip with wide empty sides.

### 3. Desktop game-over card runs off the bottom of the screen (Major)
- Steps: 1280x800 window, Bedroom, finish a round.
- Expected: the whole "Zoe naps" card is visible.
- Actual: the card is drawn low (it seems to move away from where Zoe is napping), and its bottom edge with the theme tiles is cut off at the bottom of the viewport. On the phone, the card's position also jumps between rounds (top in one, lower in another).

### 4. Sideways phone: the round starts and runs before "Turn your phone!" appears (Major)
- Steps: 812x375, tap Play.
- Expected: the rotate prompt shows on the title screen, before the round starts.
- Actual: the title screen and gameplay render as a tiny portrait column, with hint text around 5-6 px and theme tiles around 30 px. The "Turn your phone!" overlay (which pauses the round, good) only appeared after my first touch, and the timer had already dropped from 60 to 52 by then. Rotating back to portrait leaves you on a Pause card, which is correct.

### 5. Floating hit words overlap the HUD (Minor)
- Steps: play near the top edge of the field (Bedroom or Garden).
- Actual: "splash!" printed on top of the "cinch ready!" label, and "snap!" drawn under the mute button or next to "Best". Zoe can also run up under the HUD strip, so her head is partly hidden.
- Expected: keep popup text and Zoe inside the playfield, below the HUD.

### 6. Chasers hit Zoe and snap the leash in the first seconds of a round (Minor, fairness)
- Steps: start a Bedroom round and steer briefly.
- Actual: in 3 of 4 Bedroom starts, a dog bumped Zoe or snapped the leash within about 4 s ("ouch! snap!" at 56 s). In Spooky Night, 5-6 ghosts were on screen in the second half, and one full round scored 0 because the leash kept snapping.
- Expected: a short grace period at the start, and a softer ramp in the number of ghosts.

### 7. Hazards and items can sit under the CINCH button (Minor)
- In Christmas, a slush puddle spawned partly under the CINCH button in the bottom-right corner. In Spooky, the button sits on top of the big jack-o'-lantern decoration.
- On touch, the steering joystick also appears wherever you put your thumb, sometimes right next to CINCH, so it's easy to hit the wrong one.

### 8. Keyboard hints show on touch phones, and some text is tiny (Minor)
- The title and pause cards show "Arrows / WASD steer · Shift + arrow loops · Space cinches · Esc or P pauses · M mutes" even on a touch phone.
- At 375 wide, that line and the HUD "cinch ready!" label are about 9-10 px. On a sideways phone they can't be read.

### 9. Space doesn't start a game from the title screen (Minor)
- Enter does start it when Play has focus, but Space does nothing on the title screen. Space restarts from game over, so this is inconsistent.

### 10. Theme label follows keyboard focus, not the selected theme (Minor)
- After clicking the Bedroom tile, press ArrowRight. Focus moves to the Spooky tile and the label changes to "Theme: Spooky Night", but the background and Zoe's costume stay Bedroom. Pressing Enter at that point selects Spooky.
- It's nice that you can pick a theme with the keyboard, but the label should show the selected theme.

### 11. No accessible names; the whole UI is one canvas (Minor)
- The accessibility tree is empty: there are no buttons or labels for screen readers.

### 12. The pause menu has no "Quit to title" (Minor)
- To change theme or reread How to play mid-round, you have to finish the round or reload the page. Game over lets you change theme but has no How to play.

## Feel and fun notes

**Overall:** the leash-lasso idea is fun and readable once you get it. Drawing a loop and cinching it fills the loop with a pale shape and pops "+1" or "+6", which feels great. The leash trailing from a long dog is a fun use of the dachshund body. The nap pose names on game over ("belly-up flop", "donut curl") are a lovely touch. Sometimes a cinch scored nothing, though, and it wasn't clear why (was the loop too small? not closed?). A brief "missed!" or a loop outline would help.

**Difficulty:** my clumsy play scored 0-17 per round and never got near the saved 29. Chasers that snap the leash are the main source of frustration. A snap wipes out your current loop with no warning, and a chaser's "!" alert appears only just before it bumps you.

**Bedroom:** easy to read. Pale lavender floor, red-white socks, brown shoes, dark grey dogs, white bath puddle, tennis-ball power-up. Socks are small at phone size, about 12 px. A yellow wedge object sat on the floor all round and I never learned what it was. It isn't on the How-to card.

**Spooky Night:** the prettiest theme (wood floor, cobwebs, leaf piles, glowing jack-o'-lantern). Two clarity problems:
- The collectible pails are orange jack-o'-lantern buckets, and the power-up is an orange pumpkin. They look alike at a glance.
- Ghosts become crowded and oppressive late in the round, and this was my lowest-scoring theme.

The green cauldron hazard reads well.

**Cozy Christmas:** cozy rug and plaid blankets, nice. Clarity problems:
- The red ornaments you collect, the gold "jingle ball" power-up and Zoe's red sweater are all round red or gold shapes.
- The reindeer pups are small and brown on a brown wood floor, so they're harder to spot than the other themes' chasers.

**Spring Garden:** clean and readable. Red tulips stand out on the grass, the grey bunnies are clear and the puddle is clear. The flower patches around the edges are busy, and small items near them get lost. Zoe's blonde coat on light green has the lowest contrast of the four themes, but it's still OK.

**Menus:**
- Pause works with Esc, P and the HUD button.
- Switching away from the window or tab auto-pauses, and Esc resumes.
- M and the HUD speaker toggle mute, and the icon updates.
- Restart from the pause menu works.
- The theme you pick is remembered after a reload.
- Changing theme on the game-over card re-skins the scene behind it live, which is a nice touch.

## Prioritized top-5 fixes

1. **Make game-over restarts deliberate.** Only "Play again", Enter or Space should restart, and only after about 0.75 s of lock-out. Ignore taps on empty field and drags carried over from the round (bug 1).
2. **Fill the screen.** Let the playfield grow to the phone's full portrait height and the desktop width. Move the CINCH button into a safe zone where nothing spawns, and keep the game-over card fully on screen (bugs 2, 3, 7).
3. **Fairer opening and ramp.** Add 3-5 s of grace before chasers can touch Zoe or the leash, spawn them away from her, cap the Spooky ghost count lower, and give a clearer warning before a snap (bug 6).
4. **Teach the core loop on the title screen and in the HUD.** Add a one-line goal on the title ("Loop the leash around socks, then CINCH!"), say "click/hold and drag" instead of "mouse", show touch hints on touch devices, and give feedback when a cinch catches nothing (bug 8, first-impression notes).
5. **Theme clarity and layout polish.** Make each theme's collectibles look different from its power-up (Spooky pails vs pumpkin, Christmas ornaments vs jingle ball). Explain or remove the yellow wedge in Bedroom. Keep popup text and Zoe below the HUD. Show "Turn your phone!" before a round starts in landscape (bugs 4, 5).
