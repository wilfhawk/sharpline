const DASHBOARD_URL = "https://sharpline-nu.vercel.app/dashboard";

chrome.storage.local.get("sharplineLastBet", ({ sharplineLastBet }) => {
  const content = document.getElementById("content");

  if (!sharplineLastBet) {
    content.innerHTML = `
      <p class="muted">No bet copied yet.</p>
      <p>Open <a href="${DASHBOARD_URL}" target="_blank">your SharpLine dashboard</a>
      and click "Copy bet" on any opportunity.</p>
    `;
    return;
  }

  content.innerHTML = `
    <p><strong>${sharplineLastBet.event}</strong></p>
    <p class="muted">${sharplineLastBet.side} · ${sharplineLastBet.sportsbook}</p>
    <p class="muted">${sharplineLastBet.odds} · suggested $${Number(sharplineLastBet.stake).toFixed(2)}</p>
    <p><a href="${DASHBOARD_URL}" target="_blank">Open dashboard</a></p>
  `;
});
