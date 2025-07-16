import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const WI_PROFORMA_LINES = [
  // --- WI Form 203 - Research and Development Credit ---
  // Based on actual WI Form 203 requirements
  { 
    line: '1', 
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'wiQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Wisconsin R&D credit (Line 1 × 5.75%)', 
    field: 'wiFinalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.wiQRE || 0) * 0.0575,
    sort_order: 2
  },
];

export const wiConfig = {
  state: 'WI',
  name: 'Wisconsin',
  forms: {
    standard: {
      name: 'WI Form 203 - Research and Development Credit',
      method: 'standard',
      lines: WI_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Wisconsin offers a 5.75% credit on total qualified research expenses.',
    'No base calculation is required for Wisconsin.',
    'Available to corporations and partnerships.',
    'Credit can be carried forward for up to 15 years.'
  ],
  validationRules: {
    maxCredit: null, // No annual cap
    carryforwardYears: 15,
    minQRE: 0,
    requireIncremental: false
  },
  hasAlternativeMethod: false,
  formReference: 'WI Form 203',
  creditRate: 0.0575,
  creditType: 'total'
}; 