import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin, Calculator, TrendingUp, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { StateCalculationService, StateCalculationResult, QREBreakdown } from '../../../services/stateCalculationService';

interface StateCalculationStepProps {
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  businessYearId?: string;
  businessId?: string;
  qreBreakdown?: QREBreakdown;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

const StateCalculationStep: React.FC<StateCalculationStepProps> = ({
  onUpdate,
  onNext,
  onPrevious,
  businessYearId = '',
  businessId = '',
  qreBreakdown
}) => {
  const [loading, setLoading] = useState(true);
  const [stateResults, setStateResults] = useState<StateCalculationResult[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  // Memoized QRE breakdown to prevent unnecessary recalculations
  const memoizedQREBreakdown = useMemo(() => {
    if (!qreBreakdown) {
      return {
        wages: 0,
        contractor_costs: 0,
        supply_costs: 0,
        contract_research: 0,
        total_qre: 0
      };
    }
    return qreBreakdown;
  }, [qreBreakdown]);

  // Memoized state calculations
  const calculateStateCredits = useCallback(async () => {
    if (!memoizedQREBreakdown.total_qre) {
      setStateResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await StateCalculationService.calculateAllStateCredits(memoizedQREBreakdown, year);
      setStateResults(results);
    } catch (err) {
      console.error('Error calculating state credits:', err);
      setError('Failed to calculate state credits. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [memoizedQREBreakdown, year]);

  // Calculate state credits when QRE breakdown or year changes
  useEffect(() => {
    calculateStateCredits();
  }, [calculateStateCredits]);

  // Memoized total state credits
  const totalStateCredits = useMemo(() => {
    return stateResults.reduce((sum, result) => {
      if (selectedStates.includes(result.state)) {
        return sum + result.credit_amount;
      }
      return sum;
    }, 0);
  }, [stateResults, selectedStates]);

  // Memoized available states (states with credits > 0)
  const availableStates = useMemo(() => {
    return stateResults.filter(result => result.credit_amount > 0);
  }, [stateResults]);

  // Memoized no credit states
  const noCreditStates = useMemo(() => {
    return stateResults.filter(result => result.credit_amount === 0);
  }, [stateResults]);

  const handleStateToggle = (state: string) => {
    setSelectedStates(prev => {
      if (prev.includes(state)) {
        return prev.filter(s => s !== state);
      } else {
        return [...prev, state];
      }
    });
  };

  const handleSelectAllStates = () => {
    setSelectedStates(availableStates.map(state => state.state));
  };

  const handleClearAllStates = () => {
    setSelectedStates([]);
  };

  const getStateIcon = (result: StateCalculationResult) => {
    if (result.credit_amount > 0) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-gray-400" />;
  };

  const getStateColor = (result: StateCalculationResult) => {
    if (result.credit_amount > 0) {
      return 'border-green-200 bg-green-50';
    }
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">State R&D Tax Credits</h2>
            <p className="text-gray-600">Calculate state-specific R&D tax credits based on your QRE breakdown</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStateCredits)}</div>
            <div className="text-sm text-gray-500">Total State Credits</div>
          </div>
        </div>

        {/* QRE Summary */}
        {memoizedQREBreakdown.total_qre > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">{formatCurrency(memoizedQREBreakdown.wages)}</div>
              <div className="text-sm text-blue-700">Wages</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">{formatCurrency(memoizedQREBreakdown.contractor_costs)}</div>
              <div className="text-sm text-blue-700">Contractors</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">{formatCurrency(memoizedQREBreakdown.supply_costs)}</div>
              <div className="text-sm text-blue-700">Supplies</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">{formatCurrency(memoizedQREBreakdown.total_qre)}</div>
              <div className="text-sm text-blue-700">Total QRE</div>
            </div>
          </div>
        )}

        {/* Year Selector */}
        <div className="flex items-center space-x-4 mb-6">
          <label className="text-sm font-medium text-gray-700">Tax Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* State Selection Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAllStates}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Select All Available
            </button>
            <button
              onClick={handleClearAllStates}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear All
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {selectedStates.length} of {availableStates.length} states selected
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Calculating state credits...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* State Results */}
      {!loading && !error && (
        <div className="space-y-4">
          {/* Available States */}
          {availableStates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Available State Credits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableStates.map((result) => (
                  <div
                    key={result.state}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${getStateColor(result)} ${
                      selectedStates.includes(result.state) ? 'ring-2 ring-blue-500' : 'hover:border-blue-300'
                    }`}
                    onClick={() => handleStateToggle(result.state)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {getStateIcon(result)}
                        <span className="ml-2 font-semibold text-gray-900">{result.state}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{formatCurrency(result.credit_amount)}</div>
                        <div className="text-sm text-gray-500">{formatPercentage(result.credit_rate)}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{result.calculation_method}</div>
                    {result.refundable && (
                      <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Refundable
                      </div>
                    )}
                    {result.special_notes && (
                      <div className="mt-2 text-xs text-gray-500">
                        <Info className="w-3 h-3 inline mr-1" />
                        {result.special_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Credit States */}
          {noCreditStates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">States Without R&D Credits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {noCreditStates.map((result) => (
                  <div
                    key={result.state}
                    className="border border-gray-200 bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {getStateIcon(result)}
                        <span className="ml-2 font-semibold text-gray-900">{result.state}</span>
                      </div>
                      <div className="text-sm text-gray-500">No Credit</div>
                    </div>
                    <div className="text-sm text-gray-600">{result.calculation_method}</div>
                    {result.special_notes && (
                      <div className="mt-2 text-xs text-gray-500">
                        <Info className="w-3 h-3 inline mr-1" />
                        {result.special_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cache Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Cache size: {StateCalculationService.getCacheStats().size} calculations
          </div>
          <button
            onClick={() => {
              StateCalculationService.clearCache();
              calculateStateCredits();
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md font-medium"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default StateCalculationStep; 