import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const DE_PROFORMA_LINES = [
  // --- DE Standard Method (Form 1100) ---
  { line: '1', label: 'Enter the amount of Delaware qualified research expenses for the current year.', field: 'deQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Delaware R&D credit.', field: 'deFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.deQRE || 0) * 0.05 },
];

export const deConfig = {
  state: 'DE',
  name: 'Delaware',
  forms: {
    standard: {
      name: 'DE Form 1100 - Research and Development Credit',
      method: 'standard',
      lines: DE_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "DE Form 1100",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's Delaware income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 10,
      message: "Unused credits may be carried forward for up to 10 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Delaware source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 100000,
      message: "Minimum $100,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 1100 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: March 15",
      message: "Application must be filed by March 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Delaware income tax liability",
    "Research must be conducted in Delaware to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Delaware - credit is calculated on total QRE"
  ]
}; 