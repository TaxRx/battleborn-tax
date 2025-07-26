import { StateCreditBaseData } from '../../services/stateCreditDataService';

export interface StateProFormaLine {
  line: string;
  label: string;
  field: string;
  editable: boolean;
  calc?: (data: Record<string, number>) => number;
  defaultValue?: number;
  type?: 'currency' | 'percentage' | 'yesno';
  description?: string;
  sort_order?: number;
}

export const AZ_PROFORMA_LINES: StateProFormaLine[] = [
  // --- PART 1: ARIZONA GENERAL R&D CREDIT (Form 308/308-I) ---
  // Auto-populate from QRE data using standard field names
  { 
    line: 'wages', 
    label: 'Qualified wages', 
    field: 'wages', 
    editable: true, 
    sort_order: 0.1
  },
  { 
    line: 'supplies', 
    label: 'Qualified supplies', 
    field: 'supplies', 
    editable: true, 
    sort_order: 0.2
  },
  { 
    line: 'contract', 
    label: 'Contract research', 
    field: 'contractResearch', 
    editable: true, 
    sort_order: 0.3
  },
  { 
    line: '1', 
    label: 'Arizona qualified research expenses for current year', 
    field: 'azCurrentYearQRE', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Base amount (federal Section 41 calculation)', 
    field: 'azBaseAmount', 
    editable: true, 
    sort_order: 2
  },
  { 
    line: '3', 
    label: 'Incremental QRE (Line 1 - Line 2, if positive)', 
    field: 'azIncrementalQRE', 
    editable: false, 
    calc: (data: Record<string, number>) => Math.max((data.azCurrentYearQRE || 0) - (data.azBaseAmount || 0), 0),
    sort_order: 3
  },
  { 
    line: '4a', 
    label: 'Credit on first $2,500,000 (Line 3 × 24%, capped at $2.5M)', 
    field: 'azCredit1', 
    editable: false, 
    calc: (data: Record<string, number>) => Math.min((data.azIncrementalQRE || 0), 2500000) * 0.24,
    sort_order: 4
  },
  { 
    line: '4b', 
    label: 'Credit on amount over $2,500,000 (excess × 15%)', 
    field: 'azCredit2', 
    editable: false, 
    calc: (data: Record<string, number>) => Math.max((data.azIncrementalQRE || 0) - 2500000, 0) * 0.15,
    sort_order: 5
  },
  { 
    line: '5', 
    label: 'Total Arizona general R&D credit (Line 4a + Line 4b)', 
    field: 'azGeneralCredit', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.azCredit1 || 0) + (data.azCredit2 || 0),
    sort_order: 6
  },
  
  // --- PART 2: UNIVERSITY RESEARCH CREDIT (Additional 10%) ---
  { 
    line: '6', 
    label: 'Basic research payments to Arizona universities', 
    field: 'azUniversityPayments', 
    editable: true, 
    sort_order: 7
  },
  { 
    line: '7', 
    label: 'University base amount', 
    field: 'azUniversityBase', 
    editable: true, 
    sort_order: 8
  },
  { 
    line: '8', 
    label: 'Excess university payments (Line 6 - Line 7, if positive)', 
    field: 'azUniversityExcess', 
    editable: false, 
    calc: (data: Record<string, number>) => Math.max((data.azUniversityPayments || 0) - (data.azUniversityBase || 0), 0),
    sort_order: 9
  },
  { 
    line: '9', 
    label: 'University research credit (Line 8 × 10%)', 
    field: 'azUniversityCredit', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.azUniversityExcess || 0) * 0.10,
    sort_order: 10
  },
  
  // --- PART 3: TOTAL CREDITS AND REFUNDABLE PORTION ---
  { 
    line: '10', 
    label: 'Total Arizona R&D credits (Line 5 + Line 9)', 
    field: 'azTotalCredit', 
    editable: false, 
    calc: (data: Record<string, number>) => (data.azGeneralCredit || 0) + (data.azUniversityCredit || 0),
    sort_order: 11
  },
  { 
    line: '11', 
    label: 'Current year Arizona tax liability', 
    field: 'azTaxLiability', 
    editable: true, 
    sort_order: 12
  },
  { 
    line: '12', 
    label: 'Excess credit (Line 10 - Line 11, if positive)', 
    field: 'azExcessCredit', 
    editable: false, 
    calc: (data: Record<string, number>) => Math.max((data.azTotalCredit || 0) - (data.azTaxLiability || 0), 0),
    sort_order: 13
  },
  { 
    line: '13', 
    label: 'Refundable portion (75% of Line 12, if qualified)', 
    field: 'azRefundableCredit', 
    editable: true,
    sort_order: 14
  },
  { 
    line: '14', 
    label: 'Net credit used this year', 
    field: 'azFinalCredit', 
    editable: false, 
    calc: (data: Record<string, number>) => Math.min((data.azTotalCredit || 0), (data.azTaxLiability || 0)) + (data.azRefundableCredit || 0),
    sort_order: 15
  },
];

