import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MA_PROFORMA_LINES = [
  // --- MA Standard Method (Form 355M) ---
  { line: '1', label: 'Enter the amount of Massachusetts qualified research expenses for the current year.', field: 'maQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average annual gross receipts for the 4 taxable years preceding the credit year.', field: 'maAvgGrossReceipts', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => data.avgGrossReceipts || 0 },
  { line: '3', label: 'Enter the fixed-base percentage (3% for most taxpayers).', field: 'maFixedBasePercent', editable: true, method: 'standard', defaultValue: 3, type: 'percentage' },
  { line: '4', label: 'Multiply Line 2 by Line 3.', field: 'maBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.maAvgGrossReceipts || 0) * ((data.maFixedBasePercent || 3) / 100) },
  { line: '5', label: 'Subtract Line 4 from Line 1. If zero or less, enter zero.', field: 'maIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.maQRE || 0) - (data.maBaseAmount || 0), 0) },
  { line: '6', label: 'Multiply Line 5 by 10% (.10). This is your Massachusetts R&D credit.', field: 'maFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.maIncrementalQRE || 0) * 0.10 },
];

export const maConfig = {
  state: 'MA',
  name: 'Massachusetts',
  forms: {
    standard: {
      name: 'MA Form 355M - Research and Development Credit',
      method: 'standard',
      lines: MA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.10,
  creditType: "incremental",
  formReference: "MA Form 355M",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's Massachusetts income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 15,
      message: "Unused credits may be carried forward for up to 15 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Massachusetts source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 100000,
      message: "Minimum $100,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 355M and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: March 15",
      message: "Application must be filed by March 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Massachusetts income tax liability",
    "Research must be conducted in Massachusetts to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "Massachusetts uses a fixed-base percentage calculation similar to the federal credit",
    "Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate",
    "Credit is 10% of incremental qualified research expenses"
  ]
}; 