import { TaxInfo, TaxRates, TaxBreakdown } from '../types';
import { TaxStrategy } from '../lib/core/types/strategy';

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
    console.log('=== TAX CALCULATION DEBUG ===');
    console.log('Missing taxInfo or rates:', { taxInfo: !!taxInfo, rates: !!rates });
    console.log('============================');
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

  // Debug logging
  console.log('=== TAX CALCULATION DEBUG ===');
  console.log('Input taxInfo:', taxInfo);
  console.log('Input rates:', rates);
  console.log('Input strategies:', strategies);

  // Calculate total income
  const totalIncome = Math.round(
    (taxInfo.wagesIncome || 0) + 
    (taxInfo.passiveIncome || 0) + 
    (taxInfo.unearnedIncome || 0) +
    (taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0)
  );

  console.log('Total income calculation:', {
    wagesIncome: taxInfo.wagesIncome || 0,
    passiveIncome: taxInfo.passiveIncome || 0,
    unearnedIncome: taxInfo.unearnedIncome || 0,
    businessOwner: taxInfo.businessOwner,
    ordinaryK1Income: taxInfo.ordinaryK1Income || 0,
    guaranteedK1Income: taxInfo.guaranteedK1Income || 0,
    totalIncome
  });

  // Calculate deductions
  const baseDeductions = calculateBaseDeductions(taxInfo, rates);
  const strategyDeductions = calculateStrategyDeductions(strategies);
  
  console.log('Deductions calculation:', {
    baseDeductions,
    strategyDeductions,
    standardDeduction: taxInfo.standardDeduction,
    customDeduction: taxInfo.customDeduction
  });
  
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

  console.log('Total deductions:', totalDeductions);

  // Calculate shifted and deferred income
  const shiftedIncome = calculateShiftedIncome(strategies);
  const deferredIncome = calculateDeferredIncome(strategies);

  console.log('Income adjustments:', { shiftedIncome, deferredIncome });

  // Calculate federal taxable income
  const federalTaxableIncome = Math.max(0, totalIncome - shiftedIncome - deferredIncome - totalDeductions);

  console.log('Federal taxable income:', federalTaxableIncome);

  // Calculate state taxable income (some states have different rules)
  let stateTaxableIncome = totalIncome - shiftedIncome - deferredIncome;
  
  // Apply state deductions if the state has them
  const stateRates = rates.state?.[taxInfo.state];
  console.log('State rates lookup:', { state: taxInfo.state, stateRates: !!stateRates });
  
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

  console.log('State taxable income:', stateTaxableIncome);
  console.log('============================');

  // Calculate federal tax with bracket-by-bracket breakdown
  let federal = 0;
  let remainingIncome = federalTaxableIncome;
  const federalBrackets: BracketCalculation[] = [];

  console.log('=== FEDERAL TAX CALCULATION DEBUG ===');
  console.log('Federal taxable income:', federalTaxableIncome);
  console.log('Federal rates available:', !!rates.federal?.brackets);
  console.log('Federal brackets:', rates.federal?.brackets);
  console.log('Filing status:', taxInfo.filingStatus);

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

  console.log('Final federal tax:', federal, 'isNaN:', isNaN(federal));
  console.log('=====================================');

  // Calculate state tax with bracket-by-bracket breakdown
  let state = 0;
  remainingIncome = stateTaxableIncome;
  const stateBrackets: BracketCalculation[] = [];

  console.log('=== STATE TAX CALCULATION DEBUG ===');
  console.log('State taxable income:', stateTaxableIncome);
  console.log('State rates available:', !!stateRates?.brackets);
  console.log('State brackets:', stateRates?.brackets);

  // For states with no income tax, return empty brackets array
  if (!stateRates?.brackets || stateRates.brackets.length === 0 || stateRates.brackets[0].rate === 0) {
    state = 0;
    console.log('No state tax - brackets empty or first bracket rate is 0');
  } else {
    for (let i = 0; i < stateRates.brackets.length; i++) {
      const currentBracket = stateRates.brackets[i];
      const prevBracket = i > 0 ? stateRates.brackets[i - 1] : null;
      
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

  console.log('Final state tax:', state, 'isNaN:', isNaN(state));
  console.log('=====================================');

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

  // Apply CTB (Convertible Tax Bonds) tax offsets
  const ctbStrategies = strategies.filter(s => s.enabled && s.id === 'convertible_tax_bonds');
  let ctbFederalOffset = 0;
  let ctbStateOffset = 0;

  ctbStrategies.forEach(strategy => {
    if (strategy.details?.convertibleTaxBonds) {
      const { ctbTaxOffset } = strategy.details.convertibleTaxBonds;
      // Assume 70% federal, 30% state allocation for CTB offsets
      ctbFederalOffset += ctbTaxOffset * 0.7;
      ctbStateOffset += ctbTaxOffset * 0.3;
    }
  });

  // Apply CTB offsets (cannot reduce tax below zero)
  federal = Math.max(0, federal - ctbFederalOffset);
  state = Math.max(0, state - ctbStateOffset);

  const total = federal + state + fica;
  const effectiveRate = totalIncome > 0 ? (total / totalIncome) * 100 : 0;

  const result = {
    federal,
    state,
    socialSecurity,
    medicare,
    selfEmployment,
    fica,
    total,
    effectiveRate,
    federalBrackets,
    stateBrackets,
    totalDeductions,
    strategyDeductions,
    shiftedIncome,
    deferredIncome,
    taxableIncome: federalTaxableIncome
  };

  // Final debug logging
  console.log('=== FINAL TAX CALCULATION RESULTS ===');
  console.log('Federal tax:', federal, 'type:', typeof federal);
  console.log('State tax:', state, 'type:', typeof state);
  console.log('Social Security:', socialSecurity, 'type:', typeof socialSecurity);
  console.log('Medicare:', medicare, 'type:', typeof medicare);
  console.log('Self Employment:', selfEmployment, 'type:', typeof selfEmployment);
  console.log('FICA total:', fica, 'type:', typeof fica);
  console.log('Total tax:', result.total, 'type:', typeof result.total);
  console.log('Effective rate:', effectiveRate, 'type:', typeof effectiveRate);
  console.log('Is any NaN?', {
    federal: isNaN(federal),
    state: isNaN(state),
    socialSecurity: isNaN(socialSecurity),
    medicare: isNaN(medicare),
    selfEmployment: isNaN(selfEmployment),
    fica: isNaN(fica),
    total: isNaN(result.total),
    effectiveRate: isNaN(effectiveRate)
  });
  console.log('=====================================');

  return result;
}