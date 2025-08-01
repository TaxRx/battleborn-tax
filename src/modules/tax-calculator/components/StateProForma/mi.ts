import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MI_PROFORMA_LINES = [
  // --- MI Standard Method (Form 4300) ---
  { line: '1', label: 'Enter the amount of Michigan qualified research expenses for the current year.', field: 'miQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 3.9% (.039). This is your Michigan R&D credit.', field: 'miFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.miQRE || 0) * 0.039 },
];

export const miConfig = {
  state: 'MI',
  name: 'Michigan',
  forms: {
    standard: {
      name: 'MI Form 4300 - Research and Development Credit',
      method: 'standard',
      lines: MI_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.039,
  creditType: "total_qre",
  formReference: "MI Form 4300",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Michigan income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 10,
      message: "Unused credits may be carried forward for up to 10 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Michigan source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 4300 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Michigan income tax liability",
    "Research must be conducted in Michigan to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Michigan - credit is calculated on total QRE",
    "Michigan offers a unique 3.9% credit rate"
  ]
}; 