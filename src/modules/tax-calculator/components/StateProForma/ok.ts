import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const OK_PROFORMA_LINES = [
  // --- OK Standard Method (Form 512) ---
  { line: '1', label: 'Enter the amount of Oklahoma qualified research expenses for the current year.', field: 'okQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Oklahoma R&D credit.', field: 'okFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.okQRE || 0) * 0.05 },
];

export const okConfig = {
  state: 'OK',
  name: 'Oklahoma',
  forms: {
    standard: {
      name: 'OK Form 512 - Research and Development Credit',
      method: 'standard',
      lines: OK_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Oklahoma offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Oklahoma.',
    'Available to corporations and partnerships.'
  ]
}; 