let btn = null
let panel = null

function createPanel(selectedText) {
  if (panel) panel.remove()

  if (!document.getElementById("fg-style")) {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
    document.head.appendChild(link)

    const style = document.createElement("style")
    style.id = "fg-style"
    style.textContent = `
      #factguard-panel * { box-sizing: border-box; margin: 0; padding: 0; }
      #factguard-panel {
        position: fixed; top: 0; right: 0;
        width: 340px; height: 100vh;
        background: #080c14;
        color: #e2e8f0;
        z-index: 2147483647;
        font-family: 'Manrope', -apple-system, sans-serif;
        box-shadow: -12px 0 40px rgba(0,0,0,0.8);
        display: flex; flex-direction: column;
        border-left: 1px solid #0f1e35;
        animation: fg-slide 0.22s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes fg-slide {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
      #fg-header {
        display: flex; align-items: center; gap: 10px;
        padding: 14px 16px;
        background: linear-gradient(135deg, #0f172a, #0a1628);
        border-bottom: 1px solid #0f1e35;
        flex-shrink: 0;
      }
      #fg-logo {
        width: 32px; height: 32px; border-radius: 9px;
        background: #1e3a8a; display: flex; align-items: center;
        justify-content: center; flex-shrink: 0;
        box-shadow: 0 0 12px rgba(59,130,246,0.3);
      }
      #fg-logo img { width: 24px; height: 24px; border-radius: 6px; }
      #fg-titles { flex: 1; }
      #fg-title  { font-size: 14px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.3px; }
      #fg-sub    { font-size: 10px; color: #3b82f6; font-weight: 500; letter-spacing: 0.3px; margin-top: 1px; }
      #fg-close  {
        background: #0f1e35; border: 1px solid #1e293b;
        color: #64748b; width: 26px; height: 26px;
        border-radius: 50%; cursor: pointer; font-size: 12px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; transition: all 0.15s;
      }
      #fg-close:hover { background: #1e293b; color: #e2e8f0; }

      #fg-body {
        padding: 14px; display: flex; flex-direction: column;
        gap: 8px; flex: 1; overflow-y: auto;
      }
      #fg-body::-webkit-scrollbar { width: 4px; }
      #fg-body::-webkit-scrollbar-track { background: transparent; }
      #fg-body::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

      #fg-text {
        width: 100%; padding: 10px 12px; border-radius: 10px;
        background: #0d1526; border: 1px solid #1a2840;
        color: #cbd5e1; font-size: 12.5px; resize: none;
        font-family: 'Manrope', sans-serif; line-height: 1.5;
        outline: none; transition: border 0.2s;
      }
      #fg-text:focus { border-color: #2563eb; }
      #fg-text::placeholder { color: #334155; }

      #fg-category {
        width: 100%; padding: 9px 12px; border-radius: 10px;
        background: #0d1526; border: 1px solid #1a2840;
        color: #94a3b8; font-size: 12.5px;
        font-family: 'Manrope', sans-serif; outline: none;
        cursor: pointer;
      }
      #fg-check {
        width: 100%; padding: 11px; border-radius: 10px;
        background: linear-gradient(135deg, #1d4ed8, #2563eb);
        color: white; border: none; font-size: 13px;
        font-weight: 700; cursor: pointer;
        font-family: 'Manrope', sans-serif;
        letter-spacing: 0.3px; transition: opacity 0.15s;
        box-shadow: 0 4px 16px rgba(37,99,235,0.3);
      }
      #fg-check:hover   { opacity: 0.9; }
      #fg-check:disabled { opacity: 0.5; cursor: not-allowed; }

      .fg-card {
        border-radius: 12px; padding: 14px;
        border: 1px solid transparent;
      }
      .fg-true    { background: #020f07; border-color: #14532d; }
      .fg-false   { background: #0f0202; border-color: #7f1d1d; }
      .fg-mislead { background: #0f0800; border-color: #78350f; }
      .fg-unknown { background: #0d1526; border-color: #1e293b; }

      .fg-top-bar {
        height: 3px; border-radius: 3px; margin-bottom: 12px;
      }
      .fg-true .fg-top-bar    { background: linear-gradient(90deg, #16a34a, #4ade80); }
      .fg-false .fg-top-bar   { background: linear-gradient(90deg, #dc2626, #f87171); }
      .fg-mislead .fg-top-bar { background: linear-gradient(90deg, #d97706, #fbbf24); }
      .fg-unknown .fg-top-bar { background: linear-gradient(90deg, #475569, #64748b); }

      .fg-verdict-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
      .fg-verdict { font-weight: 800; font-size: 22px; letter-spacing: -0.8px; }
      .fg-true .fg-verdict    { color: #4ade80; }
      .fg-false .fg-verdict   { color: #f87171; }
      .fg-mislead .fg-verdict { color: #fbbf24; }
      .fg-unknown .fg-verdict { color: #94a3b8; }

      .fg-conf {
        font-size: 12px; font-weight: 700; padding: 4px 10px;
        border-radius: 20px; letter-spacing: 0.2px;
      }
      .fg-true .fg-conf    { background: #14532d; color: #4ade80; }
      .fg-false .fg-conf   { background: #7f1d1d; color: #f87171; }
      .fg-mislead .fg-conf { background: #78350f; color: #fbbf24; }
      .fg-unknown .fg-conf { background: #1e293b; color: #94a3b8; }

      .fg-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 10px 0; }
      .fg-label {
        font-size: 9px; text-transform: uppercase;
        letter-spacing: 1px; color: #334155;
        font-weight: 700; margin-bottom: 6px;
      }
      .fg-exp { font-size: 12px; color: #94a3b8; line-height: 1.65; }
      .fg-signals {
        margin-top: 10px; padding: 8px 10px;
        background: rgba(0,0,0,0.3); border-radius: 8px;
        font-size: 11px; line-height: 1.5;
        border: 1px solid rgba(255,255,255,0.04);
      }
      .fg-loading {
        display: flex; align-items: center; gap: 10px;
        padding: 14px 0; color: #334155; font-size: 12.5px;
      }
      .fg-spinner {
        width: 16px; height: 16px;
        border: 2px solid #0f1e35; border-top-color: #2563eb;
        border-radius: 50%; animation: fg-spin 0.7s linear infinite;
        flex-shrink: 0;
      }
      @keyframes fg-spin { to { transform: rotate(360deg); } }

      #fg-footer {
        padding: 10px 16px; border-top: 1px solid #0f1e35;
        font-size: 10px; color: #1e293b; text-align: center;
        font-weight: 500; letter-spacing: 0.3px; flex-shrink: 0;
      }
      #fg-footer a { color: #1d4ed8; text-decoration: none; }
    `
    document.head.appendChild(style)
  }

  panel = document.createElement("div")
  panel.id = "factguard-panel"

  const iconUrl = chrome.runtime.getURL('icon.png')

  panel.innerHTML = `
    <div id="fg-header">
      <div id="fg-logo">
        <img src="${iconUrl}" onerror="this.parentElement.innerHTML='FG';this.parentElement.style.cssText+='color:white;font-size:11px;font-weight:800;'">
      </div>
      <div id="fg-titles">
        <div id="fg-title">FactGuard AI</div>
        <div id="fg-sub">MISINFORMATION DETECTOR</div>
      </div>
      <button id="fg-close">✕</button>
    </div>

    <div id="fg-body">
      <textarea id="fg-text" rows="3" placeholder="Paste text or URL to verify...">${selectedText}</textarea>
      <select id="fg-category">
        <option value="FAKE NEWS">Fake News</option>
        <option value="KYC">KYC / Scam</option>
        <option value="PHISHING">Phishing / URL</option>
        <option value="OTHER">Other</option>
      </select>
      <button id="fg-check">Check Now</button>
      <div id="fg-result"></div>
    </div>

    <div id="fg-footer">Powered by <a href="https://factguardbeta.vercel.app" target="_blank">FactGuard AI</a></div>
  `

  document.body.appendChild(panel)

  document.getElementById("fg-close").addEventListener("click", () => {
    panel.remove(); panel = null
  })

  document.getElementById("fg-check").addEventListener("click", async () => {
    const text = document.getElementById("fg-text").value.trim()
    const category = document.getElementById("fg-category").value
    const resultDiv = document.getElementById("fg-result")
    const checkBtn = document.getElementById("fg-check")
    if (!text) return

    checkBtn.disabled = true
    checkBtn.textContent = "Analyzing..."
    resultDiv.innerHTML = `<div class="fg-loading"><div class="fg-spinner"></div>Searching web & analyzing...</div>`

    try {
      let res
      if (category === "PHISHING") {
        res = await fetch("https://factguard-backend.onrender.com/scan-url", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: text })
        })
      } else {
        res = await fetch("https://factguard-backend.onrender.com/check", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, category })
        })
      }

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.verdict) throw new Error("Invalid response")

      const clsMap = {
        True: "fg-true", False: "fg-false", Misleading: "fg-mislead",
        Unverified: "fg-unknown", SAFE: "fg-true",
        PHISHING: "fg-false", SUSPICIOUS: "fg-mislead"
      }
      const cls = clsMap[data.verdict] || "fg-unknown"

      const signals = data.scamSignals?.length > 0
        ? `<div class="fg-signals" style="color:#fbbf24;">🚨 ${data.scamSignals.join(" · ")}</div>` : ""
      const tactic = data.manipulationTactic && data.manipulationTactic !== "None"
        ? `<div class="fg-signals" style="color:#fb923c;">⚠ ${data.manipulationTactic}</div>` : ""

      resultDiv.innerHTML = `
        <div class="fg-card ${cls}">
          <div class="fg-top-bar"></div>
          <div class="fg-verdict-row">
            <div class="fg-verdict">${data.verdict}</div>
            <div class="fg-conf">${data.confidence}</div>
          </div>
          <div class="fg-divider"></div>
          <div class="fg-label">Analysis</div>
          <div class="fg-exp">${data.explanation}</div>
          ${tactic}${signals}
        </div>
      `
    } catch (err) {
      resultDiv.innerHTML = `
        <div class="fg-card fg-unknown">
          <div class="fg-exp" style="color:#f87171;">${err.message}</div>
          <div class="fg-exp" style="margin-top:6px;font-size:11px;color:#334155;">Backend may be waking up — wait 30s and retry.</div>
        </div>
      `
    }

    checkBtn.disabled = false
    checkBtn.textContent = "Check Now"
  })
}

