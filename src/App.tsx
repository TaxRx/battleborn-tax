import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, BrowserRouter as Router } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useProfileStore } from './store/profileStore';
import { useUIStore } from './store/uiStore';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import InfoForm from './components/InfoForm';
import TaxResults from './components/TaxResults';
import SettingsPage from './components/SettingsPage';
import DocumentsPage from './components/DocumentsPage';
import AugustaRuleWizard from './components/AugustaRuleWizard';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import LeadsPage from './pages/LeadsPage';
import TaxCalculator from './components/TaxCalculator.tsx';
import AccountPage from './components/AccountPage';
import HireChildrenCalculator from './components/HireChildrenCalculator';
import CostSegregationCalculator from './components/CostSegregationCalculator';
import { useTaxStore } from './store/taxStore';
import Solutions from './pages/Solutions';
import { UserProvider, useUser } from './context/UserContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminDashboard from './modules/admin/pages/AdminDashboard';
import AdvisorDashboard from './components/AdvisorDashboard';
import ClientDashboard from './components/ClientDashboard';
import HomePage from './components/HomePage';
import { useUserStore } from './store/userStore';

import ClientList from './components/AdvisorDashboard/ClientList';
import GroupList from './components/AdvisorDashboard/GroupList';
import StrategiesAdminPage from './components/StrategiesAdminPage';
import useAuthStore from './store/authStore';
import RnDAdminDashboard from './features/rd-wizard/src/pages/admin/Dashboard';
import RnDClientManagement from './features/rd-wizard/src/pages/admin/ClientManagement';
import { Toaster } from 'react-hot-toast';
import RDTaxWizard from './modules/tax-calculator/components/RDTaxWizard/RDTaxWizard';
import UnifiedClientDashboard from './components/UnifiedClientDashboard';
import RDClientManagement from './components/RDClientManagement';
import ErrorBoundary from './modules/shared/components/ErrorBoundary';

const defaultTaxInfo = {
  standardDeduction: true,
  businessOwner: false,
  fullName: '',
  email: '',
  filingStatus: 'single',
  dependents: 0,
  homeAddress: '',
  state: 'CA',
  wagesIncome: 0,
  passiveIncome: 0,
  unearnedIncome: 0,
  capitalGains: 0,
  customDeduction: 0,
};

