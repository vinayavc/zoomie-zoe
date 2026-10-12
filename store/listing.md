# Chrome Web Store listing: Zoomie Zoe

Tagline (for the promo tile and anywhere a subtitle fits): **a leash-lasso sock heist**

Copy and paste each block into the matching field of the developer dashboard.
Checked against the official Chrome docs on Oct 2, 2026 (links at the bottom).

---

## Name
```
Zoomie Zoe
```
The store shows the `name` from `src/manifest.json`, so it must match. The manifest limit is 75 characters.

## Short description (manifest `description`, 109 of 132 characters)
```
Help Zoe the mini dachshund lasso socks with her leash. A cozy 60-second arcade game in watercolor and paper.
```
Done in Phase 4B: `src/manifest.json` now uses this line (it must stay plain text of 132 characters or fewer).

Spare options if Vinny wants a different tone:
- `Swing Zoe the dachshund's leash around socks and cinch it shut! A cozy 60-second arcade game in watercolor and paper.` (117 characters)

## Long description (Store listing tab → "Description")
```
Zoe is a miniature long-haired dachshund with a very long body, very floppy ears, and a habit of stealing socks.

In Zoomie Zoe you steer Zoe around her cozy bedroom while her leash trails behind her. Swing the leash around socks, shoes and cheese, then cinch it shut to scoop everything inside the loop. Bigger loops and quick chains score more. Watch out for the other dogs: one bump and Zoe gets dizzy, and if they touch the leash it snaps.

Each round lasts 60 seconds. Beat your best score, then go again.

FEATURES
• Quick 60-second rounds with a best score to beat
• A long-body lasso mechanic you won't find anywhere else
• Hand-painted look: watercolor washes and paper cutouts, all drawn in code
• Zoe's extras: grab the ball for the zoomies, hide under the blankets, dodge the bath
• Playful synthesized sounds: yips, squeaks, boofs and a sleepy sigh
• Plays right in the toolbar popup. No sign-up, no ads, no tracking

CONTROLS
• Steer: drag the thumb-pad, move the mouse, or use the ← → (or A / D) keys. Hold a key to keep circling
• Cinch: tap the CINCH button or a second finger, click, or press Space
• Pause: the pause button, Esc or P
• Sound: the speaker button or the M key

PRIVACY
Zoomie Zoe collects no data. Your best score and your sound setting are saved only on your own device.

Zoe is a real dog. The game's art and characters are original.
```
> **Before submitting:** check that every feature and control above is still in the game (updated for Phase 4A extras and the 4B pause and sound buttons). Reviewers reject listings that promise features the game doesn't have.

## Category
**Games**. That's one of the official extension categories; **Just for Fun** is the closest alternative.

## Language
English

## Graphic assets
| Asset | File | Status |
|---|---|---|
| Store icon, 128×128 PNG (96×96 art + 16 px transparent padding) | `src/icons/128.png` | Done |
| Small promo tile, 440×280 (required) | `store/promo-440x280.png` | Done |
| Screenshots, 1280×800 or 640×400, square corners, full bleed, 1 to 5 of them (5 recommended) | `store/screenshots/` | **TODO after Phase 4B.** Take them from the real game once menus and polish are final. The popup is 400×600, so place it on a 1280×800 frame with the bedroom art or a plain paper background. |
| Marquee promo tile, 1400×560 | — | Optional. Only needed if the store features the item. Skip it. |
| YouTube video | — | Optional. Skip it. |

## Additional fields (optional)
- **Homepage URL:** the GitHub Pages address of the web version, for example `https://<github-username>.github.io/zoomie-zoe/`
- **Support URL:** the GitHub repository's Issues page, or the same homepage
- **Mature content:** No

---

# Privacy practices tab

## Single purpose description
```
Zoomie Zoe is a single, short arcade game played in the toolbar popup: steer Zoe the dachshund and lasso socks with her leash to beat your best score. It does nothing else.
```

## Permission justification: `storage`
```
Used only to save three small values on the player's own device with chrome.storage.local: the best score, the sound on/off setting, and whether the how-to-play card has been seen. Nothing is sent anywhere.
```
`storage` is the only permission. There are no host permissions, content scripts, or other APIs, so the dashboard should ask about this one field only.

## Remote code
Choose **"No, I am not using remote code."**
Justification (only if the dashboard asks):
```
All JavaScript is bundled in the package as local files loaded by index.html. The extension makes no network requests, uses no eval, and loads no external scripts, fonts or images.
```
(Checked on Oct 2, 2026: there are no `fetch`, XHR, WebSocket, `import()` or `http(s)://` references in `src/`. Re-check before each upload.)

## Data usage
- **What user data do you plan to collect?** Leave **every box unticked**. Zoomie Zoe collects nothing. The best score, the mute setting and the how-to-seen flag never leave the device, and they aren't personal data.
  The boxes you'll see are typically: Personally identifiable information, Health information, Financial and payment information, Authentication information, Personal communications, Location, Web history, User activity, Website content.
- **Certifications:** tick all three boxes. They say, in short: you don't sell or transfer user data to third parties, you don't use it for purposes unrelated to the single purpose, and you don't use it for creditworthiness or lending. All three are true.

## Privacy policy URL
```
https://<github-username>.github.io/zoomie-zoe/privacy.html
```
Source: `store/privacy.html`. See `store/web-hosting.md` for how to publish it.

---

# Distribution tab
- **Payments:** free, no in-app purchases
- **Visibility:** Public. You could also choose *Unlisted* first, so only people with the link can install it while Vinny tries it out.
- **Regions:** All regions

---

## Sources (official Chrome docs)
- Image requirements (icon 128 with 96 art, screenshots 1280×800 or 640×400, 1 to 5 of them, 440×280 tile required, 1400×560 optional): https://developer.chrome.com/docs/webstore/images
- Store listing fields (description, category, language, assets, URLs): https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- Categories (Games, Just for Fun, Entertainment…): https://developer.chrome.com/docs/webstore/best_practices
- Privacy tab (single purpose, permission justification, remote code, data usage, privacy policy): https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- User data FAQ (what counts as user data): https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- Limited Use policy: https://developer.chrome.com/docs/webstore/program-policies/limited-use
- Manifest `description` (plain text, 132 characters or fewer): https://developer.chrome.com/docs/extensions/reference/manifest/description
- Distribution tab (Public / Unlisted / Private, regions): https://developer.chrome.com/docs/webstore/cws-dashboard-distribution
