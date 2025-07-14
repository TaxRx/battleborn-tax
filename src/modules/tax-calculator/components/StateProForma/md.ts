import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MD_PROFORMA_LINES = [
  // --- MD Standard Method (Form 500CR) ---
  { line: '1', label: 'Enter the amount of Maryland qualified research expenses for the current year.', field: 'mdQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 3% (.03). This is your Maryland R&D credit.', field: 'mdFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.mdQRE || 0) * 0.03 },
];

export const mdConfig = {
  state: 'MD',
  name: 'Maryland',
  forms: {
    standard: {
      name: 'MD Form 500CR - Research and Development Credit',
      method: 'standard',
      lines: MD_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Maryland offers a simple 3% credit on total qualified research expenses.',
    'No base calculation is required for Maryland.',
    'Available to corporations and partnerships.'
  ]
}; 