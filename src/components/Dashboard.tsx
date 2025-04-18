import React, { useState } from 'react';
import { Calculator, LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InfoForm from './InfoForm';
import TaxResults from './TaxResults';
import AccountPage from './AccountPage';
import DocumentsPage from './DocumentsPage';
import SettingsPage from './SettingsPage';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('calculator');
  const [showTaxResults, setShowTaxResults] = useState(false);
  const [taxInfo, setTaxInfo] = useState(null);

  const handleInfoSubmit = (info: any) => {
    setTaxInfo(info);
    setShowTaxResults(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'calculator':
        return showTaxResults ? (
          <TaxResults taxInfo={taxInfo} />
        ) : (
          <InfoForm onSubmit={handleInfoSubmit} />
        );
      case 'account':
        return <AccountPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
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