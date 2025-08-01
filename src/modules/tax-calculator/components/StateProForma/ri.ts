import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const RI_PROFORMA_LINES = [
  // --- RI Standard Method (Form RI-1120C) ---
  { line: '1', label: 'Enter the amount of Rhode Island qualified research expenses for the current year.', field: 'riQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Rhode Island R&D credit.', field: 'riFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.riQRE || 0) * 0.05 },
];

export const riConfig = {
  state: 'RI',
  name: 'Rhode Island',
  forms: {
    standard: {
      name: 'RI Form RI-1120C - Research and Development Credit',
      method: 'standard',
      lines: RI_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "RI Form RI-1120C",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's Rhode Island Corporate Income Tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Rhode Island source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form RI-1120C and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: March 15",
      message: "Application must be filed by March 15th of the year following the taxable year"
    },
    {
      type: "other",
      value: "Additional credit available",
      message: "Additional 5% credit available for research conducted at qualified research facilities"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Rhode Island Corporate Income Tax liability",
    "Research must be conducted in Rhode Island to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Rhode Island - credit is calculated on total QRE",
    "Additional 5% credit available for research conducted at qualified research facilities"
  ]
}; 