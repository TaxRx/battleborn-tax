import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const AK_PROFORMA_LINES = [
  // --- Alaska Form 6390 - Research Credit ---
  // Based on actual Alaska Form 6390 requirements
  { 
    line: '1', 
    label: 'Federal general business credit from a non-passive activity from line 2 of federal Form 3800, Part III with box A checked', 
    field: 'federalGeneralBusinessCredit', 
    editable: false, 
    // Auto-populate from federal calculation (standard or alternative)
    calc: (data: StateCreditBaseData) => data.federalCreditValue || 0, // expects upstream to provide correct value
    description: 'Auto-populated from federal Form 6765 (Standard or ASC method selected)',
    type: 'currency'
  },
  { 
    line: '2a', 
    label: 'Federal investment credit from a non-passive activity not allowable for Alaska (see instructions)', 
    field: 'federalInvestmentCredit', 
    editable: true,
    type: 'currency',
    description: 'Enter federal investment credits that are not allowed for Alaska purposes'
  },
  { 
    line: '2b', 
    label: 'Other federal general business credits not allowable for Alaska (see instructions)', 
    field: 'otherFederalCredits', 
    editable: true,
    type: 'currency',
    description: 'Enter other federal credits that are not allowed for Alaska purposes'
  },
  { 
    line: '2c', 
    label: 'Add lines 2a–2b', 
    field: 'line2c', 
    editable: false, 
    calc: (data: StateCreditBaseData) => (data.federalInvestmentCredit || 0) + (data.otherFederalCredits || 0),
    type: 'currency'
  },
  { 
    line: '3', 
    label: 'Federal general business credit from a non-passive activity applicable to Alaska. Subtract line 2c from line 1', 
    field: 'line3', 
    editable: false, 
    calc: (data: StateCreditBaseData) => Math.max(((data.federalCreditValue || 0) - ((data.federalInvestmentCredit || 0) + (data.otherFederalCredits || 0))), 0),
    type: 'currency'
  },
  { 
    line: '4', 
    label: 'Applicable general business credit from a passive activity allowed. Enter amount from Form 6395, line 17', 
    field: 'passiveActivityCredit', 
    editable: true,
    type: 'currency',
    description: 'Enter passive activity credits allowed for Alaska'
  },
  { 
    line: '5', 
    label: 'Total current federal general business credit applicable to Alaska. Add lines 3 and 4', 
    field: 'line5', 
    editable: false, 
    calc: (data: StateCreditBaseData) => {
      const line3 = Math.max(((data.federalCreditValue || 0) - ((data.federalInvestmentCredit || 0) + (data.otherFederalCredits || 0))), 0);
      return line3 + (data.passiveActivityCredit || 0);
    },
    type: 'currency'
  },
  { 
    line: '6', 
    label: 'Apportionment factor', 
    field: 'apportionmentFactor', 
    editable: true, 
    type: 'percentage', 
    description: 'Enter as a percentage (e.g., 100 for 100%)',
    defaultValue: 100
  },
  { 
    line: '7', 
    label: 'Multiply line 5 by line 6.', 
    field: 'line7', 
    editable: false, 
    calc: (data: StateCreditBaseData) => {
      const line3 = Math.max(((data.federalCreditValue || 0) - ((data.federalInvestmentCredit || 0) + (data.otherFederalCredits || 0))), 0);
      const line5 = line3 + (data.passiveActivityCredit || 0);
      return line5 * ((typeof data.apportionmentFactor === 'number' ? data.apportionmentFactor : 100) / 100);
    },
    type: 'currency'
  },
  { 
    line: '8', 
    label: 'Total current apportioned general business credit. Multiply line 7 by 18%.', 
    field: 'line8', 
    editable: false, 
    calc: (data: StateCreditBaseData) => {
      const line3 = Math.max(((data.federalCreditValue || 0) - ((data.federalInvestmentCredit || 0) + (data.otherFederalCredits || 0))), 0);
      const line5 = line3 + (data.passiveActivityCredit || 0);
      const line7 = line5 * ((typeof data.apportionmentFactor === 'number' ? data.apportionmentFactor : 100) / 100);
      return line7 * 0.18;
    },
    type: 'currency',
    description: 'Alaska research credit is 18% of the apportioned federal credit'
  },
];

export const akConfig = {
  state: 'AK',
  name: 'Alaska',
  forms: {
    standard: {
      name: 'Alaska Form 6390 - Research Credit',
      method: 'standard',
      lines: AK_PROFORMA_LINES,
      notes: [
        'Alaska does not have a separate R&D credit calculation.',
        'The Alaska research credit is 18% of the apportioned federal general business credit.',
        'Must have federal Form 6765 completed to claim this credit.',
        'Apportionment factor is required for multi-state businesses.',
        'Passive activity credits require separate Form 6395 calculation.'
      ],
      validation_rules: [
        {
          rule: 'apportionment_factor_required',
          condition: (data: StateCreditBaseData) => typeof data.apportionmentFactor !== 'number' || data.apportionmentFactor <= 0,
          message: 'Apportionment factor is required for Alaska research credit calculation.'
        },
        {
          rule: 'federal_credit_required',
          condition: (data: StateCreditBaseData) => typeof data.federalCreditValue !== 'number' || data.federalCreditValue <= 0,
          message: 'Federal general business credit is required to claim Alaska research credit.'
        }
      ]
    },
  },
  hasAlternativeMethod: false,
  creditRate: 0.18,
  creditType: "federal_based",
  formReference: "AK Form 6390",
  validationRules: [
    {
      type: "max_credit",
      value: 100,
      message: "Credit limited to 100% of the taxpayer's Alaska income tax liability"
    },
    {
      type: "carryforward_limit",
      value: 10,
      message: "Unused credits may be carried forward for up to 10 years"
    },
    {
      type: "entity_type_restriction",
      value: "All entities",
      message: "Available to all entities subject to Alaska income tax"
    },
    {
      type: "other",
      value: "Federal credit required",
      message: "Must have federal Form 6765 completed to claim Alaska research credit"
    },
    {
      type: "other",
      value: "Application required",
      message: "Must file Form 6390 and attach federal Form 6765 to claim the credit"
    },
    {
      type: "other",
      value: "Deadline: April 15",
      message: "Application must be filed by April 15th of the year following the taxable year"
    },
    {
      type: "other",
      value: "Apportionment required",
      message: "Multi-state businesses must provide apportionment factor"
    }
  ],
  notes: [
    "Credit is non-refundable and may only be used to offset Alaska income tax liability",
    "Alaska research credit is 18% of the apportioned federal general business credit",
    "Must have federal Form 6765 completed to claim this credit",
    "Apportionment factor is required for multi-state businesses",
    "Passive activity credits require separate Form 6395 calculation",
    "Credit is based on federal credit calculation, not separate state calculation"
  ]
}; 