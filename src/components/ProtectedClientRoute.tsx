import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import useAuthStore from '../store/authStore';
import EnhancedClientDashboard from './EnhancedClientDashboard';

/**
 * Protected route component that ensures only client users can access the client dashboard.
 * Non-client users are redirected to their appropriate dashboard.
 */
const ProtectedClientRoute: React.FC = () => {
  const { user, loading } = useUser();
  const { isAuthenticated, userType } = useAuthStore();
  const location = useLocation();
  
  // Check if current URL has magic link tokens
  const hasMagicLinkTokens = () => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));
    
    const hasQueryTokens = !!(searchParams.get('token') && searchParams.get('type') === 'magiclink') || !!searchParams.get('access_token');
    const hasHashTokens = !!(hashParams.get('token') && hashParams.get('type') === 'magiclink') || !!hashParams.get('access_token');
    
    return hasQueryTokens || hasHashTokens;
  };
  
  const hasMagicLink = hasMagicLinkTokens();
  
  console.log('ProtectedClientRoute - DEBUG:', { 
    user: user ? {
      id: user.id,
      email: user.email,
      account: user.account
    } : null,
    loading,
    isAuthenticated,
    userType,
    hasMagicLink,
    url: window.location.href
  });
  
  // Show loading if user data is still being fetched OR if processing magic link
  if (loading || hasMagicLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">
            {hasMagicLink ? 'Signing you in...' : 'Loading...'}
          </p>
          {hasMagicLink && (
            <p className="mt-2 text-sm text-slate-500">Please wait while we verify your magic link</p>
          )}
        </div>
      </div>
    );
  }
  
  // If no user data and no magic link, redirect to login
  if (!user && !isAuthenticated && !hasMagicLink) {
    console.log('ProtectedClientRoute: No user data and no magic link, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Get account type from user context or auth store
  const accountType = user?.account?.type || userType;
  
  // If user is not a client type, redirect to their appropriate dashboard
  if (accountType && accountType !== 'client') {
    console.log('ProtectedClientRoute: Non-client user accessing /client, redirecting to appropriate dashboard');
    
    switch (accountType) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'operator':
        return <Navigate to="/operator" replace />;
      case 'partner':
        return <Navigate to="/partner" replace />;
      case 'affiliate':
        return <Navigate to="/affiliate" replace />;
      case 'expert':
        return <Navigate to="/expert" replace />;
      default:
        // Fallback to dashboard
        return <Navigate to="/dashboard" replace />;
    }
  }
  
  // If account type is client or unknown (legacy users), allow access to client dashboard
  console.log('ProtectedClientRoute: Client user accessing /client dashboard');
  return <EnhancedClientDashboard />;
};

export default ProtectedClientRoute;