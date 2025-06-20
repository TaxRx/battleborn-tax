import { TaxInfo, TaxRates, TaxStrategy, TaxBreakdown, TaxBracket, FilingStatus } from '../../../types/tax';
import { taxRates } from '../../../data/taxRates';

interface BracketCalculation {
  rate: number;
  min: number;
  max: number;
  taxable_amount: number;
  tax_amount: number;
}

interface FederalBracket {
  rate: number;
  single: number;
  married_joint: number;
  married_separate: number;
  head_household: number;
  single_max?: number;
  married_joint_max?: number;
  married_separate_max?: number;
  head_household_max?: number;
}

type FilingStatusKey = 'single' | 'married_joint' | 'married_separate' | 'head_household';

type BracketAccess = {
  [K in FilingStatus]: number;
} & {
  [K in `${FilingStatus}_max`]: number;
} & {
  rate: number;
};

export function calculateMarginalRate(income: number, brackets: FederalBracket[], filing_status: FilingStatus): number {
  if (!brackets || !brackets.length) return 0;
  
  for (const bracket of brackets) {
    if (income <= bracket[filing_status as FilingStatusKey]) {
      return bracket.rate;
    }
  }
  return brackets[brackets.length - 1].rate;
}

export function calculateBaseDeductions(taxInfo: TaxInfo, rates: TaxRates): number {
  if (!rates || !rates.federal || !rates.federal.standard_deduction) return 0;
  
  if (taxInfo.standard_deduction) {
    return rates.federal.standard_deduction[taxInfo.filing_status] || 0;
  }
  return taxInfo.custom_deduction || 0;
}

export function calculateStrategyDeductions(strategies: TaxStrategy[]): number {
  if (!strategies) return 0;
  
  return strategies.reduce((total, strategy) => {
    if (strategy.details?.charitable_donation) {
      return total + (strategy.details.charitable_donation.deduction_value || 0);
    }
    return total;
  }, 0);
}

export function calculateShiftedIncome(strategies: TaxStrategy[]): number {
  if (!strategies) return 0;
  
  return strategies.reduce((total, strategy) => {
    if (strategy.details?.augusta_rule) {
      return total + (strategy.details.augusta_rule.total_rent || 0);
    }
    if (strategy.details?.family_management_company) {
      return total + (strategy.details.family_management_company.total_salaries || 0);
    }
    return total;
  }, 0);
}

export function calculateTotalIncome(taxInfo: TaxInfo): number {
  return Math.round(
    (taxInfo.wages_income || 0) + 
    (taxInfo.passive_income || 0) + 
    (taxInfo.unearned_income || 0) +
    (taxInfo.capital_gains || 0) +
    (taxInfo.business_owner ? (taxInfo.ordinary_k1_income || 0) + (taxInfo.guaranteed_k1_income || 0) : 0)
  );
}

export function calculateTaxableIncome(totalIncome: number, deductions: number): number {
  return Math.max(0, totalIncome - deductions);
}

export function calculateFederalBrackets(taxInfo: TaxInfo, rates: TaxRates): BracketCalculation[] {
  if (!taxInfo || !rates || !rates.federal || !rates.federal.brackets) {
    console.warn('Missing required tax rate data:', { taxInfo, rates });
    return [];
  }

  const brackets = rates.federal.brackets;
  const filingStatus = taxInfo.filing_status as FilingStatusKey;
  
  // Get the brackets for the specific filing status
  const filingStatusBrackets = brackets.map(bracket => ({
    rate: bracket.rate,
    min: bracket[filingStatus],
    max: bracket[`${filingStatus}_max` as keyof typeof bracket] || Infinity
  }));

  if (!filingStatusBrackets || !Array.isArray(filingStatusBrackets)) {
    console.warn('Invalid brackets for filing status:', { filingStatus, brackets });
    return [];
  }

  const taxableIncome = calculateTaxableIncome(
    calculateTotalIncome(taxInfo),
    taxInfo.standard_deduction ? rates.federal.standard_deduction[filingStatus] : (taxInfo.custom_deduction || 0)
  );

  return filingStatusBrackets.map((bracket) => {
    const min = bracket.min;
    const max = bracket.max === Infinity ? taxableIncome : bracket.max;
    const taxable_amount = Math.max(0, Math.min(max - min, taxableIncome - min));
    const tax_amount = taxable_amount * bracket.rate;

    return {
      rate: bracket.rate,
      min,
      max,
      taxable_amount,
      tax_amount,
    };
  });
}

export function calculateStateBrackets(taxableIncome: number, brackets: FederalBracket[], filing_status: FilingStatus): BracketCalculation[] {
  if (!brackets || !brackets.length) return [];
  
  return brackets.map((bracket) => {
    const min = (bracket as unknown as BracketAccess)[filing_status];
    const maxKey = `${filing_status}_max` as keyof BracketAccess;
    const max = (bracket as unknown as BracketAccess)[maxKey] || Infinity;
    const taxable_amount = Math.max(0, Math.min(max - min, taxableIncome - min));
    const tax_amount = taxable_amount * bracket.rate;

    return {
      rate: bracket.rate,
      min,
      max,
      taxable_amount,
      tax_amount,
    };
  });
}

interface FicaRates {
  social_security: {
    rate: number;
    wage_base: number;
  };
  medicare: {
    rate: number;
    additional_rate: number;
    additional_threshold: number;
  };
}

