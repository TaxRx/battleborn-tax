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
  userId
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

  const initializeSections = () => {
    const businessYear = selectedYear?.year || new Date().getFullYear();
    const businessStartYear = businessData?.start_year || businessYear;
    const isEligibleForPayrollCredit = (businessYear - businessStartYear) <= 5;
    const isSCorpOrPartnership = businessData?.entity_type === 'S-Corp' || businessData?.entity_type === 'Partnership';
    const selectedMethod = calculations?.federalCredits?.selectedMethod || 'standard';

    console.log('Form 6765 Debug:', {
      selectedMethod,
      calculations,
      businessData,
      selectedYear
    });

    // Base period calculations - use actual calculated value or default to 3%
    const fixedBaseAmount = standardCredit?.fixedBaseAmount || 0;
    const incrementalQRE = standardCredit?.incrementalQRE || 0;
    
    // ASC calculations
    const avgPriorQRE = ascCredit?.avgPriorQRE || 0;
    const ascIncrementalQRE = ascCredit?.incrementalQRE || 0;
    
    // Contractor applied amounts (sum of all contractor applied_amount)
    const contractorAppliedAmounts = calculations?.currentYearQRE?.contractor_costs || 0;

    const newSections: Form6765Section[] = [];

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
      const employeeQRE = getOverrideValue('A', 5) ?? (calculations?.currentYearQRE?.employee_wages ?? 0);
      const supplyQRE = getOverrideValue('A', 6) ?? (calculations?.currentYearQRE?.supply_costs ?? 0);
      const computerQRE = getOverrideValue('A', 7) ?? 0;
      const contractorQRE = getOverrideValue('A', 8) ?? (calculations?.currentYearQRE?.contractor_costs ?? 0);
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

    // Section B: ASC (lines 5-17, IRS-accurate mapping)
    if (selectedMethod === 'asc') {
      // Extract QRE breakdowns
      const employeeQRE = calculations?.currentYearQRE?.employee_costs || 0;
      const supplyQRE = calculations?.currentYearQRE?.supply_costs || 0;
      const contractorQRE = calculations?.currentYearQRE?.contractor_costs || 0;
      const rentalQRE = getOverrideValue('B', 7) ?? 0;
      const fixedBasePercent = Math.min(ascCredit?.basePercentage ?? 0.14, 0.16);
      const avgGrossReceipts = historicalData.length > 0 
        ? historicalData.reduce((sum, year) => sum + (year.gross_receipts || 0), 0) / historicalData.length 
        : 0;
      const totalQRE = employeeQRE + supplyQRE + rentalQRE + contractorQRE;
      const line12 = avgGrossReceipts * fixedBasePercent;
      const line13 = Math.max(totalQRE - line12, 0);
      const line14 = totalQRE * 0.5;
      const line15 = Math.min(line13, line14);
      const line16 = (getOverrideValue('B', 1) ?? 0) + (getOverrideValue('B', 4) ?? 0) + line15;
      const line17Yes = line16 * 0.079;
      const line17No = line16;

      newSections.push({
        section: 'B',
        title: 'Section B—Alternative Simplified Credit',
        isVisible: true,
        lines: [
          { lineNumber: 5, label: 'Wages for qualified services (do not include wages used in figuring the work opportunity credit)', value: employeeQRE, calculatedValue: employeeQRE, isEditable: false, format: formatCurrency },
          { lineNumber: 6, label: 'Cost of supplies', value: supplyQRE, calculatedValue: supplyQRE, isEditable: false, format: formatCurrency },
          { lineNumber: 7, label: 'Rental or lease costs of computers (see instructions)', value: rentalQRE, calculatedValue: rentalQRE, isEditable: true, format: formatCurrency },
          { lineNumber: 8, label: 'Enter the applicable percentage of contract research expenses. See instructions', value: contractorQRE, calculatedValue: contractorQRE, isEditable: false, format: formatCurrency },
          { lineNumber: 9, label: 'Total qualified research expenses. Add lines 5 through 8', value: totalQRE, calculatedValue: totalQRE, isEditable: false, dependsOn: [5,6,7,8], formula: 'line5+line6+line7+line8', format: formatCurrency },
          { lineNumber: 10, label: 'Enter fixed-base percentage, but not more than 16% (0.16) (see instructions)', value: fixedBasePercent, calculatedValue: fixedBasePercent, isEditable: true, format: formatPercent },
          { lineNumber: 11, label: 'Enter average annual gross receipts. See instructions', value: avgGrossReceipts, calculatedValue: avgGrossReceipts, isEditable: true, format: formatCurrency },
          { lineNumber: 12, label: 'Multiply line 11 by the percentage on line 10', value: line12, calculatedValue: line12, isEditable: false, dependsOn: [10,11], formula: 'line11*line10', format: formatCurrency },
          { lineNumber: 13, label: 'Subtract line 12 from line 9. If zero or less, enter -0-', value: line13, calculatedValue: line13, isEditable: false, dependsOn: [9,12], formula: 'line9-line12', format: formatCurrency },
          { lineNumber: 14, label: 'Multiply line 9 by 50% (0.50)', value: line14, calculatedValue: line14, isEditable: false, dependsOn: [9], formula: 'line9*0.5', format: formatCurrency },
          { lineNumber: 15, label: 'Enter the smaller of line 13 or line 14', value: line15, calculatedValue: line15, isEditable: false, dependsOn: [13,14], formula: 'min(line13,line14)', format: formatCurrency },
          { lineNumber: 16, label: 'Add lines 1, 4, and 15', value: line16, calculatedValue: line16, isEditable: false, dependsOn: [1,4,15], formula: 'line1+line4+line15', format: formatCurrency },
          { lineNumber: 17, label: 'Are you electing the reduced credit under section 280C?', value: use280C ? line17Yes : line17No, calculatedValue: use280C ? line17Yes : line17No, isEditable: false, dependsOn: [16], formula: 'line16*(use280C?0.79:1)', format: formatCurrency, extra: { preview: !use280C ? line17Yes : null } }
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
            formula: 'line41 * 0.50',
            format: formatCurrency
          },
          {
            lineNumber: 43,
            label: 'Payroll tax credit (enter here and on Form 8974)',
            value: getOverrideValue('D', 43) ?? ((selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)) * 0.50),
            calculatedValue: ((selectedMethod === 'standard' ? 
              ((currentYearQRE - Math.max((avgGrossReceipts * basePercentage), 0.5 * currentYearQRE)) * 0.20) :
              ((currentYearQRE - (avgPriorQRE / 2)) * 0.14)) * 0.50),
            isEditable: false,
            dependsOn: [42],
            formula: 'line42',
            isCredit: true,
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
      // Update local state immediately
      setSections(prevSections => 
        prevSections.map(sectionObj => 
          sectionObj.section === section 
            ? {
                ...sectionObj,
                lines: sectionObj.lines.map(line => 
                  line.lineNumber === lineNumber 
                    ? { ...line, value: newValue }
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

      {sections.map(section => (
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
                    {section.section === 'B' && line.lineNumber === 17 && (
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
                {/* 280C explanation and reduction note for Section B, line 17 */}
                {section.section === 'B' && line.lineNumber === 17 && (
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