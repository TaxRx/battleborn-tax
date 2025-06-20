import { TaxInfo, TaxBreakdown, TaxStrategy } from '../types/tax';

export function getTaxStrategies(taxInfo: TaxInfo, breakdown: TaxBreakdown): TaxStrategy[] {
  const strategies: TaxStrategy[] = [];

  // Income Shifted Strategies
  if (taxInfo.business_owner) {
    strategies.push({
      id: 'augusta_rule',
      category: 'income_shifted',
      name: 'Augusta Rule',
      description: 'Rent your personal residence to your business for up to 14 days tax-free',
      estimated_savings: 0,
      link: 'Get Started',
      enabled: false,
      details: {
        augusta_rule: {
          days_rented: 14,
          daily_rate: 1500,
          total_rent: 21000,
          state_benefit: 0,
          federal_benefit: 0,
          fica_benefit: 0,
          total_benefit: 0
        }
      },
      synergy: {
        with: 'family_management_company',
        label: 'Synergy with FMC'
      }
    });

    strategies.push({
      id: 'family_management_company',
      category: 'income_shifted',
      name: 'Family Management Company',
      description: 'Create a family management company to handle Augusta Rule rentals and maximize tax benefits through strategic income shifting',
      estimated_savings: 0,
      link: 'Get Started',
      enabled: false,
      details: {
        family_management_company: {
          members: [],
          total_salaries: 0,
          state_benefit: 0,
          federal_benefit: 0,
          fica_benefit: 0,
          total_benefit: 0
        }
      },
      synergy: {
        with: 'augusta_rule',
        label: 'Synergy with Augusta Rule'
      }
    });

    if (taxInfo.dependents && taxInfo.dependents > 0) {
      strategies.push({
        id: 'hire_children',
        category: 'income_shifted',
        name: 'Hire Your Children',
        description: "Savings through your children's lower tax bracket",
        estimated_savings: 0,
        link: 'Get Started',
        enabled: false,
        details: {
          hire_children: {
            children: Array(taxInfo.dependents).fill({
              age: 'Under 18',
              filing_status: 'Single',
              salary: 13850
            }),
            total_salaries: 13850 * taxInfo.dependents,
            state_benefit: 0,
            federal_benefit: 0,
            fica_benefit: 0,
            total_benefit: 0
          }
        }
      });
    }
  }

  // New Deductions
  const totalIncome = taxInfo.wages_income + taxInfo.passive_income + taxInfo.unearned_income +
    (taxInfo.business_owner ? (taxInfo.ordinary_k1_income || 0) + (taxInfo.guaranteed_k1_income || 0) : 0);

  if (totalIncome > 100000) {
    strategies.push({
      id: 'charitable_donation',
      category: 'new_deductions',
      name: 'Charitable Donation Strategy',
      description: 'Maximize deductions through strategic charitable giving',
      estimated_savings: 0,
      link: 'Get Started',
      enabled: false,
      details: {
        charitable_donation: {
          donation_amount: 0,
          fmv_multiplier: 5,
          deduction_value: 0,
          federal_savings: 0,
          state_savings: 0,
          total_benefit: 0
        }
      },
      high_income: totalIncome >= 500000
    });
  }

  // Income Deferred Strategies
  if (taxInfo.business_owner && breakdown.total > 150000) {
    strategies.push({
      id: 'reinsurance',
      category: 'income_deferred',
      name: 'Reinsurance Options',
      description: 'Defer business income through captive insurance strategies',
      estimated_savings: 0,
      link: 'Get Started',
      enabled: false
    });
  }

  if (taxInfo.business_owner) {
    strategies.push({
      id: 'cost_segregation',
      category: 'new_deductions',
      name: 'Cost Segregation',
      description: 'Accelerate depreciation on business property',
      estimated_savings: 0,
      link: 'Get Started',
      enabled: false,
      details: {
        cost_segregation: {
          property_value: 1000000,
          property_type: 'residential',
          land_value: 0,
          improvement_value: 0,
          bonus_depreciation_rate: 0,
          year_acquired: 0,
          current_year_deduction: 0,
          years_2_to_5_annual: 0,
          federal_savings: 0,
          state_savings: 0,
          total_savings: 0,
          total_benefit: 0
        }
      }
    });
  }

  // Tax Credits
  if (taxInfo.business_owner) {
    strategies.push({
      id: 'research_credit',
      category: 'new_credits',
      name: 'R&D Tax Credit',
      description: 'Credit for qualified research and development expenses',
      estimated_savings: 0,
      link: 'Get Started',
      enabled: false
    });

    strategies.push({
      id: 'work_opportunity',
      category: 'new_credits',
      name: 'Work Opportunity Credit',
      description: 'Credit for hiring from targeted groups',
      estimated_savings: 0,
      link: 'Get Started',
      enabled: false
    });
  }

  if (breakdown.total > 75000) {
    strategies.push({
      id: 'energy_credit',
      category: 'new_credits',
      name: 'Energy Tax Credits',
      description: 'Credits for energy-efficient improvements',
      estimated_savings: 0,
      link: 'Get Started',
      enabled: false
    });
  }

  return strategies;
}