/**
 * Runs on the SharpLine dashboard itself. Listens for the postMessage the
 * dashboard's "Copy bet" button sends (see components/dashboard/CopyBetButton.tsx)
 * and persists it to extension storage so the sportsbook-overlay script
 * (running on a different domain/tab) can read it.
 */
const SHARPLINE_COPY_BET_MESSAGE = "SHARPLINE_COPY_BET";

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.type !== SHARPLINE_COPY_BET_MESSAGE) return;

  chrome.storage.local.set({ sharplineLastBet: event.data.bet });
});
