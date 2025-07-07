import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import BusinessSetupStep from './steps/BusinessSetupStep';
import ResearchExplorerStep from './steps/ResearchExplorerStep';
import ResearchDesignStep from './steps/ResearchDesignStep';
import EmployeeSetupStep from './steps/EmployeeSetupStep';
import ExpenseEntryStep from './steps/ExpenseEntryStep';
import CalculationStep from './steps/CalculationStep';
import ReportStep from './steps/ReportStep';
import { toast } from 'react-hot-toast';
import { RDBusinessService } from '../../services/rdBusinessService';

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
    title: 'Employees',
    description: 'Add employees and their time allocation'
  },
  {
    title: 'Expenses',
    description: 'Enter supplies and contractor expenses'
  },
  {
    title: 'Calculations',
    description: 'Review and calculate your R&D tax credit'
  },
  {
    title: 'Report',
    description: 'Generate your final R&D tax credit report'
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
          setWizardState(prev => ({
            ...prev,
            business: rdBusiness,
            selectedYear: rdBusiness.rd_business_years?.[0] || null
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
            // Create a default business year
            const { data: businessYear, error: yearError } = await supabase
              .from('rd_business_years')
              .insert({
                business_id: newRdBusiness.id,
                year: new Date().getFullYear(),
                gross_receipts: unifiedBusiness.annual_revenue || 0,
                total_qre: 0
              })
              .select()
              .single();

            if (yearError) {
              console.error('Error creating R&D business year:', yearError);
              throw yearError;
            }

            console.log('✅ Created R&D business year:', businessYear);

            // Set the wizard state with the new business
            setWizardState(prev => ({
              ...prev,
              business: {
                ...newRdBusiness,
                rd_business_years: [businessYear]
              },
              selectedYear: businessYear
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
            selectedActivities={wizardState.selectedActivities}
            onUpdate={(updates) => updateWizardState(updates)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 2:
        console.log('RDTaxWizard: Rendering Research Design step with selectedActivities:', wizardState.selectedActivities);
        console.log('RDTaxWizard: businessYearId:', wizardState.selectedYear?.id);
        return (
          <ResearchDesignStep
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
          <ExpenseEntryStep
            supplies={wizardState.supplies}
            contractors={wizardState.contractors}
            onUpdate={(updates) => updateWizardState(updates)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <CalculationStep
            wizardState={wizardState}
            onUpdate={(updates) => updateWizardState(updates)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <ReportStep
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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">R&D Tax Credit Wizard</h2>
              <p className="text-blue-100">
                Step {wizardState.currentStep + 1} of {steps.length}: {steps[wizardState.currentStep].title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-blue-100 mb-2">
              {steps.map((step, index) => (
                <span
                  key={index}
                  className={`${
                    index <= wizardState.currentStep ? 'text-white' : 'text-blue-200'
                  } ${index === wizardState.currentStep ? 'font-semibold' : ''}`}
                >
                  {step.title}
                </span>
              ))}
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
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

        {/* Footer Navigation */}
        <div className="border-t bg-gray-50 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {steps[wizardState.currentStep].description}
            </div>
            <div className="flex space-x-3">
              {wizardState.currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
              )}
              {wizardState.currentStep < steps.length - 1 && (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RDTaxWizard; 