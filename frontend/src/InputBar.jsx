import { useState, useRef, useEffect } from "react"

const categories = [
  { label: "KYC", active: true },
  { label: "FAKE NEWS", active: true },
  { label: "DEEPFAKE", active: true },
  { label: "PHISHING", active: true },
  { label: "SCAM DETECTION", active: false },
]

function InputBar({ onSend, prefillText, onPrefillUsed }) {
  const [message, setMessage] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("KYC")
  const [menuOpen, setMenuOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const menuRef = useRef(null)
  const plusRef = useRef(null)
  const textareaRef = useRef(null)
  const photoInputRef = useRef(null)
  const docInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const isDeepfake = selectedCategory === "DEEPFAKE"

  useEffect(() => {
    if (prefillText) {
      setMessage(prefillText)
      textareaRef.current?.focus()
      onPrefillUsed?.()
    }
  }, [prefillText])

  useEffect(() => {
    if (!isDeepfake) {
      setImageFile(null)
      setImagePreview(null)
    }
  }, [selectedCategory])

  const handleSend = () => {
    if (!message.trim() && !imageFile) return
    onSend(message, selectedCategory, imageFile)
    setMessage("")
    setImageFile(null)
    setImagePreview(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (isDeepfake) {
      setImageFile(file)
      setMessage(file.name)
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    } 
    setMenuOpen(false)
  }

  // Paste image from clipboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (selectedCategory !== "DEEPFAKE") return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          setImageFile(file)
          
          const url = URL.createObjectURL(file)
          setImagePreview(url)
          break
        }
      }
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [selectedCategory])

  // Drag and drop image
  useEffect(() => {
    const card = document.querySelector(".inputcard")
    if (!card) return

    const handleDragOver = (e) => {
      if (selectedCategory !== "DEEPFAKE") return
      e.preventDefault()
      card.classList.add("inputcard-dragover")
    }
    const handleDragLeave = () => {
      card.classList.remove("inputcard-dragover")
    }
    const handleDrop = (e) => {
      e.preventDefault()
      card.classList.remove("inputcard-dragover")
      if (selectedCategory !== "DEEPFAKE") return
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) {
        setImageFile(file)
        
        const url = URL.createObjectURL(file)
        setImagePreview(url)
      }
    }

    card.addEventListener("dragover", handleDragOver)
    card.addEventListener("dragleave", handleDragLeave)
    card.addEventListener("drop", handleDrop)
    return () => {
      card.removeEventListener("dragover", handleDragOver)
      card.removeEventListener("dragleave", handleDragLeave)
      card.removeEventListener("drop", handleDrop)
    }
  }, [selectedCategory])

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
      <div className={`inputcard ${focused ? "inputcard-focused" : ""}`}>

        {/* Category pills */}
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

        <div className="inputcard-divider" />

        {/* Input row */}
        <div className="inputcard-row">

          {/* + Attach button */}
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
                style={{
                  transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  transform: menuOpen ? "rotate(45deg)" : "rotate(0deg)"
                }}
              >
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>

            {menuOpen && (
              <div className="attach-menu" ref={menuRef}>

                {/* Photo / Video */}
                <button
                  className="attach-option"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                  />
                  <span className="attach-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </span>
                  <span className="attach-label">Photo / Video</span>
                </button>

                {/* Document */}
                <label className="attach-option">
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.csv"
                    style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files[0]
                      if (file) { setMessage(file.name); setMenuOpen(false) }
                    }}
                  />
                  <span className="attach-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </span>
                  <span className="attach-label">Document</span>
                </label>

                {/* Voice Recording */}
                <button className="attach-option">
                  <span className="attach-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    </svg>
                  </span>
                  <span className="attach-label">Voice Recording</span>
                </button>

                {/* Camera */}
                <label className="attach-option">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                  />
                  <span className="attach-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </span>
                  <span className="attach-label">Camera</span>
                </label>

              </div>
            )}
          </div>

          {/* Image Preview (ChatGPT style) */}
          {imagePreview && (
            <div className="image-preview-wrap">
              <div className="image-preview-thumb">
                <img src={imagePreview} alt="preview" className="image-preview-img" />
                <button
                  className="image-preview-remove"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                    setMessage("")
                  }}
                >✕</button>
              </div>
              <span className="image-preview-name">{imageFile?.name || "Image"}</span>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            className="inputcard-textarea"
            placeholder={imageFile
  ? ""
  : isDeepfake
  ? "Paste image, drag & drop, or use + to upload..."
  : selectedCategory === "PHISHING"
  ? "Enter a URL to scan for PHISHING...."
  : "Enter a claim, URL, or paste content to verify…"
}
            value={message}
            onChange={e => {
              setMessage(e.target.value)
              if (imageFile) {
                setImageFile(null)
                setImagePreview(null)
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={1}
          />

          {/* Send button */}
          <button
            className={`inputcard-send ${(message.trim() || imageFile) ? "inputcard-send-active" : ""}`}
            onClick={handleSend}
            title="Verify"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>{isDeepfake ? "Analyze" : "Verify"}</span>
          </button>

        </div>

      </div>
    </div>
  )
}

export default InputBar