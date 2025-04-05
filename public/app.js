// public/app.js

/* =====================
   GLOBAL VARIABLES
===================== */
let userLatitude = null;
let userLongitude = null;
let userLocation = "";
let bpmChartDesktop = null;
let bpmChartMobile = null;
let bpmDataDesktop = [];
let bpmDataMobile = [];
let timeLabelsDesktop = [];
let timeLabelsMobile = [];
const maxDataPoints = 30;

/* =====================
   MOBILE TAB LOGIC
===================== */
const mobileTabs = document.querySelectorAll(".tab-btn");
const tabSections = document.querySelectorAll(".tab-section");

mobileTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Hide all tab sections
    tabSections.forEach((sec) => {
      sec.style.display = "none";
    });
    // Show the clicked section
    const targetId = btn.getAttribute("data-target");
    const targetSec = document.getElementById(targetId);
    if (targetSec) {
      targetSec.style.display = "block";
    }
  });
});

// Default: show the first mobile tab
if (tabSections.length > 0) {
  tabSections.forEach((sec) => {
    sec.style.display = "none";
  });
  document.getElementById("mobileInputTab").style.display = "block";
}

/* =====================
   GET LOCATION - DESKTOP
===================== */
const getLocationDesktop = document.getElementById("getLocationDesktop");
if (getLocationDesktop) {
  getLocationDesktop.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successCallbackDesktop, locationError);
    } else {
      alert("Geolocation not supported.");
    }
  });
}

function successCallbackDesktop(position) {
  userLatitude = position.coords.latitude;
  userLongitude = position.coords.longitude;
  userLocation = `Lat: ${userLatitude.toFixed(5)}, Lon: ${userLongitude.toFixed(5)}`;
  document.getElementById("locationDesktop").value = userLocation;
}

/* =====================
   GET LOCATION - MOBILE
===================== */
const getLocationMobile = document.getElementById("getLocation");
if (getLocationMobile) {
  getLocationMobile.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successCallbackMobile, locationError);
    } else {
      alert("Geolocation not supported.");
    }
  });
}

function successCallbackMobile(position) {
  userLatitude = position.coords.latitude;
  userLongitude = position.coords.longitude;
  userLocation = `Lat: ${userLatitude.toFixed(5)}, Lon: ${userLongitude.toFixed(5)}`;
  document.getElementById("location").value = userLocation;
}

function locationError(err) {
  console.error("Location error:", err);
  alert("Unable to retrieve location. Please enter it manually if needed.");
}

/* =====================
   FORM SUBMISSIONS
===================== */
const formDesktop = document.getElementById("healthFormDesktop");
if (formDesktop) {
  formDesktop.addEventListener("submit", (e) => {
    e.preventDefault();
    handleFormSubmit("desktop");
  });
}

const formMobile = document.getElementById("healthForm");
if (formMobile) {
  formMobile.addEventListener("submit", (e) => {
    e.preventDefault();
    handleFormSubmit("mobile");
  });
}

