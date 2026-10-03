```js
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

      // Wait before retrying
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

User question:
${message}
