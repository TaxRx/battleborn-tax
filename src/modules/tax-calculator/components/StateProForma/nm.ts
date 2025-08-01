import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const NM_PROFORMA_LINES = [
  // --- NM Standard Method (Form CIT-1) ---
  { line: '1', label: 'Enter the amount of New Mexico qualified research expenses for the current year.', field: 'nmQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your New Mexico R&D credit.', field: 'nmFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.nmQRE || 0) * 0.05 },
];

export const nmConfig = {
  state: 'NM',
  name: 'New Mexico',
  forms: {
    standard: {
      name: 'NM Form CIT-1 - Research and Development Credit',
      method: 'standard',
      lines: NM_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "NM Form CIT-1",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's New Mexico Corporate Income Tax liability"
    },
    {
      type: "carryforward_limit",
      value: 3,
      message: "Unused credits may be carried forward for up to 3 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with New Mexico source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form CIT-1 and attach Schedule R&D to claim the credit"
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
    "Credit is non-refundable and may only be used to offset New Mexico Corporate Income Tax liability",
    "Research must be conducted in New Mexico to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for New Mexico - credit is calculated on total QRE",
    "Additional 5% credit available for research conducted at qualified research facilities",
    "New Mexico offers one of the shortest carryforward periods at 3 years"
  ]
}; 