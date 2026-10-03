const form = document.getElementById("fitnessForm");
const results = document.getElementById("results");
const output = document.getElementById("planOutput");
const loading = document.getElementById("loading");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(
    new FormData(form).entries()
  );

  results.classList.remove("hidden");
  loading.classList.remove("hidden");
  output.textContent = "";

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

    const responseText = await response.text();

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(
        "The server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        result.error || "Unable to generate the plan."
      );
    }

    output.textContent = result.text;

  } catch (error) {

    output.textContent =
      "Unable to generate the plan.\n\n" +
      error.message;

  } finally {

    loading.classList.add("hidden");

  }
});


const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

chatForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const message = chatInput.value.trim();

  if (!message) return;

  const user = document.createElement("div");

  user.className = "user-message";
  user.textContent = message;

  chatMessages.appendChild(user);

  chatInput.value = "";

  const bot = document.createElement("div");

  bot.className = "bot-message";
  bot.textContent = "Thinking...";

  chatMessages.appendChild(bot);

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

    const responseText = await response.text();

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(
        "The server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        result.error || "Unable to answer right now."
      );
    }

    bot.textContent = result.text;

  } catch (error) {

    bot.textContent =
      "Sorry, I couldn't answer that. " +
      error.message;

  }

});
