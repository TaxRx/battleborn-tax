import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const WA_PROFORMA_LINES = [
  // --- WA Standard Method (Form 40) ---
  { line: '1', label: 'Enter the amount of Washington qualified research expenses for the current year.', field: 'waQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 2.5% (.025). This is your Washington R&D credit.', field: 'waFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.waQRE || 0) * 0.025 },
];

export const waConfig = {
  state: 'WA',
  name: 'Washington',
  forms: {
    standard: {
      name: 'WA Form 40 - Research and Development Credit',
      method: 'standard',
      lines: WA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Washington offers a simple 2.5% credit on total qualified research expenses.',
    'No base calculation is required for Washington.',
    'Available to corporations and partnerships.'
  ]
}; 