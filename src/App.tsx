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
import IntroInfo from './components/IntroInfo';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import LeadsPage from './pages/LeadsPage';
import { TaxInfo, TaxStrategy, SavedCalculation } from './types';

function App() {
  console.log('App component rendering');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize stores
  const { user, fetchUserProfile, reset: resetUserStore } = useUserStore();
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
  const [showIntroInfo, setShowIntroInfo] = useState(false);

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

  // Auth state management
  useEffect(() => {
    console.log('Auth effect running');
    let isMounted = true;

    const checkAuth = async () => {
      console.log('Checking auth...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Auth check result:', { session, error });
        
        if (error) {
          console.error('Session check error:', error);
          if (isMounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
            setAuthChecked(true);
          }
          return;
        }

        if (session) {
          console.log('Session found, setting up user');
          if (isMounted) {
            setIsAuthenticated(true);
            await fetchUserProfile();
            await setupCalculationSync(session.user.id);
            await fetchCalculations(session.user.id);
            await loadCalculation(selectedYear);
          }
        } else {
          console.log('No session found');
          if (isMounted) {
            setIsAuthenticated(false);
            resetTaxStore();
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        console.log('Auth check complete');
        if (isMounted) {
          setIsLoading(false);
          setAuthChecked(true);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        resetTaxStore();
        resetUserStore();
        navigate('/', { replace: true });
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        fetchUserProfile();
        setupCalculationSync(session.user.id);
        fetchCalculations(session.user.id);
        loadCalculation(selectedYear);
        navigate('/dashboard', { replace: true });
      }
    });

    return () => {
      console.log('Auth effect cleanup');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, setupCalculationSync, fetchCalculations, loadCalculation, selectedYear, navigate, resetUserStore]);

  // Show loading state
  if (isLoading || !authChecked) {
    console.log('Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#12ab61]"></div>
      </div>
    );
  }

  console.log('Rendering main app content', { isAuthenticated, location: location.pathname });
  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && location.pathname !== '/' && (
        <Navigation
          currentView={location.pathname.substring(1) || 'home'}
          onViewChange={(view) => navigate(`/${view}`)}
          isAuthenticated={isAuthenticated}
          onLoginClick={() => navigate('/login')}
          onLogoutClick={handleLogout}
        />
      )}
      
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage />
            )
          } 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          } 
        />
        <Route
          path="/dashboard/*"
          element={
            isAuthenticated ? (
              <Dashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/leads"
          element={
            isAuthenticated && user?.isAdmin ? (
              <LeadsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/calculator"
          element={
            isAuthenticated ? (
              <InfoForm onSubmit={handleInfoSubmit} initialData={taxInfo} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/results"
          element={
            isAuthenticated && taxInfo ? (
              <TaxResults
                taxInfo={taxInfo}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                onStrategiesSelect={handleStrategySelect}
                onSaveCalculation={handleSaveCalculation}
                onStrategyAction={handleStrategyAction}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <SettingsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/documents"
          element={
            isAuthenticated ? (
              <DocumentsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>

      {showAugustaWizard && (
        <AugustaRuleWizard
          onClose={() => setShowAugustaWizard(false)}
        />
      )}

      {showIntroInfo && (
        <IntroInfo onComplete={() => setShowIntroInfo(false)} />
      )}
    </div>
  );
}

export default App;