import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// // Use the new modular AdminDashboard
import AdminDashboard from './modules/admin/pages/AdminDashboard';
import { UserProvider } from './context/UserContext';
import useAuthStore from './store/authStore';
import ClientRegistration from './pages/ClientRegistration';
import LandingPage from './pages/LandingPage';
import EmailVerification from './pages/EmailVerification';
import AcceptInvitation from './pages/AcceptInvitation';
import LoginPage from './pages/LoginPage';
import ClientDashboard from './components/ClientDashboard';

const BattleBornApp: React.FC = () => {
  const location = useLocation();
  const { demoMode, isAuthenticated: demoAuth, enableDemoMode } = useAuthStore();

  // // Check authentication
  const isAuthenticated = demoMode || demoAuth;

  // // Public routes
  const isPublicRoute = ['/', '/login', '/signup', '/register', '/verify-email', '/accept-invitation'].includes(location.pathname);
  
  
  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }



  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/login" 
            element={<LoginPage />} 
          />
          <Route path="/register" element={<ClientRegistration />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />

          {/* Protected Routes */}
          {isAuthenticated && (
            <>
              {/* Admin Routes */}
              <Route 
                path="/admin/*" 
                element={<AdminDashboard />} 
              />

              {/* Client Routes */}
              <Route 
                path="/client" 
                element={<ClientDashboard />} 
              />

              {/* Default redirects */}
              <Route 
                path="/dashboard" 
                element={<Navigate to="/admin" replace />} 
              />
            </>
          )}

          {/* Catch-all redirect */}
          <Route 
            path="*" 
            element={
              isAuthenticated ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>

        {/* Global Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </UserProvider>
  );
};

export default BattleBornApp; 