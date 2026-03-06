import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})

app.post("/check", async (req, res) => {
  try {

    const { text, category } = req.body

    if (!text) {
      return res.status(400).json({ error: "Text is required" })
    }

    const prompt = `
You are FactGuard AI.

Analyze the following claim and detect misinformation.

Category: ${category}

Claim:
${text}

Return JSON only in this format:

{
"verdict": "True / False / Misleading / Unverified",
"confidence": "percentage",
"explanation": "short explanation"
}
`

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    })

    const responseText = result.text

    let parsed

    try {
      parsed = JSON.parse(responseText)
    } catch {
      parsed = {
        verdict: "Unknown",
        confidence: "0%",
        explanation: responseText
      }
    }

    res.json(parsed)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: error.message
    })

  }
})

app.listen(5000, () => {
  console.log("FactGuard backend running on port 5000")
})