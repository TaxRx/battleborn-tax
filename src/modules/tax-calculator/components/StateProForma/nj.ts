import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const NJ_PROFORMA_LINES = [
  // --- NJ Standard Method (Form CBT-100) ---
  { line: '1', label: 'Enter the amount of New Jersey qualified research expenses for the current year.', field: 'njQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average annual gross receipts for the 4 taxable years preceding the credit year.', field: 'njAvgGrossReceipts', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => data.avgGrossReceipts || 0 },
  { line: '3', label: 'Enter the fixed-base percentage (3% for most taxpayers).', field: 'njFixedBasePercent', editable: true, method: 'standard', defaultValue: 3, type: 'percentage' },
  { line: '4', label: 'Multiply Line 2 by Line 3.', field: 'njBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.njAvgGrossReceipts || 0) * ((data.njFixedBasePercent || 3) / 100) },
  { line: '5', label: 'Subtract Line 4 from Line 1. If zero or less, enter zero.', field: 'njIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.njQRE || 0) - (data.njBaseAmount || 0), 0) },
  { line: '6', label: 'Multiply Line 5 by 10% (.10). This is your New Jersey R&D credit.', field: 'njFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.njIncrementalQRE || 0) * 0.10 },
];

export const njConfig = {
  state: 'NJ',
  name: 'New Jersey',
  forms: {
    standard: {
      name: 'NJ Form CBT-100 - Research and Development Credit',
      method: 'standard',
      lines: NJ_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.10,
  creditType: "incremental",
  formReference: "NJ Form CBT-100",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's New Jersey Corporation Business Tax liability"
    },
    {
      type: "carryforward_limit",
      value: 20,
      message: "Unused credits may be carried forward for up to 20 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations only",
      message: "Available only to corporations subject to New Jersey Corporation Business Tax"
    },
    {
      type: "gross_receipts_threshold",
      value: 100000,
      message: "Minimum $100,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form CBT-100 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: March 15",
      message: "Application must be filed by March 15th of the year following the taxable year"
    },
    {
      type: "other",
      value: "Alternative calculation available",
      message: "Alternative calculation available for startup companies with limited gross receipts history"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset New Jersey Corporation Business Tax liability",
    "Research must be conducted in New Jersey to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "New Jersey uses a fixed-base percentage calculation similar to the federal credit",
    "Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate",
    "Credit is 10% of incremental qualified research expenses",
    "New Jersey offers one of the longest carryforward periods at 20 years"
  ]
}; 