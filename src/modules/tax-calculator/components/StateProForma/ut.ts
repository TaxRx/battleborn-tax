import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const UT_PROFORMA_LINES = [
  // --- UT Research Activities Credit (UC §59-10-1012) ---
  // Utah has THREE separate credits that can be claimed simultaneously
  
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
  
  // PART 1: INCREMENTAL CREDIT (5% above base amount - 14 year carryforward)
  { 
    line: '1', 
    label: 'Qualified research expenses for the current year (wages, supplies, contract research)', 
    field: 'utQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    line_type: 'calculated',
    sort_order: 1
  },
  { 
    line: '2a', 
    label: 'Utah gross receipts - 4 years prior (auto-populated from Business Setup)', 
    field: 'grossReceipts4Prior', 
    editable: true, 
    method: 'standard',
    calc: (data: StateCreditBaseData) => data.grossReceipts4Prior || 0,
    line_type: 'calculated',
    sort_order: 2.1
  },
  { 
    line: '2b', 
    label: 'Utah gross receipts - 3 years prior (auto-populated from Business Setup)', 
    field: 'grossReceipts3Prior', 
    editable: true, 
    method: 'standard',
    calc: (data: StateCreditBaseData) => data.grossReceipts3Prior || 0,
    line_type: 'calculated',
    sort_order: 2.2
  },
  { 
    line: '2c', 
    label: 'Utah gross receipts - 2 years prior (auto-populated from Business Setup)', 
    field: 'grossReceipts2Prior', 
    editable: true, 
    method: 'standard',
    calc: (data: StateCreditBaseData) => data.grossReceipts2Prior || 0,
    line_type: 'calculated',
    sort_order: 2.3
  },
  { 
    line: '2d', 
    label: 'Utah gross receipts - 1 year prior (auto-populated from Business Setup)', 
    field: 'grossReceipts1Prior', 
    editable: true, 
    method: 'standard',
    calc: (data: StateCreditBaseData) => data.grossReceipts1Prior || 0,
    line_type: 'calculated',
    sort_order: 2.4
  },
  { 
    line: '3', 
    label: 'Average Utah gross receipts for 4 prior years (auto-calculated)', 
    field: 'avgGrossReceipts', 
    editable: true, 
    method: 'standard',
    calc: (data: any) => {
      const year4 = data.grossReceipts4Prior || 0;
      const year3 = data.grossReceipts3Prior || 0;
      const year2 = data.grossReceipts2Prior || 0;
      const year1 = data.grossReceipts1Prior || 0;
      return (year4 + year3 + year2 + year1) / 4;
    },
    line_type: 'calculated',
    sort_order: 3
  },
  { 
    line: '4', 
    label: 'Fixed-base percentage (3% for most taxpayers)', 
    field: 'utFixedBasePercent', 
    editable: true, 
    method: 'standard',
    defaultValue: 3,
    type: 'percentage',
    line_type: 'input',
    sort_order: 4
  },
  { 
    line: '5', 
    label: 'Base amount (Line 3 × Line 4)', 
    field: 'utBaseAmount', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.avgGrossReceipts || 0) * ((data.utFixedBasePercent || 3) / 100),
    line_type: 'calculated',
    sort_order: 5
  },
  { 
    line: '6', 
    label: 'Incremental qualified research expenses (Line 1 - Line 5)', 
    field: 'utIncrementalQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => Math.max(0, (data.utQRE || 0) - (data.utBaseAmount || 0)),
    line_type: 'calculated',
    sort_order: 6
  },
  { 
    line: '7', 
    label: 'Incremental credit (Line 6 × 5%) - 14 year carryforward', 
    field: 'utIncrementalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.utIncrementalQRE || 0) * 0.05,
    line_type: 'calculated',
    sort_order: 7
  },
  
  // PART 2: BASIC RESEARCH CREDIT (5% above base amount - 14 year carryforward)
  { 
    line: '8', 
    label: 'Payments to qualified organizations for basic research in Utah', 
    field: 'utBasicResearchPayments', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    sort_order: 8
  },
  { 
    line: '9', 
    label: 'Base period amount for basic research payments', 
    field: 'utBasicResearchBase', 
    editable: true, 
    method: 'standard',
    line_type: 'input',
    sort_order: 9
  },
  { 
    line: '10', 
    label: 'Incremental basic research payments (Line 8 - Line 9)', 
    field: 'utIncrementalBasicResearch', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => Math.max(0, (data.utBasicResearchPayments || 0) - (data.utBasicResearchBase || 0)),
    line_type: 'calculated',
    sort_order: 10
  },
  { 
    line: '11', 
    label: 'Basic research credit (Line 10 × 5%) - 14 year carryforward', 
    field: 'utBasicResearchCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.utIncrementalBasicResearch || 0) * 0.05,
    line_type: 'calculated',
    sort_order: 11
  },
  
  // PART 3: TOTAL CREDIT (7.5% of all QRE - NO carryforward)
  { 
    line: '12', 
    label: 'Total credit (Line 1 × 7.5%) - NO carryforward allowed', 
    field: 'utTotalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.utQRE || 0) * 0.075,
    line_type: 'calculated',
    sort_order: 12
  },
  
  // FINAL TOTAL
  { 
    line: '13', 
    label: 'Total Utah R&D credits (Lines 7 + 11 + 12)', 
    field: 'utFinalCredit', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.utIncrementalCredit || 0) + (data.utBasicResearchCredit || 0) + (data.utTotalCredit || 0),
    line_type: 'calculated',
    sort_order: 13
  },
];

