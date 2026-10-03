// ===============================
// FitBuddy Frontend JavaScript
// ===============================

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

// -------------------------------
// Add message to chat
// -------------------------------

function addMessage(message, sender) {
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");

  messageDiv.className =
    sender === "user" ? "message user-message" : "message bot-message";

  messageDiv.textContent = message;

  chatMessages.appendChild(messageDiv);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// -------------------------------
// Generate AI response
// -------------------------------

async function askFitBuddy(message) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to generate the plan.");
    }

    return data.text;
  } catch (error) {
    console.error("FitBuddy API error:", error);

    throw new Error(
      "Unable to generate the plan. Please try again."
    );
  }
}

// -------------------------------
// Chat form
// -------------------------------

if (chatForm) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = chatInput?.value?.trim();

    if (!message) {
      return;
    }

    addMessage(message, "user");

    if (chatInput) {
      chatInput.value = "";
    }

    addMessage("Thinking...", "bot");

    try {
      const answer = await askFitBuddy(message);

      const botMessages =
        chatMessages.querySelectorAll(".bot-message");

      const lastBotMessage =
        botMessages[botMessages.length - 1];

      if (lastBotMessage) {
        lastBotMessage.textContent = answer;
      }
    } catch (error) {
      const botMessages =
        chatMessages.querySelectorAll(".bot-message");

      const lastBotMessage =
        botMessages[botMessages.length - 1];

      if (lastBotMessage) {
        lastBotMessage.textContent = error.message;
      }
    }
  });
}

// -------------------------------
// Generate fitness plan
// -------------------------------

async function generatePlan() {
  const goal =
    document.getElementById("goal")?.value || "general fitness";

  const experience =
    document.getElementById("experience")?.value || "beginner";

  const days =
    document.getElementById("days")?.value || "3";

  const equipment =
    document.getElementById("equipment")?.value || "no equipment";

  const prompt = `
Create a practical fitness plan.

Goal: ${goal}
Experience level: ${experience}
Workout days per week: ${days}
Available equipment: ${equipment}

Include:
- Weekly workout schedule
- Exercises
- Sets and repetitions
- Rest periods
- Basic recovery advice
- General nutrition guidance

Keep it simple and easy to follow.
`;

  return askFitBuddy(prompt);
}

// -------------------------------
// Button support
// -------------------------------

const generateButton =
  document.getElementById("generatePlan");

if (generateButton) {
  generateButton.addEventListener("click", async () => {
    generateButton.disabled = true;
    generateButton.textContent = "Generating...";

    try {
      const plan = await generatePlan();

      alert(plan);
    } catch (error) {
      alert(error.message);
    } finally {
      generateButton.disabled = false;
      generateButton.textContent = "Generate Plan";
    }
  });
}