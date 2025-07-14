import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const ID_PROFORMA_LINES = [
  // --- ID Standard Method (Form 41) ---
  { line: '1', label: 'Enter the amount of Idaho qualified research expenses for the current year.', field: 'idQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 3% (.03). This is your Idaho R&D credit.', field: 'idFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.idQRE || 0) * 0.03 },
];

export const idConfig = {
  state: 'ID',
  name: 'Idaho',
  forms: {
    standard: {
      name: 'ID Form 41 - Research and Development Credit',
      method: 'standard',
      lines: ID_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Idaho offers a simple 3% credit on total qualified research expenses.',
    'No base calculation is required for Idaho.',
    'Available to corporations and partnerships.'
  ]
}; 