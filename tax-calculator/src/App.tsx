import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useUserStore } from './store/userStore';
import { useCalculationStore } from './lib/core/store/calculation.store';
import { useTaxStore } from './store/taxStore';
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
import { TaxInfo, TaxStrategy, SavedCalculation, User } from './types';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize stores
  const { user, fetchUserProfile, reset: resetUserStore, loading: userLoading } = useUserStore();
  const { setupRealtimeSync: setupCalculationSync, fetchCalculations } = useCalculationStore();
  const { 
    taxInfo, 
    selectedYear,
    savedCalculations,
    selectedStrategies,
    setTaxInfo,
    setSelectedYear,
    setSavedCalculations,
    setSelectedStrategies,
    saveInitialState,
    loadCalculation,
    reset: resetTaxStore
  } = useTaxStore();

  const [showAugustaWizard, setShowAugustaWizard] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      resetTaxStore();
      resetUserStore();
      setIsAuthenticated(false);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle info submission
  const handleInfoSubmit = async (data: TaxInfo, year: number) => {
    try {
      setTaxInfo(data);
      setSelectedYear(year);
      await saveInitialState(data, year);
    } catch (error) {
      console.error('Failed to handle info submission:', error);
      alert('Failed to save form data. Please try again.');
    }
  };

  // Handle strategy selection
  const handleStrategySelect = (strategies: TaxStrategy[]) => {
    setSelectedStrategies(strategies);
  };

  // Handle calculation save
  const handleSaveCalculation = (calc: SavedCalculation) => {
    setSavedCalculations([...savedCalculations, calc]);
  };

  // Handle strategy action
  const handleStrategyAction = (strategyId: string, action: string) => {
    if (action === 'get_started' && strategyId === 'augusta_rule') {
      setShowAugustaWizard(true);
    }
  };

  // Handle auth state changes
  const handleAuthStateChange = async (event: string, session: any) => {
    console.log('Auth state changed:', event, session?.user?.email);
    
    if (event === 'SIGNED_IN') {
      setIsAuthenticated(true);
      await fetchUserProfile();
    } else if (event === 'SIGNED_OUT') {
      setIsAuthenticated(false);
      resetUserStore();
      navigate('/');
    }
  };

  useEffect(() => {
    console.log('App component rendering');
    let mounted = true;
    
    // Check initial auth state
    const checkAuth = async () => {
      try {
        console.log('Checking auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Auth check result:', { session, error });
        
        if (error) {
          console.error('Auth check error:', error);
          if (mounted) {
            setIsAuthenticated(false);
            setLoading(false);
          }
          return;
        }
        
        if (session) {
          console.log('Session found, setting up user');
          if (mounted) {
            setIsAuthenticated(true);
            await fetchUserProfile();
          }
        } else {
          console.log('No session found');
          if (mounted) {
            setIsAuthenticated(false);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
        console.log('Auth check complete');
      } catch (error) {
        console.error('Error checking auth:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log('Auth effect cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Separate effect for handling navigation after user data is loaded
  useEffect(() => {
    if (user && isAuthenticated && !loading) {
      if (user.email?.toLowerCase() === 'admin@taxrxgroup.com') {
        console.log('Admin user detected, redirecting to leads page...');
        navigate('/leads', { replace: true });
      } else {
        console.log('Regular user detected, redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isAuthenticated, loading, navigate]);

  if (loading) {
    console.log('Showing loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#12ab61] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering main app content', { isAuthenticated, location: location.pathname });
  
  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && (
        <Navigation 
          currentView={location.pathname.substring(1) || 'home'}
          onViewChange={(view) => navigate(`/${view}`)}
          isAuthenticated={isAuthenticated}
          onLoginClick={() => navigate('/login')}
          onLogoutClick={handleLogout}
        />
      )}
      <main className={isAuthenticated ? 'ml-64' : ''}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Dashboard /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute isAuthenticated={isAuthenticated}><SettingsPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AccountPage /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute isAuthenticated={isAuthenticated}><LeadsPage /></ProtectedRoute>} />
          <Route path="/tax-calculator" element={<ProtectedRoute isAuthenticated={isAuthenticated}><TaxCalculator /></ProtectedRoute>} />
          <Route path="/augusta-rule" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AugustaRuleWizard onClose={() => {}} /></ProtectedRoute>} />
          <Route path="/calculator/hire-children" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <HireChildrenCalculator
                dependents={0}
                onSavingsChange={() => {}}
                taxInfo={taxInfo || {
                  standardDeduction: true,
                  customDeduction: 0,
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
                }}
                rates={{ federal: 0, state: 0 }}
              />
            </ProtectedRoute>
          } />
          <Route path="/calculator/cost-segregation" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <CostSegregationCalculator
                taxInfo={taxInfo || {
                  standardDeduction: true,
                  customDeduction: 0,
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
                }}
                onSavingsChange={() => {}}
                rates={{ federal: 0, state: 0 }}
              />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;