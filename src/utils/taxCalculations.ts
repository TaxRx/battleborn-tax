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
  // Create a charitable donation strategy
  const charitableStrategy: TaxStrategy = {
    id: 'charitable_donation',
    name: 'Charitable Donation',
    description: 'Maximize deductions through strategic charitable giving',
    category: 'new_deductions',
    enabled: true,
    estimatedSavings: 0,
    details: {
      charitableDonation: {
        donationAmount,
        deductionValue,
        fmvMultiplier: donationAmount > 0 ? deductionValue / donationAmount : 5,
        federalSavings: 0,
        stateSavings: 0,
        totalBenefit: 0
      }
    }
  };

  // Calculate tax breakdown without the donation
  const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);

  // Calculate tax breakdown with the charitable donation strategy
  // Force itemized deductions for charitable donations
  const withDonationBreakdown = calculateTaxBreakdown(
    { ...taxInfo, standardDeduction: false },
    rates,
    [charitableStrategy, ...strategies]
  );

  // Calculate savings
  const federalSavings = Math.max(0, baseBreakdown.federal - withDonationBreakdown.federal);
  const stateSavings = Math.max(0, baseBreakdown.state - withDonationBreakdown.state);
  const totalSavings = federalSavings + stateSavings;
  
  // Net benefit is total tax savings minus the donation amount
  const netOutOfPocket = donationAmount;  // This is your actual cost
  const netBenefit = totalSavings - netOutOfPocket;

  return {
    federal: federalSavings,
    state: stateSavings,
    net: netBenefit
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
      totalDeductions: 0,
      shiftedIncome: 0,
      deferredIncome: 0,
      taxableIncome: 0
    };
  }

  // Calculate total income
  const totalIncome = Math.round(
    (taxInfo.wagesIncome || 0) + 
    (taxInfo.passiveIncome || 0) + 
    (taxInfo.unearnedIncome || 0) +
    (taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0)
  );

  // Calculate deductions
  const baseDeductions = calculateBaseDeductions(taxInfo, rates);
  const strategyDeductions = calculateStrategyDeductions(strategies);
  
  // Handle deductions based on whether they're standard or itemized
  let totalDeductions;
  if (!taxInfo.standardDeduction) {
    // If itemized, add strategy deductions to base
    totalDeductions = baseDeductions + strategyDeductions;
  } else if (strategyDeductions > baseDeductions) {
    // If standard and strategy deductions exceed it, use only strategy deductions
    totalDeductions = strategyDeductions;
  } else {
    // If standard and strategy deductions don't exceed it, use standard deduction
    totalDeductions = baseDeductions;
  }

  // Calculate shifted and deferred income
  const shiftedIncome = calculateShiftedIncome(strategies);
  const deferredIncome = strategies
    .filter(s => s.enabled && s.category === 'income_deferred')
    .reduce((total, strategy) => {
      if (strategy.details?.deferredIncome?.deferredAmount) {
        return total + strategy.details.deferredIncome.deferredAmount;
      }
      return total;
    }, 0);

  // Calculate federal taxable income
  const federalTaxableIncome = Math.max(0, totalIncome - shiftedIncome - deferredIncome - totalDeductions);

  // Calculate state taxable income (some states have different rules)
  let stateTaxableIncome = totalIncome - shiftedIncome - deferredIncome;
  
  // Apply state deductions if the state has them
  const stateRates = rates.state?.[taxInfo.state];
  if (stateRates) {
    // If state has standard deduction, apply it
    if (stateRates.standardDeduction) {
      const stateStandardDeduction = stateRates.standardDeduction[taxInfo.filingStatus] || 0;
      if (taxInfo.standardDeduction) {
        // If using standard deduction, use the larger of state standard or strategy deductions
        stateTaxableIncome -= Math.max(stateStandardDeduction, strategyDeductions);
      } else {
        // If itemizing, use total deductions
        stateTaxableIncome -= totalDeductions;
      }
    } else {
      // If state has no standard deduction, only apply strategy deductions
      stateTaxableIncome -= strategyDeductions;
    }
  }

  // Calculate federal tax with bracket-by-bracket breakdown
  let federal = 0;
  let remainingIncome = federalTaxableIncome;
  const federalBrackets: BracketCalculation[] = [];

  if (rates.federal?.brackets) {
    for (let i = 0; i < rates.federal.brackets.length; i++) {
      const currentBracket = rates.federal.brackets[i];
      const prevBracket = i > 0 ? rates.federal.brackets[i - 1] : null;
      
      const min = prevBracket ? prevBracket[taxInfo.filingStatus] : 0;
      const max = currentBracket[taxInfo.filingStatus];
      const bracketSize = max - min;
      
      const incomeInBracket = Math.min(remainingIncome, bracketSize);
      
      if (incomeInBracket > 0) {
        const tax = Math.round(incomeInBracket * currentBracket.rate);
        federalBrackets.push({
          rate: currentBracket.rate,
          min,
          max,
          taxable: Math.round(incomeInBracket),
          tax
        });
        
        federal += tax;
        remainingIncome -= incomeInBracket;
      }
      
      if (remainingIncome <= 0) break;
    }
  }

  // Calculate state tax with bracket-by-bracket breakdown
  let state = 0;
  remainingIncome = stateTaxableIncome;
  const stateBrackets: BracketCalculation[] = [];

  if (stateRates?.brackets) {
    for (let i = 0; i < stateRates.brackets.length; i++) {
      const currentBracket = stateRates.brackets[i];
      const prevBracket = i > 0 ? stateRates.brackets[i - 1] : null;
      
      const min = prevBracket ? prevBracket[taxInfo.filingStatus] : 0;
      const max = currentBracket[taxInfo.filingStatus];
      const bracketSize = max - min;
      
      const incomeInBracket = Math.min(remainingIncome, bracketSize);
      
      if (incomeInBracket > 0) {
        const tax = Math.round(incomeInBracket * currentBracket.rate);
        stateBrackets.push({
          rate: currentBracket.rate,
          min,
          max,
          taxable: Math.round(incomeInBracket),
          tax
        });
        
        state += tax;
        remainingIncome -= incomeInBracket;
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
    totalDeductions,
    shiftedIncome,
    deferredIncome,
    taxableIncome: federalTaxableIncome
  };
}