// Alternative Simplified Credit (ASC) method - Utah allows this but not AIC
export const UT_ALTERNATIVE_LINES = [
  // Auto-populate from QRE data
  {
    line: 'wages',
    label: 'Qualified wages',
    field: 'wages',
    editable: true,
    method: 'alternative',
    sort_order: 0.1
  },
  {
    line: 'supplies',
    label: 'Qualified supplies',
    field: 'supplies',
    editable: true,
    method: 'alternative',
    sort_order: 0.2
  },
  {
    line: 'contract',
    label: 'Contract research',
    field: 'contractResearch',
    editable: true,
    method: 'alternative',
    sort_order: 0.3
  },
  
  // ASC METHOD CALCULATION
  { 
    line: 'ASC1', 
    label: 'Current year Utah qualified research expenses', 
    field: 'utCurrentQRE', 
    editable: false, 
    method: 'alternative', 
    calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
    line_type: 'calculated',
    sort_order: 1
  },
  { 
    line: 'ASC2a', 
    label: 'Utah QRE - 3 years prior (auto-populated from Business Setup)', 
    field: 'utQRE3Prior', 
    editable: true, 
    method: 'alternative',
    calc: (data: StateCreditBaseData) => data.qre3Prior || 0,
    line_type: 'calculated',
    sort_order: 2.1
  },
  { 
    line: 'ASC2b', 
    label: 'Utah QRE - 2 years prior (auto-populated from Business Setup)', 
    field: 'utQRE2Prior', 
    editable: true, 
    method: 'alternative',
    calc: (data: StateCreditBaseData) => data.qre2Prior || 0,
    line_type: 'calculated',
    sort_order: 2.2
  },
  { 
    line: 'ASC2c', 
    label: 'Utah QRE - 1 year prior (auto-populated from Business Setup)', 
    field: 'utQRE1Prior', 
    editable: true, 
    method: 'alternative',
    calc: (data: StateCreditBaseData) => data.qre1Prior || 0,
    line_type: 'calculated',
    sort_order: 2.3
  },
  { 
    line: 'ASC2', 
    label: 'Average Utah QRE for prior 3 years (Lines ASC2a + ASC2b + ASC2c) ÷ 3', 
    field: 'utAverageQRE3Years', 
    editable: false, 
    method: 'alternative',
    calc: (data: any) => {
      const year3 = data.utQRE3Prior || 0;
      const year2 = data.utQRE2Prior || 0;
      const year1 = data.utQRE1Prior || 0;
      return (year3 + year2 + year1) / 3;
    },
    line_type: 'calculated',
    sort_order: 2.4
  },
  { 
    line: 'ASC3', 
    label: 'ASC incremental QRE (Current year QRE - Average prior 3 years QRE)', 
    field: 'utASCIncrementalQRE', 
    editable: false, 
    method: 'alternative', 
    calc: (data: any) => Math.max(0, (data.utCurrentQRE || 0) - (data.utAverageQRE3Years || 0)),
    line_type: 'calculated',
    sort_order: 3
  },
  { 
    line: 'ASC4', 
    label: 'ASC incremental credit (ASC incremental QRE × 14%) - 14 year carryforward', 
    field: 'utASCIncrementalCredit', 
    editable: false, 
    method: 'alternative', 
    calc: (data: any) => (data.utASCIncrementalQRE || 0) * 0.14,
    line_type: 'calculated',
    sort_order: 4
  },
  
  // BASIC RESEARCH CREDIT (same as standard method)
  { 
    line: 'ASC5', 
    label: 'Payments to qualified organizations for basic research in Utah', 
    field: 'utBasicResearchPayments', 
    editable: true, 
    method: 'alternative',
    line_type: 'input',
    sort_order: 5
  },
  { 
    line: 'ASC6', 
    label: 'Base period amount for basic research payments', 
    field: 'utBasicResearchBase', 
    editable: true, 
    method: 'alternative',
    line_type: 'input',
    sort_order: 6
  },
  { 
    line: 'ASC7', 
    label: 'Incremental basic research payments (Line ASC5 - Line ASC6)', 
    field: 'utIncrementalBasicResearch', 
    editable: false, 
    method: 'alternative', 
    calc: (data: any) => Math.max(0, (data.utBasicResearchPayments || 0) - (data.utBasicResearchBase || 0)),
    line_type: 'calculated',
    sort_order: 7
  },
  { 
    line: 'ASC8', 
    label: 'Basic research credit (Line ASC7 × 5%) - 14 year carryforward', 
    field: 'utBasicResearchCredit', 
    editable: false, 
    method: 'alternative', 
    calc: (data: any) => (data.utIncrementalBasicResearch || 0) * 0.05,
    line_type: 'calculated',
    sort_order: 8
  },
  
  // TOTAL CREDIT (same as standard method)
  { 
    line: 'ASC9', 
    label: 'Total credit (Current year QRE × 7.5%) - NO carryforward allowed', 
    field: 'utTotalCredit', 
    editable: false, 
    method: 'alternative', 
    calc: (data: any) => (data.utCurrentQRE || 0) * 0.075,
    line_type: 'calculated',
    sort_order: 9
  },
  
  // FINAL TOTAL
  { 
    line: 'ASC10', 
    label: 'Total Utah R&D credits - ASC method (Lines ASC4 + ASC8 + ASC9)', 
    field: 'utAltCredit', 
    editable: false, 
    method: 'alternative', 
    calc: (data: any) => (data.utASCIncrementalCredit || 0) + (data.utBasicResearchCredit || 0) + (data.utTotalCredit || 0),
    line_type: 'calculated',
    sort_order: 10
  },
];

