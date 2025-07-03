import React, { useState, useEffect } from 'react';
import InfoForm from './InfoForm';
import TaxResults from './TaxResults';
import { TaxInfo, SavedCalculation, TaxStrategy } from '../types';
import { useTaxProfileStore } from '../store/taxProfileStore';
import { useUserStore } from '../store/userStore';
import { useTaxStore } from '../store/taxStore';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';
import * as Dialog from '@radix-ui/react-dialog';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { taxRates } from '../data/taxRates';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import ActionBar from './ActionBar';
import { proposalService } from '../modules/admin/services/proposalService';
import { v4 as uuidv4 } from 'uuid';
import { TaxProposal } from '../modules/shared/types';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import ProposalView from './ProposalView';
import { toast } from 'react-hot-toast';
import { FileText } from 'lucide-react';
import StrategyApplicationSelector, { StrategyApplication } from './StrategyApplicationSelector';
import { CentralizedClientService } from '../services/centralizedClientService';

// Utility function to convert between TaxStrategy types
const convertToSharedTaxStrategy = (localStrategy: TaxStrategy): import('../modules/shared/types').TaxStrategy => {
  return {
    id: localStrategy.id,
    name: localStrategy.name,
    category: localStrategy.category,
    description: localStrategy.description || '',
    estimated_savings: localStrategy.estimatedSavings,
    implementation_complexity: 'medium',
    requires_expert: false,
    eligibility_criteria: [],
    details: localStrategy.details || {},
    enabled: localStrategy.enabled
  };
};

const convertToLocalTaxStrategy = (sharedStrategy: import('../modules/shared/types').TaxStrategy): TaxStrategy => {
  return {
    id: sharedStrategy.id,
    name: sharedStrategy.name,
    category: sharedStrategy.category,
    description: sharedStrategy.description,
    estimatedSavings: sharedStrategy.estimated_savings,
    enabled: sharedStrategy.enabled,
    details: sharedStrategy.details || {}
  } as TaxStrategy;
};

