import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const ND_PROFORMA_LINES = [
  // --- ND Standard Method (Form 38) ---
  { line: '1', label: 'Enter the amount of North Dakota qualified research expenses for the current year.', field: 'ndQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average North Dakota QRE for the prior 3 years.', field: 'ndAvgQRE', editable: true, method: 'standard', description: 'If no prior QRE, use current year QRE.' },
  { line: '3', label: 'Subtract Line 2 from Line 1. If less than zero, enter zero.', field: 'ndIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.ndQRE || 0) - (data.ndAvgQRE || 0), 0) },
  { line: '4', label: 'Enter the lesser of Line 3 or $100,000.', field: 'ndFirst100k', editable: false, method: 'standard', calc: (data: any) => Math.min((data.ndIncrementalQRE || 0), 100000) },
  { line: '5', label: 'Subtract Line 4 from Line 3.', field: 'ndExcess', editable: false, method: 'standard', calc: (data: any) => Math.max((data.ndIncrementalQRE || 0) - (data.ndFirst100k || 0), 0) },
  { line: '6', label: 'Multiply Line 4 by 25% (.25).', field: 'ndFirst100kCredit', editable: false, method: 'standard', calc: (data: any) => (data.ndFirst100k || 0) * 0.25 },
  { line: '7', label: 'Multiply Line 5 by 8% (.08).', field: 'ndExcessCredit', editable: false, method: 'standard', calc: (data: any) => (data.ndExcess || 0) * 0.08 },
  { line: '8', label: 'Add Lines 6 and 7. This is your North Dakota R&D credit.', field: 'ndFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.ndFirst100kCredit || 0) + (data.ndExcessCredit || 0) },
];

export const ndConfig = {
  state: 'ND',
  name: 'North Dakota',
  forms: {
    standard: {
      name: 'ND Form 38 - Research and Development Credit',
      method: 'standard',
      lines: ND_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.25,
  creditType: "incremental",
  formReference: "ND Form 38",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's North Dakota income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 15,
      message: "Unused credits may be carried forward for up to 15 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with North Dakota source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 38 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    },
    {
      type: "other",
      value: "Prior year data required",
      message: "Must provide average QRE for the prior 3 years (or use current year if no prior data)"
    },
    {
      type: "other",
      value: "Tiered credit structure",
      message: "25% credit on first $100,000 of incremental QRE, 8% on excess"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset North Dakota income tax liability",
    "Research must be conducted in North Dakota to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "North Dakota offers a 25% credit on the first $100,000 of incremental QRE over the prior 3-year average",
    "8% credit on incremental QRE in excess of $100,000",
    "If no prior QRE, use current year QRE",
    "North Dakota offers one of the longest carryforward periods at 15 years"
  ]
}; 