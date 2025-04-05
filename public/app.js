// public/app.js

// Global variable to store location data
let userLocation = "";

// Add event listener for the "Get My Location" button
document.getElementById("getLocation").addEventListener("click", function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

function successCallback(position) {
  const latitude = position.coords.latitude.toFixed(5);
  const longitude = position.coords.longitude.toFixed(5);
  userLocation = `Lat: ${latitude}, Lon: ${longitude}`;
  document.getElementById("location").value = userLocation;
}

function errorCallback(error) {
  console.error("Error retrieving location: ", error);
  alert("Unable to retrieve your location. Please enter it manually if needed.");
}

// Handle form submission
document.getElementById("healthForm").addEventListener("submit", function(event) {
  event.preventDefault(); // Prevent the default form submission

  // Collect input values from the form fields
  const symptoms = document.getElementById("symptoms").value;
  const conditions = document.getElementById("conditions").value;
  const history = document.getElementById("history").value;
  const details = document.getElementById("details").value;
  const otherDetails = document.getElementById("otherDetails").value;
  // Use the captured location or an empty string if not set
  const location = userLocation || document.getElementById("location").value || "Not provided";

  // Send the collected data to the /analyze endpoint via a POST request
  fetch("/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ symptoms, conditions, history, details, otherDetails, location })
  })
  .then(response => response.json())
  .then(data => {
    const aiResults = document.getElementById("aiResults");

    if (data.success && data.data) {
      // Extract arrays and weather_statement from the parsed JSON
      const { weather_statement, outdoor_exercises, outdoor_foods, potential_diseases } = data.data;

      // Build HTML output with the weather statement and explanation for each recommendation
      let htmlOutput = `<h2>AI Output</h2>`;

      if (weather_statement) {
        htmlOutput += `<div class="section">
          <p class="weather-statement"><em>${weather_statement}</em></p>
        </div>`;
      }

      htmlOutput += `<div class="section">
        <h3>Outdoor Exercises</h3>
        <ul>
          ${outdoor_exercises.map(ex => `<li><strong>${ex.name}</strong>: ${ex.explanation}</li>`).join("")}
        </ul>
      </div>`;

      htmlOutput += `<div class="section">
        <h3>Outdoor Foods</h3>
        <ul>
          ${outdoor_foods.map(food => `<li><strong>${food.name}</strong>: ${food.explanation}</li>`).join("")}
        </ul>
      </div>`;

      htmlOutput += `<div class="section">
        <h3>Potential Diseases</h3>
        <ul>
          ${potential_diseases.map(dis => `<li><strong>${dis.name}</strong>: ${dis.explanation}</li>`).join("")}
        </ul>
      </div>`;

      aiResults.innerHTML = htmlOutput;
    } else if (data.rawResponse) {
      // If AI didn't return valid JSON, show raw text
      aiResults.innerHTML = `
        <h2>AI Output (Raw)</h2>
        <pre>${data.rawResponse}</pre>
        <p style="color: red;">Error: ${data.error}</p>
      `;
    } else if (data.error) {
      alert("Error: " + data.error);
    }
  })
  .catch(error => {
    console.error("Error:", error);
    alert("An error occurred while processing your request.");
  });
});

// NEW: Function to update the heart rate display by polling the /heartrate endpoint
function updateHeartRate() {
  fetch("/heartrate")
    .then(response => response.json())
    .then(data => {
      document.getElementById("bpmDisplay").textContent = `${data.bpm} BPM`;
    })
    .catch(err => console.error("Error fetching heart rate:", err));
}

// Poll the heart rate every 2 seconds
setInterval(updateHeartRate, 2000);
