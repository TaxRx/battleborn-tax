import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const GA_PROFORMA_LINES = [
  // --- GA Standard Method (Form IT-RD) ---
  { line: '1', label: 'Enter the amount of Georgia qualified research expenses for the current year.', field: 'gaQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average annual gross receipts for the 4 taxable years preceding the credit year.', field: 'gaAvgGrossReceipts', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => data.avgGrossReceipts || 0 },
  { line: '3', label: 'Enter the fixed-base percentage (3% for most taxpayers).', field: 'gaFixedBasePercent', editable: true, method: 'standard', defaultValue: 3, type: 'percentage' },
  { line: '4', label: 'Multiply Line 2 by Line 3.', field: 'gaBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.gaAvgGrossReceipts || 0) * ((data.gaFixedBasePercent || 3) / 100) },
  { line: '5', label: 'Subtract Line 4 from Line 1. If zero or less, enter zero.', field: 'gaIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.gaQRE || 0) - (data.gaBaseAmount || 0), 0) },
  { line: '6', label: 'Multiply Line 5 by 10% (.10). This is your Georgia R&D credit.', field: 'gaFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.gaIncrementalQRE || 0) * 0.10 },
];

export const gaConfig = {
  state: 'GA',
  name: 'Georgia',
  forms: {
    standard: {
      name: 'GA Form IT-RD - Research and Development Credit',
      method: 'standard',
      lines: GA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Georgia uses a fixed-base percentage calculation similar to the federal credit.',
    'The credit is 10% of incremental qualified research expenses.',
    'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.',
    'Available to corporations and partnerships.'
  ]
}; 