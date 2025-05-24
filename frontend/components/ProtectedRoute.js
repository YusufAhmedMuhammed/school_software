import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // If no user data or token, redirect to login
    if (!userStr || !token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    try {
        const user = JSON.parse(userStr);
        
        // Check if user's role is allowed
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            // Redirect to appropriate dashboard based on role
            switch (user.role) {
                case 'student':
                    return <Navigate to="/student-dashboard" replace />;
                case 'teacher':
                    return <Navigate to="/teacher-portal" replace />;
                case 'admin':
                    return <Navigate to="/admin" replace />;
                default:
                    // If role is invalid, clear storage and redirect to login
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    return <Navigate to="/login" state={{ from: location }} replace />;
            }
        }
        
        // Add token to all API requests
        useEffect(() => {
            const originalFetch = window.fetch;
            window.fetch = function(url, options = {}) {
                if (url.startsWith('/api/')) {
                    options.headers = {
                        ...options.headers,
                        'Authorization': `Bearer ${token}`
                    };
                }
                return originalFetch(url, options);
            };
            
            return () => {
                window.fetch = originalFetch;
            };
        }, [token]);
        
        return children;
    } catch (error) {
        // If there's an error parsing user data, clear storage and redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
};

export default ProtectedRoute; 