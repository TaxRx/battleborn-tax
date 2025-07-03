import React, { useState, useEffect } from 'react';

interface WizardState {
  business: any;
  selectedYear: any;
  selectedActivities: any[];
  employees: any[];
  supplies: any[];
  contractors: any[];
  calculations: any;
}

interface CalculationStepProps {
  wizardState: WizardState;
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface CalculationResults {
  totalWages: number;
  totalSupplies: number;
  totalContractors: number;
  totalQRE: number;
  baseAmount: number;
  incrementalQRE: number;
  federalCredit: number;
  stateCredits: { [state: string]: number };
  totalCredits: number;
}

const CalculationStep: React.FC<CalculationStepProps> = ({
  wizardState,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [calculations, setCalculations] = useState<CalculationResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculateQRE();
  }, [wizardState]);

  const calculateQRE = () => {
    setLoading(true);
    try {
      // Calculate total wages (R&D portion of employee salaries)
      const totalWages = wizardState.employees.reduce((total, emp) => {
        const rdSalary = (emp.salary * emp.rdPercentage) / 100;
        return total + rdSalary;
      }, 0);

      // Calculate total supplies
      const totalSupplies = wizardState.supplies.reduce((total, supply) => {
        return total + supply.cost;
      }, 0);

      // Calculate total contractors (only domestic contractors qualify)
      const totalContractors = wizardState.contractors.reduce((total, contractor) => {
        if (contractor.contractType === 'domestic') {
          return total + contractor.cost;
        }
        return total;
      }, 0);

      // Total QRE
      const totalQRE = totalWages + totalSupplies + totalContractors;

      // Base amount calculation (simplified - in practice this is more complex)
      const grossReceipts = wizardState.selectedYear?.grossReceipts || 0;
      const baseAmount = Math.max(grossReceipts * 0.5, 0); // Simplified base amount

      // Incremental QRE
      const incrementalQRE = Math.max(totalQRE - baseAmount, 0);

      // Federal credit (20% of incremental QRE)
      const federalCredit = incrementalQRE * 0.20;

      // State credits (simplified - would need state-specific logic)
      const stateCredits: { [state: string]: number } = {};
      if (wizardState.business?.state) {
        const state = wizardState.business.state;
        // Example state credit rates (these would be more complex in practice)
        const stateRates: { [key: string]: number } = {
          'CA': 0.15, // California
          'NY': 0.09, // New York
          'TX': 0.05, // Texas
          'FL': 0.00, // Florida (no state R&D credit)
          'IL': 0.065, // Illinois
          'PA': 0.10, // Pennsylvania
          'OH': 0.07, // Ohio
          'MI': 0.04, // Michigan
          'GA': 0.03, // Georgia
          'NC': 0.025, // North Carolina
        };
        
        if (stateRates[state]) {
          stateCredits[state] = totalQRE * stateRates[state];
        }
      }

      const totalCredits = federalCredit + Object.values(stateCredits).reduce((sum, credit) => sum + credit, 0);

      const results: CalculationResults = {
        totalWages,
        totalSupplies,
        totalContractors,
        totalQRE,
        baseAmount,
        incrementalQRE,
        federalCredit,
        stateCredits,
        totalCredits
      };

      setCalculations(results);
      onUpdate({ calculations: results });
    } catch (err) {
      console.error('Error calculating QRE:', err);
      setError('Failed to calculate QRE. Please check your data and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating your R&D tax credits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculation Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={calculateQRE}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!calculations) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Please complete the previous steps to calculate your R&D credits.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">QRE Calculation</h3>
        <p className="text-gray-600">
          Review your Qualified Research Expenses and calculated tax credits.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">
            ${calculations.totalQRE.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total QRE</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">
            ${calculations.federalCredit.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Federal Credit</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">
            ${Object.values(calculations.stateCredits).reduce((sum, credit) => sum + credit, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">State Credits</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-orange-600">
            ${calculations.totalCredits.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Credits</div>
        </div>
      </div>

      {/* QRE Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">QRE Breakdown</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
            <div>
              <div className="font-medium text-blue-900">Wages & Salaries</div>
              <div className="text-sm text-blue-700">
                {wizardState.employees.length} employees, R&D time allocation
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-900">
                ${calculations.totalWages.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700">
                {((calculations.totalWages / calculations.totalQRE) * 100).toFixed(1)}% of QRE
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
            <div>
              <div className="font-medium text-green-900">Supplies & Materials</div>
              <div className="text-sm text-green-700">
                {wizardState.supplies.length} items, 100% qualified
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-900">
                ${calculations.totalSupplies.toLocaleString()}
              </div>
              <div className="text-sm text-green-700">
                {((calculations.totalSupplies / calculations.totalQRE) * 100).toFixed(1)}% of QRE
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
            <div>
              <div className="font-medium text-orange-900">Contractors</div>
              <div className="text-sm text-orange-700">
                {wizardState.contractors.filter(c => c.contractType === 'domestic').length} domestic contractors
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-900">
                ${calculations.totalContractors.toLocaleString()}
              </div>
              <div className="text-sm text-orange-700">
                {((calculations.totalContractors / calculations.totalQRE) * 100).toFixed(1)}% of QRE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Calculation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Credit Calculation</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Total QRE</div>
              <div className="text-2xl font-bold text-gray-900">
                ${calculations.totalQRE.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Base Amount</div>
              <div className="text-2xl font-bold text-gray-900">
                ${calculations.baseAmount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 mb-2">Incremental QRE (Total QRE - Base Amount)</div>
            <div className="text-2xl font-bold text-blue-900">
              ${calculations.incrementalQRE.toLocaleString()}
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 mb-2">Federal Credit (20% of Incremental QRE)</div>
            <div className="text-2xl font-bold text-green-900">
              ${calculations.federalCredit.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* State Credits */}
      {Object.keys(calculations.stateCredits).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">State Credits</h4>
          <div className="space-y-3">
            {Object.entries(calculations.stateCredits).map(([state, credit]) => (
              <div key={state} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-medium text-purple-900">{state} State Credit</div>
                  <div className="text-sm text-purple-700">
                    Based on total QRE for {state}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-900">
                    ${credit.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h4 className="text-xl font-bold mb-4">Total Tax Credits</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-blue-200">Federal Credit</div>
            <div className="text-2xl font-bold">${calculations.federalCredit.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-blue-200">State Credits</div>
            <div className="text-2xl font-bold">
              ${Object.values(calculations.stateCredits).reduce((sum, credit) => sum + credit, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-blue-200">Total Credits</div>
            <div className="text-3xl font-bold">${calculations.totalCredits.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Important Disclaimer
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                This calculation is for estimation purposes only. Actual tax credits may vary based on:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Specific IRS regulations and interpretations</li>
                <li>State-specific requirements and limitations</li>
                <li>Business structure and tax situation</li>
                <li>Documentation and substantiation requirements</li>
              </ul>
              <p className="mt-2">
                Consult with a qualified tax professional before filing your tax return.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generate Report (${calculations.totalCredits.toLocaleString()} credits)
        </button>
      </div>
    </div>
  );
};

export default CalculationStep; 