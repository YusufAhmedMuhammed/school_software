document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  const token = localStorage.getItem(config.auth.tokenKey);
  const userData = localStorage.getItem(config.auth.userKey);
  
  if (token && userData) {
    // User is already logged in, redirect to appropriate dashboard
    try {
      const user = JSON.parse(userData);
      api.redirectToUserDashboard(user);
      return; // Stop execution of the rest of the function
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Clear invalid data
      localStorage.removeItem(config.auth.tokenKey);
      localStorage.removeItem(config.auth.userKey);
    }
  }

  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username_or_email');
  const passwordInput = document.getElementById('password');
  const loginButton = document.getElementById('login-button');
  const loginSpinner = document.getElementById('login-spinner');
  const errorMessage = document.getElementById('error-message');
  const rememberMe = document.getElementById('remember-me');

  // Form submission event handler
  loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Clear previous error messages
    errorMessage.textContent = '';
    errorMessage.classList.remove('visible');
    
    // Get input values
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Basic validation
    if (!username || !password) {
      displayError('Please enter both username/email and password');
      return;
    }
    
    // Show loading state
    loginButton.disabled = true;
    loginSpinner.classList.remove('hidden');
    
    try {
      // Attempt to login
      const response = await api.auth.login(username, password);
      
      // Store token
      if (response.access_token) {
        localStorage.setItem(config.auth.tokenKey, response.access_token);
        
        // If remember me is checked, set token expiration to 30 days
        // Otherwise, it will be a session token
        if (rememberMe.checked) {
          // You might need additional server-side logic for this
          // This is just client-side indication
          localStorage.setItem('token_expiry', Date.now() + (30 * 24 * 60 * 60 * 1000));
        }
        
        // Redirect to appropriate dashboard
        api.redirectToUserDashboard(response.user);
      } else {
        displayError('Login failed: Invalid response from server');
      }
    } catch (error) {
      displayError(error.message || 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      // Hide loading state
      loginButton.disabled = false;
      loginSpinner.classList.add('hidden');
    }
  });
  
  // Helper function to display error messages
  function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
    // Shake animation for error feedback
    loginForm.classList.add('shake');
    setTimeout(() => {
      loginForm.classList.remove('shake');
    }, 500);
  }
});
