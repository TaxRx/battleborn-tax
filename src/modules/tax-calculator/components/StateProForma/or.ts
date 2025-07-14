import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const OR_PROFORMA_LINES = [
  // --- OR Standard Method (Form 20) ---
  { line: '1', label: 'Enter the amount of Oregon qualified research expenses for the current year.', field: 'orQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Oregon R&D credit.', field: 'orFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.orQRE || 0) * 0.05 },
];

export const orConfig = {
  state: 'OR',
  name: 'Oregon',
  forms: {
    standard: {
      name: 'OR Form 20 - Research and Development Credit',
      method: 'standard',
      lines: OR_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Oregon offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Oregon.',
    'Available to corporations and partnerships.'
  ]
}; 