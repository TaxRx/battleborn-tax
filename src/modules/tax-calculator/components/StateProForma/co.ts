import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const CO_PROFORMA_LINES = [
  // --- CO Standard Method (Form DR 0097) ---
  { line: '1', label: 'Enter the amount of Colorado qualified research expenses for the current year.', field: 'coQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 3% (.03). This is your Colorado R&D credit.', field: 'coFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.coQRE || 0) * 0.03 },
];

export const coConfig = {
  state: 'CO',
  name: 'Colorado',
  forms: {
    standard: {
      name: 'CO Form DR 0097 - Research and Development Credit',
      method: 'standard',
      lines: CO_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Colorado offers a simple 3% credit on total qualified research expenses.',
    'No base calculation is required for Colorado.',
    'Available to corporations and partnerships.',
    'Pre-certification with local Enterprise Zone Administrator may be required.'
  ]
}; 