# SharpLine Bet Helper (browser extension)

A minimal Manifest V3 Chrome/Edge extension scaffold. **v1 scope is
intentionally limited to a clipboard/overlay bridge, not real bet-slip
auto-fill.**

## What it does

1. On the SharpLine dashboard, clicking **"Copy bet"** on any opportunity
   copies a formatted summary to your clipboard and saves it to the
   extension's local storage (`content-scripts/sharpline-bridge.js`).
2. On a supported sportsbook site (DraftKings, FanDuel, BetMGM, Caesars), a
   small floating overlay (`content-scripts/sportsbook-overlay.js`) shows that
   same bet — team/side, sportsbook, odds, suggested stake — so you can see it
   without tab-switching back to SharpLine.
3. The toolbar popup (`popup.html`/`popup.js`) shows the same info and a link
   back to your dashboard.

## What it deliberately does NOT do

It does not read or write the sportsbook's own bet-slip form fields. Real
bet-slip auto-fill would need a hand-maintained CSS/DOM selector map per
sportsbook, and those sites' markup changes without notice — a wrong or stale
selector could silently fail or (worse) fill the wrong field. That's a
meaningfully larger, ongoing-maintenance project, not a single build. This
scaffold is the integration point to build that on top of later (see
`content-scripts/sportsbook-overlay.js` — the overlay's rendered DOM is a
natural place to add a "Fill" button once you've verified selectors for a
specific book).

## Try it locally

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
   select this `extension/` folder.
2. Open the SharpLine dashboard (`http://localhost:3000/dashboard` while
   running `npm run dev`, or the deployed URL), expand an opportunity, and
   click **Copy bet**.
3. Visit a supported sportsbook site and look for the floating SharpLine
   overlay in the bottom-right corner.

No icons are bundled (the manifest omits `icons` so Chrome shows a generic
default) — add your own `icons/16.png`/`48.png`/`128.png` and reference them
in `manifest.json` before publishing.