interface TaxRatesWithFica {
  fica: FicaRates;
  self_employment: {
    rate: number;
  };
}

interface FicaTaxes {
  social_security: number;
  medicare: number;
  self_employment: number;
  total: number;
}

export function calculateFicaTaxes(wage_income: number, self_employment_income: number, rates: TaxRatesWithFica): FicaTaxes {
  if (!rates) return { social_security: 0, medicare: 0, self_employment: 0, total: 0 };
  
  const social_security_rate = rates.fica.social_security.rate;
  const social_security_wage_base = rates.fica.social_security.wage_base;
  const medicare_rate = rates.fica.medicare.rate;
  const self_employment_rate = rates.self_employment.rate;

  const social_security = Math.min(wage_income, social_security_wage_base) * social_security_rate;
  const medicare = wage_income * medicare_rate;
  const self_employment = self_employment_income * self_employment_rate;
  const total = social_security + medicare + self_employment;

  return { social_security, medicare, self_employment, total };
}

interface StateRates {
  brackets: Array<{
    rate: number;
    single: number;
    married_joint: number;
    married_separate: number;
    head_household: number;
  }>;
  standard_deduction: {
    single: number;
    married_joint: number;
    married_separate: number;
    head_household: number;
  };
}

interface TaxRatesWithState {
  state: {
    [key: string]: StateRates;
  };
}

function calculateStateTax(taxInfo: TaxInfo, rates: TaxRates): number {
  if (!taxInfo || !rates || !rates.state || !taxInfo.state) {
    return 0;
  }

  const stateRates = rates.state[taxInfo.state] as StateRates;
  if (!stateRates || !stateRates.brackets || !stateRates.standard_deduction) {
    return 0;
  }

  const brackets = stateRates.brackets;
  const taxableIncome = calculateTaxableIncome(
    calculateTotalIncome(taxInfo),
    taxInfo.standard_deduction ? stateRates.standard_deduction[taxInfo.filing_status] : (taxInfo.custom_deduction || 0)
  );

  return brackets.reduce((total: number, bracket) => {
    const filingStatusKey = taxInfo.filing_status as keyof typeof bracket;
    const min = bracket[filingStatusKey];
    const maxKey = `${taxInfo.filing_status}_max` as keyof typeof bracket;
    const max = bracket[maxKey] || Infinity;
    const taxable_amount = Math.max(0, Math.min(max - min, taxableIncome - min));
    return total + (taxable_amount * bracket.rate);
  }, 0);
}

export function calculateTaxBreakdown(taxInfo: TaxInfo, rates: TaxRates, strategies: TaxStrategy[] = []): TaxBreakdown {
  if (!taxInfo || !rates) {
    return {
      federal: 0,
      state: 0,
      social_security: 0,
      medicare: 0,
      self_employment: 0,
      fica: 0,
      total: 0,
      effective_rate: 0,
      marginal_rate: 0,
      federal_brackets: [],
      state_brackets: [],
      total_deductions: 0,
      strategy_deductions: 0,
      deferred_income: 0,
      taxable_income: 0,
      deductions: {
        standard: 0,
        itemized: 0,
        total: 0
      }
    };
  }

  const totalIncome = calculateTotalIncome(taxInfo);
  const standardDeduction = taxInfo.standard_deduction ? 
    (rates.federal.standard_deduction[taxInfo.filing_status] || 0) : 0;
  const customDeduction = taxInfo.custom_deduction || 0;
  const totalDeductions = standardDeduction + customDeduction;

  const federalBrackets = calculateFederalBrackets(taxInfo, rates);
  const federalTax = federalBrackets.reduce((sum, bracket) => sum + bracket.tax_amount, 0);
  const stateTax = calculateStateTax(taxInfo, rates);

  const selfEmploymentIncome = taxInfo.business_income || 0;
  const selfEmploymentTax = selfEmploymentIncome * 0.153; // 15.3% self-employment tax rate
  
  const wagesIncome = taxInfo.wages_income || 0;
  const socialSecurityTax = Math.min(
    wagesIncome * 0.062, // 6.2% social security rate
    147000 * 0.062 // 2023 wage base
  );
  const medicareTax = wagesIncome * 0.0145; // 1.45% medicare rate

  const totalTax = federalTax + stateTax + selfEmploymentTax + socialSecurityTax + medicareTax;
  const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0;
  const marginalRate = federalBrackets.length > 0 ? 
    federalBrackets[federalBrackets.length - 1].rate : 0;

  return {
    federal: federalTax,
    state: stateTax,
    social_security: socialSecurityTax,
    medicare: medicareTax,
    self_employment: selfEmploymentTax,
    fica: socialSecurityTax + medicareTax,
    total: totalTax,
    effective_rate: effectiveRate,
    marginal_rate: marginalRate,
    federal_brackets: federalBrackets,
    state_brackets: calculateStateBrackets(
      calculateTaxableIncome(totalIncome, totalDeductions),
      rates.state[taxInfo.state]?.brackets || [],
      taxInfo.filing_status
    ),
    total_deductions: totalDeductions,
    strategy_deductions: calculateStrategyDeductions(strategies),
    deferred_income: calculateShiftedIncome(strategies),
    taxable_income: calculateTaxableIncome(totalIncome, totalDeductions),
    deductions: {
      standard: standardDeduction,
      itemized: customDeduction,
      total: totalDeductions
    }
  };
}