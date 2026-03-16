import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import multer from "multer"
import FormData from "form-data"
import axios from "axios"
import twilio from "twilio"

const upload = multer({ storage: multer.memoryStorage() })

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
const SAFE_BROWSING_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY;

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

// KYC SCAM SIGNAL DETECTOR
function detectScamSignals(text) {
  const signals = []
  if (/\botp\b/i.test(text)) signals.push("OTP Request Detected")
  if (/aadhaar|aadhar/i.test(text)) signals.push("Aadhaar Reference Detected")
  if (/immediately|blocked|suspended|expire|urgent|last chance/i.test(text)) signals.push("Urgency Language Detected")
  if (/sbi|hdfc|icici|npci|uidai|rbi|axis|kotak|paytm/i.test(text)) signals.push("Bank / Authority Impersonation Detected")
  if (/send|transfer|pay\s*₹|pay\s*rs|deposit/i.test(text)) signals.push("Money Transfer Request Detected")
  if (/bit\.ly|tinyurl|cutt\.ly|shorturl/i.test(text)) signals.push("Suspicious Short URL Detected")
  if (/won|winner|prize|lottery|congratulations|selected|free/i.test(text)) signals.push("Fake Prize / Offer Detected")
  if (/password|pin\b|cvv|card.?number|account.?number/i.test(text)) signals.push("Sensitive Data Request Detected")
  if (/kyc|know your customer|verify your account|update your details/i.test(text)) signals.push("Fake KYC Update Request Detected")
  if (/income.?tax|it.?department|tax.?refund|tds/i.test(text)) signals.push("Fake Government / Tax Authority Detected")
  return signals
}

