// School Software System API utilities
const api = {
  /**
   * Makes an API request to the backend
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request body data
   * @param {boolean} requiresAuth - Whether this request requires authentication
   * @returns {Promise} - Promise resolving to API response
   */
  request: async function(endpoint, method = 'GET', data = null, requiresAuth = true) {
    const url = `${config.apiBaseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if required
    if (requiresAuth) {
      const token = localStorage.getItem(config.auth.tokenKey);
      if (!token) {
        // Redirect to login if token not found
        window.location.href = config.routes.login;
        return;
      }
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers,
      credentials: 'include'
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      
      // Handle unauthorized access
      if (response.status === 401) {
        localStorage.removeItem(config.auth.tokenKey);
        localStorage.removeItem(config.auth.userKey);
        window.location.href = config.routes.login;
        return;
      }
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.detail || 'An error occurred');
      }
      
      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  
  // Auth methods
  auth: {
    login: async function(username, password) {
      return api.request(
        config.apiEndpoints.login, 
        'POST', 
        { username, password },
        false
      );
    },
    
    signup: async function(userData) {
      return api.request(
        config.apiEndpoints.signup, 
        'POST', 
        userData,
        false
      );
    },
    
    forgotPassword: async function(email) {
      return api.request(
        config.apiEndpoints.forgotPassword, 
        'POST', 
        { email },
        false
      );
    },
    
    logout: function() {
      localStorage.removeItem(config.auth.tokenKey);
      localStorage.removeItem(config.auth.userKey);
      window.location.href = config.routes.login;
    }
  },
  
  // Helper to determine user type and redirect accordingly
  redirectToUserDashboard: function(userData) {
    localStorage.setItem(config.auth.userKey, JSON.stringify(userData));
    
    // Redirect based on user type
    if (userData.role === 'student') {
      window.location.href = config.routes.studentDashboard;
    } else if (userData.role === 'teacher') {
      window.location.href = config.routes.teacherPortal;
    } else if (userData.role === 'admin') {
      window.location.href = config.routes.admin;
    } else {
      // Default redirect
      window.location.href = config.routes.welcome;
    }
  }
};

// Don't allow api to be modified
Object.freeze(api);
Object.freeze(api.auth);

// Export API utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} 