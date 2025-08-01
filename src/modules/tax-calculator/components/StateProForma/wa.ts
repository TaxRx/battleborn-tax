import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const WA_PROFORMA_LINES = [
  // --- WASHINGTON STATE R&D INCENTIVES ---
  // IMPORTANT: Washington has NO standalone R&D credit (no state income tax)
  // Available incentives are sales tax exemptions and industry-specific programs
  
  { line: 'INFO', label: 'Washington State has no standalone R&D tax credit', field: 'waNoCredit', editable: false, method: 'standard', sort_order: 1 },
  { line: '1', label: 'Sales & Use Tax Exemption: M&E for R&D Operations (6.5% + local)', field: 'waSalesTaxSavings', editable: true, method: 'standard', sort_order: 2 },
  { line: '2', label: 'Aerospace R&D Credit: B&O credit for preproduction development', field: 'waAerospaceRD', editable: true, method: 'standard', sort_order: 3 },
  { line: '3', label: 'Rural County R&D Employment Credit: $3,000 per new R&D employee', field: 'waRuralRDCredit', editable: true, method: 'standard', sort_order: 4 },
  { line: '4', label: 'Clean Technology Investment Deferral: Sales tax deferral for clean tech R&D', field: 'waCleanTechDeferral', editable: true, method: 'standard', sort_order: 5 },
  { line: '5', label: 'Total estimated Washington R&D tax savings', field: 'waFinalCredit', editable: true, method: 'standard', sort_order: 6 },
];

export const waConfig = {
  state: 'WA',
  name: 'Washington',
  forms: {
    standard: {
      name: 'Washington R&D Incentives (No Standalone Credit Available)',
      method: 'standard',
      lines: WA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
  },
  hasAlternativeMethod: false,
  creditRate: "No standalone R&D credit - Sales tax exemptions only",
  creditType: "sales_tax_exemptions_and_industry_specific_incentives",
  formReference: "Various Forms - No General R&D Credit Form",
  validationRules: [
    {
      type: "no_standalone_credit",
      value: "Washington has no state income tax",
      message: "Washington cannot offer income tax credits because it has no state income tax"
    },
    {
      type: "sales_tax_exemption_available",
      value: "M&E Sales & Use Tax Exemption (RCW 82.08.02565)",
      message: "Sales & use tax exemption available for machinery & equipment used directly in R&D operations"
    },
    {
      type: "terrapower_case",
      value: "Terrapower decision clarifies M&E exemption for R&D",
      message: "2022 Board of Tax Appeals decision confirms M&E exemption applies to R&D even without manufacturing for sale"
    },
    {
      type: "aerospace_rd_credit",
      value: "Aerospace R&D B&O credit available",
      message: "B&O tax credit for preproduction development expenditures in aerospace industry (RCW 82.04.4461)"
    },
    {
      type: "rural_employment_credit",
      value: "$3,000 per new R&D employee in rural counties",
      message: "B&O tax credit for new R&D employees in rural counties or CEZ (RCW 82.04.4452)"
    },
    {
      type: "clean_tech_deferrals",
      value: "Clean technology investment deferrals",
      message: "Sales tax deferrals available for clean energy investment projects including R&D facilities"
    },
    {
      type: "business_structure",
      value: "B&O tax system (gross receipts)",
      message: "Washington uses Business & Occupation tax (gross receipts) instead of income tax"
    }
  ],
  notes: [
    "⚠️ IMPORTANT: Washington State has NO standalone R&D tax credit",
    "Washington has no state income tax, so no income tax credits are available",
    "",
    "AVAILABLE R&D INCENTIVES:",
    "",
    "1. SALES & USE TAX EXEMPTION FOR M&E (Primary R&D Incentive):",
    "• Exemption from 6.5% state + local sales tax on machinery & equipment",
    "• Must be used directly in R&D operations by manufacturers",
    "• Clarified by 2022 Terrapower case - no requirement to manufacture for sale",
    "• Use Manufacturers' Sales and Use Tax Exemption Certificate",
    "• Significant savings on lab equipment, computers, software, etc.",
    "",
    "2. AEROSPACE R&D CREDIT (Industry-Specific):",
    "• B&O tax credit for preproduction development expenditures",
    "• Available to manufacturers of commercial airplanes/components",
    "• Available to aerospace product developers and FAR repair stations",
    "• Electronic filing required, Annual Tax Performance Report due May 31",
    "",
    "3. RURAL COUNTY R&D EMPLOYMENT CREDIT:",
    "• $3,000 B&O tax credit per new full-time R&D employee",
    "• Must be in rural county or Community Empowerment Zone",
    "• Requires 15% increase in employment at facility",
    "• Available to R&D facilities and commercial testing facilities",
    "",
    "4. CLEAN TECHNOLOGY INVESTMENT DEFERRALS:",
    "• Sales tax deferrals for clean energy investment projects",
    "• Includes R&D facilities for renewable energy storage",
    "• $2 million minimum investment required",
    "• Potential tax reductions based on labor standards compliance",
    "",
    "5. MANUFACTURING & R&D DEFERRAL (Qualifying Counties):",
    "• Sales tax deferral for counties with population < 650,000",
    "• Up to $400,000 in deferred taxes per applicant",
    "• Available for qualified buildings and machinery & equipment",
    "",
    "TAX STRUCTURE DIFFERENCES:",
    "• Washington uses Business & Occupation (B&O) tax on gross receipts",
    "• No state income tax = no income tax credits available",
    "• Focus on sales tax incentives and industry-specific programs",
    "• Some B&O tax credits available for specific activities/locations",
    "",
    "APPLICATION REQUIREMENTS:",
    "• M&E exemption: Use exemption certificate, no application required",
    "• Aerospace credit: No application, but electronic filing required",
    "• Rural employment: No application, maintain employment records",
    "• Clean tech deferral: Application required before construction",
    "",
    "For more information: Washington Department of Revenue Tax Incentives"
  ]
}; 