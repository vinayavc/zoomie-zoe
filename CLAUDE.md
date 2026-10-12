# Doxie Arcade: Project Brief & Handoff

Moved from a claude.ai chat (Oct 2, 2026). Read this file fully before doing anything.

## Goal
A fun, artsy **dachshund-themed arcade mini-game**.

## Decisions already made (by Vinny)
- **Format:** arcade mini-game. Short rounds and a score to beat. The long body is the core mechanic.
- **Art style:** watercolor storybook + paper cutout / collage.
- **Platform (updated Oct 11, 2026):** one codebase in `src/`, launched as an **installable web app (PWA)**: a website that works **offline** after the first visit and can be added to the home screen on iPhone, Android, and desktop. Hosted free (e.g. GitHub Pages), with no store fee or review.
  - Touch, mouse, and keyboard input. It scales to portrait phones and desktop.
  - The **Chrome extension is shelved** for now. The MV3 `manifest.json` and the `store/` kit stay in the repo for later, so keep the code MV3-safe: no inline scripts, no remote code, no CDN.
- **Themes (Oct 11, 2026):** the player picks a theme before a round: **Bedroom** (default), **Halloween**, **Christmas**, or **Spring** (flowers, new leaves, cute bunnies). Each is a **full makeover**: backdrop, items, theme critters in place of the dogs, a Zoe costume, and a sound twist. **The rules never change between themes.** The player can choose a theme before any play, and **it stays picked until they change it**. The 3-round reset was dropped on Oct 11.
- **Star:** Zoe, Vinny's blonde long-haired mini dachshund. See `docs/character-sheet.md` (approved Oct 2, 2026).
- **Name:** **Zoomie Zoe**, tagline "a leash-lasso sock heist" (Vinny, Oct 2, 2026). It replaces the working title "Doxie Arcade" everywhere the player can see it. The project folder and internal storage keys keep the old name.
- **Originality:** no copying existing characters, brands, or game art. The doxie and its world are original.

## Character details (done)
Collected from Vinny and written to `docs/character-sheet.md`. Reference photo pending in `docs/ref/`. Original checklist:
1. The dog's name and any nicknames to show on screen
2. Look: coat color and pattern, hair type (smooth/long/wire), standard or mini, distinctive features
3. Personality: obsessions (toy, squirrels, snack), funny habits, dislikes (baths, mailman…)
4. Optionally, a photo for color and shape reference

Turn the answers into `docs/character-sheet.md`. Every agent works from it. Quirks can become the game's goal and its hazards.

## Workflow rules
- **Orchestrator:** main thread on Opus with high effort. It plans, delegates, reviews, and integrates. It doesn't do bulk work itself.
- **Team:** subagents on Opus with medium effort. Define them in `.claude/agents/*.md` and set `model` and effort in the frontmatter.
- **Heartbeat:** about every 5 minutes, check each running agent against its job card. If one drifts (scope creep, side quests, stalling), send a short course-correcting nudge.
- **Keep the main thread lean:** agents write their full output to `docs/` or `research/` files and return a summary of 1 page or less. The orchestrator reads only the summaries unless it needs detail.
- **Always ask with AskUserQuestion.** Every question for Vinny, including open-ended ones like names, goes through the AskUserQuestion tool and never as a plain-text list. For free-text answers, offer a few options and let Vinny type under "Other".
- **No one-shotting:** build in phases, and **get Vinny's approval after every milestone** before starting the next phase.
- **Git:** the repo is https://github.com/vinayavc/zoomie-zoe (public, branch `main`). Commit with Vinny's no-reply identity (set in the repo config) and **push incrementally**, one commit per finished, approved step. Keep `docs/ref/` (personal photos), `archive/`, and `docs/screens/` out (see `.gitignore`). GitHub Pages stays off until launch.
- **Plans in plain words:** explain each phase ELI5-style before starting it.

## Phased plan
**Phase 0: Define (done).** Collect the character details above.

**Phase 1: Scouting.** Three agents run in parallel. Each returns 3 options, a recommended pick, and source links.
- *Art scout:* how to do watercolor and paper-cutout looks in code (Canvas/SVG texture, layered shapes, paper grain, palettes), plus how to draw the original doxie procedurally with no image files.
- *Fun scout:* arcade mechanics where the long body is the hook (stretching, wiggling, tangling), plus game-feel and "juice" techniques that make it satisfying.
- *Tech scout:* the simplest stack for phone and laptop. Ideally a single self-contained web page with touch and keyboard input, sound generated with the Web Audio API, and solid performance on mobile.
- *Sources:* game-feel and design write-ups (for example GDC talks on juice), art references for palettes and techniques, MDN docs for Canvas and Web Audio.
- *Output:* a one-page concept doc offering 2–3 directions. → **Vinny approves.**

**Phase 2: Greybox prototype.** Core loop only, using plain shapes, to prove it's fun before adding art. → **Vinny approves.**

**Phase 3: Art and sound.** The chosen style, animation, and sound effects (barks, squeaks). → **Vinny approves.**

**Phase 4: Polish and ship.** Menus, scoring, mobile tuning. Then a fresh-eyes playtest agent that hasn't seen the code plays the game and reports bugs. Add the four themes, make it an installable offline web app, and ship it at a shareable link. → **Vinny approves.**

## Suggested folder layout
```
docs/        character-sheet.md, concept.md, phase notes
research/    one file per scout
src/         the game
.claude/agents/  art-scout.md, fun-scout.md, tech-scout.md, builder.md, playtester.md
```
