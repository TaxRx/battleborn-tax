// Strategy Categories
export type StrategyCategory = 'income_shifted' | 'income_deferred' | 'new_deductions' | 'new_credits';

// Base Strategy Interface
export interface BaseStrategy {
  id: string;
  category: StrategyCategory;
  name: string;
  description: string;
  estimatedSavings: number;
  link?: string;
  enabled: boolean;
  highIncome?: boolean;
  synergy?: {
    with: string;
    label: string;
  };
}

// Strategy Details Interfaces
export interface IncomeShiftStrategy extends BaseStrategy {
  category: 'income_shifted';
  details: {
    shiftedAmount: number;
    federalSavings: number;
    stateSavings: number;
    totalBenefit: number;
  };
}

export interface DeductionStrategy extends BaseStrategy {
  category: 'new_deductions';
  details: {
    deductionValue: number;
    federalSavings: number;
    stateSavings: number;
    totalBenefit: number;
  };
}

export interface DeferralStrategy extends BaseStrategy {
  category: 'income_deferred';
  details: {
    deferredAmount: number;
    federalSavings: number;
    stateSavings: number;
    totalBenefit: number;
  };
}

export interface CreditStrategy extends BaseStrategy {
  category: 'new_credits';
  details: {
    creditAmount: number;
    federalSavings: number;
    stateSavings: number;
    totalBenefit: number;
  };
}

// Union type for all strategies
export type TaxStrategy = IncomeShiftStrategy | DeductionStrategy | DeferralStrategy | CreditStrategy;

// Strategy Calculator Interface
export interface StrategyCalculator {
  calculateImpact: (
    strategy: TaxStrategy,
    taxInfo: TaxInfo,
    rates: TaxRates
  ) => {
    modifiedTaxInfo: TaxInfo;
    savings: {
      federal: number;
      state: number;
      fica: number;
      total: number;
    };
  };
}

export interface TaxInfo {
  federalIncome: number;
  stateIncome: number;
  businessIncome: number;
  standardDeduction: number;
  itemizedDeductions: number;
}

export interface TaxBreakdown {
  federalTax: number;
  stateTax: number;
  ficaTax: number;
  totalTax: number;
}

export interface TaxRates {
  federalBrackets: Array<{rate: number, max: number}>;
  stateBrackets: Array<{rate: number, max: number}>;
  fica: {
    employee: number;
    employer: number;
  };
}

export interface FamilyMember {
  name: string;
  salary: number;
}

export interface IncomeShiftDetails {
  shiftedAmount: number;
  federalBenefit: number;
  stateBenefit: number;
  ficaBenefit: number;
  totalBenefit: number;
  familyMembers?: FamilyMember[];
}

export interface DeductionDetails {
  deductionValue: number;
  federalSavings: number;
  stateSavings: number;
  totalBenefit: number;
}

export interface DeferralDetails {
  deferredAmount: number;
  federalBenefit: number;
  stateBenefit: number;
  totalBenefit: number;
}

export interface CreditDetails {
  creditValue: number;
  federalBenefit: number;
  stateBenefit: number;
  totalBenefit: number;
}

export interface ConvertibleTaxBondsDetails {
  ctbPayment: number;
  ctbTaxOffset: number;
  netSavings: number;
  remainingTaxAfterCtb: number;
  reductionRatio: number;
  totalBenefit: number;
}

export type StrategyDetails = IncomeShiftDetails | DeductionDetails | DeferralDetails | CreditDetails | ConvertibleTaxBondsDetails;

export interface StrategyFactory {
  createStrategy(): TaxStrategy;
  validateStrategy(strategy: TaxStrategy): boolean;
  calculateSavings(strategy: TaxStrategy, taxInfo: TaxInfo, rates: TaxRates): number;
} 