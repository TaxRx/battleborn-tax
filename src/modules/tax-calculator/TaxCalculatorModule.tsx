import React, { useState, useCallback } from 'react';
import { TaxInfo, TaxStrategy, SavedCalculation } from '../../types';
import { taxRates } from './taxRates';
import TaxResults from './components/TaxResults';
import InfoForm from './components/InfoForm';
import { useTaxStore } from './store/taxStore';

interface TaxCalculatorModuleProps {
  // Optional props for integration with Galileo Tax system
  clientId?: string;
  affiliateId?: string;
  onProposalCreate?: (proposal: any) => void;
  onSaveCalculation?: (calc: SavedCalculation) => void;
  readOnly?: boolean;
  initialTaxInfo?: TaxInfo;
}

const defaultTaxInfo: TaxInfo = {
  standardDeduction: true,
  businessOwner: false,
  fullName: '',
  email: '',
  filingStatus: 'single',
  dependents: 0,
  homeAddress: '',
  state: 'CA',
  wagesIncome: 0,
  passiveIncome: 0,
  unearnedIncome: 0,
  capitalGains: 0,
  customDeduction: 0,
};

const TaxCalculatorModule: React.FC<TaxCalculatorModuleProps> = ({
  clientId,
  affiliateId,
  onProposalCreate,
  onSaveCalculation,
  readOnly = false,
  initialTaxInfo
}) => {
  const [taxInfo, setTaxInfo] = useState<TaxInfo>(initialTaxInfo || defaultTaxInfo);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedStrategies, setSelectedStrategies] = useState<TaxStrategy[]>([]);
  const [showInfoForm, setShowInfoForm] = useState(!initialTaxInfo);

  const { setTaxInfo: setStoreTaxInfo } = useTaxStore();

  const handleTaxInfoUpdate = useCallback((updatedInfo: TaxInfo) => {
    setTaxInfo(updatedInfo);
    setStoreTaxInfo(updatedInfo);
    setShowInfoForm(false);
  }, [setStoreTaxInfo]);

  const handleStrategiesSelect = useCallback((strategies: TaxStrategy[]) => {
    setSelectedStrategies(strategies);
  }, []);

  const handleSaveCalculation = useCallback((calc: SavedCalculation) => {
    // If we have integration callbacks, use them
    if (onSaveCalculation) {
      onSaveCalculation(calc);
    }

    // If we're in the Galileo Tax system, potentially create a proposal
    if (onProposalCreate && clientId && affiliateId) {
      const proposal = {
        client_id: clientId,
        affiliate_id: affiliateId,
        tax_info: taxInfo,
        selected_strategies: selectedStrategies,
        calculation: calc,
        status: 'draft' as const
      };
      onProposalCreate(proposal);
    }
  }, [onSaveCalculation, onProposalCreate, clientId, affiliateId, taxInfo, selectedStrategies]);

  const handleStrategyAction = useCallback((strategyId: string, action: string) => {
    // Handle strategy actions (enable/disable, configure, etc.)
    console.log('Strategy action:', strategyId, action);
  }, []);

  if (showInfoForm && !readOnly) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white shadow-xl overflow-hidden" style={{ borderRadius: '4px' }}>
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Tax Information</h2>
            <p className="text-gray-300 text-sm mt-1">
              Enter your tax details to calculate potential savings
            </p>
          </div>
          <div className="p-6">
            <InfoForm
              initialData={taxInfo}
              onSubmit={handleTaxInfoUpdate}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <TaxResults
        taxInfo={taxInfo}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        onStrategiesSelect={handleStrategiesSelect}
        onSaveCalculation={handleSaveCalculation}
        onStrategyAction={handleStrategyAction}
      />
      
      {/* Show edit button if not read-only */}
      {!readOnly && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowInfoForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors font-medium"
          >
            Edit Tax Info
          </button>
        </div>
      )}
    </div>
  );
};

export default TaxCalculatorModule; 