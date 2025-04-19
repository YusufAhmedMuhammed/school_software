// School Software System Configuration
const config = {
  apiBaseUrl: 'http://localhost:8000', // Change to production URL in deployment
  apiEndpoints: {
    login: '/auth/login',
    signup: '/auth/signup',
    forgotPassword: '/auth/forgot-password',
    students: '/students',
    teachers: '/teachers',
    admin: '/admin',
    courses: '/courses',
    assignments: '/assignments',
    attendance: '/attendance'
  },
  auth: {
    tokenKey: 'school_software_auth_token',
    userKey: 'school_software_user'
  },
  routes: {
    login: '/login page/login.html',
    signup: '/signup page/signup.html',
    studentDashboard: '/student-dashboard/dashboard.html',
    teacherPortal: '/teacher-portal/dashboard.html',
    admin: '/admin/dashboard.html',
    courses: '/courses/courses.html',
    welcome: '/welcome page/welcome.html'
  }
};

// Don't allow config to be modified
Object.freeze(config);
Object.freeze(config.apiEndpoints);
Object.freeze(config.auth);
Object.freeze(config.routes);

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} 