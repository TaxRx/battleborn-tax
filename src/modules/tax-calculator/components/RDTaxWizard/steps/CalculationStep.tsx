import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingUp, Building2, MapPin, DollarSign, AlertTriangle, CheckCircle, Info, Settings as SettingsIcon, ChevronDown, ChevronUp, ChevronRight, FileText, RefreshCw, BarChart3 } from 'lucide-react';
import { RDCalculationsService, CalculationResults, FederalCreditResults } from '../../../services/rdCalculationsService';
import { StateCalculationService, StateCalculationResult, QREBreakdown } from '../../../services/stateCalculationService';
import { StateProFormaCalculationService } from '../../../services/stateProFormaCalculationService';
import { ContractorManagementService } from '../../../../../services/contractorManagementService';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { FilingGuideModal } from '../../FilingGuide/FilingGuideModal';
import AllocationReportModal from '../../AllocationReport/AllocationReportModal';
import { IntegratedFederalCredits } from './IntegratedFederalCredits';
import { IntegratedStateCredits } from './IntegratedStateCredits';
import { useUser } from '../../../../../context/UserContext';

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

  // Line Chart Rendering
  if (type === 'line') {
    const chartHeight = 120;
    const chartWidth = 200;
    const padding = 20;
    
    // Color mapping for SVG
    const colorMap: { [key: string]: string } = {
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#10b981',
      'bg-purple-500': '#8b5cf6',
      'bg-red-500': '#ef4444',
      'bg-yellow-500': '#eab308',
      'bg-indigo-500': '#6366f1',
      'bg-pink-500': '#ec4899',
      'bg-orange-500': '#f97316'
    };
    
    const strokeColor = colorMap[color] || '#3b82f6'; // Default to blue
    
    // Calculate points for SVG path
    const points = data.map((item, index) => {
      const x = padding + (index * (chartWidth - 2 * padding)) / (data.length - 1);
      const y = maxValue === minValue 
        ? chartHeight / 2 
        : chartHeight - padding - ((item.value - minValue) / (maxValue - minValue)) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
        <div className="relative">
          <svg width={chartWidth} height={chartHeight} className="w-full h-32">
            {/* Grid lines */}
            <defs>
              <pattern id={`grid-${title.replace(/\s+/g, '')}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${title.replace(/\s+/g, '')})`} />
            
            {/* Line path */}
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              className="drop-shadow-sm"
            />
            
            {/* Data points */}
            {data.map((item, index) => {
              const x = padding + (index * (chartWidth - 2 * padding)) / (data.length - 1);
              const y = maxValue === minValue 
                ? chartHeight / 2 
                : chartHeight - padding - ((item.value - minValue) / (maxValue - minValue)) * (chartHeight - 2 * padding);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={strokeColor}
                  stroke="white"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
              );
            })}
          </svg>
          
          {/* Value labels - Compact display for better UX */}
          <div className="flex justify-between mt-2 text-xs text-gray-500 overflow-hidden">
            {data.map((item, index) => (
              <div key={index} className="text-center flex-1 min-w-0">
                <div className="font-medium truncate">{item.label}</div>
                <div className="text-gray-600 text-xs">
                  {typeof item.value === 'number' && item.value >= 1000 
                    ? `$${(item.value / 1000).toFixed(0)}k`
                    : typeof item.value === 'number'
                    ? `$${item.value.toLocaleString()}`
                    : '$0'
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Bar Chart Rendering (existing logic)
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
  // Get user information for userId
  const { user } = useUser();
  
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [use280C, setUse280C] = useState(false);
  const [corporateTaxRate, setCorporateTaxRate] = useState(21);
  const [selectedMethod, setSelectedMethod] = useState<'standard' | 'asc'>('asc');

  // Wrapper function to update both local state and wizard state
  const handleMethodChange = (method: 'standard' | 'asc') => {
    setSelectedMethod(method);
    onUpdate({ selectedMethod: method });
  };

  // State calculation service instance
  const stateCalculationService = useMemo(() => StateCalculationService.getInstance(), []);
  
  // State for state calculations
  const [stateCredits, setStateCredits] = useState<any[]>([]);
  const [stateLoading, setStateLoading] = useState(false);
  
  // State for locked QRE values
  const [lockedQREValues, setLockedQREValues] = useState<Record<string, {
    employee_qre: number;
    contractor_qre: number;
    supply_qre: number;
    qre_locked: boolean;
  }>>({});
  const [selectedStateMethod, setSelectedStateMethod] = useState<string>('Standard');
  const [availableStateMethods, setAvailableStateMethods] = useState<string[]>([]);
  const [stateCalculations, setStateCalculations] = useState<any[]>([]);
  const [enableStateCredits, setEnableStateCredits] = useState(true);

  // State gross receipts management
  const [stateGrossReceipts, setStateGrossReceipts] = useState<{[year: string]: number}>({});
  const [showStateGrossReceipts, setShowStateGrossReceipts] = useState(false);

  // Historical accordion state
  const [showOlderYears, setShowOlderYears] = useState(false);

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

  // Filing guide modal state
  const [isFilingGuideOpen, setIsFilingGuideOpen] = useState(false);
  const [isAllocationReportOpen, setIsAllocationReportOpen] = useState(false);

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

  // --- Employee Wages QRE: Use locked values if available, otherwise fetch from DB ---
  const [employeeWagesQRE, setEmployeeWagesQRE] = useState<number>(0);
  useEffect(() => {
    async function fetchEmployeeWagesQRE() {
      if (!selectedActivityYearId) return;
      
      // CRITICAL FIX: Check if QRE values are locked first
      const lockedValues = lockedQREValues[selectedActivityYearId];
      if (lockedValues && lockedValues.qre_locked) {
        console.log(`🔒 Using locked employee QRE for summary: ${lockedValues.employee_qre}`);
        setEmployeeWagesQRE(lockedValues.employee_qre);
        return;
      }
      
      // Fallback to calculated values if not locked
      console.log(`🧮 Calculating employee QRE from database for year: ${selectedActivityYearId}`);
      const { data, error } = await supabase
        .from('rd_employee_year_data')
        .select('calculated_qre')
        .eq('business_year_id', selectedActivityYearId);
      if (error) {
        console.error('❌ Error fetching employee QRE:', error);
        setEmployeeWagesQRE(0);
        return;
      }
      const sum = (data || []).reduce((acc, row) => acc + (row.calculated_qre || 0), 0);
      console.log(`🧮 Calculated employee QRE from database: ${sum}`);
      setEmployeeWagesQRE(sum);
    }
    fetchEmployeeWagesQRE();
  }, [selectedActivityYearId, lockedQREValues]);

  // Load locked QRE values for all business years
  const loadLockedQREValues = async () => {
    if (!wizardState.business?.id) {
      console.warn('⚠️ No business ID available for loading locked QRE values');
      return;
    }
    
    try {
      console.log('🔒 CalculationStep - Loading locked QRE values for business:', wizardState.business.id);
      
      const { data, error } = await supabase
        .from('rd_business_years')
        .select('id, employee_qre, contractor_qre, supply_qre, qre_locked')
        .eq('business_id', wizardState.business.id);

      if (error) {
        console.error('❌ Error loading locked QRE values:', error);
        return;
      }

      if (data) {
        const qreMap: Record<string, any> = {};
        data.forEach(year => {
          qreMap[year.id] = {
            employee_qre: year.employee_qre || 0,
            contractor_qre: year.contractor_qre || 0,
            supply_qre: year.supply_qre || 0,
            qre_locked: year.qre_locked || false
          };
        });
        setLockedQREValues(qreMap);
        console.log('✅ Loaded locked QRE values:', qreMap);
      }
    } catch (error) {
      console.error('❌ Error loading locked QRE values:', error);
    }
  };

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

        // For each year, fetch supply subcomponents and contractors to get the actual QREs
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

            // Fetch contractors using ContractorManagementService (same as EmployeeSetupStep)
            let contractorsWithQRE = [];
            try {
              contractorsWithQRE = await ContractorManagementService.getContractors(year.id);
              console.log(`✅ CalculationStep - Loaded ${contractorsWithQRE.length} contractors for year ${year.year}`);
            } catch (error) {
              console.error('Error fetching contractors:', error);
            }

            return { 
              ...year, 
              supply_subcomponents: supplySubcomponents || [],
              contractors_with_qre: contractorsWithQRE
            };
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
          // Check if QRE values are locked for this year
          const lockedValues = lockedQREValues[year.id];
          if (lockedValues && lockedValues.qre_locked) {
            // Use locked values as single source of truth
            const totalQRE = lockedValues.employee_qre + lockedValues.contractor_qre + lockedValues.supply_qre;
            console.log(`🔒 Using locked QRE for year ${year.year}:`, totalQRE);
            return roundToDollar(totalQRE);
          }
          
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
          // Check if QRE values are locked for this year
          const lockedValues = lockedQREValues[year.id];
          if (lockedValues && lockedValues.qre_locked) {
            // Use locked values as single source of truth
            console.log(`🔒 Using locked QRE breakdown for year ${year.year}:`, lockedValues);
            return {
              employeesQRE: lockedValues.employee_qre,
              contractorsQRE: lockedValues.contractor_qre,
              suppliesQRE: lockedValues.supply_qre,
              directQRE: 0
            };
          }
          
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

        // Create unique historical cards and remove duplicates
        const uniqueCards = yearsWithSupplyData.map((year, idx) => {
          const breakdown = getQREBreakdown(year);
          const asc = getASCCredit(idx);
          const std = getStandardCredit(idx);
          return {
            id: year.id, // Include unique ID
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
        });
        
        // Remove duplicates based on year and id combination
        const deduplicatedCards = uniqueCards.filter((card, index, arr) => 
          arr.findIndex(c => c.year === card.year && c.id === card.id) === index
        );
        
        setHistoricalCards(deduplicatedCards);
        
        setAvailableActivityYears(yearsWithSupplyData.sort((a, b) => b.year - a.year));
        setAllYears(yearsWithSupplyData.sort((a, b) => b.year - a.year));
        
        // Load locked QRE values after years are loaded
        await loadLockedQREValues();
        
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
              
              // Apply 80% threshold rule for QRE calculation
              const qreAppliedPercent = appliedPercent >= 80 ? 100 : appliedPercent;
              // Use calculated QRE if available, otherwise calculate from wage and percent
              const employeeQRE = calculatedQRE > 0 ? calculatedQRE : (annualWage * qreAppliedPercent / 100);
              
              // Debug individual employee
              console.log('%c🔍 Employee Debug:', 'color: #fff; background: #f0f; font-weight: bold;', {
                employeeId: e.employee_id,
                annualWage: annualWage,
                originalAppliedPercent: appliedPercent,
                qreAppliedPercentWith80Threshold: qreAppliedPercent,
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
              
              // Apply 80% threshold rule for contractor QRE calculation
              const qreAppliedPercent = appliedPercent >= 80 ? 100 : appliedPercent;
              // Use calculated QRE if available, otherwise calculate from amount and percent
              const contractorQRE = calculatedQRE > 0 ? calculatedQRE : (amount * qreAppliedPercent / 100);
              
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
        
        // Enhanced debugging for ASC calculation
        console.log(`🔍 ASC Debug for ${year.year}:`, {
          qre,
          isExternalQRE,
          total_qre: year.total_qre,
          hasEmployeeData: !!year.employees?.length,
          hasContractorData: !!year.contractors?.length,
          hasSupplyData: !!year.supplies?.length
        });
        
        // Find 3 consecutive prior years with QREs > 0
        let validPriorQREs = [];
        let priorYearDetails = [];
        
        for (let i = idx - 1; i >= 0 && validPriorQREs.length < 3; i--) {
          let priorQRE = 0;
          const priorYear = allYears[i];
          
          // Check external QRE first, then internal calculation
          if (priorYear.total_qre > 0) {
            priorQRE = priorYear.total_qre;
          } else if (priorYear.employees || priorYear.contractors || priorYear.supplies) {
            const empQRE = priorYear.employees?.reduce((sum, e) => sum + roundToDollar(e.calculated_qre || 0), 0) || 0;
            const contQRE = priorYear.contractors?.reduce((sum, c) => sum + roundToDollar(c.calculated_qre || 0), 0) || 0;
            const supQRE = priorYear.supplies?.reduce((sum, s) => sum + roundToDollar(s.calculated_qre || 0), 0) || 0;
            priorQRE = roundToDollar(empQRE + contQRE + supQRE);
          }
          
          priorYearDetails.push({
            year: priorYear.year,
            qre: priorQRE,
            external: priorYear.total_qre > 0
          });
          
          if (priorQRE > 0) {
            validPriorQREs.push(priorQRE);
          } else {
            // For ASC, we can be more lenient - don't break on first zero year
            // Allow gaps in historical data for a more practical calculation
            console.log(`⚠️ Year ${priorYear.year} has no QRE data - continuing search`);
          }
        }
        
        validPriorQREs = validPriorQREs.reverse();
        priorYearDetails.reverse();
        
        console.log(`📊 Prior year QRE details for ${year.year}:`, priorYearDetails);
        console.log(`✅ Valid prior QREs found: ${validPriorQREs.length}`, validPriorQREs);
        
        // ASC Calculation Logic
        if (validPriorQREs.length >= 3) {
          // Multi-year ASC (14% rate) - CORRECTED FORMULA: 14% × max(0, Current QRE - 50% of avg prior 3 years)
          const avgPrior3 = validPriorQREs.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
          const fiftyPercentOfAvg = avgPrior3 * 0.5; // 50% of average prior 3 years
          const incrementalQRE = Math.max(0, qre - fiftyPercentOfAvg);
          ascCredit = roundToDollar(incrementalQRE * 0.14);
          ascPercent = 14;
          ascAvgPrior3 = roundToDollar(avgPrior3);
          
          console.log(`✅ Multi-year ASC for ${year.year}: ${formatCurrency(ascCredit)} (${qre} - 50% of ${avgPrior3} = ${qre} - ${fiftyPercentOfAvg} = ${incrementalQRE} * 14%)`);
        } else if (validPriorQREs.length >= 1) {
          // Simplified ASC with available data (6% rate)
          ascCredit = roundToDollar(qre * 0.06);
          ascPercent = 6;
          
          console.log(`⚡ Single-year ASC for ${year.year}: ${formatCurrency(ascCredit)} (${qre} * 6%)`);
        } else {
          // Startup provision (6% rate)
          ascCredit = roundToDollar(qre * 0.06);
          ascPercent = 6;
          
          console.log(`🚀 Startup ASC for ${year.year}: ${formatCurrency(ascCredit)} (${qre} * 6%)`);
        }
        
        // Ensure we have a valid credit amount
        if (qre > 0 && ascCredit === 0) {
          // Don't log this as an error - it's valid ASC logic when incremental QRE is 0
          console.log(`ℹ️ ASC calculation: ${year.year} has QRE = ${qre}, but incremental QRE is 0 or negative, resulting in credit = 0`);
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

  // Load calculations when component mounts or year changes
  useEffect(() => {
    if (selectedActivityYearId) {
      loadCalculations();
    }
  }, [selectedActivityYearId]);

  // CRITICAL: Recalculate when QRE values are locked/unlocked
  useEffect(() => {
    if (wizardState.qreValuesChanged) {
      console.log('🔄 CalculationStep detected QRE values changed - triggering recalculation');
      loadCalculations();
      // Clear the flag to prevent repeated calculations
      onUpdate({ qreValuesChanged: false });
    }
  }, [wizardState.qreValuesChanged]);

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
      onUpdate({ calculations: newResults, selectedMethod });
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
      onUpdate({ calculations: newResults, selectedMethod });
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

  // 🔧 FIX: Load state credits from State Pro Forma calculations using correct final credit fields
  useEffect(() => {
    const loadStateCreditsFromProForma = async () => {
      if (!wizardState.selectedYear?.id) {
        setStateCredits([]);
        return;
      }

      try {
        console.log('🔍 State Credits - Loading from Pro Forma calculations with correct field mapping...');
        
        // Get business state from wizardState (prioritize domicile_state, then contact_info.state)
        const businessState = wizardState.business?.domicile_state || wizardState.business?.contact_info?.state || wizardState.business?.state || 'CA';
        console.log('🔍 State Credits - Business state from wizardState:', businessState);
        console.log('🔍 State Credits - Full wizardState.business object:', wizardState?.business);
        console.log('🔍 State Credits - Business state determination:', {
          domicile_state: wizardState.business?.domicile_state,
          contact_info_state: wizardState.business?.contact_info?.state,
          contact_info_full: wizardState.business?.contact_info,
          legacy_state: wizardState.business?.state,
          final_businessState: businessState,
          wizardState_keys: wizardState ? Object.keys(wizardState) : 'wizardState is null/undefined',
          business_keys: wizardState?.business ? Object.keys(wizardState.business) : 'business is null/undefined'
        });
        
        // Use enhanced StateProFormaCalculationService to get REAL state credit from correct field
        const proFormaResult = await StateProFormaCalculationService.getAllStateCreditsFromProForma(
          wizardState.selectedYear.id,
          businessState // Pass the business state we extracted above
        );
        console.log('🔍 State Credits - Pro forma result:', proFormaResult);
        
        if (proFormaResult.total > 0) {
          // Convert the pro forma results into the expected UI format for state credits
          const stateCreditsUI = [{
            state: businessState,
            method: 'Standard',
            credit: proFormaResult.total,
            methods: [{
              name: 'Standard',
              credit: proFormaResult.breakdown[`${businessState}_standard`] || proFormaResult.total
            }]
          }];
          
          // Add alternative method if available
          const alternativeCredit = proFormaResult.breakdown[`${businessState}_alternative`];
          if (alternativeCredit && alternativeCredit > 0) {
            stateCreditsUI[0].methods.push({
              name: 'Alternative',
              credit: alternativeCredit
            });
          }
          
          setStateCredits(stateCreditsUI);
          console.log('🔍 State Credits - Successfully loaded pro forma calculations with correct fields:', stateCreditsUI);
        } else {
          // Fallback if no pro forma data is available
          console.log('🔍 State Credits - No pro forma data available, using fallback calculation');
          setStateCredits([]);
        }
        
      } catch (error) {
        console.error('🔍 State Credits - Error loading from pro forma:', error);
        setStateCredits([]);
      }
    };

    loadStateCreditsFromProForma();
  }, [wizardState.selectedYear?.id, wizardState.business?.state, wizardState.business?.contact_info?.state]);

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

  // Fallback alternative state credit calculation
  const calculateFallbackAlternativeStateCredit = (state: string, totalQRE: number): number => {
    // Alternative calculation rates (typically different than standard)
    const alternativeRates: { [key: string]: number } = {
      'CA': 0.15, // California - same rate but different base calculation
      'NY': 0.045, // New York - startup method
      'IL': 0.0325, // Illinois - simplified method  
      'CT': 0.06, // Connecticut - non-incremental
      'AZ': 0.12, // Arizona - simplified method
      'NJ': 0.05, // New Jersey - basic research
      'MA': 0.05, // Massachusetts - current method
    };

    const rate = alternativeRates[state] || 0.05; // Default to 5% if state not found
    return totalQRE * rate;
  };

  // Check if state requires gross receipts data
  const stateRequiresGrossReceipts = (state: string): boolean => {
    const grossReceiptsStates = ['CA', 'IA', 'SC', 'AZ', 'PA', 'NY', 'MA', 'NJ', 'OH', 'IL', 'FL', 'GA', 'CT'];
    return grossReceiptsStates.includes(state);
  };

  // Get required years for gross receipts
  const getGrossReceiptsYears = (selectedYear: number): number[] => {
    return [selectedYear - 1, selectedYear - 2, selectedYear - 3, selectedYear - 4];
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
    
    console.log('🔍 State Credits - Total calculation:', {
      selectedStateCredit,
      selectedStateMethod,
      stateCreditsLength: stateCredits.length,
      additionalCredit: additional?.credit || 0,
      total
    });
    
    return total;
  }, [selectedStateCredit, stateCredits]);

  // Create QRE data hash to trigger state pro forma reload when QRE data changes
  const qreDataHash = useMemo(() => {
    if (!selectedYearData) return '';
    
    const employeeQRE = selectedYearData.employees?.reduce((sum, e) => sum + (e.calculated_qre || 0), 0) || 0;
    const contractorQRE = selectedYearData.contractors_with_qre?.reduce((sum, c) => sum + (c.calculated_qre || 0), 0) || 0;
    const supplyQRE = selectedYearData.supply_subcomponents?.reduce((sum, s) => {
      const amountApplied = s.amount_applied || 0;
      const appliedPercentage = s.applied_percentage || 0;
      const supplyCost = s.supply?.cost_amount || 0;
      return sum + (amountApplied > 0 ? amountApplied : (supplyCost * appliedPercentage / 100));
    }, 0) || 0;
    
    const hash = `${employeeQRE}-${contractorQRE}-${supplyQRE}`;
    console.log('🔧 CalculationStep - QRE Data Hash:', {
      employeeQRE,
      contractorQRE, 
      supplyQRE,
      hash,
      selectedYearData_contractors_count: selectedYearData?.contractors_with_qre?.length || 0
    });
    return hash;
  }, [selectedYearData]);

  // Get SELECTED year QRE breakdown for summary cards (NOT current calendar year)
  const currentYearQRE = useMemo(() => {
    // CRITICAL FIX: Use selected year, not calendar year
    const selectedYearData = allYears.find(year => year.id === selectedActivityYearId);
    
    if (!selectedYearData) {
      console.log('⚠️ No selected year data found for summary cards');
      return null;
    }

    console.log(`📊 CalculationStep - Calculating summary for selected year ${selectedYearData.year} (ID: ${selectedActivityYearId})`);

    // CRITICAL FIX: Check if QRE values are locked for the SELECTED year
    const lockedValues = lockedQREValues[selectedYearData.id];
    if (lockedValues && lockedValues.qre_locked) {
      // Use locked values as single source of truth
      console.log(`🔒 Using LOCKED QRE for summary cards (year ${selectedYearData.year}):`, lockedValues);
      return {
        supply_costs: lockedValues.supply_qre,
        employee_costs: lockedValues.employee_qre,
        contractor_costs: lockedValues.contractor_qre,
        total_qre: roundToDollar(lockedValues.employee_qre + lockedValues.contractor_qre + lockedValues.supply_qre)
      };
    }
    
    console.log(`🧮 Using CALCULATED QRE for summary cards (year ${selectedYearData.year} - not locked)`);
    const currentYearData = selectedYearData;

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
    
    // Use contractor.calculated_qre from contractors_with_qre (loaded via ContractorManagementService)
    const contractorQRE = currentYearData.contractors_with_qre?.reduce((sum, c) => {
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
  }, [allYears, lockedQREValues, selectedActivityYearId]);

  // Helper function to calculate chart data
  const calculateChartData = (allYears: any[], results: any, selectedMethod: string, totalStateCredits: number) => {
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
    const creditData = qreData.map(item => {
      const isCurrentYear = item.year === new Date().getFullYear();
      let federalCredit = 0;
      let stateCredit = 0;
      
      if (isCurrentYear && results?.federalCredits) {
        // Use actual calculated federal credit for current year
        federalCredit = selectedMethod === 'asc' 
          ? (results.federalCredits.asc?.adjustedCredit || results.federalCredits.asc?.credit || 0)
          : (results.federalCredits.standard?.adjustedCredit || results.federalCredits.standard?.credit || 0);
        stateCredit = totalStateCredits;
      } else {
        // For historical years, use simplified calculation
        federalCredit = roundToDollar((item.qre || 0) * 0.20);
        stateCredit = 0; // No state credit data for historical years
      }
      
      return {
        year: item.year,
        federalCredit: roundToDollar(federalCredit),
        stateCredit: roundToDollar(stateCredit),
        totalCredit: roundToDollar(federalCredit + stateCredit)
      };
    });

    // Efficiency metric chart data (simplified to avoid division by zero)
    const efficiencyData = qreData.map(item => {
      const totalQRE = item.qre || 0;
      const employeeCount = allYears.find(y => y.year === item.year)?.employees?.length || 0;
      const contractorCount = allYears.find(y => y.year === item.year)?.contractors?.length || 0;
      const supplyCount = allYears.find(y => y.year === item.year)?.supply_subcomponents?.length || 0;
      
      return {
        year: item.year,
        // QRE per employee (if employees exist)
        qrePerEmployee: employeeCount > 0 ? roundToDollar(totalQRE / employeeCount) : 0,
        // Credit efficiency: credit amount per dollar of QRE
        creditEfficiency: totalQRE > 0 ? roundToPercentage(((creditData.find(c => c.year === item.year)?.totalCredit || 0) / totalQRE) * 100) : 0,
        // Supply percentage of total QRE
        supplyPercentage: totalQRE > 0 ? roundToPercentage(((item.supplies || 0) / totalQRE) * 100) : 0
      };
    });
    
    return { qreData, creditData, efficiencyData };
  };

  // Effect to check state gross receipts requirements and load existing data
  useEffect(() => {
    const checkGrossReceiptsRequirements = async () => {
      // Use consistent business state determination (same as state credits calculation)
      const businessState = wizardState.business?.domicile_state || wizardState.business?.contact_info?.state || wizardState.business?.state || 'CA';
      
      if (!businessState || !selectedYearData) return;
      const requiresGrossReceipts = stateRequiresGrossReceipts(businessState);
      setShowStateGrossReceipts(requiresGrossReceipts);
      
      if (requiresGrossReceipts) {
        // Load existing state gross receipts data from rd_reports
        try {
          const { data: reportData, error } = await supabase
            .from('rd_reports')
            .select('state_gross_receipts')
            .eq('business_year_id', selectedYearData.id)
            .eq('type', 'calculation')
            .single();
          
          if (!error && reportData?.state_gross_receipts) {
            setStateGrossReceipts(reportData.state_gross_receipts);
          } else {
            // Prepopulate with federal gross receipts if available
            const currentYear = selectedYearData.year;
            const requiredYears = getGrossReceiptsYears(currentYear);
            const initialGrossReceipts: {[year: string]: number} = {};
            
            // Try to get federal gross receipts from business years
            const { data: businessYears } = await supabase
              .from('rd_business_years')
              .select('year, gross_receipts')
              .eq('business_id', wizardState.business.id)
              .in('year', requiredYears);
            
            if (businessYears) {
              businessYears.forEach(year => {
                if (year.gross_receipts) {
                  initialGrossReceipts[year.year.toString()] = year.gross_receipts;
                }
              });
            }
            
            setStateGrossReceipts(initialGrossReceipts);
          }
        } catch (error) {
          console.error('Error loading state gross receipts:', error);
        }
      }
    };
    
    checkGrossReceiptsRequirements();
  }, [wizardState.business?.domicile_state, wizardState.business?.contact_info?.state, wizardState.business?.state, selectedYearData?.id]);

  // State gross receipts saving functionality
  const saveStateGrossReceipts = async (grossReceiptsData: {[year: string]: number}) => {
    if (!selectedYearData?.id) return;
    
    try {
      // Upsert rd_reports record with state gross receipts data
      const { error } = await supabase
        .from('rd_reports')
        .upsert({
          business_year_id: selectedYearData.id,
          business_id: wizardState.business?.id,
          type: 'calculation',
          state_gross_receipts: grossReceiptsData,
          generated_text: 'State gross receipts data',
          ai_version: '1.0',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'business_year_id,type',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('Error saving state gross receipts:', error);
        return;
      }
      
      console.log('State gross receipts saved successfully');
    } catch (error) {
      console.error('Error saving state gross receipts:', error);
    }
  };

  // Handle state gross receipts input changes
  const handleStateGrossReceiptsChange = (year: string, value: number) => {
    const updatedGrossReceipts = { ...stateGrossReceipts, [year]: value };
    setStateGrossReceipts(updatedGrossReceipts);
    
    // Auto-save after a brief delay
    setTimeout(() => {
      saveStateGrossReceipts(updatedGrossReceipts);
    }, 1000);
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

  const { federalCredits, currentYearQRE: federalCurrentYearQRE, stateCredits: federalStateCredits, totalFederalCredit, totalStateCredits: totalFederalStateCredits, totalCredits } = results;

  // Calculate chart data after results are available
  const chartData = calculateChartData(allYears, results, selectedMethod, totalStateCredits);

  return (
    <div className="space-y-6">
      {/* Header with Year Selector and Filing Guide Button */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Left: Title, Year Selector, Filing Guide */}
          <div className="flex items-center mb-4 md:mb-0">
            <TrendingUp className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-3xl font-bold">R&D Tax Credits</h2>
              <div className="text-sm opacity-80">Federal + State Credits</div>
              <div className="flex items-center space-x-2 mt-2">
                <label className="text-sm opacity-90">Year:</label>
                <select
                  value={selectedActivityYearId}
                  onChange={async (e) => {
                    const newYearId = e.target.value;
                    const selectedYear = availableActivityYears.find(y => y.id === newYearId);
                    
                    console.log(`🔄 CRITICAL: CalculationStep year switch to ${newYearId} (${selectedYear?.year})`);
                    console.log('🧹 FORCING QRE data isolation for CalculationStep');
                    
                    // CRITICAL: Update year selection and clear cached data
                    setSelectedActivityYearId(newYearId);
                    setSelectedYearId(newYearId);
                    if (selectedYear) {
                      setSelectedActivityYear(selectedYear.year);
                    }
                    
                    // CRITICAL: Clear cached calculation results to prevent leakage
                    setResults(null);
                    setHistoricalCards([]);
                    setAllYears([]);
                    setStateCredits([]);
                    setStateCalculations([]);
                    setAvailableActivityYears([]);
                    
                    // CRITICAL: Reload locked QRE values and recalculate for the new year
                    console.log('🔒 RELOADING locked QRE values and calculations for CalculationStep year:', newYearId);
                    setLoading(true);
                    try {
                      await loadLockedQREValues();
                      // CRITICAL: Force complete recalculation with new year data
                      await loadCalculations();
                      console.log('✅ CalculationStep year switch complete - QRE data isolated and recalculated');
                    } catch (error) {
                      console.error('❌ Error reloading QRE values and calculations in CalculationStep:', error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {availableActivityYears.map(y => (
                    <option key={y.id} value={y.id}>{y.year}</option>
                  ))}
                </select>
                {/* Refresh Button */}
                <button
                  onClick={handleRecalculate}
                  disabled={loading}
                  className="ml-2 flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh calculations with latest data"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
      </div>
          </div>
        </div>
          {/* Right: Credit Summary Card */}
          <div className="flex flex-col items-end">
            <div className="bg-white/90 rounded-xl shadow-lg px-6 py-4 min-w-[260px] flex flex-col items-end space-y-2">
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center text-sm font-medium text-blue-900">
                  <Building2 className="w-4 h-4 mr-1 text-blue-500" />
                  Federal Credit
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                    {selectedMethod === 'asc' ? 'ASC' : 'Standard'}
                  </span>
                </span>
                <span className="text-lg font-bold text-blue-700">
                  {formatCurrency(selectedMethod === 'asc' ? federalCredits.asc.credit : federalCredits.standard.credit)}
                </span>
          </div>
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center text-sm font-medium text-green-900">
                  <MapPin className="w-4 h-4 mr-1 text-green-500" />
                  State Credit
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    {enableStateCredits ? selectedStateMethod : 'Disabled'}
                  </span>
                </span>
                <span className="text-lg font-bold text-green-700">{formatCurrency(enableStateCredits ? totalStateCredits : 0)}</span>
        </div>
              <div className="border-t border-gray-200 w-full my-1"></div>
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center text-base font-semibold text-purple-900">
                  <DollarSign className="w-5 h-5 mr-1 text-purple-500" />
                  Total Credits
                </span>
                <span className="text-2xl font-extrabold text-purple-700 drop-shadow-lg">
                  {formatCurrency((selectedMethod === 'asc' ? federalCredits.asc.credit : federalCredits.standard.credit) + (enableStateCredits ? totalStateCredits : 0))}
                </span>
          </div>
        </div>
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
            {selectedYearData?.contractors_with_qre?.length || 0}
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
            {(selectedYearData?.supply_subcomponents?.length || 0) + (selectedYearData?.employees?.length || 0) + (selectedYearData?.contractors_with_qre?.length || 0)}
          </div>
          <div className="text-sm text-indigo-600">Total Subcomponents</div>
            </div>
          </div>

      {/* QRE Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">
            {formatCurrency(employeeWagesQRE)}
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
          data={(chartData?.qreData || [])
            .sort((a, b) => a.year - b.year)
            .map(item => ({ label: item.year.toString(), value: item.qre }))} 
          type="line" 
          color="bg-blue-500" 
        />
        <KPIChart 
          title="Total Federal Credits Over Years" 
          data={(chartData?.creditData || [])
            .sort((a, b) => a.year - b.year)
            .map(item => ({ label: item.year.toString(), value: item.federalCredit }))} 
          type="line" 
          color="bg-green-500" 
        />
        <KPIChart 
          title="Total State Credits Over Years" 
          data={(chartData?.creditData || [])
            .sort((a, b) => a.year - b.year)
            .map(item => ({ label: item.year.toString(), value: item.stateCredit }))} 
          type="line" 
          color="bg-purple-500" 
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Federal Credits - INTEGRATED */}
        <IntegratedFederalCredits
          businessData={wizardState.business}
          selectedYear={selectedYearData}
          calculations={results}
          selectedMethod={selectedMethod}
          onMethodChange={handleMethodChange}
          corporateTaxRate={corporateTaxRate}
          use280C={use280C}
          onUse280CChange={setUse280C}
          onTaxRateChange={setCorporateTaxRate}
        />

        {/* State Credits - INTEGRATED */}
        {(() => {
          console.log('🔍 CalculationStep - About to render IntegratedStateCredits with props:', {
            businessData: wizardState.business,
            businessData_keys: wizardState.business ? Object.keys(wizardState.business) : 'business is null/undefined',
            businessData_contact_info: wizardState.business?.contact_info,
            businessData_contact_info_state: wizardState.business?.contact_info?.state,
            selectedYear: selectedYearData,
            selectedYear_keys: selectedYearData ? Object.keys(selectedYearData) : 'selectedYear is null/undefined',
            wizardState_keys: wizardState ? Object.keys(wizardState) : 'wizardState is null/undefined',
            wizardState_business: wizardState.business,
            wizardState_business_id: wizardState.business?.id,
            wizardState_business_name: wizardState.business?.name
          });
          return null;
        })()}
        <IntegratedStateCredits
          businessData={wizardState.business}
          selectedYear={selectedYearData}
          wizardState={wizardState}
          qreDataHash={qreDataHash}
        />
      </div>

      {historicalCards.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Summary</h3>
          
          {(() => {
            const currentYear = new Date().getFullYear();
            const cutoffYear = currentYear - 8;
            const recentCards = historicalCards.filter(card => card.year >= cutoffYear);
            const olderCards = historicalCards.filter(card => card.year < cutoffYear);
            
            return (
              <>
                {/* Recent Years (within 8 years) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentCards.map((card, idx) => (
              <div key={`${card.id || card.year}-${idx}`} className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-4">
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
                    <div className="space-y-3">
                      {/* Horizontal Bar Chart */}
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div className="h-full flex">
                          <div 
                            className="bg-blue-500 h-full" 
                            style={{ width: `${card.qre > 0 ? (card.employeeQRE / card.qre) * 100 : 0}%` }}
                          />
                          <div 
                            className="bg-green-500 h-full" 
                            style={{ width: `${card.qre > 0 ? (card.contractorQRE / card.qre) * 100 : 0}%` }}
                          />
                          <div 
                            className="bg-purple-500 h-full" 
                            style={{ width: `${card.qre > 0 ? (card.supplyQRE / card.qre) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Legend with amounts */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span className="text-gray-600">Employees</span>
                          </div>
                          <span className="font-medium">{formatCurrency(card.employeeQRE)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span className="text-gray-600">Contractors</span>
                          </div>
                          <span className="font-medium">{formatCurrency(card.contractorQRE)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-purple-500 rounded"></div>
                            <span className="text-gray-600">Supplies</span>
                          </div>
                          <span className="font-medium">{formatCurrency(card.supplyQRE)}</span>
                        </div>
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
          
          {/* Older Years Accordion */}
          {olderCards.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowOlderYears(!showOlderYears)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-3"
              >
                {showOlderYears ? (
                  <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                Older Years ({olderCards.length} year{olderCards.length !== 1 ? 's' : ''})
              </button>
              
              {showOlderYears && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {olderCards.map((card, idx) => (
                    <div key={`older-${card.id || card.year}-${idx}`} className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-4 opacity-75">
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
                          <div className="space-y-3">
                            {/* Horizontal Bar Chart */}
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                              <div className="h-full flex">
                                <div 
                                  className="bg-blue-500 h-full" 
                                  style={{ width: `${card.qre > 0 ? (card.employeeQRE / card.qre) * 100 : 0}%` }}
                                />
                                <div 
                                  className="bg-green-500 h-full" 
                                  style={{ width: `${card.qre > 0 ? (card.contractorQRE / card.qre) * 100 : 0}%` }}
                                />
                                <div 
                                  className="bg-purple-500 h-full" 
                                  style={{ width: `${card.qre > 0 ? (card.supplyQRE / card.qre) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            
                            {/* Legend with amounts */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                  <span className="text-gray-600">Employees</span>
                                </div>
                                <span className="font-medium">{formatCurrency(card.employeeQRE)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                                  <span className="text-gray-600">Contractors</span>
                                </div>
                                <span className="font-medium">{formatCurrency(card.contractorQRE)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                                  <span className="text-gray-600">Supplies</span>
                                </div>
                                <span className="font-medium">{formatCurrency(card.supplyQRE)}</span>
                              </div>
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
              )}
            </div>
          )}
        </>
      );
    })()}
  </div>
      )}

      {/* Action Buttons Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <SettingsIcon className="w-5 h-5 mr-2" />
            Actions & Reports
          </h3>
          <div className="text-sm text-gray-600">
            Generate reports and manage calculations
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filing Guide */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
            <div className="flex items-center mb-3">
              <FileText className="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-900">Filing Guide</h4>
                <p className="text-sm text-gray-600">Tax credit claiming instructions</p>
              </div>
            </div>
            <button
              onClick={() => setIsFilingGuideOpen(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <FileText className="w-4 h-4 mr-2" />
              Open Filing Guide
            </button>
          </div>
          
          {/* Allocation Report */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
            <div className="flex items-center mb-3">
              <BarChart3 className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-900">Allocation Report</h4>
                <p className="text-sm text-gray-600">Detailed QRE breakdown analysis</p>
              </div>
            </div>
            <button
              onClick={() => setIsAllocationReportOpen(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Allocation Report
            </button>
          </div>
          
          {/* Recalculate */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
            <div className="flex items-center mb-3">
              <RefreshCw className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-900">Recalculate</h4>
                <p className="text-sm text-gray-600">Refresh with latest data</p>
              </div>
            </div>
            <button
              onClick={handleRecalculate}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Recalculating...' : 'Recalculate All'}
            </button>
          </div>
        </div>
      </div>

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
      {/* Filing Guide Modal */}
      {isFilingGuideOpen && (
        <FilingGuideModal
          isOpen={isFilingGuideOpen}
          onClose={() => setIsFilingGuideOpen(false)}
          businessData={wizardState.business}
          selectedYear={selectedYearData}
          calculations={results}
          selectedMethod={selectedMethod}
          debugData={{
            selectedMethod,
            results,
            selectedYearData,
            wizardState,
            federalCredits,
            currentYearQRE: federalCurrentYearQRE,
            totalFederalCredit,
            totalStateCredits: totalFederalStateCredits,
            totalCredits,
          }}
        />
      )}
      {/* Allocation Report Modal */}
      {isAllocationReportOpen && (
        <AllocationReportModal
          isOpen={isAllocationReportOpen}
          onClose={() => setIsAllocationReportOpen(false)}
          businessData={wizardState.business}
          selectedYear={selectedYearData}
          calculations={results}
          selectedMethod={selectedMethod}
          debugData={{
            selectedMethod,
            results,
            selectedYearData,
            wizardState,
            federalCredits,
            currentYearQRE: federalCurrentYearQRE,
            totalFederalCredit,
            totalStateCredits: totalFederalStateCredits,
            totalCredits,
          }}
        />
      )}
    </div>
  );
};

export default CalculationStep; 