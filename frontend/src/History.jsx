import { useState } from "react"

const MAX_HISTORY = 10

export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fg-history") || "[]")
    } catch { return [] }
  })

  const addEntry = (entry) => {
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY)
      localStorage.setItem("fg-history", JSON.stringify(updated))
      return updated
    })
  }

  const clearHistory = () => {
    localStorage.removeItem("fg-history")
    setHistory([])
  }

  return { history, addEntry, clearHistory }
}

const VERDICT_COLORS = {
  True:       { color: "#4ade80", bg: "rgba(74,222,128,0.1)",   border: "rgba(74,222,128,0.2)" },
  False:      { color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.2)" },
  Misleading: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.2)" },
  Unverified: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.2)" },
  SAFE:       { color: "#4ade80", bg: "rgba(74,222,128,0.1)",   border: "rgba(74,222,128,0.2)" },
  PHISHING:   { color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.2)" },
  SUSPICIOUS: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.2)" },
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

export default function History({ history, onSelect, onClear }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`
        .fg-history-btn {
          position: fixed;
          top: 15px;
          left: 24px;
          z-index: 39;
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07);
          
          color: #475569;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .fg-history-btn:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
          color: #94a3b8;
        }
        .fg-history-btn.fg-active {
          background: rgba(29,78,216,0.12);
          border-color: rgba(59,130,246,0.25);
          color: #93c5fd;
        }
        .fg-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: fg-fadein 0.18s ease;
        }
        @keyframes fg-fadein { from { opacity:0 } to { opacity:1 } }

        .fg-sidebar {
          position: fixed;
          top: 0; left: 0;
          width: 300px;
          height: 100vh;
          background: rgba(23, 25, 31, 0.95);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-right: 1px solid rgba(255,255,255,0.05);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          font-family: 'Manrope', sans-serif;
          box-shadow: 8px 0 48px rgba(0,0,0,0.6);
          transform: translateX(-100%);
          transition: transform 0.26s cubic-bezier(0.16,1,0.3,1);
        }
        .fg-sidebar.fg-open { transform: translateX(0); }

        .fg-sidebar-header {
          padding: 22px 16px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .fg-sidebar-title {
          font-size: 15px;
          font-weight: 800;
          color: #e2e8f0;
          letter-spacing: -0.4px;
          font-family: 'Manrope', sans-serif;
        }
        .fg-sidebar-sub {
          font-size: 9.5px;
          color: #1e3a5f;
          margin-top: 2px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          font-family: 'Manrope', sans-serif;
        }
        .fg-hdr-btns { display: flex; gap: 6px; align-items: center; }
        .fg-clear-btn {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.18);
          color: #f87171;
          padding: 5px 10px;
          
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          font-family: 'Manrope', sans-serif;
          transition: all 0.15s;
        }
        .fg-clear-btn:hover { background: rgba(239,68,68,0.14); }
        .fg-close-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          color: #334155;
          width: 28px; height: 28px;
          
          cursor: pointer;
          font-size: 13px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
          font-family: 'Manrope', sans-serif;
        }
        .fg-close-btn:hover { background: rgba(255,255,255,0.07); color: #64748b; }

        .fg-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px 10px;
        }
        .fg-list::-webkit-scrollbar { width: 3px; }
        .fg-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 2px; }

        .fg-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 220px;
          gap: 12px;
          color: #1e293b;
          font-size: 12.5px;
          text-align: center;
          line-height: 1.6;
          font-family: 'Manrope', sans-serif;
        }

        .fg-item {
          width: 100%;
          text-align: left;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          
          padding: 11px 13px;
          cursor: pointer;
          margin-bottom: 6px;
          transition: all 0.15s;
          font-family: 'Manrope', sans-serif;
          display: block;
        }
        .fg-item:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
          transform: translateX(2px);
        }
        .fg-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .fg-item-cat {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #4e5967;
          text-transform: uppercase;
          font-family: 'Manrope', sans-serif;
        }
        .fg-item-verdict {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 9px;
          border-radius: 20px;
          letter-spacing: 0.3px;
          font-family: 'Manrope', sans-serif;
        }
        .fg-item-query {
          font-size: 12px;
          color: #b4c3d8;
          font-weight: 500;
          line-height: 1.45;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-family: 'Manrope', sans-serif;
        }
        .fg-item:hover .fg-item-query { color: #939fb0; }
        .fg-item-time {
          font-size: 10px;
          color: #5f6c82;
          font-weight: 600;
          font-family: 'Manrope', sans-serif;
        }

        .fg-footer {
          padding: 11px 16px;
          border-top: 1px solid rgba(255,255,255,0.03);
          font-size: 9px;
          color: #535a6d;
          text-align: center;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-family: 'Manrope', sans-serif;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .fg-history-btn {
            top: 158px;
            left: 16px;
          }
          .fg-sidebar {
            width: 280px;
          }
        }
      `}</style>

      {/* ── HAMBURGER BUTTON ── */}
      <button
        className={`fg-history-btn ${open ? "fg-active" : ""}`}
        onClick={() => setOpen(v => !v)}
        title="History"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* ── OVERLAY ── */}
      {open && <div className="fg-overlay" onClick={() => setOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <div className={`fg-sidebar ${open ? "fg-open" : ""}`}>
        <div className="fg-sidebar-header">
          <div>
            <div className="fg-sidebar-title">CHECK YOUR</div>
            <div className="fg-sidebar-sub">Last {MAX_HISTORY} searches</div>
          </div>
          <div className="fg-hdr-btns">
            {history.length > 0 && (
              <button className="fg-clear-btn" onClick={onClear}>Clear</button>
            )}
            <button className="fg-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>
        </div>

        <div className="fg-list">
          {history.length === 0 ? (
            <div className="fg-empty">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              No searches yet.<br />Start fact-checking!
            </div>
          ) : (
            history.map((item, i) => {
              const vc = VERDICT_COLORS[item.verdict] || VERDICT_COLORS.Unverified
              return (
                <button
                  key={i}
                  className="fg-item"
                  onClick={() => { onSelect(item); setOpen(false) }}
                >
                  <div className="fg-item-row">
                    <span className="fg-item-cat">{item.category}</span>
                    <span
                      className="fg-item-verdict"
                      style={{ color: vc.color, background: vc.bg, border: `1px solid ${vc.border}` }}
                    >
                      {item.verdict}
                    </span>
                  </div>
                  <div className="fg-item-query">{item.query}</div>
                  <div className="fg-item-time">{timeAgo(item.timestamp)}</div>
                </button>
              )
            })
          )}
        </div>

        <div className="fg-footer">FactGuard AI · Local History</div>
      </div>
    </>
  )
}