import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const TX_PROFORMA_LINES = [
  // --- TX Standard Method (Form 05-163) ---
  { line: '1', label: 'Enter the amount of Texas qualified research expenses for the current year.', field: 'txQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Texas R&D credit.', field: 'txFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.txQRE || 0) * 0.05 },
];

export const txConfig = {
  state: 'TX',
  name: 'Texas',
  forms: {
    standard: {
      name: 'TX Form 05-163 - Research and Development Credit',
      method: 'standard',
      lines: TX_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Texas offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Texas.',
    'The credit is available to corporations, partnerships, and LLCs.'
  ]
}; 