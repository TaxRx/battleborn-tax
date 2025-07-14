import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MA_PROFORMA_LINES = [
  // --- MA Standard Method (Form 355M) ---
  { line: '1', label: 'Enter the amount of Massachusetts qualified research expenses for the current year.', field: 'maQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average annual gross receipts for the 4 taxable years preceding the credit year.', field: 'maAvgGrossReceipts', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => data.avgGrossReceipts || 0 },
  { line: '3', label: 'Enter the fixed-base percentage (3% for most taxpayers).', field: 'maFixedBasePercent', editable: true, method: 'standard', defaultValue: 3, type: 'percentage' },
  { line: '4', label: 'Multiply Line 2 by Line 3.', field: 'maBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.maAvgGrossReceipts || 0) * ((data.maFixedBasePercent || 3) / 100) },
  { line: '5', label: 'Subtract Line 4 from Line 1. If zero or less, enter zero.', field: 'maIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.maQRE || 0) - (data.maBaseAmount || 0), 0) },
  { line: '6', label: 'Multiply Line 5 by 10% (.10). This is your Massachusetts R&D credit.', field: 'maFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.maIncrementalQRE || 0) * 0.10 },
];

export const maConfig = {
  state: 'MA',
  name: 'Massachusetts',
  forms: {
    standard: {
      name: 'MA Form 355M - Research and Development Credit',
      method: 'standard',
      lines: MA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Massachusetts uses a fixed-base percentage calculation similar to the federal credit.',
    'The credit is 10% of incremental qualified research expenses.',
    'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.',
    'Available to corporations and partnerships.'
  ]
}; 