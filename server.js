import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve website files
app.use(express.static(__dirname));

// ===============================
// GEMINI AI
// ===============================

function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
    }

    return new GoogleGenAI({
        apiKey: apiKey
    });
}

// ===============================
// HOME PAGE
// ===============================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ===============================
// HEALTH CHECK
// ===============================

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "FitBuddy server is running",
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
});

// ===============================
// GEMINI REQUEST WITH FALLBACK
// ===============================

async function generateWithFallback(prompt) {
    const ai = getAI();

    const models = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash"
    ];

    let lastError;

    for (const model of models) {
        try {
            console.log(`Trying Gemini model: ${model}`);

            const response = await ai.models.generateContent({
                model: model,
                contents: prompt
            });

            if (!response || !response.text) {
                throw new Error("Gemini returned an empty response.");
            }

            console.log(`Gemini success using: ${model}`);

            return response.text;

        } catch (error) {
            lastError = error;

            console.error(
                `${model} failed:`,
                error?.message || error
            );

            // Wait briefly before trying the next model
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    throw lastError || new Error("All Gemini models failed.");
}

// ===============================
// GENERATE FITNESS PLAN
// ===============================

app.post("/api/generate-plan", async (req, res) => {
    try {
        const {
            name,
            age,
            gender,
            height,
            weight,
            goal,
            activityLevel,
            workoutDays,
            diet,
            equipment
        } = req.body;

        if (!goal) {
            return res.status(400).json({
                success: false,
                error: "Fitness goal is required."
            });
        }

        const prompt = `
You are FitBuddy, an AI fitness assistant.

Create a practical, safe and personalized fitness plan.

User information:

Name: ${name || "User"}
Age: ${age || "Not provided"}
Gender: ${gender || "Not provided"}
Height: ${height || "Not provided"} cm
Weight: ${weight || "Not provided"} kg
Fitness Goal: ${goal}
Fitness Level: ${activityLevel || "Not provided"}
Workout Days Per Week: ${workoutDays || "Not provided"}
Diet Preference: ${diet || "Not provided"}
Available Equipment: ${equipment || "Bodyweight"}

Create a useful 7-day fitness plan.

Include:

1. Personalized introduction
2. Weekly schedule
3. Exercises for each workout day
4. Sets and repetitions
5. Rest periods
6. Warm-up
7. Cool-down
8. Basic nutrition guidance
9. Hydration advice
10. Recovery and sleep advice
11. Safety precautions

Keep the plan realistic and suitable for the user's fitness level.

Do not recommend dangerous exercises, extreme diets, steroids,
unsafe substances, or medical treatment.

If the user has a medical condition, injury, severe pain,
or medication-related question, recommend consulting
a qualified healthcare professional.

Use clear headings and bullet points.
`;

        const text = await generateWithFallback(prompt);

        res.json({
            success: true,
            plan: text
        });

    } catch (error) {
        console.error("Generate Plan Error:", error);

        res.status(500).json({
            success: false,
            error: error.message || "Unknown Gemini error"
        });
    }
});

// ===============================
// FITBUDDY CHAT
// ===============================

app.post("/api/chat", async (req, res) => {
    try {
        const message = req.body?.message;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                success: false,
                error: "Please enter a fitness question."
            });
        }

        const prompt = `
You are FitBuddy, an AI fitness assistant.

Answer the user's fitness question clearly,
briefly and practically.

You can help with:

- Workout exercises
- Beginner fitness
- Strength training
- Cardio
- Weight-management basics
- Healthy eating basics
- Recovery and rest
- Motivation
- General fitness questions

Do not diagnose medical conditions.
Do not prescribe medication.

If the user asks about serious injury,
medical conditions, severe pain or medication,
recommend consulting a qualified healthcare professional.

User question:

${message}
`;

        const text = await generateWithFallback(prompt);

        res.json({
            success: true,
            text: text
        });

    } catch (error) {
        console.error("Chat Error:", error);

        res.status(503).json({
            success: false,
            error:
                "FitBuddy AI is temporarily busy. Please try again in a few seconds."
        });
    }
});

// ===============================
// UNKNOWN ROUTES
// ===============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found"
    });
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {
    console.log(`FitBuddy running on port ${PORT}`);
});