import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const WA_PROFORMA_LINES = [
  // --- WA Standard Method (Form 40) ---
  { line: '1', label: 'Enter the amount of Washington qualified research expenses for the current year.', field: 'waQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 2.5% (.025). This is your Washington R&D credit.', field: 'waFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.waQRE || 0) * 0.025 },
];

export const waConfig = {
  state: 'WA',
  name: 'Washington',
  forms: {
    standard: {
      name: 'WA Form 40 - Research and Development Credit',
      method: 'standard',
      lines: WA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.025,
  creditType: "total_qre",
  formReference: "WA Form 40",
  validationRules: [
    {
      type: "max_credit",
      value: 2000000,
      message: "Credit capped at $2 million per taxpayer per year"
    },
    {
      type: "carryforward_limit",
      value: 7,
      message: "Unused credits may be carried forward for up to 7 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Washington source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 40 and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Washington Business and Occupation Tax liability",
    "Research must be conducted in Washington to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "No base calculation is required for Washington - credit is calculated on total QRE",
    "Washington offers a 2.5% credit on total qualified research expenses",
    "Credit is capped at $2 million per taxpayer per year"
  ]
}; 