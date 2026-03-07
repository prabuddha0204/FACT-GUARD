import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

// SAFE JSON PARSER
function extractJSON(text) {
  try {
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("JSON not found");
    return JSON.parse(text.slice(start, end + 1));
  } catch (err) {
    return {
      verdict: "Unverified",
      confidence: "0%",
      explanation: text,
      breakdown: [],
      sources: []
    };
  }
}

// MAIN FACT CHECK ROUTE
app.post("/check", async (req, res) => {
  try {
    const { text, category } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // ── Step 1: Web search via Tavily ──
    let searchContext = "";
    let sources = [];

    try {
      const searchResult = await tavilyClient.search(text, {
        searchDepth: "basic",
        maxResults: 5,
        includeAnswer: true,
      });

      sources = searchResult.results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.slice(0, 180) || ""
      }));

      searchContext = searchResult.results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.content?.slice(0, 400)}`)
        .join("\n\n");

    } catch (searchErr) {
      console.warn("Tavily search failed, proceeding without web context:", searchErr.message);
    }

    // ── Step 2: AI analysis with web context ──
    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are FactGuard AI, an expert misinformation detector with access to real-time web search results.
Analyze claims carefully using the provided web search context.
Always respond with ONLY valid JSON — no extra text, no markdown, no explanation outside the JSON.

Format:
{
  "verdict": "True" | "False" | "Misleading" | "Unverified",
  "confidence": "0-100%",
  "explanation": "2-3 sentence summary of your finding",
  "breakdown": [
    { "point": "short label", "detail": "one sentence" },
    { "point": "short label", "detail": "one sentence" },
    { "point": "short label", "detail": "one sentence" }
  ]
}

breakdown must have 2-4 points explaining WHY you gave this verdict.
Good point labels: "Contradicts official data", "No credible coverage", "Partially supported", "Matches verified source", "Scientific consensus disagrees", "Misleading framing", "Confirmed by multiple sources", "Unverifiable claim"`
        },
        {
          role: "user",
          content: `Category: ${category}

Claim:
"${text}"

Web search results:
${searchContext || "No web results available — use training knowledge."}

Return only JSON.`
        }
      ],
      temperature: 0.2,
      max_tokens: 700
    });

    const responseText = result.choices[0]?.message?.content || "";
    const parsed = extractJSON(responseText);
    parsed.sources = sources.slice(0, 3);

    res.json(parsed);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FactGuard backend running on port ${PORT}`);
});