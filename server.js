import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get the current folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(__dirname));

// Gemini AI
function getAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key is not configured. Add GEMINI_API_KEY in Render Environment Variables."
    );
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

// FitBuddy instructions
const systemInstruction = `
You are FitBuddy, a friendly AI fitness planning assistant for general educational fitness guidance.

Create practical, beginner-friendly fitness guidance.

Help users with:
- Workout plans
- Exercise suggestions
- Home workouts
- Gym workouts
- Warm-ups and cool-downs
- General nutrition guidance
- Healthy habits
- Fitness goals
- Weight management guidance
- Strength and cardio training
- Recovery and rest

Keep answers clear, encouraging, and easy to follow.

Do not diagnose medical conditions.
Do not prescribe medication.
Do not provide dangerous or extreme fitness or dieting advice.

If a user has a serious injury, medical condition, or concerning symptoms, recommend speaking with a qualified healthcare professional.

Adapt the response to the user's goal, experience level, available equipment, and schedule when those details are provided.
`;

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FitBuddy server is running",
  });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please provide a message.",
      });
    }

    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const reply = response.text;

    res.json({
      reply: reply,
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    res.status(500).json({
      error: "Sorry, FitBuddy could not process your request.",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`FitBuddy server running on port ${PORT}`);
});
