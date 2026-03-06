import "./App.css"
import Beams from "./Beams"
import InputBar from "./InputBar"
import { useState } from "react"

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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: message,
          category: category
        })
      })

      const data = await res.json()

      console.log("AI Result:", data)

      if (data.error) {
        setError("⚠️ AI service temporarily unavailable. Please try again.")
      } else {
        setResult(data)
      }

    } catch (err) {

      console.error("API error:", err)

      setError("⚠️ Cannot connect to server.")

    }

    setLoading(false)

  }

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

        <p className="subh">
          AI-powered misinformation detection for the modern internet.
        </p>

      </div>

      <div className="app-container">

        <InputBar onSend={handleSend} />

        {/* LOADING */}

        {loading && (
          <div className="resultBox">
            <p>🔍 FactGuard is analyzing the claim...</p>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="resultBox errorBox">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* RESULT */}

        {result && (
          <div className="resultBox">

            <h2 className={`verdict ${result.verdict}`}>
              {result.verdict}
            </h2>

            <p>
              <strong>Confidence:</strong> {result.confidence}
            </p>

            <p>
              {result.explanation}
            </p>

          </div>
        )}

      </div>

    </>
  )
}

export default App