import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MS_PROFORMA_LINES = [
  // --- MS Standard Method (Form 83-105) ---
  { line: '1', label: 'Enter the amount of Mississippi qualified research expenses for the current year.', field: 'msQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Mississippi R&D credit.', field: 'msFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.msQRE || 0) * 0.05 },
];

export const msConfig = {
  state: 'MS',
  name: 'Mississippi',
  forms: {
    standard: {
      name: 'MS Form 83-105 - Research and Development Credit',
      method: 'standard',
      lines: MS_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.05,
  creditType: "total_qre",
  formReference: "MS Form 83-105",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Mississippi income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Mississippi source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 83-105 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Mississippi income tax liability",
    "Research must be conducted in Mississippi to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Mississippi - credit is calculated on total QRE"
  ]
}; 