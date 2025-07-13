import React, { useState, useEffect, useMemo } from 'react';
import { FilingGuideService } from './FilingGuideService';
import { Form6765Override } from './types';
import { supabase } from '../../../../lib/supabase';

// Types for lines and sections
interface Form6765Line {
  lineNumber: number;
  label: string;
  value: number;
  calculatedValue: number;
  isEditable: boolean;
  dependsOn?: number[];
  formula?: string;
  format?: (value: number) => string;
  isLocked?: boolean;
  extra?: any;
  isVisible?: boolean;
}

interface Form6765Section {
  section: string;
  title: string;
  lines: Form6765Line[];
  isVisible: boolean;
}

interface Form6765v2024Props {
  businessData: any;
  selectedYear: any;
  calculations: any;
  clientId: string;
  userId?: string;
  selectedMethod?: 'standard' | 'asc';
}

// Formatting functions from original Form6765
const formatCurrency = (amount: number) => amount == null ? '' : amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatPercent = (value: number) => value == null ? '' : `${(value * 100).toFixed(2)}%`;

const safeCurrency = (value: any) => {
  if (value == null || value === undefined || isNaN(value)) return 0;
  return typeof value === 'number' ? value : parseFloat(value) || 0;
};

const safePercent = (value: any, min = 0.03) => {
  if (value == null || value === undefined || isNaN(value)) return min;
  const num = typeof value === 'number' ? value : parseFloat(value) || min;
  return Math.max(num, min);
};

