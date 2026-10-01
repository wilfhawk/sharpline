/**
 * Runs on sportsbook domains (DraftKings, FanDuel, BetMGM, Caesars). Renders
 * a small floating overlay showing the last bet copied from SharpLine, so you
 * can glance at the target team/odds/stake without tab-switching back.
 *
 * SCOPE CUT: this does NOT read or write the sportsbook's own bet-slip DOM —
 * each book's markup is different and changes without notice, so guessing
 * selectors here would be fragile and could silently break or place a wrong
 * bet. This only displays info and offers a copy-to-clipboard button; you
 * still manually enter the selection and stake into the book's own slip.
 */
function renderOverlay(bet) {
  let el = document.getElementById("sharpline-overlay");
  if (!bet) {
    if (el) el.remove();
    return;
  }

  if (!el) {
    el = document.createElement("div");
    el.id = "sharpline-overlay";
    document.body.appendChild(el);
  }

  el.innerHTML = `
    <div class="sharpline-overlay-header">
      <span>SharpLine</span>
      <button type="button" id="sharpline-overlay-close" aria-label="Close">&times;</button>
    </div>
    <div class="sharpline-overlay-body">
      <p class="sharpline-overlay-event">${bet.event}</p>
      <p class="sharpline-overlay-side">${bet.side} · ${bet.sportsbook}</p>
      <p class="sharpline-overlay-odds">${bet.odds} · suggested $${Number(bet.stake).toFixed(2)}</p>
    </div>
  `;

  document.getElementById("sharpline-overlay-close")?.addEventListener("click", () => {
    el.remove();
  });
}

chrome.storage.local.get("sharplineLastBet", ({ sharplineLastBet }) => {
  renderOverlay(sharplineLastBet);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.sharplineLastBet) return;
  renderOverlay(changes.sharplineLastBet.newValue);
});
