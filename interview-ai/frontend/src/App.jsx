import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import LiveInterviewPage from './pages/LiveInterviewPage';
import ReportPage from './pages/ReportPage';
import ProfilePage from './pages/ProfilePage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <InterviewProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview-setup"
              element={
                <ProtectedRoute>
                  <InterviewSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:sessionId"
              element={
                <ProtectedRoute>
                  <LiveInterviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:sessionId"
              element={
                <ProtectedRoute>
                  <ReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume-analyzer"
              element={
                <ProtectedRoute>
                  <ResumeAnalyzerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </InterviewProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
