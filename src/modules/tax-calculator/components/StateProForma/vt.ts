import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const VT_PROFORMA_LINES = [
  // --- VT Standard Method (Form CO-411) ---
  { line: '1', label: 'Enter the amount of Vermont qualified research expenses for the current year.', field: 'vtQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Vermont R&D credit.', field: 'vtFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.vtQRE || 0) * 0.05 },
];

export const vtConfig = {
  state: 'VT',
  name: 'Vermont',
  forms: {
    standard: {
      name: 'VT Form CO-411 - Research and Development Credit',
      method: 'standard',
      lines: VT_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "VT Form CO-411",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Vermont income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 10,
      message: "Unused credits may be carried forward for up to 10 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Vermont source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form CO-411 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Vermont income tax liability",
    "Research must be conducted in Vermont to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Vermont - credit is calculated on total QRE",
    "Vermont offers a 5% credit on total qualified research expenses"
  ]
}; 