document.addEventListener("mouseup", (e) => {
  setTimeout(() => {
    try {
      const selected = window.getSelection().toString().trim()
      if (btn) { btn.remove(); btn = null }
      if (selected.length < 5) return

      const iconUrl = chrome.runtime.getURL('icon.png')
      btn = document.createElement("div")
      btn.innerHTML = `
        <img src="${iconUrl}" style="width:14px;height:14px;border-radius:3px;" onerror="this.style.display='none'">
        <span style="margin-left:6px;font-family:'Manrope',-apple-system,sans-serif;">FactGuard</span>
      `
      Object.assign(btn.style, {
        position: "fixed",
        top: `${Math.max(10, e.clientY - 46)}px`,
        left: `${Math.min(e.clientX, window.innerWidth - 145)}px`,
        background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
        color: "white", padding: "7px 14px", borderRadius: "20px",
        fontSize: "12px", fontWeight: "700", cursor: "pointer",
        zIndex: "2147483646",
        boxShadow: "0 4px 20px rgba(37,99,235,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center",
        fontFamily: "'Manrope', -apple-system, sans-serif",
      })

      btn.addEventListener("mousedown", (ev) => {
        ev.preventDefault(); ev.stopPropagation()
        createPanel(selected)
        btn.remove(); btn = null
      })
      document.body.appendChild(btn)
    } catch (err) {
      console.log("FactGuard: refresh page after reloading extension")
    }
  }, 10)
})

document.addEventListener("mousedown", (e) => {
  if (btn && !btn.contains(e.target)) { btn.remove(); btn = null }
})