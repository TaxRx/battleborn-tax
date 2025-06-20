import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Modular imports
import { User } from './modules/shared/types';
import { authService } from './modules/auth/services/authService';
import { TaxCalculatorModule } from './modules/tax-calculator';
import AffiliateDashboard from './modules/affiliate/pages/AffiliateDashboard';
import AdminDashboard from './modules/admin/pages/AdminDashboard';
import ClientView from './modules/client/pages/ClientView';
import LoginPage from './modules/auth/components/LoginPage';
import LandingPage from './pages/LandingPage';

// Shared components
import LoadingSpinner from './modules/shared/components/LoadingSpinner';
import ErrorBoundary from './modules/shared/components/ErrorBoundary';

// Legacy demo mode support (temporary)
import useAuthStore from './store/authStore';

const BattleBornApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Legacy demo mode support
  const { demoMode, isAuthenticated: demoAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Skip Supabase auth in demo mode
      if (demoMode) {
        setLoading(false);
        return;
      }

      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Failed to initialize authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      setError(null);
      const { user: loggedInUser, error: loginError } = await authService.login(credentials);
      
      if (loginError) {
        setError(loginError);
        return false;
      }
      
      setUser(loggedInUser);
      return true;
    } catch (err) {
      setError('Login failed');
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Public routes
  const isPublicRoute = ['/', '/login', '/signup'].includes(location.pathname);
  
  // Check authentication
  const isAuthenticated = user !== null || demoMode;

  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/login" 
            element={
              <LoginPage 
                onLogin={handleLogin} 
                error={error}
                loading={loading}
              />
            } 
          />

          {/* Protected Routes - Role-based routing */}
          {isAuthenticated && (
            <>
              {/* Affiliate Routes */}
              {(user?.role === 'affiliate' || demoMode) && (
                <Route 
                  path="/affiliate/*" 
                  element={
                    <AffiliateDashboard 
                      user={user as any || { role: 'affiliate', id: 'demo', full_name: 'Demo Affiliate' } as any} 
                    />
                  } 
                />
              )}

              {/* Admin Routes */}
              {(user?.role === 'admin' || demoMode) && (
                <Route 
                  path="/admin/*" 
                  element={
                    <AdminDashboard 
                      user={user as any || { role: 'admin', id: 'demo', full_name: 'Demo Admin' } as any} 
                    />
                  } 
                />
              )}

              {/* Client Routes */}
              <Route 
                path="/client/:clientId" 
                element={<ClientView />} 
              />

              {/* Standalone Tax Calculator (Legacy Support) */}
              <Route 
                path="/tax-calculator" 
                element={<TaxCalculatorModule />} 
              />

              {/* Default redirects based on role */}
              <Route 
                path="/dashboard" 
                element={
                  user?.role === 'admin' ? (
                    <Navigate to="/admin" replace />
                  ) : user?.role === 'affiliate' ? (
                    <Navigate to="/affiliate" replace />
                  ) : demoMode ? (
                    <Navigate to="/tax-calculator" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />
            </>
          )}

          {/* Catch-all redirect */}
          <Route 
            path="*" 
            element={
              isAuthenticated ? (
                user?.role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : user?.role === 'affiliate' ? (
                  <Navigate to="/affiliate" replace />
                ) : (
                  <Navigate to="/tax-calculator" replace />
                )
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

        {/* User Info (for authenticated users) */}
        {user && (
          <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-3 z-40">
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.full_name}</p>
                <p className="text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default BattleBornApp; 