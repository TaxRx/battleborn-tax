import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const OH_PROFORMA_LINES = [
  // --- OH Commercial Activity Tax R&D Credit (Section 5751.51) ---
  // IMPORTANT: This is a credit against Commercial Activity Tax, NOT income tax
  
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
    label: 'Ohio qualified research expenses for current calendar year', 
    field: 'ohCurrentYearQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    line_type: 'calculated',
    sort_order: 1
  },
  { 
    line: '2', 
    label: 'Ohio QRE for 1st prior calendar year', 
    field: 'ohPriorYear1QRE', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    sort_order: 2
  },
  { 
    line: '3', 
    label: 'Ohio QRE for 2nd prior calendar year', 
    field: 'ohPriorYear2QRE', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    sort_order: 3
  },
  { 
    line: '4', 
    label: 'Ohio QRE for 3rd prior calendar year', 
    field: 'ohPriorYear3QRE', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    sort_order: 4
  },
  { 
    line: '5', 
    label: 'Average annual Ohio QRE for 3 preceding calendar years (Lines 2+3+4 ÷ 3)', 
    field: 'ohBaseAmount', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => ((data.ohPriorYear1QRE || 0) + (data.ohPriorYear2QRE || 0) + (data.ohPriorYear3QRE || 0)) / 3,
    line_type: 'calculated',
    sort_order: 5
  },
  { 
    line: '6', 
    label: 'Incremental Ohio QRE (Line 1 - Line 5, but not less than zero)', 
    field: 'ohIncrementalQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => Math.max((data.ohCurrentYearQRE || 0) - (data.ohBaseAmount || 0), 0),
    line_type: 'calculated',
    sort_order: 6
  },
  { 
    line: '7', 
    label: 'Ohio CAT R&D credit (Line 6 × 7%)', 
    field: 'ohFinalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.ohIncrementalQRE || 0) * 0.07,
    line_type: 'calculated',
    sort_order: 7
  },
];

export const ohConfig = {
  state: 'OH',
  name: 'Ohio',
  forms: {
    standard: {
      name: 'OH Commercial Activity Tax R&D Credit',
      method: 'standard',
      lines: OH_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.07,
  creditType: "incremental",
  formReference: "OH Section 5751.51 (Commercial Activity Tax)",
  validationRules: [
    {
      type: "tax_type",
      value: "Commercial Activity Tax",
      message: "Credit applies against Ohio Commercial Activity Tax, NOT income tax"
    },
    {
      type: "carryforward_limit",
      value: 7,
      message: "Unused credits may be carried forward for up to 7 years"
    },
    {
      type: "entity_type_restriction",
      value: "CAT taxpayers",
      message: "Available to taxpayers subject to Ohio Commercial Activity Tax"
    },
    {
      type: "calendar_year_basis",
      value: "Calendar year",
      message: "Credit calculated based on calendar year expenses, regardless of tax year"
    },
    {
      type: "qualified_expenses",
      value: "IRC Section 41",
      message: "Qualified research expenses must meet same criteria as federal credit under IRC Section 41"
    },
    {
      type: "ohio_requirement",
      value: "Ohio research required",
      message: "Research activities must be conducted in Ohio to qualify"
    },
    {
      type: "base_calculation",
      value: "3-year average",
      message: "Base amount is average of Ohio QRE for 3 preceding calendar years"
    }
  ],
  notes: [
    "IMPORTANT: This is a Commercial Activity Tax (CAT) credit, NOT an income tax credit",
    "• Credit equals 7% of Ohio QRE above 3-year base amount",
    "• Must be calculated on calendar year basis regardless of taxpayer's tax year",
    "• Only Ohio-based qualified research expenses count toward the credit",
    "• Credit is nonrefundable and cannot reduce CAT minimum tax",
    "• Up to 7-year carryforward period for unused credits",
    "• Must meet same QRE criteria as federal R&D credit under IRC Section 41",
    "• Base amount calculated as simple 3-year average (not fixed-base percentage method)",
    "• Credit claimed on CAT return, subject to credit ordering rules in Section 5751.98"
  ]
}; 