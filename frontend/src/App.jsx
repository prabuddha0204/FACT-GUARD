import "./App.css"
import Beams from "./Beams"
import InputBar from "./InputBar"
import { useState } from "react"

function parseConfidence(conf) {
  if (!conf) return 0
  const n = parseInt(String(conf).replace(/[^0-9]/g, ""), 10)
  return isNaN(n) ? 0 : Math.min(n, 100)
}

// Circumference = 2π×r where r=39 → ~245
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

function App() {

  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSend = async (message, category) => {
    console.log("User message:", message)
    console.log("Category:", category)

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("http://localhost:5000/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, category: category })
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
        beamWidth={3}
        beamHeight={30}
        beamNumber={20}
        lightColor="#ffffff"
        speed={2}
        noiseIntensity={1.75}
        scale={0.2}
        rotation={30}
      />

      <div className="content">
        <h1 className="mainh">FACTGUARD</h1>
        <p className="subh">AI-powered misinformation detection for the modern internet.</p>
      </div>

      <div className="app-container">
        <InputBar onSend={handleSend} />
      </div>

      {/* ── LOADING ── */}
      {loading && (
        <div className="popup-backdrop">
          <div className="resultBox">
            <div className="card-sweep" />
            <div className="loadingBox">
              <p className="loading-header">Analyzing claim</p>
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
                  <div className="ldot" />
                  <div className="ldot" />
                  <div className="ldot" />
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
        <div
          className="popup-backdrop"
          onClick={() => setResult(null)}
        >
          {/* ambient glow */}
          <div className={`popup-glow ${result.verdict}`} />

          <div
            className={`resultBox ${result.verdict}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`card-top-border ${result.verdict}`} />
            <div className="card-sweep" />
            <button className="popup-close" onClick={() => setResult(null)}>✕</button>

            <div className="card-inner">

              {/* eyebrow */}
              <p className="card-eyebrow">Fact-check result</p>

              {/* main row: verdict + ring */}
              <div className="verdict-main-row">
                <div className="verdict-left">
                  <p className="verdict-label-sm">Verdict</p>
                  <div className={`verdict-word ${result.verdict}`}>
                    {result.verdict}
                  </div>
                  <span className={`verdict-pill ${result.verdict}`}>
                    <span className="verdict-dot" />
                    {result.verdict === "True"        && "Claim verified"}
                    {result.verdict === "False"       && "Claim debunked"}
                    {result.verdict === "Misleading"  && "Partially accurate"}
                    {result.verdict === "Unverified"  && "Cannot verify"}
                  </span>
                </div>

                <ConfRing pct={confPct} verdict={result.verdict} />
              </div>

              {/* divider */}
              <div className="card-divider" />

              {/* explanation */}
              <div className="explanation-wrap">
                <p className="explanation-lbl">Analysis</p>
                <p className="explanation-text">{result.explanation}</p>
              </div>

              {/* footer */}
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