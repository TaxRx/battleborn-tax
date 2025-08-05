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
      value: "myPATH system",
      message: "Must apply through PA Department of Revenue's myPATH online system"
    },
    {
      type: "application_window",
      value: "August 1 - December 1",
      message: "Applications must be submitted between August 1 and December 1 annually"
    },
    {
      type: "entity_type_eligibility",
      value: "Businesses and individuals",
      message: "Available to businesses and individuals subject to PA Corporate Net Income Tax or Personal Income Tax"
    },
    {
      type: "minimum_history",
      value: "2 years",
      message: "Must have at least 2 years of R&D expenditure history"
    },
    {
      type: "pennsylvania_requirement",
      value: "PA research required",
      message: "Research must be conducted within Pennsylvania"
    },
    {
      type: "project_description",
      value: "4-part test required",
      message: "Must provide detailed project descriptions meeting 4-part qualification test"
    },
    {
      type: "tax_clearance",
      value: "Compliance required",
      message: "Must be compliant with all PA tax reporting and payment requirements"
    },
    {
      type: "transferable",
      value: "Credits can be sold",
      message: "R&D tax credits may be sold to other taxpayers (subject to approval)"
    }
  ],
  notes: [
    "Pennsylvania R&D Credit is APPLICATION-BASED, not automatically calculated:",
    "• Application window: August 1 - December 1 annually",
    "• Apply through PA Department of Revenue's myPATH online system",
    "• Must have at least 2 years of R&D expenditure history",
    "• Requires detailed project descriptions meeting 4-part test:",
    "  - Elimination of uncertainty",
    "  - Process of experimentation", 
    "  - Technological in nature",
    "  - Qualified purpose information",
    "• Must provide Federal Form 6765 information (if filed)",
    "• Research must be conducted within Pennsylvania",
    "• Tax clearance required - must be compliant with all PA tax obligations",
    "• Credits are awarded at variable amounts (not fixed percentage)",
    "• Awarded credits can be sold/transferred (subject to approval)",
    "• Credits claimed on PA Schedule OC (Other Credits), Line 2",
    "• Created by Act 7 of 1997 under Article XVII-B of Tax Reform Code"
  ]
}; 