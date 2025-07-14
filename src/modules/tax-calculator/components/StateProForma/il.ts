import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const IL_PROFORMA_LINES = [
  // --- IL Standard Method (Form IL-1120) ---
  { line: '1', label: 'Enter the amount of Illinois qualified research expenses for the current year.', field: 'ilQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average annual gross receipts for the 4 taxable years preceding the credit year.', field: 'ilAvgGrossReceipts', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => data.avgGrossReceipts || 0 },
  { line: '3', label: 'Enter the fixed-base percentage (3% for most taxpayers).', field: 'ilFixedBasePercent', editable: true, method: 'standard', defaultValue: 3, type: 'percentage' },
  { line: '4', label: 'Multiply Line 2 by Line 3.', field: 'ilBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.ilAvgGrossReceipts || 0) * ((data.ilFixedBasePercent || 3) / 100) },
  { line: '5', label: 'Subtract Line 4 from Line 1. If zero or less, enter zero.', field: 'ilIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.ilQRE || 0) - (data.ilBaseAmount || 0), 0) },
  { line: '6', label: 'Multiply Line 5 by 6.5% (.065). This is your Illinois R&D credit.', field: 'ilFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.ilIncrementalQRE || 0) * 0.065 },
];

export const ilConfig = {
  state: 'IL',
  name: 'Illinois',
  forms: {
    standard: {
      name: 'IL Form IL-1120 - Research and Development Credit',
      method: 'standard',
      lines: IL_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Illinois uses a fixed-base percentage calculation similar to the federal credit.',
    'The credit is 6.5% of incremental qualified research expenses.',
    'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.',
    'Available only to corporations.'
  ]
}; 