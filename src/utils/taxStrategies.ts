import { TaxInfo, TaxBreakdown, TaxStrategy } from '../types';

export function getTaxStrategies(taxInfo: TaxInfo, breakdown: TaxBreakdown): TaxStrategy[] {
  const strategies: TaxStrategy[] = [];

  // Income Shifted Strategies
  if (taxInfo.businessOwner) {
    strategies.push({
      id: 'augusta_rule',
      category: 'income_shifted',
      name: 'Augusta Rule',
      description: 'Rent your personal residence to your business for up to 14 days tax-free',
      estimatedSavings: 0,
      link: 'Get Started',
      enabled: false,
      details: {
        augustaRule: {
          daysRented: 14,
          dailyRate: 1500,
          totalRent: 21000,
          stateBenefit: 0,
          federalBenefit: 0,
          ficaBenefit: 0,
          totalBenefit: 0
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
      estimatedSavings: 0,
      link: 'Get Started',
      enabled: false,
      details: {
        familyManagementCompany: {
          members: [],
          totalSalaries: 0,
          stateBenefit: 0,
          federalBenefit: 0,
          ficaBenefit: 0,
          totalBenefit: 0
        }
      },
      synergy: {
        with: 'augusta_rule',
        label: 'Synergy with Augusta Rule'
      }
    });

    if (taxInfo.dependents > 0) {
      strategies.push({
        id: 'hire_children',
        category: 'income_shifted',
        name: 'Hire Your Children',
        description: "Savings through your children's lower tax bracket",
        estimatedSavings: 0,
        link: 'Get Started',
        enabled: false,
        details: {
          hireChildren: {
            children: Array(taxInfo.dependents).fill({
              age: 'Under 18',
              filingStatus: 'Single',
              salary: 13850
            }),
            totalSalaries: 13850 * taxInfo.dependents,
            stateBenefit: 0,
            federalBenefit: 0,
            ficaBenefit: 0,
            totalBenefit: 0
          }
        }
      });
    }
  }

  // New Deductions
  const totalIncome = taxInfo.wagesIncome + taxInfo.passiveIncome + taxInfo.unearnedIncome +
    (taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0);

  if (totalIncome > 100000) {
    strategies.push({
      id: 'charitable_donation',
      category: 'new_deductions',
      name: 'Charitable Donation Strategy',
      description: 'Maximize deductions through strategic charitable giving',
      estimatedSavings: 0,
      link: 'Get Started',
      enabled: false,
      details: {
        charitableDonation: {
          donationAmount: 0,
          fmvMultiplier: 5,
          deductionValue: 0,
          federalSavings: 0,
          stateSavings: 0,
          totalBenefit: 0
        }
      },
      highIncome: totalIncome >= 500000
    });
  }

  // Income Deferred Strategies
  if (taxInfo.businessOwner && breakdown.total > 150000) {
    strategies.push({
      id: 'reinsurance',
      category: 'income_deferred',
      name: 'Reinsurance Options',
      description: 'Defer business income through captive insurance strategies',
      estimatedSavings: 0,
      link: 'Get Started',
      enabled: false
    });
  }

  if (taxInfo.businessOwner) {
    strategies.push({
      id: 'cost_segregation',
      category: 'new_deductions',
      name: 'Cost Segregation',
      description: 'Accelerate depreciation on business property',
      estimatedSavings: 0,
      link: 'Get Started',
      enabled: false,
      details: {
        costSegregation: {
          propertyValue: 1000000,
          propertyAge: 0,
          remainingLife: 27.5,
          currentYearDeduction: 0,
          federalSavings: 0,
          stateSavings: 0,
          totalSavings: 0
        }
      }
    });
  }

  // Tax Credits
  if (taxInfo.businessOwner) {
    strategies.push({
      id: 'research_credit',
      category: 'new_credits',
      name: 'R&D Tax Credit',
      description: 'Credit for qualified research and development expenses',
      estimatedSavings: 0,
      link: 'Get Started',
      enabled: false
    });

    strategies.push({
      id: 'work_opportunity',
      category: 'new_credits',
      name: 'Work Opportunity Credit',
      description: 'Credit for hiring from targeted groups',
      estimatedSavings: 0,
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
      estimatedSavings: 0,
      link: 'Get Started',
      enabled: false
    });
  }

  return strategies;
}