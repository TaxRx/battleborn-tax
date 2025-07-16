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

export const NY_PROFORMA_LINES: StateProFormaLine[] = [
  // --- NY Form CT-3 - Research and Development Credit ---
  // Based on actual NY Form CT-3 requirements
  { 
    line: '1', 
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'nyQRE', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Average annual gross receipts for the 4 taxable years preceding the credit year', 
    field: 'nyAvgGrossReceipts', 
    editable: true, 
    sort_order: 2
  },
  { 
    line: '3', 
    label: 'Fixed-base percentage (3% for most taxpayers, 16% maximum)', 
    field: 'nyFixedBasePercent', 
    editable: true, 
    defaultValue: 3, 
    type: 'percentage',
    sort_order: 3
  },
  { 
    line: '4', 
    label: 'Base amount (Line 2 × Line 3)', 
    field: 'nyBaseAmount', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.nyAvgGrossReceipts || 0) * ((data.nyFixedBasePercent || 3) / 100),
    sort_order: 4
  },
  { 
    line: '5', 
    label: 'Incremental qualified research expenses (Line 1 - Line 4, but not less than zero)', 
    field: 'nyIncrementalQRE', 
    editable: false, 
    calc: (data: Record<string, number>) => Math.max((data.nyQRE || 0) - (data.nyBaseAmount || 0), 0),
    sort_order: 5
  },
  { 
    line: '6', 
    label: 'New York R&D credit (Line 5 × 9%)', 
    field: 'nyFinalCredit', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.nyIncrementalQRE || 0) * 0.09,
    sort_order: 6
  },
];

// Alternative calculation method for New York (Startup Method)
export const NY_ALTERNATIVE_LINES: StateProFormaLine[] = [
  {
    line: '1',
    label: 'Total qualified research expenses',
    field: 'nyAltQRE',
    editable: false,
    calc: (data: Record<string, number>) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  {
    line: '2',
    label: 'Startup credit (Line 1 × 4.5%)',
    field: 'nyAltCredit',
    editable: false,
    calc: (data: Record<string, number>) => ((data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0)) * 0.045,
    sort_order: 2
  }
];

export const nyConfig = {
  forms: {
    standard: {
      name: "Form CT-41",
      method: "standard",
      lines: NY_PROFORMA_LINES
    },
    alternative: {
      name: "Form CT-41 (Alternative)",
      method: "alternative",
      lines: NY_ALTERNATIVE_LINES
    }
  },
  hasAlternativeMethod: true,
  creditRate: 0.09,
  creditType: "incremental",
  formReference: "NY Form CT-41",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's New York State income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 15,
      message: "Unused credits may be carried forward for up to 15 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with New York source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 1000000,
      message: "Minimum $1 million in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form CT-41 and attach Schedule A to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: March 15",
      message: "Application must be filed by March 15th of the year following the taxable year"
    },
    {
      type: "other",
      value: "Employment requirement",
      message: "Must maintain employment levels in New York State to avoid credit recapture"
    }
  ],
  alternativeValidationRules: [
    {
      type: "alternative_method",
      value: "Available",
      message: "Alternative calculation method available using 9% of qualified research expenses"
    },
    {
      type: "max_credit",
      value: 50,
      message: "Alternative method also limited to 50% of New York State income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 15,
      message: "Unused alternative credits may be carried forward for up to 15 years"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset New York State income tax liability",
    "Research must be conducted in New York State to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "The credit is subject to recapture if the taxpayer fails to maintain the required employment levels",
    "Partnerships must allocate the credit among partners based on their ownership percentages"
  ]
}; 