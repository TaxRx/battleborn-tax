import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TaxInfo } from '../types';
import { TaxStrategy } from '../types';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { taxRates } from '../data/taxRates';
import { useTaxStore } from '../store/taxStore';
import { useUserStore } from '../store/userStore';
import { useTaxProfileStore } from '../store/taxProfileStore';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { FileText, ChevronLeftIcon } from 'lucide-react';
import InfoForm from './InfoForm';
import TaxResults from './TaxResults';
import ActionBar from './ActionBar';
import ProposalView from './ProposalView';
import StrategyApplicationSelector, { StrategyApplication } from './StrategyApplicationSelector';
import { SavedCalculation } from '../types';
import { CentralizedClientService } from '../services/centralizedClientService';
import * as Dialog from '@radix-ui/react-dialog';
import { User } from '../types/user';
import * as uuid from 'uuid';
import { TaxProposal } from '../modules/admin/types/proposal';
import { formatCurrency } from '../utils/formatting';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserStore();
  const { taxProfile, loading: taxProfileLoading, error: taxProfileError, fetchTaxProfile, updateTaxProfile } = useTaxProfileStore();
  const { setTaxInfo, saveInitialState, selectedYear, setSelectedYear } = useTaxStore();
  const [selectedStrategies, setSelectedStrategies] = useState<import('../types').TaxStrategy[]>([]);
  const [proposalCreated, setProposalCreated] = useState(false);
  const { addSavedCalculation } = useTaxStore();

  const [showProposalView, setShowProposalView] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<any>(null);

  // Strategy Application Selector state
  const [clientData, setClientData] = useState<any>(null);
  const [strategyApplications, setStrategyApplications] = useState<StrategyApplication[]>([]);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);

  // InfoForm modal state
  const [isInfoFormOpen, setIsInfoFormOpen] = useState(false);

  // Reset modal state on route change
  useEffect(() => {
    setIsInfoFormOpen(false);
  }, [location.pathname]);

  // Open modal for onboarding if no taxInfo and user is loaded
  useEffect(() => {
    if (initialData) {
      // If initialData is provided, show results but don't automatically hide the form
      // The user can still access the form via the ActionBar
      setShowResults(true);
      // Don't set isInfoFormOpen to false here - let the user control it
    } else {
      if (user && !taxProfile && !loading) {
        setIsInfoFormOpen(true);
      }
    }
  }, [user, taxProfile, loading, initialData]);

  useEffect(() => {
    if (!initialData) {
      fetchTaxProfile();
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      setShowResults(true);
      // Don't automatically hide the form - let user control it
    } else {
      setShowResults(!!taxProfile);
    }
  }, [taxProfile, initialData]);

  // Handle URL parameters for pre-populating data from proposals
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam && !initialData) {
      try {
        const taxInfoData = JSON.parse(decodeURIComponent(dataParam));
        setShowResults(true);
        setIsInfoFormOpen(false);
      } catch (error) {
        console.error('Error parsing tax info from URL:', error);
      }
    }
  }, [initialData]);

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
    if (onTaxInfoUpdate) {
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
          setIsInfoFormOpen(false);
        } else {
          setShowResults(true);
          setIsInfoFormOpen(false);
        }
      } catch (err) {
        console.error('Error updating tax info:', err);
        setError('Failed to update tax information. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // For regular users, just update the tax store and show results
      try {
        setLoading(true);
        setError(null);

        // Update tax store
        setTaxInfo(info);
        setSelectedYear(year);
        
        // Show results
          setShowResults(true);
        setIsInfoFormOpen(false);
      } catch (err) {
        console.error('Error updating tax info:', err);
        setError('Failed to update tax information. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStrategiesSelect = async (strategies: TaxStrategy[]) => {
    if (onStrategiesSelect) {
      try {
        await onStrategiesSelect(strategies);
        setSelectedStrategies(strategies);
        setShowResults(true);
        setShowStrategySelector(false);
      } catch (error) {
        console.error('Error selecting strategies:', error);
        toast.error('Failed to select strategies');
      }
    } else {
      setSelectedStrategies(strategies);
      setShowResults(true);
      setShowStrategySelector(false);
    }
  };

  const handleSaveCalculation = async (calc: SavedCalculation) => {
    try {
      await addSavedCalculation(calc);
      toast.success('Calculation saved successfully');
    } catch (error) {
      console.error('Error saving calculation:', error);
      toast.error('Failed to save calculation');
    }
  };

  const handleStrategyAction = async (strategyId: string, action: string) => {
    if (onStrategyAction) {
      try {
      await onStrategyAction(strategyId, action);
      } catch (error) {
        console.error('Error performing strategy action:', error);
        toast.error('Failed to perform strategy action');
      }
    }
  };

  const handleStrategyApplicationsChange = async (applications: StrategyApplication[]) => {
    setStrategyApplications(applications);
    
    // Convert to TaxStrategy format for the calculator
    const strategies: TaxStrategy[] = applications.map(app => ({
      id: app.strategyId,
      name: app.strategyId, // We'll need to get the actual strategy name from somewhere
      category: 'new_deductions' as const,
      description: `Strategy applied to ${app.applicationType}`,
      estimatedSavings: 0, // This would need to be calculated based on the strategy
      enabled: true,
      details: {
        applicationType: app.applicationType,
        businessId: app.businessId
      }
    }));

    await handleStrategiesSelect(strategies);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!currentUser) throw new Error('No authenticated user found');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          ...data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Get effective tax profile (either from initialData or taxProfile)
  const effectiveTaxProfile = initialData || taxProfile;

  // Handle tax info updates
  const handleTaxInfoUpdate = async (updatedTaxInfo: TaxInfo) => {
    try {
      console.log('[TaxCalculator] Updating tax info:', updatedTaxInfo);
      setTaxInfo(updatedTaxInfo);
      
      if (clientId) {
        // Update the client's tax info in the database
        await CentralizedClientService.updateClient(clientId, {
          full_name: updatedTaxInfo.fullName,
          email: updatedTaxInfo.email,
          phone: updatedTaxInfo.phone,
          filing_status: updatedTaxInfo.filingStatus,
          dependents: updatedTaxInfo.dependents,
          home_address: updatedTaxInfo.homeAddress,
          state: updatedTaxInfo.state,
          standard_deduction: updatedTaxInfo.standardDeduction,
          custom_deduction: updatedTaxInfo.customDeduction
        });

        // Update personal year data
        const yearData = {
          year: selectedYear || new Date().getFullYear(),
          wages_income: updatedTaxInfo.wagesIncome,
          passive_income: updatedTaxInfo.passiveIncome,
          unearned_income: updatedTaxInfo.unearnedIncome,
          capital_gains: updatedTaxInfo.capitalGains,
          long_term_capital_gains: 0,
          household_income: updatedTaxInfo.householdIncome || 0,
          ordinary_income: updatedTaxInfo.wagesIncome + updatedTaxInfo.passiveIncome + updatedTaxInfo.unearnedIncome,
          is_active: true
        };

        const existingYear = await CentralizedClientService.getPersonalYear(clientId, selectedYear || new Date().getFullYear());
        
        if (existingYear) {
          await CentralizedClientService.updatePersonalYear(existingYear.id, yearData);
        } else {
          await CentralizedClientService.createPersonalYear(clientId, yearData);
        }
      }
    } catch (error) {
      console.error('[TaxCalculator] Error updating tax info:', error);
      throw error;
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

  // Utility function to create a proposal object
  function buildTaxProposal({ client, affiliateId, strategies, baseline, savings }: {
    client: { id: string };
    affiliateId: string;
    strategies: import('../modules/shared/types').TaxStrategy[];
    baseline: any;
    savings: any;
  }): TaxProposal {
    return {
      id: uuid.v4(),
      clientId: client.id,
      clientName: 'Client Name', // Will be set by the calling function
      clientEmail: 'client@example.com', // Will be set by the calling function
      affiliateId: affiliateId,
      status: 'draft',
      calculation: {
        totalIncome: baseline.total_income || 0,
        filingStatus: 'single',
        state: 'CA',
        year: new Date().getFullYear(),
        beforeTaxes: {
          federal: baseline.federal_tax || 0,
          state: baseline.state_tax || 0,
          socialSecurity: 0,
          medicare: 0,
          selfEmployment: 0,
          total: baseline.total_tax || 0,
          effectiveRate: baseline.effective_rate || 0
        },
        afterTaxes: {
          federal: baseline.federal_tax || 0,
          state: baseline.state_tax || 0,
          socialSecurity: 0,
          medicare: 0,
          selfEmployment: 0,
          total: baseline.total_tax || 0,
          effectiveRate: baseline.effective_rate || 0
        },
        strategies: strategies.map(s => ({
          id: s.id,
          name: s.name,
          enabled: s.enabled,
          estimatedSavings: s.estimated_savings || 0,
          category: s.category,
          details: s.details
        })),
        savings: {
          rawSavings: savings.total_tax_reduction || 0,
          annualSavings: savings.annual_savings || 0,
          fiveYearValue: savings.five_year_value || 0,
          beforeRate: '0%',
          afterRate: '0%',
          shiftedIncome: 0,
          deferredIncome: 0
        },
        incomeDistribution: {
          wagesIncome: 0,
          passiveIncome: 0,
          unearnedIncome: 0,
          ordinaryK1Income: 0,
          guaranteedK1Income: 0
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
      implementationStatus: 'not_started',
      projectedRevenue: savings.annual_savings || 0
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
    if (!effectiveTaxProfile || !clientId) {
      toast.error('Missing tax profile or client ID');
      return;
    }

    try {
      setLoading(true);
      
      // Calculate baseline and strategy breakdowns
      const baselineCalculation = calculateTaxBreakdown(effectiveTaxProfile, taxRates[selectedYear]);
      const enabledStrategies = selectedStrategies.filter(s => s.enabled);
      const strategyBreakdown = calculateTaxBreakdown(effectiveTaxProfile, taxRates[selectedYear], enabledStrategies);
      
      const totalSavings = baselineCalculation.total - strategyBreakdown.total;
      const annualSavings = totalSavings;
      const fiveYearValue = annualSavings * 5;
      
      // Create a simple proposal object
      const proposalData = {
        id: uuid.v4(),
        clientId,
        clientName: effectiveTaxProfile.fullName || 'Unknown Client',
        clientEmail: effectiveTaxProfile.email || '',
        status: 'draft',
        calculation: {
          baselineTax: baselineCalculation.total,
          strategyTax: strategyBreakdown.total,
          totalSavings: totalSavings,
          annualSavings: annualSavings,
          fiveYearValue: fiveYearValue,
          strategies: enabledStrategies.map((strategy: TaxStrategy) => ({
            id: strategy.id,
            name: strategy.name,
            category: strategy.category,
            estimatedSavings: strategy.estimatedSavings,
            details: strategy.details
          }))
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: [],
        implementationStatus: 'not_started',
        projectedRevenue: totalSavings
      };

      // For now, just show the proposal view without saving to database
      const proposalForView = {
        id: proposalData.id,
        taxInfo: effectiveTaxProfile,
        strategies: enabledStrategies,
        year: selectedYear,
        date: new Date().toISOString(),
        totalSavings: totalSavings,
        annualSavings: annualSavings,
        fiveYearValue: fiveYearValue
      };
      
      setCurrentProposal(proposalForView);
      setShowProposalView(true);
      
      toast.success('Proposal created successfully!');
      setProposalCreated(true);
      setTimeout(() => setProposalCreated(false), 5000);
      
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Failed to create proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  console.log('TaxCalculator render - isInfoFormOpen:', isInfoFormOpen, 'effectiveTaxProfile:', !!effectiveTaxProfile);

  // Skip loading and auth checks in demo mode
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tax calculator...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading tax calculator</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
          <InfoForm 
            onSubmit={handleInfoSubmit}
          initialData={effectiveTaxProfile}
            onTaxInfoUpdate={onTaxInfoUpdate}
          clientId={clientId}
          selectedYear={selectedYear}
          isOpen={isInfoFormOpen}
          onClose={() => setIsInfoFormOpen(false)}
          />

        {showStrategySelector && clientData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <button
                onClick={() => {
                  setShowStrategySelector(false);
                  setIsInfoFormOpen(true);
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
                Select which entity each tax strategy should be applied to for {clientData?.full_name}.
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

        {showResults && effectiveTaxProfile && !isInfoFormOpen && !showStrategySelector && (
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

        {effectiveTaxProfile && !isInfoFormOpen && (
        <ActionBar
          userName={effectiveTaxProfile.fullName || 'User'}
          userState={effectiveTaxProfile.state || 'N/A'}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
            onUpdateInfo={() => {
              console.log('Update Info clicked - setting isInfoFormOpen to true');
              setIsInfoFormOpen(true);
            }}
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
      </div>

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