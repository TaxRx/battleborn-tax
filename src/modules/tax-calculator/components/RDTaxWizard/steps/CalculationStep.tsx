import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingUp, Building2, MapPin, DollarSign, AlertTriangle, CheckCircle, Info, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { RDCalculationsService, CalculationResults, FederalCreditResults } from '../../../services/rdCalculationsService';
import { StateCalculationService, StateCalculationResult, QREBreakdown } from '../../../services/stateCalculationService';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

// Standardized rounding functions
const roundToDollar = (value: number): number => Math.round(value);
const roundToPercentage = (value: number): number => Math.round(value * 100) / 100;

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

// KPI Chart Component
const KPIChart: React.FC<{ title: string; data: any[]; type: 'line' | 'bar' | 'pie'; color: string }> = ({ title, data, type, color }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
        <div className="text-center py-8 text-gray-400">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));

  // Use logarithmic scale for better visualization when values differ greatly
  const getBarHeight = (value: number) => {
    if (maxValue === minValue) return 100;
    
    // For efficiency chart (percentage), use linear scale
    if (title.includes('Efficiency')) {
      return Math.max((value / maxValue) * 100, 2); // Minimum 2% height
    }
    
    // For other charts, use logarithmic scale with minimum height
    const logMax = Math.log(maxValue + 1);
    const logValue = Math.log(value + 1);
    const height = (logValue / logMax) * 100;
    return Math.max(height, 3); // Minimum 3% height for visibility
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="space-y-2">
        {data.filter(item => item && typeof item.value === 'number').map((item, index) => {
          const height = getBarHeight(item.value);
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-12 text-xs text-gray-600 text-right">
                {item.label}
              </div>
              <div className="flex-1">
                <div className="relative">
                  <div 
                    className={`${color} rounded transition-all duration-300`}
                    style={{ 
                      height: `${height}%`,
                      minHeight: '8px'
                    }}
                  />
                  <div className="absolute top-0 right-0 text-xs text-gray-500 mt-1">
                    {typeof item.value === 'number' && item.value >= 1000 
                      ? `$${(item.value / 1000).toFixed(0)}k`
                      : typeof item.value === 'number' && item.value < 1
                      ? `${(item.value * 100).toFixed(1)}%`
                      : typeof item.value === 'number'
                      ? `$${item.value.toLocaleString()}`
                      : '$0'
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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

  // State calculation service instance
  const stateCalculationService = useMemo(() => StateCalculationService.getInstance(), []);
  
  // State for state calculations
  const [stateCredits, setStateCredits] = useState<any[]>([]);
  const [stateLoading, setStateLoading] = useState(false);
  const [selectedStateMethod, setSelectedStateMethod] = useState<string>('Standard');
  const [availableStateMethods, setAvailableStateMethods] = useState<string[]>([]);
  const [stateCalculations, setStateCalculations] = useState<any[]>([]);

  // State for manual variable overrides
  const [manualOverrides, setManualOverrides] = useState<{[key: string]: number}>({});
  const [showVariableEditor, setShowVariableEditor] = useState(false);
  const [variableEditorExpanded, setVariableEditorExpanded] = useState(false);

  // State for federal credit variable overrides
  const [federalManualOverrides, setFederalManualOverrides] = useState<{[key: string]: number}>({});
  const [federalVariableEditorExpanded, setFederalVariableEditorExpanded] = useState(false);
  const [ascVariableEditorExpanded, setAscVariableEditorExpanded] = useState(false);
  const [standardVariableEditorExpanded, setStandardVariableEditorExpanded] = useState(false);

  // Accordion state for debug data
  const [showDebug, setShowDebug] = useState(false);

  const [allYears, setAllYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(wizardState.selectedYear?.id || null);
  const [historicalCards, setHistoricalCards] = useState<any[]>([]);
  const [availableActivityYears, setAvailableActivityYears] = useState<Array<{id: string, year: number}>>([]);
  const [selectedActivityYearId, setSelectedActivityYearId] = useState<string>(wizardState.selectedYear?.id || '');
  const [selectedActivityYear, setSelectedActivityYear] = useState<number>(wizardState.selectedYear?.year || new Date().getFullYear());

  // --- Add state for selectedYearGrossReceipts ---
  const [selectedYearGrossReceipts, setSelectedYearGrossReceipts] = useState<number>(0);

  // --- Add state for prior 3 years gross receipts average ---
  const [avgPrior3GrossReceipts, setAvgPrior3GrossReceipts] = useState<number>(0);

  // Derive selectedYearData from allYears and selectedYearId
  const selectedYearData = useMemo(() => {
    if (!selectedYearId || !allYears.length) return null;
    return allYears.find(year => year.id === selectedYearId) || null;
  }, [selectedYearId, allYears]);

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
          console.error('Error fetching years:', yearsError);
          return;
        }

        // For each year, fetch supply subcomponents to get the actual supply QREs
        const yearsWithSupplyData = await Promise.all(
          years.map(async (year) => {
            // Fetch supply subcomponents for this business year
            const { data: supplySubcomponents, error: supplyError } = await supabase
              .from('rd_supply_subcomponents')
              .select(`
                *,
                supply:rd_supplies (*)
              `)
              .eq('business_year_id', year.id);

            if (supplyError) {
              console.error('Error fetching supply subcomponents:', supplyError);
              return { ...year, supply_subcomponents: [] };
            }

            return { ...year, supply_subcomponents: supplySubcomponents || [] };
          })
        );

        // Sort years ascending
        yearsWithSupplyData.sort((a, b) => a.year - b.year);

        // Prepare QRE values for ASC calculation
        const qreValues = yearsWithSupplyData.map(year => {
          const currentYear = new Date().getFullYear();
          const isCurrentYear = year.year === currentYear;
          
          if (isCurrentYear) {
            // For current year: Calculate from internal data
            const supplyQRE = year.supply_subcomponents?.reduce((sum, ssc) => {
              const amountApplied = ssc.amount_applied || 0;
              const appliedPercentage = ssc.applied_percentage || 0;
              const supplyCost = ssc.supply?.cost_amount || 0;
              const supplyQRE = amountApplied > 0 ? amountApplied : (supplyCost * appliedPercentage / 100);
              return sum + roundToDollar(supplyQRE);
            }, 0) || 0;
            
            const employeeQRE = year.employees?.reduce((sum, e) => {
              const annualWage = e.employee?.annual_wage || e.annual_wage || e.wage || 0;
              const appliedPercent = e.applied_percent || 0;
              const calculatedQRE = e.calculated_qre || e.qre || 0;
              const employeeQRE = calculatedQRE > 0 ? calculatedQRE : (annualWage * appliedPercent / 100);
              return sum + roundToDollar(employeeQRE);
            }, 0) || 0;
            
            const contractorQRE = year.contractors?.reduce((sum, c) => {
              const amount = c.amount || c.cost_amount || 0;
              const appliedPercent = c.applied_percent || 0;
              const calculatedQRE = c.calculated_qre || c.qre || 0;
              const contractorQRE = calculatedQRE > 0 ? calculatedQRE : (amount * appliedPercent / 100);
              return sum + roundToDollar(contractorQRE);
            }, 0) || 0;
            
            return roundToDollar(supplyQRE + employeeQRE + contractorQRE);
          } else {
            // For historical years: Use external QRE from Business Setup
            return roundToDollar(year.total_qre || 0);
          }
        });

        // Helper to get QRE for a year
        const getQRE = (year) => {
          const currentYear = new Date().getFullYear();
          const isCurrentYear = year.year === currentYear;
          
          if (isCurrentYear) {
            // For current year: Calculate from internal data
            const supplyQRE = year.supply_subcomponents?.reduce((sum, ssc) => {
              const amountApplied = ssc.amount_applied || 0;
              const appliedPercentage = ssc.applied_percentage || 0;
              const supplyCost = ssc.supply?.cost_amount || 0;
              const supplyQRE = amountApplied > 0 ? amountApplied : (supplyCost * appliedPercentage / 100);
              return sum + roundToDollar(supplyQRE);
            }, 0) || 0;
            
            const employeeQRE = year.employees?.reduce((sum, e) => {
              const annualWage = e.employee?.annual_wage || e.annual_wage || e.wage || 0;
              const appliedPercent = e.applied_percent || 0;
              const calculatedQRE = e.calculated_qre || e.qre || 0;
              const employeeQRE = calculatedQRE > 0 ? calculatedQRE : (annualWage * appliedPercent / 100);
              return sum + roundToDollar(employeeQRE);
            }, 0) || 0;
            
            const contractorQRE = year.contractors?.reduce((sum, c) => {
              const amount = c.amount || c.cost_amount || 0;
              const appliedPercent = c.applied_percent || 0;
              const calculatedQRE = c.calculated_qre || c.qre || 0;
              const contractorQRE = calculatedQRE > 0 ? calculatedQRE : (amount * appliedPercent / 100);
              return sum + roundToDollar(contractorQRE);
            }, 0) || 0;
            
            return roundToDollar(supplyQRE + employeeQRE + contractorQRE);
          } else {
            // For historical years: Use external QRE from Business Setup
            return roundToDollar(year.total_qre || 0);
          }
        };

        // Helper to get QRE breakdown for a year
        const getQREBreakdown = (year) => {
          const currentYear = new Date().getFullYear();
          const isCurrentYear = year.year === currentYear;
          
          if (isCurrentYear) {
            // For current year: Calculate from internal data
            const supplyQRE = year.supply_subcomponents?.reduce((sum, ssc) => {
              const amountApplied = ssc.amount_applied || 0;
              const appliedPercentage = ssc.applied_percentage || 0;
              const supplyCost = ssc.supply?.cost_amount || 0;
              const supplyQRE = amountApplied > 0 ? amountApplied : (supplyCost * appliedPercentage / 100);
              return sum + roundToDollar(supplyQRE);
            }, 0) || 0;
            
            const employeeQRE = year.employees?.reduce((sum, e) => {
              const annualWage = e.employee?.annual_wage || e.annual_wage || e.wage || 0;
              const appliedPercent = e.applied_percent || 0;
              const calculatedQRE = e.calculated_qre || e.qre || 0;
              const employeeQRE = calculatedQRE > 0 ? calculatedQRE : (annualWage * appliedPercent / 100);
              return sum + roundToDollar(employeeQRE);
            }, 0) || 0;
            
            const contractorQRE = year.contractors?.reduce((sum, c) => {
              const amount = c.amount || c.cost_amount || 0;
              const appliedPercent = c.applied_percent || 0;
              const calculatedQRE = c.calculated_qre || c.qre || 0;
              const contractorQRE = calculatedQRE > 0 ? calculatedQRE : (amount * appliedPercent / 100);
              return sum + roundToDollar(contractorQRE);
            }, 0) || 0;
            
            return {
              employeesQRE: employeeQRE,
              contractorsQRE: contractorQRE,
              suppliesQRE: supplyQRE,
              directQRE: 0
            };
          } else {
            // For historical years: Show all as direct since it's from Business Setup
            return {
              employeesQRE: 0,
              contractorsQRE: 0,
              suppliesQRE: 0,
              directQRE: roundToDollar(year.total_qre || 0)
            };
          }
        };

        // Helper to get ASC credit for a year, and show percentage used
        const getASCCredit = (yearIdx) => {
          const qre = getQRE(yearsWithSupplyData[yearIdx]);
          let validPriorQREs = [];
          for (let i = yearIdx - 1; i >= 0 && validPriorQREs.length < 3; i--) {
            const priorQRE = getQRE(yearsWithSupplyData[i]);
            if (priorQRE > 0) validPriorQREs.push(priorQRE);
            else break;
          }
          validPriorQREs = validPriorQREs.reverse();
          if (validPriorQREs.length === 3) {
            const avgPrior3 = validPriorQREs.reduce((a, b) => a + b, 0) / 3;
            const value = roundToDollar(Math.max(0, (qre - avgPrior3) * 0.14));
            return { value, percent: 14, avgPrior3 };
          } else {
            const value = roundToDollar(qre * 0.06);
            return { value, percent: 6, avgPrior3: null };
          }
        };

        // Helper to get Standard credit and base percentage (min 3%)
        const getStandardCredit = (yearIdx) => {
          const qre = getQRE(yearsWithSupplyData[yearIdx]);
          // Calculate base percentage from prior years, fallback to 3%
          let basePercent = 0.03;
          if (yearIdx >= 4) {
            const prior4 = qreValues.slice(yearIdx - 4, yearIdx);
            const priorGross = yearsWithSupplyData.slice(yearIdx - 4, yearIdx).map(y => y.gross_receipts || 0);
            const sumQRE = prior4.reduce((a, b) => a + b, 0);
            const sumGross = priorGross.reduce((a, b) => a + b, 0);
            if (sumGross > 0) {
              basePercent = Math.max(0.03, sumQRE / sumGross);
            }
          }
          // Standard credit: 20% of (current QRE - base percent * current gross receipts)
          const gross = yearsWithSupplyData[yearIdx].gross_receipts || 0;
          const baseAmount = basePercent * gross;
          return {
            value: roundToDollar(Math.max(0, (qre - baseAmount) * 0.20)),
            basePercent: roundToPercentage(basePercent * 100),
            baseAmount: roundToDollar(baseAmount),
            gross: roundToDollar(gross)
          };
        };

        // Helper to determine if QREs are external (entered in Business Setup)
        const isExternalQRE = (year) => {
          const currentYear = new Date().getFullYear();
          return year.year !== currentYear; // Historical years are external
        };

        setHistoricalCards(yearsWithSupplyData.map((year, idx) => {
          const breakdown = getQREBreakdown(year);
          const asc = getASCCredit(idx);
          const std = getStandardCredit(idx);
          return {
            year: year.year,
            qre: getQRE(year),
            ...breakdown,
            isInternal: !isExternalQRE(year), // Internal if not external
            isExternal: isExternalQRE(year),  // External if direct QRE entry
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
        
        setAvailableActivityYears(yearsWithSupplyData.sort((a, b) => b.year - a.year));
        setAllYears(yearsWithSupplyData.sort((a, b) => b.year - a.year));
        
        // Set initial selected year
        if (!selectedActivityYearId && yearsWithSupplyData.length > 0) {
          const currentYear = new Date().getFullYear();
          const matchingYear = yearsWithSupplyData.find(y => y.year === currentYear) || yearsWithSupplyData[0];
          setSelectedActivityYearId(matchingYear.id);
          setSelectedActivityYear(matchingYear.year);
          setSelectedYearId(matchingYear.id);
        }

        // 🔆 DEBUG: Print all years and their IDs
        yearsWithSupplyData.forEach(year => {
          console.log('%c🟦 Year Debug:', 'color: #fff; background: #00f; font-weight: bold;', { 
            year: year.year, 
            id: year.id, 
            supplies: year.supplies,
            supply_subcomponents: year.supply_subcomponents?.length || 0
          });
        });

        // 🔆 DEBUG: QRE and Supply Costs for Each Year
        yearsWithSupplyData.forEach(year => {
          const currentYear = new Date().getFullYear();
          const isCurrentYear = year.year === currentYear;
          
          if (isCurrentYear) {
            // For current year: Calculate internal QREs from Expense Management
            const supplyQRE = year.supply_subcomponents?.reduce((sum, ssc) => {
              const amountApplied = ssc.amount_applied || 0;
              const appliedPercentage = ssc.applied_percentage || 0;
              const supplyCost = ssc.supply?.cost_amount || 0;
              
              // Use amount_applied if available, otherwise calculate from cost and percentage
              const supplyQRE = amountApplied > 0 ? amountApplied : (supplyCost * appliedPercentage / 100);
              
              // Debug individual supply subcomponent
              console.log('%c🔍 Supply Subcomponent Debug:', 'color: #fff; background: #f0f; font-weight: bold;', {
                supplyId: ssc.supply_id,
                supplyName: ssc.supply?.name,
                supplyCost: supplyCost,
                appliedPercentage: appliedPercentage,
                amountApplied: amountApplied,
                calculatedQRE: roundToDollar(supplyQRE)
              });
              
              return sum + roundToDollar(supplyQRE);
            }, 0) || 0;
            
            // Calculate employee QRE the same way as RDCalculationsService
            const employeeQRE = year.employees?.reduce((sum, e) => {
              const annualWage = e.employee?.annual_wage || e.annual_wage || e.wage || 0;
              const appliedPercent = e.applied_percent || 0;
              const calculatedQRE = e.calculated_qre || e.qre || 0;
              
              // Use calculated QRE if available, otherwise calculate from wage and percent
              const employeeQRE = calculatedQRE > 0 ? calculatedQRE : (annualWage * appliedPercent / 100);
              
              // Debug individual employee
              console.log('%c🔍 Employee Debug:', 'color: #fff; background: #f0f; font-weight: bold;', {
                employeeId: e.employee_id,
                annualWage: annualWage,
                appliedPercent: appliedPercent,
                calculatedQRE: calculatedQRE,
                employeeQRE: roundToDollar(employeeQRE)
              });
              
              return sum + roundToDollar(employeeQRE);
            }, 0) || 0;
            
            // Calculate contractor QRE the same way as RDCalculationsService
            const contractorQRE = year.contractors?.reduce((sum, c) => {
              const amount = c.amount || c.cost_amount || 0;
              const appliedPercent = c.applied_percent || 0;
              const calculatedQRE = c.calculated_qre || c.qre || 0;
              
              // Use calculated QRE if available, otherwise calculate from amount and percent
              const contractorQRE = calculatedQRE > 0 ? calculatedQRE : (amount * appliedPercent / 100);
              
              return sum + roundToDollar(contractorQRE);
            }, 0) || 0;
            
            const totalQRE = roundToDollar(supplyQRE + employeeQRE + contractorQRE);
            
    
          } else {
            // For historical years: Use external QREs from Business Setup
            const totalQRE = year.total_qre || 0;
          }
        });

      } catch (error) {
        console.error('Error in fetchYears:', error);
      }
    }

    fetchYears();
  }, [wizardState.business?.id]);

  // --- Update effect to fetch gross receipts for selected year ---
  useEffect(() => {
    async function fetchGrossReceipts() {
      if (!wizardState.business?.id || !selectedActivityYear) return;
      try {
        const { data: years, error } = await supabase
          .from('rd_business_years')
          .select('year, gross_receipts')
          .eq('business_id', wizardState.business.id);
        if (error) {
          console.error('Error fetching rd_business_years:', error);
          setSelectedYearGrossReceipts(0);
          return;
        }
        const yearRow = years?.find((y: any) => y.year === selectedActivityYear);
        if (yearRow) {
          setSelectedYearGrossReceipts(Number(yearRow.gross_receipts) || 0);
        } else {
          setSelectedYearGrossReceipts(0);
          console.warn('No gross receipts found for year', selectedActivityYear);
        }
      } catch (err) {
        console.error('Exception fetching gross receipts:', err);
        setSelectedYearGrossReceipts(0);
      }
    }
    fetchGrossReceipts();
  }, [wizardState.business?.id, selectedActivityYear]);

  // --- Update effect to fetch average gross receipts for prior 3 years ---
  useEffect(() => {
    async function fetchAvgPrior3GrossReceipts() {
      if (!wizardState.business?.id || !selectedActivityYear) return;
      try {
        const { data: years, error } = await supabase
          .from('rd_business_years')
          .select('year, gross_receipts')
          .eq('business_id', wizardState.business.id);
        if (error) {
          console.error('Error fetching rd_business_years for avg prior 3:', error);
          setAvgPrior3GrossReceipts(0);
          return;
        }
        // Sort years ascending
        const sorted = (years || []).sort((a, b) => a.year - b.year);
        // Find the selected year index
        const idx = sorted.findIndex(y => y.year === selectedActivityYear);
        if (idx === -1 || idx < 3) {
          setAvgPrior3GrossReceipts(0);
          console.warn('Not enough prior years for avg prior 3 gross receipts:', selectedActivityYear);
          return;
        }
        // Get prior 3 years
        const prior3 = sorted.slice(idx - 3, idx);
        const avg = prior3.reduce((sum, y) => sum + Number(y.gross_receipts || 0), 0) / 3;
        setAvgPrior3GrossReceipts(avg);
      } catch (err) {
        console.error('Exception fetching avg prior 3 gross receipts:', err);
        setAvgPrior3GrossReceipts(0);
      }
    }
    fetchAvgPrior3GrossReceipts();
  }, [wizardState.business?.id, selectedActivityYear]);

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
      
      // Use the cards already calculated in the first useEffect
      const cards = allYears.map((year, idx) => {
        // Determine if QREs are external (entered in Business Setup)
        const isExternalQRE = year.total_qre > 0;
        const isInternal = !isExternalQRE;

        // Get QRE for this year (Business Setup takes precedence)
        let qre = 0;
        if (isExternalQRE) {
          // Use external QRE from Business Setup
          qre = year.total_qre;
        } else {
          // Calculate internal QRE from employees, contractors, supplies
          const employeeQRE = year.employees?.reduce((sum, e) => sum + roundToDollar(e.calculated_qre || 0), 0) || 0;
          const contractorQRE = year.contractors?.reduce((sum, c) => sum + roundToDollar(c.calculated_qre || 0), 0) || 0;
          const supplyQRE = year.supplies?.reduce((sum, s) => sum + roundToDollar(s.calculated_qre || 0), 0) || 0;
          qre = roundToDollar(employeeQRE + contractorQRE + supplyQRE);
        }

        // Calculate ASC credit based on the number of valid consecutive prior years
        let ascCredit = 0;
        let ascPercent = 0;
        let ascAvgPrior3 = null;
        // Find 3 consecutive prior years with QREs > 0
        let validPriorQREs = [];
        for (let i = idx - 1; i >= 0 && validPriorQREs.length < 3; i--) {
          let priorQRE = 0;
          if (allYears[i].total_qre > 0) priorQRE = allYears[i].total_qre;
          else {
            const empQRE = allYears[i].employees?.reduce((sum, e) => sum + roundToDollar(e.calculated_qre || 0), 0) || 0;
            const contQRE = allYears[i].contractors?.reduce((sum, c) => sum + roundToDollar(c.calculated_qre || 0), 0) || 0;
            const supQRE = allYears[i].supplies?.reduce((sum, s) => sum + roundToDollar(s.calculated_qre || 0), 0) || 0;
            priorQRE = roundToDollar(empQRE + contQRE + supQRE);
          }
          if (priorQRE > 0) validPriorQREs.push(priorQRE);
          else break; // must be consecutive
        }
        validPriorQREs = validPriorQREs.reverse();
        if (validPriorQREs.length === 3) {
          const avgPrior3 = validPriorQREs.reduce((a, b) => a + b, 0) / 3;
          ascCredit = roundToDollar(Math.max(0, (qre - avgPrior3) * 0.14));
          ascPercent = 14;
          ascAvgPrior3 = roundToDollar(avgPrior3);
        } else {
          ascCredit = roundToDollar(qre * 0.06);
          ascPercent = 6;
        }

        // QRE breakdown for bar chart (only for internal QREs)
        let employeeQRE = 0;
        let contractorQRE = 0;
        let supplyQRE = 0;

        if (isInternal) {
          employeeQRE = year.employees?.reduce((sum, e) => sum + roundToDollar(e.calculated_qre || 0), 0) || 0;
          contractorQRE = year.contractors?.reduce((sum, c) => sum + roundToDollar(c.calculated_qre || 0), 0) || 0;
          supplyQRE = year.supplies?.reduce((sum, s) => sum + roundToDollar(s.calculated_qre || 0), 0) || 0;
        }

        return {
          id: year.id,
          year: year.year,
          qre: qre,
          ascCredit: ascCredit,
          ascPercent: ascPercent,
          ascAvgPrior3: ascAvgPrior3,
          isInternal: isInternal,
          isExternal: isExternalQRE,
          employeeQRE: employeeQRE,
          contractorQRE: contractorQRE,
          supplyQRE: supplyQRE,
          calculationDetails: null // Will be populated if needed
        };
      });

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

  // Memoized QRE breakdown for state calculations
  const qreBreakdown = useMemo(() => {
    if (!results?.currentYearQRE) return null;
    
    return {
      wages: results.currentYearQRE.employee_wages || 0,
      contractor_costs: results.currentYearQRE.contractor_costs || 0,
      supply_costs: results.currentYearQRE.supply_costs || 0,
      contract_research: 0, // Will be added when contract research is implemented
      total_qre: results.currentYearQRE.total || 0
    };
  }, [results?.currentYearQRE]);

  // Load state calculations when QRE breakdown changes
  useEffect(() => {
    const loadStateCalculations = async () => {
      if (!qreBreakdown || qreBreakdown.total_qre === 0) {
        setStateCredits([]);
        setStateCalculations([]);
        setAvailableStateMethods([]);
        setStateLoading(false);
        return;
      }

      setStateLoading(true);
      try {
        const year = selectedActivityYear || new Date().getFullYear();
        const businessState = wizardState.business?.contact_info?.state || wizardState.business?.state;
        
        if (!businessState) {
          setStateCredits([]);
          setStateCalculations([]);
          setAvailableStateMethods([]);
          setStateLoading(false);
          return;
        }

        // Test database connectivity and check available tables
        try {
          const { data: testData, error: testError } = await supabase
            .from('rd_business_years')
            .select('count')
            .limit(1);
          
          if (testError) {
            console.error('Database connectivity issue:', testError);
            toast.error('Database connection error: ' + testError.message);
            setStateCredits([]);
            setStateCalculations([]);
            setAvailableStateMethods([]);
            setStateLoading(false);
            return;
          }
        } catch (connectError) {
          console.error('Database connectivity test failed:', connectError);
          toast.error('Database connection failed');
          setStateCredits([]);
          setStateCalculations([]);
          setAvailableStateMethods([]);
          setStateLoading(false);
          return;
        }

        // Query rd_state_calculations_full table for the selected state and year
        let { data: calculationRows, error } = await supabase
          .from('rd_state_calculations_full')
          .select('*')
          .eq('state', businessState);

        // Filter rows in JS: start_year is 'unknown' or <= year, and (end_year is null or >= year or 'unknown')
        if (calculationRows) {
          calculationRows = calculationRows.filter(row => {
            const startOk = row.start_year === 'unknown' || (!isNaN(parseInt(row.start_year)) && parseInt(row.start_year) <= year);
            const endOk = !row.end_year || row.end_year === 'unknown' || (!isNaN(parseInt(row.end_year)) && parseInt(row.end_year) >= year);
            return startOk && endOk;
          });
        }
        
        if (error) {
          console.error('Supabase error:', error);
          toast.error('Error loading state credit data: ' + error.message);
          setStateCredits([]);
          setStateCalculations([]);
          setAvailableStateMethods([]);
          setStateLoading(false);
          return;
        }

        if (!calculationRows || calculationRows.length === 0) {
          // Try to check what tables exist
          const { data: tables } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .like('table_name', '%state%');
          
          // Provide fallback calculation based on state
          const fallbackCredit = calculateFallbackStateCredit(businessState, qreBreakdown.total_qre);
          
          setStateCredits([{
            method: 'Standard',
            credit: fallbackCredit,
            formula: `Fallback calculation for ${businessState}`,
            info: `No specific state credit data found for ${businessState}. Using estimated calculation.`,
            refundable: 'No',
            carryforward: '15 years',
            eligible_entities: null,
            special_notes: 'This is a fallback calculation. Please verify with your tax advisor.',
            formula_correct: 'Estimated'
          }]);
          setStateCalculations([{
            state: businessState,
            standard_credit_formula: `Fallback for ${businessState}`,
            alternate_credit_formula: null,
            additional_credit_formula: null,
            standard_info: 'Fallback calculation',
            alternative_info: null,
            other_info: null,
            refundable: 'No',
            carryforward: '15 years',
            eligible_entities: null,
            special_notes: 'Fallback calculation',
            formula_correct: 'Estimated'
          }]);
          setAvailableStateMethods(['Standard']);
          setStateLoading(false);
          return;
        }

        // Only one row per state/year, but may have multiple formulas
        const row = calculationRows[0];
        const methods: string[] = [];
        if (row.standard_credit_formula) methods.push('Standard');
        if (row.alternate_credit_formula) methods.push('Alternative');
        if (row.additional_credit_formula) methods.push('Additional');
        setAvailableStateMethods(methods);
        setStateCalculations([row]);

        // Calculate credits for each method
        const calculatedCredits = [];
        // Standard
        if (row.standard_credit_formula) {
          const standardCredit = cleanAndEvaluateStateFormula(row.standard_credit_formula, qreBreakdown, wizardState.business, year);
          calculatedCredits.push({
            method: 'Standard',
            credit: standardCredit,
            formula: row.standard_credit_formula,
            info: row.standard_info,
            refundable: row.refundable,
            carryforward: row.carryforward,
            eligible_entities: row.eligible_entities,
            special_notes: row.special_notes,
            formula_correct: row.formula_correct
          });
        }
        // Alternative
        if (row.alternate_credit_formula) {
          const alternativeCredit = cleanAndEvaluateStateFormula(row.alternate_credit_formula, qreBreakdown, wizardState.business, year);
          calculatedCredits.push({
            method: 'Alternative',
            credit: alternativeCredit,
            formula: row.alternate_credit_formula,
            info: row.alternative_info,
            refundable: row.refundable,
            carryforward: row.carryforward,
            eligible_entities: row.eligible_entities,
            special_notes: row.special_notes,
            formula_correct: row.formula_correct
          });
        }
        // Additional (always apply in addition to selected method)
        if (row.additional_credit_formula) {
          const additionalCredit = cleanAndEvaluateStateFormula(row.additional_credit_formula, qreBreakdown, wizardState.business, year);
          calculatedCredits.push({
            method: 'Additional',
            credit: additionalCredit,
            formula: row.additional_credit_formula,
            info: row.other_info,
            refundable: row.refundable,
            carryforward: row.carryforward,
            eligible_entities: row.eligible_entities,
            special_notes: row.special_notes,
            formula_correct: row.formula_correct
          });
        }
        setStateCredits(calculatedCredits);
        
      } catch (e) {
        console.error('[STATE CREDIT] ❌ Exception in state credit calculation:', e);
        toast.error('Error calculating state credits: ' + e.message);
        setStateCredits([]);
        setStateCalculations([]);
        setAvailableStateMethods([]);
      } finally {
        setStateLoading(false);
      }
    };
    loadStateCalculations();
  }, [qreBreakdown, selectedActivityYear, wizardState.business?.state, manualOverrides]);

  // --- Update cleanAndEvaluateStateFormula to support Avg Gross Receipts for prior 3 years ---
  const cleanAndEvaluateStateFormula = (formula: string, qreBreakdown: any, business: any, year: number): number => {
    try {
      const qres = qreBreakdown.total_qre || 0;
      const wages = qreBreakdown.employee_costs || 0;
      const contractors = qreBreakdown.contractor_costs || 0;
      const supplies = qreBreakdown.supply_costs || 0;
      // Use selectedYearGrossReceipts for all calculations
      const grossReceipts = selectedYearGrossReceipts;
      const avgGrossReceipts = avgPrior3GrossReceipts;
      const basicPayments = business?.basic_research_payments || 0;
      const fixedBasePercent = 0.03;
      
      let evaluatedFormula = formula
        .replace(/Credit\s*=\s*/gi, '')
        .replace(/or\s*/gi, '')
        .replace(/direct/gi, '')
        .replace(/\bpercent\b/gi, '')
        .replace(/\bpercentages?\b/gi, '')
        .replace(/\bof\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Replace variables in specific order to avoid conflicts
      evaluatedFormula = evaluatedFormula.replace(/QREs/gi, qres.toString());
      evaluatedFormula = evaluatedFormula.replace(/employee costs/gi, wages.toString());
      evaluatedFormula = evaluatedFormula.replace(/contractor costs/gi, contractors.toString());
      evaluatedFormula = evaluatedFormula.replace(/supply costs/gi, supplies.toString());
      evaluatedFormula = evaluatedFormula.replace(/basic payments/gi, basicPayments.toString());
      
      // Handle "Avg Gross Receipts for prior 3 years" first (most specific)
      evaluatedFormula = evaluatedFormula.replace(/(Avg|avg)?\s*Gross\s*Receipts\s*for\s*prior\s*3\s*years/gi, avgGrossReceipts.toString());
      evaluatedFormula = evaluatedFormula.replace(/(Avg|avg)?\s*Gross\s*Receipts\s*for\s*prior\s*three\s*years/gi, avgGrossReceipts.toString());
      evaluatedFormula = evaluatedFormula.replace(/(Avg|avg)?\s*Gross\s*Receipts\s*for\s*prior\s*years/gi, avgGrossReceipts.toString());
      
      // Handle "Avg Gross Receipts" (less specific)
      evaluatedFormula = evaluatedFormula.replace(/(Avg|avg)?\s*Gross\s*Receipts/gi, grossReceipts.toString());
      evaluatedFormula = evaluatedFormula.replace(/Gross\s*Receipts/gi, grossReceipts.toString());
      
      evaluatedFormula = evaluatedFormula.replace(/Fixed-Base\s*%/gi, fixedBasePercent.toString());
      evaluatedFormula = evaluatedFormula.replace(/Fixed-/gi, '');
      
      // Convert math symbols
      evaluatedFormula = evaluatedFormula
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/%/g, '/100');
      
      // Clean up any remaining text that should be removed - more aggressive
      evaluatedFormula = evaluatedFormula
        .replace(/\bfor prior 3 years\b/gi, '')
        .replace(/\bprior 3 years\b/gi, '')
        .replace(/\bprior three years\b/gi, '')
        .replace(/\bprior years\b/gi, '')
        .replace(/\bavg\b/gi, '')
        .replace(/\baverage\b/gi, '')
        .replace(/\bfpri3 years\b/gi, '') // Remove the leftover fragment
        .replace(/\bfpri\b/gi, '') // Remove any "fpri" fragments
        .replace(/\byears\b/gi, '') // Remove any standalone "years"
        .replace(/\s+/g, ' ')
        .trim();
      
      // Clean up math syntax
      evaluatedFormula = evaluatedFormula
        .replace(/\*\*/g, '*')
        .replace(/\+\+/g, '+')
        .replace(/--/g, '-')
        .replace(/\(\s*\)/g, '(0)')
        .replace(/\(\s*([+\-*/])\s*\)/g, '(0)')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Remove leading/trailing operators
      evaluatedFormula = evaluatedFormula.replace(/^[+\-*/\s]+|[+\-*/\s]+$/g, '');
      
      if (!/^[-+*/().\d\s]+$/.test(evaluatedFormula)) {
        console.error('Formula contains invalid characters:', evaluatedFormula);
        return 0;
      }
      
      const result = Function('"use strict"; return (' + evaluatedFormula + ')')();
      return isNaN(result) ? 0 : Math.max(0, result);
    } catch (error) {
      console.error('Error evaluating state formula:', formula, error);
      return 0;
    }
  };

  // Enhanced formula evaluation with fallback for complex formulas
  const evaluateComplexFormula = (formula: string, qreBreakdown: any, business: any, state: string): number => {
    try {
      const qres = qreBreakdown.total_qre || 0;
      const grossReceipts = business?.gross_receipts || 0;
      
      // Try the original formula first
      const originalResult = cleanAndEvaluateStateFormula(formula, qreBreakdown, business, new Date().getFullYear());
      if (originalResult > 0) {
        return originalResult;
      }
      
      // Fallback calculations for specific states
      switch (state) {
        case 'UT':
          // Utah: 5% credit on QREs with base amount reduction
          const baseAmount = grossReceipts * 0.03; // 3% of gross receipts
          const qualifiedQRE = Math.max(0, qres - baseAmount);
          return qualifiedQRE * 0.05;
        
        case 'CA':
          // California: 15% credit on incremental QREs
          const baseQRE = qres * 0.5; // Simplified base
          const incrementalQRE = Math.max(0, qres - baseQRE);
          return incrementalQRE * 0.15;
        
        case 'NY':
          // New York: 9% credit on qualified QREs
          return qres * 0.09;
        
        default:
          // Default: 5% credit on total QREs
          return qres * 0.05;
      }
    } catch (error) {
      console.error('Error in complex formula evaluation:', error);
      return 0;
    }
  };

  // Fallback state credit calculation when no database data is available
  const calculateFallbackStateCredit = (state: string, totalQRE: number): number => {
    // Basic state credit rates (simplified estimates)
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
      'VA': 0.15, // Virginia
      'WA': 0.00, // Washington (no state R&D credit)
      'CO': 0.03, // Colorado
      'AZ': 0.00, // Arizona (no state R&D credit)
      'TN': 0.00, // Tennessee (no state R&D credit)
      'IN': 0.10, // Indiana
      'WI': 0.05, // Wisconsin
      'MN': 0.10, // Minnesota
      'MO': 0.05, // Missouri
      'LA': 0.00, // Louisiana (no state R&D credit)
      'UT': 0.05, // Utah
    };

    const rate = stateRates[state] || 0.05; // Default to 5% if state not found
    return totalQRE * rate;
  };

  // Helper functions for variable overrides
  const getVariableValue = (variableName: string, defaultValue: number): number => {
    return manualOverrides[variableName] !== undefined ? manualOverrides[variableName] : defaultValue;
  };

  const updateVariableOverride = (variableName: string, value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setManualOverrides(prev => ({ ...prev, [variableName]: numValue }));
  };

  const resetVariableOverride = (variableName: string) => {
    setManualOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[variableName];
      return newOverrides;
    });
  };

  const resetAllOverrides = () => {
    setManualOverrides({});
  };

  // Federal credit variable functions
  const getFederalVariableValue = (variableName: string, defaultValue: number): number => {
    return federalManualOverrides[variableName] !== undefined ? federalManualOverrides[variableName] : defaultValue;
  };

  const updateFederalVariableOverride = (variableName: string, value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setFederalManualOverrides(prev => ({ ...prev, [variableName]: numValue }));
  };

  const resetFederalVariableOverride = (variableName: string) => {
    setFederalManualOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[variableName];
      return newOverrides;
    });
  };

  const resetAllFederalOverrides = () => {
    setFederalManualOverrides({});
  };

  // --- Update getCurrentVariables to use selectedYearGrossReceipts ---
  const getCurrentVariables = () => {
    const qre = getVariableValue('QREs', qreBreakdown?.total_qre || 0);
    const grossReceipts = getVariableValue('Gross Receipts', selectedYearGrossReceipts);
    const basicPayments = getVariableValue('Basic Payments', wizardState.business?.basic_research_payments || 0);
    const fixedBasePercent = getVariableValue('Fixed-Base %', 0.03);
    return {
      'QREs': { system: qreBreakdown?.total_qre || 0, current: qre },
      'Gross Receipts': { system: selectedYearGrossReceipts, current: grossReceipts },
      'Basic Payments': { system: wizardState.business?.basic_research_payments || 0, current: basicPayments },
      'Fixed-Base %': { system: 0.03, current: fixedBasePercent }
    };
  };

  // Federal credit variable functions
  const getASCCreditVariables = () => {
    const currentQRE = getFederalVariableValue('Current QRE', federalCurrentYearQRE?.total || 0);
    const avgPriorQRE = getFederalVariableValue('Avg Prior QRE', federalCredits?.asc?.avgPriorQRE || 0);
    const ascRate = getFederalVariableValue('ASC Rate', federalCredits?.asc?.isStartup ? 0.06 : 0.14);
    return {
      'Current QRE': { system: federalCurrentYearQRE?.total || 0, current: currentQRE },
      'Avg Prior QRE': { system: federalCredits?.asc?.avgPriorQRE || 0, current: avgPriorQRE },
      'ASC Rate': { system: federalCredits?.asc?.isStartup ? 0.06 : 0.14, current: ascRate }
    };
  };

  const getStandardCreditVariables = () => {
    const currentQRE = getFederalVariableValue('Current QRE', federalCurrentYearQRE?.total || 0);
    const basePercentage = getFederalVariableValue('Base Percentage', federalCredits?.standard?.basePercentage || 0.03);
    const grossReceipts = getFederalVariableValue('Gross Receipts', selectedYearGrossReceipts);
    const standardRate = getFederalVariableValue('Standard Rate', 0.20);
    return {
      'Current QRE': { system: federalCurrentYearQRE?.total || 0, current: currentQRE },
      'Base Percentage': { system: federalCredits?.standard?.basePercentage || 0.03, current: basePercentage },
      'Gross Receipts': { system: selectedYearGrossReceipts, current: grossReceipts },
      'Standard Rate': { system: 0.20, current: standardRate }
    };
  };

  // --- Fix calculation selection: only show/use selected method ---
  // In the State Credits UI, filter stateCredits to only the selectedStateMethod for both display and total calculation
  const selectedStateCredit = useMemo(() => {
    return stateCredits.find(c => c.method === selectedStateMethod) || null;
  }, [stateCredits, selectedStateMethod]);

  const totalStateCredits = useMemo(() => {
    // Only sum the selected method and any Additional method (if present)
    let total = 0;
    if (selectedStateCredit) total += selectedStateCredit.credit || 0;
    const additional = stateCredits.find(c => c.method === 'Additional');
    if (additional) total += additional.credit || 0;
    return total;
  }, [selectedStateCredit, stateCredits]);

  // Get current year QRE breakdown for summary cards
  const currentYearQRE = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentYearData = allYears.find(year => year.year === currentYear);
    
    if (!currentYearData) return null;

    // Calculate QREs using the same logic as Expense Management page
    const supplyQRE = currentYearData.supply_subcomponents?.reduce((sum, ssc) => {
      const amountApplied = ssc.amount_applied || 0;
      const appliedPercentage = ssc.applied_percentage || 0;
      const supplyCost = ssc.supply?.cost_amount || 0;
      const supplyQRE = amountApplied > 0 ? amountApplied : (supplyCost * appliedPercentage / 100);
      return sum + roundToDollar(supplyQRE);
    }, 0) || 0;
    
    // Use employee.calculated_qre since annual_wage is not populated correctly
    const employeeQRE = currentYearData.employees?.reduce((sum, e) => {
      const calculatedQRE = e.calculated_qre || 0;
      return sum + roundToDollar(calculatedQRE);
    }, 0) || 0;
    
    // Use contractor.calculated_qre since amount is not populated correctly
    const contractorQRE = currentYearData.contractors?.reduce((sum, c) => {
      const calculatedQRE = c.calculated_qre || 0;
      return sum + roundToDollar(calculatedQRE);
    }, 0) || 0;

    const result = {
      supply_costs: supplyQRE,
      employee_costs: employeeQRE,
      contractor_costs: contractorQRE,
      total_qre: roundToDollar(supplyQRE + employeeQRE + contractorQRE)
    };

    return result;
  }, [allYears]);

  // Prepare data for KPI charts
  const chartData = useMemo(() => {
    if (!allYears.length) {
      return { qreData: [], creditData: [], efficiencyData: [] };
    }

    const currentYear = new Date().getFullYear();
    
    // QRE over years chart data
    const qreData = allYears.map(year => {
      const isCurrentYear = year.year === currentYear;
      
      if (isCurrentYear) {
        // For current year: Calculate from internal data
        const supplyQRE = year.supply_subcomponents?.reduce((sum, ssc) => {
          const amountApplied = ssc.amount_applied || 0;
          const appliedPercentage = ssc.applied_percentage || 0;
          const supplyCost = ssc.supply?.cost_amount || 0;
          const supplyQRE = amountApplied > 0 ? amountApplied : (supplyCost * appliedPercentage / 100);
          return sum + roundToDollar(supplyQRE);
        }, 0) || 0;
        
        // Use employee.calculated_qre since annual_wage is not populated correctly
        const employeeQRE = year.employees?.reduce((sum, e) => {
          const calculatedQRE = e.calculated_qre || 0;
          return sum + roundToDollar(calculatedQRE);
        }, 0) || 0;
        
        // Use contractor.calculated_qre since amount is not populated correctly
        const contractorQRE = year.contractors?.reduce((sum, c) => {
          const calculatedQRE = c.calculated_qre || 0;
          return sum + roundToDollar(calculatedQRE);
        }, 0) || 0;
        
        const totalQRE = roundToDollar(supplyQRE + employeeQRE + contractorQRE);
        
        return {
          year: year.year,
          qre: totalQRE || 0,
          employees: employeeQRE || 0,
          contractors: contractorQRE || 0,
          supplies: supplyQRE || 0
        };
      } else {
        // For historical years: Use external QRE from Business Setup
        const totalQRE = roundToDollar(year.total_qre || 0);
        
        return {
          year: year.year,
          qre: totalQRE || 0,
          employees: 0,
          contractors: 0,
          supplies: 0
        };
      }
    });

    // Credit values over years chart data
    const creditData = qreData.map(item => ({
      year: item.year,
      federalCredit: roundToDollar((item.qre || 0) * 0.20), // 20% federal credit
      stateCredit: roundToDollar(totalStateCredits), // Use actual calculated state credits
      totalCredit: roundToDollar((item.qre || 0) * 0.20 + totalStateCredits) // Federal + State
    }));

    // Efficiency metric chart data (simplified to avoid division by zero)
    const efficiencyData = qreData.map(item => ({
      year: item.year,
      qrePerEmployee: (item.employees || 0) > 0 ? roundToDollar((item.qre || 0) / ((item.employees || 0) / 100000)) : 0, // QRE per $100k employee
      researchIntensity: (item.qre || 0) > 0 ? roundToPercentage(((item.qre || 0) / ((item.qre || 0) * 5)) * 100) : 0, // Research intensity percentage
      supplyEfficiency: (item.qre || 0) > 0 ? roundToPercentage(((item.supplies || 0) / (item.qre || 0)) * 100) : 0 // Supply percentage of total QRE
    }));
    
    return { qreData, creditData, efficiencyData };
  }, [allYears, totalStateCredits]);

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

  const { federalCredits, currentYearQRE: federalCurrentYearQRE, stateCredits: federalStateCredits, totalFederalCredit, totalStateCredits: totalFederalStateCredits, totalCredits } = results;

  return (
    <div className="space-y-6">
      {/* Header with Year Selector */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <TrendingUp className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-3xl font-bold">R&D Tax Credits</h2>
              <div className="text-sm opacity-80">Federal + State Credits</div>
              <div className="flex items-center space-x-2 mt-2">
                <label className="text-sm opacity-90">Year:</label>
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
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {availableActivityYears.map(y => (
                    <option key={y.id} value={y.id}>{y.year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Total Credits</div>
            <div className="text-3xl font-bold">{formatCurrency(totalCredits)}</div>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">
            {selectedYearData?.employees?.length || 0}
          </div>
          <div className="text-sm text-blue-600">Employees</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">
            {selectedYearData?.contractors?.length || 0}
          </div>
          <div className="text-sm text-green-600">Contractors</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">
            {selectedYearData?.supply_subcomponents?.length || 0}
          </div>
          <div className="text-sm text-purple-600">Supplies</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-900">
            {selectedYearData?.selected_activities?.length || 0}
          </div>
          <div className="text-sm text-orange-600">Activities</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-indigo-900">
            {(selectedYearData?.supply_subcomponents?.length || 0) + (selectedYearData?.employees?.length || 0) + (selectedYearData?.contractors?.length || 0)}
          </div>
          <div className="text-sm text-indigo-600">Total Subcomponents</div>
        </div>
      </div>

      {/* QRE Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">
            {formatCurrency(currentYearQRE?.employee_costs || 0)}
          </div>
          <div className="text-sm text-blue-600">Employee Wages</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(currentYearQRE?.contractor_costs || 0)}
          </div>
          <div className="text-sm text-green-600">Contractor Costs</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">
            {formatCurrency(currentYearQRE?.supply_costs || 0)}
          </div>
          <div className="text-sm text-purple-600">Supply Costs</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-900">
            {formatCurrency(currentYearQRE?.total_qre || 0)}
          </div>
          <div className="text-sm text-orange-600">Total QRE</div>
        </div>
      </div>

      {/* KPI Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIChart 
          title="QREs Over Years" 
          data={(chartData?.qreData || []).map(item => ({ label: item.year.toString(), value: item.qre }))} 
          type="bar" 
          color="bg-blue-500" 
        />
        <KPIChart 
          title="ASC Credits Over Years" 
          data={(chartData?.creditData || []).map(item => ({ label: item.year.toString(), value: item.credit }))} 
          type="bar" 
          color="bg-green-500" 
        />
        <KPIChart 
          title="Credit Efficiency (%)" 
          data={(chartData?.efficiencyData || []).map(item => ({ label: item.year.toString(), value: item.efficiency }))} 
          type="line" 
          color="bg-purple-500" 
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Federal Credits */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Federal Credits
            </h3>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Federal</div>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(totalFederalCredit)}</div>
            </div>
          </div>

          {/* Calculation Settings */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as 'standard' | 'asc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="asc">ASC</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  value={corporateTaxRate}
                  onChange={(e) => setCorporateTaxRate(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                  <span className="ml-2 text-sm text-gray-700">280C Election</span>
                </label>
              </div>
            </div>
          </div>

          {/* Credit Calculations */}
          <div className="space-y-4">
            {/* ASC Credit */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">ASC Credit</span>
                <span className="text-lg font-semibold text-green-600">{formatCurrency(federalCredits.asc.credit)}</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Current QRE: {formatCurrency(federalCurrentYearQRE.total)}</div>
                <div>Avg Prior QRE: {formatCurrency(federalCredits.asc.avgPriorQRE)}</div>
                <div>Rate: {federalCredits.asc.isStartup ? '6%' : '14%'}</div>
              </div>
              
              {/* ASC Credit Variable Editor */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setAscVariableEditorExpanded(!ascVariableEditorExpanded)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {ascVariableEditorExpanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                    ASC Calculation Variables
                    {Object.keys(federalManualOverrides).filter(key => ['Current QRE', 'Avg Prior QRE', 'ASC Rate'].includes(key)).length > 0 && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {Object.keys(federalManualOverrides).filter(key => ['Current QRE', 'Avg Prior QRE', 'ASC Rate'].includes(key)).length} modified
                      </span>
                    )}
                  </button>
                  {Object.keys(federalManualOverrides).filter(key => ['Current QRE', 'Avg Prior QRE', 'ASC Rate'].includes(key)).length > 0 && (
                    <button
                      onClick={() => {
                        ['Current QRE', 'Avg Prior QRE', 'ASC Rate'].forEach(key => resetFederalVariableOverride(key));
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Reset All
                    </button>
                  )}
                </div>
                
                {ascVariableEditorExpanded && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(getASCCreditVariables()).map(([variableName, values]) => {
                        const isCurrency = variableName === 'Current QRE' || variableName === 'Avg Prior QRE';
                        const isPercent = variableName === 'ASC Rate';
                        let helpText = '';
                        if (variableName === 'Current QRE') helpText = 'Qualified Research Expenses for the current year.';
                        if (variableName === 'Avg Prior QRE') helpText = 'Average QREs for the 3 years prior to the current year. Used for multi-year ASC (14%). If less than 3 years, single-year ASC (6%) is used.';
                        if (variableName === 'ASC Rate') helpText = 'ASC rate: 14% if 3+ prior years of QREs, otherwise 6% (startup/single-year).';
                        return (
                          <div key={variableName} className="flex flex-col">
                            <label className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                              {variableName}
                              {helpText && (
                                <span className="ml-1 text-gray-400" title={helpText}>ⓘ</span>
                              )}
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={isCurrency ? formatCurrency(values.current) : isPercent ? formatPercentage(values.current) : values.current}
                                onChange={e => {
                                  let val = e.target.value.replace(/[^\d.\-]/g, '');
                                  if (isCurrency) val = val.replace(/\$/g, '');
                                  if (isPercent) val = val.replace(/%/g, '');
                                  updateFederalVariableOverride(variableName, val);
                                }}
                                placeholder={isCurrency ? '$xx,xxx' : isPercent ? 'X.XX%' : ''}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <span className="text-xs text-gray-400">System: {isCurrency ? formatCurrency(values.system) : isPercent ? formatPercentage(values.system) : values.system}</span>
                              {federalManualOverrides[variableName] !== undefined && (
                                <button
                                  onClick={() => resetFederalVariableOverride(variableName)}
                                  className="ml-2 text-xs text-red-500 hover:text-red-700"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <AccordionSection title="ASC Details" details={federalCredits.asc.calculationDetails} />
            </div>

            {/* Standard Credit */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Standard Credit</span>
                <span className="text-lg font-semibold text-green-600">{formatCurrency(federalCredits.standard.credit)}</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Base %: {Math.max(federalCredits.standard.basePercentage * 100, 3).toFixed(2)}%</div>
                <div>Base Amount: {formatCurrency(Math.max(federalCredits.standard.fixedBaseAmount, 0.5 * federalCurrentYearQRE.total))}</div>
                <div>Incremental QRE: {formatCurrency(federalCredits.standard.incrementalQRE)}</div>
                <div>Rate: 20%</div>
              </div>
              
              {/* Standard Credit Variable Editor */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setStandardVariableEditorExpanded(!standardVariableEditorExpanded)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {standardVariableEditorExpanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                    Standard Calculation Variables
                    {Object.keys(federalManualOverrides).filter(key => ['Current QRE', 'Base Percentage', 'Gross Receipts', 'Standard Rate'].includes(key)).length > 0 && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {Object.keys(federalManualOverrides).filter(key => ['Current QRE', 'Base Percentage', 'Gross Receipts', 'Standard Rate'].includes(key)).length} modified
                      </span>
                    )}
                  </button>
                  {Object.keys(federalManualOverrides).filter(key => ['Current QRE', 'Base Percentage', 'Gross Receipts', 'Standard Rate'].includes(key)).length > 0 && (
                    <button
                      onClick={() => {
                        ['Current QRE', 'Base Percentage', 'Gross Receipts', 'Standard Rate'].forEach(key => resetFederalVariableOverride(key));
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Reset All
                    </button>
                  )}
                </div>
                
                {standardVariableEditorExpanded && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(getStandardCreditVariables()).map(([variableName, values]) => {
                        const isCurrency = variableName === 'Current QRE' || variableName === 'Gross Receipts';
                        const isPercent = variableName === 'Base Percentage' || variableName === 'Standard Rate';
                        // For Base Percentage, always show the effective (>=3%)
                        let displayCurrent = values.current;
                        let displaySystem = values.system;
                        let helpText = '';
                        if (variableName === 'Current QRE') helpText = 'Qualified Research Expenses for the current year.';
                        if (variableName === 'Base Percentage') helpText = 'Greater of: (Avg QREs for up to 4 prior years) / (Avg Gross Receipts for those years), or 3% (IRS minimum).';
                        if (variableName === 'Gross Receipts') helpText = 'Gross receipts for the current year. Used to determine the base amount.';
                        if (variableName === 'Standard Rate') helpText = 'Standard credit rate (20%).';
                        if (variableName === 'Base Percentage') {
                          displayCurrent = Math.max(values.current, 0.03);
                          displaySystem = Math.max(values.system, 0.03);
                        }
                        return (
                          <div key={variableName} className="flex flex-col">
                            <label className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                              {variableName}
                              {helpText && (
                                <span className="ml-1 text-gray-400" title={helpText}>ⓘ</span>
                              )}
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={isCurrency ? formatCurrency(displayCurrent) : isPercent ? formatPercentage(displayCurrent) : displayCurrent}
                                onChange={e => {
                                  let val = e.target.value.replace(/[^\d.\-]/g, '');
                                  if (isCurrency) val = val.replace(/\$/g, '');
                                  if (isPercent) val = val.replace(/%/g, '');
                                  updateFederalVariableOverride(variableName, val);
                                }}
                                placeholder={isCurrency ? '$xx,xxx' : isPercent ? 'X.XX%' : ''}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <span className="text-xs text-gray-400">System: {isCurrency ? formatCurrency(displaySystem) : isPercent ? formatPercentage(displaySystem) : displaySystem}</span>
                              {federalManualOverrides[variableName] !== undefined && (
                                <button
                                  onClick={() => resetFederalVariableOverride(variableName)}
                                  className="ml-2 text-xs text-red-500 hover:text-red-700"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <AccordionSection title="Standard Details" details={federalCredits.standard.calculationDetails} />
            </div>
          </div>
        </div>

        {/* State Credits */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              State Credits
            </h3>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total State</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(totalStateCredits)}</div>
            </div>
          </div>

          {/* Loading State */}
          {stateLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading state credit calculations...</p>
            </div>
          )}

          {/* No Data State */}
          {!stateLoading && (!stateCredits || stateCredits.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No state credit calculations available</p>
              <p className="text-xs mt-1">Make sure your business state is set and QRE data is available</p>
            </div>
          )}

          {/* State Method Selector */}
          {!stateLoading && availableStateMethods.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calculation Method
              </label>
              <select
                value={selectedStateMethod}
                onChange={(e) => setSelectedStateMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableStateMethods.filter(method => method !== 'Additional').map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          )}

          {/* Variable Editor */}
          {!stateLoading && stateCredits.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setVariableEditorExpanded(!variableEditorExpanded)}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {variableEditorExpanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                  Calculation Variables
                  {Object.keys(manualOverrides).length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {Object.keys(manualOverrides).length} modified
                    </span>
                  )}
                </button>
                {Object.keys(manualOverrides).length > 0 && (
                  <button
                    onClick={resetAllOverrides}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Reset All
                  </button>
                )}
              </div>
              
              {variableEditorExpanded && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(getCurrentVariables()).map(([variableName, values]) => {
                      // Determine formatting type
                      const isCurrency = variableName === 'QREs' || variableName === 'Gross Receipts' || variableName === 'Basic Payments';
                      const isPercent = variableName === 'Fixed-Base %';
                      return (
                        <div key={variableName} className="flex flex-col">
                          <label className="text-xs font-medium text-gray-700 mb-1">{variableName}</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={isCurrency ? formatCurrency(values.current) : isPercent ? formatPercentage(values.current) : values.current}
                              onChange={e => {
                                let val = e.target.value.replace(/[^\d.\-]/g, '');
                                if (isCurrency) val = val.replace(/\$/g, '');
                                if (isPercent) val = val.replace(/%/g, '');
                                updateVariableOverride(variableName, val);
                              }}
                              placeholder={isCurrency ? '$xx,xxx' : isPercent ? 'X.XX%' : ''}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span className="text-xs text-gray-400">System: {isCurrency ? formatCurrency(values.system) : isPercent ? formatPercentage(values.system) : values.system}</span>
                            {manualOverrides[variableName] !== undefined && (
                              <button
                                onClick={() => resetVariableOverride(variableName)}
                                className="ml-2 text-xs text-red-500 hover:text-red-700"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* State Credit Result Card(s) */}
          {!stateLoading && stateCredits.length > 0 && (
            <div className="space-y-4">
              
              {/* Main method card (Standard or Alternative) */}
              {stateCredits.filter(c => c.method === selectedStateMethod).map((credit, idx) => (
                <div key={credit.method} className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{credit.method} State Credit</span>
                    <span className="text-lg font-semibold text-green-700">{formatCurrency(credit.credit)}</span>
                  </div>
                  <div className="text-xs text-gray-700 mb-2">
                    <div><span className="font-semibold">Formula:</span> {credit.formula}</div>
                  </div>
                  {credit.info && (
                    <div className="text-xs text-blue-800 bg-blue-50 rounded p-2 mb-2">
                      <span className="font-semibold">Usage:</span> {credit.info}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {credit.refundable && <div><span className="font-semibold">Refundable:</span> {credit.refundable}</div>}
                    {credit.carryforward && <div><span className="font-semibold">Carryforward:</span> {credit.carryforward}</div>}
                    {credit.eligible_entities && <div className="col-span-2"><span className="font-semibold">Eligible Entities:</span> {Array.isArray(credit.eligible_entities) ? credit.eligible_entities.join(', ') : credit.eligible_entities}</div>}
                    {credit.special_notes && <div className="col-span-2"><span className="font-semibold">Notes:</span> {credit.special_notes}</div>}
                    {credit.formula_correct && <div className="col-span-2"><span className="font-semibold">Formula Correct:</span> {credit.formula_correct}</div>}
                  </div>
                </div>
              ))}
              {/* Additional method card (always shown if present) */}
              {stateCredits.filter(c => c.method === 'Additional').map((credit, idx) => (
                <div key={credit.method} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Additional State Credit</span>
                    <span className="text-lg font-semibold text-yellow-700">{formatCurrency(credit.credit)}</span>
                  </div>
                  <div className="text-xs text-gray-700 mb-2">
                    <div><span className="font-semibold">Formula:</span> {credit.formula}</div>
                  </div>
                  {credit.info && (
                    <div className="text-xs text-blue-800 bg-blue-50 rounded p-2 mb-2">
                      <span className="font-semibold">Usage:</span> {credit.info}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {credit.refundable && <div><span className="font-semibold">Refundable:</span> {credit.refundable}</div>}
                    {credit.carryforward && <div><span className="font-semibold">Carryforward:</span> {credit.carryforward}</div>}
                    {credit.eligible_entities && <div className="col-span-2"><span className="font-semibold">Eligible Entities:</span> {Array.isArray(credit.eligible_entities) ? credit.eligible_entities.join(', ') : credit.eligible_entities}</div>}
                    {credit.special_notes && <div className="col-span-2"><span className="font-semibold">Notes:</span> {credit.special_notes}</div>}
                    {credit.formula_correct && <div className="col-span-2"><span className="font-semibold">Formula Correct:</span> {credit.formula_correct}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Debug Information (collapsible) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="flex items-center text-xs text-gray-500 hover:text-gray-700"
              >
                {showDebug ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                Debug Information
              </button>
              
              {showDebug && (
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify({
                      stateCredits,
                      stateCalculations,
                      availableStateMethods,
                      selectedStateMethod,
                      qreBreakdown,
                      businessState: wizardState.business?.state
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historical Summary */}
      {historicalCards.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historicalCards.map((card, idx) => (
              <div key={card.year || idx} className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-bold text-gray-900">{card.year}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${card.isInternal ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {card.isInternal ? 'Internal' : 'External'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">QRE:</span>
                    <span className="font-semibold">{formatCurrency(card.qre)}</span>
                  </div>
                  {card.isInternal && (
                    <div className="flex justify-between items-end h-16 w-full max-w-xs mx-auto">
                      <div className="flex flex-col items-center w-1/3">
                        <div className="bg-blue-500 w-3" style={{ height: `${Math.max(4, card.qre > 0 ? (card.employeeQRE / card.qre) * 48 : 4)}px` }} />
                        <span className="text-xs text-blue-700 mt-1">Emp</span>
                      </div>
                      <div className="flex flex-col items-center w-1/3">
                        <div className="bg-green-500 w-3" style={{ height: `${Math.max(4, card.qre > 0 ? (card.contractorQRE / card.qre) * 48 : 4)}px` }} />
                        <span className="text-xs text-green-700 mt-1">Cont</span>
                      </div>
                      <div className="flex flex-col items-center w-1/3">
                        <div className="bg-purple-500 w-3" style={{ height: `${Math.max(4, card.qre > 0 ? (card.supplyQRE / card.qre) * 48 : 4)}px` }} />
                        <span className="text-xs text-purple-700 mt-1">Supp</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">ASC Credit:</span>
                    <span className="font-semibold text-green-600">
                      {card.ascCredit !== null ? formatCurrency(card.ascCredit) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
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