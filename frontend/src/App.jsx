import "./App.css"
import Beams from "./Beams"
import InputBar from "./InputBar"
import History, { useHistory } from "./History"
import { useState, useEffect } from "react"

function parseConfidence(conf) {
  if (!conf) return 0
  const n = parseInt(String(conf).replace(/[^0-9]/g, ""), 10)
  return isNaN(n) ? 0 : Math.min(n, 100)
}

const CIRC = 245

function ConfRing({ pct, verdict }) {
  const offset = CIRC - (pct / 100) * CIRC
  return (
    <div className="conf-ring-wrap">
      <div className="conf-ring-container">
        <svg className="conf-ring-svg" width="88" height="88" viewBox="0 0 88 88">
          <circle className="conf-ring-track" cx="44" cy="44" r="39" />
          <circle
            className={`conf-ring-fill ${verdict}`}
            cx="44" cy="44" r="39"
            style={{ "--ring-offset": offset }}
          />
        </svg>
        <div className="conf-ring-center">
          <span className="conf-pct">{pct}%</span>
          <span className="conf-lbl">conf.</span>
        </div>
      </div>
    </div>
  )
}

// ── ROUND RECT HELPER ──
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const SUGGESTIONS = [
  { text: "Einstein failed math in school", category: "Fake News" },
  { text: "The Great Wall of China is visible from space", category: "Fake News" },
  { text: "Vaccines contain microchips to track people", category: "Fake News" },
  { text: "Drinking bleach cures COVID-19", category: "Fake News" },
  { text: "Aadhaar card alone is sufficient KYC for all banks", category: "KYC" },
  { text: "Humans only use 10% of their brain", category: "Fake News" },
]

const STATS = [
  { value: "500+", label: "Claims Checked" },
  { value: "94.2%", label: "Accuracy Rate" },
  { value: "12+", label: "Sources Indexed" },
  { value: "REAL-TIME", label: "Web Search" },
]

const BACKEND = "https://factguard-backend.onrender.com"

function getVerdictClass(verdict) {
  if (verdict === "SAFE") return "True"
  if (verdict === "SUSPICIOUS") return "Misleading"
  if (verdict === "PHISHING") return "False"
  return verdict
}

