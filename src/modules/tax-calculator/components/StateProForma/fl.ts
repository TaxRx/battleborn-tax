import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const FL_PROFORMA_LINES = [
  // --- FL Standard Method (Form F-1120) ---
  { line: '1', label: 'Enter the amount of Florida qualified research expenses for the current year.', field: 'flQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 3% (.03). This is your Florida R&D credit.', field: 'flFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.flQRE || 0) * 0.03 },
];

export const flConfig = {
  state: 'FL',
  name: 'Florida',
  forms: {
    standard: {
      name: 'FL Form F-1120 - Research and Development Credit',
      method: 'standard',
      lines: FL_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Florida offers a simple 3% credit on total qualified research expenses.',
    'No base calculation is required for Florida.',
    'Available to corporations and partnerships.'
  ]
}; 