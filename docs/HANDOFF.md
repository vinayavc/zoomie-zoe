# Handoff: current status (updated Oct 11, 2026)

- **Approved by Vinny:** Phases 1, 2, 3, and 4A. Snapshots are in `archive/`.
- **Decisions on Oct 11** (also in CLAUDE.md): launch as an **installable offline web app (PWA)**, with the Chrome extension shelved. Add **4 themes** (Bedroom default, Halloween, Christmas, Spring), each a full makeover with theme critters. After 3 rounds in a theme, it switches back to the Bedroom.
- **The plan is in `docs/phase-4-themes-pwa-plan.md`.** The order:
  1. 4B-finish and the PWA builder, running in parallel
  2. T1: theme engine and picker
  3. T2: three theme artists in parallel
  4. screenshots
  5. 4C: playtest
  6. 4D: ship on GitHub Pages, after Vinny OKs the repo
- **Dev server:** `python3 store/tools/dev-server.py` serves `src/` on http://127.0.0.1:8742 with no caching. Once the PWA's service worker exists, unregister it on 127.0.0.1:8742 before dev testing, or test at http://localhost:8742 (see `docs/pwa-notes.md`).
- **Git:** https://github.com/vinayavc/zoomie-zoe. Commit and push per approved step (see the Git rule in CLAUDE.md).
- **Status (Oct 11, late):** themes approved and pushed. 4C fresh-eyes playtest running → fix the top issues → 4D launch (Pages, with Vinny's OK).
- **Agents:** `.claude/agents/builder.md` and `playtester.md` (Opus, medium effort). The orchestrator runs a 5-minute heartbeat and checks file ownership.
