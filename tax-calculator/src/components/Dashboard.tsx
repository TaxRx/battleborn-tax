import React, { useState } from 'react';
import { Calculator, LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import InfoForm from './InfoForm';
import TaxResults from './TaxResults';
import AccountPage from './AccountPage';
import DocumentsPage from './DocumentsPage';
import SettingsPage from './SettingsPage';
import { TaxInfo, TaxStrategy, SavedCalculation } from '../types';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('calculator');
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStrategies, setSelectedStrategies] = useState<TaxStrategy[]>([]);
  const { user } = useUserStore();
  const isNewUser = !user?.hasCompletedTaxProfile;

  const handleInfoSubmit = async (info: TaxInfo) => {
    setTaxInfo(info);
    setShowInfoForm(false);
    setShowResults(true);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
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

  const renderContent = () => {
    if (currentView === 'calculator') {
      if (showInfoForm) {
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Enter Your Information</h2>
              <InfoForm onSubmit={handleInfoSubmit} />
            </div>
          </div>
        );
      }

      if (showResults && taxInfo) {
        return (
          <TaxResults
            taxInfo={taxInfo}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            onStrategiesSelect={handleStrategiesSelect}
            onSaveCalculation={handleSaveCalculation}
            onStrategyAction={handleStrategyAction}
          />
        );
      }

      return (
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {isNewUser ? 'Welcome to Your Tax Calculator' : 'Welcome Back'}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {isNewUser
              ? "Let's start by gathering some information to help calculate your tax savings."
              : 'Continue working on your tax calculations or start a new one.'}
          </p>
          <button
            onClick={() => setShowInfoForm(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#12ab61] hover:bg-[#0f9a57]"
          >
            {isNewUser ? 'Start Here' : 'New Calculation'}
          </button>
        </div>
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
              onClick={() => setCurrentView('calculator')}
              className={`w-full p-3 mb-2 rounded-lg flex flex-col items-center ${
                currentView === 'calculator' ? 'bg-[#12ab61] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calculator size={24} />
              <span className="text-xs mt-1">Calculator</span>
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
                await supabase.auth.signOut();
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
              {currentView === 'calculator' && 'Tax Calculator'}
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