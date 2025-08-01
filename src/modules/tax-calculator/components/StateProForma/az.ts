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

export const AZ_PROFORMA_LINES: StateProFormaLine[] = [
  // --- AZ Form 308 - Research and Development Credit ---
  // Based on actual AZ Form 308 requirements
  { 
    line: '1', 
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'azQRE', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Average annual gross receipts for the 4 taxable years preceding the credit year', 
    field: 'azAvgGrossReceipts', 
    editable: true, 
    sort_order: 2
  },
  { 
    line: '3', 
    label: 'Fixed-base percentage (3% for most taxpayers, 16% maximum)', 
    field: 'azFixedBasePercent', 
    editable: true, 
    defaultValue: 3, 
    type: 'percentage',
    sort_order: 3
  },
  { 
    line: '4', 
    label: 'Base amount (Line 2 × Line 3)', 
    field: 'azBaseAmount', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.azAvgGrossReceipts || 0) * ((data.azFixedBasePercent || 3) / 100),
    sort_order: 4
  },
  { 
    line: '5', 
    label: 'Incremental qualified research expenses (Line 1 - Line 4, but not less than zero)', 
    field: 'azIncrementalQRE', 
    editable: false, 
    calc: (data: Record<string, number>) => Math.max((data.azQRE || 0) - (data.azBaseAmount || 0), 0),
    sort_order: 5
  },
  { 
    line: '6', 
    label: 'Arizona R&D credit (Line 5 × 24%)', 
    field: 'azFinalCredit', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.azIncrementalQRE || 0) * 0.24,
    sort_order: 6
  },
];

// Alternative calculation method for Arizona (Simplified Method)
export const AZ_ALTERNATIVE_LINES: StateProFormaLine[] = [
  {
    line: '1',
    label: 'Total qualified research expenses',
    field: 'azAltQRE',
    editable: false,
    calc: (data: Record<string, number>) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  {
    line: '2',
    label: 'Simplified credit (Line 1 × 12%)',
    field: 'azAltCredit',
    editable: false,
    calc: (data: Record<string, number>) => ((data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0)) * 0.12,
    sort_order: 2
  }
];

export const azConfig = {
  forms: {
    standard: {
      name: "Form 308",
      method: "standard",
      lines: AZ_PROFORMA_LINES
    },
    alternative: {
      name: "Form 308 (Alternative)",
      method: "alternative",
      lines: AZ_ALTERNATIVE_LINES
    }
  },
  hasAlternativeMethod: true,
  creditRate: 0.24,
  creditType: "incremental",
  formReference: "AZ Form 308",
  validationRules: [
    {
      type: "max_credit",
      value: 75,
      message: "Credit limited to 75% of the taxpayer's Arizona income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations only",
      message: "Available only to corporations subject to Arizona income tax"
    },
    {
      type: "gross_receipts_threshold",
      value: 500000,
      message: "Minimum $500,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 308 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    },
    {
      type: "other",
      value: "Employment requirement",
      message: "Must maintain employment levels in Arizona to avoid credit recapture"
    }
  ],
  alternativeValidationRules: [
    {
      type: "alternative_method",
      value: "Available",
      message: "Alternative calculation method available using 24% of qualified research expenses"
    },
    {
      type: "max_credit",
      value: 75,
      message: "Alternative method also limited to 75% of Arizona income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused alternative credits may be carried forward for up to 5 years"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Arizona income tax liability",
    "Research must be conducted in Arizona to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "The credit is subject to recapture if the taxpayer fails to maintain the required employment levels",
    "Arizona offers one of the highest R&D credit rates in the nation at 24%"
  ]
}; 