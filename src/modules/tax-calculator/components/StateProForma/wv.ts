import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const WV_PROFORMA_LINES = [
  // --- WV No R&D Credit Available ---
  { 
    line: '1', 
    label: 'West Virginia does not offer a state R&D credit', 
    field: 'wvNoCredit', 
    editable: false, 
    method: 'standard', 
    calc: () => 0,
    description: 'West Virginia does not provide a state-level research and development tax credit.'
  }
];

export const wvConfig = {
  state: 'WV',
  name: 'West Virginia',
  forms: {
    standard: {
      name: 'WV - No R&D Credit Available',
      method: 'standard',
      lines: WV_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'West Virginia does not offer a state-level research and development tax credit.',
    'No state R&D credit is available for West Virginia taxpayers.'
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