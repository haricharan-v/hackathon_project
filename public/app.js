// public/app.js
document.getElementById("healthForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent the default form submission
  
    // Collect input values from the form fields
    const symptoms = document.getElementById("symptoms").value;
    const conditions = document.getElementById("conditions").value;
    const history = document.getElementById("history").value;
    const details = document.getElementById("details").value;
    const otherDetails = document.getElementById("otherDetails").value;
  
    // Send the collected data to the /analyze endpoint via a POST request
    fetch("/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ symptoms, conditions, history, details, otherDetails })
    })
    .then(response => response.json())
    .then(data => {
      const aiResults = document.getElementById("aiResults");
  
      if (data.success && data.data) {
        // Extract arrays from the parsed JSON
        const { outdoor_exercises, outdoor_foods, potential_diseases } = data.data;
  
        // Build HTML output with explanation for each recommendation
        let htmlOutput = `<h2>AI Output</h2>`;
  
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
