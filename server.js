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

// Serve frontend files
app.use(express.static(__dirname));

// Gemini AI
function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
    }

    return new GoogleGenAI({
        apiKey: apiKey
    });
}

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "FitBuddy server is running"
    });
});

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
            activityLevel,
            workoutDays,
            diet,
            equipment
        } = req.body;

        if (!goal) {
            return res.status(400).json({
                error: "Fitness goal is required."
            });
        }

        const ai = getAI();

        const prompt = `
You are FitBuddy, an AI fitness assistant.

Create a practical and safe personalized fitness plan using the following information:

Name: ${name || "User"}
Age: ${age || "Not provided"}
Gender: ${gender || "Not provided"}
Height: ${height || "Not provided"}
Weight: ${weight || "Not provided"}
Fitness Goal: ${goal}
Activity Level: ${activityLevel || "Not provided"}
Workout Days Per Week: ${workoutDays || "Not provided"}
Diet Preference: ${diet || "Not provided"}
Available Equipment: ${equipment || "Not provided"}

Provide:

1. A short personalized introduction.
2. Weekly workout schedule.
3. Exercises for each workout day.
4. Sets, repetitions and rest time.
5. Warm-up and cool-down instructions.
6. Basic nutrition guidance.
7. Hydration advice.
8. Recovery and sleep advice.
9. Safety precautions.

Keep the plan realistic for the user's level.

Do not provide dangerous or extreme dieting advice.
Do not recommend steroids or unsafe substances.
If the user has a medical condition or injury, recommend consulting a qualified healthcare professional.

Format the response clearly using headings and bullet points.
`;

        let response;
        let lastError;

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt
                });

                break;
            } catch (error) {
                lastError = error;

                console.error(
                    `Gemini attempt ${attempt + 1} failed:`,
                    error.message
                );

                if (attempt < 2) {
                    const delay = 2000 * Math.pow(2, attempt);

                    console.log(
                        `Gemini temporarily unavailable. Retry ${
                            attempt + 1
                        }/3 in ${delay / 1000} seconds...`
                    );

                    await new Promise((resolve) =>
                        setTimeout(resolve, delay)
                    );
                }
            }
        }

        if (!response) {
            throw lastError || new Error("Gemini request failed.");
        }

        const text = response.text;

        res.json({
            success: true,
            plan: text
        });
    } catch (error) {
        console.error("Generate Plan Error:", error);

        res.status(500).json({
            success: false,
            error:
                error.message ||
                "Unable to generate fitness plan. Please try again."
        });
    }
});

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found"
    });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`FitBuddy running on port ${PORT}`);
});