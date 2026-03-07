import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// SAFE JSON PARSER
function extractJSON(text) {
  try {
    text = text.replace(/```json/g, "")
               .replace(/```/g, "")
               .trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("JSON not found");
    }
    const jsonString = text.slice(start, end + 1);
    return JSON.parse(jsonString);
  } catch (err) {
    return {
      verdict: "Unknown",
      confidence: "0%",
      explanation: text
    };
  }
}

// MAIN FACT CHECK ROUTE
app.post("/check", async (req, res) => {
  try {
    const { text, category } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Text is required"
      });
    }

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are FactGuard AI, an expert misinformation detector.
Always respond with ONLY valid JSON — no extra text, no markdown, no explanation outside the JSON.
Format:
{
  "verdict": "True" | "False" | "Misleading" | "Unverified",
  "confidence": "0-100%",
  "explanation": "short explanation"
}`
        },
        {
          role: "user",
          content: `Category: ${category}\n\nClaim:\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const responseText = result.choices[0]?.message?.content || "";
    const parsed = extractJSON(responseText);
    res.json(parsed);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FactGuard backend running on port ${PORT}`);
});