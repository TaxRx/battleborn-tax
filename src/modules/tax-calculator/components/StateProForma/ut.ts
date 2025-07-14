import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const UT_PROFORMA_LINES = [
  // --- UT Standard Method (Form TC-20) ---
  { line: '1', label: 'Enter the amount of Utah qualified research expenses for the current year.', field: 'utQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Utah R&D credit.', field: 'utFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.utQRE || 0) * 0.05 },
];

export const utConfig = {
  state: 'UT',
  name: 'Utah',
  forms: {
    standard: {
      name: 'UT Form TC-20 - Research and Development Credit',
      method: 'standard',
      lines: UT_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Utah offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Utah.',
    'Available to corporations and partnerships.'
  ]
}; 