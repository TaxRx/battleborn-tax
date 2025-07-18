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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EnhancedClientDashboard from './components/EnhancedClientDashboard';
import PartnerDashboard from './modules/partner/pages/PartnerDashboard'; // Import the new component

const BattleBornApp: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  // // Public routes
  const isPublicRoute = ['/', '/login', '/signup', '/register', '/verify-email', '/accept-invitation', '/forgot-password', '/reset-password'].includes(location.pathname);
  
  
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          {isAuthenticated && (
            <>
              {/* Admin Routes */}
              <Route 
                path="/admin/*" 
                element={<AdminDashboard />} 
              />

              {/* Partner Routes */}
              <Route 
                path="/partner/*" 
                element={<PartnerDashboard />} 
              />

              {/* Client Routes */}
              <Route 
                path="/client" 
                element={<EnhancedClientDashboard />} 
              />

              {/* Default redirects based on user role */}
              <Route 
                path="/dashboard" 
                element={
                  // TODO: Replace with actual role-based logic from user profile
                  // const { accessLevel } = useProfileStore();
                  // if (accessLevel === 'operator') return <Navigate to="/admin" replace />;
                  // if (accessLevel === 'partner') return <Navigate to="/partner" replace />;
                  // if (accessLevel === 'client') return <Navigate to="/client" replace />;
                  <Navigate to="/admin" replace /> // Default fallback
                } 
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