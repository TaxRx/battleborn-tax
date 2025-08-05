import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const PA_PROFORMA_LINES = [
  // --- PA R&D Tax Credit Application (myPATH System) ---
  // IMPORTANT: PA uses application-based awards, not automatic calculations
  { line: '1', label: 'Current year PA qualified research expenses (from Federal Form 6765)', field: 'paCurrentYearQRE', editable: true, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0), sort_order: 1 },
  { line: '2', label: 'Prior year PA qualified research expenses', field: 'paPriorYear1QRE', editable: true, method: 'standard', sort_order: 2 },
  { line: '3', label: 'Second prior year PA qualified research expenses', field: 'paPriorYear2QRE', editable: true, method: 'standard', sort_order: 3 },
  { line: '4', label: 'Third prior year PA qualified research expenses (if applicable)', field: 'paPriorYear3QRE', editable: true, method: 'standard', sort_order: 4 },
  { line: '5', label: 'Fourth prior year PA qualified research expenses (if applicable)', field: 'paPriorYear4QRE', editable: true, method: 'standard', sort_order: 5 },
  { line: '6', label: 'Total QRE to report in application', field: 'paTotalQRE', editable: false, method: 'standard', calc: (data: any) => (data.paCurrentYearQRE || 0) + (data.paPriorYear1QRE || 0) + (data.paPriorYear2QRE || 0) + (data.paPriorYear3QRE || 0) + (data.paPriorYear4QRE || 0), sort_order: 6 },
  { line: '7', label: 'R&D tax credit awarded by PA Department of Revenue', field: 'paAwardedCredit', editable: true, method: 'standard', sort_order: 7 },
  { line: '8', label: 'Amount of awarded credit claimed this year', field: 'paFinalCredit', editable: true, method: 'standard', sort_order: 8 },
];

export const paConfig = {
  state: 'PA',
  name: 'Pennsylvania',
  forms: {
    standard: {
      name: 'PA R&D Tax Credit Application (myPATH)',
      method: 'standard',
      lines: PA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: "Variable (award-based)",
  creditType: "application_based_award",
  formReference: "PA Schedule OC (Line 2) - myPATH Application",
  validationRules: [
    {
      type: "application_required",
      value: "myPATH system required",
      message: "Must apply through PA Department of Revenue's myPATH online system"
    },
    {
      type: "application_window",
      value: "August 1 - December 1",
      message: "Applications accepted August 1 - December 1 annually"
    },
    {
      type: "minimum_history",
      value: "2 years required",
      message: "Must have at least 2 years of R&D expenditure history"
    },
    {
      type: "pennsylvania_requirement",
      value: "PA research required",
      message: "Research must be conducted within Pennsylvania"
    },
    {
      type: "entity_type_eligibility",
      value: "All entities",
      message: "Available to businesses and individuals subject to PA taxes"
    }
  ],
  // Entity type requirements - application-based
  entityRequirements: {
    allowedEntityTypes: ["Corporation", "S-Corp", "Partnership", "LLC", "Individual"],
    restrictedEntityTypes: [],
    requiresApplication: true,
    requiresPreapproval: false,
    defaultEnabled: false,
    applicationWindow: "August 1 - December 1"
  },
  notes: [
    "APPLICATION-BASED credit (not automatically calculated) - apply through myPATH online system",
    "Application window: August 1 - December 1 annually",
    "Requires 2+ years R&D history and detailed project descriptions meeting 4-part qualification test",
    "Research must be conducted in Pennsylvania; tax clearance required",
    "Credits awarded at variable amounts and can be sold/transferred (subject to approval)"
  ]
}; 