const TaxCalculator: React.FC<{ 
  initialData?: TaxInfo;
  onTaxInfoUpdate?: (taxInfo: TaxInfo) => Promise<void>;
  onStrategiesSelect?: (strategies: TaxStrategy[]) => Promise<void>;
  onStrategyAction?: (strategyId: string, action: string) => Promise<void>;
  clientId?: string; // For admin context
}> = ({ initialData, onTaxInfoUpdate, onStrategiesSelect, onStrategyAction, clientId }) => {
  const location = useLocation();
  const [showResults, setShowResults] = useState(false);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserStore();
  const { taxProfile, loading: taxProfileLoading, error: taxProfileError, fetchTaxProfile, updateTaxProfile } = useTaxProfileStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { demoMode } = useAuthStore();
  const [selectedStrategies, setSelectedStrategies] = useState<import('../types').TaxStrategy[]>(() => {
    // Load saved strategies from localStorage in demo mode
    if (demoMode) {
      try {
        const saved = localStorage.getItem('demoSelectedStrategies');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error("Failed to parse demo selected strategies from local storage", error);
        localStorage.removeItem('demoSelectedStrategies'); // Clear corrupted data
      }
    }
    return [];
  });
  const [proposalCreated, setProposalCreated] = useState(false);
  const { addSavedCalculation } = useTaxStore();
  
  const [demoTaxProfile, setDemoTaxProfile] = useState<TaxInfo | null>(() => {
    if (initialData) {
      return initialData;
    }
    if (demoMode) {
      try {
        const saved = localStorage.getItem('demoTaxProfile');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error("Failed to parse demo tax profile from local storage", error);
        localStorage.removeItem('demoTaxProfile'); // Clear corrupted data
      }
    }
    return null; // Return null if not in demo mode, or if nothing is saved, or if parsing failed.
  });

  const [showProposalView, setShowProposalView] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<any>(null);

  // Strategy Application Selector state
  const [clientData, setClientData] = useState<any>(null);
  const [strategyApplications, setStrategyApplications] = useState<StrategyApplication[]>([]);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);

  // Reset modal state on route change
  useEffect(() => {
    setShowInfoForm(false);
  }, [location.pathname]);

  // Open modal for onboarding if no taxInfo and user is loaded
  useEffect(() => {
    if (initialData) {
      // If initialData is provided, show results but don't automatically hide the form
      // The user can still access the form via the ActionBar
      setShowResults(true);
      // Don't set showInfoForm to false here - let the user control it
    } else if (demoMode) {
      // In demo mode, check for demo tax profile
      if (!demoTaxProfile && !loading) {
        setShowInfoForm(true);
      }
    } else {
      if (user && !taxProfile && !loading) {
        setShowInfoForm(true);
      }
    }
  }, [user, taxProfile, demoTaxProfile, loading, demoMode, initialData]);

  useEffect(() => {
    if (!demoMode && !initialData) {
      fetchTaxProfile();
    }
  }, [demoMode, initialData]);

  useEffect(() => {
    if (initialData) {
      setShowResults(true);
      // Don't automatically hide the form - let user control it
    } else if (demoMode) {
      setShowResults(!!demoTaxProfile);
    } else {
      setShowResults(!!taxProfile);
    }
  }, [taxProfile, demoTaxProfile, demoMode, initialData]);

  // Handle URL parameters for pre-populating data from proposals
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam && !initialData && !demoMode) {
      try {
        const taxInfoData = JSON.parse(decodeURIComponent(dataParam));
        setDemoTaxProfile(taxInfoData);
        setShowResults(true);
        setShowInfoForm(false);
      } catch (error) {
        console.error('Error parsing tax info from URL:', error);
      }
    }
  }, [initialData, demoMode]);

  // Handle when initialData changes (e.g., when parent component updates the data)
  useEffect(() => {
    if (initialData) {
      // Don't automatically show results when initialData changes
      // Let the user control when to show the form vs results
    }
  }, [initialData]);

  // Fetch client data when clientId is provided
  useEffect(() => {
    const fetchClientData = async () => {
      if (clientId && !clientData) {
        try {
          setLoadingClient(true);
          const client = await CentralizedClientService.getClient(clientId);
          setClientData(client);
        } catch (error) {
          console.error('Error fetching client data:', error);
          toast.error('Failed to load client data');
        } finally {
          setLoadingClient(false);
        }
      }
    };

    fetchClientData();
  }, [clientId, clientData]);

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
      
      // Show strategy selector if clientId is provided
      if (clientId && clientData) {
        setShowStrategySelector(true);
        setShowInfoForm(false);
      } else {
        setShowResults(true);
        setShowInfoForm(false);
      }
    } else if (onTaxInfoUpdate) {
      // If onTaxInfoUpdate callback is provided (admin context), use it
      try {
        setLoading(true);
        setError(null);
        
        await onTaxInfoUpdate(info);
        
        // Update local state to reflect the changes immediately
        if (initialData) {
          // In admin context, update the initialData by calling the callback
          // The parent component (AdminTaxCalculator) will handle updating its state
          console.log('Tax info updated via callback:', info);
        }
        
        setSelectedYear(year);
        
        // Show strategy selector if clientId is provided
        if (clientId && clientData) {
          setShowStrategySelector(true);
          setShowInfoForm(false);
        } else {
          setShowResults(true);
          setShowInfoForm(false);
        }
      } catch (err) {
        console.error('Error updating tax info:', err);
        setError('Failed to update tax information. Please try again.');
      } finally {
        setLoading(false);
      }
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
        
        // Show strategy selector if clientId is provided
        if (clientId && clientData) {
          setShowStrategySelector(true);
          setShowInfoForm(false);
        } else {
          setShowResults(true);
          setShowInfoForm(false);
        }
      } catch (err) {
        console.error('Error saving tax profile:', err);
        setError('Failed to save tax profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStrategiesSelect = async (strategies: TaxStrategy[]) => {
    setSelectedStrategies(strategies);
    
    // Save strategies to localStorage in demo mode
    if (demoMode) {
      try {
        localStorage.setItem('demoSelectedStrategies', JSON.stringify(strategies));
      } catch (error) {
        console.error("Failed to save demo selected strategies to local storage", error);
      }
    }
    
    // Only log significant strategy changes
    const enabledCount = strategies.filter(s => s.enabled).length;
    if (enabledCount > 0) {
      console.log(`${enabledCount} strategies enabled`);
    }

    if (onStrategiesSelect) {
      await onStrategiesSelect(strategies);
    }
  };

  const handleSaveCalculation = async (calc: SavedCalculation) => {
    try {
      if (demoMode) {
        // In demo mode, just log the calculation
        console.log('Demo mode - Saved calculation:', calc);
        toast.success('Demo mode: Calculation saved to console');
        return;
      }
      
      // Use the tax store to save the calculation
      await addSavedCalculation(calc);
      console.log('Successfully saved calculation:', calc);
      toast.success('Calculation saved successfully!');
    } catch (error) {
      console.error('Failed to save calculation:', error);
      toast.error('Failed to save calculation. Please try again.');
      setError('Failed to save calculation. Please try again.');
    }
  };

  const handleStrategyAction = async (strategyId: string, action: string) => {
    console.log('Strategy action:', strategyId, action);

    if (onStrategyAction) {
      await onStrategyAction(strategyId, action);
    }
  };

  const handleStrategyApplicationsChange = async (applications: StrategyApplication[]) => {
    setStrategyApplications(applications);
    
    // Save strategy applications to client data
    if (clientId && clientData) {
      try {
        // Here you would save the strategy applications to the database
        // For now, we'll just log them
        console.log('Strategy applications selected:', applications);
        
        // Save to localStorage in demo mode
        if (demoMode) {
          localStorage.setItem('demoStrategyApplications', JSON.stringify(applications));
        }
        
        toast.success('Strategy applications saved');
      } catch (error) {
        console.error('Error saving strategy applications:', error);
        toast.error('Failed to save strategy applications');
      }
    }
    
    // Proceed to tax results
    setShowStrategySelector(false);
    setShowResults(true);
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

  // Use either initialData, real profile, or demo profile
  const effectiveTaxProfile = initialData || (demoMode ? demoTaxProfile : taxProfile);

  // Skip loading and auth checks in demo mode
  if (demoMode) {
    // Demo mode - skip all Supabase checks
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {showInfoForm && (
              <InfoForm 
                onSubmit={handleInfoSubmit}
                initialData={initialData || effectiveTaxProfile}
                onTaxInfoUpdate={onTaxInfoUpdate}
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
                  onStrategiesSelect={handleStrategiesSelect as any}
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

  // Utility function to create a proposal object
  function buildTaxProposal({ client, affiliateId, strategies, baseline, savings }: {
    client: { id: string };
    affiliateId: string;
    strategies: import('../modules/shared/types').TaxStrategy[];
    baseline: TaxProposal['baseline_calculation'];
    savings: TaxProposal['projected_savings'];
  }): TaxProposal {
    return {
      id: uuidv4(),
      client_id: client.id,
      affiliate_id: affiliateId,
      status: 'submitted',
      baseline_calculation: baseline,
      proposed_strategies: strategies,
      projected_savings: savings,
      strategy_implementations: [], // Will be populated after creation
      admin_notes: [],
      documents: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    };
  }

  // Utility to convert local TaxStrategy to shared TaxStrategy for proposal creation
  function toSharedTaxStrategy(local: any): import('../modules/shared/types').TaxStrategy {
    return {
      ...local,
      estimated_savings: local.estimatedSavings || 0,
      implementation_complexity: local.implementationComplexity || 'low',
      requires_expert: local.requiresExpert || false,
      eligibility_criteria: local.eligibilityCriteria || [],
    };
  }

  const handleCreateProposal = async () => {
    if (!effectiveTaxProfile) return;

    try {
      setLoading(true);
      
      // Get client id from userStore or fallback
      const clientId = user?.id || 'demo-client';
      const affiliateId = 'affiliate-001'; // TODO: Replace with real affiliate logic
      
      // Get real baseline calculations
      const baselineCalculation = calculateTaxBreakdown(effectiveTaxProfile, taxRates[selectedYear]);
      
      // Get enabled strategies with their details
      const enabledStrategies = selectedStrategies.filter(s => s.enabled);

      // Calculate real projected savings
      const strategyBreakdown = calculateTaxBreakdown(effectiveTaxProfile, taxRates[selectedYear], enabledStrategies);
      const totalSavings = baselineCalculation.total - strategyBreakdown.total;
      const annualSavings = totalSavings;
      const fiveYearValue = annualSavings * 5;
      
      const projectedSavings: TaxProposal['projected_savings'] = {
        annual_savings: annualSavings,
        five_year_value: fiveYearValue,
        total_tax_reduction: totalSavings
      };

      // Create comprehensive baseline calculation
      const baseline: TaxProposal['baseline_calculation'] = {
        total_income: effectiveTaxProfile.householdIncome || 
                     effectiveTaxProfile.wagesIncome + 
                     effectiveTaxProfile.passiveIncome + 
                     effectiveTaxProfile.unearnedIncome +
                     (effectiveTaxProfile.businessOwner ? (effectiveTaxProfile.ordinaryK1Income || 0) + (effectiveTaxProfile.guaranteedK1Income || 0) : 0),
        federal_tax: baselineCalculation.federal,
        state_tax: baselineCalculation.state,
        total_tax: baselineCalculation.total,
        effective_rate: baselineCalculation.effectiveRate
      };

      // Create proposal object
      const proposal = buildTaxProposal({ 
        client: { id: clientId }, 
        affiliateId, 
        strategies: enabledStrategies.map(convertToSharedTaxStrategy), 
        baseline, 
        savings: projectedSavings 
      });

      // Create strategy implementations for admin workflow tracking
      const sharedStrategies = enabledStrategies.map(convertToSharedTaxStrategy);
      const strategyImplementations = await proposalService.createStrategyImplementations(proposal.id, sharedStrategies);

      // Add client profile and detailed calculations to the proposal
      const enhancedProposal = {
        ...proposal,
        strategy_implementations: strategyImplementations,
        client_profile: {
          id: clientId,
          affiliate_id: affiliateId,
          personal_info: {
            full_name: effectiveTaxProfile.fullName || 'Client',
            email: effectiveTaxProfile.email || 'client@example.com',
            address: {
              street: effectiveTaxProfile.homeAddress || '',
              city: '',
              state: effectiveTaxProfile.state || 'CA',
              zip: ''
            }
          },
          tax_info: {
            filing_status: (effectiveTaxProfile.filingStatus === 'married_joint' ? 'married_filing_jointly' :
                           effectiveTaxProfile.filingStatus === 'married_separate' ? 'married_filing_separately' :
                           effectiveTaxProfile.filingStatus === 'head_household' ? 'head_of_household' :
                           effectiveTaxProfile.filingStatus) as 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household',
            dependents: effectiveTaxProfile.dependents,
            state: effectiveTaxProfile.state,
            wages_income: effectiveTaxProfile.wagesIncome,
            business_income: (effectiveTaxProfile.ordinaryK1Income || 0) + (effectiveTaxProfile.guaranteedK1Income || 0),
            passive_income: effectiveTaxProfile.passiveIncome,
            capital_gains: effectiveTaxProfile.capitalGains,
            other_income: effectiveTaxProfile.unearnedIncome,
            current_deductions: effectiveTaxProfile.standardDeduction ? 0 : (effectiveTaxProfile.customDeduction || 0),
            qbi_eligible: effectiveTaxProfile.businessOwner,
            business_owner: effectiveTaxProfile.businessOwner,
            high_income: (effectiveTaxProfile.householdIncome || 0) > 400000
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        detailed_calculations: {
          baseline_breakdown: baselineCalculation,
          strategy_breakdown: strategyBreakdown,
          selected_year: selectedYear,
          tax_rates_used: taxRates[selectedYear]
        },
        strategy_details: enabledStrategies.map(strategy => ({
          id: strategy.id,
          name: strategy.name,
          category: strategy.category,
          estimated_savings: strategy.estimatedSavings,
          details: strategy.details,
          implementation_steps: [], // Default empty array
          required_documents: [] // Default empty array
        }))
      };

      await proposalService.createProposalLegacy(enhancedProposal);
      
      // Create proposal object for viewing
      const proposalForView = {
        id: enhancedProposal.id,
        taxInfo: effectiveTaxProfile,
        strategies: enabledStrategies,
        year: selectedYear,
        date: new Date().toISOString(),
        totalSavings: totalSavings,
        annualSavings: annualSavings,
        fiveYearValue: fiveYearValue
      };
      
      // Show the proposal view
      setCurrentProposal(proposalForView);
      setShowProposalView(true);
      
      // Show success toast
      toast.success('Proposal created successfully!');
      
      // Show success message and update state
      setProposalCreated(true);
      
      // Reset the indicator after 5 seconds
      setTimeout(() => setProposalCreated(false), 5000);
      
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Failed to create proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProposal = () => {
    if (!effectiveTaxProfile) return;
    
    const enabledStrategies = selectedStrategies.filter(s => s.enabled);
    const baselineCalculation = calculateTaxBreakdown(effectiveTaxProfile, taxRates[selectedYear]);
    const strategyBreakdown = calculateTaxBreakdown(effectiveTaxProfile, taxRates[selectedYear], enabledStrategies);
    const totalSavings = baselineCalculation.total - strategyBreakdown.total;
    const annualSavings = totalSavings;
    const fiveYearValue = annualSavings * 5;
    
    const proposalForView = {
      id: 'current-proposal',
      taxInfo: effectiveTaxProfile,
      strategies: selectedStrategies,
      year: selectedYear,
      date: new Date().toISOString(),
      totalSavings: totalSavings,
      annualSavings: annualSavings,
      fiveYearValue: fiveYearValue
    };
    
    setCurrentProposal(proposalForView);
    setShowProposalView(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {showInfoForm && (
          <InfoForm 
            onSubmit={handleInfoSubmit}
            initialData={initialData || effectiveTaxProfile}
            onTaxInfoUpdate={onTaxInfoUpdate}
          />
        )}

        {showStrategySelector && clientData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <button
                onClick={() => {
                  setShowStrategySelector(false);
                  setShowInfoForm(true);
                }}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Back to Tax Information
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                Strategy Application
              </h2>
              <p className="text-gray-600 mt-2">
                Select which entity each tax strategy should be applied to for {clientData.full_name}.
              </p>
            </div>
            
            {loadingClient ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading client data...</p>
              </div>
            ) : (
              <StrategyApplicationSelector
                client={clientData}
                selectedApplications={strategyApplications}
                onApplicationsChange={handleStrategyApplicationsChange}
              />
            )}
          </div>
        )}

        {showResults && effectiveTaxProfile && !showInfoForm && !showStrategySelector && (
          <>
            <TaxResults 
              taxInfo={effectiveTaxProfile}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              onStrategiesSelect={handleStrategiesSelect as any}
              onSaveCalculation={handleSaveCalculation}
              onStrategyAction={handleStrategyAction}
              clientId={clientId}
            />
          </>
        )}
      </div>

      {effectiveTaxProfile && !showInfoForm && (
        <ActionBar
          userName={effectiveTaxProfile.fullName || 'User'}
          userState={effectiveTaxProfile.state || 'N/A'}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onUpdateInfo={() => setShowInfoForm(true)}
          onSave={() => console.log('Save action triggered')}
          extraActions={
            <div className="flex items-center space-x-4">
              {proposalCreated && (
                <div className="flex items-center bg-green-600 text-white px-3 py-1 rounded-md text-sm">
                  <span>✓ Proposal Created</span>
                </div>
              )}
              <button 
                onClick={handleViewProposal}
                className="btn-secondary-modern flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>View Proposal</span>
              </button>
              <button 
                className={`btn-primary-modern ${proposalCreated ? 'bg-green-600 hover:bg-green-700' : ''}`} 
                onClick={handleCreateProposal}
                disabled={loading}
              >
                {loading ? 'Creating...' : proposalCreated ? 'Proposal Created!' : 'Create Proposal'}
              </button>
            </div>
          }
        />
      )}

      {showProposalView && currentProposal && (
        <ProposalView
          proposal={currentProposal}
          onBack={() => setShowProposalView(false)}
        />
      )}
    </div>
  );
};

export default TaxCalculator; 