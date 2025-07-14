import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const RI_PROFORMA_LINES = [
  // --- RI Standard Method (Form RI-1120C) ---
  { line: '1', label: 'Enter the amount of Rhode Island qualified research expenses for the current year.', field: 'riQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Rhode Island R&D credit.', field: 'riFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.riQRE || 0) * 0.05 },
];

export const riConfig = {
  state: 'RI',
  name: 'Rhode Island',
  forms: {
    standard: {
      name: 'RI Form RI-1120C - Research and Development Credit',
      method: 'standard',
      lines: RI_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Rhode Island offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Rhode Island.',
    'Available to corporations and partnerships.'
  ]
}; 