// GOOGLE SAFE BROWSING CHECK
async function checkPhishing(url) {
  try {
    const body = {
      client: { clientId: "factguard", clientVersion: "1.0" },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }]
      }
    };
    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_KEY}`,
      body
    );
    return response.data;
  } catch (err) {
    console.error("Safe Browsing error:", err.message);
    return {};
  }
}

// URL SHORTENER EXPANDER
const SHORTENER_DOMAINS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly",
  "buff.ly", "is.gd", "rebrand.ly", "shorturl.at"
];

async function expandUrl(url) {
  try {
    const response = await axios({
      method: "HEAD", url, maxRedirects: 10, timeout: 5000, validateStatus: null
    });
    const finalUrl = response.request?.res?.responseUrl;
    if (finalUrl) return finalUrl;
  } catch (err) {}

  try {
    const response = await axios({
      method: "GET", url, maxRedirects: 10, timeout: 5000, validateStatus: null
    });
    return response.request?.res?.responseUrl || url;
  } catch (err) {
    return url;
  }
}

// ── URL PHISHING SCAN ROUTE ──
app.post("/scan-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    let expandedUrl = url;
    let shortenerDetected = false;

    try {
      const hostname = new URL(url).hostname.replace("www.", "");
      if (SHORTENER_DOMAINS.includes(hostname)) {
        shortenerDetected = true;
        expandedUrl = await expandUrl(url);
      }
    } catch (e) {}

    // Step 1: Google Safe Browsing check
    const safeBrowsingResult = await checkPhishing(expandedUrl);

    if (safeBrowsingResult && safeBrowsingResult.matches) {
      return res.json({
        submittedUrl: url,
        resolvedUrl: expandedUrl,
        shortenerDetected,
        verdict: "PHISHING",
        confidence: "100%",
        explanation: shortenerDetected
          ? "Shortened URL detected. Destination expanded and flagged as malicious by Google Safe Browsing."
          : "This URL is flagged as malicious by Google's Safe Browsing threat intelligence database.",
        breakdown: [
          {
            point: "Threat Intelligence Detection",
            detail: "The domain appears in Google Safe Browsing's malware or phishing database."
          },
          {
            point: "Google Safe Browsing Confirmed",
            detail: "This URL matched known malicious patterns used by cybercriminals to steal credentials."
          }
        ],
        sources: []
      });
    }

    // Step 2: Groq AI analysis
    const aiResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a cybersecurity AI analyzing URLs for phishing risk.

Look for:
- Brand impersonation (fake bank, government, tech company domains)
- Phishing keywords in URL (secure, verify, login, update, confirm)
- Suspicious domain structure (extra subdomains, misspellings)
- Fake authentication pages or credential harvesting patterns
- Indian bank/government impersonation (SBI, HDFC, UIDAI, RBI, IRCTC)

Return ONLY valid JSON:
{
  "verdict": "SAFE" | "SUSPICIOUS" | "PHISHING",
  "confidence": "0-100%",
  "explanation": "2-3 sentence explanation",
  "breakdown": [
    { "point": "short label", "detail": "one sentence" }
  ]
}
breakdown must have 2-3 points.`
        },
        {
          role: "user",
          content: `Analyze this URL for phishing risk:

Submitted URL: ${url}
${shortenerDetected ? `Resolved destination: ${expandedUrl}` : ""}

Return only JSON.`
        }
      ],
      temperature: 0.2,
      max_tokens: 400
    });

    const responseText = aiResponse.choices[0]?.message?.content || "";
    const parsed = extractJSON(responseText);

    parsed.submittedUrl = url;
    parsed.resolvedUrl = expandedUrl;
    parsed.shortenerDetected = shortenerDetected;

    if (shortenerDetected && parsed.explanation) {
      parsed.explanation = `Shortened URL expanded to: ${expandedUrl}. ${parsed.explanation}`;
    }

    res.json(parsed);

  } catch (error) {
    console.error("URL scan error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── MAIN FACT CHECK ROUTE ──
app.post("/check", async (req, res) => {
  try {
    const { text, category } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    let searchContext = "";
    let sources = [];
    let scamSignals = [];

    // FAKE NEWS: Triple search
    if (category === "FAKE NEWS") {
      try {
        const [s1, s2, s3] = await Promise.all([
          tavilyClient.search(text, { searchDepth: "basic", maxResults: 3 }),
          tavilyClient.search(`fact check "${text}"`, { searchDepth: "basic", maxResults: 3 }),
          tavilyClient.search(`debunk "${text}"`, { searchDepth: "basic", maxResults: 2 }),
        ])
        const allResults = [...s1.results, ...s2.results, ...s3.results]
        sources = allResults.slice(0, 5).map(r => ({
          title: r.title, url: r.url, snippet: r.content?.slice(0, 180) || ""
        }))
        searchContext = allResults
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.content?.slice(0, 300)}`)
          .join("\n\n")
      } catch (err) {
        console.warn("Triple search failed:", err.message)
      }

    // KYC: Scam signal detection + targeted search
    } else if (category === "KYC") {
      scamSignals = detectScamSignals(text)
      try {
        const searchResult = await tavilyClient.search(
          `Indian KYC scam fraud "${text.slice(0, 100)}"`,
          { searchDepth: "basic", maxResults: 5 }
        )
        sources = searchResult.results.map(r => ({
          title: r.title, url: r.url, snippet: r.content?.slice(0, 180) || ""
        }))
        searchContext = searchResult.results
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.content?.slice(0, 400)}`)
          .join("\n\n")
      } catch (err) {
        console.warn("KYC search failed:", err.message)
      }

    // OTHER: Standard single search
    } else {
      try {
        const searchResult = await tavilyClient.search(text, {
          searchDepth: "basic", maxResults: 5, includeAnswer: true,
        })
        sources = searchResult.results.map(r => ({
          title: r.title, url: r.url, snippet: r.content?.slice(0, 180) || ""
        }))
        searchContext = searchResult.results
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.content?.slice(0, 400)}`)
          .join("\n\n")
      } catch (err) {
        console.warn("Search failed:", err.message)
      }
    }

    // System prompt per category
    let systemPrompt = ""

    if (category === "KYC") {
      systemPrompt = `You are FactGuard AI, a specialist in Indian KYC fraud, financial scams, and digital safety.
Pre-detected scam signals found in this message: ${scamSignals.length > 0 ? scamSignals.join(", ") : "None detected"}

Analyze this message specifically for:
- Impersonation of Indian banks (SBI, HDFC, ICICI), UIDAI, RBI, NPCI, Income Tax Department
- Requests for OTP, Aadhaar number, PAN, CVV, PIN, passwords, account numbers
- Urgency tactics to pressure the user into acting immediately
- Fake KYC update requirements
- UPI fraud patterns and money transfer tricks
- Lottery, prize, or free offer scams

VERDICT MEANING FOR KYC:
"False" = This IS a scam or fraud message — do not trust it
"True" = This is a legitimate, safe message
"Misleading" = Suspicious but not fully confirmed as scam
"Unverified" = Cannot determine if scam or legitimate

If ANY scam signals are detected, verdict must be "False".

Always respond with ONLY valid JSON — no extra text, no markdown.

Format:
{
  "verdict": "True" | "False" | "Misleading" | "Unverified",
  "confidence": "0-100%",
  "explanation": "2-3 sentence summary",
  "breakdown": [
    { "point": "short label", "detail": "one sentence" }
  ],
  "scamType": "Phishing" | "Vishing" | "Smishing" | "Fake KYC" | "UPI Fraud" | "Lottery Scam" | "None"
}
breakdown must have 2-4 points.`

    } else if (category === "FAKE NEWS") {
      systemPrompt = `You are FactGuard AI, an expert misinformation detector with access to real-time web search results including dedicated fact-check and debunk searches.
Analyze the claim carefully using ALL provided web search context.
Always respond with ONLY valid JSON — no extra text, no markdown.

Format:
{
  "verdict": "True" | "False" | "Misleading" | "Unverified",
  "confidence": "0-100%",
  "explanation": "2-3 sentence summary of your finding",
  "breakdown": [
    { "point": "short label", "detail": "one sentence" }
  ],
  "manipulationTactic": "Emotional Baiting" | "Selective Statistics" | "Fabricated Quote" | "False Context" | "Satire Misrepresented" | "Clickbait Framing" | "Conspiracy Theory" | "None"
}

breakdown must have 2-4 points explaining WHY you gave this verdict.

For manipulationTactic choose based on these exact definitions:
- Emotional Baiting = claim uses fear, anger, or outrage to bypass critical thinking
- Selective Statistics = uses real numbers but cherry-picks data to create false impression
- Fabricated Quote = attributes fake or distorted words to a real person
- False Context = real image or real event but presented with completely wrong context
- Satire Misrepresented = satirical or parody content being shared as if it is real news
- Clickbait Framing = sensational headline that exaggerates or contradicts the actual content
- Conspiracy Theory = baseless claim about a secret coordinated plot with no credible evidence
- None = no specific manipulation tactic identified`

    } else {
      systemPrompt = `You are FactGuard AI, an expert misinformation detector with access to real-time web search results.
Analyze claims carefully using the provided web search context.
Always respond with ONLY valid JSON — no extra text, no markdown, no explanation outside the JSON.

Format:
{
  "verdict": "True" | "False" | "Misleading" | "Unverified",
  "confidence": "0-100%",
  "explanation": "2-3 sentence summary of your finding",
  "breakdown": [
    { "point": "short label", "detail": "one sentence" }
  ]
}
breakdown must have 2-4 points explaining WHY you gave this verdict.`
    }

    // User message per category
    let userMessage = ""

    if (category === "KYC") {
      userMessage = `Category: KYC Fraud Detection
Pre-detected signals: ${scamSignals.length > 0 ? scamSignals.join(", ") : "None"}

Message to analyze:
"${text}"

Web search context:
${searchContext || "No web results — use training knowledge about Indian scams."}

Return only JSON.`

    } else if (category === "FAKE NEWS") {
      userMessage = `Category: FAKE NEWS

Claim:
"${text}"

Web search results:
${searchContext || "No web results available — use training knowledge."}

Before setting manipulationTactic, identify which fits best:
- Secret plot with no evidence? → Conspiracy Theory
- Fear, anger, health scare to make people panic? → Emotional Baiting
- Real stats cherry-picked to mislead? → Selective Statistics
- Fake words put in real person's mouth? → Fabricated Quote
- Real event shown in wrong context? → False Context
- Joke or parody shared as real news? → Satire Misrepresented
- Sensational exaggerated headline? → Clickbait Framing

Return only JSON.`

    } else {
      userMessage = `Category: ${category}

Claim:
"${text}"

Web search results:
${searchContext || "No web results available — use training knowledge."}

Return only JSON.`
    }

    // Call Groq
    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.2,
      max_tokens: 800
    });

    const responseText = result.choices[0]?.message?.content || "";
    const parsed = extractJSON(responseText);
    parsed.sources = sources.slice(0, 3);
    if (category === "KYC" && scamSignals.length > 0) {
      parsed.scamSignals = scamSignals
    }

    res.json(parsed);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ── FILE UPLOAD DEEPFAKE DETECTION ──
app.post("/check-image-file", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" })

    const form = new FormData()
    form.append("models", "genai,deepfake")
    form.append("api_user", process.env.SIGHTENGINE_API_USER)
    form.append("api_secret", process.env.SIGHTENGINE_API_SECRET)
    form.append("media", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    })

    const sightengineRes = await axios.post(
      "https://api.sightengine.com/1.0/check.json",
      form,
      { headers: form.getHeaders() }
    )
    const sightengineData = sightengineRes.data

    if (sightengineData.status === "failure") {
      return res.status(400).json({ error: sightengineData.error.message })
    }

    const aiScore = sightengineData.type?.ai_generated ?? 0
    const deepfakeScore = sightengineData.type?.deepfake ?? 0
    const combinedScore = Math.max(aiScore, deepfakeScore)
    const percentage = Math.round(combinedScore * 100)
    const isDeepfake = deepfakeScore > aiScore

    let verdict, explanation, label

    if (percentage >= 80) {
      verdict = "False"
      label = isDeepfake ? "Likely Deepfake" : "Likely AI Generated"
      explanation = `This image has a ${percentage}% probability of being ${isDeepfake ? "a deepfake (face swapped or manipulated)" : "fully AI generated"}. Do not trust or share this image.`
    } else if (percentage >= 50) {
      verdict = "Misleading"; label = "Possibly Manipulated"
      explanation = `This image has a ${percentage}% probability of being AI generated or manipulated. Verify before sharing.`
    } else if (percentage >= 20) {
      verdict = "Unverified"; label = "Slightly Suspicious"
      explanation = `This image has a ${percentage}% probability of being AI generated. Mostly authentic but worth noting.`
    } else {
      verdict = "True"; label = "Likely Authentic"
      explanation = `This image has only a ${percentage}% probability of being AI generated. It appears to be an authentic photograph.`
    }

    res.json({
      verdict, label,
      confidence: `${100 - percentage}%`,
      aiGeneratedProbability: percentage,
      explanation,
      breakdown: [
        {
          point: isDeepfake ? "Deepfake Score" : "AI Generation Score",
          detail: `Sightengine detected a ${percentage}% probability this image was ${isDeepfake ? "face-swapped or deepfaked" : "created by AI"}.`
        },
        {
          point: "Forensic Analysis",
          detail: percentage >= 50
            ? "Pixel patterns and facial features are inconsistent with natural photography."
            : "Pixel patterns are broadly consistent with natural photography."
        },
        {
          point: "Recommendation",
          detail: percentage >= 50
            ? "Do not share as real. Reverse image search to find the original source."
            : "Image appears authentic. Always verify the source before sharing."
        }
      ],
      sources: []
    })

  } catch (error) {
    console.error("File image check error:", error.response?.data || error.message)
    res.status(500).json({ error: error.response?.data?.error?.message || error.message })
  }
})

// ── URL BASED DEEPFAKE DETECTION ──
app.post("/check-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "Image URL is required" });

    const params = new URLSearchParams({
      url: imageUrl,
      models: "genai,deepfake",
      api_user: process.env.SIGHTENGINE_API_USER,
      api_secret: process.env.SIGHTENGINE_API_SECRET,
    });

    const sightengineRes = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`);
    const sightengineData = await sightengineRes.json();

    if (sightengineData.status === "failure") {
      return res.status(400).json({ error: sightengineData.error.message });
    }

    const aiScore = sightengineData.type?.ai_generated ?? 0
    const deepfakeScore = sightengineData.type?.deepfake ?? 0
    const combinedScore = Math.max(aiScore, deepfakeScore)
    const percentage = Math.round(combinedScore * 100)
    const isDeepfake = deepfakeScore > aiScore

    let verdict, explanation, label;

    if (percentage >= 80) {
      verdict = "False"
      label = isDeepfake ? "Likely Deepfake" : "Likely AI Generated"
      explanation = `This image has a ${percentage}% probability of being ${isDeepfake ? "a deepfake" : "fully AI generated"}. Do not trust or share this image.`
    } else if (percentage >= 50) {
      verdict = "Misleading"; label = "Possibly Manipulated"
      explanation = `This image has a ${percentage}% probability of being AI generated or manipulated. Verify before sharing.`
    } else if (percentage >= 20) {
      verdict = "Unverified"; label = "Slightly Suspicious"
      explanation = `This image has a ${percentage}% probability of being AI generated. Mostly authentic but worth noting.`
    } else {
      verdict = "True"; label = "Likely Authentic"
      explanation = `This image has only a ${percentage}% probability of being AI generated. Appears to be authentic.`
    }

    res.json({
      verdict, label,
      confidence: `${100 - percentage}%`,
      aiGeneratedProbability: percentage,
      explanation,
      breakdown: [
        {
          point: isDeepfake ? "Deepfake Score" : "AI Generation Score",
          detail: `Sightengine detected a ${percentage}% probability this image was ${isDeepfake ? "face-swapped or deepfaked" : "created by AI"}.`
        },
        {
          point: "Forensic Analysis",
          detail: percentage >= 50
            ? "Pixel patterns inconsistent with natural photography."
            : "Pixel patterns consistent with natural photography."
        },
        {
          point: "Recommendation",
          detail: percentage >= 50
            ? "Do not share as real. Reverse image search to verify."
            : "Appears authentic but always verify the source."
        }
      ],
      sources: []
    });

  } catch (error) {
    console.error("Image check error:", error);
    res.status(500).json({ error: error.message });
  }
});
// ── TWILIO WHATSAPP WEBHOOK ──
app.post("/whatsapp", async (req, res) => {
  try {
    const incomingMsg = req.body.Body?.trim()
    const from = req.body.From

    if (!incomingMsg) {
      return res.set("Content-Type", "text/xml").send("<Response></Response>")
    }

    // Auto-detect category
    let category = "FAKE NEWS"
    if (/otp|aadhaar|kyc|sbi|hdfc|icici|rbi|upi|bank/i.test(incomingMsg)) {
      category = "KYC"
    } else if (/http|https|bit\.ly|tinyurl/i.test(incomingMsg)) {
      category = "PHISHING"
    }

    let replyText = ""

    if (category === "PHISHING") {
      // Extract URL from message
      const urlMatch = incomingMsg.match(/https?:\/\/[^\s]+/)
      const url = urlMatch ? urlMatch[0] : incomingMsg

      const scanRes = await axios.post("https://factguard-backend.onrender.com/scan-url", {
        url
      })
      const data = scanRes.data

      replyText = `🔍 *FactGuard URL Scan*\n\n` +
        `Verdict: *${data.verdict}*\n` +
        `Confidence: ${data.confidence}\n\n` +
        `${data.explanation}\n\n` +
        (data.shortenerDetected ? `⚠ Short URL resolved to:\n${data.resolvedUrl}\n\n` : "") +
        `_Powered by FactGuard AI_`

    } else {
      // Run through fact check
      const checkRes = await axios.post("https://factguard-backend.onrender.com/check", {
        text: incomingMsg,
        category
      })
      const data = checkRes.data

      const verdictEmoji = {
        "True": "✅",
        "False": "❌",
        "Misleading": "⚠️",
        "Unverified": "❓"
      }[data.verdict] || "🔍"

      replyText = `${verdictEmoji} *FactGuard Verdict: ${data.verdict}*\n` +
        `Confidence: ${data.confidence}\n\n` +
        `${data.explanation}\n\n` +
        (data.manipulationTactic && data.manipulationTactic !== "None"
          ? `⚠️ Tactic: ${data.manipulationTactic}\n\n` : "") +
        (data.scamSignals && data.scamSignals.length > 0
          ? `🚨 Signals: ${data.scamSignals.slice(0, 3).join(", ")}\n\n` : "") +
        `_Powered by FactGuard AI_`
    }

    // Send WhatsApp reply via Twilio
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)


    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: from,
      body: replyText
    })

    res.set("Content-Type", "text/xml").send("<Response></Response>")

  } catch (error) {
    console.error("WhatsApp webhook error:", error.message)
    res.set("Content-Type", "text/xml").send("<Response></Response>")
  }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FactGuard backend running on port ${PORT}`);
});