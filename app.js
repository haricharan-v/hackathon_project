// app.js (Server Code)
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const OpenAI = require("openai");

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
  const { symptoms, conditions, history, details, otherDetails } = req.body;

  // Build a prompt incorporating the patient's details
  const prompt = `Patient Details:
Symptoms: ${symptoms}
Conditions: ${conditions}
Medical History: ${history}
Age/Weight/Other Details: ${details}
Other Important Details: ${otherDetails}

Based on the above information, provide your response in JSON with three arrays:
- "outdoor_exercises": (list of recommended exercises)
- "outdoor_foods": (list of recommended foods)
- "potential_diseases": (list of potential diseases).
No extra keys, no additional text outside the JSON.`;

  try {
    // Call the OpenAI API with a system message to strictly return JSON
    const completion = await openAIClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            `You are a medical advisor AI that provides personalized health advice. 
             Return ONLY valid JSON in this exact structure:
             {
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
      temperature: 0.9
    });

    // Extract the AI's reply (should be valid JSON)
    const aiResponse = completion.choices[0].message.content.trim();

    // Attempt to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch (err) {
      // If parsing fails, we'll just send back the raw text
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
      data: parsed
    });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Failed to process your request." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