function App() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [suggestionText, setSuggestionText] = useState(null)
  const { history, addEntry, clearHistory } = useHistory()

  // PWA Web Share Target
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedText = params.get('text') || params.get('url') || params.get('title')
    if (sharedText) {
      setSuggestionText(sharedText)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const confPct = result ? parseConfidence(result.confidence) : 0
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const verdictClass = result ? getVerdictClass(result.verdict) : ""

  // ── SHARE VERDICT ──
  const shareVerdict = async () => {
    const canvas = document.createElement("canvas")
    const W = 640, H = 380
    canvas.width = W * 2
    canvas.height = H * 2
    canvas.style.width = W + "px"
    canvas.style.height = H + "px"
    const ctx = canvas.getContext("2d")
    ctx.scale(2, 2)

    const colorMap = {
      True: "#4ade80", False: "#f87171", Misleading: "#fbbf24",
      Unverified: "#94a3b8", SAFE: "#4ade80", SUSPICIOUS: "#fbbf24", PHISHING: "#f87171",
    }
    const accentColor = colorMap[result.verdict] || "#94a3b8"

    ctx.fillStyle = "#0a0a10"
    ctx.fillRect(0, 0, W, H)

    const grd = ctx.createRadialGradient(W*0.3, H*0.3, 0, W*0.3, H*0.3, W*0.6)
    grd.addColorStop(0, accentColor + "18")
    grd.addColorStop(1, "transparent")
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = "#111118"
    roundRect(ctx, 24, 24, W-48, H-48, 20)
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.08)"
    ctx.lineWidth = 1
    roundRect(ctx, 24, 24, W-48, H-48, 20)
    ctx.stroke()

    ctx.strokeStyle = accentColor
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(W*0.3, 24); ctx.lineTo(W*0.7, 24)
    ctx.stroke()

    ctx.fillStyle = "rgba(255,255,255,0.25)"
    ctx.font = "600 10px 'Courier New', monospace"
    ctx.fillText("FACTGUARD · FACT-CHECK RESULT", 48, 62)

    ctx.fillStyle = accentColor
    ctx.font = "900 72px Arial, sans-serif"
    ctx.fillText(result.verdict, 48, 148)

    ctx.fillStyle = "rgba(255,255,255,0.35)"
    ctx.font = "500 13px Arial, sans-serif"
    ctx.fillText(`Confidence: ${confPct}%`, 48, 175)

    ctx.strokeStyle = "rgba(255,255,255,0.07)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(48, 196); ctx.lineTo(W-48, 196)
    ctx.stroke()

    ctx.fillStyle = "rgba(255,255,255,0.55)"
    ctx.font = "400 13px Arial, sans-serif"
    const maxWidth = W - 96
    const words = (result.explanation || "").split(" ")
    let line = "", y = 222
    for (const word of words) {
      const test = line ? line + " " + word : word
      if (ctx.measureText(test).width > maxWidth) {
        ctx.fillText(line, 48, y)
        line = word; y += 20
        if (y > H - 80) { ctx.fillText(line + "…", 48, y); break }
      } else { line = test }
    }
    if (y <= H - 80) ctx.fillText(line, 48, y)

    ctx.fillStyle = "rgba(255,255,255,0.15)"
    ctx.font = "500 11px 'Courier New', monospace"
    ctx.fillText("factguard.ai", 48, H-34)
    const now2 = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    ctx.textAlign = "right"
    ctx.fillText(`Analyzed · ${now2}`, W-48, H-34)
    ctx.textAlign = "left"

    const image = canvas.toDataURL("image/png")
    if (navigator.share) {
      const blob = await (await fetch(image)).blob()
      const file = new File([blob], "factguard-verdict.png", { type: "image/png" })
      await navigator.share({ files: [file], title: "FactGuard Verdict" })
    } else {
      const a = document.createElement("a")
      a.href = image; a.download = "factguard-verdict.png"; a.click()
    }
  }

  // ── HISTORY SELECT ──
  const handleHistorySelect = (item) => {
    setResult(item.result)
  }

  // ── HANDLE SEND ──
  const handleSend = async (message, category, imageFile) => {
    console.log("User message:", message)
    console.log("Category:", category)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // ── DEEPFAKE ──
      if (category === "DEEPFAKE") {
        let data
        if (imageFile) {
          const formData = new FormData()
          formData.append("image", imageFile)
          const res = await fetch(`${BACKEND}/check-image-file`, {
            method: "POST",
            body: formData
          })
          data = await res.json()
        } else {
          const res = await fetch(`${BACKEND}/check-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: message })
          })
          data = await res.json()
        }
        if (data.error) {
          setError(`Image analysis failed: ${data.error}`)
        } else {
          setResult({ ...data, isImageResult: true })
          addEntry({
            query: imageFile ? imageFile.name : message.slice(0, 120),
            category: "DEEPFAKE",
            verdict: data.verdict,
            timestamp: Date.now(),
            result: { ...data, isImageResult: true }
          })
        }

      // ── PHISHING ──
      } else if (category === "PHISHING") {
        const res = await fetch(`${BACKEND}/scan-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: message })
        })
        const data = await res.json()
        if (data.error) {
          setError(`URL scan failed: ${data.error}`)
        } else {
          setResult({ ...data, isPhishingResult: true })
          addEntry({
            query: message.slice(0, 120),
            category: "PHISHING",
            verdict: data.verdict,
            timestamp: Date.now(),
            result: { ...data, isPhishingResult: true }
          })
        }

      // ── TEXT FACT CHECK ──
      } else {
        const res = await fetch(`${BACKEND}/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message, category })
        })
        const data = await res.json()
        console.log("AI Result:", data)
        if (data.error) {
          setError("AI service temporarily unavailable. Please try again.")
        } else {
          setResult(data)
          addEntry({
            query: message.slice(0, 120),
            category,
            verdict: data.verdict,
            timestamp: Date.now(),
            result: data
          })
        }
      }

    } catch (err) {
      console.error("API error:", err)
      setError("Cannot connect to server.")
    }

    setLoading(false)
  }

  return (
    <>
      <Beams
        beamWidth={3} beamHeight={30} beamNumber={20}
        lightColor="#ffffff" speed={2} noiseIntensity={1.75}
        scale={0.2} rotation={30}
      />

      {/* ── HISTORY SIDEBAR ── */}
      <History
        history={history}
        onSelect={handleHistorySelect}
        onClear={clearHistory}
      />

      <div className="content">
        <h1 className="mainh">FACTGUARD</h1>
        <p className="subh">AI-powered misinformation detection for the modern internet.</p>
      </div>

      {/* ── CENTER HERO ── */}
      <div className="hero-center">
        <div className="stats-row">
          {STATS.map((s, i) => (
            <div className="stat-item" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="hero-divider" />
        <p className="suggestions-label">Try an example</p>

        <div className="suggestions-grid">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              className="suggestion-chip"
              style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              onClick={() => setSuggestionText(s.text)}
            >
              <span className="suggestion-chip-cat">{s.category}</span>
              <span className="suggestion-chip-text">{s.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="app-container">
        <InputBar onSend={handleSend} prefillText={suggestionText} onPrefillUsed={() => setSuggestionText(null)} />
      </div>

      {/* ── LOADING ── */}
      {loading && (
        <div className="popup-backdrop">
          <div className="resultBox">
            <div className="card-sweep" />
            <div className="loadingBox">
              <p className="loading-header">Searching the web & analyzing claim</p>
              <div className="loading-bar-track">
                <div className="loading-bar-fill" />
              </div>
              <div className="loading-rows">
                <div className="loading-row" />
                <div className="loading-row" />
                <div className="loading-row" />
              </div>
              <div className="loading-footer">
                <div className="ldots">
                  <div className="ldot" /><div className="ldot" /><div className="ldot" />
                </div>
                <p className="loading-text">FactGuard is processing…</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="popup-backdrop" onClick={() => setError(null)}>
          <div className="resultBox errorBox" onClick={e => e.stopPropagation()}>
            <div className="card-top-border False" />
            <div className="card-sweep" />
            <button className="popup-close" onClick={() => setError(null)}>✕</button>
            <div className="error-inner">
              <p className="error-eyebrow">Error</p>
              <p className="error-msg">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {result && (
        <div className="popup-backdrop" onClick={() => setResult(null)}>
          <div className={`popup-glow ${verdictClass}`} />

          <div className={`resultBox ${verdictClass}`} onClick={e => e.stopPropagation()}>
            <div className={`card-top-border ${verdictClass}`} />
            <div className="card-sweep" />
            <button className="popup-close" onClick={() => setResult(null)}>✕</button>

            <div className="card-inner">
              <p className="card-eyebrow">
                {result.isImageResult ? "Deepfake Analysis Result"
                  : result.isPhishingResult ? "URL Phishing Scan Result"
                  : "Fact-check result"}
              </p>

              <div className="verdict-main-row">
                <div className="verdict-left">
                  <p className="verdict-label-sm">Verdict</p>
                  <div className={`verdict-word ${verdictClass}`}>{result.verdict}</div>
                  <span className={`verdict-pill ${verdictClass}`}>
                    <span className="verdict-dot" />
                    {result.verdict === "True"        && "Claim verified"}
                    {result.verdict === "False"       && "Claim debunked"}
                    {result.verdict === "Misleading"  && "Partially accurate"}
                    {result.verdict === "Unverified"  && "Cannot verify"}
                    {result.isImageResult && result.label}
                    {result.verdict === "SAFE"        && "No threats detected"}
                    {result.verdict === "SUSPICIOUS"  && "Potential phishing domain"}
                    {result.verdict === "PHISHING"    && "Confirmed phishing site"}
                  </span>
                </div>

                {result.isImageResult ? (
                  <div className="deepfake-score-wrap">
                    <div className="deepfake-score-number" style={{
                      color: result.aiGeneratedProbability >= 80 ? "var(--clr-false)"
                        : result.aiGeneratedProbability >= 50 ? "var(--clr-mis)"
                        : result.aiGeneratedProbability >= 20 ? "var(--clr-unv)"
                        : "var(--clr-true)"
                    }}>
                      {result.aiGeneratedProbability}%
                    </div>
                    <div className="deepfake-score-label">AI Generated</div>
                  </div>
                ) : (
                  <ConfRing pct={confPct} verdict={verdictClass} />
                )}
              </div>

              <div className="card-divider" />

              {result.isPhishingResult && (
                <div className="url-info-wrap">
                  <div className="url-info-row">
                    <span className="url-info-label">Submitted URL</span>
                    <span className="url-info-value">{result.submittedUrl}</span>
                  </div>
                  {result.resolvedUrl && result.resolvedUrl !== result.submittedUrl && (
                    <div className="url-info-row">
                      <span className="url-info-label">
                        {result.shortenerDetected ? "⚠ Resolved Destination" : "Final URL"}
                      </span>
                      <span className="url-info-value url-info-resolved">{result.resolvedUrl}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="explanation-wrap">
                <p className="explanation-lbl">Analysis</p>
                <p className="explanation-text">{result.explanation}</p>
              </div>

              {result.breakdown && result.breakdown.length > 0 && (
                <div className="breakdown-wrap">
                  <p className="breakdown-lbl">
                    {result.isImageResult ? "Forensic Breakdown" : "Why this verdict"}
                  </p>
                  <div className="breakdown-list">
                    {result.breakdown.map((item, i) => (
                      <div className="breakdown-item" key={i}>
                        <div className={`breakdown-dot ${verdictClass}`} />
                        <div className="breakdown-content">
                          <span className="breakdown-point">{item.point}</span>
                          <span className="breakdown-detail">{item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.manipulationTactic && result.manipulationTactic !== "None" && (
                <div className="tactic-wrap">
                  <p className="tactic-lbl">Manipulation Tactic Used</p>
                  <div className="tactic-badge">⚠️ {result.manipulationTactic}</div>
                </div>
              )}

              {result.scamSignals && result.scamSignals.length > 0 && (
                <div className="scam-signals-wrap">
                  <p className="scam-signals-lbl">Scam Signals Detected</p>
                  <div className="scam-signals-list">
                    {result.scamSignals.map((signal, i) => (
                      <div key={i} className="scam-signal-badge">⚠ {signal}</div>
                    ))}
                  </div>
                </div>
              )}

              {!result.isImageResult && !result.isPhishingResult && result.sources && result.sources.length > 0 && (
                <div className="sources-wrap">
                  <p className="sources-lbl">Sources</p>
                  <div className="sources-list">
                    {result.sources.map((src, i) => (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="source-item">
                        <div className="source-favicon">
                          <img
                            src={`https://www.google.com/s2/favicons?sz=16&domain=${new URL(src.url).hostname}`}
                            alt=""
                            onError={e => e.target.style.display = "none"}
                          />
                        </div>
                        <div className="source-text">
                          <span className="source-title">{src.title}</span>
                          <span className="source-domain">{new URL(src.url).hostname.replace("www.", "")}</span>
                        </div>
                        <svg className="source-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Button */}
              <button className="share-btn" onClick={shareVerdict}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share Verdict
              </button>

              {/* Footer */}
              <div className="card-footer">
                <span className="footer-brand">FactGuard AI</span>
                <div className="footer-status">
                  <div className={`footer-status-dot ${verdictClass}`} />
                  <span className="footer-status-txt">Analyzed · {now}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App