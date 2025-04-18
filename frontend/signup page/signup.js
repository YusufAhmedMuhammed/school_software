document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const usernameInput = document.getElementById("username_or_email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm_password");
  const fullnameInput = document.getElementById("fullname");
  const phoneInput = document.getElementById("phone");

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form from submitting normally

    // Get values of inputs
    const username = usernameInput ? usernameInput.value.trim() : ""; //
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput
      ? confirmPasswordInput.value.trim()
      : "";
    const fullname = fullnameInput ? fullnameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";

    // Validate inputs
    if (username === "" || password === "") {
      alert("Please fill in all required fields.");
      return;
    }

    // Signup-specific validation: Check if passwords match
    if (confirmPassword && confirmPassword !== password) {
      alert("Password and Confirm Password do not match.");
      return;
    }

    // Password length check
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    // If validation passes, proceed with form submission
    alert("Form submitted successfully!");
  });
});
