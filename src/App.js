import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import StudentPreferences from './pages/StudentPreferences';
import OrgPreferences from './pages/OrgPreferences';
import LogbookPage from './pages/LogbookPage';
import MatchingPage from './pages/MatchingPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</p>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'toast-custom',
            style: {
              background: '#132240',
              color: '#e8ecf4',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontFamily: "'DM Sans', sans-serif",
            },
            success: { iconTheme: { primary: '#14b8a6', secondary: '#021a17' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="preferences" element={<StudentPreferences />} />
            <Route path="org-preferences" element={<OrgPreferences />} />
            <Route path="logbook" element={<LogbookPage />} />
            <Route path="matching" element={<MatchingPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
