import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const NC_PROFORMA_LINES = [
  // --- NC Standard Method (Form CD-401) ---
  { line: '1', label: 'Enter the amount of North Carolina qualified research expenses for the current year.', field: 'ncQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 2.5% (.025). This is your North Carolina R&D credit.', field: 'ncFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.ncQRE || 0) * 0.025 },
];

export const ncConfig = {
  state: 'NC',
  name: 'North Carolina',
  forms: {
    standard: {
      name: 'NC Form CD-401 - Research and Development Credit',
      method: 'standard',
      lines: NC_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'North Carolina offers a simple 2.5% credit on total qualified research expenses.',
    'No base calculation is required for North Carolina.',
    'Available to corporations and partnerships.'
  ]
}; 