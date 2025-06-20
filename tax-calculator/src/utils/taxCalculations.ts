import { TaxInfo, TaxRates, TaxStrategy, TaxBreakdown, BracketCalculation } from '../types/tax';

export function calculateMarginalRate(income: number, brackets: any[], filingStatus: string): number {
  const bracket = brackets.find(b => income <= b[filingStatus]);
  return bracket ? bracket.rate : brackets[brackets.length - 1].rate;
}

export function calculateBaseDeductions(taxInfo: TaxInfo, rates: TaxRates): number {
  if (!taxInfo || !rates?.federal) return 0;
  
  if (taxInfo.standard_deduction) {
    return rates.federal.standard_deduction?.[taxInfo.filing_status] || 0;
  }
  return taxInfo.custom_deduction || 0;
}

export function calculateStrategyDeductions(strategies: TaxStrategy[]): number {
  return strategies
    .filter(s => s.enabled)
    .reduce((total, strategy) => {
      if (strategy.id === 'charitable_donation' && strategy.details?.charitable_donation) {
        return total + Math.round(strategy.details.charitable_donation.deduction_value);
      }
      if (strategy.id === 'cost_segregation' && strategy.details?.cost_segregation) {
        return total + Math.round(strategy.details.cost_segregation.current_year_deduction);
      }
      return total;
    }, 0);
}

export function calculateShiftedIncome(strategies: TaxStrategy[]): number {
  return strategies
    .filter(s => s.enabled && s.category === 'income_shifted')
    .reduce((total, strategy) => {
      if (strategy.id === 'hire_children' && strategy.details?.hire_children) {
        return total + strategy.details.hire_children.total_salaries;
      }
      if (strategy.id === 'augusta_rule' && strategy.details?.augusta_rule) {
        return total + (strategy.details.augusta_rule.days_rented * strategy.details.augusta_rule.daily_rate);
      }
      if (strategy.id === 'family_management_company' && strategy.details?.family_management_company) {
        return total + strategy.details.family_management_company.total_salaries;
      }
      return total;
    }, 0);
}

export function calculateCharitableDonationNetSavings(
  taxInfo: TaxInfo,
  rates: TaxRates,
  donation_amount: number,
  deduction_value: number,
  strategies: TaxStrategy[]
) {
  // Create a charitable donation strategy
  const charitable_strategy: TaxStrategy = {
    id: 'charitable_donation',
    name: 'Charitable Donation',
    description: 'Maximize deductions through strategic charitable giving',
    category: 'new_deductions',
    enabled: true,
    estimated_savings: 0,
    details: {
      charitable_donation: {
        donation_amount,
        deduction_value,
        fmv_multiplier: donation_amount > 0 ? deduction_value / donation_amount : 5,
        federal_savings: 0,
        state_savings: 0,
        total_benefit: 0
      }
    }
  };

  // Calculate tax breakdown without the donation
  const base_breakdown = calculateTaxBreakdown(taxInfo, rates);

  // Calculate tax breakdown with the charitable donation strategy
  // Force itemized deductions for charitable donations
  const with_donation_breakdown = calculateTaxBreakdown(
    { ...taxInfo, standard_deduction: false },
    rates,
    [charitable_strategy, ...strategies]
  );

  // Calculate savings
  const federal_savings = Math.max(0, base_breakdown.federal - with_donation_breakdown.federal);
  const state_savings = Math.max(0, base_breakdown.state - with_donation_breakdown.state);
  const total_savings = federal_savings + state_savings;
  
  // Net benefit is total tax savings minus the donation amount
  const net_out_of_pocket = donation_amount;  // This is your actual cost
  const net_benefit = total_savings - net_out_of_pocket;

  return {
    federal: federal_savings,
    state: state_savings,
    net: net_benefit
  };
}

