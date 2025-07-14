import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const DE_PROFORMA_LINES = [
  // --- DE Standard Method (Form 1100) ---
  { line: '1', label: 'Enter the amount of Delaware qualified research expenses for the current year.', field: 'deQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Delaware R&D credit.', field: 'deFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.deQRE || 0) * 0.05 },
];

export const deConfig = {
  state: 'DE',
  name: 'Delaware',
  forms: {
    standard: {
      name: 'DE Form 1100 - Research and Development Credit',
      method: 'standard',
      lines: DE_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Delaware offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Delaware.',
    'Available to corporations and partnerships.'
  ]
}; 