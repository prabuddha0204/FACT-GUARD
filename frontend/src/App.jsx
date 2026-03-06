import { useState, useRef, useEffect } from 'react'
import './App.css'
import Beams from './Beams'

const categories = [
  { label: 'KYC', active: true },
  { label: 'Fake News', active: true },
  { label: 'Deepfake', active: false },
  { label: 'Scam Detection', active: false },
  { label: 'Phishing', active: false },
  { label: 'Fraud', active: false },
]

const attachOptions = [
  {
    label: 'Photo / Video',
    accept: 'image/*,video/*',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    label: 'Document',
    accept: '.pdf,.doc,.docx,.txt,.csv',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Voice Recording',
    isVoice: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    label: 'Camera',
    accept: 'image/*',
    capture: 'environment',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
]

function App() {
  const [message, setMessage] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('KYC')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const plusRef = useRef(null)

  const handleCategoryClick = (cat) => {
    if (cat.active) setSelectedCategory(cat.label)
  }

  const handleSend = () => {
    if (!message.trim()) return
    setMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

      <div className="center-ui">
        <div className="typebar-wrapper">

          {/* + Button */}
          <button
            ref={plusRef}
            className={`plus-btn ${menuOpen ? 'plus-btn-open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            title="Attach"
          >
            <svg
              className="plus-icon"
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Popup Menu — renders above the bar */}
          {menuOpen && (
            <div className="attach-menu" ref={menuRef}>
              {attachOptions.map((opt, i) =>
                opt.isVoice ? (
                  <button
                    key={opt.label}
                    className="attach-option"
                    style={{ animationDelay: `${i * 35}ms` }}
                    onClick={() => { alert('Voice recording coming soon!'); setMenuOpen(false) }}
                  >
                    <span className="attach-icon">{opt.icon}</span>
                    <span className="attach-label">{opt.label}</span>
                  </button>
                ) : (
                  <label
                    key={opt.label}
                    className="attach-option"
                    style={{ animationDelay: `${i * 35}ms` }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <input type="file" accept={opt.accept} capture={opt.capture} style={{ display: 'none' }} />
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
            className={`send-btn ${message.trim() ? 'active' : ''}`}
            onClick={handleSend}
            title="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat.label}
              className={`pill ${selectedCategory === cat.label ? 'pill-selected' : ''} ${!cat.active ? 'pill-disabled' : ''}`}
              onClick={() => handleCategoryClick(cat)}
              disabled={!cat.active}
              title={!cat.active ? 'Coming soon' : cat.label}
            >
              {cat.label}
              {!cat.active && <span className="coming-soon-dot" />}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default App