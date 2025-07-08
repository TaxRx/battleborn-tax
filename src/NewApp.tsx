import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// // Use the new modular AdminDashboard
// import AdminDashboard from './modules/admin/pages/AdminDashboard';
import { UserProvider } from './context/UserContext';
import useAuthStore from './store/authStore';

const BattleBornApp: React.FC = () => {
  const location = useLocation();
  const { demoMode, isAuthenticated: demoAuth, enableDemoMode } = useAuthStore();

  // // Check authentication
  const isAuthenticated = demoMode || demoAuth;

  // // Public routes
  const isPublicRoute = ['/', '/login', '/signup'].includes(location.pathname);
  console.log("Inside Main App",isAuthenticated, isPublicRoute);

  return ( <div>Hello BB 1234</div>)
  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  const LandingPage = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">BattleBorn Tax Services</h1>
          <p className="text-gray-600 mb-8">Welcome to the admin panel</p>
          
          <div className="space-y-4">
            <button
              onClick={() => enableDemoMode('admin')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Enter Admin Demo Mode
            </button>
            
            <button
              onClick={() => enableDemoMode('client')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Enter Client Demo Mode
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            Demo mode allows you to explore the platform without authentication
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/login" 
            element={<div className="p-8 text-center">Login Page (Coming Soon)</div>} 
          />

          {/* Protected Routes */}
          {isAuthenticated && (
            <>
              {/* Admin Routes */}
              <Route 
                path="/admin/*" 
                element={<AdminDashboard />} 
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

        {/* Demo Mode Indicator */}
        {demoMode && (
          <div className="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            <span className="font-medium">Demo Mode</span>
          </div>
        )}
      </div>
    </UserProvider>
  );
};

export default BattleBornApp; 