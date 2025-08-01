import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const CT_PROFORMA_LINES = [
  // --- CT Standard Method (Form 1120 RDC) ---
  { line: '1', label: 'Enter the amount of Connecticut research and development expenses for the 2021 income year. Attach detailed schedule.', field: 'ctResearchExpenses', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the amount of incremental Connecticut research and experimental expenditures for the 2021 income year according to Conn. Gen. Stat. § 12‐217j, from 2019 Form CT-1120RC, Part I, Line 3.', field: 'ctIncrementalExpenses', editable: true, method: 'standard', defaultValue: 0 },
  { line: '3', label: 'Net research and development expenses for 2021: Subtract Line 2 from Line 1.', field: 'ctNetExpenses', editable: false, method: 'standard', calc: (data: any) => Math.max((data.ctResearchExpenses || 0) - (data.ctIncrementalExpenses || 0), 0) },
  { line: '4a', label: 'Qualified small businesses* multiply amount on Line 3 by 6% (.06).', field: 'ctSmallBusinessCredit', editable: false, method: 'standard', calc: (data: any) => (data.ctNetExpenses || 0) * 0.06 },
  { line: '4b', label: 'Companies headquartered in an Enterprise Zone, with revenues in excess of $3 billion, employing more than 2,500 employees, may elect to multiply amount on Line 3 by 3.5% (.035).', field: 'ctEnterpriseZoneCredit', editable: false, method: 'standard', calc: (data: any) => (data.ctNetExpenses || 0) * 0.035 },
  { line: '4c', label: 'All other businesses determine amount from the Tentative Credit Rate Schedule', field: 'ctOtherBusinessCredit', editable: true, method: 'standard', defaultValue: 0 },
  { line: '4', label: 'Tentative credit for 2021: Enter the amount from Line 4a, 4b, or 4c.', field: 'ctTentativeCredit', editable: true, method: 'standard', defaultValue: 0 },
  { line: '5', label: 'Reduction of tentative tax credit for 2021: Applicable if Line 3 exceeds $200 million and workforce is reduced.', field: 'ctReduction', editable: true, method: 'standard', defaultValue: 0 },
  { line: '6', label: 'Allowable tentative tax credit for 2021: Subtract Line 5 from Line 4.', field: 'ctAllowableTentative', editable: false, method: 'standard', calc: (data: any) => Math.max((data.ctTentativeCredit || 0) - (data.ctReduction || 0), 0) },
  
  // Part II
  { line: '1', label: 'Allowable tentative tax credit for 2021 from Part I, Line 6.', field: 'ctPart2Line1', editable: false, method: 'standard', calc: (data: any) => data.ctAllowableTentative || 0 },
  { line: '2', label: 'Multiply Line 1 by 331⁄3% (.3333).', field: 'ctPart2Line2', editable: false, method: 'standard', calc: (data: any) => (data.ctPart2Line1 || 0) * 0.3333 },
  { line: '3', label: 'Enter the 2021 Connecticut Corporation Business Tax liability or, in the case of a Combined Unitary Corporation Business Tax Return, the combined group\'s total Corporation Business Tax liability, due after the application of the total amount of Connecticut Corporation Business Tax credits except the Research and Development Expenditures tax credit.', field: 'ctTaxLiability', editable: true, method: 'standard', defaultValue: 0 },
  { line: '4', label: 'Multiply Line 3 by 50% (.50).', field: 'ctPart2Line4', editable: false, method: 'standard', calc: (data: any) => (data.ctTaxLiability || 0) * 0.50 },
  { line: '5a', label: 'Multiply Line 1 by two (2).', field: 'ctPart2Line5a', editable: false, method: 'standard', calc: (data: any) => (data.ctPart2Line1 || 0) * 2 },
  { line: '5b', label: 'Enter 90% (.90) of Line 3.', field: 'ctPart2Line5b', editable: false, method: 'standard', calc: (data: any) => (data.ctTaxLiability || 0) * 0.90 },
  { line: '5', label: 'Enter the lesser of Line 5a or Line 5b.', field: 'ctPart2Line5', editable: false, method: 'standard', calc: (data: any) => Math.min((data.ctPart2Line5a || 0), (data.ctPart2Line5b || 0)) },
  { line: '6', label: 'Enter the greater of Line 4 or Line 5.', field: 'ctPart2Line6', editable: false, method: 'standard', calc: (data: any) => Math.max((data.ctPart2Line4 || 0), (data.ctPart2Line5 || 0)) },
  { line: '7', label: '2021 Research and Development Expenditures tax credit: Enter the lesser of Line 2 or Line 6 here and on Form CT-1120K, Part I‐C, Column B.', field: 'ctFinalCredit', editable: false, method: 'standard', calc: (data: any) => Math.min((data.ctPart2Line2 || 0), (data.ctPart2Line6 || 0)) },

  // --- CT Alternative Method (Form 1120RC) ---
  { line: '1', label: 'Enter the amount of Connecticut research and experimental expenditures for the 2021 income year. Attach detailed schedule.', field: 'ctAltResearchExpenses', editable: false, method: 'alternative', calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0) },
  { line: '2', label: 'Enter the amount of Connecticut research and experimental expenditures for the 2020 income year. Attach detailed schedule.', field: 'ctAltPriorYearExpenses', editable: true, method: 'alternative', defaultValue: 0 },
  { line: '3', label: 'Balance: Subtract Line 2 from Line 1. If zero or less, the corporation is not eligible for this credit.', field: 'ctAltBalance', editable: false, method: 'alternative', calc: (data: any) => Math.max((data.ctAltResearchExpenses || 0) - (data.ctAltPriorYearExpenses || 0), 0) },
  { line: '4', label: 'Tax credit: Multiply Line 3 by 20% (.20). Enter here and on Form CT-1120K, Part I-C, Column B.', field: 'ctAltFinalCredit', editable: false, method: 'alternative', calc: (data: any) => (data.ctAltBalance || 0) * 0.20 },
];