const formatCurrencyInput = (value: string) => {
  const num = parseFloat(value.replace(/[$,]/g, '')) || 0;
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const parseCurrencyInput = (value: string) => {
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
};

const formatPercentInput = (value: string) => {
  const num = parseFloat(value.replace(/[%]/g, '')) || 0;
  return num.toFixed(2);
};

const parsePercentInput = (value: string) => {
  return parseFloat(value.replace(/[%]/g, '')) / 100 || 0;
};

// Main component
const Form6765v2024: React.FC<Form6765v2024Props> = ({
  businessData,
  selectedYear,
  calculations,
  clientId,
  userId,
  selectedMethod: propSelectedMethod
}) => {
  const [overrides, setOverrides] = useState<Form6765Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [use280C, setUse280C] = useState(false);
  const [maskedInputs, setMaskedInputs] = useState<{[key: string]: string}>({});
  
  // State for Section E data
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [ownerQREs, setOwnerQREs] = useState(0);

  // Data extraction from calculations (same as original Form6765)
  const currentYearQRE = calculations?.currentYearQRE?.total || 0;
  const federalCredits = calculations?.federalCredits || {};
  const standardCredit = federalCredits?.standard || {};
  const ascCredit = federalCredits?.asc || {};
  const historicalData = calculations?.historicalData || [];
  const avgGrossReceipts = historicalData.length > 0 
    ? historicalData.reduce((sum: number, year: any) => sum + (year.gross_receipts || 0), 0) / historicalData.length 
    : 0;
  const rawBasePercentage = standardCredit?.basePercentage;
  const basePercentage = (typeof rawBasePercentage === 'number' && rawBasePercentage >= 0.03) ? rawBasePercentage : 0.03;

  // Define selectedMethod
  const selectedMethod = propSelectedMethod || calculations?.federalCredits?.selectedMethod || 'standard';

  // Load overrides on component mount
  useEffect(() => {
    loadOverrides();
  }, [clientId, selectedYear?.year]);

  // On mount, initialize use280C from calculations
  useEffect(() => {
    setUse280C(!!calculations?.federalCredits?.use280C);
  }, [calculations]);

  // Load Section E data
  useEffect(() => {
    loadSectionEData();
  }, [selectedYear?.id, businessData?.id]);

  const loadSectionEData = async () => {
    if (!selectedYear?.id || !businessData?.id) return;

    try {
      // Get activities count
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('rd_selected_activities')
        .select('id')
        .eq('business_year_id', selectedYear.id);

      if (activitiesError) {
        console.error('Error loading activities count:', activitiesError);
      } else {
        setActivitiesCount(activitiesData?.length || 0);
      }

      // Get owner QREs
      const { data: ownerData, error: ownerError } = await supabase
        .from('rd_employees')
        .select(`
          id,
          is_owner,
          annual_wage,
          rd_employee_year_data!inner (
            id,
            applied_percent,
            calculated_qre
          )
        `)
        .eq('business_id', businessData.id)
        .eq('is_owner', true)
        .eq('rd_employee_year_data.business_year_id', selectedYear.id);

      if (ownerError) {
        console.error('Error loading owner QREs:', ownerError);
      } else {
        const totalOwnerQREs = ownerData?.reduce((sum: number, employee: any) => {
          const yearData = employee.rd_employee_year_data?.[0];
          return sum + (yearData?.calculated_qre || 0);
        }, 0) || 0;
        setOwnerQREs(totalOwnerQREs);
      }
    } catch (error) {
      console.error('Error loading Section E data:', error);
    }
  };

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

  const getOverrideValue = (section: string, lineNumber: number): number | null => {
    const override = overrides.find(o => o.section === section && o.line_number === lineNumber);
    return override ? override.value : null;
  };

  const handleLineChange = async (section: string, lineNumber: number, newValue: number) => {
    // Save override to database
    try {
      await FilingGuideService.upsertForm6765Override({
        client_id: clientId,
        business_year: selectedYear.year,
        section,
        line_number: lineNumber,
        value: newValue,
        last_modified_by: userId
      });
      
      // Update local state
      setOverrides(prev => {
        const existing = prev.find(o => o.section === section && o.line_number === lineNumber);
        if (existing) {
          return prev.map(o => o === existing ? { ...o, value: newValue } : o);
        } else {
          return [...prev, { 
            client_id: clientId,
            business_year: selectedYear.year,
            section, 
            line_number: lineNumber, 
            value: newValue,
            last_modified_by: userId
          }];
        }
      });
    } catch (error) {
      console.error('Error saving override:', error);
    }
  };

  // Section F state (QREs) - populated from calculations
  const [sectionF, setSectionF] = useState<Form6765Line[]>([
    { 
      lineNumber: 42, 
      label: 'Total wages for qualified services for all business components (do not include any wages used in figuring the work opportunity credit)', 
      value: safeCurrency(calculations?.currentYearQRE?.employee_wages), 
      calculatedValue: safeCurrency(calculations?.currentYearQRE?.employee_wages), 
      isEditable: true, 
      format: formatCurrency 
    },
    { 
      lineNumber: 43, 
      label: 'Total costs of supplies for all business components', 
      value: safeCurrency(calculations?.currentYearQRE?.supply_costs), 
      calculatedValue: safeCurrency(calculations?.currentYearQRE?.supply_costs), 
      isEditable: true, 
      format: formatCurrency 
    },
    { 
      lineNumber: 44, 
      label: 'Total rental or lease cost of computers for all business components', 
      value: 0, 
      calculatedValue: 0, 
      isEditable: true, 
      format: formatCurrency 
    },
    { 
      lineNumber: 45, 
      label: 'Total applicable amount of contract research for all business components (do not include basic research payments)', 
      value: safeCurrency(calculations?.currentYearQRE?.contractor_costs), 
      calculatedValue: safeCurrency(calculations?.currentYearQRE?.contractor_costs), 
      isEditable: true, 
      format: formatCurrency 
    },
    { 
      lineNumber: 46, 
      label: 'Enter the applicable amount of all basic research payments. See instructions.', 
      value: 0, 
      calculatedValue: 0, 
      isEditable: true, 
      format: formatCurrency 
    },
    { 
      lineNumber: 47, 
      label: 'Add line 45 and line 46', 
      value: 0, 
      calculatedValue: 0, 
      isEditable: false, 
      dependsOn: [45, 46], 
      formula: 'line45+line46', 
      format: formatCurrency 
    },
    { 
      lineNumber: 48, 
      label: 'Add lines 42, 43, 44, and 47, then enter line 48 on either line 5 or line 20, whichever is appropriate', 
      value: 0, 
      calculatedValue: 0, 
      isEditable: false, 
      dependsOn: [42, 43, 44, 47], 
      formula: 'line42+line43+line44+line47', 
      format: formatCurrency, 
      isLocked: true 
    },
  ]);

  // Calculate Section F totals
  const recalcSectionF = (lines: Form6765Line[]): Form6765Line[] => {
    const l = [...lines];
    l[5].value = l[3].value + l[4].value; // 47 = 45 + 46
    l[5].calculatedValue = l[5].value;
    l[6].value = l[0].value + l[1].value + l[2].value + l[5].value; // 48 = 42+43+44+47
    l[6].calculatedValue = l[6].value;
    return l;
  };

  // Update Section F when calculations change
  useEffect(() => {
    setSectionF(prev => {
      const updated = [...prev];
      updated[0].value = safeCurrency(calculations?.currentYearQRE?.employee_wages);
      updated[0].calculatedValue = updated[0].value;
      updated[1].value = safeCurrency(calculations?.currentYearQRE?.supply_costs);
      updated[1].calculatedValue = updated[1].value;
      updated[3].value = safeCurrency(calculations?.currentYearQRE?.contractor_costs);
      updated[3].calculatedValue = updated[3].value;
      return recalcSectionF(updated);
    });
  }, [calculations]);

  // Section A (lines 1-13) - only show if selectedMethod is 'standard'
  const sectionA: Form6765Section = useMemo(() => ({
    section: 'A',
    title: 'Section A—Regular Credit',
    isVisible: selectedMethod === 'standard',
    lines: [
      { lineNumber: 1, label: 'Certain amounts paid or incurred to energy consortia (see instructions)', value: getOverrideValue('A', 1) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 2, label: 'Basic research payments to qualified organizations (see instructions)', value: getOverrideValue('A', 2) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 3, label: 'Qualified organization base period amount', value: getOverrideValue('A', 3) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 4, label: 'Subtract line 3 from line 2. If zero or less, enter -0-', value: getOverrideValue('A', 4) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [2, 3], formula: 'line2-line3', format: formatCurrency },
      { lineNumber: 5, label: 'Total qualified research expenses (QREs). Enter amount from line 48', value: sectionF[6]?.value || 0, calculatedValue: sectionF[6]?.value || 0, isEditable: false, isLocked: true, dependsOn: [48], format: formatCurrency },
      { lineNumber: 6, label: 'Enter fixed-base percentage, but not more than 16% (0.16). See instructions', value: getOverrideValue('A', 6) ?? basePercentage, calculatedValue: basePercentage, isEditable: true, format: formatPercent },
      { lineNumber: 7, label: 'Enter average annual gross receipts. See instructions', value: getOverrideValue('A', 7) ?? avgGrossReceipts, calculatedValue: avgGrossReceipts, isEditable: true, format: formatCurrency },
      { lineNumber: 8, label: 'Multiply line 7 by the percentage on line 6', value: 0, calculatedValue: 0, isEditable: false, dependsOn: [6, 7], formula: 'line7*line6', format: formatCurrency },
      { lineNumber: 9, label: 'Subtract line 8 from line 5. If zero or less, enter -0-', value: 0, calculatedValue: 0, isEditable: false, dependsOn: [5, 8], formula: 'line5-line8', format: formatCurrency },
      { lineNumber: 10, label: 'Multiply line 5 by 50% (0.50)', value: 0, calculatedValue: 0, isEditable: false, dependsOn: [5], formula: 'line5*0.5', format: formatCurrency },
      { lineNumber: 11, label: 'Enter the smaller of line 9 or line 10', value: 0, calculatedValue: 0, isEditable: false, dependsOn: [9, 10], formula: 'min(line9,line10)', format: formatCurrency },
      { lineNumber: 12, label: 'Add lines 1, 4, and 11', value: 0, calculatedValue: 0, isEditable: false, dependsOn: [1, 4, 11], formula: 'line1+line4+line11', format: formatCurrency },
      { lineNumber: 13, label: 'If you elect to reduce the credit under section 280C, then multiply line 12 by 15.8% (0.158). If not, multiply line 12 by 20% (0.20) and see instructions for the statement that must be attached', value: 0, calculatedValue: 0, isEditable: false, dependsOn: [12], formula: 'line12*0.158 or line12*0.20', format: formatCurrency },
    ],
  }), [selectedMethod, overrides, basePercentage, avgGrossReceipts, sectionF[6]?.value]);

  // Section B (lines 14-26) - only show if selectedMethod is 'asc'
  const sectionB: Form6765Section = useMemo(() => ({
    section: 'B',
    title: 'Section B—Alternative Simplified Credit',
    isVisible: selectedMethod === 'asc',
    lines: [
      { lineNumber: 14, label: 'Certain amounts paid or incurred to energy consortia (see the line 1 instructions)', value: getOverrideValue('B', 14) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 15, label: 'Basic research payments to qualified organizations (see the line 2 instructions)', value: getOverrideValue('B', 15) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 16, label: 'Qualified organization base period amount (see the line 3 instructions)', value: getOverrideValue('B', 16) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 17, label: 'Subtract line 16 from line 15. If zero or less, enter -0-', value: getOverrideValue('B', 17) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [15, 16], formula: 'line15-line16', format: formatCurrency },
      { lineNumber: 18, label: 'Add lines 14 and 17', value: getOverrideValue('B', 18) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [14, 17], formula: 'line14+line17', format: formatCurrency },
      { lineNumber: 19, label: 'Multiply line 18 by 20% (0.20)', value: getOverrideValue('B', 19) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [18], formula: 'line18*0.20', format: formatCurrency },
      { lineNumber: 20, label: 'Total qualified research expenses (QREs). Enter amount from line 48', value: sectionF[6]?.value || 0, calculatedValue: sectionF[6]?.value || 0, isEditable: false, isLocked: true, dependsOn: [48], format: formatCurrency },
      { lineNumber: 21, label: 'Enter your total QREs for the prior 3 tax years. If you had no QREs in any 1 of those years, skip lines 22 and 23', value: getOverrideValue('B', 21) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 22, label: 'Divide line 21 by 6.0', value: getOverrideValue('B', 22) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [21], formula: 'line21/6.0', format: formatCurrency },
      { lineNumber: 23, label: 'Subtract line 22 from line 20. If zero or less, enter -0-', value: getOverrideValue('B', 23) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [20, 22], formula: 'line20-line22', format: formatCurrency },
      { lineNumber: 24, label: 'Multiply line 23 by 14% (0.14). If you skipped lines 22 and 23, multiply line 20 by 6% (0.06)', value: getOverrideValue('B', 24) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [23, 20], formula: 'line23*0.14 or line20*0.06', format: formatCurrency },
      { lineNumber: 25, label: 'Add lines 19 and 24', value: getOverrideValue('B', 25) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [19, 24], formula: 'line19+line24', format: formatCurrency },
      { lineNumber: 26, label: 'If you elect to reduce the credit under section 280C, then multiply line 25 by 79%  (0.79).  If not, enter the amount from line 25 and see the line 13 instructions for the statement that must be attached', value: getOverrideValue('B', 26) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [25], formula: 'line25*0.79 or line25', format: formatCurrency },
    ],
  }), [selectedMethod, overrides, sectionF[6]?.value]);

  // Section C - Current Year Credit
  const sectionC: Form6765Section = useMemo(() => ({
    section: 'C',
    title: 'Section C—Current Year Credit',
    isVisible: true,
    lines: [
      { lineNumber: 27, label: 'Enter the portion of the credit from Form 8932, line 2, that is attributable to wages that were also used to figure the credit on line 13 or line 26 (whichever applies)', value: getOverrideValue('C', 27) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 28, label: 'Subtract line 27 from line 13 or line 26 (whichever applies). If zero or less, enter -0-', value: getOverrideValue('C', 28) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [27], formula: 'line13-line27 or line26-line27', format: formatCurrency },
      { lineNumber: 29, label: 'Credit for increasing research activities from partnerships, S corporations, estates, and trusts', value: getOverrideValue('C', 29) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 30, label: 'Add lines 28 and 29', value: getOverrideValue('C', 30) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [28, 29], formula: 'line28+line29', format: formatCurrency },
      { lineNumber: 31, label: 'Amount allocated to beneficiaries of the estate or trust (see instructions)', value: getOverrideValue('C', 31) ?? 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 32, label: 'Estates and trusts, subtract line 31 from line 30. For eligible small businesses, report the credit on Form 3800, Part III, line 4i. See instructions. For filers other than eligible small businesses, report the credit on Form 3800, Part III, line 1c', value: getOverrideValue('C', 32) ?? 0, calculatedValue: 0, isEditable: false, dependsOn: [30, 31], formula: 'line30-line31', format: formatCurrency },
    ],
  }), [overrides]);

  // Section D - Qualified Small Business Payroll Tax Election and Payroll Tax Credit
  const sectionD: Form6765Section = useMemo(() => ({
    section: 'D',
    title: 'Section D—Qualified Small Business Payroll Tax Election and Payroll Tax Credit. Skip this section if the payroll tax election does not apply. See instructions.',
    isVisible: true,
    lines: [
      { lineNumber: 33, label: 'a Check this box if you are a qualified small business electing the payroll tax credit. See instructions', value: 0, calculatedValue: 0, isEditable: true, format: (val) => val ? 'Yes' : 'No', extra: { type: 'checkbox' } },
      { lineNumber: 33, label: 'b Check the box if payroll tax is reported on a different EIN', value: 0, calculatedValue: 0, isEditable: true, format: (val) => val ? 'Yes' : 'No', extra: { type: 'checkbox' } },
      { lineNumber: 34, label: 'Enter the portion of line 28 elected as a payroll tax credit (do not enter more than $500,000). See instructions', value: 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 35, label: 'General business credit carryforward from the current year. See instructions. Partnerships and S corporations, skip this line and go to line 36', value: 0, calculatedValue: 0, isEditable: true, format: formatCurrency },
      { lineNumber: 36, label: 'Partnerships and S corporations, enter the smaller of line 28 or line 34. All others, enter the smallest of line 28, line 34, or line 35. Enter here and on the applicable line of Form 8974, Part 1, column (e). Members of controlled groups or businesses under common control, see instructions for the statement that must be attached', value: 0, calculatedValue: 0, isEditable: false, dependsOn: [28, 34, 35], formula: 'min(line28,line34,line35)', format: formatCurrency },
    ],
  }), []);

  // Section E - Other Information
  const sectionE: Form6765Section = useMemo(() => ({
    section: 'E',
    title: 'Section E—Other Information. See instructions.',
    isVisible: true,
    lines: [
      { lineNumber: 37, label: 'Enter the number of business components generating the QREs on line 5 or line 20', value: getOverrideValue('E', 37) ?? activitiesCount, calculatedValue: activitiesCount, isEditable: true, format: (val) => val.toString() },
      { lineNumber: 38, label: 'Enter the amount of officers\' wages included on line 42', value: getOverrideValue('E', 38) ?? ownerQREs, calculatedValue: ownerQREs, isEditable: true, format: formatCurrency },
      { lineNumber: 39, label: 'Did you perform qualified research in a trade or business in which you had net losses in the current year?', value: getOverrideValue('E', 39) ?? 0, calculatedValue: 0, isEditable: true, format: (val) => val ? 'Yes' : 'No', extra: { type: 'radio', options: ['No', 'Yes'] } },
      { lineNumber: 40, label: 'Did you perform qualified research in a trade or business in which you had net losses in any of the 3 preceding tax years?', value: getOverrideValue('E', 40) ?? 0, calculatedValue: 0, isEditable: true, format: (val) => val ? 'Yes' : 'No', extra: { type: 'radio', options: ['No', 'Yes'] } },
      { lineNumber: 41, label: 'Did you acquire the major portion of a trade or business during the current year or any of the 3 preceding tax years?', value: getOverrideValue('E', 41) ?? 0, calculatedValue: 0, isEditable: true, format: (val) => val ? 'Yes' : 'No', extra: { type: 'radio', options: ['No', 'Yes'] } }
    ]
  }), [activitiesCount, ownerQREs, overrides]);
  const sectionG: Form6765Section = useMemo(() => ({
    section: 'G',
    title: 'Section G—Future logic to be implemented',
    isVisible: true,
    lines: [], // TODO: Implement Section G logic
  }), []);

  // Calculate Section A totals with 280C logic
  const calculateSectionA = (): Form6765Line[] => {
    const lines = [...sectionA.lines];
    
    // Calculate dependent lines
    lines[7].value = lines[6].value * lines[5].value; // line 8 = line 7 * line 6
    lines[8].value = Math.max(lines[4].value - lines[7].value, 0); // line 9 = line 5 - line 8
    lines[9].value = lines[4].value * 0.5; // line 10 = line 5 * 0.5
    lines[10].value = Math.min(lines[8].value, lines[9].value); // line 11 = min(line 9, line 10)
    lines[11].value = lines[0].value + lines[3].value + lines[10].value; // line 12 = line 1 + line 4 + line 11
    
    // Apply 280C logic to final calculation
    const baseAmount = lines[11].value;
    lines[12].value = use280C ? baseAmount * 0.158 : baseAmount * 0.20; // line 13 with 280C logic
    
    return lines;
  };

  // Calculate Section B totals with 280C logic
  const calculateSectionB = (): Form6765Line[] => {
    const lines = [...sectionB.lines];
    
    // Calculate dependent lines
    lines[3].value = Math.max(lines[2].value - lines[1].value, 0); // line 17 = line 15 - line 16
    lines[4].value = lines[0].value + lines[3].value; // line 18 = line 14 + line 17
    lines[5].value = lines[4].value * 0.20; // line 19 = line 18 * 0.20
    
    // ASC calculation logic
    const hasPriorQREs = lines[7].value > 0; // line 21 has prior QREs
    if (hasPriorQREs) {
      lines[8].value = lines[7].value / 6.0; // line 22 = line 21 / 6.0
      lines[9].value = Math.max(lines[6].value - lines[8].value, 0); // line 23 = line 20 - line 22
      lines[10].value = lines[9].value * 0.14; // line 24 = line 23 * 0.14 (14% calculation)
    } else {
      lines[8].value = 0; // line 22 = 0
      lines[9].value = 0; // line 23 = 0
      lines[10].value = lines[6].value * 0.06; // line 24 = line 20 * 0.06 (6% calculation)
    }
    
    lines[11].value = lines[5].value + lines[10].value; // line 25 = line 19 + line 24
    
    // Apply 280C logic to final calculation
    const baseAmount = lines[11].value;
    lines[12].value = use280C ? baseAmount * 0.79 : baseAmount; // line 26 with 280C logic
    
    return lines;
  };

  // Calculate Section C totals
  const calculateSectionC = (): Form6765Line[] => {
    const lines = [...sectionC.lines];
    
    // Get the appropriate line 13 or line 26 value based on selected method
    const line13or26 = selectedMethod === 'standard' ? 
      (sectionACalculated[12]?.value || 0) : 
      (sectionBCalculated[12]?.value || 0);
    
    // Get credit data from calculations
    const federalCredit = selectedMethod === 'standard' ? 
      (calculations?.federalCredits?.standard?.credit || 0) : 
      (calculations?.federalCredits?.asc?.credit || 0);
    
    // Calculate dependent lines
    lines[1].value = Math.max(line13or26 - lines[0].value, 0); // line 28 = line 13/26 - line 27
    lines[3].value = lines[1].value + lines[2].value; // line 30 = line 28 + line 29
    lines[5].value = Math.max(lines[3].value - lines[4].value, 0); // line 32 = line 30 - line 31
    
    // Update calculated values to reflect the actual credit amounts
    lines[1].calculatedValue = lines[1].value;
    lines[3].calculatedValue = lines[3].value;
    lines[5].calculatedValue = lines[5].value;
    
    return lines;
  };

  // Calculate Section D totals
  const calculateSectionD = (): Form6765Line[] => {
    const lines = [...sectionD.lines];
    
    // Get line 28 from Section C
    const line28 = sectionC.lines[1]?.value || 0;
    
    // Calculate dependent lines
    lines[4].value = Math.min(line28, lines[2].value, lines[3].value); // line 36 = min(line28, line34, line35)
    
    return lines;
  };

  // Calculate Section E totals
  const calculateSectionE = (): Form6765Line[] => {
    const lines = [...sectionE.lines];
    
    // Update lines with loaded data
    lines[0].value = activitiesCount; // Line 37: Number of business components
    lines[0].calculatedValue = activitiesCount;
    
    lines[1].value = ownerQREs; // Line 38: Officers' wages
    lines[1].calculatedValue = ownerQREs;
    
    // Lines 39-41 are manual entry (radio buttons)
    
    return lines;
  };

  // Update sections with calculations
  const [sectionACalculated, setSectionACalculated] = useState<Form6765Line[]>(sectionA.lines);
  const [sectionBCalculated, setSectionBCalculated] = useState<Form6765Line[]>(sectionB.lines);
  const [sectionCCalculated, setSectionCCalculated] = useState<Form6765Line[]>(sectionC.lines);
  const [sectionDCalculated, setSectionDCalculated] = useState<Form6765Line[]>(sectionD.lines);
  const [sectionECalculated, setSectionECalculated] = useState<Form6765Line[]>(sectionE.lines);

  // Recalculate sections when dependencies change
  useEffect(() => {
    if (sectionA.isVisible) {
      setSectionACalculated(calculateSectionA());
    }
    if (sectionB.isVisible) {
      setSectionBCalculated(calculateSectionB());
    }
    setSectionCCalculated(calculateSectionC());
    setSectionDCalculated(calculateSectionD());
    setSectionECalculated(calculateSectionE());
  }, [sectionF, use280C, sectionA.isVisible, sectionB.isVisible, calculations, activitiesCount, ownerQREs]);

  // Update sections when overrides are loaded
  useEffect(() => {
    if (overrides.length > 0) {
      // Update section C with override values
      const updatedSectionC = sectionC.lines.map(line => ({
        ...line,
        value: getOverrideValue('C', line.lineNumber) ?? line.value
      }));
      setSectionCCalculated(updatedSectionC);

      // Update section D with override values
      const updatedSectionD = sectionD.lines.map(line => ({
        ...line,
        value: getOverrideValue('D', line.lineNumber) ?? line.value
      }));
      setSectionDCalculated(updatedSectionD);

      // Update section E with override values
      const updatedSectionE = sectionE.lines.map(line => ({
        ...line,
        value: getOverrideValue('E', line.lineNumber) ?? line.value
      }));
      setSectionECalculated(updatedSectionE);
    }
  }, [overrides]);

  if (loading) {
    return <div className="form-6765-loading">Loading Form 6765 (2024+)...</div>;
  }

  // Render
  return (
    <div className="form-6765v2024-container">
      <div className="form-6765-header">
        <h2>Form 6765 (2024+) - Credit for Increasing Research Activities</h2>
        <p className="form-6765-subtitle">
          Tax Year: {selectedYear?.year || 'N/A'} | 
          Client: {businessData?.name || 'N/A'}
        </p>
      </div>

      {/* Election Checkboxes */}
      <div className="form-6765-elections" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>Elections</h3>
        
        {/* 280C Election */}
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            id="use280C"
            checked={use280C}
            onChange={(e) => setUse280C(e.target.checked)}
            style={{ marginRight: '10px' }}
          />
          <label htmlFor="use280C" style={{ fontWeight: '500', color: '#374151' }}>
            <strong>A.</strong> Are you electing the reduced credit under section 280C? See instructions.
          </label>
        </div>
        
        {/* Controlled Group Election */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            id="controlledGroup"
            style={{ marginRight: '10px' }}
          />
          <label htmlFor="controlledGroup" style={{ fontWeight: '500', color: '#374151' }}>
            <strong>B.</strong> Are you a member of a controlled group or business under common control?
            If "Yes," complete and attach the required statement. See instructions for required attachment.
          </label>
        </div>
      </div>

      {/* Section F */}
      <div className="form-6765-section" style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#1e293b', 
          borderBottom: '2px solid #3b82f6', 
          paddingBottom: '8px',
          marginBottom: '15px'
        }}>
          Section F—Qualified Research Expenses Summary
        </h3>
        {sectionF.map((line, idx) => (
          <div key={line.lineNumber} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ width: 40, textAlign: 'right', color: '#888', fontWeight: 'bold' }}>{line.lineNumber}</div>
            <div style={{ flex: 1, paddingLeft: 12 }}>{line.label}</div>
            <div style={{ width: 120, textAlign: 'right', fontWeight: 'bold', padding: '0 8px' }}>
              {line.isEditable ? (
                <input
                  type="text"
                  value={maskedInputs[`F-${line.lineNumber}`] || (line.format ? line.format(line.value) : line.value)}
                  onChange={e => {
                    const val = e.target.value;
                    setMaskedInputs(prev => ({ ...prev, [`F-${line.lineNumber}`]: val }));
                  }}
                  onBlur={e => {
                    const val = parseCurrencyInput(e.target.value);
                    const newLines = [...sectionF];
                    newLines[idx].value = val;
                    setSectionF(recalcSectionF(newLines));
                    setMaskedInputs(prev => ({
                      ...prev,
                      [`F-${line.lineNumber}`]: line.format ? line.format(val) : val
                    }));
                  }}
                  style={{ width: 110, textAlign: 'right', fontWeight: 'bold', background: '#f7fbff', border: '1px solid #dbeafe', borderRadius: 4, color: '#222', padding: '0 8px' }}
                />
              ) : (
                line.format ? line.format(line.value) : line.value
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Section A - only show if standard method */}
      {sectionA.isVisible && (
        <div className="form-6765-section" style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#1e293b', 
            borderBottom: '2px solid #3b82f6', 
            paddingBottom: '8px',
            marginBottom: '15px'
          }}>
            {sectionA.title}
          </h3>
          {sectionACalculated.map(line => (
            <div key={line.lineNumber} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 40, textAlign: 'right', color: '#888', fontWeight: 'bold' }}>{line.lineNumber}</div>
              <div style={{ flex: 1, paddingLeft: 12 }}>{line.label}</div>
              <div style={{ width: 120, textAlign: 'right', fontWeight: 'bold', padding: '0 8px' }}>
                {line.isLocked ? (sectionF[6].format ? sectionF[6].format(sectionF[6].value) : sectionF[6].value)
                  : line.isEditable ? (
                    <input 
                      type="text" 
                      value={maskedInputs[`A-${line.lineNumber}`] || (line.format ? line.format(line.value) : line.value)}
                      onChange={e => {
                        const val = e.target.value;
                        setMaskedInputs(prev => ({ ...prev, [`A-${line.lineNumber}`]: val }));
                      }}
                      onBlur={e => {
                        const val = line.lineNumber === 6 ? parsePercentInput(e.target.value) : parseCurrencyInput(e.target.value);
                        handleLineChange('A', line.lineNumber, val);
                        setMaskedInputs(prev => ({
                          ...prev,
                          [`A-${line.lineNumber}`]: line.format ? line.format(val) : val
                        }));
                      }}
                      style={{ width: 110, textAlign: 'right', fontWeight: 'bold', background: '#f7fbff', border: '1px solid #dbeafe', borderRadius: 4, color: '#222', padding: '0 8px' }} 
                    />
                  ) : (line.format ? line.format(line.value) : line.value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section B - only show if ASC method */}
      {sectionB.isVisible && (
        <div className="form-6765-section" style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#1e293b', 
            borderBottom: '2px solid #3b82f6', 
            paddingBottom: '8px',
            marginBottom: '15px'
          }}>
            {sectionB.title}
          </h3>
          {sectionBCalculated.map(line => (
            <div key={line.lineNumber} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 40, textAlign: 'right', color: '#888', fontWeight: 'bold' }}>{line.lineNumber}</div>
              <div style={{ flex: 1, paddingLeft: 12 }}>{line.label}</div>
              <div style={{ width: 120, textAlign: 'right', fontWeight: 'bold', padding: '0 8px' }}>
                {line.isLocked ? (sectionF[6].format ? sectionF[6].format(sectionF[6].value) : sectionF[6].value)
                  : line.isEditable ? (
                    <input 
                      type="text" 
                      value={maskedInputs[`B-${line.lineNumber}`] || (line.format ? line.format(line.value) : line.value)}
                      onChange={e => {
                        const val = e.target.value;
                        setMaskedInputs(prev => ({ ...prev, [`B-${line.lineNumber}`]: val }));
                      }}
                      onBlur={e => {
                        const val = parseCurrencyInput(e.target.value);
                        handleLineChange('B', line.lineNumber, val);
                        setMaskedInputs(prev => ({
                          ...prev,
                          [`B-${line.lineNumber}`]: line.format ? line.format(val) : val
                        }));
                      }}
                      style={{ width: 110, textAlign: 'right', fontWeight: 'bold', background: '#f7fbff', border: '1px solid #dbeafe', borderRadius: 4, color: '#222', padding: '0 8px' }} 
                    />
                  ) : (line.format ? line.format(line.value) : line.value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section C - Current Year Credit */}
      <div className="form-6765-section" style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#1e293b', 
          borderBottom: '2px solid #3b82f6', 
          paddingBottom: '8px',
          marginBottom: '15px'
        }}>
          {sectionC.title}
        </h3>
        {sectionC.isVisible && (
          <div className="form-6765-section-content">
            {sectionCCalculated.map((line, index) => (
              <div key={`${line.lineNumber}-${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ width: 40, textAlign: 'right', color: '#888', fontWeight: 'bold' }}>{line.lineNumber}</div>
                <div style={{ flex: 1, paddingLeft: 12 }}>{line.label}</div>
                <div style={{ width: 120, textAlign: 'right', fontWeight: 'bold', padding: '0 8px' }}>
                  {line.isEditable ? (
                    <input
                      type="text"
                      value={maskedInputs[`C-${line.lineNumber}`] || (line.format ? line.format(line.value) : line.value)}
                      onChange={e => {
                        const val = e.target.value;
                        setMaskedInputs(prev => ({ ...prev, [`C-${line.lineNumber}`]: val }));
                      }}
                      onBlur={e => {
                        const val = parseCurrencyInput(e.target.value);
                        handleLineChange('C', line.lineNumber, val);
                        setMaskedInputs(prev => ({
                          ...prev,
                          [`C-${line.lineNumber}`]: line.format ? line.format(val) : val
                        }));
                      }}
                      style={{ width: 110, textAlign: 'right', fontWeight: 'bold', background: '#f7fbff', border: '1px solid #dbeafe', borderRadius: 4, color: '#222', padding: '0 8px' }}
                    />
                  ) : (
                    line.format ? line.format(line.value) : line.value
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section D - Qualified Small Business Payroll Tax Election and Payroll Tax Credit */}
      <div className="form-6765-section" style={{ marginBottom: '20px' }}>
        {/* Notice above Section D */}
        <div style={{ 
          marginBottom: '15px', 
          padding: '12px', 
          backgroundColor: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          <strong>Notice:</strong> Section D is for qualified small businesses electing the payroll tax credit. 
          This election cannot be taken with the standard credit. The payroll tax credit election applies to 
          qualified small businesses (generally those with average annual gross receipts of $5 million or less 
          for the 3 preceding tax years) and allows the research credit to be used against the employer's 
          portion of Social Security tax (up to $250,000 per year, maximum $500,000 total).
        </div>
        
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#1e293b', 
          borderBottom: '2px solid #3b82f6', 
          paddingBottom: '8px',
          marginBottom: '15px'
        }}>
          {sectionD.title}
        </h3>
        {sectionD.isVisible && (
          <div className="form-6765-section-content">
            {sectionDCalculated.map((line, index) => (
              <div key={`${line.lineNumber}-${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ width: 40, textAlign: 'right', color: '#888', fontWeight: 'bold' }}>{line.lineNumber}</div>
                <div style={{ flex: 1, paddingLeft: 12 }}>
                  {line.label}
                  {line.extra?.type === 'checkbox' && (
                    <div style={{ marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={line.value === 1}
                          onChange={e => {
                            handleLineChange('D', line.lineNumber, e.target.checked ? 1 : 0);
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        <span>Check this box</span>
                      </label>
                    </div>
                  )}
                </div>
                <div style={{ width: 120, textAlign: 'right', fontWeight: 'bold', padding: '0 8px' }}>
                  {line.extra?.type === 'checkbox' ? (
                    <span style={{ color: line.value === 1 ? '#059669' : '#6b7280' }}>
                      {line.value === 1 ? 'Yes' : 'No'}
                    </span>
                  ) : line.isEditable ? (
                    <input
                      type="text"
                      value={maskedInputs[`D-${line.lineNumber}`] || (line.format ? line.format(line.value) : line.value)}
                      onChange={e => {
                        const val = e.target.value;
                        setMaskedInputs(prev => ({ ...prev, [`D-${line.lineNumber}`]: val }));
                      }}
                      onBlur={e => {
                        const val = parseCurrencyInput(e.target.value);
                        handleLineChange('D', line.lineNumber, val);
                        setMaskedInputs(prev => ({
                          ...prev,
                          [`D-${line.lineNumber}`]: line.format ? line.format(val) : val
                        }));
                      }}
                      style={{ width: 110, textAlign: 'right', fontWeight: 'bold', background: '#f7fbff', border: '1px solid #dbeafe', borderRadius: 4, color: '#222', padding: '0 8px' }}
                    />
                  ) : (
                    line.format ? line.format(line.value) : line.value
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section E - Other Information */}
      <div className="form-6765-section" style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#1e293b', 
          borderBottom: '2px solid #3b82f6', 
          paddingBottom: '8px',
          marginBottom: '15px'
        }}>
          {sectionE.title}
        </h3>
        {sectionE.isVisible && (
          <div className="form-6765-section-content">
            {sectionECalculated.map((line, index) => (
              <div key={`${line.lineNumber}-${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ width: 40, textAlign: 'right', color: '#888', fontWeight: 'bold' }}>{line.lineNumber}</div>
                <div style={{ flex: 1, paddingLeft: 12 }}>
                  {line.label}
                  {line.extra?.type === 'radio' && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                          <input
                            type="radio"
                            name={`line${line.lineNumber}`}
                            checked={line.value === 1}
                            onChange={() => handleLineChange('E', line.lineNumber, 1)}
                            style={{ marginRight: '4px' }}
                          />
                          <span>Yes</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                          <input
                            type="radio"
                            name={`line${line.lineNumber}`}
                            checked={line.value === 0}
                            onChange={() => handleLineChange('E', line.lineNumber, 0)}
                            style={{ marginRight: '4px' }}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                  )}
                  {line.extra?.conditional && line.value === 1 && (
                    <div style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ width: 40, textAlign: 'right', color: '#888', fontWeight: 'bold' }}></div>
                        <div style={{ flex: 1, paddingLeft: 12, fontSize: '14px' }}>
                          If "Yes," enter the amount from Appendix C Line 19:
                        </div>
                        <div style={{ width: 120, textAlign: 'right', fontWeight: 'bold', padding: '0 8px' }}>
                          <input
                            type="text"
                            value={maskedInputs[`E-${line.lineNumber}-amount`] || formatCurrency(line.value)}
                            onChange={e => {
                              const val = e.target.value;
                              setMaskedInputs(prev => ({ ...prev, [`E-${line.lineNumber}-amount`]: val }));
                            }}
                            onBlur={e => {
                              const val = parseCurrencyInput(e.target.value);
                              handleLineChange('E', line.lineNumber, val);
                              setMaskedInputs(prev => ({
                                ...prev,
                                [`E-${line.lineNumber}-amount`]: formatCurrency(val)
                              }));
                            }}
                            style={{ width: 110, textAlign: 'right', fontWeight: 'bold', background: '#f7fbff', border: '1px solid #dbeafe', borderRadius: 4, color: '#222', padding: '0 8px' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ width: 120, textAlign: 'right', fontWeight: 'bold', padding: '0 8px' }}>
                  {line.extra?.type === 'radio' ? (
                    <span style={{ color: line.value === 1 ? '#059669' : '#6b7280' }}>
                      {line.value === 1 ? 'Yes' : 'No'}
                    </span>
                  ) : line.isEditable && !line.extra?.conditional ? (
                    <input
                      type="text"
                      value={maskedInputs[`E-${line.lineNumber}`] || (line.format ? line.format(line.value) : line.value)}
                      onChange={e => {
                        const val = e.target.value;
                        setMaskedInputs(prev => ({ ...prev, [`E-${line.lineNumber}`]: val }));
                      }}
                      onBlur={e => {
                        const val = line.lineNumber === 37 ? parseInt(e.target.value) || 0 : parseCurrencyInput(e.target.value);
                        handleLineChange('E', line.lineNumber, val);
                        setMaskedInputs(prev => ({
                          ...prev,
                          [`E-${line.lineNumber}`]: line.format ? line.format(val) : val
                        }));
                      }}
                      style={{ width: 110, textAlign: 'right', fontWeight: 'bold', background: '#f7fbff', border: '1px solid #dbeafe', borderRadius: 4, color: '#222', padding: '0 8px' }}
                    />
                  ) : !line.extra?.conditional ? (
                    line.format ? line.format(line.value) : line.value
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Section G Stub */}
      <div className="form-6765-section" style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#1e293b', 
          borderBottom: '2px solid #3b82f6', 
          paddingBottom: '8px',
          marginBottom: '15px'
        }}>
          {sectionG.title}
        </h3>
        {/* TODO: Implement Section G logic */}
      </div>
    </div>
  );
};

export default Form6765v2024;