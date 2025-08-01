import React, { useState, useEffect, useCallback } from 'react';
import { FilingGuideService } from './FilingGuideService';
import { Form6765Override } from './types';
import './Form6765.css';

interface Form6765Props {
  businessData: any;
  selectedYear: any;
  calculations: any;
  clientId: string;
  userId?: string;
  selectedMethod?: 'standard' | 'asc'; // Add selectedMethod prop
  lockedQREValues?: {
    employee_qre: number;
    contractor_qre: number;
    supply_qre: number;
    qre_locked: boolean;
  };
}

interface Form6765Line {
  lineNumber: number;
  label: string;
  value: number;
  calculatedValue: number;
  isEditable: boolean;
  isTotal?: boolean;
  isCredit?: boolean;
  dependsOn?: number[];
  formula?: string;
  format?: (value: number) => string; // Added for formatting
  extra?: any; // Added for extra data like use280C
  isVisible?: boolean; // Added for conditional visibility
}

interface Form6765Section {
  section: string;
  title: string;
  lines: Form6765Line[];
  isVisible: boolean;
}

// Move formatting helpers to component scope, above Form6765 definition
const formatCurrency = (amount: number) => amount == null ? '' : amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatPercent = (value: number) => value == null ? '' : `${(value * 100).toFixed(2)}%`;

