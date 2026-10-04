const fitnessForm = document.getElementById("fitnessForm");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const planOutput = document.getElementById("planOutput");
const errorMessage = document.getElementById("errorMessage");

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

// ===============================
// GENERATE FITNESS PLAN
// ===============================

fitnessForm.addEventListener("submit", async (event) => {
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

if (errorMessage) {
    errorMessage.classList.add("hidden");
    errorMessage.textContent = "";
}

const generateButton = document.getElementById("generateButton");

if (generateButton) {
    generateButton.disabled = true;
    generateButton.textContent = "Creating your plan...";
}

results.scrollIntoView({
    behavior: "smooth"
});

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

    if (errorMessage) {
        errorMessage.textContent =
            "Unable to generate the plan. Please try again.";
        errorMessage.classList.remove("hidden");
    } else {
        planOutput.innerHTML = `
            <div class="error-message">
                Unable to generate the plan. Please try again.
            </div>
        `;
    }

} finally {
    loading.classList.add("hidden");

    if (generateButton) {
        generateButton.disabled = false;
        generateButton.textContent = "Generate My 7-Day Plan ✦";
    }
}
```

});

// ===============================
// FORMAT AI PLAN
// ===============================

function formatPlan(text) {
if (!text) {
return "<p>No plan was returned. Please try again.</p>";
}

```
return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h2>$1</h2>")
    .replace(/^\* (.*)$/gm, "<li>$1</li>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
```

}

// ===============================
// CHAT
// ===============================

if (chatForm) {
chatForm.addEventListener("submit", async (event) => {
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
                message
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Chat request failed."
            );
        }

        thinkingMessage.textContent =
            result.text || "Sorry, I could not generate a response.";

    } catch (error) {
        console.error("Chat error:", error);

        thinkingMessage.textContent =
```
