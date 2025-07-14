import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const NM_PROFORMA_LINES = [
  // --- NM Standard Method (Form CIT-1) ---
  { line: '1', label: 'Enter the amount of New Mexico qualified research expenses for the current year.', field: 'nmQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your New Mexico R&D credit.', field: 'nmFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.nmQRE || 0) * 0.05 },
];

export const nmConfig = {
  state: 'NM',
  name: 'New Mexico',
  forms: {
    standard: {
      name: 'NM Form CIT-1 - Research and Development Credit',
      method: 'standard',
      lines: NM_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'New Mexico offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for New Mexico.',
    'Available to corporations and partnerships.'
  ]
}; 