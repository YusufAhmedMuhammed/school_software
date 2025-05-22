import React from 'react';
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
                    return <Navigate to="/login" replace />;
            }
        }
        
        return children;
    } catch (error) {
        // If there's an error parsing user data, clear storage and redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
};

export default ProtectedRoute; 