export function calculateStrategyTaxSavings(taxInfo: TaxInfo, rates: TaxRates, strategy: TaxStrategy) {
  const base_breakdown = calculateTaxBreakdown(taxInfo, rates);
  const with_strategy_breakdown = calculateTaxBreakdown(taxInfo, rates, [{ ...strategy, enabled: true }]);

  return {
    federal: Math.max(0, base_breakdown.federal - with_strategy_breakdown.federal),
    state: Math.max(0, base_breakdown.state - with_strategy_breakdown.state),
    fica: Math.max(0, base_breakdown.fica - with_strategy_breakdown.fica)
  };
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
      federal_brackets: [],
      state_brackets: [],
      total_deductions: 0,
      shifted_income: 0,
      deferred_income: 0,
      taxable_income: 0
    };
  }

  // Calculate total income
  const total_income = Math.round(
    (taxInfo.wages_income || 0) + 
    (taxInfo.passive_income || 0) + 
    (taxInfo.unearned_income || 0) +
    (taxInfo.business_owner ? (taxInfo.ordinary_k1_income || 0) + (taxInfo.guaranteed_k1_income || 0) : 0)
  );

  // Calculate deductions
  const base_deductions = calculateBaseDeductions(taxInfo, rates);
  const strategy_deductions = calculateStrategyDeductions(strategies);
  
  // Handle deductions based on whether they're standard or itemized
  let total_deductions;
  if (!taxInfo.standard_deduction) {
    // If itemized, add strategy deductions to base
    total_deductions = base_deductions + strategy_deductions;
  } else if (strategy_deductions > base_deductions) {
    // If standard and strategy deductions exceed it, use only strategy deductions
    total_deductions = strategy_deductions;
  } else {
    // If standard and strategy deductions don't exceed it, use standard deduction
    total_deductions = base_deductions;
  }

  // Calculate shifted and deferred income
  const shifted_income = calculateShiftedIncome(strategies);
  const deferred_income = strategies
    .filter(s => s.enabled && s.category === 'income_deferred')
    .reduce((total, strategy) => {
      if (strategy.details?.deferred_income?.deferred_amount) {
        return total + strategy.details.deferred_income.deferred_amount;
      }
      return total;
    }, 0);

  // Calculate federal taxable income
  const federal_taxable_income = Math.max(0, total_income - shifted_income - deferred_income - total_deductions);

  // Calculate state taxable income (some states have different rules)
  let state_taxable_income = total_income - shifted_income - deferred_income;
  
  // Apply state deductions if the state has them
  const state_rates = rates.state?.[taxInfo.state];
  if (state_rates) {
    // If state has standard deduction, apply it
    if (state_rates.standard_deduction) {
      const state_standard_deduction = state_rates.standard_deduction[taxInfo.filing_status] || 0;
      if (taxInfo.standard_deduction) {
        // If using standard deduction, use the larger of state standard or strategy deductions
        state_taxable_income -= Math.max(state_standard_deduction, strategy_deductions);
      } else {
        // If itemizing, use total deductions
        state_taxable_income -= total_deductions;
      }
    } else {
      // If state has no standard deduction, only apply strategy deductions
      state_taxable_income -= strategy_deductions;
    }
  }

  // Calculate federal tax with bracket-by-bracket breakdown
  let federal = 0;
  let remaining_income = federal_taxable_income;
  const federal_brackets: BracketCalculation[] = [];

  if (rates.federal?.brackets) {
    for (let i = 0; i < rates.federal.brackets.length; i++) {
      const current_bracket = rates.federal.brackets[i];
      const prev_bracket = i > 0 ? rates.federal.brackets[i - 1] : null;
      
      const min = prev_bracket ? prev_bracket[taxInfo.filing_status] : 0;
      const max = current_bracket[taxInfo.filing_status];
      const bracket_size = max - min;
      
      const income_in_bracket = Math.min(remaining_income, bracket_size);
      
      if (income_in_bracket > 0) {
        const tax = Math.round(income_in_bracket * current_bracket.rate);
        federal_brackets.push({
          rate: current_bracket.rate,
          min,
          max,
          taxable: Math.round(income_in_bracket),
          tax
        });
        
        federal += tax;
        remaining_income -= income_in_bracket;
      }
      
      if (remaining_income <= 0) break;
    }
  }

  // Calculate state tax with bracket-by-bracket breakdown
  let state = 0;
  remaining_income = state_taxable_income;
  const state_brackets: BracketCalculation[] = [];

  if (state_rates?.brackets) {
    for (let i = 0; i < state_rates.brackets.length; i++) {
      const current_bracket = state_rates.brackets[i];
      const prev_bracket = i > 0 ? state_rates.brackets[i - 1] : null;
      
      const min = prev_bracket ? prev_bracket[taxInfo.filing_status] : 0;
      const max = current_bracket[taxInfo.filing_status];
      const bracket_size = max - min;
      
      const income_in_bracket = Math.min(remaining_income, bracket_size);
      
      if (income_in_bracket > 0) {
        const tax = Math.round(income_in_bracket * current_bracket.rate);
        state_brackets.push({
          rate: current_bracket.rate,
          min,
          max,
          taxable: Math.round(income_in_bracket),
          tax
        });
        
        state += tax;
        remaining_income -= income_in_bracket;
      }
      
      if (remaining_income <= 0) break;
    }
  }

  // Calculate FICA taxes
  const social_security_income = Math.min((taxInfo.wages_income || 0) - shifted_income, rates.fica?.social_security?.wage_base || 0);
  const social_security = Math.round(social_security_income * (rates.fica?.social_security?.rate || 0));

  const medicare_rate = ((taxInfo.wages_income || 0) - shifted_income) > (rates.fica?.medicare?.additional_threshold || 0)
    ? (rates.fica?.medicare?.rate || 0) + (rates.fica?.medicare?.additional_rate || 0)
    : (rates.fica?.medicare?.rate || 0);
  const medicare = Math.round(((taxInfo.wages_income || 0) - shifted_income) * medicare_rate);

  // Calculate self-employment tax only for Sole Proprietors
  const self_employment = taxInfo.business_owner && taxInfo.entity_type === 'Sole Prop' && taxInfo.ordinary_k1_income
    ? Math.round((taxInfo.ordinary_k1_income - shifted_income) * (rates.self_employment?.rate || 0))
    : 0;

  const fica = social_security + medicare + self_employment;

  const effective_rate = total_income > 0 ? ((federal + state + fica) / total_income) * 100 : 0;

  return {
    federal,
    state,
    social_security,
    medicare,
    self_employment,
    fica,
    total: federal + state + fica,
    effective_rate: Math.round(effective_rate * 100) / 100,
    federal_brackets,
    state_brackets,
    total_deductions,
    shifted_income,
    deferred_income,
    taxable_income: federal_taxable_income
  };
}