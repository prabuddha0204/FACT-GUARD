import "./App.css"
import Beams from "./Beams"
import InputBar from "./InputBar"
import { useState } from "react"

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

const SUGGESTIONS = [
  { text: "Einstein failed math in school", category: "Fake News" },
  { text: "The Great Wall of China is visible from space", category: "Fake News" },
  { text: "Vaccines contain microchips to track people", category: "Fake News" },
  { text: "Drinking bleach cures COVID-19", category: "Fake News" },
  { text: "Aadhaar card alone is sufficient KYC for all banks", category: "KYC" },
  { text: "Humans only use 10% of their brain", category: "Fake News" },
]

const STATS = [
  { value: "2.4M+", label: "Claims Checked" },
  { value: "98.2%", label: "Accuracy Rate" },
  { value: "150+", label: "Sources Indexed" },
  { value: "REAL-TIME", label: "Web Search" },
]

function App() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [suggestionText, setSuggestionText] = useState(null)

  const handleSend = async (message, category) => {
    console.log("User message:", message)
    console.log("Category:", category)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("https://factguard-backend.onrender.com/check", {
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
      }
    } catch (err) {
      console.error("API error:", err)
      setError("Cannot connect to server.")
    }

    setLoading(false)
  }

  const confPct = result ? parseConfidence(result.confidence) : 0
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <>
      <Beams
        beamWidth={3} beamHeight={30} beamNumber={20}
        lightColor="#ffffff" speed={2} noiseIntensity={1.75}
        scale={0.2} rotation={30}
      />

      <div className="content">
        <h1 className="mainh">FACTGUARD</h1>
        <p className="subh">AI-powered misinformation detection for the modern internet.</p>
      </div>

      {/* ── CENTER HERO ── */}
      <div className="hero-center">

        {/* Stats row */}
        <div className="stats-row">
          {STATS.map((s, i) => (
            <div className="stat-item" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="hero-divider" />

        {/* Suggestion label */}
        <p className="suggestions-label">Try an example</p>

        {/* Suggestion chips */}
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
          <div className={`popup-glow ${result.verdict}`} />

          <div className={`resultBox ${result.verdict}`} onClick={e => e.stopPropagation()}>
            <div className={`card-top-border ${result.verdict}`} />
            <div className="card-sweep" />
            <button className="popup-close" onClick={() => setResult(null)}>✕</button>

            <div className="card-inner">
              <p className="card-eyebrow">Fact-check result</p>

              <div className="verdict-main-row">
                <div className="verdict-left">
                  <p className="verdict-label-sm">Verdict</p>
                  <div className={`verdict-word ${result.verdict}`}>{result.verdict}</div>
                  <span className={`verdict-pill ${result.verdict}`}>
                    <span className="verdict-dot" />
                    {result.verdict === "True"       && "Claim verified"}
                    {result.verdict === "False"      && "Claim debunked"}
                    {result.verdict === "Misleading" && "Partially accurate"}
                    {result.verdict === "Unverified" && "Cannot verify"}
                  </span>
                </div>
                <ConfRing pct={confPct} verdict={result.verdict} />
              </div>

              <div className="card-divider" />

              <div className="explanation-wrap">
                <p className="explanation-lbl">Analysis</p>
                <p className="explanation-text">{result.explanation}</p>
              </div>

              {result.breakdown && result.breakdown.length > 0 && (
                <div className="breakdown-wrap">
                  <p className="breakdown-lbl">Why this verdict</p>
                  <div className="breakdown-list">
                    {result.breakdown.map((item, i) => (
                      <div className="breakdown-item" key={i}>
                        <div className={`breakdown-dot ${result.verdict}`} />
                        <div className="breakdown-content">
                          <span className="breakdown-point">{item.point}</span>
                          <span className="breakdown-detail">{item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.sources && result.sources.length > 0 && (
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

              <div className="card-footer">
                <span className="footer-brand">FactGuard AI</span>
                <div className="footer-status">
                  <div className={`footer-status-dot ${result.verdict}`} />
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