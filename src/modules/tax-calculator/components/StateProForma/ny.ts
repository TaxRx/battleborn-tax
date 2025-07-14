import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const NY_PROFORMA_LINES = [
  // --- NY Standard Method (Form CT-3) ---
  { line: '1', label: 'Enter the amount of New York qualified research expenses for the current year.', field: 'nyQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average annual gross receipts for the 4 taxable years preceding the credit year.', field: 'nyAvgGrossReceipts', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => data.avgGrossReceipts || 0 },
  { line: '3', label: 'Enter the fixed-base percentage (3% for most taxpayers).', field: 'nyFixedBasePercent', editable: true, method: 'standard', defaultValue: 3, type: 'percentage' },
  { line: '4', label: 'Multiply Line 2 by Line 3.', field: 'nyBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.nyAvgGrossReceipts || 0) * ((data.nyFixedBasePercent || 3) / 100) },
  { line: '5', label: 'Subtract Line 4 from Line 1. If zero or less, enter zero.', field: 'nyIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.nyQRE || 0) - (data.nyBaseAmount || 0), 0) },
  { line: '6', label: 'Multiply Line 5 by 9% (.09). This is your New York R&D credit.', field: 'nyFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.nyIncrementalQRE || 0) * 0.09 },
];

export const nyConfig = {
  state: 'NY',
  name: 'New York',
  forms: {
    standard: {
      name: 'NY Form CT-3 - Research and Development Credit',
      method: 'standard',
      lines: NY_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'New York uses a fixed-base percentage calculation similar to the federal credit.',
    'The credit is 9% of incremental qualified research expenses.',
    'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.'
  ]
}; 