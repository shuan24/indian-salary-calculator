// Production: replace with your PythonAnywhere HTTPS origin.
// Example: https://yourusername.pythonanywhere.com
const API_BASE_URL = "https://bluekeep.pythonanywhere.com";

async function calculateSalary(payload) {
  const response = await fetch(`${API_BASE_URL}/api/v1/calculate`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The salary API returned an invalid response.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Calculation failed.");
  }
  return data;
}
