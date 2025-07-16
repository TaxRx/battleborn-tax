import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MO_PROFORMA_LINES = [
  // --- MO Standard Method (Form MO-TC) ---
  { line: '1', label: 'Enter the amount of Missouri qualified research expenses for the current year.', field: 'moQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average Missouri QRE for the prior 3 years.', field: 'moAvgQRE', editable: true, method: 'standard', description: 'If no prior QRE, use current year QRE.' },
  { line: '3', label: 'Subtract Line 2 from Line 1. If less than zero, enter zero.', field: 'moIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.moQRE || 0) - (data.moAvgQRE || 0), 0) },
  { line: '4', label: 'Multiply Line 3 by 6.5% (.065).', field: 'moCreditRaw', editable: false, method: 'standard', calc: (data: any) => (data.moIncrementalQRE || 0) * 0.065 },
  { line: '5', label: 'Enter the lesser of Line 4 or $300,000. This is your Missouri R&D credit.', field: 'moFinalCredit', editable: false, method: 'standard', calc: (data: any) => Math.min((data.moCreditRaw || 0), 300000) },
];

export const moConfig = {
  state: 'MO',
  name: 'Missouri',
  forms: {
    standard: {
      name: 'MO Form MO-TC - Research and Development Credit',
      method: 'standard',
      lines: MO_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.065,
  creditType: "incremental",
  formReference: "MO Form MO-TC",
  validationRules: [
    {
      type: "max_credit",
      value: 300000,
      message: "Credit capped at $300,000 per year"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Missouri source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form MO-TC and attach Schedule R&D to claim the credit"
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
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Missouri income tax liability",
    "Research must be conducted in Missouri to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "Missouri offers a 6.5% credit on the increase in QRE over the average of the prior 3 years",
    "If no prior QRE, use current year QRE",
    "Credit is capped at $300,000 per year"
  ]
}; 