import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const VA_PROFORMA_LINES = [
  // --- VA R&D TAX CREDIT (TWO SEPARATE CREDITS) ---
  // Virginia offers both Minor and Major R&D credits that can be claimed simultaneously
  
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
    label: 'Total Virginia qualified research expenses for current year', 
    field: 'vaCurrentYearQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0), 
    sort_order: 1 
  },
  { line: '2', label: 'QRE threshold check: Enter $5,000,000 for comparison', field: 'vaThreshold', editable: false, method: 'standard', defaultValue: 5000000, sort_order: 2 },
  { line: '3', label: 'Credit type: Minor (≤$5M) or Major (>$5M)', field: 'vaCreditType', editable: true, type: 'text', sort_order: 3 },
  
  // --- PART 2: MINOR R&D CREDIT (Form RDC) - For QRE ≤ $5M ---
  { line: '4', label: 'Virginia base amount (if Minor credit)', field: 'vaMinorBaseAmount', editable: true, method: 'standard', sort_order: 4 },
  { line: '5', label: 'Incremental QRE (Line 1 - Line 4, if positive)', field: 'vaMinorIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.vaCurrentYearQRE || 0) - (data.vaMinorBaseAmount || 0), 0), sort_order: 5 },
  { line: '6a', label: 'Regular minor credit: 15% of first $300,000 of Line 5', field: 'vaMinorRegularCredit', editable: false, method: 'standard', calc: (data: any) => Math.min((data.vaMinorIncrementalQRE || 0), 300000) * 0.15, sort_order: 6 },
  { line: '6b', label: 'University minor credit: 20% of first $300,000 of Line 5 (if with VA university)', field: 'vaMinorUniversityCredit', editable: true, method: 'standard', sort_order: 7 },
  { line: '7', label: 'Total minor credit (higher of Line 6a or 6b, capped at $45K/$60K)', field: 'vaMinorTotalCredit', editable: false, method: 'standard', calc: (data: any) => Math.max((data.vaMinorRegularCredit || 0), (data.vaMinorUniversityCredit || 0)), sort_order: 8 },
  
  // --- PART 3: MAJOR R&D CREDIT (Form MRD) - For QRE > $5M ---
  { line: '8', label: 'Average Virginia QRE for prior 3 years (if Major credit)', field: 'vaMajorAverage3Year', editable: true, method: 'standard', sort_order: 9 },
  { line: '9', label: 'Major credit base amount (50% of Line 8)', field: 'vaMajorBaseAmount', editable: false, method: 'standard', calc: (data: any) => (data.vaMajorAverage3Year || 0) * 0.50, sort_order: 10 },
  { line: '10', label: 'Major incremental QRE (Line 1 - Line 9, if positive)', field: 'vaMajorIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.vaCurrentYearQRE || 0) - (data.vaMajorBaseAmount || 0), 0), sort_order: 11 },
  { line: '11a', label: 'Major credit on first $1M (Line 10 × 10%, capped at $1M)', field: 'vaMajorCredit1', editable: false, method: 'standard', calc: (data: any) => Math.min((data.vaMajorIncrementalQRE || 0), 1000000) * 0.10, sort_order: 12 },
  { line: '11b', label: 'Major credit on excess over $1M (excess × 5%)', field: 'vaMajorCredit2', editable: false, method: 'standard', calc: (data: any) => Math.max((data.vaMajorIncrementalQRE || 0) - 1000000, 0) * 0.05, sort_order: 13 },
  { line: '12', label: 'Total major credit (Line 11a + 11b, capped at $300K/$400K)', field: 'vaMajorTotalCredit', editable: false, method: 'standard', calc: (data: any) => (data.vaMajorCredit1 || 0) + (data.vaMajorCredit2 || 0), sort_order: 14 },
  
  // --- PART 4: FINAL CREDIT CALCULATION ---
  { line: '13', label: 'Final Virginia R&D credit (Minor OR Major, not both)', field: 'vaFinalCredit', editable: true, method: 'standard', sort_order: 15 },
];

export const vaConfig = {
  state: 'VA',
  name: 'Virginia',
  forms: {
    standard: {
      name: 'Form RDC (Minor R&D Credit) / Form MRD (Major R&D Credit)',
      method: 'standard',
      lines: VA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: "15%/20% (Minor) or 10%/5% step (Major)",
  creditType: "dual_minor_and_major_system",
  formReference: "VA Form RDC / Form MRD - Application Required",
  validationRules: [
    {
      type: "qre_threshold",
      value: "$5 million QRE threshold",
      message: "QRE amount determines which credit applies: Minor (≤$5M) or Major (>$5M)"
    },
    {
      type: "application_deadline",
      value: "September 1 annually",
      message: "Applications must be submitted by September 1st for both Minor and Major credits"
    },
    {
      type: "award_notification",
      value: "November 30 award letters",
      message: "Award letters sent by November 30th - may require extension or amended return"
    },
    {
      type: "minor_credit_pools",
      value: "$15.77M annual pool",
      message: "Minor R&D Credit pool: $15.77 million annually (doubled from $7.77M)"
    },
    {
      type: "minor_credit_caps",
      value: "$45K regular, $60K with universities",
      message: "Minor credit capped at $45,000 ($60,000 if with Virginia university)"
    },
    {
      type: "minor_refundable",
      value: "Minor credit is REFUNDABLE",
      message: "Minor R&D Credit is refundable - can receive cash refund"
    },
    {
      type: "major_credit_pools",
      value: "$16M annual pool",
      message: "Major R&D Credit pool: $16 million annually (reduced from $24M)"
    },
    {
      type: "major_credit_caps",
      value: "$300K regular, $400K with universities",
      message: "Major credit capped at $300,000 ($400,000 if with Virginia university)"
    },
    {
      type: "major_limitations",
      value: "Major credit: max 75% of tax liability, 10-year carryforward",
      message: "Major credit limited to 75% of tax liability but carries forward 10 years"
    },
    {
      type: "entity_eligibility",
      value: "C-Corps, S-Corps, LLCs, Partnerships",
      message: "Available to corporations, S-corporations, LLCs, and partnerships"
    },
    {
      type: "pass_through_requirements",
      value: "Form PTE required within 30 days of award",
      message: "Pass-through entities must file Form PTE within 30 days of receiving award letter"
    }
  ],
  notes: [
    "Virginia offers a DUAL R&D credit system based on QRE amount:",
    "",
    "MINOR R&D CREDIT (Form RDC) - For QRE ≤ $5 million:",
    "• 15% of first $300,000 incremental QRE (max $45,000)",
    "• 20% of first $300,000 if done with Virginia university (max $60,000)",
    "• REFUNDABLE credit - can receive cash refund",
    "• $15.77 million annual statewide pool (doubled in 2024)",
    "• Application deadline: September 1st",
    "",
    "MAJOR R&D CREDIT (Form MRD) - For QRE > $5 million:",
    "• 10% of first $1M + 5% of excess incremental QRE (2023-2024 step rates)",
    "• Regular rate: 10% of all incremental QRE (2025+)",
    "• Maximum $300,000 ($400,000 with Virginia university)",
    "• NOT refundable but 10-year carryforward allowed",
    "• Can only offset up to 75% of tax liability",
    "• $16 million annual statewide pool",
    "• Application deadline: September 1st",
    "",
    "APPLICATION PROCESS:",
    "• Both credits require September 1st application deadline",
    "• Award letters sent by November 30th",
    "• May need extension payment or amended return due to timing",
    "• Pass-through entities: Form PTE required within 30 days of award",
    "",
    "UNIVERSITY PARTNERSHIPS:",
    "• Higher rates for research with Virginia universities",
    "• Minor: 20% vs 15% (max $60,000 vs $45,000)",
    "• Major: $400,000 vs $300,000 cap",
    "",
    "KEY LEGISLATIVE CHANGES (2024):",
    "• Minor credit pool DOUBLED to $15.77M",
    "• Major credit pool reduced to $16M",
    "• Recent awards exceeding caps due to pool increases",
    "• Set to expire December 31, 2024 (may be extended)"
  ]
}; 