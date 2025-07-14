import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const NJ_PROFORMA_LINES = [
  // --- NJ Standard Method (Form CBT-100) ---
  { line: '1', label: 'Enter the amount of New Jersey qualified research expenses for the current year.', field: 'njQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average annual gross receipts for the 4 taxable years preceding the credit year.', field: 'njAvgGrossReceipts', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => data.avgGrossReceipts || 0 },
  { line: '3', label: 'Enter the fixed-base percentage (3% for most taxpayers).', field: 'njFixedBasePercent', editable: true, method: 'standard', defaultValue: 3, type: 'percentage' },
  { line: '4', label: 'Multiply Line 2 by Line 3.', field: 'njBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.njAvgGrossReceipts || 0) * ((data.njFixedBasePercent || 3) / 100) },
  { line: '5', label: 'Subtract Line 4 from Line 1. If zero or less, enter zero.', field: 'njIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.njQRE || 0) - (data.njBaseAmount || 0), 0) },
  { line: '6', label: 'Multiply Line 5 by 10% (.10). This is your New Jersey R&D credit.', field: 'njFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.njIncrementalQRE || 0) * 0.10 },
];

export const njConfig = {
  state: 'NJ',
  name: 'New Jersey',
  forms: {
    standard: {
      name: 'NJ Form CBT-100 - Research and Development Credit',
      method: 'standard',
      lines: NJ_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'New Jersey uses a fixed-base percentage calculation similar to the federal credit.',
    'The credit is 10% of incremental qualified research expenses.',
    'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.',
    'Available only to corporations.'
  ]
}; 