import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const OH_PROFORMA_LINES = [
  // --- OH Standard Method (Form IT 1140) ---
  { line: '1', label: 'Enter the amount of Ohio qualified research expenses for the current year.', field: 'ohQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the average annual gross receipts for the 4 taxable years preceding the credit year.', field: 'ohAvgGrossReceipts', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => data.avgGrossReceipts || 0 },
  { line: '3', label: 'Enter the fixed-base percentage (3% for most taxpayers).', field: 'ohFixedBasePercent', editable: true, method: 'standard', defaultValue: 3, type: 'percentage' },
  { line: '4', label: 'Multiply Line 2 by Line 3.', field: 'ohBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.ohAvgGrossReceipts || 0) * ((data.ohFixedBasePercent || 3) / 100) },
  { line: '5', label: 'Subtract Line 4 from Line 1. If zero or less, enter zero.', field: 'ohIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.ohQRE || 0) - (data.ohBaseAmount || 0), 0) },
  { line: '6', label: 'Multiply Line 5 by 7% (.07). This is your Ohio R&D credit.', field: 'ohFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.ohIncrementalQRE || 0) * 0.07 },
];

export const ohConfig = {
  state: 'OH',
  name: 'Ohio',
  forms: {
    standard: {
      name: 'OH Form IT 1140 - Research and Development Credit',
      method: 'standard',
      lines: OH_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Ohio uses a fixed-base percentage calculation similar to the federal credit.',
    'The credit is 7% of incremental qualified research expenses.',
    'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.',
    'Available only to corporations.'
  ]
}; 