import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const ME_PROFORMA_LINES = [
  // --- ME Standard Method (Form 1120ME) ---
  { line: '1', label: 'Enter the amount of Maine qualified research expenses for the current year.', field: 'meQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Maine R&D credit.', field: 'meFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.meQRE || 0) * 0.05 },
];

export const meConfig = {
  state: 'ME',
  name: 'Maine',
  forms: {
    standard: {
      name: 'ME Form 1120ME - Research and Development Credit',
      method: 'standard',
      lines: ME_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Maine offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Maine.',
    'Available to corporations and partnerships.'
  ]
}; 