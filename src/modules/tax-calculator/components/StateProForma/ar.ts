import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const AR_PROFORMA_LINES = [
  // --- AR Standard Method (Form AR1100CT) ---
  { line: '1', label: 'Enter the amount of Arkansas qualified research expenses for the current year.', field: 'arQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 20% (.20). This is your Arkansas R&D credit.', field: 'arFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.arQRE || 0) * 0.20 },
];

export const arConfig = {
  state: 'AR',
  name: 'Arkansas',
  forms: {
    standard: {
      name: 'AR Form AR1100CT - Research and Development Credit',
      method: 'standard',
      lines: AR_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.20,
  creditType: "total_qre",
  formReference: "AR Form AR1100CT",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's Arkansas income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 10,
      message: "Unused credits may be carried forward for up to 10 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Arkansas source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 100000,
      message: "Minimum $100,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form AR1100CT and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Arkansas income tax liability",
    "Research must be conducted in Arkansas to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "Arkansas offers one of the highest state R&D credit rates at 20%",
    "No base calculation is required for Arkansas - credit is calculated on total QRE"
  ]
}; 