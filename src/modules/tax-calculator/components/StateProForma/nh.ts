import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const NH_PROFORMA_LINES = [
  // --- NH Form BT-Summary - Research and Development Credit ---
  // Based on actual NH Form BT-Summary requirements
  { 
    line: '1', 
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'nhQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'New Hampshire R&D credit (Line 1 × 2.5%)', 
    field: 'nhFinalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.nhQRE || 0) * 0.025,
    sort_order: 2
  }
];

export const nhConfig = {
  state: 'NH',
  name: 'New Hampshire',
  forms: {
    standard: {
      name: 'NH Form BT-Summary - Research and Development Credit',
      method: 'standard',
      lines: NH_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.025,
  creditType: "total_qre",
  formReference: "NH Form BT-Summary",
  validationRules: [
    {
      type: "max_credit",
      value: 25,
      message: "Credit limited to 25% of the taxpayer's New Hampshire Business Profits Tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with New Hampshire source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form BT-Summary and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: March 15",
      message: "Application must be filed by March 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset New Hampshire Business Profits Tax liability",
    "Research must be conducted in New Hampshire to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for New Hampshire - credit is calculated on total QRE",
    "New Hampshire offers a 2.5% credit on total qualified research expenses"
  ]
}; 