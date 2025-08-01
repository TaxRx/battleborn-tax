import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const MI_PROFORMA_LINES = [
  // --- MICHIGAN R&D CREDIT (Effective January 1, 2025) ---
  // NEW: First Michigan R&D credit since 2012!
  
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
  
  // --- PART 1: BASIC CALCULATIONS ---
  { 
    line: '1', 
    label: 'Current year Michigan qualified research expenses', 
    field: 'miCurrentYearQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0), 
    sort_order: 1 
  },
  { line: '2', label: 'Average Michigan QRE for prior 3 calendar years', field: 'miBaseAmount', editable: true, method: 'standard', sort_order: 2 },
  { line: '3', label: 'Incremental Michigan QRE (Line 1 - Line 2, if positive)', field: 'miIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.miCurrentYearQRE || 0) - (data.miBaseAmount || 0), 0), sort_order: 3 },
  { line: '4', label: 'Number of total employees (determines rate tier)', field: 'miEmployeeCount', editable: true, method: 'standard', sort_order: 4 },
  
  // --- PART 2: CREDIT CALCULATION BY BUSINESS SIZE ---
  { line: '5a', label: 'Credit on base amount (Line 2 × 3%)', field: 'miBaseCr', editable: false, method: 'standard', calc: (data: any) => (data.miBaseAmount || 0) * 0.03, sort_order: 5 },
  { line: '5b', label: 'Large business credit on incremental (Line 3 × 10% if ≥250 employees)', field: 'miLargeCr', editable: true, method: 'standard', sort_order: 6 },
  { line: '5c', label: 'Small business credit on incremental (Line 3 × 15% if <250 employees)', field: 'miSmallCr', editable: true, method: 'standard', sort_order: 7 },
  { line: '6', label: 'Total base credit (Line 5a + higher of 5b or 5c)', field: 'miBaseCredit', editable: false, method: 'standard', calc: (data: any) => (data.miBaseCr || 0) + Math.max((data.miLargeCr || 0), (data.miSmallCr || 0)), sort_order: 8 },
  
  // --- PART 3: UNIVERSITY COLLABORATION BONUS ---
  { line: '7', label: 'Michigan university collaboration QRE', field: 'miUniversityQRE', editable: true, method: 'standard', sort_order: 9 },
  { line: '8', label: 'University collaboration credit (Line 7 × 5%, max $200,000)', field: 'miUniversityCredit', editable: false, method: 'standard', calc: (data: any) => Math.min((data.miUniversityQRE || 0) * 0.05, 200000), sort_order: 10 },
  
  // --- PART 4: FINAL CREDIT CALCULATION ---
  { line: '9', label: 'Total Michigan R&D credit before caps (Line 6 + Line 8)', field: 'miTotalBeforeCaps', editable: false, method: 'standard', calc: (data: any) => (data.miBaseCredit || 0) + (data.miUniversityCredit || 0), sort_order: 11 },
  { line: '10', label: 'Annual credit cap ($2M large / $250K small)', field: 'miCreditCap', editable: true, method: 'standard', sort_order: 12 },
  { line: '11', label: 'Final Michigan R&D credit (lesser of Line 9 or Line 10)', field: 'miFinalCredit', editable: false, method: 'standard', calc: (data: any) => Math.min((data.miTotalBeforeCaps || 0), (data.miCreditCap || 250000)), sort_order: 13 },
];

export const miConfig = {
  state: 'MI',
  name: 'Michigan',
  forms: {
    standard: {
      name: 'Michigan R&D Credit (HB 5100/5101) - Tentative Claim Required',
      method: 'standard',
      lines: MI_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: "3% base + 10%/15% incremental + 5% university",
  creditType: "incremental_with_employee_tiers_and_university_bonus",
  formReference: "Michigan R&D Credit - Tentative Claim Application Required",
  validationRules: [
    {
      type: "new_credit_2025",
      value: "Effective January 1, 2025",
      message: "Brand new Michigan R&D credit - first since 2012! Effective for tax years beginning on/after January 1, 2025"
    },
    {
      type: "employee_threshold",
      value: "250 employees determines rate tier",
      message: "Large businesses (≥250 employees): 3% base + 10% incremental. Small businesses (<250): 3% base + 15% incremental"
    },
    {
      type: "annual_caps",
      value: "$2M large / $250K small",
      message: "Annual credit caps: $2,000,000 (large businesses), $250,000 (small businesses)"
    },
    {
      type: "university_bonus",
      value: "Additional 5% for university collaboration",
      message: "Additional 5% credit for research with Michigan universities, capped at $200,000 per year"
    },
    {
      type: "statewide_caps",
      value: "$100M total ($75M large + $25M small)",
      message: "Statewide annual caps: $100M total ($75M for large businesses, $25M for small businesses)"
    },
    {
      type: "refundable_credit",
      value: "REFUNDABLE credit",
      message: "Michigan R&D credit is refundable - excess credit above tax liability will be refunded"
    },
    {
      type: "tentative_claim_required",
      value: "Tentative claim deadline: April 1, 2026 (2025 expenses)",
      message: "Must file tentative claim by April 1, 2026 for 2025 expenses, March 15 for subsequent years"
    },
    {
      type: "proration_system",
      value: "Pro-rata reduction if claims exceed caps",
      message: "If total claims exceed statewide caps, all credits will be prorated down proportionally"
    },
    {
      type: "calendar_year_basis",
      value: "QRE calculated on calendar year basis",
      message: "All QRE calculations based on calendar year, regardless of taxpayer's fiscal year"
    },
    {
      type: "entity_eligibility",
      value: "Corporations and eligible flow-through entities",
      message: "Available to corporations and eligible flow-through entities (not disregarded entities or those electing MBT)"
    },
    {
      type: "base_amount_calculation",
      value: "3-year average of prior Michigan QRE",
      message: "Base amount = average of Michigan QRE for 3 preceding calendar years (zero if no prior expenses)"
    }
  ],
  notes: [
    "🎉 BRAND NEW: Michigan's first R&D credit since 2012!",
    "Effective January 1, 2025 for tax years beginning on/after that date",
    "",
    "CREDIT STRUCTURE:",
    "• Small businesses (<250 employees): 3% base + 15% incremental (max $250K)",
    "• Large businesses (≥250 employees): 3% base + 10% incremental (max $2M)",
    "• University collaboration: Additional 5% credit (max $200K)",
    "• REFUNDABLE: Excess credit above tax liability will be refunded",
    "",
    "STATEWIDE CAPS & PRORATION:",
    "• Total: $100 million annually ($75M large + $25M small)",
    "• If claims exceed caps, all credits prorated proportionally",
    "• Treasury will publish proration notice by April 30",
    "",
    "APPLICATION PROCESS:",
    "• Tentative claim REQUIRED by April 1, 2026 (for 2025 expenses)",
    "• March 15 deadline for subsequent years",
    "• Must use actual expenses, not estimates",
    "• CIT filers: Claim on annual return after tentative claim adjustment",
    "• Flow-through entities: Claim on withholding return",
    "",
    "QUALIFYING EXPENSES:",
    "• Same as federal IRC Section 41 but conducted in Michigan",
    "• Wages, supplies, contract research expenses",
    "• Calculated on calendar year basis (not fiscal year)",
    "• Base amount = 3-year average of prior Michigan QRE",
    "",
    "UNIVERSITY COLLABORATION:",
    "• Additional 5% credit for research with Michigan universities",
    "• Requires formal written agreement",
    "• Maximum $200,000 additional credit per year",
    "",
    "ENTITY ELIGIBILITY:",
    "• Corporations subject to Michigan Corporate Income Tax",
    "• Flow-through entities (excluding disregarded entities)",
    "• Entities electing MBT treatment are NOT eligible",
    "",
    "KEY FEATURES:",
    "• Michigan-specific base amount calculation (not federal)",
    "• No carryforward - unused credits expire (but refundable)",
    "• Research must be conducted within Michigan",
    "• Supports Michigan's innovation ecosystem development"
  ]
}; 