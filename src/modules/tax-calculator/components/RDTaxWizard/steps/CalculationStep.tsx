import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Building2, MapPin, DollarSign, AlertTriangle, CheckCircle, Info, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { RDCalculationsService, CalculationResults, FederalCreditResults } from '../../../services/rdCalculationsService';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

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

// AccordionSection for showing calculation details
const AccordionSection: React.FC<{ title: string; details: string[] | null }> = ({ title, details }) => {
  const [open, setOpen] = useState(false);
  if (!details || details.length === 0) return null;
  return (
    <div className="mt-2">
      <button
        className="flex items-center text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 transition-colors"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {open ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
        {open ? 'Hide' : 'Show'} {title}
      </button>
      {open && (
        <ul className="mt-2 pl-4 text-xs text-blue-900 list-disc">
          {details.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CalculationStep: React.FC<CalculationStepProps> = ({
  wizardState,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [use280C, setUse280C] = useState(false);
  const [corporateTaxRate, setCorporateTaxRate] = useState(21);
  const [selectedMethod, setSelectedMethod] = useState<'standard' | 'asc'>('asc');

  // Accordion state for debug data
  const [showDebug, setShowDebug] = useState(false);

  const [allYears, setAllYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(wizardState.selectedYear?.id || null);
  const [historicalCards, setHistoricalCards] = useState<any[]>([]);
  const [availableActivityYears, setAvailableActivityYears] = useState<Array<{id: string, year: number}>>([]);
  const [selectedActivityYearId, setSelectedActivityYearId] = useState<string>(wizardState.selectedYear?.id || '');
  const [selectedActivityYear, setSelectedActivityYear] = useState<number>(wizardState.selectedYear?.year || new Date().getFullYear());

  // Fetch all business years for the dropdown and cards
  useEffect(() => {
    async function fetchYears() {
      if (!wizardState.business?.id) return;
      try {
        // Fetch business years directly from the database
        const { data: years, error: yearsError } = await supabase
          .from('rd_business_years')
          .select(`
            *,
            selected_activities:rd_selected_activities (*),
            employees:rd_employee_year_data (*),
            supplies:rd_supply_year_data (*),
            contractors:rd_contractor_year_data (*)
          `)
          .eq('business_id', wizardState.business.id)
          .order('year', { ascending: false });
        
        if (yearsError) {
          console.error('Error fetching business years:', yearsError);
          setAvailableActivityYears([]);
          setAllYears([]);
          return;
        }
        
        const yearsData = years || [];
        
        // Filter years that have QRE data (total_qre > 0 or any activities/employees/supplies/contractors)
        const yearsWithData = yearsData.filter(year => 
          year.total_qre > 0 || 
          (year.selected_activities && year.selected_activities.length > 0) ||
          (year.employees && year.employees.length > 0) ||
          (year.supplies && year.supplies.length > 0) ||
          (year.contractors && year.contractors.length > 0)
        );

        // Sort years ascending
        yearsWithData.sort((a, b) => a.year - b.year);

        // Prepare QRE values for ASC calculation
        const qreValues = yearsWithData.map(year => year.total_qre > 0 ? year.total_qre : (
          (year.employees?.reduce((sum, e) => sum + (e.qre || 0), 0) || 0) +
          (year.supplies?.reduce((sum, s) => sum + (s.qre || 0), 0) || 0) +
          (year.contractors?.reduce((sum, c) => sum + (c.qre || 0), 0) || 0)
        ));

        // Helper to get QRE for a year (Business Setup takes precedence)
        const getQRE = (year) => year.total_qre > 0 ? year.total_qre : (
          (year.employees?.reduce((sum, e) => sum + (e.qre || 0), 0) || 0) +
          (year.supplies?.reduce((sum, s) => sum + (s.qre || 0), 0) || 0) +
          (year.contractors?.reduce((sum, c) => sum + (c.qre || 0), 0) || 0)
        );

        // Helper to get QRE breakdown for a year
        const getQREBreakdown = (year) => {
          if (year.total_qre > 0) {
            // If direct entry, show all as 'Direct'
            return {
              employeesQRE: 0,
              contractorsQRE: 0,
              suppliesQRE: 0,
              directQRE: year.total_qre
            };
          }
          return {
            employeesQRE: year.employees?.reduce((sum, e) => sum + (e.qre || 0), 0) || 0,
            contractorsQRE: year.contractors?.reduce((sum, c) => sum + (c.qre || 0), 0) || 0,
            suppliesQRE: year.supplies?.reduce((sum, s) => sum + (s.qre || 0), 0) || 0,
            directQRE: 0
          };
        };

        // Helper to get ASC credit for a year, and show percentage used
        const getASCCredit = (yearIdx) => {
          const qre = getQRE(yearsWithData[yearIdx]);
          if (yearsWithData.length < 3) {
            // Single-year ASC calculation: 6% of current year QRE
            return { value: qre * 0.06, percent: 6 };
          } else {
            // Multi-year ASC calculation: 14% of (current year QRE - avg prior 3 years QRE)
            if (yearIdx < 3) {
              // Not enough prior years, fallback to single-year ASC
              return { value: qre * 0.06, percent: 6 };
            }
            const prior3 = qreValues.slice(yearIdx - 3, yearIdx);
            const avgPrior3 = prior3.reduce((a, b) => a + b, 0) / 3;
            return { value: Math.max(0, (qre - avgPrior3) * 0.14), percent: 14, avgPrior3 };
          }
        };

        // Helper to get Standard credit and base percentage (min 3%)
        const getStandardCredit = (yearIdx) => {
          const qre = getQRE(yearsWithData[yearIdx]);
          // Calculate base percentage from prior years, fallback to 3%
          let basePercent = 0.03;
          if (yearIdx >= 4) {
            const prior4 = qreValues.slice(yearIdx - 4, yearIdx);
            const priorGross = yearsWithData.slice(yearIdx - 4, yearIdx).map(y => y.gross_receipts || 0);
            const sumQRE = prior4.reduce((a, b) => a + b, 0);
            const sumGross = priorGross.reduce((a, b) => a + b, 0);
            if (sumGross > 0) {
              basePercent = Math.max(0.03, sumQRE / sumGross);
            }
          }
          // Standard credit: 20% of (current QRE - base percent * current gross receipts)
          const gross = yearsWithData[yearIdx].gross_receipts || 0;
          const baseAmount = basePercent * gross;
          return {
            value: Math.max(0, (qre - baseAmount) * 0.20),
            basePercent: basePercent * 100,
            baseAmount,
            gross
          };
        };

        setHistoricalCards(yearsWithData.map((year, idx) => {
          const breakdown = getQREBreakdown(year);
          const asc = getASCCredit(idx);
          const std = getStandardCredit(idx);
          return {
            year: year.year,
            qre: getQRE(year),
            ...breakdown,
            source: year.total_qre > 0 ? 'Direct' : 'Internal',
            ascCredit: asc.value,
            ascPercent: asc.percent,
            ascAvgPrior3: asc.avgPrior3,
            stdCredit: std.value,
            stdBasePercent: std.basePercent,
            stdBaseAmount: std.baseAmount,
            stdGross: std.gross,
            calculationDetails: null // Placeholder, will be populated later
          };
        }));
        
        setAvailableActivityYears(yearsWithData.sort((a, b) => b.year - a.year));
        setAllYears(yearsWithData.sort((a, b) => b.year - a.year));
        
        // Set initial selected year
        if (!selectedActivityYearId && yearsWithData.length > 0) {
          const currentYear = new Date().getFullYear();
          const matchingYear = yearsWithData.find(y => y.year === currentYear) || yearsWithData[0];
          setSelectedActivityYearId(matchingYear.id);
          setSelectedActivityYear(matchingYear.year);
          setSelectedYearId(matchingYear.id);
        }
      } catch (error) {
        console.error('Error fetching business years:', error);
        setAvailableActivityYears([]);
        setAllYears([]);
      }
    }
    fetchYears();
  }, [wizardState.business?.id, selectedActivityYearId]);

  // When year changes, update calculation details
  useEffect(() => {
    if (selectedActivityYearId && selectedActivityYearId !== wizardState.selectedYear?.id) {
      const yearObj = allYears.find(y => y.id === selectedActivityYearId);
      if (yearObj) {
        onUpdate({ selectedYear: yearObj });
        setSelectedYearId(selectedActivityYearId);
      }
    }
  }, [selectedActivityYearId, allYears]);

  // Fetch ASC credit for each year for the cards
  useEffect(() => {
    async function fetchHistoricalCards() {
      if (!allYears.length) return;
      const cards = await Promise.all(
        allYears.map(async (year) => {
          let ascCredit = null;
          let calculationDetails = null;
          try {
            const calc = await RDCalculationsService.calculateCredits(year.id);
            ascCredit = calc.federalCredits.asc.credit;
            calculationDetails = calc.federalCredits.asc.calculationDetails;
          } catch (e) {}
          // Determine Internal/External: Internal if any selected_activities or employees/supplies/contractors with activityLink/activityRoles
          const isInternal = (year.selected_activities?.length > 0) ||
            (year.employees?.some(e => e.activityRoles && Object.keys(e.activityRoles).length > 0)) ||
            (year.supplies?.some(s => s.activityLink && Object.keys(s.activityLink).length > 0)) ||
            (year.contractors?.some(c => c.activityLink && Object.keys(c.activityLink).length > 0));
          // QRE breakdown for bar chart
          const employeeQRE = Array.isArray(year.employees) ? year.employees.reduce((sum, e) => sum + (e.calculated_qre || 0), 0) : 0;
          const contractorQRE = Array.isArray(year.contractors) ? year.contractors.reduce((sum, c) => sum + (c.calculated_qre || 0), 0) : 0;
          const supplyQRE = Array.isArray(year.supplies) ? year.supplies.reduce((sum, s) => sum + (s.calculated_qre || 0), 0) : 0;
          return {
            id: year.id,
            year: year.year,
            qre: year.total_qre,
            ascCredit,
            isInternal,
            employeeQRE,
            contractorQRE,
            supplyQRE,
            calculationDetails
          };
        })
      );
      setHistoricalCards(cards);
    }
    fetchHistoricalCards();
  }, [allYears]);

  useEffect(() => {
    if (wizardState.selectedYear?.id) {
      loadCalculations();
    }
  }, [wizardState.selectedYear?.id, use280C, corporateTaxRate]);

  const loadCalculations = async () => {
    if (!wizardState.selectedYear?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Always recalculate for debugging
      const newResults = await RDCalculationsService.calculateCredits(
        wizardState.selectedYear.id,
        use280C,
        corporateTaxRate / 100
      );
      setResults(newResults);
      onUpdate({ calculations: newResults });
    } catch (err) {
      console.error('Error loading calculations:', err);
      setError('Failed to load calculations. Please check your data and try again.');
      toast.error('Failed to load calculations');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!wizardState.selectedYear?.id) return;

    setLoading(true);
    setError(null);

    try {
      const newResults = await RDCalculationsService.calculateCredits(
        wizardState.selectedYear.id,
        use280C,
        corporateTaxRate / 100
      );

      setResults(newResults);
      onUpdate({ calculations: newResults });
      toast.success('Calculations updated successfully');
    } catch (err) {
      console.error('Error recalculating:', err);
      setError('Failed to recalculate. Please check your data and try again.');
      toast.error('Failed to recalculate');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
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
          onClick={handleRecalculate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Please complete the previous steps to calculate your R&D credits.</p>
      </div>
    );
  }

  const { federalCredits, currentYearQRE, stateCredits, totalFederalCredit, totalStateCredits, totalCredits } = results;

  // --- Move Total Tax Credits to the top as the header ---
  return (
    <div className="space-y-8">
      {/* Total Tax Credits Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white mb-8">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-10 h-10 mr-4" />
          <div>
            <h2 className="text-4xl font-bold">Total R&D Tax Credits</h2>
            <div className="text-lg opacity-80 mt-1">Federal + State Credits for Selected Year</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
          <div>
            <div className="text-sm opacity-90">Federal Credit</div>
            <div className="text-3xl font-bold">{formatCurrency(totalFederalCredit)}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">State Credits</div>
            <div className="text-3xl font-bold">{formatCurrency(totalStateCredits)}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Total Credits</div>
            <div className="text-4xl font-bold">{formatCurrency(totalCredits)}</div>
          </div>
        </div>
      </div>
      {/* End Total Tax Credits Header */}

      {/* Historical Credit Summary Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Historical Credit Summary</h3>
            <p className="text-sm text-gray-600">Review R&D credit calculations across all years with data</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Select Year:</label>
            <select
              value={selectedActivityYearId}
              onChange={(e) => {
                const newYearId = e.target.value;
                setSelectedActivityYearId(newYearId);
                const selectedYear = availableActivityYears.find(y => y.id === newYearId);
                if (selectedYear) {
                  setSelectedActivityYear(selectedYear.year);
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {availableActivityYears.map(y => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
          </div>
        </div>
        {historicalCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historicalCards.map((card, idx) => (
              <div key={card.year || idx} className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-bold text-gray-900">{card.year}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${card.isInternal ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>{card.isInternal ? 'Internal' : 'External'}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">QRE:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(card.qre)}</span>
                  </div>
                  {/* QRE Bar Chart */}
                  <div className="mt-2 mb-2">
                    <div className="flex justify-between items-end h-24 w-full max-w-xs mx-auto mt-2 mb-4">
                      {card.directQRE > 0 ? (
                        <div className="flex flex-col items-center w-full">
                          <span className="font-semibold text-xs mb-1">${(card.directQRE ?? 0).toLocaleString()}</span>
                          <div className="bg-gray-500 w-8 mx-auto" style={{ height: '64px' }} />
                          <span className="text-xs text-gray-700 mt-1">Direct</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col items-center w-1/3">
                            <span className="font-semibold text-xs mb-1">${(card.employeesQRE ?? 0).toLocaleString()}</span>
                            <div className="bg-blue-500 w-4" style={{ height: `${Math.max(8, card.qre ? (card.employeesQRE / (card.qre || 1)) * 64 : 8)}px` }} />
                            <span className="text-xs text-blue-700 mt-1">Emp</span>
                          </div>
                          <div className="flex flex-col items-center w-1/3">
                            <span className="font-semibold text-xs mb-1">${(card.contractorsQRE ?? 0).toLocaleString()}</span>
                            <div className="bg-green-500 w-4" style={{ height: `${Math.max(8, card.qre ? (card.contractorsQRE / (card.qre || 1)) * 64 : 8)}px` }} />
                            <span className="text-xs text-green-700 mt-1">Cont</span>
                          </div>
                          <div className="flex flex-col items-center w-1/3">
                            <span className="font-semibold text-xs mb-1">${(card.suppliesQRE ?? 0).toLocaleString()}</span>
                            <div className="bg-purple-500 w-4" style={{ height: `${Math.max(8, card.qre ? (card.suppliesQRE / (card.qre || 1)) * 64 : 8)}px` }} />
                            <span className="text-xs text-purple-700 mt-1">Supp</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">ASC Credit:</span>
                    <span className="font-semibold text-green-600">
                      {card.ascCredit !== null ? formatCurrency(card.ascCredit) : '—'}
                    </span>
                  </div>
                  {/* Accordion for calculation details */}
                  <AccordionSection title="Calculation Details" details={card.calculationDetails} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <p className="text-gray-600">No historical data available. Complete previous steps to see credit calculations.</p>
          </div>
        )}
      </div>
      {/* End Historical Summary Section */}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">R&D Tax Credit Calculations</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Review your Qualified Research Expenses and calculated tax credits using both Standard and Alternative Simplified Credit methods.
        </p>
      </div>

      {/* QRE Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Qualified Research Expenses (QRE)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(currentYearQRE.employee_wages)}
            </div>
            <div className="text-sm text-blue-600">Employee Wages</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(currentYearQRE.contractor_costs)}
            </div>
            <div className="text-sm text-green-600">Contractor Costs</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(currentYearQRE.supply_costs)}
            </div>
            <div className="text-sm text-purple-600">Supply Costs</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(currentYearQRE.total)}
            </div>
            <div className="text-sm text-orange-600">Total QRE</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Federal Credits - Left Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Federal R&D Tax Credits
            </h3>
            {/* Calculation Settings Controls */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Calculation Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Method Selection
                  </label>
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value as 'standard' | 'asc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="asc">Alternative Simplified Credit (ASC)</option>
                    <option value="standard">Standard Credit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Corporate Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={corporateTaxRate}
                    onChange={(e) => setCorporateTaxRate(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={use280C}
                      onChange={(e) => setUse280C(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Apply 280C Election</span>
                  </label>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <p>• <strong>ASC:</strong> {federalCredits.asc.isStartup ? '6%' : '14%'} of incremental QRE</p>
                <p>• <strong>Standard:</strong> 20% of incremental QRE over base amount (Base %: {Math.max(federalCredits.standard.basePercentage * 100, 3).toFixed(2)}%)</p>
                <p>• <strong>280C:</strong> Reduces credit by corporate tax rate to avoid double benefit</p>
              </div>
            </div>
            {/* End Calculation Settings Controls */}
            {/* Standard Credit with Detailed Calculations and Accordion */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Standard Credit (Regular Method)</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {federalCredits.standard.isEligible ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Year QRE:</span>
                        <span className="font-semibold">{formatCurrency(currentYearQRE.total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Base Percentage:</span>
                        <span className="font-semibold">{Math.max(federalCredits.standard.basePercentage * 100, 3).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Fixed Base Amount:</span>
                        <span className="font-semibold">{formatCurrency(federalCredits.standard.fixedBaseAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Incremental QRE:</span>
                        <span className="font-semibold">{formatCurrency(federalCredits.standard.incrementalQRE)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm text-gray-600">Credit (20%):</span>
                        <span className="text-lg font-semibold text-green-600">{formatCurrency(federalCredits.standard.credit)}</span>
                      </div>
                      {federalCredits.standard.adjustedCredit && (
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm text-gray-600">280C Adjusted Credit:</span>
                          <span className="text-lg font-semibold text-blue-600">{formatCurrency(federalCredits.standard.adjustedCredit)}</span>
                        </div>
                      )}
                    </div>
                    {/* Accordion for Standard calculation details */}
                    <AccordionSection title="Show Calculation Details" details={federalCredits.standard.calculationDetails} />
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <div>
                      <div className="font-medium">Not Eligible</div>
                      <div className="text-sm">
                        {federalCredits.standard.missingData.join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* ASC Credit with Detailed Calculations and Accordion */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3">Alternative Simplified Credit (ASC)</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Year QRE:</span>
                      <span className="font-semibold">{formatCurrency(currentYearQRE.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Prior QRE:</span>
                      <span className="font-semibold">{formatCurrency(federalCredits.asc.avgPriorQRE)}</span>
                    </div>
                    {federalCredits.asc.isStartup && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        Startup provision: Using 6% of current year QRE as base
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Incremental QRE:</span>
                      <span className="font-semibold">{formatCurrency(federalCredits.asc.incrementalQRE)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm text-gray-600">Credit ({federalCredits.asc.isStartup ? '6%' : '14%'}):</span>
                      <span className="text-lg font-semibold text-green-600">{formatCurrency(federalCredits.asc.credit)}</span>
                    </div>
                    {federalCredits.asc.adjustedCredit && (
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm text-gray-600">280C Adjusted Credit:</span>
                        <span className="text-lg font-semibold text-blue-600">{formatCurrency(federalCredits.asc.adjustedCredit)}</span>
                      </div>
                    )}
                  </div>
                  {federalCredits.asc.missingData.length > 0 && (
                    <div className="mt-3 flex items-center text-amber-600">
                      <Info className="w-4 h-4 mr-2" />
                      <div className="text-sm">{federalCredits.asc.missingData.join(', ')}</div>
                    </div>
                  )}
                  {/* Accordion for ASC calculation details */}
                  <AccordionSection title="Show Calculation Details" details={federalCredits.asc.calculationDetails} />
                </div>
              </div>
            </div>
            {/* Selected Method Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-600">Selected Method</div>
                  <div className="text-lg font-semibold text-blue-900">
                    {selectedMethod === 'standard' ? 'Standard Credit' : 'Alternative Simplified Credit'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-600">Federal Credit</div>
                  <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalFederalCredit)}</div>
                </div>
              </div>
            </div>
            {/* Debug Data Accordion */}
            <div className="mt-6">
              <button
                className="flex items-center text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 hover:bg-yellow-100 transition-colors"
                onClick={() => setShowDebug((v) => !v)}
                type="button"
              >
                {showDebug ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                {showDebug ? 'Hide' : 'Show'} Raw Calculation Data
              </button>
              {showDebug && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-900">
                  <div className="font-bold mb-1">[Debug] Raw Calculation Data</div>
                  <div><b>Current Year QRE Breakdown:</b> {JSON.stringify(results.currentYearQRE)}</div>
                  <div><b>Historical Data:</b> {JSON.stringify(results.historicalData)}</div>
                </div>
              )}
            </div>
            {/* End Debug Data Accordion */}
          </div>
        </div>

        {/* State Credits - Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              State R&D Tax Credits
            </h3>
            
            {stateCredits.length > 0 ? (
              <div className="space-y-4">
                {stateCredits.map((credit) => (
                  <div key={credit.state} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-lg font-semibold">{credit.state}</div>
                      <div className="text-sm text-gray-600">Rate: {formatPercentage(credit.rate)}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">QRE Applied:</span>
                        <span className="font-semibold">{formatCurrency(credit.qre)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm text-gray-600">State Credit:</span>
                        <span className="text-lg font-semibold text-green-600">{formatCurrency(credit.credit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-green-600">Total State Credits</div>
                    <div className="text-xl font-bold text-green-900">{formatCurrency(totalStateCredits)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No state credits available</p>
                <p className="text-sm">State calculations will be implemented soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CalculationStep; 