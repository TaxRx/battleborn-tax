import { TaxInfo, TaxRates, TaxStrategy, TaxBreakdown } from '../types';

export interface BracketCalculation {
  rate: number;
  min: number;
  max: number;
  taxable: number;
  tax: number;
}

export function calculateMarginalRate(income: number, brackets: any[], filingStatus: string): number {
  const bracket = brackets.find(b => income <= b[filingStatus]);
  return bracket ? bracket.rate : brackets[brackets.length - 1].rate;
}

export function calculateBaseDeductions(taxInfo: TaxInfo, rates: TaxRates): number {
  if (!taxInfo || !rates?.federal) return 0;
  
  if (taxInfo.standardDeduction) {
    return rates.federal.standardDeduction?.[taxInfo.filingStatus] || 0;
  }
  return taxInfo.customDeduction || 0;
}

export function calculateStrategyDeductions(strategies: TaxStrategy[]): number {
  return strategies
    .filter(s => s.enabled)
    .reduce((total, strategy) => {
      if (strategy.id === 'charitable_donation' && strategy.details?.charitableDonation) {
        return total + Math.round(strategy.details.charitableDonation.deductionValue);
      }
      if (strategy.id === 'cost_segregation' && strategy.details?.costSegregation) {
        return total + Math.round(strategy.details.costSegregation.currentYearDeduction);
      }
      return total;
    }, 0);
}

export function calculateShiftedIncome(strategies: TaxStrategy[]): number {
  return strategies
    .filter(s => s.enabled && s.category === 'income_shifted')
    .reduce((total, strategy) => {
      if (strategy.id === 'hire_children' && strategy.details?.hireChildren) {
        return total + strategy.details.hireChildren.totalSalaries;
      }
      if (strategy.id === 'augusta_rule' && strategy.details?.augustaRule) {
        return total + (strategy.details.augustaRule.daysRented * strategy.details.augustaRule.dailyRate);
      }
      if (strategy.id === 'family_management_company' && strategy.details?.familyManagementCompany) {
        return total + strategy.details.familyManagementCompany.totalSalaries;
      }
      if (strategy.id === 'reinsurance' && strategy.details?.reinsurance) {
        return total + strategy.details.reinsurance.userContribution;
      }
      return total;
    }, 0);
}

export function calculateCharitableDonationNetSavings(
  taxInfo: TaxInfo,
  rates: TaxRates,
  donationAmount: number,
  deductionValue: number,
  strategies: TaxStrategy[]
) {
  const savings = calculateStrategyTaxSavings(
    taxInfo,
    rates,
    {
      id: 'charitable_donation',
      name: 'Charitable Donation',
      category: 'new_deductions',
      enabled: true,
      estimatedSavings: 0,
      details: {
        charitableDonation: {
          donationAmount,
          deductionValue,
          federalSavings: 0,
          stateSavings: 0,
          totalBenefit: 0
        }
      }
    }
  );

  const totalSavings = savings.federal + savings.state;
  const netSavings = totalSavings - donationAmount;

  return {
    federal: savings.federal,
    state: savings.state,
    net: netSavings
  };
}

export function calculateStrategyTaxSavings(taxInfo: TaxInfo, rates: TaxRates, strategy: TaxStrategy) {
  const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);
  const withStrategyBreakdown = calculateTaxBreakdown(taxInfo, rates, [{ ...strategy, enabled: true }]);

  return {
    federal: Math.max(0, baseBreakdown.federal - withStrategyBreakdown.federal),
    state: Math.max(0, baseBreakdown.state - withStrategyBreakdown.state),
    fica: Math.max(0, baseBreakdown.fica - withStrategyBreakdown.fica)
  };
}

