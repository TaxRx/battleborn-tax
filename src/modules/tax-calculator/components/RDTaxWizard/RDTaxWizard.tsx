import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import BusinessSetupStep from './steps/BusinessSetupStep';
import ResearchExplorerStep from './steps/ResearchExplorerStep';
import ResearchDesignStep from './steps/ResearchDesignStep';
import EmployeeSetupStep from './steps/EmployeeSetupStep';
import CalculationStep from './steps/CalculationStep';
import ReportStep from './steps/ReportStep';
import ReportsStep from './steps/ReportsStep';
import { toast } from 'react-hot-toast';
import { RDBusinessService } from '../../services/rdBusinessService';
import { FilingGuideModal } from '../FilingGuide/FilingGuideModal';
import ResearchReportModal from '../ResearchReport/ResearchReportModal';
import AllocationReportModal from '../AllocationReport/AllocationReportModal';
import { StateProFormaCalculationService } from '../../services/stateProFormaCalculationService'; // NEW: For real state credit calculations
import { StateCreditDataService } from '../../services/stateCreditDataService'; // NEW: For base QRE data

// Helper function to get URL parameters
const getUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    clientId: urlParams.get('clientId'),
    businessId: urlParams.get('businessId')
  };
};

interface RDTaxWizardProps {
  onClose: () => void;
  businessId?: string;
  startStep?: number;
  isModal?: boolean;
}

interface WizardState {
  currentStep: number;
  business: any;
  selectedYear: any;
  selectedActivities: any[];
  employees: any[];
  supplies: any[];
  contractors: any[];
  calculations: any;
  isComplete: boolean;
}

const steps = [
  {
    title: 'Business Setup',
    description: 'Configure your business information and historical data'
  },
  {
    title: 'Research Activities',
    description: 'Select the research activities your business performs'
  },
  {
    title: 'Research Design',
    description: 'Define the research components and their percentages'
  },
  {
    title: 'Employee Management',
    description: 'Manage employees and their R&D allocations'
  },
  {
    title: 'Calculations',
    description: 'Review and calculate your R&D tax credit'
  },
  {
    title: 'Reports',
    description: 'Generate reports and manage document delivery'
  }
];

