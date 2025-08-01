import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const ME_PROFORMA_LINES = [
  // --- ME Standard Method (Form 1120ME) ---
  { line: '1', label: 'Enter the amount of Maine qualified research expenses for the current year.', field: 'meQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Maine R&D credit.', field: 'meFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.meQRE || 0) * 0.05 },
];

export const meConfig = {
  state: 'ME',
  name: 'Maine',
  forms: {
    standard: {
      name: 'ME Form 1120ME - Research and Development Credit',
      method: 'standard',
      lines: ME_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "ME Form 1120ME",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Maine income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 10,
      message: "Unused credits may be carried forward for up to 10 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Maine source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 1120ME and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Maine income tax liability",
    "Research must be conducted in Maine to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Maine - credit is calculated on total QRE"
  ]
}; 