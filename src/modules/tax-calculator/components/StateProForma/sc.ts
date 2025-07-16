import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const SC_PROFORMA_LINES = [
  // --- SC Form TC-33 - Research and Development Credit ---
  // Based on actual SC Form TC-33 requirements
  { 
    line: '1', 
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'scQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Average annual gross receipts for the 4 taxable years preceding the credit year', 
    field: 'scAvgGrossReceipts', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    sort_order: 2
  },
  { 
    line: '3', 
    label: 'Fixed-base percentage (3% for most taxpayers)', 
    field: 'scFixedBasePercent', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    default_value: 0.03,
    sort_order: 3
  },
  { 
    line: '4', 
    label: 'Base amount (Line 2 × Line 3)', 
    field: 'scBaseAmount', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.scAvgGrossReceipts || 0) * (data.scFixedBasePercent || 0.03),
    sort_order: 4
  },
  { 
    line: '5', 
    label: 'Incremental qualified research expenses (Line 1 - Line 4)', 
    field: 'scIncrementalQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => Math.max(0, (data.scQRE || 0) - (data.scBaseAmount || 0)),
    sort_order: 5
  },
  { 
    line: '6', 
    label: 'South Carolina R&D credit (Line 5 × 5%)', 
    field: 'scFinalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.scIncrementalQRE || 0) * 0.05,
    sort_order: 6
  }
];

export const scConfig = {
  state: 'SC',
  name: 'South Carolina',
  forms: {
    standard: {
      name: 'SC Form TC-33 - Research and Development Credit',
      method: 'standard',
      lines: SC_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'South Carolina offers a 5% credit on incremental qualified research expenses.',
    'The credit uses the same calculation method as the federal credit.',
    'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.',
    'Available to corporations and pass-through entities.',
    'Credit can be carried forward for up to 15 years.'
  ],
  validationRules: {
    maxCredit: 500000, // $500,000 annual cap
    carryforwardYears: 15,
    minIncrementalQRE: 0,
    maxFixedBasePercent: 0.16, // 16% maximum fixed-base percentage
    requireIncremental: true
  },
  hasAlternativeMethod: false,
  formReference: 'SC Form TC-33',
  creditRate: 0.05,
  creditType: 'incremental'
}; 