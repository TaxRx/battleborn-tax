import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const NE_PROFORMA_LINES = [
  // --- NE Standard Method (Form 3800N) ---
  { line: '1', label: 'Enter the amount of Nebraska qualified research expenses for the current year.', field: 'neQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average Nebraska QRE for the prior 2 years.', field: 'neAvgQRE', editable: true, method: 'standard', description: 'If no prior QRE, use current year QRE.' },
  { line: '3', label: 'Subtract Line 2 from Line 1. If less than zero, enter zero.', field: 'neIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.neQRE || 0) - (data.neAvgQRE || 0), 0) },
  { line: '4', label: 'Multiply Line 3 by 15% (.15).', field: 'neCreditStandard', editable: false, method: 'standard', calc: (data: any) => (data.neIncrementalQRE || 0) * 0.15 },
  { line: '5', label: 'Multiply Line 3 by 21% (.21) if in an enterprise zone.', field: 'neCreditEnterprise', editable: false, method: 'standard', calc: (data: any) => (data.neIncrementalQRE || 0) * 0.21 },
];

export const neConfig = {
  state: 'NE',
  name: 'Nebraska',
  forms: {
    standard: {
      name: 'NE Form 3800N - Research and Development Credit',
      method: 'standard',
      lines: NE_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.15,
  creditType: "incremental",
  formReference: "NE Form 3800N",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Nebraska income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 5,
      message: "Unused credits may be carried forward for up to 5 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations and partnerships",
      message: "Available to corporations and partnerships with Nebraska source income"
    },
    {
      type: "gross_receipts_threshold",
      value: 50000,
      message: "Minimum $50,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 3800N and attach Schedule R&D to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    },
    {
      type: "other",
      value: "Prior year data required",
      message: "Must provide average QRE for the prior 2 years (or use current year if no prior data)"
    },
    {
      type: "other",
      value: "Enterprise zone bonus",
      message: "21% credit rate available if research is conducted in an enterprise zone"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Nebraska income tax liability",
    "Research must be conducted in Nebraska to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "Nebraska offers a 15% credit on the increase in QRE over the base amount (average of prior 2 years)",
    "21% credit rate available if research is conducted in an enterprise zone",
    "If no prior QRE, use current year QRE"
  ]
}; 