export const utConfig = {
  state: 'UT',
  name: 'Utah',
  forms: {
    standard: {
      name: 'UT Form TC-20 - Research and Development Credit (Regular Method)',
      method: 'standard',
      lines: UT_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
    alternative: {
      name: 'UT Form TC-20 - Research and Development Credit (Alternative Simplified Credit)',
      method: 'alternative',
      lines: UT_ALTERNATIVE_LINES,
    },
  },
  hasAlternativeMethod: true,
  creditRate: [0.05, 0.075, 0.14], // Incremental (5%), total (7.5%), and ASC (14%) rates
  creditType: "dual_incremental_and_total",
  formReference: "Utah Code §59-10-1012 and Form TC-20",
  validationRules: [
    {
      type: "carryforward_limit",
      value: 14,
      message: "Incremental and basic research credits may be carried forward for up to 14 years"
    },
    {
      type: "entity_type_restriction", 
      value: "All entities",
      message: "Available to all entities with Utah source income"
    },
    {
      type: "location_requirement",
      value: "Utah research required",
      message: "Research activities must be conducted in Utah"
    },
    {
      type: "federal_compliance",
      value: "IRC Section 41",
      message: "Must meet federal R&D credit requirements under IRC Section 41"
    },
    {
      type: "method_election",
      value: "Regular or ASC", 
      message: "Choose Regular Credit or Alternative Simplified Credit (ASC) method"
    }
  ],
  // Entity type requirements
  entityRequirements: {
    allowedEntityTypes: ["Corporation", "S-Corp", "Partnership", "LLC", "Individual"],
    restrictedEntityTypes: [],
    requiresApplication: false,
    requiresPreapproval: false,
    defaultEnabled: true
  },
  notes: [
    "Utah offers THREE R&D credits that can be claimed simultaneously: Incremental (5%), Basic Research (5%), and Total Credit (7.5%)",
    "Choose either Regular method (base amount calculation) or ASC method (simpler 3-year average)",
    "Incremental and Basic Research credits have 14-year carryforward; Total Credit has NO carryforward",
    "Research must be conducted in Utah; credits offset Utah income tax liability only",
    "File Form TC-20 and report on Form TC-40A using code 12"
  ]
}; 