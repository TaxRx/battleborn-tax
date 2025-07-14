import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MS_PROFORMA_LINES = [
  // --- MS Standard Method (Form 83-105) ---
  { line: '1', label: 'Enter the amount of Mississippi qualified research expenses for the current year.', field: 'msQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Mississippi R&D credit.', field: 'msFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.msQRE || 0) * 0.05 },
];

export const msConfig = {
  state: 'MS',
  name: 'Mississippi',
  forms: {
    standard: {
      name: 'MS Form 83-105 - Research and Development Credit',
      method: 'standard',
      lines: MS_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Mississippi offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Mississippi.',
    'Available to corporations and partnerships.'
  ]
}; 