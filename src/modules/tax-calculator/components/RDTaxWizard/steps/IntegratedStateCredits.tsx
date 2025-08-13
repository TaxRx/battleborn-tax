import React, { useState, useEffect } from 'react';
import { getStateConfig, getAvailableStates } from '../../StateProForma';
import { StateCreditDataService, saveStateProFormaData, loadStateProFormaData } from '../../../services/stateCreditDataService'; // Same as Filing Guide
import { StateProFormaCalculationService } from '../../../services/stateProFormaCalculationService'; // Enhanced service
import { StateCreditProForma } from '../../StateProForma/StateCreditProForma';

interface IntegratedStateCreditsProps {
  selectedYear: any;
  businessData: any;
  wizardState: any; // Get business state from wizard state like CalculationStep does
  qreDataHash?: string; // Hash of QRE data to trigger reload when data changes
  includeStateEnabled?: boolean;
  onToggleIncludeState?: (v: boolean) => void;
}

export const IntegratedStateCredits: React.FC<IntegratedStateCreditsProps> = ({
  selectedYear,
  businessData,
  wizardState,
  qreDataHash,
  includeStateEnabled = true,
  onToggleIncludeState
}) => {
  // Get business state from wizardState like CalculationStep does (prioritize domicile_state, then contact_info.state)
  const businessState = wizardState?.business?.domicile_state || wizardState?.business?.contact_info?.state || wizardState?.business?.state || 'CA';
  
  console.log('🔍 IntegratedStateCredits - Full wizardState.business object:', wizardState?.business);
  console.log('🔍 IntegratedStateCredits - Business state determination:', {
    domicile_state: wizardState?.business?.domicile_state,
    contact_info_state: wizardState?.business?.contact_info?.state,
    contact_info_full: wizardState?.business?.contact_info,
    legacy_state: wizardState?.business?.state,
    final_businessState: businessState,
    wizardState_keys: wizardState ? Object.keys(wizardState) : 'wizardState is null/undefined',
    business_keys: wizardState?.business ? Object.keys(wizardState.business) : 'business is null/undefined'
  });
  
  // Use business state for this form
  const [state, setState] = useState(businessState);
  const [method, setMethod] = useState('standard');
  const [currentStateConfig, setCurrentStateConfig] = useState(null);
  const [availableLines, setAvailableLines] = useState([]);
  const [proFormaData, setProFormaData] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalCredit, setTotalCredit] = useState(0);
  const [showProForma, setShowProForma] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Get available state codes from the StateConfig objects
  const availableStates = getAvailableStates().map(config => config.code);

  // Load state configuration when state changes
  useEffect(() => {
    if (state) {
      const config = getStateConfig(state);
      setCurrentStateConfig(config);
      
      if (config) {
        // Get available lines based on current method
        const formConfig = config.forms?.[method];
        if (formConfig?.lines) {
          setAvailableLines(formConfig.lines);
        } else {
          // Fallback to default lines if available
          setAvailableLines([]);
        }
        console.log('🔍 State Config - Loaded for state:', state, 'Method:', method, 'Lines:', formConfig?.lines?.length || 0);
      } else {
        console.warn('🔍 State Config - No configuration found for state:', state);
        setAvailableLines([]);
      }
    }
  }, [state, method]);

  // 🔧 FIXED: Load REAL base QRE data for the form AND calculate final credit using real pro forma logic
  useEffect(() => {
    const loadProFormaData = async () => {
      if (!selectedYear?.id || !state) {
        setProFormaData({});
        setTotalCredit(0);
        return;
      }

      if (!availableLines.length) {
        console.log('⚠️ IntegratedStateCredits - No available lines for state:', state, 'method:', method);
        setProFormaData({});
        setTotalCredit(0);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 IntegratedStateCredits - Loading base QRE data AND calculating real pro forma credit for state:', state);
        console.log('🔧 IntegratedStateCredits - QRE Data Hash:', qreDataHash);
        
        // 🔧 Step 1: Load base QRE data for the form (same as Filing Guide)
        const baseQREData = await StateCreditDataService.getAggregatedQREData(selectedYear.id);
        console.log('🔍 IntegratedStateCredits - Base QRE data for form:', baseQREData);
        
        // 🔧 Step 2: Calculate final credit using REAL pro forma logic
        const realProFormaResult = await StateProFormaCalculationService.getStateCreditsFromProForma(
          selectedYear.id, 
          state, 
          method
        );
        console.log('🔍 IntegratedStateCredits - REAL Pro forma result:', realProFormaResult);
        
        // Extract the calculated final credit from the real pro forma
        const calculatedCredit = realProFormaResult.total || 0;
        
        console.log(`🔍 IntegratedStateCredits - REAL Final credit for ${state}: $${calculatedCredit}`);
        
        // 🔧 Step 3: Merge saved data if present, otherwise use base data + calculated fields
        let initialData = baseQREData || {};
        // Load any previously saved state pro forma data for this year/state/method
        const saved = await loadStateProFormaData(selectedYear.id, state, method as 'standard' | 'alternative');
        if (saved) {
          initialData = { ...initialData, ...saved };
          console.log('✅ IntegratedStateCredits - Loaded saved state pro forma data and merged with base');
        }

        if (initialData && (initialData.wages || initialData.contractResearch || initialData.supplies)) {
          // Pre-calculate derived fields for editable lines based on their calc functions
          const formDataWithCalculatedFields = { ...initialData };
          
          // Calculate values for editable fields that have calc functions
          console.log(`🔧 IntegratedStateCredits - Processing ${availableLines.length} lines for field calculations`);
          availableLines.forEach(line => {
            if (line.editable && line.calc) {
              const calculatedValue = line.calc(initialData as any);
              formDataWithCalculatedFields[line.field] = calculatedValue;
              console.log(`🔧 IntegratedStateCredits - Pre-calculated ${line.field}: ${calculatedValue} (from line: ${line.line}, label: ${line.label})`);
            } else if (line.editable) {
              console.log(`🔧 IntegratedStateCredits - Editable field ${line.field} has no calc function (line: ${line.line})`);
            }
          });
          
          setProFormaData(formDataWithCalculatedFields);
          console.log('✅ IntegratedStateCredits - Form populated with base QRE data and calculated fields');
        } else {
          console.log('⚠️ IntegratedStateCredits - No QRE data available');
          setProFormaData({});
        }
        
        // Use the calculated credit for the summary
        setTotalCredit(calculatedCredit);
        
      } catch (error) {
        console.error('🔍 IntegratedStateCredits - Error loading data:', error);
        setTotalCredit(0);
        setProFormaData({});
      } finally {
        setLoading(false);
      }
    };

    loadProFormaData();
  }, [selectedYear?.id, state, method, qreDataHash, availableLines]);

  // Update state when business state changes from wizard
  useEffect(() => {
    if (businessState && businessState !== state) {
      setState(businessState);
    }
  }, [businessState]);

  // Save handler - persist to rd_state_proforma_data so Filing Guide can consume
  const handleSaveStateProForma = async (data: Record<string, number>, businessYearId: string) => {
    try {
      setProFormaData(data);
      await saveStateProFormaData(businessYearId, state, method as 'standard' | 'alternative', data);
      console.log('✅ [IntegratedStateCredits] State pro forma data saved to database');
    } catch (error) {
      console.error('❌ [IntegratedStateCredits] Error updating state pro forma data:', error);
    }
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    // Keep current data but reload for new state
  };

  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    // Keep current data but reload for new method
  };

  if (!selectedYear?.id) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">⚠️ No Business Year Selected</h3>
          <p className="text-yellow-700">Please select a business year to view state credits.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">📊</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">State Credits Pro Forma</h3>
            <p className="text-sm text-gray-600">Integrated state credit calculations using real R&D data (same as Filing Guide)</p>
          </div>
          <div className="text-right ml-auto">
            <div className="text-sm text-gray-600">Total State</div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(includeStateEnabled ? totalCredit : 0)}</div>
          </div>
        </div>

        {/* State and Method Selectors */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <select
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {availableStates.map(stateCode => (
                <option key={stateCode} value={stateCode}>
                  {stateCode}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Method
            </label>
            <select
              value={method}
              onChange={(e) => handleMethodChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="standard">Standard</option>
              {currentStateConfig?.hasAlternativeMethod && (
                <option value="alternative">Alternative</option>
              )}
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={() => setShowProForma(!showProForma)}
              className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              {showProForma ? 'Hide' : 'Show'} State Credit Pro Forma
            </button>
            <label className="inline-flex items-center text-sm px-3 py-2 bg-green-50 text-green-700 rounded">
              <input
                type="checkbox"
                className="mr-2"
                checked={includeStateEnabled}
                onChange={(e) => onToggleIncludeState && onToggleIncludeState(e.target.checked)}
              />
              Include State Credits (base-level)
            </label>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="state-proforma-loading p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading state data...</p>
          </div>
        ) : currentStateConfig ? (
          /* Pro Forma Component - Same as Filing Guide */
          <>
            {showProForma && (
              <StateCreditProForma
                lines={availableLines}
                initialData={proFormaData}
                onSave={handleSaveStateProForma}
                title={`${currentStateConfig.name} (${currentStateConfig.code}) State Credit – ${currentStateConfig.forms?.[method]?.name || currentStateConfig.formName} Pro Forma (${method.charAt(0).toUpperCase() + method.slice(1)})`}
                businessYearId={selectedYear?.id}
                // Pass validation rules and metadata
                validationRules={currentStateConfig.validationRules}
                alternativeValidationRules={currentStateConfig.alternativeValidationRules}
                hasAlternativeMethod={currentStateConfig.hasAlternativeMethod}
                creditRate={currentStateConfig.creditRate}
                creditType={currentStateConfig.creditType}
                formReference={currentStateConfig.formReference}
                notes={currentStateConfig.notes}
                totalCredit={totalCredit} // Pass the calculated total credit
              />
            )}
          </>
        ) : (
          <div className="state-proforma-error p-8 text-center">
            <div className="text-red-600 text-lg">❌</div>
            <h3 className="text-red-800 font-medium mt-2">No State Configuration Available</h3>
            <p className="text-red-700">
              No state configuration available for {state}. Please select a different state.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 