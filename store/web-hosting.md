# Putting Zoomie Zoe online (GitHub Pages) and making the store zip

Written for Vinny. No coding needed. Plan on about 15 minutes the first time.

## Part 1: the web version on GitHub Pages (free)

**What this does:** GitHub keeps a copy of the game's files and serves them as a web page at an address like `https://YOUR-NAME.github.io/zoomie-zoe/`. Anyone can open it on a phone or a laptop. The same site also hosts the privacy policy page the Chrome Web Store asks for.

### One-time setup
1. **Make a GitHub account** at https://github.com/signup. *(Only Vinny can do this: it's his account, his email and his password.)* The username you pick becomes part of the web address.
2. **Make a new repository.** A repository is just a project folder on GitHub.
   - Click the **+** at the top right, then **New repository**.
   - **Repository name:** `zoomie-zoe`
   - Choose **Public**. Free accounts can only publish Pages sites from public repositories.
   - Tick **Add a README file**, so the next step has an upload button.
   - Click **Create repository**.
3. **Upload the game files.**
   - In the repository, click **Add file → Upload files**.
   - On your Mac, open Finder and go to the project's `src` folder. **Open** it (don't drag the `src` folder itself), press **Cmd + A** to select everything inside, and drag it all onto the GitHub upload area. The `js` and `icons` folders upload with everything in them.
   - Also drag in **`store/privacy.html`**. It lands next to `index.html`.
   - Scroll down, leave **Commit directly to the main branch** selected, and click **Commit changes**.
   - When it finishes, the top level of the repository should show `index.html`, `manifest.json`, `config.js`, `style.css`, `privacy.html`, `README.md`, and the folders `js/` and `icons/`. If you see a `src/` folder instead, you dragged the folder rather than its contents. Delete it and try again.
4. **Turn on Pages.**
   - In the repository, click **Settings**, then **Pages** in the left menu.
   - Under **Build and deployment → Source**, choose **Deploy from a branch**.
   - Under **Branch**, choose **main** and folder **/ (root)**, then click **Save**.
5. **Wait 1 to 10 minutes**, then refresh the Pages settings screen. It shows **"Your site is live at https://YOUR-NAME.github.io/zoomie-zoe/"**.
6. **Test it.**
   - Open that address on your laptop and on your phone, and play a round.
   - Open `https://YOUR-NAME.github.io/zoomie-zoe/privacy.html` and check that the privacy page shows. That full address is the **privacy policy URL** for the store.

### Updating the game later
Do step 3 again with the new files. Files with the same name replace the old ones. The site updates within a few minutes. If the old version still shows, force-refresh with **Cmd + Shift + R**.

### Good to know
- The game must be opened from the web address, not by double-clicking `index.html`. Browsers block this kind of game when it's opened as a plain file.
- `manifest.json` and the `icons/` folder get published too. That's harmless, because only Chrome reads them.

Official GitHub help:
- Publishing source, root or `/docs` folder: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Uploading files in the browser (up to 100 files at once, 25 MiB each): https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

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
