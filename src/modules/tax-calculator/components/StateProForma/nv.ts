import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const NV_PROFORMA_LINES = [
  // --- NV No R&D Credit Available ---
  { 
    line: '1', 
    label: 'Nevada does not offer a state R&D credit', 
    field: 'nvNoCredit', 
    editable: false, 
    method: 'standard', 
    calc: () => 0,
    description: 'Nevada does not provide a state-level research and development tax credit.'
  }
];

export const nvConfig = {
  state: 'NV',
  name: 'Nevada',
  forms: {
    standard: {
      name: 'NV - No R&D Credit Available',
      method: 'standard',
      lines: NV_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0,
  creditType: "none",
  formReference: "NV - No R&D Credit Available",
  validationRules: [
    {
      type: "other",
      value: "No state credit available",
      message: "Nevada does not offer a state-level research and development tax credit"
    },
    {
      type: "other",
      value: "Federal credit available",
      message: "Businesses in Nevada may still qualify for the federal R&D credit"
    },
    {
      type: "other",
      value: "Alternative incentives",
      message: "Consider other Nevada tax incentives such as the Modified Business Tax abatement"
    }
  ],
  notes: [
    "Nevada does not offer a state-level research and development tax credit",
    "Businesses in Nevada may still qualify for the federal R&D credit",
    "Consider other Nevada tax incentives such as the Modified Business Tax abatement",
    "Nevada has no state income tax, so no state-level credits are available"
  ]
}; 