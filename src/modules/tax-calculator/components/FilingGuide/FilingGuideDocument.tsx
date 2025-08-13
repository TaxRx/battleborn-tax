import React, { useState, useEffect } from 'react';
import { Form6765 } from './Form6765';
import { QRESummaryTables } from './QRESummaryTables';
import { FilingProcessOverview } from './FilingProcessOverview';
import Form6765v2024 from './Form6765v2024';
import './FilingGuide.css';
import { StateCreditProForma } from '../StateProForma/StateCreditProForma';
import { getStateConfig, getAvailableStates, StateConfig } from '../StateProForma';
import { saveStateProFormaData, loadStateProFormaData, StateCreditDataService } from '../../services/stateCreditDataService';
import { FederalCreditProForma } from './FederalCreditProForma';
import { CalculationSpecifics } from './CalculationSpecifics';
import { supabase } from '../../lib/supabase';

interface FilingGuideDocumentProps {
  businessData: any;
  selectedYear: any;
  calculations: any;
  selectedMethod?: 'asc' | 'standard';
  debugData?: any;
  readOnly?: boolean; // Add read-only mode for client portal
  clientName?: string;
}

export const FilingGuideDocument: React.FC<FilingGuideDocumentProps> = ({
  businessData,
  selectedYear,
  calculations,
  selectedMethod,
  debugData,
  readOnly = false,
  clientName
}) => {
  // State for locked QRE values
  const [lockedQREValues, setLockedQREValues] = useState<{
    employee_qre: number;
    contractor_qre: number;
    supply_qre: number;
    qre_locked: boolean;
  } | null>(null);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // BRIGHT DEBUG LOGS
  // eslint-disable-next-line no-console
  console.log('%c[FILING GUIDE] businessData:', 'background: #fffb00; color: #000; font-weight: bold; padding: 2px 8px;', businessData);
  // eslint-disable-next-line no-console
  console.log('%c[FILING GUIDE] selectedYear:', 'background: #fffb00; color: #000; font-weight: bold; padding: 2px 8px;', selectedYear);
  // eslint-disable-next-line no-console
  console.log('%c[FILING GUIDE] calculations:', 'background: #fffb00; color: #000; font-weight: bold; padding: 2px 8px;', calculations);
  // eslint-disable-next-line no-console
  console.log('%c[FILING GUIDE] calculations.currentYearQRE:', 'background: #ff6b00; color: #fff; font-weight: bold; padding: 2px 8px;', calculations?.currentYearQRE);
  // eslint-disable-next-line no-console
  console.log('%c[FILING GUIDE] selectedMethod:', 'background: #fffb00; color: #000; font-weight: bold; padding: 2px 8px;', selectedMethod);
  // eslint-disable-next-line no-console
  console.log('%c[FILING GUIDE] debugData:', 'background: #fffb00; color: #000; font-weight: bold; padding: 2px 8px;', debugData);

  // Load locked QRE values for the selected year
  useEffect(() => {
    const loadLockedQREValues = async () => {
      if (!selectedYear?.id) return;
      
      try {
        console.log('🔒 FilingGuideDocument - Loading locked QRE values for year:', selectedYear.id);
        
        const { data, error } = await supabase
          .from('rd_business_years')
          .select('employee_qre, contractor_qre, supply_qre, qre_locked')
          .eq('id', selectedYear.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.warn('🔒 FilingGuideDocument - QRE columns not available, using calculated values');
            setLockedQREValues(null);
          } else {
            console.error('❌ FilingGuideDocument - Error loading locked QRE values:', error);
            setLockedQREValues(null);
          }
          return;
        }

        if (data) {
          const qreValues = {
            employee_qre: data.employee_qre || 0,
            contractor_qre: data.contractor_qre || 0,
            supply_qre: data.supply_qre || 0,
            qre_locked: data.qre_locked || false
          };
          
          console.log('🔒 FilingGuideDocument - Loaded QRE values:', qreValues);
          setLockedQREValues(qreValues);
        }
      } catch (error) {
        console.error('❌ FilingGuideDocument - Error loading locked QRE values:', error);
        setLockedQREValues(null);
      }
    };

    loadLockedQREValues();
  }, [selectedYear?.id]);

  // CRITICAL: Alert if calculations.currentYearQRE is missing
  if (!calculations?.currentYearQRE) {
    // eslint-disable-next-line no-console
    console.error('%c🚨 [FILING GUIDE] CRITICAL: calculations.currentYearQRE is missing! This will break Form6765 QRE auto-population!', 'background: #ff0000; color: #fff; font-weight: bold; padding: 4px 8px;', {
      calculations: calculations,
      hasCalculations: !!calculations,
      calculationsKeys: calculations ? Object.keys(calculations) : 'no calculations object'
    });
  }

  // Debug UI removed; keep logs only

  // Extract business state from business data (same logic as CalculationStep and IntegratedStateCredits)
  // Enhanced logic to handle different data structures
  const businessState = businessData?.domicile_state || 
                       businessData?.contact_info?.state || 
                       businessData?.state ||
                       businessData?.business?.domicile_state ||
                       businessData?.business?.contact_info?.state ||
                       businessData?.business?.state ||
                       'CA';
  
  // Reduced logging to prevent connection issues
  console.log('📍 [Filing Guide] Business state:', businessState);
  
  const [state, setState] = useState(businessState);
  const [method, setMethod] = useState('standard'); // Always start with standard
  const [stateProFormaData, setStateProFormaData] = useState<Record<string, number>>({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [ownerSplits, setOwnerSplits] = useState<Array<{ name: string; percent: number; amount: number }>>([]);

  // Load owners for selected year; if none, fall back to most recent prior year
  useEffect(() => {
    const loadOwners = async () => {
      if (!businessData?.id || !selectedYear?.year || !calculations) {
        setOwnerSplits([]);
        return;
      }
      const bizId = businessData.id;
      const targetYear = selectedYear.year;
      // Fetch owners at target year
      const { data: exact } = await supabase
        .from('rd_business_owners')
        .select('owner_name, ownership_percent, year')
        .eq('business_id', bizId)
        .eq('year', targetYear)
        .order('owner_name', { ascending: true });
      let owners = exact || [];
      if (!owners.length) {
        // Fall back to most recent prior year
        const { data: prior } = await supabase
          .from('rd_business_owners')
          .select('owner_name, ownership_percent, year')
          .eq('business_id', bizId)
          .lt('year', targetYear)
          .order('year', { ascending: false })
          .limit(1000);
        // Group by owner_name; pick first occurrence (latest year)
        const seen: Record<string, boolean> = {};
        owners = (prior || []).filter((o) => {
          if (seen[o.owner_name]) return false;
          seen[o.owner_name] = true;
          return true;
        });
      }
      const totalCredit = Math.round((calculations?.totalCredits || 0));
      const splits = owners.map((o) => ({
        name: o.owner_name,
        percent: Number(o.ownership_percent || 0),
        amount: Math.round(totalCredit * Number(o.ownership_percent || 0) / 100)
      }));
      setOwnerSplits(splits);
    };
    loadOwners();
  }, [businessData?.id, selectedYear?.year, calculations?.totalCredits]);

  // Update state when business data changes - enhanced logic
  useEffect(() => {
    const newBusinessState = businessData?.domicile_state || 
                             businessData?.contact_info?.state || 
                             businessData?.state ||
                             businessData?.business?.domicile_state ||
                             businessData?.business?.contact_info?.state ||
                             businessData?.business?.state ||
                             'CA';
    if (newBusinessState !== state) {
      setState(newBusinessState);
    }
  }, [businessData, state]);

  const availableStates = getAvailableStates();
  const currentStateConfig = getStateConfig(state);
  
  // Sync state method with federal selectedMethod, with proper fallback
  useEffect(() => {
    if (selectedMethod && currentStateConfig) {
      let stateMethod = selectedMethod === 'asc' ? 'alternative' : 'standard';
      
      // CRITICAL: If state doesn't support alternative method, use standard
      if (stateMethod === 'alternative' && !currentStateConfig.hasAlternativeMethod) {
        stateMethod = 'standard';
        console.log('[FilingGuideDocument] State', state, 'does not support alternative method, using standard');
      }
      
      if (stateMethod !== method) {
        setMethod(stateMethod);
        console.log('[FilingGuideDocument] Synced state method with federal method:', selectedMethod, '->', stateMethod);
      }
    }
  }, [selectedMethod, currentStateConfig, state]);
  
  // Update data when method changes
  useEffect(() => {
    // This will trigger the data loading useEffect when method changes
    console.log('[FilingGuideDocument] Method changed to:', method);
  }, [method]);
  
  // Get lines from the appropriate form method
  const availableLines = currentStateConfig?.forms?.[method]?.lines || [];
  
  // Enhanced debug logging
  console.log('[FilingGuideDocument] State Pro Forma Debug:', {
    state,
    method,
    selectedMethod,
    currentStateConfig: !!currentStateConfig,
    hasAlternativeMethod: currentStateConfig?.hasAlternativeMethod,
    availableLines: availableLines.length,
    stateProFormaData: Object.keys(stateProFormaData).length,
    isLoadingData
  });

  // Load existing data when state or method changes
  useEffect(() => {
    let isMounted = true;
    
    const loadExistingData = async () => {
      if (!businessData?.client_id || !selectedYear?.id || !isMounted) {
        return;
      }
      
      setIsLoadingData(true);
      try {
        // Try to load existing saved data first
        const existingData = await loadStateProFormaData(
          selectedYear.id,
          state,
          method as 'standard' | 'alternative'
        );
        
        if (existingData && Object.keys(existingData).length > 0) {
          if (isMounted) setStateProFormaData(existingData);
        } else {
          // Check if we have available lines to display
          if (!availableLines.length) {
            console.log('⚠️ Filing Guide - No available lines for state:', state, 'method:', method);
            if (isMounted) setStateProFormaData({});
            return;
          }
          
          // Load base data using StateCreditDataService with timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          );
          
          const baseData = await Promise.race([
            StateCreditDataService.getAggregatedQREData(selectedYear.id),
            timeoutPromise
          ]);
          
          if (!baseData || (baseData.wages === 0 && baseData.supplies === 0)) {
            if (isMounted) setStateProFormaData({});
            return;
          }
          
          // Convert to the format expected by the pro forma WITH pre-calculated fields (like IntegratedStateCredits)
          const formattedData = {
            wages: baseData.wages || 0,
            supplies: baseData.supplies || 0,
            contractResearch: baseData.contractResearch || 0,
            computerLeases: baseData.computerLeases || 0,
            avgGrossReceipts: baseData.avgGrossReceipts || 0,
            businessEntityType: baseData.businessEntityType || 'Corporation',
          };
          
          // CRITICAL: Pre-calculate derived fields for editable lines (same as IntegratedStateCredits)
          console.log(`🔧 Filing Guide - Processing ${availableLines.length} lines for field calculations`);
          availableLines.forEach(line => {
            if (line.editable && line.calc) {
              const calculatedValue = line.calc(formattedData);
              formattedData[line.field] = calculatedValue;
              console.log(`🔧 Filing Guide - Pre-calculated ${line.field}: ${calculatedValue} (from line: ${line.line}, label: ${line.label})`);
            } else if (line.editable) {
              console.log(`🔧 Filing Guide - Editable field ${line.field} has no calc function (line: ${line.line})`);
            }
          });
          
          console.log('✅ Filing Guide - Form populated with base QRE data and calculated fields:', formattedData);
          if (isMounted) setStateProFormaData(formattedData);
        }
      } catch (error) {
        console.error('📊 [State Credits] Error loading state pro forma data:', error);
        // Simple fallback - just set empty state instead of making more API calls
        if (isMounted) setStateProFormaData({});
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    loadExistingData();
    
    return () => {
      isMounted = false;
    };
  }, [state, method, businessData?.client_id, selectedYear?.id, calculations?.currentYearQRE, availableLines]);

  const handleSaveStateProForma = async (data: Record<string, number>, businessYearId: string) => {
    await saveStateProFormaData(businessYearId, state, method as 'standard' | 'alternative', data);
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    setStateProFormaData({}); // Clear data when state changes
  };

  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    setStateProFormaData({}); // Clear data when method changes
  };

  // Names for Welcome Letter salutation
  const businessName = businessData?.name || businessData?.business?.name || 'Client Business';
  const [fetchedClientName, setFetchedClientName] = useState<string | null>(null);
  const resolvedClientName = clientName 
    || fetchedClientName 
    || businessData?.clients?.full_name 
    || businessData?.client_full_name 
    || businessData?.contact_name 
    || businessData?.owner_name 
    || businessData?.client_name 
    || businessData?.primary_contact_name 
    || businessData?.user_name 
    || businessData?.business?.owner_name 
    || 'Client';

  // Fallback: fetch client name if not provided
  useEffect(() => {
    const loadClientName = async () => {
      if (clientName || fetchedClientName) return;
      const clientId = businessData?.client_id || businessData?.business?.client_id;
      if (!clientId) return;
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('full_name')
          .eq('id', clientId)
          .single();
        if (!error && data?.full_name) {
          setFetchedClientName(data.full_name);
        }
      } catch (e) {
        // ignore
      }
    };
    loadClientName();
  }, [clientName, fetchedClientName, businessData?.client_id, businessData?.business?.client_id]);

  return (
    <div className="filing-guide-document">
      {/* Debug Output removed from top of report */}
      
      {/* Cover Page */}
      <div id="filing-guide-section-cover" className="filing-guide-section">
        <div className="filing-guide-cover-page">
          <div className="filing-guide-logo">
            <img 
              src={'/images/Direct%20Research_horizontal%20advisors%20logo.png'} 
              alt="Direct Research Logo"
              className="filing-guide-logo-img"
            />
          </div>
          
          <div className="filing-guide-cover-content">
            <h1 className="filing-guide-main-title">Federal R&D Credit Filing Guide</h1>
            <h2 className="filing-guide-subtitle">Prepared by Direct Research</h2>
            
            <div className="filing-guide-cover-details">
              <div className="filing-guide-detail-row">
                <span className="filing-guide-detail-label">Tax Year:</span>
                <span className="filing-guide-detail-value">{selectedYear?.year || 'N/A'}</span>
              </div>
              <div className="filing-guide-detail-row">
                <span className="filing-guide-detail-label">Client Name:</span>
                <span className="filing-guide-detail-value">{businessData?.name || 'N/A'}</span>
              </div>
              <div className="filing-guide-detail-row">
                <span className="filing-guide-detail-label">Date Generated:</span>
                <span className="filing-guide-detail-value">{currentDate}</span>
              </div>
            </div>
          </div>
          
          <div className="filing-guide-footer">
            Direct Research | Federal Filing Guide – {selectedYear?.year || 'N/A'}
          </div>
        </div>
      </div>

      {/* Welcome Letter (Thank You & Commitment) */}
      <div id="filing-guide-section-welcome" className="filing-guide-section">
        <div className="filing-guide-section-header">
          <div className="filing-guide-section-icon">✉️</div>
          <div>
            <h2 className="filing-guide-section-title">Welcome Letter</h2>
            <p className="filing-guide-section-subtitle">A note of thanks and our commitment to assist</p>
          </div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
          <p style={{ marginBottom: 16 }}>Dear {businessName} and {resolvedClientName},</p>
          <p style={{ marginBottom: 12 }}>
            We wanted to take a moment to express our gratitude for the opportunity to work with you and develop your
            research and development credit–supporting documentation. It has been a pleasure to collaborate with your
            team, and we are excited to assist you in your pursuit of this valuable tax credit.
          </p>
          <p style={{ marginBottom: 12 }}>
            In the attached guide, you will find detailed instructions for filing your research and development credit,
            along with all necessary supporting documentation. We have included clear guidance on how to claim this
            credit, and we are available to answer any questions you or your accounting team may have as you navigate
            the filing process.
          </p>
          <p style={{ marginBottom: 12 }}>
            Thank you again for entrusting us with this important project. Please do not hesitate to reach out if you have
            any questions or concerns. You can contact us directly at (801) 318-5097.
          </p>
          <p style={{ marginTop: 20 }}>Sincerely,</p>
          <p>Benjamin T. Dyches, DDS, JD</p>
          <p>CEO Direct Research</p>
        </div>
      </div>

      {/* About Direct Research Section */}
      <div id="filing-guide-section-about" className="filing-guide-section">
        <div className="filing-guide-section-header">
          <div className="filing-guide-section-icon">🏢</div>
          <div>
            <h2 className="filing-guide-section-title">About Direct Research</h2>
            <p className="filing-guide-section-subtitle">Your trusted partner in R&D tax credit optimization</p>
          </div>
        </div>
        
        <div className="about-direct-research">
          <div className="about-direct-research-overview">
            <h3 className="filing-guide-section-title">Company Overview</h3>
            <p>
              Direct Research is a leading specialist in research and development tax credit consulting, 
              providing comprehensive services to help businesses maximize their R&D investments through 
              strategic tax credit optimization. Our team of experts combines deep technical knowledge 
              with extensive tax expertise to deliver exceptional results for our clients.
            </p>
          </div>
          
          <div className="about-direct-research-process">
            <h3 className="filing-guide-section-title">Our Process</h3>
            <div className="process-steps">
              <div className="process-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Discovery & Analysis</h4>
                  <p>Comprehensive review of your business activities to identify qualifying R&D work</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Technical Documentation</h4>
                  <p>Detailed documentation of qualifying activities, expenses, and technical challenges</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Financial Calculation</h4>
                  <p>Precise calculation of qualified research expenses and optimal credit amounts</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Filing & Support</h4>
                  <p>Complete filing support and ongoing audit defense services</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="about-direct-research-commitment">
            <h3 className="filing-guide-section-title">Our Commitment to Excellence</h3>
            <p>
              We are committed to delivering exceptional value through our deep technical expertise, 
              rigorous documentation standards, and unwavering commitment to client success. Our approach 
              combines industry best practices with innovative methodologies to ensure you receive the 
              maximum benefit from your R&D investments while maintaining full compliance with all 
              applicable regulations.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Filing Process Overview */}
      <div id="filing-guide-section-process" className="filing-guide-section">
        <div className="filing-guide-section-header">
          <div className="filing-guide-section-icon">📋</div>
          <div>
            <h2 className="filing-guide-section-title">Filing Process Overview</h2>
            <p className="filing-guide-section-subtitle">Step-by-step guidance for your R&D credit filing</p>
          </div>
        </div>
        
        <FilingProcessOverview 
          calculations={calculations}
          businessData={businessData}
          selectedYear={selectedYear}
          selectedMethod={selectedMethod}
          debugData={debugData}
        />
      </div>

      {/* Section 2: Summary Tables and Visuals */}
      <div id="filing-guide-section-summary" className="filing-guide-section">
        <div className="filing-guide-section-header">
          <div className="filing-guide-section-icon">📊</div>
          <div>
            <h2 className="filing-guide-section-title">Summary Tables and Visuals</h2>
            <p className="filing-guide-section-subtitle">Visual analysis of your R&D credit calculations</p>
          </div>
        </div>
        

        
        <div id="filing-guide-section-qre-tables">
          <QRESummaryTables 
            businessData={businessData}
            selectedYear={selectedYear}
            calculations={calculations}
            selectedMethod={selectedMethod}
            debugData={debugData}
          />
        </div>
      </div>

      {/* Section 3: Form 6765 Pro Forma */}
      <div id="filing-guide-section-federal" className="filing-guide-section">
        <div className="filing-guide-section-header">
          <div className="filing-guide-section-icon">📝</div>
          <div>
            <h2 className="filing-guide-section-title">Federal Form 6765 Pro Forma</h2>
            <p className="filing-guide-section-subtitle">IRS Form 6765 calculation worksheet</p>
          </div>
        </div>
        
        {/* Render new FederalCreditProForma with selectors and unified UI */}
        <FederalCreditProForma
          businessData={businessData}
          selectedYear={selectedYear}
          calculations={calculations}
          clientId={businessData?.client_id || 'demo'}
          userId={businessData?.user_id}
          selectedMethod={selectedMethod}
          lockedQREValues={lockedQREValues}
        />
      </div>

      {/* Section 5: State Credits (with selectors) */}
      <div id="filing-guide-section-state" className="filing-guide-section">
        <div className="filing-guide-section-header">
          <div className="filing-guide-section-icon">🏛️</div>
          <div>
            <h2 className="filing-guide-section-title">State Credits</h2>
            <p className="filing-guide-section-subtitle">State-specific R&D credit calculations</p>
          </div>
        </div>
        
        <div className="state-selector-container">
          <label>
            State:
            <select 
              value={state} 
              onChange={e => handleStateChange(e.target.value)}
              disabled={readOnly}
            >
              {availableStates.map(stateConfig => (
                <option key={stateConfig.code} value={stateConfig.code}>
                  {stateConfig.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Method:
            <select 
              value={method} 
              onChange={e => handleMethodChange(e.target.value)}
              disabled={readOnly || !currentStateConfig?.hasAlternativeMethod}
            >
              <option value="standard">Standard</option>
              {currentStateConfig?.hasAlternativeMethod && (
                <option value="alternative">Alternative</option>
              )}
            </select>
          </label>
        </div>
        
        {isLoadingData ? (
          <div className="state-proforma-loading">Loading state data...</div>
        ) : currentStateConfig ? (
          <StateCreditProForma
            lines={availableLines}
            initialData={stateProFormaData}
            onSave={handleSaveStateProForma}
            title={`${currentStateConfig.name} (${currentStateConfig.code}) State Credit – ${currentStateConfig.forms?.[method]?.name || currentStateConfig.formName} Pro Forma (${method.charAt(0).toUpperCase() + method.slice(1)})`}
            businessYearId={selectedYear?.id}
            readOnly={readOnly}
            // Pass validation rules and metadata
            validationRules={currentStateConfig.validationRules}
            alternativeValidationRules={currentStateConfig.alternativeValidationRules}
            hasAlternativeMethod={currentStateConfig.hasAlternativeMethod}
            creditRate={currentStateConfig.creditRate}
            creditType={currentStateConfig.creditType}
            formReference={currentStateConfig.formReference}
            notes={currentStateConfig.notes}
          />
        ) : (
          <div className="state-proforma-error">
            No state configuration available for {state}
          </div>
        )}
      </div>

      {/* Section 6: Calculation Specifics */}
      <div id="filing-guide-section-calculations" className="filing-guide-section">
        <div className="filing-guide-section-header">
          <div className="filing-guide-section-icon">🧮</div>
          <div>
            <h2 className="filing-guide-section-title">Calculation Specifics</h2>
            <p className="filing-guide-section-subtitle">Detailed breakdown of credit calculations</p>
          </div>
        </div>
        
        <CalculationSpecifics
          businessData={businessData}
          selectedYear={selectedYear}
          calculations={calculations}
          selectedMethod={selectedMethod}
          debugData={debugData}
        />
      </div>
    </div>
  );
}; 