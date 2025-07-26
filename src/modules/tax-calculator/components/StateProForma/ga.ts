import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const GA_PROFORMA_LINES = [
  // --- GA Form IT-RD - Research and Development Credit ---
  // Based on actual GA Form IT-RD requirements
  
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
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'gaQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    line_type: 'calculated',
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Average annual gross receipts for the 4 taxable years preceding the credit year', 
    field: 'gaAvgGrossReceipts', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    sort_order: 2
  },
  { 
    line: '3', 
    label: 'Fixed-base percentage (3% for most taxpayers, 16% maximum)', 
    field: 'gaFixedBasePercent', 
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
    field: 'gaBaseAmount', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.gaAvgGrossReceipts || 0) * ((data.gaFixedBasePercent || 3) / 100),
    line_type: 'calculated',
    sort_order: 4
  },
  { 
    line: '5', 
    label: 'Incremental qualified research expenses (Line 1 - Line 4, but not less than zero)', 
    field: 'gaIncrementalQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => Math.max((data.gaQRE || 0) - (data.gaBaseAmount || 0), 0),
    line_type: 'calculated',
    sort_order: 5
  },
  { 
    line: '6', 
    label: 'Georgia R&D credit (Line 5 × 10%)', 
    field: 'gaFinalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.gaIncrementalQRE || 0) * 0.10,
    line_type: 'calculated',
    sort_order: 6
  },
];

export const gaConfig = {
  state: 'GA',
  name: 'Georgia',
  forms: {
    standard: {
      name: 'GA Form IT-RD - Research and Development Credit',
      method: 'standard',
      lines: GA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.10,
  creditType: "incremental",
  formReference: "GA Form IT-RD",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's Georgia income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 10,
      message: "Unused credits may be carried forward for up to 10 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Georgia source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 100000,
      message: "Minimum $100,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form IT-RD and attach detailed schedule to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Georgia income tax liability",
    "Research must be conducted in Georgia to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "Georgia uses a fixed-base percentage calculation similar to the federal credit",
    "Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate",
    "Credit is 10% of incremental qualified research expenses"
  ]
}; 