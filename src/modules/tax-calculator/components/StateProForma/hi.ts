import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const HI_PROFORMA_LINES = [
  // --- HI Standard Method (Form N-11) ---
  { line: '1', label: 'Enter the amount of Hawaii qualified research expenses for the current year.', field: 'hiQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Hawaii R&D credit.', field: 'hiFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.hiQRE || 0) * 0.05 },
];

export const hiConfig = {
  state: 'HI',
  name: 'Hawaii',
  forms: {
    standard: {
      name: 'HI Form N-11 - Research and Development Credit',
      method: 'standard',
      lines: HI_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "HI Form N-11",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Hawaii income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Hawaii source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form N-11 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 20",
      message: "Application must be filed by April 20th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Hawaii income tax liability",
    "Research must be conducted in Hawaii to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Hawaii - credit is calculated on total QRE"
  ]
}; 