import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const AR_PROFORMA_LINES = [
  // --- AR Standard Method (Form AR1100CT) ---
  { line: '1', label: 'Enter the amount of Arkansas qualified research expenses for the current year.', field: 'arQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 20% (.20). This is your Arkansas R&D credit.', field: 'arFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.arQRE || 0) * 0.20 },
];

export const arConfig = {
  state: 'AR',
  name: 'Arkansas',
  forms: {
    standard: {
      name: 'AR Form AR1100CT - Research and Development Credit',
      method: 'standard',
      lines: AR_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Arkansas offers a simple 20% credit on total qualified research expenses.',
    'No base calculation is required for Arkansas.',
    'Available to corporations and partnerships.',
    'One of the highest state R&D credit rates available.'
  ]
}; 