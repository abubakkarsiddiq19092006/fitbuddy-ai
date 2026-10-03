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


// Serve the original FitBuddy website
app.use(express.static(__dirname));


// Gemini AI
function getAI() {

  if (!process.env.GEMINI_API_KEY) {

    throw new Error(
      "Gemini API key is not configured. Add GEMINI_API_KEY to Render Environment Variables."
    );

  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

}


// FitBuddy instructions
const systemInstruction = `
You are FitBuddy, a friendly AI fitness planning assistant for general educational fitness guidance.

Create practical, beginner-friendly fitness guidance.

Do not diagnose medical conditions, prescribe treatment,
or claim to replace a doctor or certified fitness professional.

If the user mentions a medical condition, injury, severe pain,
pregnancy, or another situation requiring professional advice,
recommend speaking with an appropriate healthcare professional.

For workout plans:

- Include a 7-day schedule.
- Include exercise names.
- Include sets/reps or duration.
- Include rest periods.
- Include warm-up and cool-down.
- Include simple general nutrition and hydration habits.
- Avoid extreme dieting.
- Avoid unsafe calorie restriction.
- Avoid dangerous exercises.
- Use the user's provided details and equipment.
- Keep responses clear with headings and bullet points.
`;


// Generate fitness plan
app.post("/api/generate-plan", async (req, res) => {

  try {

    const {
      name,
      age,
      gender,
      height,
      weight,
      goal,
      level,
      days,
      equipment
    } = req.body;


    if (
      !name ||
      !age ||
      !height ||
      !weight ||
      !goal ||
      !level ||
      !days
    ) {

      return res.status(400).json({
        error: "Please complete all required fitness details."
      });

    }


    const prompt = `
Create a personalized 7-day general fitness plan for:

Name: ${name}
Age: ${age}
Gender: ${gender || "Not specified"}
Height: ${height} cm
Weight: ${weight} kg
Goal: ${goal}
Fitness level: ${level}
Workout days per week: ${days}
Available equipment: ${equipment || "Bodyweight only"}

Include:

1. A short welcome.
2. A 7-day workout schedule.
3. Exercises with sets/reps or duration and rest.
4. Warm-up guidance.
5. Cool-down guidance.
6. Simple general nutrition habits.
7. Hydration habits.
8. Progress tips.
9. A short safety disclaimer.

Make the plan practical and beginner-friendly.
`;


    const ai = getAI();


    const response = await ai.models.generateContent({

      model: "gemini-3.8-flash",

      contents: prompt,

      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }

    });


    res.json({
      text: response.text || "No plan was generated."
    });


  } catch (error) {

    console.error("Generate Plan Error:", error);

    res.status(500).json({
      error: error.message || "Unable to generate the plan."
    });

  }

});


// Ask FitBuddy
app.post("/api/chat", async (req, res) => {

  try {

    const { message } = req.body;


    if (!message || !message.trim()) {

      return res.status(400).json({
        error: "Please enter a question."
      });

    }


    const ai = getAI();


    const response = await ai.models.generateContent({

      model: "gemini-2.5-flash",

      contents: message,

      config: {

        systemInstruction: `${systemInstruction}

Answer the user's fitness question briefly,
clearly, and practically.

Do not provide medical diagnosis or treatment.`,

        temperature: 0.7

      }

    });


    res.json({
      text: response.text || "I couldn't generate a response."
    });


  } catch (error) {

    console.error("Ask FitBuddy Error:", error);

    res.status(500).json({
      error: error.message || "Unable to answer right now."
    });

  }

});


// Health check
app.get("/api/health", (req, res) => {

  res.json({
    status: "FitBuddy server is running"
  });

});


// Start server
app.listen(PORT, () => {

  console.log(
    `FitBuddy is running on port ${PORT}`
  );

});