function handleFormSubmit(mode) {
  let symptomsVal, conditionsVal, historyVal, detailsVal, otherDetailsVal, locationVal;
  let submitBtn;

  if (mode === "desktop") {
    symptomsVal = document.getElementById("symptomsDesktop").value;
    conditionsVal = document.getElementById("conditionsDesktop").value;
    historyVal = document.getElementById("historyDesktop").value;
    detailsVal = document.getElementById("detailsDesktop").value;
    otherDetailsVal = document.getElementById("otherDetailsDesktop").value;
    locationVal = document.getElementById("locationDesktop").value || "Not provided";
    submitBtn = document.getElementById("submitBtnDesktop");
  } else {
    symptomsVal = document.getElementById("symptoms").value;
    conditionsVal = document.getElementById("conditions").value;
    historyVal = document.getElementById("history").value;
    detailsVal = document.getElementById("details").value;
    otherDetailsVal = document.getElementById("otherDetails").value;
    locationVal = document.getElementById("location").value || "Not provided";
    submitBtn = document.getElementById("submitBtn");
  }

  // Show loading spinner
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Loading...';

  fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symptoms: symptomsVal,
      conditions: conditionsVal,
      history: historyVal,
      details: detailsVal,
      otherDetails: otherDetailsVal,
      location: locationVal,
      latitude: userLatitude,
      longitude: userLongitude,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
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

        // We generate the "Results" heading only once here
        let htmlOutput = `<h2>Results</h2>`;

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

        // Outdoor Exercises
        htmlOutput += `<div class="section">
          <h3>Outdoor Exercises</h3>
          <ul>
            ${outdoor_exercises.map(ex => `<li><strong>${ex.name}</strong>: ${ex.explanation}</li>`).join("")}
          </ul>
        </div>`;

        // Outdoor Foods
        htmlOutput += `<div class="section">
          <h3>Outdoor Foods</h3>
          <ul>
            ${outdoor_foods.map(food => `<li><strong>${food.name}</strong>: ${food.explanation}</li>`).join("")}
          </ul>
        </div>`;

        // Potential Diseases
        htmlOutput += `<div class="section">
          <h3>Potential Diseases</h3>
          <ul>
            ${potential_diseases.map(dis => `<li><strong>${dis.name}</strong>: ${dis.explanation}</li>`).join("")}
          </ul>
        </div>`;

        // Nearby Gyms
        if (nearby_gyms && nearby_gyms.length > 0) {
          htmlOutput += `<div class="section">
            <h3>Nearby Gyms</h3>
            <ul>
              ${nearby_gyms.map(gym => `<li><strong>${gym.name}</strong>: <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(gym.address)}&travelmode=bicycling" target="_blank">${gym.address}</a></li>`).join("")}
            </ul>
          </div>`;
        }

        // Medicine Stores
        if (medicine_stores && medicine_stores.length > 0) {
          htmlOutput += `<div class="section">
            <h3>Medicine Stores</h3>
            <ul>
              ${medicine_stores.map(store => `<li><strong>${store.name}</strong>: <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}&travelmode=bicycling" target="_blank">${store.address}</a></li>`).join("")}
            </ul>
          </div>`;
        }

        // Food Stores
        if (food_stores && food_stores.length > 0) {
          htmlOutput += `<div class="section">
            <h3>Food Stores</h3>
            <ul>
              ${food_stores.map(store => `<li><strong>${store.name}</strong>: <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}&travelmode=bicycling" target="_blank">${store.address}</a></li>`).join("")}
            </ul>
          </div>`;
        }

        // Render results in the correct place
        if (mode === "desktop") {
          document.getElementById("aiResultsContent").innerHTML = htmlOutput;
        } else {
          document.getElementById("mobileAiResults").innerHTML = htmlOutput;
        }

      } else if (data.rawResponse) {
        const errorHtml = `
          <h2>Results (Raw)</h2>
          <pre>${data.rawResponse}</pre>
          <p style="color: red;">Error: ${data.error}</p>
        `;
        if (mode === "desktop") {
          document.getElementById("aiResultsContent").innerHTML = errorHtml;
        } else {
          document.getElementById("mobileAiResults").innerHTML = errorHtml;
        }
      } else if (data.error) {
        alert("Error: " + data.error);
      }
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("An error occurred while processing your request.");
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Submit";
    });
}

/* =====================
   HEART RATE POLLING
===================== */
function pollHeartRate() {
  fetch("/heartrate")
    .then((res) => res.json())
    .then((data) => {
      // Desktop BPM
      const bpmDesktop = document.getElementById("bpmDisplayDesktop");
      if (bpmDesktop) {
        if (data.bpm <= 0) {
          bpmDesktop.textContent = "Measuring heart rate...";
        } else {
          bpmDesktop.textContent = `${data.bpm} BPM`;
          // Desktop chart
          const now = new Date();
          const timeLabel = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
          bpmDataDesktop.push(data.bpm);
          timeLabelsDesktop.push(timeLabel);
          if (bpmDataDesktop.length > maxDataPoints) {
            bpmDataDesktop.shift();
            timeLabelsDesktop.shift();
          }
          if (bpmChartDesktop) bpmChartDesktop.update();
        }
      }

      // Mobile BPM
      const bpmMobile = document.getElementById("bpmDisplayMobile");
      if (bpmMobile) {
        if (data.bpm <= 0) {
          bpmMobile.textContent = "Measuring heart rate...";
        } else {
          bpmMobile.textContent = `${data.bpm} BPM`;
          // Mobile chart
          const now = new Date();
          const timeLabel = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
          bpmDataMobile.push(data.bpm);
          timeLabelsMobile.push(timeLabel);
          if (bpmDataMobile.length > maxDataPoints) {
            bpmDataMobile.shift();
            timeLabelsMobile.shift();
          }
          if (bpmChartMobile) bpmChartMobile.update();
        }
      }
    })
    .catch((err) => console.error("Heart rate error:", err));
}

// Poll every 2 seconds
setInterval(pollHeartRate, 2000);

/* =====================
   CHART INITIALIZATION
===================== */
window.addEventListener("DOMContentLoaded", () => {
  // Desktop chart
  const ctxDesktop = document.getElementById("bpmChartDesktop");
  if (ctxDesktop) {
    bpmChartDesktop = new Chart(ctxDesktop, {
      type: "line",
      data: {
        labels: timeLabelsDesktop,
        datasets: [{
          label: "Heart Rate (BPM)",
          data: bpmDataDesktop,
          borderColor: "#ff4d4d",
          backgroundColor: "rgba(255, 77, 77, 0.2)",
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "#ff4d4d",
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        scales: {
          x: {
            ticks: { color: "#ddd" },
            grid: { color: "rgba(255,255,255,0.1)" }
          },
          y: {
            ticks: { color: "#ddd" },
            grid: { color: "rgba(255,255,255,0.1)" }
          }
        },
        plugins: {
          legend: {
            labels: { color: "#ddd" }
          }
        }
      }
    });
  }

  // Mobile chart
  const ctxMobile = document.getElementById("bpmChartMobile");
  if (ctxMobile) {
    bpmChartMobile = new Chart(ctxMobile, {
      type: "line",
      data: {
        labels: timeLabelsMobile,
        datasets: [{
          label: "Heart Rate (BPM)",
          data: bpmDataMobile,
          borderColor: "#ff4d4d",
          backgroundColor: "rgba(255, 77, 77, 0.2)",
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "#ff4d4d",
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        scales: {
          x: {
            ticks: { color: "#ddd" },
            grid: { color: "rgba(255,255,255,0.1)" }
          },
          y: {
            ticks: { color: "#ddd" },
            grid: { color: "rgba(255,255,255,0.1)" }
          }
        },
        plugins: {
          legend: {
            labels: { color: "#ddd" }
          }
        }
      }
    });
  }
});
