require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const OpenAI = require("openai");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

// Hardcode the weather statement
const weatherNow = "Cloudy with sunny breaks around 10°C, feels like 7°C";

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

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// POST endpoint to process form submission and call OpenAI API
app.post("/analyze", async (req, res) => {
  const { symptoms, conditions, history, details, otherDetails, location } = req.body;

  // Build a prompt that includes the fixed weather statement
  const prompt = `Patient Details:
Symptoms: ${symptoms}
Conditions: ${conditions}
Medical History: ${history}
Age/Weight/Other Details: ${details}
Other Important Details: ${otherDetails}
Heart Rate: ${latestBPM} BPM.
Location: ${location}
Weather: ${weatherNow}

Based on the above information, provide your response in JSON with the following structure:
{
  "weather_statement": "A sentence explaining the current weather and leading into the recommendations",
  "heart_rate_assessment": "A brief assessment of the patient's heart rate",
  "outdoor_exercises": [ { "name": "exercise name", "explanation": "explanation text" }, ... ],
  "outdoor_foods": [ { "name": "food name", "explanation": "explanation text" }, ... ],
  "potential_diseases": [ { "name": "disease name", "explanation": "explanation text" }, ... ],
  "nearby_gyms": [ { "name": "Gym Name", "address": "Address or description" }, ... ],
  "medicine_stores": [ { "name": "Store Name", "address": "Address or description" }, ... ],
  "food_stores": [ { "name": "Store Name", "address": "Address or description" }, ... ]
}
Return ONLY valid JSON in this exact structure with no extra keys or text.`;

  try {
    const completion = await openAIClient.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a medical advisor AI that provides personalized health advice.
Return ONLY valid JSON in this exact structure:
{
  "weather_statement": "A sentence explaining the current weather and leading into the recommendations",
  "heart_rate_assessment": "A brief assessment of the patient's heart rate",
  "outdoor_exercises": [ { "name": "exercise name", "explanation": "explanation text" }, ... ],
  "outdoor_foods": [ { "name": "food name", "explanation": "explanation text" }, ... ],
  "potential_diseases": [ { "name": "disease name", "explanation": "explanation text" }, ... ],
  "nearby_gyms": [ { "name": "Gym Name", "address": "Address or description" }, ... ],
  "medicine_stores": [ { "name": "Store Name", "address": "Address or description" }, ... ],
  "food_stores": [ { "name": "Store Name", "address": "Address or description" }, ... ]
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

    // Extract and parse the AI's reply
    const aiResponse = completion.choices[0].message.content.trim();
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
