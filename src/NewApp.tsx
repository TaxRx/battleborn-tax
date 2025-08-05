import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// // Use the new modular AdminDashboard
import AdminDashboard from './modules/admin/pages/AdminDashboard';
import { UserProvider, useUser } from './context/UserContext';
import useAuthStore from './store/authStore';
import ClientRegistration from './pages/ClientRegistration';
import LandingPage from './pages/LandingPage';
import EmailVerification from './pages/EmailVerification';
import AcceptInvitation from './pages/AcceptInvitation';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedClientRoute from './components/ProtectedClientRoute';
import PartnerDashboard from './modules/partner/pages/PartnerDashboard'; // Import the new component
import OperatorDashboard from './modules/operator/pages/OperatorDashboard';
import AffiliateDashboard from './modules/affiliate/pages/NewAffiliateDashboard';
import ExpertDashboard from './modules/expert/pages/ExpertDashboard';
import MagicLinkHandler from './components/MagicLinkHandler';
import ClientPortal from './pages/ClientPortal';

// Component to handle role-based redirects
const RoleBasedRedirect: React.FC = () => {
  const { user, loading } = useUser();
  const { isAuthenticated, userType } = useAuthStore();
  const accountType = user?.account?.type;
  
  console.log('RoleBasedRedirect - DETAILED DEBUG:', { 
    accountType, 
    userType,
    user: user ? {
      id: user.id,
      email: user.email,
      profile: user.profile,
      account: user.account
    } : null,
    loading,
    isAuthenticated
  });
  
  // Show loading if user data is still being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  // If no user data, redirect to login
  if (!user && !isAuthenticated) {
    console.log('RoleBasedRedirect: No user data and not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Use accountType from user context first, fall back to userType from auth store
  const finalAccountType = accountType || userType;
  console.log('RoleBasedRedirect: Using account type:', finalAccountType);
  
  if (finalAccountType === 'operator') {
    console.log('RoleBasedRedirect: Redirecting to /operator');
    return <Navigate to="/operator" replace />;
  }
  if (finalAccountType === 'partner') {
    console.log('RoleBasedRedirect: Redirecting to /partner');
    return <Navigate to="/partner" replace />;
  }
  if (finalAccountType === 'affiliate') {
    console.log('RoleBasedRedirect: Redirecting to /affiliate');
    return <Navigate to="/affiliate" replace />;
  }
  if (finalAccountType === 'expert') {
    console.log('RoleBasedRedirect: Redirecting to /expert');
    return <Navigate to="/expert" replace />;
  }
  if (finalAccountType === 'client') {
    console.log('RoleBasedRedirect: Redirecting to /client');
    return <Navigate to="/client" replace />;
  }
  if (finalAccountType === 'admin') {
    console.log('RoleBasedRedirect: Redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }
  
  // Default fallback for any other account types or missing account type
  console.log('RoleBasedRedirect: No matching account type, redirecting to /admin as fallback');
  return <Navigate to="/admin" replace />;
};

const GalileoTaxApp: React.FC = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { user, loading } = useUser();

  // Check if current URL has magic link tokens
  const hasMagicLinkTokens = () => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));
    
    const hasQueryTokens = !!(searchParams.get('token') && searchParams.get('type') === 'magiclink') || !!searchParams.get('access_token');
    const hasHashTokens = !!(hashParams.get('token') && hashParams.get('type') === 'magiclink') || !!hashParams.get('access_token');
    
    const result = !!(hasQueryTokens || hasHashTokens);
    
    // Only log debug info if there are tokens to avoid console spam
    if (result) {
      console.log('🔍 hasMagicLinkTokens debug:', {
        search: location.search,
        hash: location.hash,
        queryToken: searchParams.get('token'),
        queryType: searchParams.get('type'),
        queryAccessToken: searchParams.get('access_token') ? 'present' : null,
        hashToken: hashParams.get('token'),
        hashType: hashParams.get('type'),
        hashAccessToken: hashParams.get('access_token') ? 'present' : null,
        hasQueryTokens,
        hasHashTokens,
        result
      });
    }
    
    return result;
  };

  // Public routes
  const isPublicRoute = ['/', '/login', '/signup', '/register', '/verify-email', '/accept-invitation', '/forgot-password', '/reset-password'].includes(location.pathname);
  
  // Allow /client route if it has magic link tokens (even if not authenticated yet)
  const allowMagicLinkRoute = location.pathname === '/client' && hasMagicLinkTokens();
  
  console.log('🚀 AppContent - Auth state:', {
    isAuthenticated,
    hasUser: !!user,
    loading,
    isPublicRoute,
    allowMagicLinkRoute,
    hasMagicLinkTokens: hasMagicLinkTokens(),
    location: location.pathname,
    search: location.search,
    hash: location.hash,
    fullUrl: window.location.href,
    willRedirect: !user && !isAuthenticated && !isPublicRoute && !allowMagicLinkRoute
  });

  // Show loading while determining authentication state
  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated and not on public route (unless processing magic link)
  if (!user && !isAuthenticated && !isPublicRoute && !allowMagicLinkRoute) {
    console.log('🚀 AppContent - Redirecting to login: no user, not authenticated, not public route');
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MagicLinkHandler>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
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
        {(user || isAuthenticated || allowMagicLinkRoute) && (
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

              {/* Operator Routes */}
              <Route 
                path="/operator/*" 
                element={<OperatorDashboard />} 
              />

              {/* Affiliate Routes */}
              <Route 
                path="/affiliate/*" 
                element={<AffiliateDashboard />} 
              />

              {/* Expert Routes */}
              <Route 
                path="/expert/*" 
                element={<ExpertDashboard />} 
              />

              {/* Client Routes */}
              <Route 
                path="/client" 
                element={<ProtectedClientRoute />} 
              />
              
              {/* Client Portal Routes with original pattern */}
              <Route 
                path="/client-portal/:businessId/:token" 
                element={<ClientPortal />} 
              />
              
              {/* Legacy client portal route for admin preview */}
              <Route 
                path="/client-portal/:clientId" 
                element={<ClientPortal />} 
              />

              {/* Default redirects based on user role */}
              <Route 
                path="/dashboard" 
                element={<RoleBasedRedirect />} 
              />
            </>
          )}

          {/* Catch-all redirect */}
          <Route 
            path="*" 
            element={
              (user || isAuthenticated || allowMagicLinkRoute) ? (
                <RoleBasedRedirect />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </MagicLinkHandler>

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
    );
};

export default GalileoTaxApp; 