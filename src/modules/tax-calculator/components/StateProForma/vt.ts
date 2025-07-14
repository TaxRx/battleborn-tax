import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const VT_PROFORMA_LINES = [
  // --- VT Standard Method (Form CO-411) ---
  { line: '1', label: 'Enter the amount of Vermont qualified research expenses for the current year.', field: 'vtQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Vermont R&D credit.', field: 'vtFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.vtQRE || 0) * 0.05 },
];

export const vtConfig = {
  state: 'VT',
  name: 'Vermont',
  forms: {
    standard: {
      name: 'VT Form CO-411 - Research and Development Credit',
      method: 'standard',
      lines: VT_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Vermont offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Vermont.',
    'Available to corporations and partnerships.'
  ]
}; 