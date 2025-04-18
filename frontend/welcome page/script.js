function handleSignup(event) {
  event.preventDefault(); // Prevent the form from submitting normally

  const fullname = document.getElementById("fullname").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm_password").value;

  if (!fullname || !email || !phone || !password || !confirmPassword) {
    alert("Please fill in all fields.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  // Send data to backend
  fetch('http://localhost:8000/students/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullname,
      email,
      phone,
      password
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Redirect to courses page on successful signup
      window.location.href = "../courses/courses.html";
    } else {
      alert(data.message || "Signup failed. Please try again.");
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert("An error occurred. Please try again.");
  });
}
