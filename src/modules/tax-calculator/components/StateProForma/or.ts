import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const OR_PROFORMA_LINES = [
  // --- OR Standard Method (Form 20) ---
  { line: '1', label: 'Enter the amount of Oregon qualified research expenses for the current year.', field: 'orQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Oregon R&D credit.', field: 'orFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.orQRE || 0) * 0.05 },
];

export const orConfig = {
  state: 'OR',
  name: 'Oregon',
  forms: {
    standard: {
      name: 'OR Form 20 - Research and Development Credit',
      method: 'standard',
      lines: OR_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "OR Form 20",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's Oregon Corporate Excise Tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Oregon source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 20 and attach Schedule R&D to claim the credit"
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
    "Credit is non-refundable and may only be used to offset Oregon Corporate Excise Tax liability",
    "Research must be conducted in Oregon to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Oregon - credit is calculated on total QRE",
    "Additional 5% credit available for research conducted at qualified research facilities"
  ]
}; 