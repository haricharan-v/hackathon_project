// app.js (Server Code)
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const OpenAI = require("openai");

// Use updated SerialPort API
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

// Replace with your actual Arduino port path (e.g., "COM5")
const arduinoPortPath = "COM5";

// Create a new SerialPort instance
const port = new SerialPort({
  path: arduinoPortPath,
  baudRate: 9600,
});

// Create a parser that splits data on newline characters
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

// Global variable to store the latest BPM received from the Arduino
let latestBPM = 0;

// Listen for data from the Arduino
parser.on("data", (data) => {
  const bpm = parseInt(data, 10);
  if (!isNaN(bpm)) {
    latestBPM = bpm;
    console.log("Received BPM from Arduino:", latestBPM);
  }
});

// Initialize the OpenAI client with your API key from .env
const openAIClient = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const app = express();
const PORT = process.env.PORT || 3000;

// Hardcode a "current weather" string for your demo
const weatherNow = "Cloudy with sunny breaks around 10°C, feels like 7°C";

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// POST endpoint to process form submission and call OpenAI API
app.post("/analyze", async (req, res) => {
  const { symptoms, conditions, history, details, otherDetails, location } = req.body;

  // Build a prompt that includes the heart rate reading along with other patient details
  const prompt = `Patient Details:
Symptoms: ${symptoms}
Conditions: ${conditions}
Medical History: ${history}
Age/Weight/Other Details: ${details}
Other Important Details: ${otherDetails}
Heart Rate: ${latestBPM} BPM.
Location: ${location}
Weather: ${weatherNow}

Based on the above information, provide your response in JSON with five keys:
- "weather_statement": a sentence that starts with "Since the weather outside currently is ..." describing the weather and leading into the recommendations.
- "heart_rate_assessment": a brief statement assessing the heart rate (for example, if it's above a typical resting value, mention that it is high).
- "outdoor_exercises": an array where each item is an object with "name" (the exercise) and "explanation" (why it's beneficial).
- "outdoor_foods": an array where each item is an object with "name" (the food) and "explanation" (why it's beneficial).
- "potential_diseases": an array where each item is an object with "name" (the potential disease) and "explanation" (why it might be a concern).

Return ONLY valid JSON in this exact structure with no extra keys or text.`;

  try {
    // Call the OpenAI API with a system message to enforce the JSON structure
    const completion = await openAIClient.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            `You are a medical advisor AI that provides personalized health advice.
Return ONLY valid JSON in this exact structure:
{
  "weather_statement": "A sentence explaining the current weather and leading into the recommendations",
  "heart_rate_assessment": "A brief assessment of the patient's heart rate",
  "outdoor_exercises": [ { "name": "exercise name", "explanation": "explanation text" }, ... ],
  "outdoor_foods": [ { "name": "food name", "explanation": "explanation text" }, ... ],
  "potential_diseases": [ { "name": "disease name", "explanation": "explanation text" }, ... ]
}
Do not include any extra text or keys outside the JSON.`
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
    });

    // Extract the AI's reply (should be valid JSON)
    const aiResponse = completion.choices[0].message.content.trim();

    // Attempt to parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch (err) {
      console.error("Failed to parse AI response as JSON:", aiResponse);
      return res.status(200).json({
        success: false,
        rawResponse: aiResponse,
        error: "AI returned invalid JSON. Check server logs."
      });
    }

    // Send parsed JSON to the client
    res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Failed to process your request." });
  }
});

// GET endpoint to return the current heart rate (BPM) from the Arduino
app.get("/heartrate", (req, res) => {
  res.json({ bpm: latestBPM });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
