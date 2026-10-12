# Testing a branch on your phone

The live link (https://vinayavc.github.io/zoomie-zoe/) always shows **`main`**. To try a branch, such as PR #3's `issue-2-double-tap-cinch`, before it goes live, run it on your Mac and open it on your phone. There are three ways to do that. Start with A.

---

## Step 0: put the Mac on the branch
In the Terminal, inside the project folder:
```bash
cd ~/Documents/Claude_project_doxie_arcade
git switch issue-2-double-tap-cinch
```
(When you're done testing, run `git switch main` to go back.)

Or just tell Claude: "switch to the double-tap branch and set up a phone test."

---

## A. Same Wi-Fi (easiest, works on most home Wi-Fi)
1. Start a server the phone can reach. Leave this Terminal window open while you test:
   ```bash
   python3 -m http.server 8750 --bind 0.0.0.0 --directory src
   ```
2. Find the Mac's Wi-Fi address:
   ```bash
   ipconfig getifaddr en0
   ```
   It prints something like `192.168.1.23`.
3. On your phone:
   - Connect to the **same Wi-Fi** as the Mac (not mobile data).
   - Open Chrome and type `http://` + that address + `:8750`, for example `http://192.168.1.23:8750`. Type the `http://`.
4. If the Mac asks whether **python3** may accept incoming connections, click **Allow**.
5. Play. Press **Ctrl+C** in the Terminal when you're done.

**Won't load?**
- The phone is on a different network, or the Wi-Fi blocks devices from talking to each other. Guest, work and café networks often do; an address like `10.x.x.x` can be a hint.
- Use method B instead.

---

## B. USB cable (Android, works on any network)
Chrome lets your phone open the Mac's `localhost` over a USB cable.

1. **On the phone, turn on Developer options** (one time only): Settings → About phone → tap **Build number** 7 times.
2. **Turn on USB debugging:** Settings → System → Developer options → **USB debugging** on.
3. **Plug the phone into the Mac** with a USB cable, and tap **Allow** on the phone's "Allow USB debugging?" prompt.
4. **On the Mac, start the local server:**
   ```bash
   python3 store/tools/dev-server.py
   ```
   This serves the game at `localhost:8742`.
5. **On the Mac, open Chrome** and go to `chrome://inspect/#devices`.
6. Click **Port forwarding…** and add a rule: port **8742** → **localhost:8742**. Tick **Enable port forwarding** and click Done.
7. **On the phone, open Chrome** and go to **http://localhost:8742**.

This is the most reliable method. It also behaves like the real site for offline mode and installing, because `localhost` counts as secure.

---

## C. Merge and test live (fastest, small risk)
1. Merge the PR on GitHub. Everyone gets the new version on the live link about a minute later.
2. Test on the live link.
3. If it feels wrong, undo it: on the merged PR's page, click **Revert**, then merge the revert PR. Or ask Claude to revert it.

Use this only for small, low-risk changes, since friends will see it too.

---

## What's different when testing via A
- Offline mode and "Install app" won't work on `http://192.168…` addresses (the browser only allows them on secure addresses). That's expected.
- Best scores and the saved theme are separate from the live site.
