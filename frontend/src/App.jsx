import "./App.css"
import Beams from "./Beams"
import InputBar from "./InputBar"

function App() {

  const handleSend = async (message, category) => {

    console.log("User message:", message)
    console.log("Category:", category)

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

    } catch (error) {
      console.error("API error:", error)
    }
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

      <InputBar onSend={handleSend} />
    </>
  )
}

export default App