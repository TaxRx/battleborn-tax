import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const UT_PROFORMA_LINES = [
  // --- UT Form TC-20 - Research and Development Credit ---
  // Based on actual UT Form TC-20 requirements
  { 
    line: '1', 
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'utQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    line_type: 'input',
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Utah R&D credit (Line 1 × 5%)', 
    field: 'utFinalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.utQRE || 0) * 0.05,
    line_type: 'calculated',
    sort_order: 2
  },
];

export const utConfig = {
  state: 'UT',
  name: 'Utah',
  forms: {
    standard: {
      name: 'UT Form TC-20 - Research and Development Credit',
      method: 'standard',
      lines: UT_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "UT Form TC-20",
  validationRules: [
    {
      type: "max_credit",
      value: 75,
      message: "Credit limited to 75% of the taxpayer's Utah income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Utah source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form TC-20 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Utah income tax liability",
    "Research must be conducted in Utah to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Utah - credit is calculated on total QRE",
    "Utah offers a 5% credit on total qualified research expenses"
  ]
}; 