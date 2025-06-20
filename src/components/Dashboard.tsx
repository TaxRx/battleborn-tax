import React, { useState, useEffect } from 'react';
import { Calculator, LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { useTaxProfileStore } from '../store/taxProfileStore';
import InfoForm from './InfoForm';
import TaxResults from './TaxResults';
import AccountPage from './AccountPage';
import DocumentsPage from './DocumentsPage';
import SettingsPage from './SettingsPage';
import DashboardHome from './DashboardHome';
import { TaxInfo, TaxStrategy, SavedCalculation } from '../types';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { taxProfile, loading, error, fetchTaxProfile, updateTaxProfile } = useTaxProfileStore();
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStrategies, setSelectedStrategies] = useState<TaxStrategy[]>([]);
  const { demoMode, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch tax profile if not in demo mode
    if (!demoMode) {
      fetchTaxProfile();
    }
  }, [demoMode]);

  const handleInfoSubmit = async (info: TaxInfo) => {
    await updateTaxProfile(info);
    setShowInfoForm(false);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentView('calculator');
  };

  const handleStrategiesSelect = (strategies: TaxStrategy[]) => {
    setSelectedStrategies(strategies);
  };

  const handleSaveCalculation = (calc: SavedCalculation) => {
    // Save calculation to database
    console.log('Saving calculation:', calc);
  };

  const handleStrategyAction = (strategyId: string, action: string) => {
    console.log('Strategy action:', strategyId, action);
  };

  const handleCalculatorClick = () => {
    if (demoMode) {
      // In demo mode, navigate to the standalone tax calculator
      navigate('/tax-calculator');
    } else {
      // In regular mode, use the internal calculator view
      setCurrentView('calculator');
    }
  };

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to TaxRx</h2>
            <p className="text-gray-600 mb-6">
              Get started by using our Tax Estimator to calculate your potential tax savings.
            </p>
            {demoMode && (
              <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
                <strong>Demo Mode:</strong> You're using the demo version with sample data and local calculations.
              </div>
            )}
            <button
              onClick={handleCalculatorClick}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Open Tax Estimator
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tax Calculator</h3>
              <p className="text-gray-600 mb-4">Calculate your tax savings with our advanced estimator</p>
              <button
                onClick={handleCalculatorClick}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Start Calculating →
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
              <p className="text-gray-600 mb-4">Upload and manage your tax documents</p>
              <button
                onClick={() => setCurrentView('documents')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View Documents →
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600 mb-4">Manage your account preferences</p>
              <button
                onClick={() => setCurrentView('settings')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Manage Settings →
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (currentView === 'calculator') {
      // In demo mode, this should not be reached since we redirect to /tax-calculator
      if (demoMode) {
        return (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Redirecting to Tax Calculator...</p>
          </div>
        );
      }
      
      if (loading) return <div>Loading...</div>;
      if (error) return <div className="text-red-600">{error}</div>;
      if (!taxProfile || showInfoForm) {
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Enter Your Information</h2>
              <InfoForm initialData={taxProfile} onSubmit={handleInfoSubmit} />
            </div>
          </div>
        );
      }
      return (
        <TaxResults
          taxInfo={taxProfile}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onStrategiesSelect={handleStrategiesSelect}
          onSaveCalculation={handleSaveCalculation}
          onStrategyAction={handleStrategyAction}
        />
      );
    }
    if (currentView === 'account') {
      return <AccountPage />;
    }
    if (currentView === 'documents') {
      return <DocumentsPage />;
    }
    if (currentView === 'settings') {
      return <SettingsPage />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-20 bg-white border-r">
        <div className="flex flex-col h-full">
          <div className="p-4">
            <Calculator className="h-8 w-8 text-[#12ab61] mx-auto" />
          </div>

          <nav className="flex-1 px-2 py-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full p-3 mb-2 rounded-lg flex flex-col items-center ${
                currentView === 'dashboard' ? 'bg-[#12ab61] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard size={24} />
              <span className="text-xs mt-1">Dashboard</span>
            </button>
            <button
              onClick={handleCalculatorClick}
              className={`w-full p-3 mb-2 rounded-lg flex flex-col items-center ${
                currentView === 'calculator' ? 'bg-[#12ab61] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calculator size={24} />
              <span className="text-xs mt-1">Tax Estimator</span>
            </button>
            <button
              onClick={() => setCurrentView('account')}
              className={`w-full p-3 mb-2 rounded-lg flex flex-col items-center ${
                currentView === 'account' ? 'bg-[#12ab61] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard size={24} />
              <span className="text-xs mt-1">Account</span>
            </button>
            <button
              onClick={() => setCurrentView('documents')}
              className={`w-full p-3 mb-2 rounded-lg flex flex-col items-center ${
                currentView === 'documents' ? 'bg-[#12ab61] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText size={24} />
              <span className="text-xs mt-1">Documents</span>
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`w-full p-3 mb-2 rounded-lg flex flex-col items-center ${
                currentView === 'settings' ? 'bg-[#12ab61] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings size={24} />
              <span className="text-xs mt-1">Settings</span>
            </button>
          </nav>

          <div className="p-4">
            <button
              onClick={async () => {
                if (demoMode) {
                  logout();
                  navigate('/');
                } else {
                  await supabase.auth.signOut();
                }
              }}
              className="w-full p-3 text-gray-600 hover:bg-gray-100 rounded-lg flex flex-col items-center"
            >
              <LogOut size={24} />
              <span className="text-xs mt-1">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-20">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold">
              {currentView === 'dashboard' && 'Dashboard'}
              {currentView === 'calculator' && 'Tax Estimator'}
              {currentView === 'account' && 'Account'}
              {currentView === 'documents' && 'Documents'}
              {currentView === 'settings' && 'Settings'}
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}