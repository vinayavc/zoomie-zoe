# Handoff: pick up here (updated Oct 12, 2026)

## Tomorrow: pick up here (written Oct 12, 2026)
**Live and shared:** https://vinayavc.github.io/zoomie-zoe/ (`main`). Vinny is sharing it with friends today, and GoatCounter is counting visits and installs.

**Shelved, but kept open on purpose:**
- **Issue #2** "Phones: double-tap to cinch…", https://github.com/vinayavc/zoomie-zoe/issues/2
- **PR #3** "Double-tap to cinch on phones" (branch `issue-2-double-tap-cinch`), https://github.com/vinayavc/zoomie-zoe/pull/3
  - Built, playtested in the emulator, and follow-up fixes done (the "not ready" cue at the thumb, the pad hint following the last input).
  - **Only step left: Vinny tries it on his real phone, then merges or asks for tuning.**
  - The tunables are at the end of `src/config.js`: `TAP_MAX_MS` 250, `TAP_MAX_MOVE` 12, `DOUBLE_TAP_MS` 300, `DOUBLE_TAP_DIST` 60.
  - Notes: `docs/issue-2-notes.md`. Playtest: `docs/issue-2-playtest.md`.

**How to test the branch on the phone:** see **`docs/testing-on-your-phone.md`**.
- A: same Wi-Fi
- B: USB cable plus Chrome port forwarding (Android, most reliable)
- C: merge and revert if needed
- The Mac's Wi-Fi looked like it might block phone-to-Mac traffic on Oct 12 (address `10.248.x`), so **try B first**.

**To resume with Claude:** "Read docs/HANDOFF.md and help me test PR #3 on my phone."

**Local state:** this folder is on `main`, matching live. No servers are running.

---


## LAUNCHED
**Live: https://vinayavc.github.io/zoomie-zoe/.** Every push to `main` publishes automatically (`.github/workflows/pages.yml`).

- **Verified:** the live site loads with no errors, the service worker is scoped to `/zoomie-zoe/`, and Vinny confirmed offline play on his Android phone.
- **Analytics (Oct 12):** GoatCounter `zoomiezoe` (dashboard https://zoomiezoe.goatcounter.com, Vinny's login), via `src/js/analytics.js`. It counts pageviews plus the `app-installed` and `app-launch` events, only on vinayavc.github.io, and respects DNT/GPC. Vinny chose not to track rounds, themes, or scores; ask before adding any.
- **Every release:** bump `CACHE_VERSION` in `src/sw.js` and run `store/tools/check-precache.py`.
- **Post-launch backlog:**
  - the `art/util.js` `offsetPts` outline issue
  - snap-heavy rounds (try `DOG_SNAP_PAD`)
  - the mirrored floor faintly visible under Spring's slim header
  - "Best 42" showing in the store screenshots
  - the GitHub Actions `ubuntu-latest` runner moving to Ubuntu 26 (Oct 19, 2026)
  - the shelved Chrome Web Store kit in `store/`

Everything below is the history from before launch.

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
