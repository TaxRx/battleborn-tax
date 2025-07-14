import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const VA_PROFORMA_LINES = [
  // --- VA Standard Method (Form 500) ---
  { line: '1', label: 'Enter the amount of Virginia qualified research expenses for the current year.', field: 'vaQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average annual gross receipts for the 4 taxable years preceding the credit year.', field: 'vaAvgGrossReceipts', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => data.avgGrossReceipts || 0 },
  { line: '3', label: 'Enter the fixed-base percentage (3% for most taxpayers).', field: 'vaFixedBasePercent', editable: true, method: 'standard', defaultValue: 3, type: 'percentage' },
  { line: '4', label: 'Multiply Line 2 by Line 3.', field: 'vaBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.vaAvgGrossReceipts || 0) * ((data.vaFixedBasePercent || 3) / 100) },
  { line: '5', label: 'Subtract Line 4 from Line 1. If zero or less, enter zero.', field: 'vaIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.vaQRE || 0) - (data.vaBaseAmount || 0), 0) },
  { line: '6', label: 'Multiply Line 5 by 15% (.15). This is your Virginia R&D credit.', field: 'vaFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.vaIncrementalQRE || 0) * 0.15 },
];

export const vaConfig = {
  state: 'VA',
  name: 'Virginia',
  forms: {
    standard: {
      name: 'VA Form 500 - Research and Development Credit',
      method: 'standard',
      lines: VA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Virginia uses a fixed-base percentage calculation similar to the federal credit.',
    'The credit is 15% of incremental qualified research expenses.',
    'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.',
    'Available to corporations and partnerships.'
  ]
}; 