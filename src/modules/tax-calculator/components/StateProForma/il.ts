import { StateCreditBaseData } from '../../services/stateCreditDataService';

export interface StateProFormaLine {
  line: string;
  label: string;
  field: string;
  editable: boolean;
  calc?: (data: Record<string, number>) => number;
  defaultValue?: number;
  type?: 'currency' | 'percentage' | 'yesno';
  description?: string;
  sort_order?: number;
}

export const IL_PROFORMA_LINES: StateProFormaLine[] = [
  // --- IL Schedule 1299-D - Income Tax Credits (for corporations) ---
  // Based on actual Schedule 1299-D requirements
  
  // Auto-populate from QRE data using standard field names
  { 
    line: 'wages', 
    label: 'Qualified wages', 
    field: 'wages', 
    editable: true, 
    method: 'standard',
    sort_order: 0.1
  },
  { 
    line: 'supplies', 
    label: 'Qualified supplies', 
    field: 'supplies', 
    editable: true, 
    method: 'standard',
    sort_order: 0.2
  },
  { 
    line: 'contract', 
    label: 'Contract research', 
    field: 'contractResearch', 
    editable: true, 
    method: 'standard',
    sort_order: 0.3
  },
  { 
    line: '1', 
    label: 'Illinois qualified research expenses for current year', 
    field: 'ilCurrentYearQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Average annual gross receipts for the 4 taxable years preceding the credit year', 
    field: 'ilAvgGrossReceipts', 
    editable: true, 
    sort_order: 2
  },
  { 
    line: '3', 
    label: 'Fixed-base percentage (3% for most taxpayers, 16% maximum)', 
    field: 'ilFixedBasePercent', 
    editable: true, 
    defaultValue: 3, 
    type: 'percentage',
    sort_order: 3
  },
  { 
    line: '4', 
    label: 'Base amount (Line 2 × Line 3)', 
    field: 'ilBaseAmount', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.ilAvgGrossReceipts || 0) * ((data.ilFixedBasePercent || 3) / 100),
    sort_order: 4
  },
  { 
    line: '5', 
    label: 'Incremental qualified research expenses (Line 1 - Line 4, but not less than zero)', 
    field: 'ilIncrementalQRE', 
    editable: false, 
    calc: (data: Record<string, number>) => Math.max((data.ilQRE || 0) - (data.ilBaseAmount || 0), 0),
    sort_order: 5
  },
  { 
    line: '6', 
    label: 'Illinois R&D credit (Line 5 × 6.5%)', 
    field: 'ilFinalCredit', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.ilIncrementalQRE || 0) * 0.065,
    sort_order: 6
  },
];

// Alternative calculation method for Illinois (Simplified Method)
export const IL_ALTERNATIVE_LINES: StateProFormaLine[] = [
  {
    line: '1',
    label: 'Total qualified research expenses',
    field: 'ilAltQRE',
    editable: false,
    calc: (data: Record<string, number>) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  {
    line: '2',
    label: 'Simplified credit (Line 1 × 3.25%)',
    field: 'ilAltCredit',
    editable: false,
    calc: (data: Record<string, number>) => ((data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0)) * 0.0325,
    sort_order: 2
  }
];

export const ilConfig = {
  forms: {
    standard: {
      name: "Schedule 1299-D - Income Tax Credits (for corporations)",
      method: "standard",
      lines: [
        // ... existing lines ...
      ]
    },
    alternative: {
      name: "Schedule 1299-D (Alternative Method)",
      method: "alternative", 
      lines: [
        // ... existing lines ...
      ]
    }
  },
  hasAlternativeMethod: true,
  creditRate: 0.065,
  creditType: "incremental",
  formReference: "IL Schedule 1299-D (Credit Code 5340)",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's Illinois income tax liability for the taxable year"
    },
    {
      type: "carryforward_limit", 
      value: 12,
      message: "Unused credits may be carried forward for up to 12 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations only",
      message: "Available only to corporations subject to Illinois income tax"
    },
    {
      type: "gross_receipts_threshold",
      value: 1000000,
      message: "Minimum $1 million in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form IL-1120 and attach Schedule RD to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  alternativeValidationRules: [
    {
      type: "alternative_method",
      value: "Available",
      message: "Alternative calculation method available using 6.5% of qualified research expenses"
    },
    {
      type: "max_credit",
      value: 50,
      message: "Alternative method also limited to 50% of Illinois income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 12,
      message: "Unused alternative credits may be carried forward for up to 12 years"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Illinois income tax liability",
    "Research must be conducted in Illinois to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "The credit is subject to recapture if the taxpayer fails to maintain the required employment levels"
  ]
}; 