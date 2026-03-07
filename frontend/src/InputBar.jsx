import { useState, useRef, useEffect } from "react"

const categories = [
  { label: "KYC", active: true },
  { label: "FAKE NEWS", active: true },
  { label: "DEEPFAKE", active: false },
  { label: "SCAM DETECTION", active: false },
  { label: "PHISING", active: false },
  
]

const attachOptions = [
  {
    label: "Photo / Video",
    accept: "image/*,video/*",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    )
  },
  {
    label: "Document",
    accept: ".pdf,.doc,.docx,.txt,.csv",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    )
  },
  {
    label: "Voice Recording",
    isVoice: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      </svg>
    )
  },
  {
    label: "Camera",
    accept: "image/*",
    capture: "environment",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    )
  }
]

function InputBar({ onSend, prefillText, onPrefillUsed }) {
  const [message, setMessage] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("KYC")
  const [menuOpen, setMenuOpen] = useState(false)
  const [focused, setFocused] = useState(false)

  const menuRef = useRef(null)
  const plusRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (prefillText) {
      setMessage(prefillText)
      textareaRef.current?.focus()
      onPrefillUsed?.()
    }
  }, [prefillText])

  const handleSend = () => {
    if (!message.trim()) return
    onSend(message, selectedCategory)
    setMessage("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        plusRef.current && !plusRef.current.contains(e.target)
      ) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="center-ui">

      {/* ── Main input card ── */}
      <div className={`inputcard ${focused ? "inputcard-focused" : ""}`}>

        {/* Top row: category pills inside card */}
        <div className="inputcard-cats">
          <span className="inputcard-cats-label">Mode</span>
          <div className="inputcard-cat-pills">
            {categories.map(cat => (
              <button
                key={cat.label}
                className={`icat-pill
                  ${selectedCategory === cat.label ? "icat-pill-active" : ""}
                  ${!cat.active ? "icat-pill-disabled" : ""}`}
                onClick={() => cat.active && setSelectedCategory(cat.label)}
                disabled={!cat.active}
              >
                {cat.label}
                {!cat.active && <span className="icat-soon">soon</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="inputcard-divider" />

        {/* Bottom row: attach + textarea + send */}
        <div className="inputcard-row">

          {/* Attach button */}
          <div className="inputcard-attach-wrap">
            <button
              ref={plusRef}
              className={`inputcard-attach ${menuOpen ? "inputcard-attach-open" : ""}`}
              onClick={() => setMenuOpen(v => !v)}
              title="Attach"
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)", transform: menuOpen ? "rotate(45deg)" : "rotate(0deg)" }}
              >
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>

            {menuOpen && (
              <div className="attach-menu" ref={menuRef}>
                {attachOptions.map(opt =>
                  opt.isVoice ? (
                    <button key={opt.label} className="attach-option">
                      <span className="attach-icon">{opt.icon}</span>
                      <span className="attach-label">{opt.label}</span>
                    </button>
                  ) : (
                    <label key={opt.label} className="attach-option">
                      <input type="file" accept={opt.accept} capture={opt.capture} style={{ display: "none" }} />
                      <span className="attach-icon">{opt.icon}</span>
                      <span className="attach-label">{opt.label}</span>
                    </label>
                  )
                )}
              </div>
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            className="inputcard-textarea"
            placeholder="Enter a claim, URL, or paste content to verify…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={1}
          />

          {/* Send button */}
          <button
            className={`inputcard-send ${message.trim() ? "inputcard-send-active" : ""}`}
            onClick={handleSend}
            title="Verify"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>Verify</span>
          </button>

        </div>

      </div>

    </div>
  )
}

export default InputBar