import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-3.8-flash";

// Retry Gemini when the service temporarily returns 503
async function generateWithRetry(prompt, attempts = 3) {
  let lastError;

  for (let i = 0; i < attempts; i++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt
      });

      return response.text;
    } catch (error) {
      lastError = error;

      const message = error?.message || "";

      if (
        !message.includes("503") &&
        !message.includes("UNAVAILABLE") &&
        !message.includes("high demand")
      ) {
        throw error;
      }

      console.log(`Gemini unavailable. Retry ${i + 1}/${attempts}`);

      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  throw lastError;
}


// =========================
// 7-DAY FITNESS PLAN
// =========================

app.post("/api/generate-plan", async (req, res) => {
  try {
    const data = req.body;

    const prompt = `
You are FitBuddy, a friendly AI fitness planning assistant.

Create a personalized 7-day fitness plan based on this user profile:

Name: ${data.name || "User"}
Age: ${data.age || "Not provided"}
Gender: ${data.gender || "Not provided"}
Height: ${data.height || "Not provided"}
Weight: ${data.weight || "Not provided"}
Goal: ${data.goal || "General fitness"}
Fitness Level: ${data.level || "Beginner"}
Days Available: ${data.days || "3"}
Equipment: ${data.equipment || "No equipment"}

Create a clear 7-day plan.

For each day include:
- Workout
- Exercises
- Sets and repetitions
- Rest time
- Short explanation

Also include basic nutrition and recovery advice.

Keep the advice suitable for general educational fitness guidance.
Do not diagnose medical conditions or provide medical treatment.
If an exercise may be unsuitable because of an injury or medical condition, advise consulting a qualified professional.

Return the plan in clear, readable text.
`;

    const text = await generateWithRetry(prompt);

    res.json({ text });

  } catch (error) {
    console.error("Generate plan error:", error);

    res.status(503).json({
      error: "Gemini is temporarily unavailable. Please try again in a few seconds."
    });
  }
});


// =========================
// AI CHAT
// =========================

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    const prompt = `
You are FitBuddy, a friendly AI fitness assistant.

Answer the user's fitness question clearly and briefly.

Give general educational fitness guidance.
Do not diagnose medical conditions or prescribe medical treatment.

User question:
${message}
`;

    const text = await generateWithRetry(prompt);

    res.json({ text });

  } catch (error) {
    console.error("Chat error:", error);

    res.status(503).json({
      error: "Gemini is temporarily unavailable. Please try again in a few seconds."
    });
  }
});


// =========================
// HEALTH CHECK
// =========================

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "FitBuddy"
  });
});


// =========================
// HOME PAGE
// =========================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


app.listen(PORT, () => {
  console.log(`FitBuddy running on port ${PORT}`);
});
