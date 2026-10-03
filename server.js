```js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get the directory where server.js is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(__dirname));

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Gemini AI configuration
function getAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key is not configured. Add GEMINI_API_KEY to Render Environment Variables."
    );
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

// FitBuddy system instructions
const systemInstruction = `
You are FitBuddy, a friendly AI fitness planning assistant for general educational fitness guidance.

Create practical, beginner-friendly fitness guidance.

Keep recommendations realistic and easy to follow.

Consider the user's stated:
- Fitness goal
- Experience level
- Available equipment
- Available time
- Preferred activities

Do not diagnose medical conditions or provide medical treatment.

If a user mentions an injury, serious medical condition, severe pain,
or other medical concern, recommend consulting an appropriate healthcare
professional.

Keep responses clear, encouraging, and actionable.
`;

// AI chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please provide a valid message.",
      });
    }

    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction,
      },
    });

    res.json({
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    res.status(500).json({
      error: "Unable to get a response from FitBuddy right now.",
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "FitBuddy server is running.",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`FitBuddy server running on port ${PORT}`);
});
```
