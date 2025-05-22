import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login page/login';
import StudentDashboard from './student-dashboard/StudentDashboard';
import TeacherPortal from './teacher-portal/TeacherPortal';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes */}
                <Route 
                    path="/student-dashboard/*" 
                    element={
                        <ProtectedRoute allowedRoles={['student', 'admin']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="/teacher-portal/*" 
                    element={
                        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                            <TeacherPortal />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="/admin/*" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                
                {/* Redirect root to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Catch all route - redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
};

export default App; 