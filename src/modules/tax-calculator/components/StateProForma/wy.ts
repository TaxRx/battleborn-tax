import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const WY_PROFORMA_LINES = [
  // --- WY No R&D Credit Available ---
  { 
    line: '1', 
    label: 'Wyoming does not offer a state R&D credit', 
    field: 'wyNoCredit', 
    editable: false, 
    method: 'standard', 
    calc: () => 0,
    description: 'Wyoming does not provide a state-level research and development tax credit.'
  }
];

export const wyConfig = {
  state: 'WY',
  name: 'Wyoming',
  forms: {
    standard: {
      name: 'WY - No R&D Credit Available',
      method: 'standard',
      lines: WY_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Wyoming does not offer a state-level research and development tax credit.',
    'No state R&D credit is available for Wyoming taxpayers.'
  ],
  validationRules: {
    maxCredit: 0,
    carryforwardYears: 0,
    requireIncremental: false
  },
  hasAlternativeMethod: false,
  formReference: 'N/A',
  creditRate: 0,
  creditType: 'none'
}; 