const RDTaxWizard: React.FC<RDTaxWizardProps> = ({ onClose, businessId, startStep = 0, isModal }) => {
  console.log('🎯 RDTaxWizard component loaded with props:', { businessId, startStep });
  
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: startStep,
    business: null,
    selectedYear: null,
    selectedActivities: [],
    employees: [],
    supplies: [],
    contractors: [],
    calculations: null,
    isComplete: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFilingGuideOpen, setIsFilingGuideOpen] = useState(false);
  const [isResearchReportOpen, setIsResearchReportOpen] = useState(false);
  const [isAllocationReportOpen, setIsAllocationReportOpen] = useState(false);

  // 🔧 NEW: Real state credits for footer display (using StateProFormaCalculationService)
  const [realStateCredits, setRealStateCredits] = useState<number>(0);

  // Add state for client data and business selector
  const [clientData, setClientData] = useState<any>(null);
  const [availableBusinesses, setAvailableBusinesses] = useState<any[]>([]);
  const [showBusinessSelector, setShowBusinessSelector] = useState(false);

  // CRITICAL: Use a key to force component remount when business changes
  // This ensures complete isolation between different business files
  const [componentKey, setComponentKey] = useState(0);
  const lastBusinessIdRef = useRef<string>('');
  const businessSelectorRef = useRef<HTMLDivElement>(null);

  // CRITICAL: Reset wizard state when businessId changes to prevent data leakage
  useEffect(() => {
    console.log('🔄 Business ID changed, resetting wizard state:', { businessId });
    
    // Only reset if this is actually a different business (not initial load)
    if (lastBusinessIdRef.current && businessId !== lastBusinessIdRef.current) {
      console.log('🔄 Different business detected, forcing complete component reset');
      
      // Force component remount by changing key - this unmounts and remounts all child components
      setComponentKey(prev => prev + 1);
    }
    
    // Reset wizard state to initial state
    setWizardState({
      currentStep: startStep,
      business: null,
      selectedYear: null,
      selectedActivities: [],
      employees: [],
      supplies: [],
      contractors: [],
      calculations: null,
      isComplete: false
    });
    
    // Clear any error states
    setError(null);
    setLoading(false);
    
    // Update ref for next comparison
    lastBusinessIdRef.current = businessId || '';
    
    console.log('✅ Wizard state reset for new business');
  }, [businessId, startStep]);

  // Get current user ID on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    getCurrentUser();
  }, []);

  // Load business data from URL parameters or props
  useEffect(() => {
    const loadBusinessData = async () => {
      console.log('🔄 loadBusinessData called');
      
      // Get URL parameters
      const urlParams = getUrlParams();
      const urlBusinessId = urlParams.businessId;
      const urlClientId = urlParams.clientId;
      
      console.log('📋 URL parameters:', { urlBusinessId, urlClientId });
      
      // Use businessId from props or URL parameters
      const targetBusinessId = businessId || urlBusinessId;
      
      console.log('🎯 Target business ID:', targetBusinessId);
      
      if (!targetBusinessId) {
        console.log('No business ID provided, starting fresh wizard');
        return;
      }

      try {
        // First, try to find the business in the R&D system
        const { data: rdBusiness, error: rdError } = await supabase
          .from('rd_businesses')
          .select('*, rd_business_years(*)')
          .eq('id', targetBusinessId)
          .maybeSingle();

        if (rdError) {
          console.error('Error loading R&D business:', rdError);
          throw rdError;
        }

        if (rdBusiness) {
          console.log('✅ Found existing R&D business:', rdBusiness);
          
          // Find the current year (2025) or the most recent year
          const currentYear = new Date().getFullYear();
          const businessYears = rdBusiness.rd_business_years || [];
          const currentYearData = businessYears.find(by => by.year === currentYear) || 
                                 businessYears.sort((a, b) => b.year - a.year)[0] || 
                                 null;
          
          console.log('📅 Setting selected year to:', currentYearData?.year || 'none');
          
          setWizardState(prev => ({
            ...prev,
            business: rdBusiness,
            selectedYear: currentYearData
          }));
          return;
        }

        // If not found in R&D system, check if it's a business from the unified system
        console.log('🔍 Business not found in R&D system, checking unified system...');
        
        const { data: unifiedBusiness, error: unifiedError } = await supabase
          .from('businesses')
          .select(`
            *,
            clients (
              id,
              full_name,
              email
            )
          `)
          .eq('id', targetBusinessId)
          .maybeSingle();

        if (unifiedError) {
          console.error('Error loading unified business:', unifiedError);
          throw unifiedError;
        }

        if (unifiedBusiness) {
          console.log('✅ Found business in unified system:', unifiedBusiness);
          // Use clientId from unifiedBusiness.clients.id
          const clientId = unifiedBusiness.clients?.id;
          if (!clientId) {
            throw new Error('Unified business is missing clientId');
          }
          // Enroll business in rd_businesses
          try {
            console.log('[RDTaxWizard] Calling enrollBusinessFromExisting', { businessId: unifiedBusiness.id, clientId });
            const newRdBusiness = await RDBusinessService.enrollBusinessFromExisting(unifiedBusiness.id, clientId);
            console.log('[RDTaxWizard] enrollBusinessFromExisting result', newRdBusiness);
            
            // CRITICAL FIX: Check if business years already exist before creating new ones
            const { data: existingBusinessYears, error: existingYearsError } = await supabase
              .from('rd_business_years')
              .select('*')
              .eq('business_id', newRdBusiness.id)
              .order('year', { ascending: false });

            if (existingYearsError) {
              console.error('Error checking existing business years:', existingYearsError);
              throw existingYearsError;
            }

            console.log('📊 Existing business years found:', existingBusinessYears?.length || 0);
            
            let currentYearData = null;
            const currentYear = new Date().getFullYear();
            
            if (existingBusinessYears && existingBusinessYears.length > 0) {
              // Use existing business years - find current year or most recent
              currentYearData = existingBusinessYears.find(by => by.year === currentYear) || 
                               existingBusinessYears[0];
              console.log('✅ Using existing business year:', currentYearData.year);
            } else {
              // Only create a new business year if none exist
              console.log('📅 No existing business years found, creating default for', currentYear);
              const { data: businessYear, error: yearError } = await supabase
                .from('rd_business_years')
                .insert({
                  business_id: newRdBusiness.id,
                  year: currentYear,
                  gross_receipts: unifiedBusiness.annual_revenue || 0,
                  total_qre: 0
                })
                .select()
                .single();

              if (yearError) {
                console.error('Error creating R&D business year:', yearError);
                throw yearError;
              }

              console.log('✅ Created new R&D business year:', businessYear);
              currentYearData = businessYear;
            }

            // Set the wizard state with the business and existing/new business years
            setWizardState(prev => ({
              ...prev,
              business: {
                ...newRdBusiness,
                rd_business_years: existingBusinessYears || [currentYearData]
              },
              selectedYear: currentYearData
            }));
          } catch (error) {
            console.error('Error enrolling business in rd_businesses:', error, { businessId: unifiedBusiness.id, clientId });
            throw error;
          }
        } else {
          // If not found in either system, create a new R&D business
          console.log('Creating new R&D business for business ID:', targetBusinessId);
          
          // Get current user ID
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id;
          
          if (!userId) {
            throw new Error('User not authenticated');
          }

          // Create a new R&D business
          try {
            console.log('[RDTaxWizard] Cannot create new business without existing business ID', { businessId, clientId });
            throw new Error('Cannot create new R&D business without existing business ID');
          } catch (error) {
            console.error('[RDTaxWizard] Error enrolling business', error);
            throw error;
          }
        }

      } catch (error) {
        console.error('Error loading business data:', error);
        toast.error('Error loading business data. Please try again.');
      }
    };

    loadBusinessData();
  }, [businessId]);

  // Load client and businesses data
  useEffect(() => {
    const loadClientAndBusinesses = async () => {
      if (!wizardState.business?.id) return;

      try {
        // Get client data by finding which client owns this business
        const { data: clientBusinesses, error: cbError } = await supabase
          .from('rd_businesses')
          .select(`
            *,
            clients (
              id,
              business_name,
              first_name,
              last_name,
              company_name
            )
          `)
          .eq('id', wizardState.business.id)
          .single();

        if (cbError) {
          console.error('Error loading client data:', cbError);
          return;
        }

        if (clientBusinesses) {
          setClientData(clientBusinesses.clients);
          
          // Load all businesses for this client
          const { data: businesses, error: bError } = await supabase
            .from('rd_businesses')
            .select('id, name, contact_info')
            .eq('client_id', clientBusinesses.clients.id)
            .order('name');

          if (!bError && businesses) {
            setAvailableBusinesses(businesses);
          }
        }
      } catch (error) {
        console.error('Error loading client and businesses:', error);
      }
    };

    loadClientAndBusinesses();
  }, [wizardState.business?.id]);

  // Close business selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (businessSelectorRef.current && !businessSelectorRef.current.contains(event.target as Node)) {
        setShowBusinessSelector(false);
      }
    };

    if (showBusinessSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showBusinessSelector]);

  // 🔧 FIXED: Use exact same logic as working IntegratedStateCredits for footer display
  useEffect(() => {
    const calculateRealStateCredits = async () => {
      // Use same conditions as IntegratedStateCredits - only need selectedYear and business state
      if (!wizardState.selectedYear?.id || !wizardState.business?.state) {
        console.log('🔍 Footer State Credits - Missing data:', {
          selectedYearId: wizardState.selectedYear?.id,
          businessState: wizardState.business?.state,
          fullBusiness: wizardState.business
        });
        setRealStateCredits(0);
        return;
      }

      try {
        console.log('🔍 Footer State Credits - Starting calculation with:', {
          selectedYearId: wizardState.selectedYear?.id,
          businessState: wizardState.business?.state,
          wizardStep: wizardState.currentStep
        });
        
        const businessState = wizardState.business?.state || wizardState.business?.contact_info?.state || 'CA';
        console.log('🔍 Footer State Credits - Business state:', businessState);
        
        // 🔧 EXACT SAME LOGIC as IntegratedStateCredits - Step 1: Load base QRE data 
        const baseQREData = await StateCreditDataService.getAggregatedQREData(wizardState.selectedYear.id);
        console.log('🔍 Footer State Credits - Base QRE data:', baseQREData);
        
        // 🔧 EXACT SAME LOGIC as IntegratedStateCredits - Step 2: Calculate final credit using REAL pro forma logic
        const realProFormaResult = await StateProFormaCalculationService.getStateCreditsFromProForma(
          wizardState.selectedYear.id, 
          businessState, 
          'Standard' // Use same method as IntegratedStateCredits
        );
        console.log('🔍 Footer State Credits - REAL Pro forma result:', realProFormaResult);
        
        // 🔧 EXACT SAME LOGIC as IntegratedStateCredits - Extract the calculated final credit from the real pro forma
        const calculatedCredit = realProFormaResult.total || 0;
        console.log(`🔍 Footer State Credits - REAL Final credit for ${businessState}: $${calculatedCredit}`);
        
        setRealStateCredits(calculatedCredit);
        
      } catch (error) {
        console.error('🔍 Footer State Credits - Error calculating real state credits:', error);
        setRealStateCredits(0);
      }
    };

    // Only calculate if we're on step 4+ (calculation step) to avoid unnecessary calls
    if (wizardState.currentStep >= 4) {
      calculateRealStateCredits();
    } else {
      console.log('🔍 Footer State Credits - Skipping calculation, not on calculation step yet:', wizardState.currentStep);
      setRealStateCredits(0);
    }
  }, [wizardState.selectedYear?.id, wizardState.business?.state, wizardState.currentStep]); // Added currentStep to dependencies

  const handleNext = () => {
    if (wizardState.currentStep < steps.length - 1) {
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    }
  };

  const handlePrevious = () => {
    if (wizardState.currentStep > 0) {
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  };

  const updateWizardState = (updates: Partial<WizardState>) => {
    console.log('RDTaxWizard: Updating wizard state with:', updates);
    setWizardState(prev => {
      const newState = { ...prev, ...updates };
      console.log('RDTaxWizard: New wizard state:', newState);
      return newState;
    });
  };

  const renderCurrentStep = () => {
    switch (wizardState.currentStep) {
      case 0:
        return (
          <BusinessSetupStep
            key={componentKey} // Add key to force remount
            business={wizardState.business}
            selectedYear={wizardState.selectedYear}
            onUpdate={(updates) => updateWizardState(updates)}
            onNext={handleNext}
            userId={userId || undefined}
          />
        );
      case 1:
        return (
          <ResearchExplorerStep
            key={componentKey} // Add key to force remount
            selectedActivities={wizardState.selectedActivities}
            onUpdate={(updates) => updateWizardState(updates)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            businessId={businessId}
            businessYearId={wizardState.selectedYear?.id}
            parentSelectedYear={wizardState.selectedYear?.year}
          />
        );
      case 2:
        console.log('RDTaxWizard: Rendering Research Design step with selectedActivities:', wizardState.selectedActivities);
        console.log('RDTaxWizard: businessYearId:', wizardState.selectedYear?.id);
        return (
          <ResearchDesignStep
            key={componentKey} // Add key to force remount
            selectedActivities={wizardState.selectedActivities}
            businessYearId={wizardState.selectedYear?.id || ''}
            businessId={wizardState.business?.id}
            year={wizardState.selectedYear?.year}
            onUpdate={(updates) => updateWizardState(updates)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <EmployeeSetupStep
            key={componentKey} // Add key to force remount
            employees={wizardState.employees}
            onUpdate={(updates) => updateWizardState(updates)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            businessYearId={wizardState.selectedYear?.id || ''}
            businessId={wizardState.business?.id || ''}
          />
        );
      case 4:
        return (
          <CalculationStep
            key={componentKey} // Add key to force remount
            wizardState={wizardState}
            onUpdate={(updates) => updateWizardState(updates)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <ReportsStep
            key={componentKey} // Add key to force remount
            wizardState={wizardState}
            onComplete={onClose}
            onPrevious={handlePrevious}
          />
        );
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div
      className={isModal ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 m-0" : "h-full flex flex-col"}
      style={isModal ? { minHeight: '100vh', minWidth: '100vw' } : {}}
    >
      <div
        className={isModal ? "bg-white rounded-lg shadow-xl w-[95vw] h-[98vh] flex flex-col overflow-hidden" : "bg-white h-full flex flex-col overflow-hidden"}
        style={isModal ? { minHeight: '90vh', minWidth: '90vw' } : {}}
      >
        {/* Header - Updated to match Dark Blue Gradient */}
        <div className="bg-gradient-to-r from-[#1a1a3f] to-[#2d2d67] text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">R&D Tax Credit Wizard</h2>
              <p className="text-blue-100">
                Step {wizardState.currentStep + 1} of {steps.length}: {steps[wizardState.currentStep].title}
              </p>
            </div>
            
            {/* Client Name and Business Selector - Right Aligned */}
            <div className="text-right">
              {clientData && (
                <>
                  <div className="text-lg font-semibold text-white mb-1">
                    {clientData.company_name || `${clientData.first_name} ${clientData.last_name}`}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowBusinessSelector(!showBusinessSelector)}
                      className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors"
                    >
                      <span className="text-sm">
                        {wizardState.business?.name || 'Business Name'}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Business Dropdown */}
                    {showBusinessSelector && availableBusinesses.length > 1 && (
                      <div ref={businessSelectorRef} className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-60 z-50">
                        <div className="py-1">
                          {availableBusinesses.map((business) => (
                            <button
                              key={business.id}
                              onClick={() => {
                                // Navigate to new business
                                const url = new URL(window.location.href);
                                url.searchParams.set('businessId', business.id);
                                window.location.href = url.toString();
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                business.id === wizardState.business?.id 
                                  ? 'bg-blue-50 text-blue-700 font-medium' 
                                  : 'text-gray-700'
                              }`}
                            >
                              <div className="font-medium">{business.name}</div>
                              {business.contact_info?.state && (
                                <div className="text-xs text-gray-500">{business.contact_info.state}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {isModal && (
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors ml-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Clickable Progress Steps */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-blue-100 mb-2">
              {steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setWizardState(prev => ({
                      ...prev,
                      currentStep: index
                    }));
                  }}
                  className={`hover:text-white transition-colors cursor-pointer text-left ${
                    index <= wizardState.currentStep ? 'text-white' : 'text-blue-200'
                  } ${index === wizardState.currentStep ? 'font-semibold' : ''}`}
                  title={`Go to ${step.title}`}
                >
                  {step.title}
                </button>
              ))}
            </div>
            <div className="w-full bg-blue-200/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${((wizardState.currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading business data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            renderCurrentStep()
          )}
        </div>

        {/* Footer Navigation - Updated to match Tax Calculator Dark Bar */}
        <div className="bg-gradient-to-r from-[#1a1a3f] to-[#2d2d67] px-6 py-4 flex-shrink-0 text-white">
          <div className="flex justify-between items-center">
            {/* Left side - Practice Name, State, and Report Buttons */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">
                  {wizardState.business?.name || 'Business Setup'}
                </span>
                {wizardState.business?.contact_info?.state && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-300">
                      {wizardState.business.contact_info.state}
                    </span>
                  </>
                )}
              </div>
              
              {/* Subtle Report Buttons */}
              <div className="flex items-center space-x-2">
                {/* Research Report Button (Steps 2-3 - Research Explorer & Research Design) */}
                {(wizardState.currentStep === 1 || wizardState.currentStep === 2) && (
                  <button
                    onClick={() => setIsResearchReportOpen(true)}
                    className="px-3 py-1.5 text-xs bg-white/10 text-blue-200 rounded-md hover:bg-white/20 hover:text-white transition-colors border border-white/20"
                    title="Generate Research Report"
                  >
                    Research Report
                  </button>
                )}
                
                {/* Allocation Report & Export CSV Button (Step 4 - Expense Management) */}
                {wizardState.currentStep === 3 && (
                  <>
                    <button
                      onClick={() => setIsAllocationReportOpen(true)}
                      className="px-3 py-1.5 text-xs bg-white/10 text-blue-200 rounded-md hover:bg-white/20 hover:text-white transition-colors border border-white/20"
                      title="Generate Allocation Report"
                    >
                      Allocation Report
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { ExpenseManagementService } = await import('../../../../services/expenseManagementService');
                          const csvData = await ExpenseManagementService.exportExpensesToCSV(wizardState.selectedYear?.id);
                          const blob = new Blob([csvData], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `rd_expenses_${wizardState.selectedYear?.year || new Date().getFullYear()}.csv`;
                          a.click();
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Error exporting CSV:', error);
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-white/10 text-blue-200 rounded-md hover:bg-white/20 hover:text-white transition-colors border border-white/20"
                      title="Export CSV"
                    >
                      Export CSV
                    </button>
                  </>
                )}
                
                {/* Filing Guide Button (Step 5 - Reports) */}
                {wizardState.currentStep === 5 && wizardState.calculations && (
                  <button
                    onClick={() => setIsFilingGuideOpen(true)}
                    className="px-3 py-1.5 text-xs bg-white/10 text-blue-200 rounded-md hover:bg-white/20 hover:text-white transition-colors border border-white/20"
                    title="Generate Filing Guide"
                  >
                    Filing Guide
                  </button>
                )}
              </div>
            </div>

            {/* Center - Empty space for balanced layout */}
            <div className="flex items-center">
            </div>

            {/* Right side - Credits Display, Year Dropdown and Navigation buttons */}
            <div className="flex items-center space-x-3">
              {/* Credits Display (from Employee Management onward) */}
              {(wizardState.currentStep >= 3) && (
                                  <div className="flex items-center space-x-2 bg-white/10 rounded-md px-3 py-2">
                    {wizardState.calculations ? (
                      <>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-blue-200">ASC:</span>
                            <span className="text-sm font-bold text-green-300">
                              ${Math.round(wizardState.calculations.federalCredits?.asc?.adjustedCredit || wizardState.calculations.federalCredits?.asc?.credit || 0)?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-blue-200">State:</span>
                            <span className="text-sm font-bold text-purple-300">
                              ${Math.round(realStateCredits || 0)?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="border-l border-white/20 pl-4 ml-2">
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-blue-200">Total:</div>
                            <div className="text-lg font-bold text-yellow-300">
                              ${Math.round((wizardState.calculations.federalCredits?.asc?.adjustedCredit || wizardState.calculations.federalCredits?.asc?.credit || 0) + (realStateCredits || 0))?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
                        <span className="text-sm text-blue-200">Calculating credits...</span>
                      </div>
                    )}
                  </div>
              )}

              {/* Year Dropdown (when applicable) */}
              {(wizardState.currentStep === 1 || wizardState.currentStep === 2 || wizardState.currentStep === 3 || wizardState.currentStep === 4) && wizardState.selectedYear && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-blue-100">Year:</label>
                  <select
                    value={wizardState.selectedYear.year || new Date().getFullYear()}
                    onChange={async (e) => {
                      const selectedValue = e.target.value;
                      
                      if (selectedValue.startsWith('create-')) {
                        // User wants to create a new year
                        const year = parseInt(selectedValue.replace('create-', ''));
                        const confirmed = confirm(`Create business year ${year}?\n\nThis will create a new business year that you can start working on.`);
                        
                        if (!confirmed) {
                          return; // User cancelled
                        }
                        
                        try {
                          const { data: newYear } = await supabase
                            .from('rd_business_years')
                            .insert({
                              business_id: businessId,
                              year: year,
                              gross_receipts: 0,
                              total_qre: 0
                            })
                            .select('id, year')
                            .single();
                          
                          if (newYear) {
                            console.log(`✅ Created business year ${year}:`, newYear.id);
                            setWizardState(prev => ({
                              ...prev,
                              selectedYear: { id: newYear.id, year: newYear.year }
                            }));
                          }
                        } catch (error) {
                          console.error(`Failed to create business year ${year}:`, error);
                          alert(`Failed to create business year ${year}. Please try again.`);
                        }
                      } else {
                        // User selected existing business year
                        const year = parseInt(selectedValue);
                        
                        // Find existing business year
                        const { data: existingYear } = await supabase
                          .from('rd_business_years')
                          .select('id, year')
                          .eq('business_id', businessId)
                          .eq('year', year)
                          .single();
                        
                        if (existingYear) {
                          console.log(`✅ Selected existing business year ${year}:`, existingYear.id);
                          setWizardState(prev => ({
                            ...prev,
                            selectedYear: { id: existingYear.id, year: existingYear.year }
                          }));
                        }
                      }
                    }}
                    className="rounded-md border-none bg-white/10 text-white shadow-sm focus:ring-2 focus:ring-blue-400 px-3 py-1 text-sm"
                  >
                    {/* Show existing business years only, plus create options */}
                    {(() => {
                      const currentYear = new Date().getFullYear();
                      const businessYears = wizardState.business?.rd_business_years || [];
                      // FIXED: Remove duplicates to prevent React key warnings
                      const existingYears = [...new Set(businessYears.map(by => by.year))].sort((a, b) => b - a);
                      
                      const options = [];
                      
                      // Add existing business years
                      existingYears.forEach(year => {
                        const hasData = businessYears.find(by => by.year === year && (by.total_qre > 0 || by.gross_receipts > 0));
                        options.push(
                          <option key={`existing-${year}`} value={year}>
                            {year} {hasData ? '✓' : ''}
                          </option>
                        );
                      });
                      
                      // Add separator if there are existing years
                      if (existingYears.length > 0) {
                        options.push(
                          <option key="separator" disabled>── Create New Year ──</option>
                        );
                      }
                      
                      // Add create options for missing years
                      const startYear = wizardState.business?.start_year || currentYear - 3;
                      for (let year = currentYear + 1; year >= startYear; year--) {
                        if (!existingYears.includes(year)) {
                          options.push(
                            <option key={`create-${year}`} value={`create-${year}`}>
                              📅 Create {year}
                            </option>
                          );
                        }
                      }
                      
                      return options;
                    })()}
                  </select>
                </div>
              )}
              
              {/* Navigation buttons */}
              {wizardState.currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  Previous
                </button>
              )}
              {wizardState.currentStep < steps.length - 1 && (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md"
                >
                  Next
                </button>
              )}
              {wizardState.currentStep === steps.length - 1 && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-md"
                >
                  Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filing Guide Modal */}
      {isFilingGuideOpen && (
        <FilingGuideModal
          isOpen={isFilingGuideOpen}
          onClose={() => setIsFilingGuideOpen(false)}
          businessData={wizardState.business}
          selectedYear={wizardState.selectedYear}
          calculations={wizardState.calculations}
        />
      )}

      {/* Research Report Modal */}
      {isResearchReportOpen && wizardState.selectedYear && (
        <ResearchReportModal
          isOpen={isResearchReportOpen}
          onClose={() => setIsResearchReportOpen(false)}
          businessYearId={wizardState.selectedYear.id}
          businessId={wizardState.business?.id}
        />
      )}

      {/* Allocation Report Modal */}
      {isAllocationReportOpen && (
        <AllocationReportModal
          isOpen={isAllocationReportOpen}
          onClose={() => setIsAllocationReportOpen(false)}
          businessData={wizardState.business}
          selectedYear={wizardState.selectedYear}
          calculations={wizardState.calculations}
        />
      )}
    </div>
  );
};

export default RDTaxWizard; 