// Utility: Safe currency formatting (always returns $x,xxx or $0)
const safeCurrency = (value: any) => {
  const num = typeof value === 'number' && isFinite(value) ? Math.round(value) : 0;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
// Utility: Safe percent formatting (always returns x.xx%, min 3% for base percent)
const safePercent = (value: any, min = 0.03) => {
  let num = typeof value === 'number' && isFinite(value) ? value : min;
  if (num < min) num = min;
  return `${(num * 100).toFixed(2)}%`;
};

// --- Add formatting helpers ---
const formatCurrencyInput = (value: string) => {
  if (value === '' || value == null) return '';
  const num = Number(value.toString().replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const parseCurrencyInput = (value: string) => {
  if (typeof value !== 'string') return 0;
  const num = Number(value.replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : num;
};
const formatPercentInput = (value: string) => {
  if (value === '' || value == null) return '';
  const num = Number(value.toString().replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return '';
  return `${(num * 100).toFixed(2)}%`;
};
const parsePercentInput = (value: string) => {
  if (typeof value !== 'string') return 0;
  const num = Number(value.replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : num / 100;
};

export const Form6765: React.FC<Form6765Props> = ({
  businessData,
  selectedYear,
  calculations,
  clientId,
  userId,
  selectedMethod: propSelectedMethod, // Destructure prop
  lockedQREValues
}) => {
  const [overrides, setOverrides] = useState<Form6765Override[]>([]);
  const [sections, setSections] = useState<Form6765Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [use280C, setUse280C] = useState(false); // State for line 17 checkbox

  // --- LIFTED CALCULATION VARIABLES TO COMPONENT SCOPE ---
  // These are recalculated on every render, always in sync with props
  const currentYearQRE = calculations?.currentYearQRE?.total || 0;
  const federalCredits = calculations?.federalCredits || {};
  const standardCredit = federalCredits?.standard || {};
  const ascCredit = federalCredits?.asc || {};
  const historicalData = calculations?.historicalData || [];
  const avgGrossReceipts = historicalData.length > 0 
    ? historicalData.reduce((sum, year) => sum + (year.gross_receipts || 0), 0) / historicalData.length 
    : 0;
  // 1. Fix basePercentage logic to default to 3% if not present or less than 0.03
  const rawBasePercentage = standardCredit?.basePercentage;
  const basePercentage = (typeof rawBasePercentage === 'number' && rawBasePercentage >= 0.03) ? rawBasePercentage : 0.03;
  // --- END LIFTED VARIABLES ---

  // --- In the component body, add local state for display values for lines 5, 6, 7, 41 ---
  const [maskedInputs, setMaskedInputs] = useState({});

  // Sync maskedInputs with section values on mount/section change
  useEffect(() => {
    const newMasked = {};
    sections.forEach(section => {
      section.lines.forEach(line => {
        if ([5, 6, 7, 41].includes(line.lineNumber)) {
          if (line.lineNumber === 6) {
            newMasked[`${section.section}-${line.lineNumber}`] = formatPercentInput(line.value);
          } else {
            newMasked[`${section.section}-${line.lineNumber}`] = formatCurrencyInput(line.value);
          }
        }
      });
    });
    setMaskedInputs(newMasked);
  }, [sections]);

  const handleMaskedInputChange = (section: string, line: number, value: string) => {
    setMaskedInputs((prev) => ({ ...prev, [`${section}-${line}`]: value }));
  };
  const handleMaskedInputBlur = (section: string, line: number, value: string) => {
    let parsed = 0;
    if (line === 6) {
      parsed = parsePercentInput(value);
    } else {
      parsed = parseCurrencyInput(value);
    }
    handleLineChange(section, line, parsed);
    setMaskedInputs((prev) => ({
      ...prev,
      [`${section}-${line}`]: line === 6 ? formatPercentInput(parsed) : formatCurrencyInput(parsed)
    }));
  };

  // Load overrides on component mount
  useEffect(() => {
    loadOverrides();
  }, [clientId, selectedYear?.year]);

  // Initialize sections with calculated values
  useEffect(() => {
    if (calculations && selectedYear) {
      initializeSections();
    }
  }, [calculations, selectedYear, overrides]);

  // On mount, initialize use280C from calculations.federalCredits.use280C
  useEffect(() => {
    setUse280C(!!calculations?.federalCredits?.use280C);
  }, [calculations]);

  const loadOverrides = async () => {
    if (!clientId || !selectedYear?.year) return;
    
    try {
      const fetchedOverrides = await FilingGuideService.fetchForm6765Overrides({
        clientId,
        businessYear: selectedYear.year
      });
      setOverrides(fetchedOverrides);
    } catch (error) {
      console.error('Error loading overrides:', error);
    } finally {
      setLoading(false);
    }
  };

  // Define selectedMethod in component scope so it's accessible everywhere
  const selectedMethod = propSelectedMethod || calculations?.federalCredits?.selectedMethod || 'standard'; // Use propSelectedMethod first, fallback to calculations

  const initializeSections = () => {
    const businessYear = selectedYear?.year || new Date().getFullYear();
    const businessStartYear = businessData?.start_year || businessYear;
    const isEligibleForPayrollCredit = (businessYear - businessStartYear) <= 5;
    const isSCorpOrPartnership = businessData?.entity_type === 'S-Corp' || businessData?.entity_type === 'Partnership';

    console.log('🔍 Form 6765 (2023) Debug - QRE Auto-Population:', {
      selectedMethod,
      calculations_full: calculations,
      calculations_currentYearQRE: calculations?.currentYearQRE,
      calculations_currentYearQRE_employee_wages: calculations?.currentYearQRE?.employee_wages,
      calculations_currentYearQRE_supply_costs: calculations?.currentYearQRE?.supply_costs,
      calculations_currentYearQRE_contractor_costs: calculations?.currentYearQRE?.contractor_costs,
      calculations_currentYearQRE_total: calculations?.currentYearQRE?.total,
      businessData,
      selectedYear
    });

    // CRITICAL: Check if calculations are available
    if (!calculations || !calculations.currentYearQRE) {
      console.error('🚨 Form 6765 (2023) - No calculations or currentYearQRE data available!', {
        calculations: calculations,
        hasCalculations: !!calculations,
        hasCurrentYearQRE: !!calculations?.currentYearQRE
      });
    }

    // Base period calculations - use actual calculated value or default to 3%
    const fixedBaseAmount = standardCredit?.fixedBaseAmount || 0;
    const incrementalQRE = standardCredit?.incrementalQRE || 0;
    
    // ASC calculations
    const avgPriorQRE = ascCredit?.avgPriorQRE || 0;
    const ascIncrementalQRE = ascCredit?.incrementalQRE || 0;
    
    // CRITICAL: Use locked QRE values when available, fall back to calculated values
    const getQREValue = (type: 'employee' | 'contractor' | 'supply') => {
      if (lockedQREValues?.qre_locked) {
        console.log(`🔒 Form6765 - Using LOCKED ${type} QRE:`, lockedQREValues[`${type}_qre`]);
        switch (type) {
          case 'employee': return lockedQREValues.employee_qre;
          case 'contractor': return lockedQREValues.contractor_qre;
          case 'supply': return lockedQREValues.supply_qre;
        }
      } else {
        console.log(`📊 Form6765 - Using CALCULATED ${type} QRE`);
        switch (type) {
          case 'employee': return calculations?.currentYearQRE?.employee_wages || 0;
          case 'contractor': return calculations?.currentYearQRE?.contractor_costs || 0;
          case 'supply': return calculations?.currentYearQRE?.supply_costs || 0;
        }
      }
      return 0;
    };

    // Contractor applied amounts (sum of all contractor applied_amount)
    const contractorAppliedAmounts = getQREValue('contractor');

    const newSections: Form6765Section[] = [];

    // Get QRE for a specific number of years prior to current year
    // CRITICAL: Business Setup QRE overrules internal calculations (same logic as Form6765v2024)
    const getPriorYearQRE = (yearsPrior: number): number => {
      if (!calculations?.historicalData || !selectedYear?.year) {
        console.log(`⚠️ [Form 6765 Pre-2024] Missing data for getPriorYearQRE:`, {
          hasHistoricalData: !!calculations?.historicalData,
          historicalDataLength: calculations?.historicalData?.length || 0,
          hasSelectedYear: !!selectedYear?.year,
          selectedYear: selectedYear?.year
        });
        return 0;
      }
      
      const currentYear = selectedYear.year;
      const targetYear = currentYear - yearsPrior;
      
      console.log(`🔍 [Form 6765 Pre-2024] Looking for QRE ${yearsPrior} years prior (${targetYear}):`, {
        currentYear,
        targetYear,
        historicalDataYears: calculations.historicalData.map(y => y.year),
        allHistoricalData: calculations.historicalData
      });
      
      const yearData = calculations.historicalData.find((year: any) => year.year === targetYear);
      
      if (!yearData) {
        console.log(`⚠️ [Form 6765 Pre-2024] No year data found for ${targetYear}`);
        return 0;
      }
      
      console.log(`📊 [Form 6765 Pre-2024] Found year data for ${targetYear}:`, yearData);
      
      let qreValue = 0;
      
      // PRIORITY 1: Check if QRE values are locked for current year only
      if (targetYear === selectedYear.year && lockedQREValues?.qre_locked) {
        qreValue = lockedQREValues.employee_qre + lockedQREValues.contractor_qre + lockedQREValues.supply_qre;
        console.log(`🔒 [Form 6765 Pre-2024] Using LOCKED QRE for ${targetYear}:`, qreValue);
        return qreValue;
      }
      
      // PRIORITY 2: Business Setup QRE (qre from historical data - includes total_qre from rd_business_years)
      if (yearData.qre && yearData.qre > 0) {
        qreValue = yearData.qre;
        console.log(`📊 [Form 6765 Pre-2024] Using BUSINESS SETUP QRE for ${targetYear}:`, qreValue);
        
        // CRITICAL DEBUG: Also calculate what the QRE would be from internal data for comparison
        const employeeQRE = yearData.employees?.reduce((sum: number, e: any) => {
          const calculatedQRE = e.calculated_qre || e.qre || 0;
          const annualWage = e.employee?.annual_wage || e.annual_wage || e.wage || 0;
          const appliedPercent = e.applied_percent || 0;
          return sum + (calculatedQRE > 0 ? calculatedQRE : (annualWage * appliedPercent / 100));
        }, 0) || 0;
        
        const contractorQRE = yearData.contractors?.reduce((sum: number, c: any) => {
          const calculatedQRE = c.calculated_qre || c.qre || 0;
          const amount = c.amount || c.cost_amount || 0;
          const appliedPercent = c.applied_percent || 0;
          return sum + (calculatedQRE > 0 ? calculatedQRE : (amount * appliedPercent / 100));
        }, 0) || 0;
        
        const supplyQRE = yearData.supplies?.reduce((sum: number, s: any) => {
          const calculatedQRE = s.calculated_qre || s.qre || 0;
          const costAmount = s.supply?.cost_amount || s.cost_amount || 0;
          const appliedPercent = s.applied_percent || 0;
          return sum + (calculatedQRE > 0 ? calculatedQRE : (costAmount * appliedPercent / 100));
        }, 0) || 0;
        
        const calculatedTotal = employeeQRE + contractorQRE + supplyQRE;
        console.log(`🔍 [Form 6765 Pre-2024] COMPARISON for ${targetYear}:`, {
          businessSetupQRE: qreValue,
          calculatedQRE: calculatedTotal,
          difference: qreValue - calculatedTotal,
          breakdown: { employee: employeeQRE, contractor: contractorQRE, supply: supplyQRE }
        });
        
        // TEMPORARY FIX: Use calculated QRE if it's significantly different and non-zero
        if (calculatedTotal > 0 && Math.abs(qreValue - calculatedTotal) > 1000) {
          console.log(`⚠️ [Form 6765 Pre-2024] Large difference detected! Using CALCULATED QRE instead of Business Setup for ${targetYear}`);
          qreValue = calculatedTotal;
        }
      } else {
        // PRIORITY 3: Calculate from internal data (employees, contractors, supplies)
        const employeeQRE = yearData.employees?.reduce((sum: number, e: any) => {
          const calculatedQRE = e.calculated_qre || e.qre || 0;
          const annualWage = e.employee?.annual_wage || e.annual_wage || e.wage || 0;
          const appliedPercent = e.applied_percent || 0;
          return sum + (calculatedQRE > 0 ? calculatedQRE : (annualWage * appliedPercent / 100));
        }, 0) || 0;
        
        const contractorQRE = yearData.contractors?.reduce((sum: number, c: any) => {
          const calculatedQRE = c.calculated_qre || c.qre || 0;
          const amount = c.amount || c.cost_amount || 0;
          const appliedPercent = c.applied_percent || 0;
          return sum + (calculatedQRE > 0 ? calculatedQRE : (amount * appliedPercent / 100));
        }, 0) || 0;
        
        const supplyQRE = yearData.supplies?.reduce((sum: number, s: any) => {
          const calculatedQRE = s.calculated_qre || s.qre || 0;
          const costAmount = s.supply?.cost_amount || s.cost_amount || 0;
          const appliedPercent = s.applied_percent || 0;
          return sum + (calculatedQRE > 0 ? calculatedQRE : (costAmount * appliedPercent / 100));
        }, 0) || 0;
        
        qreValue = employeeQRE + contractorQRE + supplyQRE;
        console.log(`🧮 [Form 6765 Pre-2024] Using CALCULATED QRE for ${targetYear}:`, {
          total: qreValue,
          employee: employeeQRE,
          contractor: contractorQRE,
          supply: supplyQRE
        });
      }
      
      return Math.round(qreValue);
    };

    // Helper function to get line value
    const getLineValue = (lineNumber: number, overrides: Form6765Override[], calculations: any, basePercentage: number, avgGrossReceipts: number, currentYearQRE: number, federalCredits: any) => {
      const override = overrides.find(o => o.section === 'A' && o.line_number === lineNumber);
      if (override) return override.value;
      switch (lineNumber) {
        case 13:
          return ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20);
        case 14:
          return ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20);
        case 15:
          const val13 = ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20);
          const val14 = ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20);
          return Math.min(val13, val14);
        default:
          return 0;
      }
    };

    // Section A: Regular Credit (lines 1-17, IRS-accurate mapping)
    if (selectedMethod === 'standard') {
      // Extract QRE breakdowns from calculations.currentYearQRE
          const employeeQRE = getOverrideValue('A', 5) ?? getQREValue('employee');
    const supplyQRE = getOverrideValue('A', 6) ?? getQREValue('supply');
    const computerQRE = getOverrideValue('A', 7) ?? 0;
    const contractorQRE = getOverrideValue('A', 8) ?? getQREValue('contractor');
      const totalQRE = employeeQRE + supplyQRE + computerQRE + contractorQRE;
      // Base percentage: from federalCredits.standard.basePercentage, min 3%, max 16%
      let basePercentRaw = federalCredits?.standard?.basePercentage ?? 0.03;
      if (basePercentRaw < 0.03) basePercentRaw = 0.03;
      if (basePercentRaw > 0.16) basePercentRaw = 0.16;
      const basePercent = getOverrideValue('A', 10) ?? basePercentRaw;
      // Avg gross receipts: from selectedYear.gross_receipts
      const avgGrossReceipts = getOverrideValue('A', 11) ?? (selectedYear?.gross_receipts ?? 0);
      const line12 = avgGrossReceipts * basePercent;
      const line13 = Math.max(totalQRE - line12, 0);
      const line14 = totalQRE * 0.5;
      const line15 = Math.min(line13, line14);
      const line16 = (getOverrideValue('A', 1) ?? 0) + (getOverrideValue('A', 4) ?? 0) + line15;
      const line17Yes = line16 * 0.158;
      const line17No = line16 * 0.20;
      newSections.push({
        section: 'A',
        title: 'Section A—Regular Credit',
        isVisible: true,
        lines: [
          { lineNumber: 1, label: 'Certain amounts paid or incurred to energy consortia (see instructions)', value: getOverrideValue('A', 1) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
          { lineNumber: 2, label: 'Basic research payments to qualified organizations (see instructions)', value: getOverrideValue('A', 2) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
          { lineNumber: 3, label: 'Qualified organization base period amount', value: getOverrideValue('A', 3) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
          { lineNumber: 4, label: 'Subtract line 3 from line 2', value: getOverrideValue('A', 4) ?? 0, calculatedValue: 0, isEditable: true, dependsOn: [2, 3], formula: 'line2-line3', format: formatCurrency },
          { lineNumber: 5, label: 'Wages for qualified services (do not include wages used in figuring the work opportunity credit)', value: employeeQRE, calculatedValue: employeeQRE, isEditable: true, format: formatCurrency },
          { lineNumber: 6, label: 'Cost of supplies', value: supplyQRE, calculatedValue: supplyQRE, isEditable: true, format: formatCurrency },
          { lineNumber: 7, label: 'Rental or lease costs of computers (see instructions)', value: computerQRE, calculatedValue: computerQRE, isEditable: true, format: formatCurrency },
          { lineNumber: 8, label: 'Enter the applicable percentage of contract research expenses. See instructions', value: contractorQRE, calculatedValue: contractorQRE, isEditable: true, format: formatCurrency },
          { lineNumber: 9, label: 'Total qualified research expenses. Add lines 5 through 8', value: totalQRE, calculatedValue: totalQRE, isEditable: false, dependsOn: [5,6,7,8], formula: 'line5+line6+line7+line8', format: formatCurrency },
          { lineNumber: 10, label: 'Enter fixed-base percentage, but not more than 16% (0.16) (see instructions)', value: basePercent, calculatedValue: basePercent, isEditable: true, format: formatPercent },
          { lineNumber: 11, label: 'Enter average annual gross receipts. See instructions', value: avgGrossReceipts, calculatedValue: avgGrossReceipts, isEditable: true, format: formatCurrency },
          { lineNumber: 12, label: 'Multiply line 11 by the percentage on line 10', value: line12, calculatedValue: line12, isEditable: false, dependsOn: [10,11], formula: 'line11*line10', format: formatCurrency },
          { lineNumber: 13, label: 'Subtract line 12 from line 9. If zero or less, enter -0-', value: line13, calculatedValue: line13, isEditable: false, dependsOn: [9,12], formula: 'line9-line12', format: formatCurrency },
          { lineNumber: 14, label: 'Multiply line 9 by 50% (0.50)', value: line14, calculatedValue: line14, isEditable: false, dependsOn: [9], formula: 'line9*0.5', format: formatCurrency },
          { lineNumber: 15, label: 'Enter the smaller of line 13 or line 14', value: line15, calculatedValue: line15, isEditable: false, dependsOn: [13,14], formula: 'min(line13,line14)', format: formatCurrency },
          { lineNumber: 16, label: 'Add lines 1, 4, and 15', value: line16, calculatedValue: line16, isEditable: false, dependsOn: [1,4,15], formula: 'line1+line4+line15', format: formatCurrency },
          { lineNumber: 17, label: 'Are you electing the reduced credit under section 280C?', value: use280C ? line17Yes : line17No, calculatedValue: use280C ? line17Yes : line17No, isEditable: false, dependsOn: [16], formula: 'line16*(use280C?0.158:0.20)', format: formatCurrency, extra: { preview: !use280C ? line17Yes : null } }
        ]
      });
    }

    // Section B: ASC (lines 18-34, IRS-accurate mapping)
    if (selectedMethod === 'asc') {
      // Extract QRE breakdowns and prior year data
          const employeeQRE = getOverrideValue('B', 24) ?? getQREValue('employee');
    const supplyQRE = getOverrideValue('B', 25) ?? getQREValue('supply');
    const computerQRE = getOverrideValue('B', 26) ?? 0;
    const contractorQRE = getOverrideValue('B', 27) ?? getQREValue('contractor');
      const totalQRE = employeeQRE + supplyQRE + computerQRE + contractorQRE;
      
      // Enhanced: Check for 3 consecutive prior years with QREs
      const historicalData = calculations?.historicalData || [];
      console.log('🔍 [Form 6765 Pre-2024] ASC calculation - COMPREHENSIVE Historical data:', {
        historicalData,
        totalYears: historicalData.length,
        qreBreakdownByYear: historicalData.map(year => ({
          year: year.year,
          totalQRE: year.qre,
          manualQRE: year.manual_qre || 0,
          calculatedQRE: year.calculated_qre || 0,
          breakdown: year.qre_breakdown
        }))
      });
      
      // Get exactly the 3 most recent prior years (excluding current year)
      const currentYear = selectedYear?.year || new Date().getFullYear();
      const priorYears = historicalData
        .filter(year => year.year < currentYear && year.year >= (currentYear - 3))
        .sort((a, b) => b.year - a.year)
        .slice(0, 3);
      
      console.log(`🔍 [Form 6765 Pre-2024] Prior years selection for ${currentYear}:`, {
        currentYear,
        allHistoricalYears: historicalData.map(y => ({ year: y.year, qre: y.qre })),
        filteredPriorYears: priorYears.map(y => ({ year: y.year, qre: y.qre }))
      });
      
      console.log('📊 [Form 6765 Pre-2024] ASC - Prior 3 years for calculation:', {
        priorYears,
        priorYearQREs: priorYears.map(year => ({
          year: year.year,
          qre: year.qre,
          manual_qre: year.manual_qre || 0,
          calculated_qre: year.calculated_qre || 0
        }))
      });
      
      // Check if we have exactly 3 consecutive years with QREs > 0
      // CRITICAL: Use priority-based QRE calculation for consistency
      const prior1QRE = getPriorYearQRE(1);
      const prior2QRE = getPriorYearQRE(2);
      const prior3QRE = getPriorYearQRE(3);
      
      const has3ConsecutiveYears = priorYears.length === 3 && 
        prior1QRE > 0 && prior2QRE > 0 && prior3QRE > 0 &&
        priorYears[0].year === currentYear - 1 &&
        priorYears[1].year === currentYear - 2 &&
        priorYears[2].year === currentYear - 3;
      
      console.log('✅ [Form 6765 Pre-2024] ASC - Has 3 consecutive years with QREs:', has3ConsecutiveYears);
      
      // CRITICAL: Use new priority-based QRE calculation for prior years
      const priorQRESum = has3ConsecutiveYears ? 
        (prior1QRE + prior2QRE + prior3QRE) : 0;
      
      const priorQRE = getOverrideValue('B', 29) ?? priorQRESum;
      
      console.log('📊 [Form 6765 Pre-2024] Updated Line 29 calculation:', {
        has3ConsecutiveYears,
        priorYear1: prior1QRE,
        priorYear2: prior2QRE,
        priorYear3: prior3QRE,
        priorQRESum,
        finalPriorQRE: priorQRE,
        expectedValues: {
          year2022: 480231,
          year2021: 360011,
          year2020: 204772,
          expectedSum: 1045014
        },
        actualValues: {
          year2022: prior1QRE,
          year2021: prior2QRE,
          year2020: prior3QRE,
          actualSum: priorQRESum
        }
      });
      
      // Calculate lines 30 and 31 only if we have 3 consecutive years with QREs
      const line30 = has3ConsecutiveYears ? priorQRE / 6.0 : 0;
      const line31 = has3ConsecutiveYears ? Math.max(totalQRE - line30, 0) : 0;
      
      // Apply correct rate based on prior year data
      const line32 = has3ConsecutiveYears 
        ? line31 * 0.14  // 14% rate if 3 consecutive years with QREs
        : totalQRE * 0.06; // 6% rate if not 3 consecutive years
      
      console.log('💰 [Form 6765 Pre-2024] ASC calculation results:', {
        totalQRE,
        priorQRESum,
        has3ConsecutiveYears,
        line30,
        line31,
        line32,
        rate: has3ConsecutiveYears ? '14%' : '6%'
      });
      
      const line33 = (getOverrideValue('B', 23) ?? 0) + line32;
      const line34Yes = line33 * 0.79;
      const line34No = line33;
      
      newSections.push({
        section: 'B',
        title: 'Section B—Alternative Simplified Credit',
        isVisible: true,
        lines: [
          { lineNumber: 18, label: 'Certain amounts paid or incurred to energy consortia (see the line 1 instructions)', value: getOverrideValue('B', 18) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
          { lineNumber: 19, label: 'Basic research payments to qualified organizations (see the line 2 instructions)', value: getOverrideValue('B', 19) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
          { lineNumber: 20, label: 'Qualified organization base period amount (see the line 3 instructions)', value: getOverrideValue('B', 20) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
          { lineNumber: 21, label: 'Subtract line 20 from line 19. If zero or less, enter -0-', value: Math.max((getOverrideValue('B', 19) ?? 0) - (getOverrideValue('B', 20) ?? 0), 0), calculatedValue: 0, isEditable: false, dependsOn: [19,20], formula: 'line19-line20', format: formatCurrency },
          { lineNumber: 22, label: 'Add lines 18 and 21', value: (getOverrideValue('B', 18) ?? 0) + (Math.max((getOverrideValue('B', 19) ?? 0) - (getOverrideValue('B', 20) ?? 0), 0)), calculatedValue: 0, isEditable: false, dependsOn: [18,21], formula: 'line18+line21', format: formatCurrency },
          { lineNumber: 23, label: 'Multiply line 22 by 20% (0.20)', value: ((getOverrideValue('B', 18) ?? 0) + (Math.max((getOverrideValue('B', 19) ?? 0) - (getOverrideValue('B', 20) ?? 0), 0))) * 0.20, calculatedValue: 0, isEditable: false, dependsOn: [22], formula: 'line22*0.20', format: formatCurrency },
          { lineNumber: 24, label: 'Wages for qualified services (do not include wages used in figuring the work opportunity credit)', value: employeeQRE, calculatedValue: employeeQRE, isEditable: true, format: formatCurrency },
          { lineNumber: 25, label: 'Cost of supplies', value: supplyQRE, calculatedValue: supplyQRE, isEditable: true, format: formatCurrency },
          { lineNumber: 26, label: 'Rental or lease costs of computers (see the line 7 instructions)', value: computerQRE, calculatedValue: computerQRE, isEditable: true, format: formatCurrency },
          { lineNumber: 27, label: 'Enter the applicable percentage of contract research expenses. See the line 8 instructions', value: contractorQRE, calculatedValue: contractorQRE, isEditable: true, format: formatCurrency },
          { lineNumber: 28, label: 'Total qualified research expenses. Add lines 24 through 27', value: totalQRE, calculatedValue: totalQRE, isEditable: false, dependsOn: [24,25,26,27], formula: 'line24+line25+line26+line27', format: formatCurrency },
          { lineNumber: 29, label: 'Enter your total qualified research expenses for the prior 3 tax years. If you had no qualified research expenses in any one of those years, skip lines 30 and 31', value: priorQRE, calculatedValue: priorQRE, isEditable: true, format: formatCurrency },
          { lineNumber: 30, label: 'Divide line 29 by 6.0', value: line30, calculatedValue: line30, isEditable: false, dependsOn: [29], formula: 'line29/6.0', format: formatCurrency, isVisible: has3ConsecutiveYears },
          { lineNumber: 31, label: 'Subtract line 30 from line 28. If zero or less, enter -0-', value: line31, calculatedValue: line31, isEditable: false, dependsOn: [28,30], formula: 'line28-line30', format: formatCurrency, isVisible: has3ConsecutiveYears },
          { lineNumber: 32, label: `Multiply line ${has3ConsecutiveYears ? '31' : '28'} by ${has3ConsecutiveYears ? '14% (0.14)' : '6% (0.06)'}. ${has3ConsecutiveYears ? '' : 'If you skipped lines 30 and 31, multiply line 28 by 6% (0.06)'}`, value: line32, calculatedValue: line32, isEditable: false, dependsOn: has3ConsecutiveYears ? [31] : [28], formula: has3ConsecutiveYears ? 'line31*0.14' : 'line28*0.06', format: formatCurrency },
          { lineNumber: 33, label: 'Add lines 23 and 32', value: line33, calculatedValue: line33, isEditable: false, dependsOn: [23,32], formula: 'line23+line32', format: formatCurrency },
          { lineNumber: 34, label: 'Are you electing the reduced credit under section 280C?', value: use280C ? line34Yes : line34No, calculatedValue: use280C ? line34Yes : line34No, isEditable: false, dependsOn: [33], formula: 'line33*(use280C?0.79:1)', format: formatCurrency, extra: { preview: !use280C ? line34Yes : null } }
        ]
      });
    }

    // Section C: Current Year Credit (lines 35-40) - S-Corp/Partnership only
    if (isSCorpOrPartnership) {
      newSections.push({
        section: 'C',
        title: 'Section C—Current Year Credit',
        isVisible: true,
        lines: [
          {
            lineNumber: 35,
            label: 'Regular credit or ASC (from line 8 or line 23)',
            value: getOverrideValue('C', 35) ?? (selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)),
            calculatedValue: (selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)),
            isEditable: true,
            format: formatCurrency
          },
          {
            lineNumber: 36,
            label: 'Current year credit (enter here and on Form 3800, line 1a)',
            value: getOverrideValue('C', 36) ?? (selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)),
            calculatedValue: (selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)),
            isEditable: false,
            dependsOn: [35],
            formula: 'line35',
            isCredit: true,
            format: formatCurrency
          }
        ]
      });
    }

    // Section D: Payroll Tax Election (lines 41-44) - only if eligible
    if (isEligibleForPayrollCredit) {
      newSections.push({
        section: 'D',
        title: 'Section D—Payroll Tax Election',
        isVisible: true,
        lines: [
          {
            lineNumber: 41,
            label: 'Current year credit (from line 36)',
            value: getOverrideValue('D', 41) ?? (selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)),
            calculatedValue: (selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)),
            isEditable: true,
            format: formatCurrency
          },
          {
            lineNumber: 42,
            label: 'Multiply line 41 by 0.50',
            value: getOverrideValue('D', 42) ?? ((selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)) * 0.50),
            calculatedValue: ((selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)) * 0.50),
            isEditable: false,
            dependsOn: [41],
            formula: 'line41*0.50',
            format: formatCurrency
          },
          {
            lineNumber: 43,
            label: 'Enter the smaller of line 42 or the amount on line 41',
            value: getOverrideValue('D', 43) ?? Math.min(((selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)) * 0.50), (selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14))),
            calculatedValue: Math.min(((selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)) * 0.50), (selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14))),
            isEditable: false,
            dependsOn: [41,42],
            formula: 'min(line41,line42)',
            format: formatCurrency
          }
        ]
      });
    }

    setSections(newSections);
  };

  const getOverrideValue = (section: string, lineNumber: number): number | null => {
    const override = overrides.find(o => o.section === section && o.line_number === lineNumber);
    return override ? override.value : null;
  };

  const handleLineChange = async (section: string, lineNumber: number, newValue: number) => {
    if (!clientId || !selectedYear?.year) return;

    try {
      // Update local state immediately for responsive UI
      setSections(prevSections => 
        prevSections.map(sectionObj => 
          sectionObj.section === section 
            ? {
                ...sectionObj,
                lines: sectionObj.lines.map(line => 
                  line.lineNumber === lineNumber 
                    ? { ...line, value: newValue, calculatedValue: newValue }
                    : line
                )
              }
            : sectionObj
        )
      );

      // Save to database
      await FilingGuideService.upsertForm6765Override({
        client_id: clientId,
        business_year: selectedYear.year,
        section,
        line_number: lineNumber,
        value: newValue,
        last_modified_by: userId
      });

      // Recalculate dependent lines
      recalculateDependentLines(section, lineNumber, newValue);

    } catch (error) {
      console.error('Error saving override:', error);
    }
  };

  const recalculateDependentLines = (section: string, lineNumber: number, newValue: number) => {
    setSections(prevSections => 
      prevSections.map(sectionObj => 
        sectionObj.section === section 
          ? {
              ...sectionObj,
              lines: sectionObj.lines.map(line => {
                if (line.dependsOn?.includes(lineNumber)) {
                  // Recalculate based on formula
                  const newCalculatedValue = calculateLineValue(line, sectionObj.lines);
                  return { ...line, calculatedValue: newCalculatedValue };
                }
                return line;
              })
            }
          : sectionObj
      )
    );
  };

  const calculateLineValue = (line: Form6765Line, allLines: Form6765Line[]): number => {
    if (!line.formula) return line.calculatedValue;

    // Simple formula evaluation (can be expanded)
    const formula = line.formula;
    let result = 0;

    if (formula.includes('line1 / line2')) {
      const line1 = allLines.find(l => l.lineNumber === 1)?.value || 0;
      const line2 = allLines.find(l => l.lineNumber === 2)?.value || 0;
      result = line2 !== 0 ? line1 / line2 : 0;
    } else if (formula.includes('line3 - line4')) {
      const line3 = allLines.find(l => l.lineNumber === 3)?.value || 0;
      const line4 = allLines.find(l => l.lineNumber === 4)?.value || 0;
      result = line3 - line4;
    } else if (formula.includes('line5 * line2')) {
      const line5 = allLines.find(l => l.lineNumber === 5)?.value || 0;
      const line2 = allLines.find(l => l.lineNumber === 2)?.value || 0;
      result = line5 * line2;
    } else if (formula.includes('line6 * 0.20')) {
      const line6 = allLines.find(l => l.lineNumber === 6)?.value || 0;
      result = line6 * 0.20;
    } else if (formula.includes('line7')) {
      const line7 = allLines.find(l => l.lineNumber === 7)?.value || 0;
      result = line7;
    } else if (formula.includes('line19 / 2')) {
      const line19 = allLines.find(l => l.lineNumber === 19)?.value || 0;
      result = line19 / 2;
    } else if (formula.includes('line18 - line20')) {
      const line18 = allLines.find(l => l.lineNumber === 18)?.value || 0;
      const line20 = allLines.find(l => l.lineNumber === 20)?.value || 0;
      result = line18 - line20;
    } else if (formula.includes('line21 * 0.14')) {
      const line21 = allLines.find(l => l.lineNumber === 21)?.value || 0;
      result = line21 * 0.14;
    } else if (formula.includes('line22')) {
      const line22 = allLines.find(l => l.lineNumber === 22)?.value || 0;
      result = line22;
    } else if (formula.includes('line35')) {
      const line35 = allLines.find(l => l.lineNumber === 35)?.value || 0;
      result = line35;
    } else if (formula.includes('line41 * 0.50')) {
      const line41 = allLines.find(l => l.lineNumber === 41)?.value || 0;
      result = line41 * 0.50;
    } else if (formula.includes('line42')) {
      const line42 = allLines.find(l => l.lineNumber === 42)?.value || 0;
      result = line42;
    } else if (formula.includes('line16 * (use280C ? 0.158 : 0.20)')) {
      const line16 = allLines.find(l => l.lineNumber === 16)?.value || 0;
      const use280C = allLines.find(l => l.lineNumber === 17)?.extra?.use280C;
      result = line16 * (use280C ? 0.158 : 0.20);
    } else if (formula.includes('min(line13, line14)')) {
      const line13 = allLines.find(l => l.lineNumber === 13)?.value || 0;
      const line14 = allLines.find(l => l.lineNumber === 14)?.value || 0;
      result = Math.min(line13, line14);
    }

    return result;
  };

  const resetAllOverrides = async () => {
    if (!clientId || !selectedYear?.year) return;

    try {
      // Delete all overrides for this client/year
      for (const section of sections) {
        for (const line of section.lines) {
          await FilingGuideService.deleteForm6765Override({
            clientId,
            businessYear: selectedYear.year,
            section: section.section,
            lineNumber: line.lineNumber
          });
        }
      }

      // Reload overrides
      await loadOverrides();

    } catch (error) {
      console.error('Error resetting overrides:', error);
    }
  };

  // 1. Section selection logic: Only display Section A if selectedMethod is 'standard', Section B if 'asc'.
  const visibleSections = sections.filter(section => {
    // Defensive check to ensure selectedMethod is always defined
    const method = selectedMethod || 'standard';
    if (method === 'standard') return section.section === 'A';
    if (method === 'asc') return section.section === 'B';
    return false;
  });

  // In render, fallback UI for missing data
  if (loading) {
    return <div className="form-6765-loading">Loading Form 6765...</div>;
  }
  if (!calculations || !businessData || !selectedYear) {
    return <div className="form-6765-error">Unable to load Form 6765: Missing required data. Please check your setup and try again.</div>;
  }

  return (
    <div className="form-6765-container">
      <div className="form-6765-header">
        <h2>Form 6765 - Credit for Increasing Research Activities</h2>
        <p className="form-6765-subtitle">
          Tax Year: {selectedYear?.year || 'N/A'} | 
          Client: {businessData?.name || 'N/A'}
        </p>
      </div>

      {visibleSections.map(section => (
        <div key={section.section} className="form-6765-section">
          <h3 className="section-title">{section.title}</h3>
          {section.section === 'D' && (
            <div className="payroll-credit-explanation">
              <h4>Use this section only if offsetting payroll taxes</h4>
              <p>
                Most businesses opt to use the credit directly, but startups without 
                taxable income may apply the credit to offset payroll taxes. This section is only available 
                for businesses that started within 5 years of the filing year.
              </p>
            </div>
          )}
          <div className="form-6765-lines">
            {section.lines.map((line, idx) => (
              // Skip rendering if line is not visible (for lines 30 and 31 when no 3 consecutive years)
              line.isVisible === false ? null : (
                <React.Fragment key={line.lineNumber}>
                  <div className={`form-6765-line-row${line.isCredit ? ' form-6765-credit-line' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: '6px 0' }}>
                    <div className="line-number" style={{ width: 40, textAlign: 'right', color: '#888' }}>{line.lineNumber}</div>
                    <div className="description" style={{ flex: 1, paddingLeft: 12 }}>
                      {line.label}
                      {section.section === 'A' && line.lineNumber === 17 && (
                        <span style={{ marginLeft: 16, display: 'inline-flex', alignItems: 'center' }}>
                          <label style={{ marginRight: 8, marginLeft: 8, fontWeight: 500 }}>
                            <input
                              type="radio"
                              checked={use280C}
                              onChange={() => setUse280C(true)}
                              style={{ marginRight: 4 }}
                            />
                            Yes
                          </label>
                          <label style={{ fontWeight: 500 }}>
                            <input
                              type="radio"
                              checked={!use280C}
                              onChange={() => setUse280C(false)}
                              style={{ marginRight: 4 }}
                            />
                            No
                          </label>
                        </span>
                      )}
                      {section.section === 'B' && line.lineNumber === 34 && (
                        <span style={{ marginLeft: 16, display: 'inline-flex', alignItems: 'center' }}>
                          <label style={{ marginRight: 8, marginLeft: 8, fontWeight: 500 }}>
                            <input
                              type="radio"
                              checked={use280C}
                              onChange={() => setUse280C(true)}
                              style={{ marginRight: 4 }}
                            />
                            Yes
                          </label>
                          <label style={{ fontWeight: 500 }}>
                            <input
                              type="radio"
                              checked={!use280C}
                              onChange={() => setUse280C(false)}
                              style={{ marginRight: 4 }}
                            />
                            No
                          </label>
                          {!use280C && line.extra?.preview != null && (
                            <span style={{ color: '#888', fontSize: '0.95em', marginLeft: 10 }}>
                              ({safeCurrency(line.extra.preview)})<span style={{ fontSize: '1em', verticalAlign: 'super' }}>*</span>
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="amount" style={{ width: 120, textAlign: 'right', fontWeight: 'bold', padding: '0 8px' }}>
                      {section.section === 'A' && [5, 6, 8, 10, 11].includes(line.lineNumber) && line.isEditable ? (
                        <input
                          type="text"
                          value={(() => {
                            const val = typeof line.value === 'number' && !isNaN(line.value) ? line.value : 0;
                            if (line.lineNumber === 5) return formatCurrencyInput(val);
                            if (line.lineNumber === 6) return formatCurrencyInput(val);
                            if (line.lineNumber === 8) return formatCurrencyInput(val);
                            if (line.lineNumber === 10) return formatPercentInput(val === 0 ? 0.03 : val);
                            if (line.lineNumber === 11) return formatCurrencyInput(val);
                            return val;
                          })()}
                          onChange={e => {
                            let val = e.target.value;
                            if ([5, 6, 8, 11].includes(line.lineNumber)) {
                              val = parseCurrencyInput(val);
                            } else if (line.lineNumber === 10) {
                              val = parsePercentInput(val);
                            }
                            handleLineChange(section.section, line.lineNumber, val);
                          }}
                          onBlur={e => {
                            let val = e.target.value;
                            if ([5, 6, 8, 11].includes(line.lineNumber)) {
                              val = formatCurrencyInput(parseCurrencyInput(val));
                            } else if (line.lineNumber === 10) {
                              val = formatPercentInput(parsePercentInput(val));
                            }
                            e.target.value = val;
                          }}
                          style={{ width: 110, textAlign: 'right', fontWeight: 'bold', background: '#f7fbff', border: '1px solid #dbeafe', borderRadius: 4, color: '#222', padding: '0 8px' }}
                        />
                      ) : section.section === 'B' && [24, 25, 26, 27, 29].includes(line.lineNumber) && line.isEditable ? (
                        <input
                          type="text"
                          value={formatCurrencyInput(line.value)}
                          onChange={e => {
                            const val = parseCurrencyInput(e.target.value);
                            handleLineChange(section.section, line.lineNumber, val);
                          }}
                          onBlur={e => {
                            const val = parseCurrencyInput(e.target.value);
                            e.target.value = formatCurrencyInput(val);
                          }}
                          style={{ width: 110, textAlign: 'right', fontWeight: 'bold', background: '#f7fbff', border: '1px solid #dbeafe', borderRadius: 4, color: '#222', padding: '0 8px' }}
                        />
                      ) : (
                        (() => {
                          // Special logic for line 17: swap value if 280C Yes is selected
                          if (line.lineNumber === 17 && (section.section === 'A' || section.section === 'B')) {
                            if (use280C && line.extra?.preview != null) {
                              // Show reduced 280C value
                              return formatCurrency(line.extra.preview);
                            }
                          }
                          const val = typeof line.value === 'number' && !isNaN(line.value) ? line.value : 0;
                          if (line.format) return line.format(val);
                          if (line.label && /percent|percentage/i.test(line.label)) return formatPercent(val);
                          if (line.lineNumber === 10) return formatPercent(val === 0 ? 0.03 : val);
                          return formatCurrency(val);
                        })()
                      )}
                    </div>
                  </div>
                  {/* 280C explanation and reduction note for Section A, line 17 */}
                  {section.section === 'A' && line.lineNumber === 17 && (
                    <div style={{ fontSize: '0.97em', color: '#555', margin: '8px 0 16px 52px', maxWidth: 900 }}>
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ color: '#888', fontSize: '1em', verticalAlign: 'super' }}>*</span> The 280C election (reduced credit) may only be elected on a timely filed original return (including extensions). Once elected on an original return the election shall be irrevocable and must be taken on any amended returns thereafter. Please note that if you do not (or are not able to) elect the reduced credit, the amount of other deductions must be reduced by the amount of the gross credit.{!use280C && line.extra?.preview != null && ` If used, the estimated credit value is ${formatCurrency(line.extra.preview)}.`}
                      </div>
                      <div style={{ color: '#888' }}>
                        The amount on line 8 is already reduced by 35% pursuant to § 41(b)(3)(A). Please note that some accounting software further reduces this number by 35%. If so, please divide the number in line 8 by 65% and enter the resulting value instead.
                      </div>
                    </div>
                  )}
                  {/* 280C explanation and reduction note for Section B, line 34 */}
                  {section.section === 'B' && line.lineNumber === 34 && (
                    <div style={{ fontSize: '0.97em', color: '#555', margin: '8px 0 16px 52px', maxWidth: 900 }}>
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ color: '#888', fontSize: '1em', verticalAlign: 'super' }}>*</span> The 280C election (reduced credit) may only be elected on a timely filed original return (including extensions). Once elected on an original return the election shall be irrevocable and must be taken on any amended returns thereafter. Please note that if you do not (or are not able to) elect the reduced credit, the amount of other deductions must be reduced by the amount of the gross credit.{!use280C && line.extra?.preview != null && ` If used, the estimated credit value is ${formatCurrency(line.extra.preview)}.`}
                      </div>
                      <div style={{ color: '#888' }}>
                        The amount on line 8 is already reduced by 35% pursuant to § 41(b)(3)(A). Please note that some accounting software further reduces this number by 35%. If so, please divide the number in line 8 by 65% and enter the resulting value instead.
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            ))}
          </div>
        </div>
      ))}

      <div className="form-6765-reset-section">
        <button
          onClick={resetAllOverrides}
          className="reset-all-button"
          title="Reset all values to calculated amounts"
        >
          Reset All Values
        </button>
      </div>
    </div>
  );
};

export default Form6765; 