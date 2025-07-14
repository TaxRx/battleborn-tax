import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const LA_PROFORMA_LINES = [
  // --- LA Standard Method (Form CIFT-620) ---
  { line: '1', label: 'Enter the amount of Louisiana qualified research expenses for the current year.', field: 'laQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Louisiana R&D credit.', field: 'laFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.laQRE || 0) * 0.05 },
];

export const laConfig = {
  state: 'LA',
  name: 'Louisiana',
  forms: {
    standard: {
      name: 'LA Form CIFT-620 - Research and Development Credit',
      method: 'standard',
      lines: LA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Louisiana offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Louisiana.',
    'Available to corporations and partnerships.'
  ]
}; 