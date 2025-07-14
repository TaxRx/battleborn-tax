import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const KY_PROFORMA_LINES = [
  // --- KY Standard Method (Form 720) ---
  { line: '1', label: 'Enter the amount of Kentucky qualified research expenses for the current year.', field: 'kyQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 5% (.05). This is your Kentucky R&D credit.', field: 'kyFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.kyQRE || 0) * 0.05 },
];

export const kyConfig = {
  state: 'KY',
  name: 'Kentucky',
  forms: {
    standard: {
      name: 'KY Form 720 - Research and Development Credit',
      method: 'standard',
      lines: KY_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Kentucky offers a simple 5% credit on total qualified research expenses.',
    'No base calculation is required for Kentucky.',
    'Available to corporations and partnerships.'
  ]
}; 