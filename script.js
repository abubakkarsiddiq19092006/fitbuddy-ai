const fitnessForm = document.getElementById("fitnessForm");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const planOutput = document.getElementById("planOutput");

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

// ===============================
// GENERATE FITNESS PLAN
// ===============================

if (fitnessForm) {
fitnessForm.addEventListener("submit", async function (event) {
event.preventDefault();

```
    const formData = new FormData(fitnessForm);

    const data = {
        name: formData.get("name"),
        age: formData.get("age"),
        gender: formData.get("gender"),
        height: formData.get("height"),
        weight: formData.get("weight"),
        goal: formData.get("goal"),
        activityLevel: formData.get("level"),
        workoutDays: formData.get("days"),
        equipment: formData.get("equipment")
    };

    results.classList.remove("hidden");
    loading.classList.remove("hidden");
    planOutput.innerHTML = "";

    results.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    const button = fitnessForm.querySelector("button[type='submit']");

    if (button) {
        button.disabled = true;
        button.textContent = "Creating your plan...";
    }

    try {
        const response = await fetch("/api/generate-plan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || "Unable to generate the fitness plan."
            );
        }

        planOutput.innerHTML = formatPlan(result.plan);

    } catch (error) {
        console.error("Generate plan error:", error);

        planOutput.innerHTML = `
            <div class="error-message">
                <h3>Unable to generate the plan</h3>
                <p>${escapeHtml(error.message)}</p>
                <p>Please try again in a few seconds.</p>
            </div>
        `;

    } finally {
        loading.classList.add("hidden");

        if (button) {
            button.disabled = false;
            button.textContent = "Generate My 7-Day Plan ✦";
        }
    }
});
```

}

// ===============================
// FORMAT AI PLAN
// ===============================

function formatPlan(text) {
if (!text) {
return "<p>No plan was returned. Please try again.</p>";
}

```
let formatted = escapeHtml(text);

formatted = formatted
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\* (.*)$/gm, "<li>$1</li>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");

return formatted;
```

}

// ===============================
// ESCAPE HTML
// ===============================

function escapeHtml(text) {
return String(text)
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

// ===============================
// CHAT
// ===============================

if (chatForm) {
chatForm.addEventListener("submit", async function (event) {
event.preventDefault();

```
    const message = chatInput.value.trim();

    if (!message) {
        return;
    }

    addChatMessage(message, "user");

    chatInput.value = "";

    const thinkingMessage = addChatMessage(
        "FitBuddy is thinking...",
        "bot"
    );

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

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Chat request failed."
            );
        }

        thinkingMessage.textContent =
            result.text ||
            "Sorry, I could not generate a response.";

    } catch (error) {
        console.error("Chat error:", error);

        thinkingMessage.textContent =
            "Sorry, FitBuddy is temporarily unavailable. Please try again.";
    }
});
```

}

// ===============================
// ADD CHAT MESSAGE
// ===============================

function addChatMessage(message, type) {
const div = document.createElement("div");

```
div.className =
    type === "user"
        ? "user-message"
        : "bot-message";

div.textContent = message;

chatMessages.appendChild(div);

chatMessages.scrollTop = chatMessages.scrollHeight;

return div;
```

}
