// public/app.js

// Global variables to store location data
let userLocation = "";
let userLatitude = "";
let userLongitude = "";

// Event listener for the "Get My Location" button
document.getElementById("getLocation").addEventListener("click", function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

function successCallback(position) {
  userLatitude = position.coords.latitude;
  userLongitude = position.coords.longitude;
  // Format location string for display
  userLocation = `Lat: ${userLatitude.toFixed(5)}, Lon: ${userLongitude.toFixed(5)}`;
  document.getElementById("location").value = userLocation;
}

function errorCallback(error) {
  console.error("Error retrieving location:", error);
  alert("Unable to retrieve your location. Please enter it manually if needed.");
}

// Handle form submission
document.getElementById("healthForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent default form submission

  const submitBtn = document.getElementById("submitBtn");
  // Set button to loading state: disable and show spinner + "Loading..."
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Loading...';

  // Collect input values from the form fields
  const symptoms = document.getElementById("symptoms").value;
  const conditions = document.getElementById("conditions").value;
  const history = document.getElementById("history").value;
  const details = document.getElementById("details").value;
  const otherDetails = document.getElementById("otherDetails").value;
  const location = userLocation || document.getElementById("location").value || "Not provided";

  // Send the collected data to the /analyze endpoint
  fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symptoms,
      conditions,
      history,
      details,
      otherDetails,
      location,
      latitude: userLatitude,
      longitude: userLongitude,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      const aiResults = document.getElementById("aiResults");

      if (data.success && data.data) {
        const {
          weather_statement,
          heart_rate_assessment,
          outdoor_exercises,
          outdoor_foods,
          potential_diseases,
          nearby_gyms,
          medicine_stores,
          food_stores,
        } = data.data;

        let htmlOutput = `<h2>AI Output</h2>`;

        if (weather_statement) {
          htmlOutput += `<div class="section">
            <p class="weather-statement"><em>${weather_statement}</em></p>
          </div>`;
        }

        if (heart_rate_assessment) {
          htmlOutput += `<div class="section">
            <p class="heart-rate-assessment"><strong>Heart Rate Assessment:</strong> ${heart_rate_assessment}</p>
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

        if (nearby_gyms && nearby_gyms.length > 0) {
          htmlOutput += `<div class="section">
            <h3>Nearby Gyms</h3>
            <ul>
              ${nearby_gyms.map(gym => `<li><strong>${gym.name}</strong>: <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(gym.address)}&travelmode=bicycling" target="_blank">${gym.address}</a></li>`).join("")}
            </ul>
          </div>`;
        }

        if (medicine_stores && medicine_stores.length > 0) {
          htmlOutput += `<div class="section">
            <h3>Medicine Stores</h3>
            <ul>
              ${medicine_stores.map(store => `<li><strong>${store.name}</strong>: <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}&travelmode=bicycling" target="_blank">${store.address}</a></li>`).join("")}
            </ul>
          </div>`;
        }

        if (food_stores && food_stores.length > 0) {
          htmlOutput += `<div class="section">
            <h3>Food Stores</h3>
            <ul>
              ${food_stores.map(store => `<li><strong>${store.name}</strong>: <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}&travelmode=bicycling" target="_blank">${store.address}</a></li>`).join("")}
            </ul>
          </div>`;
        }

        aiResults.innerHTML = htmlOutput;
      } else if (data.rawResponse) {
        aiResults.innerHTML = `
          <h2>AI Output (Raw)</h2>
          <pre>${data.rawResponse}</pre>
          <p style="color: red;">Error: ${data.error}</p>
        `;
      } else if (data.error) {
        alert("Error: " + data.error);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred while processing your request.");
    })
    .finally(() => {
      // Re-enable the submit button and reset its text
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit';
    });
});

// Function to update the heart rate display by polling the /heartrate endpoint
function updateHeartRate() {
  fetch("/heartrate")
    .then((response) => response.json())
    .then((data) => {
      const bpmDisplay = document.getElementById("bpmDisplay");
      if (data.bpm <= 0) {
        bpmDisplay.textContent = "Measuring heart rate...";
      } else {
        bpmDisplay.textContent = `${data.bpm} BPM`;
      }
    })
    .catch((err) => console.error("Error fetching heart rate:", err));
}

// Poll the heart rate every 2 seconds
setInterval(updateHeartRate, 2000);
