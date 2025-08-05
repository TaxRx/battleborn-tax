import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const NC_PROFORMA_LINES = [
  // --- NC Standard Method (Research and Development Credit) ---
  { line: '1', label: 'Enter the amount of North Carolina qualified research expenses for the current year.', field: 'ncQRE', editable: true, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0), line_type: 'input', sort_order: 1 },
  { line: '2', label: 'Multiply Line 1 by 2.5% (.025). This is your North Carolina R&D credit.', field: 'ncFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.ncQRE || 0) * 0.025, line_type: 'calculated', sort_order: 2 },
];

export const ncConfig = {
  state: 'NC',
  name: 'North Carolina',
  forms: {
    standard: {
      name: 'NC Form CD-401 - Research and Development Credit',
      method: 'standard',
      lines: NC_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.025,
  creditType: "total_qre",
  formReference: "NC-478I Research and Development Credit",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's North Carolina income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with North Carolina source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form CD-401 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset North Carolina income tax liability",
    "Research must be conducted in North Carolina to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for North Carolina - credit is calculated on total QRE",
    "North Carolina offers a 2.5% credit on total qualified research expenses"
  ]
}; 