import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { FederalCreditProForma } from '../../FilingGuide/FederalCreditProForma';

interface IntegratedFederalCreditsProps {
  businessData: any;
  selectedYear: any;
  calculations: any;
  selectedMethod: 'standard' | 'asc';
  onMethodChange: (method: 'standard' | 'asc') => void;
  corporateTaxRate: number;
  use280C: boolean;
  onUse280CChange: (use280C: boolean) => void;
  onTaxRateChange: (rate: number) => void;
}

export const IntegratedFederalCredits: React.FC<IntegratedFederalCreditsProps> = ({
  businessData,
  selectedYear,
  calculations,
  selectedMethod,
  onMethodChange,
  corporateTaxRate,
  use280C,
  onUse280CChange,
  onTaxRateChange
}) => {
  const [showProForma, setShowProForma] = useState(false);
  
  // Extract calculations
  const federalCredits = calculations?.federalCredits || {};
  const currentYearQRE = calculations?.currentYearQRE || {};
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const selectedFederalCredit = selectedMethod === 'asc' 
    ? federalCredits.asc?.credit || 0 
    : federalCredits.standard?.credit || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header with Summary */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Federal Credits
        </h3>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Federal</div>
          <div className="text-xl font-bold text-blue-600">
            {formatCurrency(selectedFederalCredit)}
          </div>
        </div>
      </div>

      {/* Method Selection */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">Calculation Method</label>
          <select
            value={selectedMethod}
            onChange={(e) => onMethodChange(e.target.value as 'standard' | 'asc')}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="standard">Standard Method</option>
            <option value="asc">Alternative Simplified Credit (ASC)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-gray-600 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              value={corporateTaxRate}
              onChange={(e) => onTaxRateChange(parseFloat(e.target.value) || 21)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              min="0"
              max="50"
              step="0.1"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={use280C}
                onChange={(e) => onUse280CChange(e.target.checked)}
                className="mr-2"
              />
              280C Election
            </label>
          </div>

          {selectedMethod === 'standard' && (
            <div className="text-xs text-gray-600">
              <div>Base: {formatCurrency(federalCredits.standard?.fixedBaseAmount || 0)}</div>
              <div>Incremental: {formatCurrency(federalCredits.standard?.incrementalQRE || 0)}</div>
            </div>
          )}

          {selectedMethod === 'asc' && (
            <div className="text-xs text-gray-600">
              <div>Avg Prior QRE: {formatCurrency(federalCredits.asc?.avgPriorQRE || 0)}</div>
              <div>Rate: {federalCredits.asc?.isStartup ? '6%' : '14%'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Pro Forma Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowProForma(!showProForma)}
          className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          {showProForma ? 'Hide' : 'Show'} Form 6765 Pro Forma
        </button>
      </div>

      {/* Integrated Pro Forma */}
      {showProForma && (
        <div className="border-t pt-4">
          <FederalCreditProForma
            businessData={businessData}
            selectedYear={selectedYear}
            calculations={calculations}
            clientId={businessData?.client_id || 'demo'}
            userId={businessData?.user_id}
            selectedMethod={selectedMethod}
          />
        </div>
      )}
    </div>
  );
}; 