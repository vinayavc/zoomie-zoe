# Submitting Zoomie Zoe to the Chrome Web Store: what Vinny clicks

Follow these steps in order. Steps marked 🔒 **VINNY ONLY** involve his money, identity, passwords or the final send. Claude prepares everything else but **never** does these.
Button and tab names come from the official Chrome docs (links at the bottom). The dashboard may be worded slightly differently on screen.

---

## Before you start (prepared by the team)
- [ ] Phase 4B is approved, and `src/manifest.json` has the store `description` from `store/listing.md` plus a higher `version`.
- [ ] Screenshots are in `store/screenshots/`: 1280×800, between 1 and 5 of them (**TODO after Phase 4B**).
- [ ] The web version and `privacy.html` are live on GitHub Pages (see `store/web-hosting.md`). Write down the privacy URL.
- [ ] The zip is built: `sh store/tools/make-zip.sh` → `store/doxie-arcade-<version>.zip`.
- [ ] `store/listing.md` is open in another window, ready for copy and paste.

---

## A. Developer account (one time only)
1. 🔒 **VINNY ONLY: choose the Google account.** Go to https://chrome.google.com/webstore/devconsole and sign in. **The account's email can't be changed later.** Google suggests a separate account just for publishing, one you check often.
2. 🔒 **VINNY ONLY: turn on 2-Step Verification** for that Google account at https://myaccount.google.com/security → **2-Step Verification**. Google requires it before you can publish or update anything.
3. 🔒 **VINNY ONLY: accept the developer agreement and policies**, then **pay the one-time registration fee** (US $5 at the time of writing; the dashboard shows the exact amount).
4. 🔒 **VINNY ONLY: fill in the Account page.**
   - **Publisher name:** shown under the game's title, e.g. `Vinny` or `Zoomie Zoe`.
   - **Contact email** → click the **verification link** Google emails you. This is required.
   - **Physical address:** not needed, since the game sells nothing.
   - **Trader / non-trader status** (EU rule): if the dashboard asks, Vinny declares it himself. A free hobby game is normally **non-trader**, but this is his legal call.
   - Optional: turn on email notifications for review results.

## B. Upload the game
5. In the dashboard, click **Add new item**.
6. Click **Choose file**, pick `store/doxie-arcade-<version>.zip`, then click **Upload**. If it complains about the manifest, the zip probably has a `src/` folder inside. Rebuild it with the script.

## C. Store listing tab
7. **Description:** paste the long description from `listing.md`. Remove any features that didn't ship.
8. **Category:** `Games`. **Language:** `English`.
9. **Store icon:** upload `src/icons/128.png`.
10. **Screenshots:** upload the 1280×800 PNGs from `store/screenshots/`, between 1 and 5.
11. **Small promo tile:** upload `store/promo-440x280.png`. Skip the marquee tile and the YouTube video.
12. **Homepage URL** and **Support URL:** the GitHub Pages address and the repository address. Leave **Mature content** off.
13. Click **Save draft**.

## D. Privacy tab
14. **Single purpose:** paste from `listing.md`.
15. **Permission justification → storage:** paste from `listing.md`.
16. **Remote code:** select **No, I am not using remote code**.
17. **Data usage:** leave **every** data-type box **unticked**, then tick **all three** certification boxes.
18. **Privacy policy URL:** `https://<github-username>.github.io/zoomie-zoe/privacy.html`
19. Click **Save draft**.

## E. Distribution tab
20. **Payments:** free. **Visibility:** **Public**, or **Unlisted** to try it with just the link first. **Regions:** **All regions**.
21. Click **Save draft**.

## F. Test instructions tab
22. Leave it empty: the game has no login. If you'd like, add: *"Click the toolbar icon to open Zoomie Zoe. Click Play; steer with the mouse or the arrow keys; click or press Space to cinch the leash. Esc pauses."*

## G. Send it
23. 🔒 **VINNY ONLY: click Submit for review** and confirm.
    - The dialog has a box to **publish automatically once approved**. Untick it if you'd rather click **Publish** yourself afterwards. Staged items must be published **within 30 days**, or they go back to draft.
24. **Wait.** Most reviews take a few days but can take a few weeks. If it's still pending after 3 weeks, contact developer support.
25. **When it's approved:** install it from the store on a fresh Chrome profile and play a round. Check that the best score sticks after closing and reopening the popup.

---

## Later updates
Raise `version` in the manifest → rebuild the zip → dashboard → the item → **Package → Upload new package** → update screenshots or text if needed → 🔒 **VINNY ONLY: Submit for review**.

## Official sources
- Register (fee, email can't be changed): https://developer.chrome.com/docs/webstore/register
- Account setup (publisher name, verified email, address only for paid items): https://developer.chrome.com/docs/webstore/set-up-account
- 2-Step Verification required: https://developer.chrome.com/docs/webstore/program-policies/two-step-verification
- Trader / non-trader declaration: https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure
- Publish steps (Add new item, tabs, Submit for review, 30-day staging): https://developer.chrome.com/docs/webstore/publish
- Store listing fields: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- Privacy tab: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- Distribution tab: https://developer.chrome.com/docs/webstore/cws-dashboard-distribution
- Images: https://developer.chrome.com/docs/webstore/images
- Review times: https://developer.chrome.com/docs/webstore/review-process
