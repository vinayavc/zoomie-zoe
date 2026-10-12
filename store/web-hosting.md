# Putting Zoomie Zoe online (GitHub Pages) and making the store zip

Written for Vinny. No coding needed. Plan on about 10 minutes the first time.

## Part 1: the web version on GitHub Pages (free)

**What this does:** GitHub keeps the project's files and serves the game as a web page at **https://vinayavc.github.io/zoomie-zoe/**. Anyone can open it on a phone or a laptop. The same site also hosts the privacy policy page the Chrome Web Store asks for.

**How it works:** you don't upload files by hand. The project has a small recipe file, `.github/workflows/pages.yml`, that tells GitHub to take everything in the `src` folder (plus `store/privacy.html`) and publish it. GitHub calls this recipe a *workflow*, and running it is a *GitHub Action*.

### One-time setup
1. **The repository.** The project lives in the repository `vinayavc/zoomie-zoe` on GitHub. It must be **Public**, because free accounts can only publish Pages sites from public repositories. *(Making the account and repository is Vinny's job. Claude pushes the code to it once it exists.)*
2. **Tell GitHub to publish with Actions.**
   - In the repository, click **Settings**, then **Pages** in the left menu.
   - Under **Build and deployment → Source**, choose **GitHub Actions**.
   - GitHub then suggests some ready-made workflow templates. **Ignore them**: the project already has its own (`pages.yml`). Don't click **Configure** on any of them.

### Publishing (for now: by hand, one click)
While the game is still being checked, it only goes live when you ask.
1. In the repository, click the **Actions** tab.
2. In the left list, click **Publish to GitHub Pages**.
3. Click **Run workflow** on the right, keep branch **main**, and click the green **Run workflow** button.
4. Wait 1 to 2 minutes. The run gets a **green tick** when it's done. (A red cross means it failed. Click it to see why, or ask Claude.)
5. **Test it.**
   - Open https://vinayavc.github.io/zoomie-zoe/ on your laptop and your phone, and play a round.
   - Open https://vinayavc.github.io/zoomie-zoe/privacy.html and check that the privacy page shows. That full address is the **privacy policy URL** for the store.

### Later: publish automatically on every update
Once Vinny approves the launch, Claude makes a one-line change to the workflow (it removes the `#` in front of the `push:` lines). After that, **every update pushed to the `main` branch publishes itself** within a couple of minutes. No clicks needed. You can still use **Run workflow** to republish any time.

### Good to know
- **Seeing an old version?** The game saves itself for offline play, so the first visit after an update can still show the old version. Reload once more, or force-refresh with **Cmd + Shift + R** on a laptop.
- Open the game from its web address, not by double-clicking `index.html`. Browsers block this kind of game when it's opened as a plain file.
- `manifest.json` (the Chrome extension's settings file) gets published too. That's harmless: web browsers ignore it, and the web app uses `manifest.webmanifest` instead.

Official GitHub help:
- Publishing with GitHub Actions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow
- Running a workflow by hand: https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow

---

## Part 2: making the Chrome Web Store zip

**What this does:** the store wants one `.zip` file holding the game. `manifest.json` must sit at the **top level of the zip**, not inside a folder. macOS junk files like `.DS_Store` and helper files like `_tool…` must stay out.

### Easiest: the script (one command)
1. Open the **Terminal** app.
2. Paste this line and press Return:
   ```
   sh ~/Documents/Claude_project_doxie_arcade/store/tools/make-zip.sh
   ```
3. It creates `store/doxie-arcade-<version>.zip` and prints its contents. Check that `manifest.json` appears near the top **with no folder in front of it**. The script stops with an error if it doesn't.

### By hand, if needed
```
cd ~/Documents/Claude_project_doxie_arcade/src
zip -r -X ../store/doxie-arcade.zip . -x '.DS_Store' '*/.DS_Store' '_tool*' '*/_tool*' '*/.*'
```
Avoid Finder's **Compress** on the `src` folder. It puts everything inside a `src/` folder in the zip, and that upload gets rejected.

### Before every upload
- Raise `"version"` in `src/manifest.json`, for example `0.2.0` → `0.3.0`. Every upload must have a **higher** version than the last one.
- Make sure the manifest `description` still matches the store line in `store/listing.md`.

Official Chrome help:
- Manifest at the root, required fields, version rules: https://developer.chrome.com/docs/webstore/prepare
- Uploading the zip: https://developer.chrome.com/docs/webstore/publish
