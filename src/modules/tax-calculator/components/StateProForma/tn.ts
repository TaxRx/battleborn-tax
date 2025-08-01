import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const TN_PROFORMA_LINES = [
  // --- TN Form FAE 170 - Research and Development Credit ---
  // Based on actual TN Form FAE 170 requirements
  { 
    line: '1', 
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'tnQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Average annual gross receipts for the 4 taxable years preceding the credit year', 
    field: 'tnAvgGrossReceipts', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    sort_order: 2
  },
  { 
    line: '3', 
    label: 'Fixed-base percentage (3% for most taxpayers)', 
    field: 'tnFixedBasePercent', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    default_value: 0.03,
    sort_order: 3
  },
  { 
    line: '4', 
    label: 'Base amount (Line 2 × Line 3)', 
    field: 'tnBaseAmount', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.tnAvgGrossReceipts || 0) * (data.tnFixedBasePercent || 0.03),
    sort_order: 4
  },
  { 
    line: '5', 
    label: 'Incremental qualified research expenses (Line 1 - Line 4)', 
    field: 'tnIncrementalQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => Math.max(0, (data.tnQRE || 0) - (data.tnBaseAmount || 0)),
    sort_order: 5
  },
  { 
    line: '6', 
    label: 'Tennessee R&D credit (Line 5 × 15%)', 
    field: 'tnFinalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.tnIncrementalQRE || 0) * 0.15,
    sort_order: 6
  }
];

export const tnConfig = {
  state: 'TN',
  name: 'Tennessee',
  forms: {
    standard: {
      name: 'TN Form FAE 170 - Research and Development Credit',
      method: 'standard',
      lines: TN_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Tennessee offers a 15% credit on incremental qualified research expenses.',
    'The credit uses the same calculation method as the federal credit.',
    'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.',
    'Available to corporations and pass-through entities.',
    'Credit can be carried forward for up to 15 years.'
  ],
  validationRules: {
    maxCredit: 2000000, // $2,000,000 annual cap
    carryforwardYears: 15,
    minIncrementalQRE: 0,
    maxFixedBasePercent: 0.16, // 16% maximum fixed-base percentage
    requireIncremental: true
  },
  hasAlternativeMethod: false,
  formReference: 'TN Form FAE 170',
  creditRate: 0.15,
  creditType: 'incremental'
}; 