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

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
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
        service: "FitBuddy",
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
});

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

        const ai = getAI();

        const prompt = `
You are FitBuddy, an AI fitness assistant.

Create a practical, safe and personalized 7-day fitness plan.

USER INFORMATION:

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

Include:

1. Personalized introduction
2. 7-day workout schedule
3. Exercises for each workout day
4. Sets and repetitions
5. Rest time
6. Warm-up instructions
7. Cool-down instructions
8. Basic nutrition guidance
9. Hydration advice
10. Recovery and sleep advice
11. Safety precautions

Make the plan realistic and appropriate for the user's fitness level.

Do not recommend steroids or unsafe substances.
Do not provide dangerous or extreme dieting advice.
Do not diagnose medical conditions.
If the user has an injury, serious pain, medical condition,
or asks about medication, recommend consulting a qualified
healthcare professional.

Use clear headings and bullet points.
`;

        let response;
        let lastError;

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                response = await ai.models.generateContent({
                    model: "gemini-3.8-flash",
                    contents: prompt
                });

                break;
            } catch (error) {
                lastError = error;

                console.error(
                    `Gemini plan attempt ${attempt + 1} failed:`,
                    error?.message || error
                );

                if (attempt < 2) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, 2000 * (attempt + 1))
                    );
                }
            }
        }

        if (!response) {
            throw lastError || new Error("Gemini request failed.");
        }

        const text = response.text;

        if (!text) {
            throw new Error("Gemini returned an empty response.");
        }

        res.json({
            success: true,
            plan: text
        });

    } catch (error) {
        console.error("Generate Plan Error:", error);

        res.status(500).json({
            success: false,
            error:
                error?.message ||
                "Unable to generate fitness plan. Please try again."
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

        const ai = getAI();

        const prompt = `
You are FitBuddy, an AI fitness assistant.

Answer the user's fitness question clearly, briefly,
and practically.

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
Do not recommend steroids or unsafe substances.

If the user asks about a serious injury, severe pain,
medical condition, or medication, recommend consulting
a qualified healthcare professional.

Keep the answer easy to understand.

User question:
${message}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt
        });

        const text = response.text;

        if (!text) {
            throw new Error("Gemini returned an empty response.");
        }

        res.json({
            success: true,
            text: text
        });

    } catch (error) {
        console.error("Chat Error:", error);

        res.status(500).json({
            success: false,
            error:error?.message ||"Chat error"
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