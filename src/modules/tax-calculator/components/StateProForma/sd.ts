import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const SD_PROFORMA_LINES = [
  // --- SD No R&D Credit Available ---
  { 
    line: '1', 
    label: 'South Dakota does not offer a state R&D credit', 
    field: 'sdNoCredit', 
    editable: false, 
    method: 'standard', 
    calc: () => 0,
    description: 'South Dakota does not provide a state-level research and development tax credit.'
  }
];

export const sdConfig = {
  state: 'SD',
  name: 'South Dakota',
  forms: {
    standard: {
      name: 'SD - No R&D Credit Available',
      method: 'standard',
      lines: SD_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'South Dakota does not offer a state-level research and development tax credit.',
    'No state R&D credit is available for South Dakota taxpayers.'
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