function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-xl font-bold mb-4">Failed to load your profile.</h2>
      <button className="mb-2 px-4 py-2 bg-blue-600 text-white rounded" onClick={onRetry}>Retry</button>
      <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => supabase.auth.signOut()}>Log out</button>
    </div>
  );
}

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useUser();
  const { isAuthenticated, demoMode } = useAuthStore();
  console.log("Inside Protected Route",user, isAuthenticated, demoMode);
  // Skip loading for demo mode
  if (loading && !demoMode) {
    return <div>Loading...</div>;
  }

  // Allow access if user is authenticated via Supabase OR in demo mode
  if (!user && !isAuthenticated && !demoMode) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const AppRoutes = ({ profile }: { profile: any }) => {
  // Robust role extraction
  const role = profile?.email === 'admin@taxrxgroup.com' ? 'admin' :
    profile?.role ||
    profile?.raw_user_meta_data?.role ||
    profile?.user_metadata?.role ||
    profile?.user_role;
  console.log('AppRoutes profile:', profile, 'role:', role);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}>
        <Route path="clients" element={<ProtectedRoute><UserProvider><UnifiedClientDashboard /></UserProvider></ProtectedRoute>} />
        <Route path="rd-clients" element={<ProtectedRoute><UserProvider><RDClientManagement /></UserProvider></ProtectedRoute>} />
        <Route path="advisors" element={<div>Advisor Management (coming soon)</div>} />
        <Route path="groups" element={<GroupList />} />
        <Route path="documents" element={<div>Document Management (coming soon)</div>} />
        <Route path="notifications" element={<div>Notifications (coming soon)</div>} />
        <Route path="audit" element={<div>Audit Log (coming soon)</div>} />
        <Route path="charitable-donations" element={<div>Charitable Donations (coming soon)</div>} />
        <Route path="settings" element={<div>Settings (coming soon)</div>} />
        <Route path="strategies" element={<ProtectedRoute><StrategiesAdminPage /></ProtectedRoute>} />
        <Route path="strategies/rd-wizard" element={<ProtectedRoute><UserProvider><RDTaxWizard onClose={() => { window.history.back(); }} /></UserProvider></ProtectedRoute>} />
        <Route path="rd-tax-credit" element={<ProtectedRoute><UserProvider><RnDAdminDashboard /></UserProvider></ProtectedRoute>} />
      </Route>
      <Route
        path="/advisor"
        element={
          <ProtectedRoute>
            <AdvisorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            {role === 'admin' ? <Navigate to="/admin" /> : <Dashboard />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {role === 'admin' ? <Navigate to="/admin" /> : <Dashboard />}
          </ProtectedRoute>
        }
      />
      <Route path="/tax-calculator" element={<ProtectedRoute><TaxCalculator /></ProtectedRoute>} />
      <Route path="/solutions" element={<ProtectedRoute><Solutions /></ProtectedRoute>} />
      <Route path="/solutions/rd-credit" element={<ProtectedRoute><RDTaxWizard onClose={() => {}} /></ProtectedRoute>} />
      <Route path="/solutions/augusta-rule" element={<ProtectedRoute><AugustaRuleWizard onClose={() => {}} /></ProtectedRoute>} />
      <Route path="/test-research-design" element={<ProtectedRoute><UserProvider><RDTaxWizard onClose={() => {}} startStep={2} /></UserProvider></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<null | string>(null);
  const { profile, setProfile, clearProfile } = useProfileStore();
  const { isAuthenticated: localAuth, demoMode, userType } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isPublicRoute = location.pathname === '/' || location.pathname === '/login';
  const { setTaxInfo } = useTaxStore();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Force no loading state for demo mode
  const actualProfileLoading = demoMode ? false : profileLoading;

  // Auth/session check and profile fetch
  useEffect(() => {
    // Skip Supabase auth completely if in demo mode
    if (demoMode) {
      setIsAuthenticated(false); // Keep Supabase auth false in demo mode
      setProfileLoading(false);
      setProfileError(null);
      return;
    }

    const fetchProfile = async (userId: string, email?: string) => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ 
              id: userId, 
              email,
              role: email === 'admin@taxrxgroup.com' ? 'admin' : 'user',
              is_admin: email === 'admin@taxrxgroup.com',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          if (createError) throw createError;
          data = newProfile;
        } else if (error) {
          throw error;
        } else if (email === 'admin@taxrxgroup.com' && data.role !== 'admin') {
          // Update existing profile to admin if needed
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ 
              role: 'admin',
              is_admin: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();
          if (updateError) throw updateError;
          data = updatedProfile;
        }
        setProfile(data);
        useUserStore.getState().setProfile(data);
        setProfileError(null);

        // Only fetch tax profile for non-admin users
        if (email !== 'admin@taxrxgroup.com') {
          const { data: taxProfile, error: taxProfileError } = await supabase
            .from('tax_profiles')
            .select('*')
            .eq('uuid', userId)
            .single();
          if (taxProfile && !taxProfileError) {
            setTaxInfo({
              fullName: taxProfile.full_name || '',
              email: email || '',
              filingStatus: taxProfile.filing_status || 'single',
              state: taxProfile.state || 'CA',
              dependents: taxProfile.dependents || 0,
              homeAddress: taxProfile.home_address || '',
              businessOwner: !!taxProfile.business_name,
              businessName: taxProfile.business_name || '',
              businessAddress: taxProfile.business_address || '',
              entityType: taxProfile.entity_type,
              wagesIncome: taxProfile.wages_income || 0,
              passiveIncome: taxProfile.passive_income || 0,
              unearnedIncome: taxProfile.unearned_income || 0,
              capitalGains: taxProfile.capital_gains || 0,
              ordinaryK1Income: taxProfile.ordinary_k1_income || 0,
              guaranteedK1Income: taxProfile.guaranteed_k1_income || 0,
              householdIncome: taxProfile.household_income || 0,
              standardDeduction: taxProfile.standard_deduction ?? true,
              customDeduction: taxProfile.custom_deduction || 0,
              deductionLimitReached: taxProfile.deduction_limit_reached || false
            });
          } else {
            setTaxInfo(null);
          }
        } else {
          setTaxInfo(null);
        }
      } catch (err: any) {
        clearProfile();
        setProfileError(err.message || 'Unknown error');
        setTaxInfo(null); // clear tax info on error
      } finally {
        setProfileLoading(false);
      }
    };

    // Only set up Supabase auth if not in demo mode
    let subscription: any = null;
    
    if (!demoMode) {
      // Listen for auth state changes
      const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
        setIsAuthenticated(!!session);
        if (session && session.user) {
          fetchProfile(session.user.id, session.user.email);
        } else {
          clearProfile();
        }
      });
      subscription = authSubscription.data.subscription;

      // Initial check
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsAuthenticated(!!session);
        if (session && session.user) {
          fetchProfile(session.user.id, session.user.email);
        }
      });
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [setProfile, clearProfile, setTaxInfo, demoMode]);

  // UI logic - check both Supabase auth and demo mode
  const isUserAuthenticated = isAuthenticated || localAuth || demoMode;
  
  // Debug logging
  console.log('App state:', { 
    demoMode, 
    localAuth, 
    isAuthenticated, 
    isUserAuthenticated, 
    actualProfileLoading, 
    pathname: location.pathname 
  });
  
  if (!isUserAuthenticated) {
    if (location.pathname === '/login') {
      return (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      );
    }
    if (location.pathname === '/') {
      return (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      );
    }
    // For any other route, redirect to home
    return <Navigate to="/" replace />;
  }
  // For demo mode, skip profile loading check entirely
  if (!demoMode && actualProfileLoading) return <div className="min-h-screen flex items-center justify-center"><div>Loading profile...</div></div>;
  if (!demoMode && profileError) return <ProfileError onRetry={() => window.location.reload()} />;

  // Create demo profile for demo mode
  const effectiveProfile = demoMode ? { 
    email: userType === 'admin' ? 'admin@taxrxgroup.com' : 'demo.client@example.com',
    role: userType || 'client'
  } : profile;

  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-right" />
        <UserProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Only show Navigation on non-public routes and not on Admin routes */}
            {isUserAuthenticated && !isPublicRoute && !isAdminRoute && (
              <Navigation 
                currentView={location.pathname.substring(1) || 'dashboard'}
                onViewChange={(view) => navigate(`/${view}`)}
                isAuthenticated={isUserAuthenticated}
                onLoginClick={() => navigate('/login')}
                onLogoutClick={() => {
                  if (demoMode) {
                    const { disableDemoMode } = useAuthStore.getState();
                    disableDemoMode();
                    navigate('/');
                  } else {
                    supabase.auth.signOut();
                  }
                }}
                userType={(() => {
                  if (demoMode) return userType || 'client';
                  if (effectiveProfile?.email === 'admin@taxrxgroup.com') return 'admin';
                  return effectiveProfile?.role || 'client';
                })()}
              />
            )}
            <main className={isUserAuthenticated && !isPublicRoute ? 'ml-64' : ''}>
              <AppRoutes profile={effectiveProfile} />
            </main>
          </div>
          <ToastContainer position="top-right" autoClose={5000} />
          <DemoModeIndicator />
        </UserProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;