// Function to toggle the course details when the "Learn More" button is clicked
function toggleDetails(button) {
  // Get the course details div next to the button
  const details = button.nextElementSibling;

  // Check if the "Learn More" button was clicked
  if (button.textContent === "Learn More") {
    details.style.display = "block"; // Show the details
    button.textContent = "Show Less"; // Change the button text to "Show Less"
  } else {
    details.style.display = "none"; // Hide the details
    button.textContent = "Learn More"; // Change the button text back to "Learn More"
  }
}
