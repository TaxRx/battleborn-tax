import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const PA_PROFORMA_LINES = [
  // --- PA Standard Method (Form RCT-101) ---
  { line: '1', label: 'Enter the amount of Pennsylvania qualified research expenses for the current year.', field: 'paQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average annual gross receipts for the 4 taxable years preceding the credit year.', field: 'paAvgGrossReceipts', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => data.avgGrossReceipts || 0 },
  { line: '3', label: 'Enter the fixed-base percentage (3% for most taxpayers).', field: 'paFixedBasePercent', editable: true, method: 'standard', defaultValue: 3, type: 'percentage' },
  { line: '4', label: 'Multiply Line 2 by Line 3.', field: 'paBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.paAvgGrossReceipts || 0) * ((data.paFixedBasePercent || 3) / 100) },
  { line: '5', label: 'Subtract Line 4 from Line 1. If zero or less, enter zero.', field: 'paIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.paQRE || 0) - (data.paBaseAmount || 0), 0) },
  { line: '6', label: 'Multiply Line 5 by 10% (.10). This is your Pennsylvania R&D credit.', field: 'paFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.paIncrementalQRE || 0) * 0.10 },
];

export const paConfig = {
  state: 'PA',
  name: 'Pennsylvania',
  forms: {
    standard: {
      name: 'PA Form RCT-101 - Research and Development Credit',
      method: 'standard',
      lines: PA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.10,
  creditType: "incremental",
  formReference: "PA Form RCT-101",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's Pennsylvania Corporate Net Income Tax liability"
    },
    {
      type: "carryforward_limit",
      value: 15,
      message: "Unused credits may be carried forward for up to 15 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Pennsylvania source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 100000,
      message: "Minimum $100,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form RCT-101 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Pennsylvania Corporate Net Income Tax liability",
    "Research must be conducted in Pennsylvania to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "Pennsylvania uses a fixed-base percentage calculation similar to the federal credit",
    "Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate",
    "Credit is 10% of incremental qualified research expenses",
    "Pennsylvania offers one of the longest carryforward periods at 15 years"
  ]
}; 