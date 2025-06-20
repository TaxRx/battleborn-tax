import React, { useState, useEffect } from 'react';
import InfoForm from './InfoForm';
import TaxResults from './TaxResults';
import { TaxInfo, TaxStrategy, SavedCalculation } from '../types';
import { useTaxProfileStore } from '../store/taxProfileStore';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';
import * as Dialog from '@radix-ui/react-dialog';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { taxRates } from '../data/taxRates';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const TaxCalculator: React.FC = () => {
  const location = useLocation();
  const [showResults, setShowResults] = useState(false);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserStore();
  const { taxProfile, loading: taxProfileLoading, error: taxProfileError, fetchTaxProfile, updateTaxProfile } = useTaxProfileStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { demoMode } = useAuthStore();
  
  // Demo tax profile state for local storage
  const [demoTaxProfile, setDemoTaxProfile] = useState<TaxInfo | null>(() => {
    if (demoMode) {
      const saved = localStorage.getItem('demoTaxProfile');
      if (saved) {
        return JSON.parse(saved);
      }
      // Create a default demo profile for testing
      return {
        standardDeduction: true,
        customDeduction: 0,
        businessOwner: true,
        fullName: 'Demo User',
        email: 'demo@example.com',
        filingStatus: 'married_joint',
        dependents: 2,
        homeAddress: '123 Demo Street, Demo City, CA 90210',
        state: 'CA',
        wagesIncome: 250000,
        passiveIncome: 75000,
        unearnedIncome: 15000,
        capitalGains: 25000,
        businessName: 'Demo Business LLC',
        ordinaryK1Income: 150000,
        guaranteedK1Income: 50000,
        businessAddress: '456 Business Ave, Demo City, CA 90210',
        businessType: 'Professional Services',
        businessDescription: 'Consulting and professional services'
      };
    }
    return null;
  });

  // Reset modal state on route change
  useEffect(() => {
    setShowInfoForm(false);
  }, [location.pathname]);

  // Open modal for onboarding if no taxInfo and user is loaded
  useEffect(() => {
    if (demoMode) {
      // In demo mode, check for demo tax profile
      if (!demoTaxProfile && !loading) {
        setShowInfoForm(true);
      }
    } else {
      if (user && !taxProfile && !loading) {
        setShowInfoForm(true);
      }
    }
  }, [user, taxProfile, demoTaxProfile, loading, demoMode]);

  useEffect(() => {
    if (!demoMode) {
      fetchTaxProfile();
    }
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) {
      setShowResults(!!demoTaxProfile);
    } else {
      setShowResults(!!taxProfile);
    }
  }, [taxProfile, demoTaxProfile, demoMode]);

  const handleInfoSubmit = async (info: TaxInfo, year: number) => {
    if (demoMode) {
      // For demo mode, save to local storage instead of Supabase
      const demoInfo = {
        ...info,
        user_id: 'demo-user',
        email: 'demo@example.com'
      };
      setDemoTaxProfile(demoInfo);
      localStorage.setItem('demoTaxProfile', JSON.stringify(demoInfo));
      setSelectedYear(year);
      setShowResults(true);
      setShowInfoForm(false);
    } else {
      // Original Supabase logic for real users
      try {
        setLoading(true);
        setError(null);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No authenticated user');

        const taxProfileData = {
          user_id: user.id,
          full_name: info.fullName,
          filing_status: info.filingStatus,
          state: info.state,
          dependents: info.dependents,
          home_address: info.homeAddress,
          business_name: info.businessOwner ? info.businessName : null,
          business_address: info.businessOwner ? info.businessAddress : null,
          entity_type: info.businessOwner ? info.entityType : null,
          wages_income: info.wagesIncome,
          passive_income: info.passiveIncome,
          unearned_income: info.unearnedIncome,
          capital_gains: info.capitalGains,
          ordinary_k1_income: info.businessOwner ? info.ordinaryK1Income : 0,
          guaranteed_k1_income: info.businessOwner ? info.guaranteedK1Income : 0,
          household_income: info.householdIncome,
          standard_deduction: info.standardDeduction,
          custom_deduction: info.customDeduction,
          business_owner: info.businessOwner,
          deduction_limit_reached: info.deductionLimitReached || false,
          updated_at: new Date().toISOString()
        };

        const { error: upsertError } = await supabase
          .from('tax_profiles')
          .upsert(taxProfileData, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;

        await fetchTaxProfile();
        setSelectedYear(year);
        setShowResults(true);
        setShowInfoForm(false);
      } catch (err) {
        console.error('Error saving tax profile:', err);
        setError('Failed to save tax profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStrategiesSelect = (strategies: TaxStrategy[]) => {
    // Only log significant strategy changes
    const enabledCount = strategies.filter(s => s.enabled).length;
    if (enabledCount > 0) {
      console.log(`${enabledCount} strategies enabled`);
    }
  };

  const handleSaveCalculation = (calc: SavedCalculation) => {
    // Handle saving calculation
    console.log('Saved calculation:', calc);
  };

  const handleStrategyAction = (strategyId: string, action: string) => {
    // Handle strategy action
    console.log('Strategy action:', strategyId, action);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (demoMode) {
      // Skip profile update in demo mode
      return;
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          email: data.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating user profile:', err);
    }
  };

  // Use either real profile or demo profile
  const effectiveTaxProfile = demoMode ? demoTaxProfile : taxProfile;

  // Skip loading and auth checks in demo mode
  if (demoMode) {
    // Demo mode - skip all Supabase checks
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax Calculator</h1>
              <p className="text-gray-600">Calculate your tax liability and explore strategies</p>
              <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full inline-block">
                Demo Mode - Using Local Data
              </div>
            </div>

            {showInfoForm && (
              <InfoForm 
                onSubmit={handleInfoSubmit}
                initialData={effectiveTaxProfile}
              />
            )}

            {showResults && effectiveTaxProfile && (
              <div>
                <button
                  onClick={() => setShowInfoForm(true)}
                  className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ChevronLeftIcon className="h-5 w-5 mr-1" />
                  Back to Tax Information
                </button>
                
                <TaxResults 
                  taxInfo={effectiveTaxProfile}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                  onStrategiesSelect={handleStrategiesSelect}
                  onSaveCalculation={handleSaveCalculation}
                  onStrategyAction={handleStrategyAction}
                />
              </div>
            )}

            {!effectiveTaxProfile && showInfoForm && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Please complete your tax information first.</p>
                <button
                  onClick={() => setShowInfoForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Start Tax Information
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Original loading and error states for real users
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Calculator</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Dialog.Root open={showInfoForm || !effectiveTaxProfile} onOpenChange={setShowInfoForm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-0 w-full max-w-2xl z-50 focus:outline-none">
            <Dialog.Title className="text-xl font-bold px-8 pt-8">Tax Information</Dialog.Title>
            <Dialog.Description className="px-8 pb-2 text-gray-500">Enter or update your tax profile to get started.</Dialog.Description>
            <InfoForm initialData={effectiveTaxProfile} onSubmit={handleInfoSubmit} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {showResults && effectiveTaxProfile && (
        <TaxResults
          taxInfo={effectiveTaxProfile}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onStrategiesSelect={handleStrategiesSelect}
          onSaveCalculation={handleSaveCalculation}
          onStrategyAction={handleStrategyAction}
        />
      )}
      {!showResults && (
        <div className="flex justify-center mt-8">
          <button
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition"
            onClick={() => setShowInfoForm(true)}
            disabled={loading}
          >
            {effectiveTaxProfile ? 'Update Info' : 'Enter Info'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator; 