import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const HI_PROFORMA_LINES = [
  // --- HI Standard Method (Form N-11) ---
  { line: '1', label: 'Enter the amount of Hawaii qualified research expenses for the current year.', field: 'hiQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Hawaii R&D credit.', field: 'hiFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.hiQRE || 0) * 0.05 },
];

export const hiConfig = {
  state: 'HI',
  name: 'Hawaii',
  forms: {
    standard: {
      name: 'HI Form N-11 - Research and Development Credit',
      method: 'standard',
      lines: HI_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Hawaii offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Hawaii.',
    'Available to corporations and partnerships.'
  ]
}; 