const WHITELIST = [
  "factguardbeta.vercel.app",
  "factguardalpha.vercel.app",
  "localhost",
  "127.0.0.1",
  "newtab",
]

async function scanUrl(tabId, url) {
  if (!url) return
  if (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("file://")
  ) return

  try {
    const hostname = new URL(url).hostname.replace("www.", "")
    if (WHITELIST.some(w => hostname.includes(w))) return
  } catch (e) { return }

  try {
    const res = await fetch("https://factguard-backend.onrender.com/scan-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    })
    const data = await res.json()

    // Only show banner for PHISHING or SUSPICIOUS — nothing for SAFE
    if (data.verdict !== "PHISHING" && data.verdict !== "SUSPICIOUS") return

    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (document.getElementById("fg-top-banner")) return

        const banner = document.createElement("div")
        banner.id = "fg-top-banner"

        banner.style.cssText = `
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 2147483647;
          background: linear-gradient(135deg, #7f1d1d, #dc2626);
          color: white;
          padding: 9px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 2px 12px rgba(220,38,38,0.4);
          box-sizing: border-box;
          animation: fg-slide 0.25s ease;
        `

        banner.innerHTML = `
          <style>
            @keyframes fg-slide {
              from { transform: translateY(-100%); opacity:0; }
              to   { transform: translateY(0); opacity:1; }
            }
            #fg-dismiss {
              background: rgba(255,255,255,0.12);
              border: 1px solid rgba(255,255,255,0.2);
              color: white; padding: 3px 10px;
              border-radius: 6px; cursor: pointer;
              font-size: 11px; font-weight: 700;
              font-family: inherit; flex-shrink: 0;
            }
          </style>
          <span style="flex-shrink:0;">🚨</span>
          <span style="flex:1;min-width:0;"><strong>FactGuard:</strong> FRAUDULENT WEBSITE — your data may be at risk.</span>
          <button id="fg-dismiss">✕</button>
        `

        document.body.prepend(banner)
        document.getElementById("fg-dismiss").addEventListener("click", () => banner.remove())
      },
      args: []
    })
  } catch (err) {}
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    scanUrl(tabId, tab.url)
  }
})

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    if (tab.url) scanUrl(tab.id, tab.url)
  } catch (err) {}
})