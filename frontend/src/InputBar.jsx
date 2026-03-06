import { useState, useRef, useEffect } from "react"

const categories = [
  { label: "KYC", active: true },
  { label: "Fake News", active: true },
  { label: "Deepfake", active: false },
  { label: "Scam Detection", active: false },
  { label: "Phishing", active: false },
  { label: "Fraud", active: false },
]

const attachOptions = [
  {
    label: "Photo / Video",
    accept: "image/*,video/*",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    )
  },
  {
    label: "Voice Recording",
    isVoice: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    )
  }
]

function InputBar({ onSend }) {

  const [message, setMessage] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("KYC")
  const [menuOpen, setMenuOpen] = useState(false)

  const menuRef = useRef(null)
  const plusRef = useRef(null)

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

  const handleCategoryClick = (cat) => {
    if (cat.active) setSelectedCategory(cat.label)
  }

  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        plusRef.current && !plusRef.current.contains(e.target)
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handler)

    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="center-ui">

      <div className="typebar-wrapper">

        <button
          ref={plusRef}
          className={`plus-btn ${menuOpen ? "plus-btn-open" : ""}`}
          onClick={() => setMenuOpen(v => !v)}
        >
          +
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
                  <input type="file" accept={opt.accept} capture={opt.capture} style={{display:"none"}}/>
                  <span className="attach-icon">{opt.icon}</span>
                  <span className="attach-label">{opt.label}</span>
                </label>
              )
            )}
          </div>
        )}

        <textarea
          className="typebar"
          placeholder="Enter a claim, URL, or paste content to verify..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button
          className={`send-btn ${message.trim() ? "active" : ""}`}
          onClick={handleSend}
        >
          ➤
        </button>

      </div>

      <div className="category-pills">
        {categories.map(cat => (
          <button
            key={cat.label}
            className={`pill ${selectedCategory === cat.label ? "pill-selected" : ""} ${!cat.active ? "pill-disabled" : ""}`}
            onClick={() => handleCategoryClick(cat)}
            disabled={!cat.active}
          >
            {cat.label}
          </button>
        ))}
      </div>

    </div>
  )
}

export default InputBar