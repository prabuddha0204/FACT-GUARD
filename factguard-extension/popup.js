chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => window.getSelection().toString()
  }, (results) => {
    if (results?.[0]?.result) {
      document.getElementById("text").value = results[0].result
    }
  })
})

async function check() {
  const text = document.getElementById("text").value.trim()
  const category = document.getElementById("category").value
  const resultDiv = document.getElementById("result")
  const btn = document.getElementById("checkBtn")

  if (!text) { alert("Please enter some text!"); return }

  btn.disabled = true
  btn.textContent = "Checking..."
  resultDiv.style.display = "block"
  resultDiv.innerHTML = `<div class="loading"><div class="spinner"></div> Analyzing with AI...</div>`

  try {
    let data

    if (category === "PHISHING") {
      const res = await fetch("https://factguard-backend.onrender.com/scan-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: text })
      })
      data = await res.json()
    } else {
      const res = await fetch("https://factguard-backend.onrender.com/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, category })
      })
      data = await res.json()
    }

    const config = {
      True:       { cls: "verdict-true",    icon: "&#10003;", label: "TRUE" },
      False:      { cls: "verdict-false",   icon: "&#10007;", label: "FALSE" },
      Misleading: { cls: "verdict-mislead", icon: "&#9888;",  label: "MISLEADING" },
      Unverified: { cls: "verdict-unknown", icon: "&#63;",    label: "UNVERIFIED" },
      SAFE:       { cls: "verdict-true",    icon: "&#10003;", label: "SAFE" },
      PHISHING:   { cls: "verdict-false",   icon: "&#10007;", label: "PHISHING" },
      SUSPICIOUS: { cls: "verdict-mislead", icon: "&#9888;",  label: "SUSPICIOUS" },
    }
    const c = config[data.verdict] || config.Unverified

    const signals = data.scamSignals && data.scamSignals.length > 0
      ? `<div class="signals">Signals: ${data.scamSignals.join(" &bull; ")}</div>` : ""

    const resolvedUrl = data.shortenerDetected
      ? `<div class="signals">Resolved: ${data.resolvedUrl}</div>` : ""

    resultDiv.innerHTML = `
      <div class="${c.cls}">
        <div class="result-header">
          <span class="verdict-badge">${c.icon} ${c.label}</span>
          <span class="confidence">${data.confidence}</span>
        </div>
        <div class="result-body">
          ${data.explanation}
          ${resolvedUrl}
          ${signals}
        </div>
      </div>
    `
  } catch (err) {
    resultDiv.innerHTML = `<div class="verdict-unknown"><div class="result-body">Connection error. Make sure backend is running.</div></div>`
  }



  btn.disabled = false
  btn.textContent = "Check Now"
}

document.getElementById("checkBtn").addEventListener("click", check)