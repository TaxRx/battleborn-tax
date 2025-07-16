import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MD_PROFORMA_LINES = [
  // --- MD Standard Method (Form 500CR) ---
  { line: '1', label: 'Enter the amount of Maryland qualified research expenses for the current year.', field: 'mdQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 3% (.03). This is your Maryland R&D credit.', field: 'mdFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.mdQRE || 0) * 0.03 },
];

export const mdConfig = {
  state: 'MD',
  name: 'Maryland',
  forms: {
    standard: {
      name: 'MD Form 500CR - Research and Development Credit',
      method: 'standard',
      lines: MD_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.03,
  creditType: "total_qre",
  formReference: "MD Form 500CR",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Maryland income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 10,
      message: "Unused credits may be carried forward for up to 10 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Maryland source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 500CR and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Maryland income tax liability",
    "Research must be conducted in Maryland to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Maryland - credit is calculated on total QRE"
  ]
}; 