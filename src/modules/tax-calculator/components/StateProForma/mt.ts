import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MT_PROFORMA_LINES = [
  // --- MT Standard Method (Form CIT-CR) ---
  { line: '1', label: 'Enter the amount of Montana qualified research expenses for the current year.', field: 'mtQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average Montana QRE for the prior 3 years.', field: 'mtAvgQRE', editable: true, method: 'standard', description: 'If no prior QRE, use current year QRE.' },
  { line: '3', label: 'Subtract Line 2 from Line 1. If less than zero, enter zero.', field: 'mtIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.mtQRE || 0) - (data.mtAvgQRE || 0), 0) },
  { line: '4', label: 'Multiply Line 3 by 5% (.05).', field: 'mtCreditRaw', editable: false, method: 'standard', calc: (data: any) => (data.mtIncrementalQRE || 0) * 0.05 },
  { line: '5', label: 'Enter the lesser of Line 4 or $500,000. This is your Montana R&D credit.', field: 'mtFinalCredit', editable: false, method: 'standard', calc: (data: any) => Math.min((data.mtCreditRaw || 0), 500000) },
];

export const mtConfig = {
  state: 'MT',
  name: 'Montana',
  forms: {
    standard: {
      name: 'MT Form CIT-CR - Research and Development Credit',
      method: 'standard',
      lines: MT_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "incremental",
  formReference: "MT Form CIT-CR",
  validationRules: [
    {
      type: "max_credit",
      value: 500000,
      message: "Credit capped at $500,000 per year"
    },
    {
      type: "carryforward_limit",
      value: 15,
      message: "Unused credits may be carried forward for up to 15 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Montana source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form CIT-CR and attach Schedule R&D to claim the credit"
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
    "Credit is non-refundable and may only be used to offset Montana income tax liability",
    "Research must be conducted in Montana to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "Montana offers a 5% credit on the increase in QRE over the average of the prior 3 years",
    "If no prior QRE, use current year QRE",
    "Credit is capped at $500,000 per year",
    "Montana offers one of the longest carryforward periods at 15 years"
  ]
}; 