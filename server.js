```js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// =========================
// FILE PATH
// =========================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================
// MIDDLEWARE
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all frontend files
app.use(express.static(__dirname));

// =========================
// GEMINI SETUP
// =========================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is not set.");
}

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    })
  : null;

// =========================
// GEMINI FUNCTION
// =========================

async function generateWithRetry(prompt, retries = 2) {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (!response || !response.text) {
        throw new Error("Gemini returned an empty response.");
      }

      return response.text;
    } catch (error) {
      lastError = error;

      console.error(
        `Gemini attempt ${attempt + 1} failed:`,
        error?.message || error
      );

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  throw lastError;
}

// =========================
// AI CHAT / FITNESS PLAN
// =========================

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please provide a fitness question.",
      });
    }

    const prompt = `
You are FitBuddy, an AI fitness assistant.

Answer the user's fitness question clearly and briefly.

Give general educational fitness guidance.

Do not diagnose medical conditions or prescribe medical treatment.

If the user asks about a serious injury, medical condition, severe pain,
or medication, recommend consulting an appropriate qualified healthcare
professional.

You can help with:
- Workout plans
- Exercise suggestions
- Beginner fitness
- Strength training
- Cardio
- Weight-management basics
- Healthy eating basics
- Recovery and rest
- Motivation
- General fitness questions

Keep your answers practical and easy to understand.

User question:
${message}
`;

    const text = await generateWithRetry(prompt);

    res.json({ text });
  } catch (error) {
    console.error("Chat error:", error);

    res.status(503).json({
      error:
        "Gemini is temporarily unavailable. Please try again in a few seconds.",
    });
  }
});

// =========================
// HEALTH CHECK
// =========================

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "FitBuddy",
    geminiConfigured: Boolean(GEMINI_API_KEY),
  });
});

// =========================
// HOME PAGE
// =========================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(`FitBuddy running on port ${PORT}`);
});
```
