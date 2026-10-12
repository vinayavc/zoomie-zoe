# Ship notes: putting Zoomie Zoe live on GitHub Pages

The orchestrator runs this checklist. Live URL: **https://vinayavc.github.io/zoomie-zoe/**
Repo: `vinayavc/zoomie-zoe` (public). The workflow `.github/workflows/pages.yml` publishes `src/` as the site root and copies `store/privacy.html` into it on the build machine.

Launch rule (docs/phase-4c-fix-plan.md, "Launch decisions"): go live **only after Vinny approves the fixed build locally**.

## What's ready (Oct 12, 2026)
- `pages.yml`: `workflow_dispatch` only. The `push: branches: [main]` trigger is commented out ("enable at go-live").
  - Action versions (latest majors, checked against the GitHub docs and each action's releases page): `actions/checkout@v7`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`.
  - Permissions: `contents: read`, `pages: write`, `id-token: write`. Concurrency: group `pages`, `cancel-in-progress: false`.
  - upload-pages-artifact leaves out dotfiles (`.DS_Store`) by default.
- **Sub-path check passed.** A copy of `src/` (plus privacy.html) was served under `/zoomie-zoe/` on `http://127.0.0.1:8748` and loaded in headless Chrome:
  - All 35 page requests returned 200 and stayed under `/zoomie-zoe/`. There were no console errors or warnings.
  - The service worker activated with scope `http://127.0.0.1:8748/zoomie-zoe/`, and the page was controlled after a reload. Cache `zoomie-zoe-v3` held all 39 `FILES`.
  - The manifest's `start_url` and `scope` both resolve to `/zoomie-zoe/`, and all icons returned 200. The canvas drew.
  - No `src/` changes are needed for the sub-path.
- `src/manifest.json` (the shelved extension manifest) is published but harmless. It's a static JSON file that web browsers ignore: the page links `manifest.webmanifest`, and `sw.js` doesn't cache `manifest.json`. It reveals nothing private.
- `src/js/themes/README.md` also gets published as a plain file. That's harmless.

## Go-live checklist

### 0. Before publishing
- [ ] Vinny approved the fixed build locally.
- [ ] Bump `CACHE_VERSION` in `src/sw.js` if anything in `src/` changed since the last publish. Then check the precache list:
  ```
  cd /Users/mousie/Documents/Claude_project_doxie_arcade
  python3 store/tools/check-precache.py
  ```
- [ ] Run a final local check at http://localhost:8742 (`python3 store/tools/dev-server.py`).

### 1. Push the release (the repo already exists)
The repo is https://github.com/vinayavc/zoomie-zoe (public, `main`). `gh` is logged in, and the `.gitignore` already keeps out `docs/ref/` photos, `archive/`, and `docs/screens/`.
```
cd /Users/mousie/Documents/Claude_project_doxie_arcade
git status --short        # only the intended files
git add <files> && git commit -m "..." && git push
```

### 2. Turn on Pages (Vinny, in the browser)
Settings → Pages → Build and deployment → Source: **GitHub Actions**. Ignore the suggested templates. Steps for Vinny are in `store/web-hosting.md`.
Or, with Vinny's go-live OK, from the terminal: `gh api -X POST repos/vinayavc/zoomie-zoe/pages -f build_type=workflow`

Optional: Settings → Environments → `github-pages` → deployment branches: **main** only (GitHub recommends this).

### 3. First deploy (manual trigger)
```
gh workflow run pages.yml --ref main
gh run watch "$(gh run list --workflow=pages.yml --limit 1 --json databaseId -q '.[0].databaseId')"
```
Or use Actions tab → **Publish to GitHub Pages** → **Run workflow**.

### 4. Verify the live URL
```
for p in "" index.html sw.js manifest.webmanifest privacy.html js/main.js js/themes/spring.js icons/192.png icons/maskable-512.png icons/180.png; do
  curl -s -o /dev/null -w "%{http_code}  /zoomie-zoe/$p\n" "https://vinayavc.github.io/zoomie-zoe/$p"
done
```
Every line should be `200`. Then, in a browser at https://vinayavc.github.io/zoomie-zoe/:
- [ ] The title screen draws. Play one round in each of the four themes. The console has no errors or 404s.
- [ ] DevTools → Application → Service workers: `sw.js` is *activated*, with scope `https://vinayavc.github.io/zoomie-zoe/`. Cache storage shows `zoomie-zoe-v<N>` with all files.
- [ ] Application → Manifest: name "Zoomie Zoe", 3 icons, no installability errors. The install icon shows in the address bar.
- [ ] Offline: Network → Offline, reload, and play a round. Then set it back online.
- [ ] https://vinayavc.github.io/zoomie-zoe/privacy.html renders. This is the Chrome Web Store privacy URL; update `store/submit-checklist.md` item 18 with it.
- [ ] Phone (Vinny): open the link and play. Use Add to Home Screen (iPhone) or Install app (Android), then open it in airplane mode.

### 5. Enable push deploys (only after step 4 passes)
In `.github/workflows/pages.yml`, uncomment the two lines under `# enable at go-live`:
```yaml
  push:
    branches: [main]
```
```
git add .github/workflows/pages.yml
git commit -m "Pages: publish on every push to main"
git push
gh run list --workflow=pages.yml --limit 1   # this push should start a run; check it goes green
```

### Every release after that
Bump `CACHE_VERSION` in `src/sw.js`, update `FILES` if any files were added or removed, run `check-precache.py`, then commit and push. The site updates within about 2 minutes. Players get the new version on their next visit plus one reload.

## Rollback
`git revert <bad-commit> && git push` (with push deploys on), or check out the good commit and run `gh workflow run pages.yml --ref <branch-or-tag>`. To take the site down entirely: Settings → Pages → **Unpublish site**.
