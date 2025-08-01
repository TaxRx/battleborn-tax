import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const TX_PROFORMA_LINES = [
  // --- TX Form 05-178 - R&D Credit Schedule ---
  // Based on actual Form 05-178 requirements with university enhancement
  
  // Auto-populate from QRE data using standard field names
  { 
    line: 'wages', 
    label: 'Qualified wages', 
    field: 'wages', 
    editable: true, 
    method: 'standard',
    sort_order: 0.1
  },
  { 
    line: 'supplies', 
    label: 'Qualified supplies', 
    field: 'supplies', 
    editable: true, 
    method: 'standard',
    sort_order: 0.2
  },
  { 
    line: 'contract', 
    label: 'Contract research', 
    field: 'contractResearch', 
    editable: true, 
    method: 'standard',
    sort_order: 0.3
  },
  { 
    line: '1', 
    label: 'Enter Texas qualified research expenses for the current year', 
    field: 'txQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  { line: '2', label: 'Basic R&D credit (Line 1 × 5%)', field: 'txBasicCredit', editable: false, method: 'standard', calc: (data: any) => (data.txQRE || 0) * 0.05 },
  { line: '3', label: 'Enhanced credit for university partnership research (if applicable)', field: 'txUniversityCredit', editable: true, method: 'standard', calc: (data: any) => 0 },
  { line: '4', label: 'Total Texas R&D credit (Lines 2 + 3)', field: 'txFinalCredit', editable: false, method: 'standard', calc: (data: any) => (data.txBasicCredit || 0) + (data.txUniversityCredit || 0) },
];

export const txConfig = {
  state: 'TX',
  name: 'Texas',
  forms: {
    standard: {
      name: 'TX Form 05-178 - Research and Development Activities Credit Schedule',
      method: 'standard',
      lines: TX_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  notes: [
    'Texas offers a 5% basic credit on qualified research expenses plus enhanced credit for university partnerships.',
    'No base calculation is required for Texas - credit calculated on total QRE.',
    'Enhanced credit available for research conducted in partnership with universities.',
    'Credit must be established by December 31, 2026.',
    'Credit can be carried forward for up to 20 years.',
    'No annual cap on the credit amount.',
    'Available to corporations, partnerships, and LLCs conducting qualified research in Texas.'
  ],
  validationRules: {
    maxCredit: null, // No annual cap
    carryforwardYears: 20,
    minQRE: 0,
    requireIncremental: false,
    establishmentDeadline: '2026-12-31'
  },
  hasAlternativeMethod: false,
  formReference: 'TX Form 05-178 - Research and Development Activities Credit Schedule',
  creditRate: [0.05, 'enhanced_for_university'], // Basic 5% + enhanced for university partnerships
  creditType: 'total_with_enhancement'
}; 