import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const OH_PROFORMA_LINES = [
  // --- OH Form IT 1140 - Research and Development Credit ---
  // Based on actual OH Form IT 1140 requirements
  { 
    line: '1', 
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'ohQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    line_type: 'input',
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Average annual gross receipts for the 4 taxable years preceding the credit year', 
    field: 'ohAvgGrossReceipts', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    sort_order: 2
  },
  { 
    line: '3', 
    label: 'Fixed-base percentage (3% for most taxpayers, 16% maximum)', 
    field: 'ohFixedBasePercent', 
    editable: true, 
    method: 'standard', 
    defaultValue: 3, 
    type: 'percentage',
    line_type: 'input',
    sort_order: 3
  },
  { 
    line: '4', 
    label: 'Base amount (Line 2 × Line 3)', 
    field: 'ohBaseAmount', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.ohAvgGrossReceipts || 0) * ((data.ohFixedBasePercent || 3) / 100),
    line_type: 'calculated',
    sort_order: 4
  },
  { 
    line: '5', 
    label: 'Incremental qualified research expenses (Line 1 - Line 4, but not less than zero)', 
    field: 'ohIncrementalQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => Math.max((data.ohQRE || 0) - (data.ohBaseAmount || 0), 0),
    line_type: 'calculated',
    sort_order: 5
  },
  { 
    line: '6', 
    label: 'Ohio R&D credit (Line 5 × 7%)', 
    field: 'ohFinalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.ohIncrementalQRE || 0) * 0.07,
    line_type: 'calculated',
    sort_order: 6
  },
];

export const ohConfig = {
  state: 'OH',
  name: 'Ohio',
  forms: {
    standard: {
      name: 'OH Form IT 1140 - Research and Development Credit',
      method: 'standard',
      lines: OH_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.07,
  creditType: "incremental",
  formReference: "OH Form IT 1140",
  validationRules: [
    {
      type: "max_credit",
      value: 25,
      message: "Credit limited to 25% of the taxpayer's Ohio income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 7,
      message: "Unused credits may be carried forward for up to 7 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations only",
      message: "Available only to corporations subject to Ohio income tax"
    },
    {
      type: "gross_receipts_threshold",
      value: 100000,
      message: "Minimum $100,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form IT 1140 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Ohio income tax liability",
    "Research must be conducted in Ohio to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "Ohio uses a fixed-base percentage calculation similar to the federal credit",
    "Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate",
    "Credit is 7% of incremental qualified research expenses"
  ]
}; 