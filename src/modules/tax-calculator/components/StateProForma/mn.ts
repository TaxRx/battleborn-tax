import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MN_PROFORMA_LINES = [
  // --- MN Standard Method (Form M4) ---
  { line: '1', label: 'Enter the amount of Minnesota qualified research expenses for the current year.', field: 'mnQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Minnesota R&D credit.', field: 'mnFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.mnQRE || 0) * 0.05 },
];

export const mnConfig = {
  state: 'MN',
  name: 'Minnesota',
  forms: {
    standard: {
      name: 'MN Form M4 - Research and Development Credit',
      method: 'standard',
      lines: MN_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "MN Form M4",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Minnesota income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 15,
      message: "Unused credits may be carried forward for up to 15 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Minnesota source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form M4 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Minnesota income tax liability",
    "Research must be conducted in Minnesota to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Minnesota - credit is calculated on total QRE",
    "Minnesota offers one of the longest carryforward periods at 15 years"
  ]
}; 