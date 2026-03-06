import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
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

    const prompt = `
You are FactGuard AI.

Analyze the following claim and detect misinformation.

Category: ${category}

Claim:
${text}

Return ONLY valid JSON in this format:

{
"verdict": "True / False / Misleading / Unverified",
"confidence": "0-100%",
"explanation": "short explanation"
}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const responseText = result.text;

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