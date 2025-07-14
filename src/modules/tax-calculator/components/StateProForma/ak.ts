import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const AK_PROFORMA_LINES = [
  // --- Alaska Form 6390 - Part I Current Year Credit ---
  { line: '1', label: 'Federal general business credit from a non-passive activity from line 2 of federal Form 3800, Part III with box A checked', field: 'federalGeneralBusinessCredit', editable: true, description: 'Enter the value from federal Form 6765 (Standard or ASC method selected)' },
  { line: '2a', label: 'Federal investment credit from a non-passive activity not allowable for Alaska (see instructions)', field: 'federalInvestmentCredit', editable: true },
  { line: '2b', label: 'Other federal general business credits not allowable for Alaska (see instructions)', field: 'otherFederalCredits', editable: true },
  { line: '2c', label: 'Add lines 2a–2b', field: 'line2c', editable: false, calc: (data: StateCreditBaseData) => (data.federalInvestmentCredit || 0) + (data.otherFederalCredits || 0) },
  { line: '3', label: 'Federal general business credit from a non-passive activity applicable to Alaska. Subtract line 2c from line 1', field: 'line3', editable: false, calc: (data: StateCreditBaseData) => Math.max((data.federalGeneralBusinessCredit || 0) - ((data.federalInvestmentCredit || 0) + (data.otherFederalCredits || 0)), 0) },
  { line: '4', label: 'Applicable general business credit from a passive activity allowed. Enter amount from Form 6395, line 17', field: 'passiveActivityCredit', editable: true },
  { line: '5', label: 'Total current federal general business credit applicable to Alaska. Add lines 3 and 4', field: 'line5', editable: false, calc: (data: StateCreditBaseData) => {
    const line3 = Math.max((data.federalGeneralBusinessCredit || 0) - ((data.federalInvestmentCredit || 0) + (data.otherFederalCredits || 0)), 0);
    return line3 + (data.passiveActivityCredit || 0);
  }},
  { line: '6', label: 'Apportionment factor', field: 'apportionmentFactor', editable: true, type: 'percentage', description: 'Enter as a percentage (e.g., 25 for 25%)' },
  { line: '7', label: 'Multiply line 5 by line 6.', field: 'line7', editable: false, calc: (data: StateCreditBaseData) => {
    const line3 = Math.max((data.federalGeneralBusinessCredit || 0) - ((data.federalInvestmentCredit || 0) + (data.otherFederalCredits || 0)), 0);
    const line5 = line3 + (data.passiveActivityCredit || 0);
    return line5 * ((data.apportionmentFactor || 0) / 100);
  }},
  { line: '8', label: 'Total current apportioned general business credit. Multiply line 7 by 18%.', field: 'line8', editable: false, calc: (data: StateCreditBaseData) => {
    const line3 = Math.max((data.federalGeneralBusinessCredit || 0) - ((data.federalInvestmentCredit || 0) + (data.otherFederalCredits || 0)), 0);
    const line5 = line3 + (data.passiveActivityCredit || 0);
    const line7 = line5 * ((data.apportionmentFactor || 0) / 100);
    return line7 * 0.18;
  }},
];

export const akConfig = {
  state: 'AK',
  name: 'Alaska',
  forms: {
    standard: {
      name: 'Alaska Form 6390 - Research Credit',
      method: 'standard',
      lines: AK_PROFORMA_LINES,
    },
  },
}; 