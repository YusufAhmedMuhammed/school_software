// Select the buttons
const editProfileButton = document.querySelector(".edit-profile");
const logoutButton = document.querySelector(".logout");

// Edit Profile Button functionality
editProfileButton.addEventListener("click", function () {
  // Placeholder for future functionality (like opening a modal or navigating to the Edit Profile page)
  alert("You can edit your profile here.");
});

// Logout Button functionality
logoutButton.addEventListener("click", function () {
  // Placeholder for logging out the user, you can clear session storage or redirect to login page
  alert("You have been logged out.");
  window.location.href = "login.html"; // Redirect to login page (adjust the path accordingly)
});
const imageUpload = document.getElementById("image-upload");
const profileImage = document.getElementById("profile-image");

imageUpload.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      profileImage.src = e.target.result; // Set the uploaded image as the src
    };
    reader.readAsDataURL(file);
  }
});
