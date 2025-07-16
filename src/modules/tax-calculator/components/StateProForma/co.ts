import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const CO_PROFORMA_LINES = [
  // --- CO Standard Method (Form DR 0097) ---
  { line: '1', label: 'Enter the amount of Colorado qualified research expenses for the current year.', field: 'coQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 3% (.03). This is your Colorado R&D credit.', field: 'coFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.coQRE || 0) * 0.03 },
];

export const coConfig = {
  state: 'CO',
  name: 'Colorado',
  forms: {
    standard: {
      name: 'CO Form DR 0097 - Research and Development Credit',
      method: 'standard',
      lines: CO_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.03,
  creditType: "total_qre",
  formReference: "CO Form DR 0097",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Colorado income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Colorado source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form DR 0097 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    },
    {
      type: "other",
      value: "Pre-certification required",
      message: "Pre-certification with local Enterprise Zone Administrator may be required"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Colorado income tax liability",
    "Research must be conducted in Colorado to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "Pre-certification with local Enterprise Zone Administrator may be required",
    "No base calculation is required for Colorado - credit is calculated on total QRE"
  ]
}; 