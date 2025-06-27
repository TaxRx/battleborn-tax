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
      if (strategy.id === 'reinsurance' && strategy.details?.reinsurance) {
        return total + Math.round(strategy.details.reinsurance.userContribution);
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

export function calculateDeferredIncome(strategies: TaxStrategy[]): number {
  return strategies
    .filter(s => s.enabled && s.category === 'income_deferred')
    .reduce((total, strategy) => {
      // Reinsurance is now in income_shifted category, so no longer handled here
      return total;
    }, 0);
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

export function calculateEffectiveStrategyBenefit(
  taxInfo: TaxInfo, 
  rates: TaxRates, 
  newStrategy: TaxStrategy, 
  existingStrategies: TaxStrategy[] = []
): { federal: number; state: number; fica: number; total: number; net: number } {
  // Filter out any existing strategy of the same type to avoid duplication
  const filteredExistingStrategies = existingStrategies.filter(s => s.id !== newStrategy.id);
  
  // Calculate tax breakdown with existing strategies (baseline with current strategies)
  const baselineBreakdown = calculateTaxBreakdown(taxInfo, rates, filteredExistingStrategies);
  
  // Special handling for charitable donations - apply proper itemization logic
  let modifiedTaxInfo = taxInfo;
  if (newStrategy.id === 'charitable_donation' && newStrategy.details?.charitableDonation) {
    const { donationAmount, deductionValue } = newStrategy.details.charitableDonation;
    
    if (donationAmount > 0) {
      const standardDeduction = rates.federal.standardDeduction[taxInfo.filingStatus] || 0;
      
      // Calculate what the itemized deduction would be
      const currentItemizedDeductions = taxInfo.standardDeduction ? 0 : (taxInfo.customDeduction || 0);
      const newItemizedTotal = currentItemizedDeductions + deductionValue;
      
      // Only itemize if the new total exceeds standard deduction
      if (newItemizedTotal > standardDeduction) {
        modifiedTaxInfo = {
          ...taxInfo,
          standardDeduction: false,
          customDeduction: newItemizedTotal
        };
      } else {
        // If itemizing doesn't provide benefit, the strategy provides no tax benefit
        return {
          federal: 0,
          state: 0,
          fica: 0,
          total: 0,
          net: -donationAmount // Net loss since no tax benefit but still costs the donation
        };
      }
    }
  }
  
  // Calculate tax breakdown with existing strategies PLUS the new strategy
  const withNewStrategyBreakdown = calculateTaxBreakdown(
    modifiedTaxInfo, 
    rates, 
    [...filteredExistingStrategies, newStrategy]
  );
  
  // Calculate the effective benefits
  const federalBenefit = Math.max(0, baselineBreakdown.federal - withNewStrategyBreakdown.federal);
  const stateBenefit = Math.max(0, baselineBreakdown.state - withNewStrategyBreakdown.state);
  const ficaBenefit = Math.max(0, baselineBreakdown.fica - withNewStrategyBreakdown.fica);
  const totalBenefit = federalBenefit + stateBenefit + ficaBenefit;
  
  // For charitable donations, calculate net benefit (total savings - donation cost)
  let netBenefit = totalBenefit;
  if (newStrategy.id === 'charitable_donation' && newStrategy.details?.charitableDonation?.donationAmount) {
    const donationCost = newStrategy.details.charitableDonation.donationAmount;
    netBenefit = totalBenefit - donationCost;
  }
  
  const result = {
    federal: Math.round(federalBenefit),
    state: Math.round(stateBenefit),
    fica: Math.round(ficaBenefit),
    total: Math.round(totalBenefit),
    net: Math.round(netBenefit)
  };
  
  return result;
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
      strategyDeductions: 0,
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
  const deferredIncome = calculateDeferredIncome(strategies);

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
  const federalBrackets: BracketCalculation[] = [];

  if (rates.federal?.brackets) {
    let remainingIncome = federalTaxableIncome;
    let lastBracketIncome = 0;

    for (let i = 0; i < rates.federal.brackets.length; i++) {
      const currentBracket = rates.federal.brackets[i];
      const prevBracket = i > 0 ? rates.federal.brackets[i - 1] : null;
      
      const min = prevBracket ? prevBracket[taxInfo.filingStatus] : 0;
      const max = currentBracket[taxInfo.filingStatus];
      const bracketSize = max - min;
      
      // Only process this bracket if we have income that reaches it
      if (remainingIncome > 0) {
        // Calculate income in this bracket
        const incomeInBracket = Math.min(remainingIncome, bracketSize);
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
        lastBracketIncome += bracketSize;
      }
    }
  }

  // Calculate state tax with bracket-by-bracket breakdown
  let state = 0;
  const stateBrackets: BracketCalculation[] = [];

  // For states with no income tax, return empty brackets array
  if (!stateRates?.brackets || stateRates.brackets.length === 0 || stateRates.brackets[0].rate === 0) {
    state = 0;
  } else {
    let remainingIncome = stateTaxableIncome;
    let lastBracketIncome = 0;

    for (let i = 0; i < stateRates.brackets.length; i++) {
      const currentBracket = stateRates.brackets[i];
      const prevBracket = i > 0 ? stateRates.brackets[i - 1] : null;
      
      const min = prevBracket ? prevBracket[taxInfo.filingStatus] : 0;
      const max = currentBracket[taxInfo.filingStatus];
      const bracketSize = max - min;
      
      // Only process this bracket if we have income that reaches it
      if (remainingIncome > 0) {
        // Calculate income in this bracket
        const incomeInBracket = Math.min(remainingIncome, bracketSize);
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
        lastBracketIncome += bracketSize;
      }
    }
  }

  // Calculate FICA taxes
  const wageIncome = taxInfo.wagesIncome || 0;
  const businessIncome = taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0;
  
  // Social Security tax
  const socialSecurityWage = Math.min(wageIncome, rates.fica.socialSecurity.wageBase);
  const socialSecurity = Math.round(socialSecurityWage * rates.fica.socialSecurity.rate);
  
  // Medicare tax
  const medicareBase = wageIncome;
  const medicareAdditional = medicareBase > rates.fica.medicare.additionalThreshold ? 
    (medicareBase - rates.fica.medicare.additionalThreshold) * rates.fica.medicare.additionalRate : 0;
  const medicare = Math.round(medicareBase * rates.fica.medicare.rate + medicareAdditional);
  
  // Self-employment tax
  let selfEmployment = 0;
  if (taxInfo.businessOwner && businessIncome > 0) {
    // Calculate self-employment tax on 92.35% of net earnings (after SE tax deduction)
    const netEarnings = businessIncome * 0.9235;
    const selfEmploymentTax = Math.round(netEarnings * rates.selfEmployment.rate);
    selfEmployment = selfEmploymentTax;
  }
  
  // Total FICA
  const fica = socialSecurity + medicare + selfEmployment;

  // Calculate effective tax rate
  const effectiveRate = totalIncome > 0 ? 
    Math.round(((federal + state + fica) / totalIncome) * 10000) / 100 : 0;

  return {
    federal,
    state,
    socialSecurity,
    medicare,
    selfEmployment,
    fica,
    total: federal + state + fica,
    effectiveRate,
    federalBrackets,
    stateBrackets,
    totalDeductions,
    strategyDeductions,
    shiftedIncome,
    deferredIncome,
    taxableIncome: federalTaxableIncome
  };
}