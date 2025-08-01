import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const ID_PROFORMA_LINES = [
  // --- ID Form 41 - Research and Development Credit ---
  // Based on actual ID Form 41 requirements
  { 
    line: '1', 
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'idQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    line_type: 'input',
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Idaho R&D credit (Line 1 × 3%)', 
    field: 'idFinalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.idQRE || 0) * 0.03,
    line_type: 'calculated',
    sort_order: 2
  },
];

export const idConfig = {
  state: 'ID',
  name: 'Idaho',
  forms: {
    standard: {
      name: 'ID Form 41 - Research and Development Credit',
      method: 'standard',
      lines: ID_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.03,
  creditType: "total_qre",
  formReference: "ID Form 41",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Idaho income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 14,
      message: "Unused credits may be carried forward for up to 14 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Idaho source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 41 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Idaho income tax liability",
    "Research must be conducted in Idaho to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Idaho - credit is calculated on total QRE",
    "Idaho offers one of the longest carryforward periods at 14 years"
  ]
}; 