export const ctConfig = {
  state: 'CT',
  name: 'Connecticut',
  forms: {
    standard: {
      name: 'CT Form 1120 RDC - Research and Development Expenditures Tax Credit',
      method: 'standard',
      lines: CT_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
    alternative: {
      name: 'CT Form 1120RC - Research and Experimental Expenditures Tax Credit',
      method: 'alternative',
      lines: CT_PROFORMA_LINES.filter(line => line.method === 'alternative'),
    },
  },
  hasAlternativeMethod: true,
  creditRate: 0.06,
  creditType: "incremental",
  formReference: "CT Form 1120 RDC",
  validationRules: [
    {
      type: "max_credit",
      value: 50,
      message: "Credit limited to 50% of the taxpayer's Connecticut Corporation Business Tax liability"
    },
    {
      type: "carryforward_limit",
      value: 15,
      message: "Unused credits may be carried forward for up to 15 years"
    },
    {
      type: "entity_type_restriction",
      value: "Corporations only",
      message: "Available only to corporations subject to Connecticut Corporation Business Tax"
    },
    {
      type: "gross_receipts_threshold",
      value: 100000,
      message: "Minimum $100,000 in gross receipts in the taxable year to qualify"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 1120 RDC and attach detailed schedule to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: March 15",
      message: "Application must be filed by March 15th of the year following the taxable year"
    },
    {
      type: "other",
      value: "Workforce requirement",
      message: "Credit reduction applies if workforce is reduced and expenses exceed $200 million"
    }
  ],
  alternativeValidationRules: [
    {
      type: "alternative_method",
      value: "Available",
      message: "Alternative calculation method available using 20% of incremental research expenses"
    },
    {
      type: "max_credit",
      value: 50,
      message: "Alternative method also limited to 50% of Connecticut Corporation Business Tax liability"
    },
    {
      type: "carryforward_limit",
      value: 15,
      message: "Unused alternative credits may be carried forward for up to 15 years"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Connecticut Corporation Business Tax liability",
    "Research must be conducted in Connecticut to qualify for the credit",
    "Qualified research expenses must meet the same criteria as the federal credit under IRC Section 41",
    "Taxpayers must maintain detailed records of qualified research activities and expenses",
    "Qualified Small Business is defined as a company with gross income not exceeding $100 million",
    "Enterprise Zone companies with revenues over $3 billion may elect 3.5% rate",
    "Credit reduction applies if workforce is reduced and expenses exceed $200 million"
  ]
}; 