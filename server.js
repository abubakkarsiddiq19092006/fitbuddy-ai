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
// PATH SETUP
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
`;

    const text = await generateWithRetry(prompt);

    res.json({
      text,
    });
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

### 2. Make sure `package.json` has the new Gemini package

Your `package.json` should contain `@google/genai`.

For example:

```json
{
  "name": "fitbuddy-ai",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@google/genai": "^1.0.0",
    "dotenv": "^16.4.5",
    "express": "^4.21.2"
  }
}
```

**Important:** If your existing `package.json` already has other dependencies required by your website, **don't delete them**. Just make sure `@google/genai` is included.

### 3. Render Environment Variable

In Render → **Environment Variables**, make sure you have:

```text
GEMINI_API_KEY = your-new-gemini-api-key
```

Don't put the actual key in the code or GitHub.

### 4. Commit and deploy

After replacing the files:

```bash
git add server.js package.json package-lock.json
git commit -m "Fix Gemini API integration"
git push
```

Then Render should automatically deploy the new commit. If automatic deployment isn't enabled, use:

**Render → Manual Deploy → Deploy latest commit**

### 5. Test this first

After deployment, open:

[FitBuddy Health Check](https://fitbuddy-ai-n0wh.onrender.com/api/health?utm_source=chatgpt.com)

You should see something similar to:

```json
{
  "status": "OK",
  "service": "FitBuddy",
  "geminiConfigured": true
}
```

If `geminiConfigured` is **true**, Render is receiving your API key.

Then open your FitBuddy website and try generating a plan again.

The current Google documentation shows the Node.js SDK being initialized with `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })` and calling `ai.models.generateContent()`, which is why I've structured the server this way.

**One important point:** if your frontend currently sends the request to a different endpoint than `/api/chat`, tell me what your frontend JavaScript uses for `fetch(...)`. I can then make the `server.js` match it exactly.
