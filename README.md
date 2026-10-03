# FitBuddy - AI Fitness Plan Generator

FitBuddy is an AI-powered fitness plan generator that uses Google Gemini AI to create personalized 7-day fitness plans based on the user's goals, fitness level, schedule, and available equipment.

## Features

- AI-powered fitness plan generation
- Personalized 7-day workout plans
- Workout recommendations based on fitness level
- Equipment-based workout planning
- Simple and user-friendly interface
- Gemini AI integration
- Fitness questions and AI responses
- Beginner-friendly fitness guidance

## Technologies Used

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- Google Gemini AI

## Project Structure

```text
FitBuddy/
├── index.html
├── style.css
├── script.js
├── server.js
├── package.json
└── package-lock.json
```

## How to Run

### 1. Clone the repository

```bash
git clone https://github.com/abubakkarsiddiq19092006/fitbuddy-ai.git
```

### 2. Open the project folder

```bash
cd fitbuddy-ai
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure the Gemini API key

Create a file named `server/.env`.

Add:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

**Important:** Never upload the `.env` file or your Gemini API key to GitHub.

### 5. Start the server

```bash
cd server
node server.js
```

The application will run at:

```text
http://localhost:3000
```

## Usage

1. Open FitBuddy in your browser.
2. Click **Create Plan**.
3. Enter your fitness information.
4. Select your fitness goal and fitness level.
5. Select your workout days and available equipment.
6. Generate your personalized AI fitness plan.

## AI Features

FitBuddy uses Google Gemini AI to:

- Generate personalized fitness plans
- Recommend exercises
- Provide workout schedules
- Answer general fitness questions
- Provide beginner-friendly guidance

## Safety

FitBuddy provides general educational fitness guidance and is not a substitute for a doctor or certified fitness professional.

If you have an injury, medical condition, severe pain, pregnancy, or another health concern, consult an appropriate healthcare professional.

## Author

Abubakkar Siddiq

## License

This project was created as a college project.
