import './App.css'
import Beams from './Beams'

function App() {
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
     

    </>
  )
}

export default App