// Alternative Simplified Credit (ASC) method - introduced in 2023
export const AZ_ALTERNATIVE_LINES: StateProFormaLine[] = [
  {
    line: '1',
    label: 'Current year Arizona qualified research expenses',
    field: 'azAscCurrentQRE',
    editable: true,
    calc: (data: Record<string, number>) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    sort_order: 1
  },
  {
    line: '2',
    label: 'Average Arizona QREs for the prior 3 years',
    field: 'azAscAverage3Year',
    editable: true,
    sort_order: 2
  },
  {
    line: '3',
    label: 'Incremental QRE for ASC (Line 1 - Line 2, if positive)',
    field: 'azAscIncrementalQRE',
    editable: false,
    calc: (data: Record<string, number>) => Math.max((data.azAscCurrentQRE || 0) - (data.azAscAverage3Year || 0), 0),
    sort_order: 3
  },
  {
    line: '4a',
    label: 'ASC credit on first $2,500,000 (Line 3 × 24%, capped at $2.5M)',
    field: 'azAscCredit1',
    editable: false,
    calc: (data: Record<string, number>) => Math.min((data.azAscIncrementalQRE || 0), 2500000) * 0.24,
    sort_order: 4
  },
  {
    line: '4b',
    label: 'ASC credit on amount over $2,500,000 (excess × 15%)',
    field: 'azAscCredit2',
    editable: false,
    calc: (data: Record<string, number>) => Math.max((data.azAscIncrementalQRE || 0) - 2500000, 0) * 0.15,
    sort_order: 5
  },
  {
    line: '5',
    label: 'Total ASC credit (Line 4a + Line 4b)',
    field: 'azAltCredit',
    editable: false,
    calc: (data: Record<string, number>) => (data.azAscCredit1 || 0) + (data.azAscCredit2 || 0),
    sort_order: 6
  }
];

export const azConfig = {
  state: 'AZ',
  name: 'Arizona',
  forms: {
    standard: {
      name: "Form 308 (Corporations) / Form 308-I (Individuals)",
      method: "standard",
      lines: AZ_PROFORMA_LINES
    },
    alternative: {
      name: "Alternative Simplified Credit (ASC) Method",
      method: "alternative",
      lines: AZ_ALTERNATIVE_LINES
    }
  },
  hasAlternativeMethod: true,
  creditRate: "24% (first $2.5M) / 15% (over $2.5M) + 10% (university research)",
  creditType: "incremental_with_tiered_rates_plus_university_bonus",
  formReference: "AZ Form 308 (Corps) / Form 308-I (Individuals) / Form 346 (University)",
  validationRules: [
    {
      type: "entity_eligibility",
      value: "Individuals, Corporations, S-Corps, Partnerships, LLCs",
      message: "Available to individuals and businesses subject to Arizona income tax"
    },
    {
      type: "arizona_research_requirement",
      value: "Arizona research required",
      message: "Research activities must be conducted within Arizona"
    },
    {
      type: "carryforward_limit",
      value: "10 years (after 2021), 15 years (before 2022)",
      message: "Unused credits may be carried forward for 10 years (tax years after 2021)"
    },
    {
      type: "refundable_component",
      value: "75% refundable for qualified small businesses",
      message: "Companies with <150 employees can receive 75% refund of excess credit"
    },
    {
      type: "refundable_caps",
      value: "$5M statewide, $100K per taxpayer",
      message: "Refundable credit capped at $5M annually statewide, $100K per taxpayer"
    },
    {
      type: "university_credit",
      value: "Additional 10% for university research",
      message: "Additional 10% credit for basic research payments to Arizona universities"
    },
    {
      type: "university_cap",
      value: "$10M annual cap for university credits",
      message: "University research credit capped at $10M annually statewide"
    },
    {
      type: "application_requirements",
      value: "ACA certification required for refunds and university credits",
      message: "Must apply to Arizona Commerce Authority for refundable portion and university credit certification"
    }
  ],
  alternativeValidationRules: [
    {
      type: "asc_method",
      value: "Available for tax years 2023+",
      message: "Alternative Simplified Credit method available starting tax year 2023"
    },
    {
      type: "asc_eligibility",
      value: "Must have QREs in at least one of prior 3 years",
      message: "ASC method not available if no QREs in any of the 3 prior taxable years"
    },
    {
      type: "same_rates",
      value: "24%/15% rates apply to ASC method",
      message: "ASC method uses same tiered rates as regular method"
    }
  ],
  notes: [
    "Arizona offers one of the most generous R&D credit systems in the US:",
    "• GENERAL CREDIT: 24% on first $2.5M + 15% on excess incremental QRE",
    "• UNIVERSITY CREDIT: Additional 10% on basic research payments to Arizona universities",
    "• REFUNDABLE COMPONENT: 75% of excess credit refundable for small businesses (<150 employees)",
    "• TWO CALCULATION METHODS: Regular method (federal Section 41) or Alternative Simplified Credit (ASC)",
    "• Research must be conducted within Arizona",
    "• Available to individuals (Form 308-I), corporations (Form 308), partnerships, S-corps, LLCs",
    "• Carryforward: 10 years for tax years after 2021 (was 15 years before 2022)",
    "",
    "REFUNDABLE CREDIT REQUIREMENTS:",
    "• Must employ fewer than 150 full-time employees worldwide",
    "• Must apply to Arizona Commerce Authority (ACA) BEFORE filing tax return",
    "• $5 million annual cap statewide (first-come, first-served)",
    "• $100,000 maximum per taxpayer per year",
    "• 1% processing fee required",
    "",
    "UNIVERSITY RESEARCH CREDIT:",
    "• 10% credit on basic research payments to ASU, NAU, University of Arizona",
    "• Must receive ACA certification AND ADOR approval",
    "• $10 million annual cap for university credits",
    "• Non-refundable, 5-year carryforward",
    "",
    "ASC METHOD (2023+):",
    "• Credit = 24%/15% of (current year QRE - average of prior 3 years QRE)",
    "• Not available if no QREs in any of the 3 prior years",
    "• Same refundable and university credit opportunities"
  ]
}; 