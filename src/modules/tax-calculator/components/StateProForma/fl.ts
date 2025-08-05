import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const FL_PROFORMA_LINES = [
  // --- FL Corporate Income Tax R&D Credit (Section 220.196, F.S.) ---
  // IMPORTANT: Only available to qualified target industry businesses in specific sectors
  
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
    label: 'Total Florida qualified research expenses for current year', 
    field: 'flCurrentYearQRE', 
    editable: false, 
    method: 'standard', 
    calc: (data: any) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0), 
    sort_order: 1 
  },
  { line: '2', label: 'Florida QRE for 1st prior year', field: 'flPriorYear1QRE', editable: true, method: 'standard', sort_order: 2 },
  { line: '3', label: 'Florida QRE for 2nd prior year', field: 'flPriorYear2QRE', editable: true, method: 'standard', sort_order: 3 },
  { line: '4', label: 'Florida QRE for 3rd prior year', field: 'flPriorYear3QRE', editable: true, method: 'standard', sort_order: 4 },
  { line: '5', label: 'Florida QRE for 4th prior year', field: 'flPriorYear4QRE', editable: true, method: 'standard', sort_order: 5 },
  { line: '6', label: 'Base amount (average of Lines 2-5)', field: 'flBaseAmount', editable: false, method: 'standard', calc: (data: any) => ((data.flPriorYear1QRE || 0) + (data.flPriorYear2QRE || 0) + (data.flPriorYear3QRE || 0) + (data.flPriorYear4QRE || 0)) / 4, sort_order: 6 },
  { line: '7', label: 'Incremental QRE (Line 1 minus Line 6, but not less than zero)', field: 'flIncrementalQRE', editable: false, method: 'standard', calc: (data: any) => Math.max((data.flCurrentYearQRE || 0) - (data.flBaseAmount || 0), 0), sort_order: 7 },
  { line: '8', label: 'Florida R&D credit before limitations (Line 7 × 10%)', field: 'flCreditBeforeLimits', editable: false, method: 'standard', calc: (data: any) => (data.flIncrementalQRE || 0) * 0.10, sort_order: 8 },
  { line: '9', label: 'Allocated credit amount (after $9M statewide cap and proration)', field: 'flAllocatedCredit', editable: true, method: 'standard', sort_order: 9 },
  { line: '10', label: 'Final Florida R&D credit (lesser of Line 8 or allocated amount)', field: 'flFinalCredit', editable: false, method: 'standard', calc: (data: any) => Math.min((data.flCreditBeforeLimits || 0), (data.flAllocatedCredit || 0)), sort_order: 10 },
];

export const flConfig = {
  state: 'FL',
  name: 'Florida',
  forms: {
    standard: {
      name: 'FL Corporate Income Tax R&D Credit Application',
      method: 'standard',
      lines: FL_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.10,
  creditType: "incremental",
  formReference: "FL Section 220.196, F.S. & Rule 12C-1.0196, F.A.C.",
  validationRules: [
    {
      type: "entity_type_restriction",
      value: "C corporations only",
      message: "Available only to C corporations in qualified target industries"
    },
    {
      type: "certification_required",
      value: "Department of Commerce certification required",
      message: "Must obtain certification as qualified target industry business before applying"
    },
    {
      type: "application_window",
      value: "March 20-26 annually",
      message: "Application window is only 7 days per year (March 20-26)"
    },
    {
      type: "annual_cap",
      value: 9000000,
      message: "Statewide cap of $9 million - credits often prorated due to high demand"
    },
    {
      type: "max_credit",
      value: 50,
      message: "Limited to 50% of Florida corporate income tax liability"
    }
  ],
  // Entity type requirements - highly restrictive
  entityRequirements: {
    allowedEntityTypes: ["Corporation"],
    restrictedEntityTypes: ["Partnership", "LLC", "S-Corp", "Individual"],
    requiresApplication: true,
    requiresPreapproval: true,
    defaultEnabled: false,
    applicationWindow: "March 20-26",
    certificationRequired: "FL Department of Commerce"
  },
  notes: [
    "Highly restrictive: C corporations only in qualified target industries (Manufacturing, Life Sciences, IT, etc.)",
    "Must obtain FL Department of Commerce certification BEFORE applying",
    "Application window: March 20-26 annually (7 days only)",
    "Statewide cap of $9 million - credits often prorated due to high demand",
    "Credit equals 10% of Florida QRE above 4-year base amount, limited to 50% of tax liability"
  ]
}; 