export function calculateTaxBreakdown(taxInfo: TaxInfo, rates: TaxRates, strategies: TaxStrategy[] = []): TaxBreakdown {
  if (!taxInfo || !rates) {
    return {
      federal: 0,
      state: 0,
      socialSecurity: 0,
      medicare: 0,
      selfEmployment: 0,
      fica: 0,
      total: 0,
      effectiveRate: 0,
      federalBrackets: [],
      stateBrackets: [],
      baseDeduction: 0,
      strategyDeductions: 0,
      deductionLimitReached: false
    };
  }

  // Calculate total income
  const totalIncome = Math.round(
    (taxInfo.wagesIncome || 0) + 
    (taxInfo.passiveIncome || 0) + 
    (taxInfo.unearnedIncome || 0) +
    (taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0)
  );

  // Calculate base deduction (standard or custom)
  const baseDeduction = taxInfo.standardDeduction ? 
    (rates.federal.standardDeduction[taxInfo.filingStatus] || 0) :
    (taxInfo.customDeduction || 0);

  // Calculate strategy deductions
  const strategyDeductions = strategies
    .filter(s => s.enabled)
    .reduce((total, strategy) => {
      if (strategy.id === 'charitable_donation' && strategy.details?.charitableDonation) {
        return total + strategy.details.charitableDonation.deductionValue;
      }
      if (strategy.id === 'cost_segregation' && strategy.details?.costSegregation) {
        return total + strategy.details.costSegregation.currentYearDeduction;
      }
      return total;
    }, 0);

  // Calculate total proposed deductions
  const totalProposedDeductions = baseDeduction + strategyDeductions;

  // Check if deductions exceed 80% limit
  const maxAllowedDeduction = totalIncome * 0.8;
  let finalDeductions = totalProposedDeductions;
  let deductionLimitReached = false;

  if (totalProposedDeductions > maxAllowedDeduction) {
    finalDeductions = maxAllowedDeduction;
    deductionLimitReached = true;
    taxInfo.deductionLimitReached = true;
  }

  // Calculate shifted income
  const shiftedIncome = strategies
    .filter(s => s.enabled && s.category === 'income_shifted')
    .reduce((total, strategy) => {
      if (strategy.id === 'hire_children' && strategy.details?.hireChildren) {
        return total + strategy.details.hireChildren.totalSalaries;
      }
      if (strategy.id === 'augusta_rule' && strategy.details?.augustaRule) {
        return total + (strategy.details.augustaRule.daysRented * strategy.details.augustaRule.dailyRate);
      }
      if (strategy.id === 'family_management_company' && strategy.details?.familyManagementCompany) {
        return total + strategy.details.familyManagementCompany.totalSalaries;
      }
      if (strategy.id === 'reinsurance' && strategy.details?.reinsurance) {
        return total + strategy.details.reinsurance.userContribution;
      }
      return total;
    }, 0);

  // Calculate taxable income
  const taxableIncome = Math.max(0, totalIncome - shiftedIncome - finalDeductions);

  // Calculate federal tax
  let federal = 0;
  let remainingIncome = taxableIncome;
  const federalBrackets: BracketCalculation[] = [];

  if (rates.federal?.brackets) {
    for (let i = 0; i < rates.federal.brackets.length; i++) {
      const currentBracket = rates.federal.brackets[i];
      const prevBracket = i > 0 ? rates.federal.brackets[i - 1] : null;
      
      const min = prevBracket ? prevBracket[taxInfo.filingStatus] : 0;
      const max = currentBracket[taxInfo.filingStatus];
      const bracketSize = max - min;
      const taxableInBracket = Math.min(remainingIncome, bracketSize);
      
      if (taxableInBracket > 0) {
        const tax = Math.round(taxableInBracket * currentBracket.rate);
        federalBrackets.push({
          rate: currentBracket.rate,
          min,
          max,
          taxable: Math.round(taxableInBracket),
          tax
        });
        
        federal += tax;
        remainingIncome -= taxableInBracket;
      }
      
      if (remainingIncome <= 0) break;
    }
  }

  // Calculate state tax
  let state = 0;
  remainingIncome = taxableIncome;
  const stateBrackets: BracketCalculation[] = [];

  if (rates.state?.[taxInfo.state]?.brackets) {
    for (let i = 0; i < rates.state[taxInfo.state].brackets.length; i++) {
      const currentBracket = rates.state[taxInfo.state].brackets[i];
      const prevBracket = i > 0 ? rates.state[taxInfo.state].brackets[i - 1] : null;
      
      const min = prevBracket ? prevBracket[taxInfo.filingStatus] : 0;
      const max = currentBracket[taxInfo.filingStatus];
      const bracketSize = max - min;
      const taxableInBracket = Math.min(remainingIncome, bracketSize);
      
      if (taxableInBracket > 0) {
        const tax = Math.round(taxableInBracket * currentBracket.rate);
        stateBrackets.push({
          rate: currentBracket.rate,
          min,
          max,
          taxable: Math.round(taxableInBracket),
          tax
        });
        
        state += tax;
        remainingIncome -= taxableInBracket;
      }
      
      if (remainingIncome <= 0) break;
    }
  }

  // Calculate FICA taxes
  const socialSecurityIncome = Math.min((taxInfo.wagesIncome || 0) - shiftedIncome, rates.fica?.socialSecurity?.wageBase || 0);
  const socialSecurity = Math.round(socialSecurityIncome * (rates.fica?.socialSecurity?.rate || 0));

  const medicareRate = ((taxInfo.wagesIncome || 0) - shiftedIncome) > (rates.fica?.medicare?.additionalThreshold || 0)
    ? (rates.fica?.medicare?.rate || 0) + (rates.fica?.medicare?.additionalRate || 0)
    : (rates.fica?.medicare?.rate || 0);
  const medicare = Math.round(((taxInfo.wagesIncome || 0) - shiftedIncome) * medicareRate);

  // Calculate self-employment tax only for Sole Proprietors
  const selfEmployment = taxInfo.businessOwner && taxInfo.entityType === 'Sole Prop' && taxInfo.ordinaryK1Income
    ? Math.round((taxInfo.ordinaryK1Income - shiftedIncome) * (rates.selfEmployment?.rate || 0))
    : 0;

  const fica = socialSecurity + medicare + selfEmployment;

  const effectiveRate = totalIncome > 0 ? ((federal + state + fica) / totalIncome) * 100 : 0;

  return {
    federal,
    state,
    socialSecurity,
    medicare,
    selfEmployment,
    fica,
    total: federal + state + fica,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    federalBrackets,
    stateBrackets,
    baseDeduction: strategyDeductions > 0 ? 0 : baseDeduction,
    strategyDeductions: Math.min(strategyDeductions, maxAllowedDeduction - (strategyDeductions > 0 ? 0 : baseDeduction)),
    deductionLimitReached
  };
}