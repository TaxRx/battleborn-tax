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
import { KPICharts } from './KPICharts';
import { CalculationSpecifics } from './CalculationSpecifics';

interface FilingGuideDocumentProps {
  businessData: any;
  selectedYear: any;
  calculations: any;
  selectedMethod?: 'asc' | 'standard';
  debugData?: any;
}

export const FilingGuideDocument: React.FC<FilingGuideDocumentProps> = ({
  businessData,
  selectedYear,
  calculations,
  selectedMethod,
  debugData
}) => {
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
  console.log('%c[FILING GUIDE] selectedMethod:', 'background: #fffb00; color: #000; font-weight: bold; padding: 2px 8px;', selectedMethod);
  // eslint-disable-next-line no-console
  console.log('%c[FILING GUIDE] debugData:', 'background: #fffb00; color: #000; font-weight: bold; padding: 2px 8px;', debugData);

  // Debug output (collapsible)
  const [showDebug, setShowDebug] = React.useState(false);

  const [state, setState] = useState('CA');
  const [method, setMethod] = useState('standard');
  const [stateProFormaData, setStateProFormaData] = useState<Record<string, number>>({});
  const [isLoadingData, setIsLoadingData] = useState(false);

  const availableStates = getAvailableStates();
  const currentStateConfig = getStateConfig(state);
  // Get lines from the appropriate form method
  const availableLines = currentStateConfig?.forms?.[method]?.lines || [];

  // Load existing data when state or method changes
  useEffect(() => {
    const loadExistingData = async () => {
      if (!businessData?.client_id || !selectedYear?.id) return;
      
      setIsLoadingData(true);
      try {
        const existingData = await loadStateProFormaData(
          selectedYear.id,
          state,
          method as 'standard' | 'alternative'
        );
        
        if (existingData) {
          setStateProFormaData(existingData);
        } else {
          // Load base data using the new StateCreditDataService (same as federal Section G)
          console.log('📊 [State Credits] Loading base data using StateCreditDataService...');
          const baseData = await StateCreditDataService.getAggregatedQREData(selectedYear.id);
          
          // Convert to the format expected by the pro forma
          const formattedData = {
            wages: baseData.wages,
            supplies: baseData.supplies,
            contractResearch: baseData.contractResearch,
            computerLeases: baseData.computerLeases,
            avgGrossReceipts: baseData.avgGrossReceipts,
            businessEntityType: baseData.businessEntityType, // Include business entity type for 280C
          };
          
          console.log('📊 [State Credits] Base data loaded:', formattedData);
          setStateProFormaData(formattedData);
        }
      } catch (error) {
        console.error('Error loading state pro forma data:', error);
        // Fallback to base data
        try {
          console.log('📊 [State Credits] Fallback: Loading base data...');
          const baseData = await StateCreditDataService.getAggregatedQREData(selectedYear.id);
          const formattedData = {
            wages: baseData.wages,
            supplies: baseData.supplies,
            contractResearch: baseData.contractResearch,
            computerLeases: baseData.computerLeases,
            avgGrossReceipts: baseData.avgGrossReceipts,
            businessEntityType: baseData.businessEntityType, // Include business entity type for 280C
          };
          setStateProFormaData(formattedData);
        } catch (fallbackError) {
          console.error('Error loading base data:', fallbackError);
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    loadExistingData();
  }, [state, method, businessData?.client_id, selectedYear?.id]);

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

  return (
    <div className="filing-guide-document">
      {/* Debug Output Section */}
      {debugData && (
        <div className="filing-guide-debug-output" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, margin: '1rem 0', padding: '1rem' }}>
          <button onClick={() => setShowDebug(v => !v)} style={{ fontWeight: 600, marginBottom: 8 }}>
            {showDebug ? 'Hide' : 'Show'} Debug Data
          </button>
          {showDebug && (
            <pre style={{ fontSize: 12, maxHeight: 300, overflow: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: 8 }}>
              {JSON.stringify(debugData, null, 2)}
            </pre>
          )}
        </div>
      )}
      {/* Cover Page */}
      <div className="filing-guide-cover-page">
        <div className="filing-guide-logo">
          <img 
            src="/images/Direct Research_horizontal advisors logo.png" 
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

      {/* About Direct Research Section */}
      <div className="filing-guide-section">
        <h2 className="filing-guide-section-title">About Direct Research</h2>
        
        <div className="about-direct-research-content">
          <div className="about-direct-research-intro">
            <p>
              Direct Research is a specialized consulting firm dedicated to helping businesses maximize their 
              Research & Development (R&D) tax credit opportunities. Our team of experienced tax professionals, 
              engineers, and industry experts work collaboratively to identify, document, and substantiate 
              qualifying R&D activities that often go unrecognized.
            </p>
          </div>
          
          <div className="about-direct-research-expertise">
            <h3 className="filing-guide-section-title">Our Expertise</h3>
            <div className="expertise-grid">
              <div className="expertise-item">
                <div className="expertise-icon">🔬</div>
                <h4>Technical Analysis</h4>
                <p>Deep technical review of your R&D activities to identify qualifying expenses and activities</p>
              </div>
              <div className="expertise-item">
                <div className="expertise-icon">📊</div>
                <h4>Financial Optimization</h4>
                <p>Strategic analysis to maximize your credit while ensuring full compliance with IRS regulations</p>
              </div>
              <div className="expertise-item">
                <div className="expertise-icon">📋</div>
                <h4>Documentation Excellence</h4>
                <p>Comprehensive documentation and substantiation to support your claim in case of audit</p>
              </div>
              <div className="expertise-item">
                <div className="expertise-icon">🛡️</div>
                <h4>Audit Support</h4>
                <p>Full support throughout the audit process with detailed documentation and expert testimony</p>
              </div>
            </div>
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
      <div className="filing-guide-section">
        <FilingProcessOverview 
          calculations={calculations}
          businessData={businessData}
          selectedYear={selectedYear}
          selectedMethod={selectedMethod}
          debugData={debugData}
        />
      </div>

      {/* Section 2: Summary Tables and Visuals */}
      <div className="filing-guide-section">
        <h2 className="filing-guide-section-title">Summary Tables and Visuals</h2>
        <KPICharts 
          businessData={businessData}
          selectedYear={selectedYear}
          calculations={calculations}
          selectedMethod={selectedMethod}
          debugData={debugData}
        />
        <QRESummaryTables 
          businessData={businessData}
          selectedYear={selectedYear}
          calculations={calculations}
          selectedMethod={selectedMethod}
          debugData={debugData}
        />
      </div>

      {/* Section 3: Form 6765 Pro Forma */}
      <div className="filing-guide-section">
        {/* Render new FederalCreditProForma with selectors and unified UI */}
        <FederalCreditProForma
          businessData={businessData}
          selectedYear={selectedYear}
          calculations={calculations}
          clientId={businessData?.client_id || 'demo'}
          userId={businessData?.user_id}
          selectedMethod={selectedMethod}
        />
      </div>

      {/* Section 5: State Credits (with selectors) */}
      <div className="filing-guide-section">
        <h2 className="filing-guide-section-title">State Credits</h2>
        <div className="state-selector-container">
          <label>
            State:
            <select 
              value={state} 
              onChange={e => handleStateChange(e.target.value)}
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
              disabled={!currentStateConfig?.hasAlternativeMethod}
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
      <div className="filing-guide-section">
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