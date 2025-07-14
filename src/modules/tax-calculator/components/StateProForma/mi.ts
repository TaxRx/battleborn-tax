import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MI_PROFORMA_LINES = [
  // --- MI Standard Method (Form 4300) ---
  { line: '1', label: 'Enter the amount of Michigan qualified research expenses for the current year.', field: 'miQRE', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Multiply Line 1 by 3.9% (.039). This is your Michigan R&D credit.', field: 'miFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.miQRE || 0) * 0.039 },
];

export const miConfig = {
  state: 'MI',
  name: 'Michigan',
  forms: {
    standard: {
      name: 'MI Form 4300 - Research and Development Credit',
      method: 'standard',
      lines: MI_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Michigan offers a simple 3.9% credit on total qualified research expenses.',
    'No base calculation is required for Michigan.',
    'Available to corporations and partnerships.'
  ]
}; 