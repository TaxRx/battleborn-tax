import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const OK_PROFORMA_LINES = [
  // --- OK Standard Method (Form 512) ---
  { line: '1', label: 'Enter the amount of Oklahoma qualified research expenses for the current year.', field: 'okQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Oklahoma R&D credit.', field: 'okFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.okQRE || 0) * 0.05 },
];

export const okConfig = {
  state: 'OK',
  name: 'Oklahoma',
  forms: {
    standard: {
      name: 'OK Form 512 - Research and Development Credit',
      method: 'standard',
      lines: OK_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "OK Form 512",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's Oklahoma Corporate Income Tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Oklahoma source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 512 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    },
    {
      type: "other",
      value: "Additional credit available",
      message: "Additional 5% credit available for research conducted at qualified research facilities"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Oklahoma Corporate Income Tax liability",
    "Research must be conducted in Oklahoma to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Oklahoma - credit is calculated on total QRE",
    "Additional 5% credit available for research conducted at qualified research facilities"
  ]
}; 