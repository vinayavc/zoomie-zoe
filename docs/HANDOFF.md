# Handoff: pick up here (updated Oct 12, 2026)

Read `CLAUDE.md` first: brief, decisions, workflow rules, the Git rule. Then this file.

## Where we are
Phase 4 (polish and ship) is in progress. Everything through the themes is **approved by Vinny and pushed** to https://github.com/vinayavc/zoomie-zoe (`main`, 10 commits, last one `fb44366`).

**Approved:**
- Phases 1–3 and 4A (extras)
- 4B (menus and polish)
- the offline installable web app (PWA)
- 4-arrow keys with Shift+arrow to loop
- the theme engine and picker (themes persist, no 3-round reset)
- all four themes: Bedroom, Halloween, Christmas, Spring

**Done:** the 4C fresh-eyes playtest. Report: `docs/playtest-report.md`.

**In progress, interrupted by the usage limit:** the 4C fixes. The plan, with Vinny's decisions, is in `docs/phase-4c-fix-plan.md`. Three builders ran in parallel and **all three stopped early**.

## Uncommitted partial work on disk (check this first)
`git status` shows 4 modified files, not committed:
| Builder | Files | State |
|---|---|---|
| **A** (UI, layout, teaching) | none | Never started editing. Redo all of Builder A's items 1–12. |
| **B** (fairness) | `src/config.js` (new entries `CALM_START`, `DOG_SPAWN_AHEAD_DIST`, `DOG_SPAWN_AHEAD_ANGLE`, `CINCH_MISS_TIME`), `src/js/game/dogs.js`, `src/js/game/round.js` | Calm start and spawn-ahead rule partly written. Its last note: "spike right as calm ends (dogs already on top of her); making calm dogs drift away from her head". **Unfinished and unverified.** The `DOG_MAX` cap, before/after numbers, `cinchMissT`, `sfx.whiff?.()` and notes may be missing. |
| **C** (theme readability) | `src/js/themes/christmas.js` | Ornaments recoloured to silver-blue, pups darker with a cream muzzle, and a `pupHalo` colour added. Possibly half-done. **Halloween (pail vs pumpkin ball, ghost size) and the all-themes pass are not started.** |

**How to resume:**
1. Review the diffs with `git diff`.
2. Re-launch three `builder` agents (one per section of `docs/phase-4c-fix-plan.md`). Tell B and C to **continue from the existing edits**, not start over.
3. Keep the file-ownership split and ports from the plan's "Shared rules".
4. Run the 5-minute heartbeat with the ownership and number guard. Existing config numbers must not change, except `DOG_MAX`.

Or, to restart B and C cleanly: `git checkout -- src/config.js src/js/game/dogs.js src/js/game/round.js src/js/themes/christmas.js`.

## What's left to launch
1. **Finish the 4C fixes** (above). Then:
   - load the game for Vinny, get his OK
   - run `store/tools/check-precache.py`
   - bump `CACHE_VERSION` in `src/sw.js` to `'v4'`
   - commit and push
2. **Optional quick re-playtest.** A `playtester` agent re-checks the playtest's top-5 items only.
3. **Ask Vinny the two launch questions** (with AskUserQuestion):
   - splash and status-bar colour: indigo `#3F4A73` or paper cream?
   - on iOS, the installed app keeps its own best score, separate from Safari. Is that OK?
4. **Screenshots** of each theme for the share page and README. `store/screenshots/` is still empty; the item was deferred from 4B.
5. **README.md** for the repo: what the game is, the play link, how to install and play offline, and the credits.
6. **Launch (4D).** With Vinny's explicit OK, publish on GitHub Pages from `main` with `/src` as the site.
   - Pages only serves from the root or `/docs`, so either publish via a GitHub Actions workflow that uploads `src/`, or restructure. **Ask Vinny which he prefers.** The Actions workflow is cleaner.
   - Then check the live link: it installs, plays offline, and runs on his phone.
7. **Shelved:** the Chrome Web Store extension (the kit is in `store/`). Revisit only if Vinny asks.

## Practical notes
- **Dev server:** `python3 store/tools/dev-server.py [port]` (no-cache). Test at **`http://localhost:PORT`**: no service worker there, so you always get fresh code. `127.0.0.1` behaves like the installed app.
- **Agents:** the `builder` and `playtester` agent types in `.claude/agents/` (Opus, medium effort) load at session start. Builders report back to the orchestrator only. Give each builder its own port and tell it to close only its own tab.
- **Git:** author "Vinaya Chandiramani" with the no-reply email (repo config). `gh` is logged in. Commit and push per finished, approved step. Never commit `docs/ref/`, `archive/` or `docs/screens/`.
- **Snapshots:** local copies are in `archive/`, but git history is now the source of truth.
