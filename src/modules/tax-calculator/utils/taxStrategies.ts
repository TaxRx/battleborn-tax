import { TaxInfo, TaxBreakdown } from '../types';
import { TaxStrategy } from '../../lib/core/types/strategy';

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

    // Make Hire Your Children available for demo purposes (even with 0 dependents)
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
          children: Array(Math.max(1, taxInfo.dependents)).fill({
            age: 'Under 18',
            filingStatus: 'Single',
            salary: 13850
          }),
          totalSalaries: 13850 * Math.max(1, taxInfo.dependents),
          stateBenefit: 0,
          federalBenefit: 0,
          ficaBenefit: 0,
          totalBenefit: 0
        }
      }
    });
  }

  // New Deductions - Lower threshold for demo purposes
  const totalIncome = taxInfo.wagesIncome + taxInfo.passiveIncome + taxInfo.unearnedIncome +
    (taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0);

  // Lower threshold from 100000 to 50000 for demo purposes
  if (totalIncome > 50000) {
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

  // Income Deferred Strategies - Lower threshold for demo purposes
  if (taxInfo.businessOwner && breakdown.total > 50000) { // Lowered from 75000 to 50000
    strategies.push({
      id: 'reinsurance',
      category: 'income_shifted',
      name: '831b Reinsurance',
      description: 'Microcaptive insurance arrangements reduce AGI and convert ordinary income to long-term capital gains',
      estimatedSavings: 0,
      link: 'Get Started',
      enabled: false,
      details: {
        reinsurance: {
          userContribution: 0,
          agiReduction: 0,
          federalTaxBenefit: 0,
          stateTaxBenefit: 0,
          totalTaxSavings: 0,
          netYear1Cost: 0,
          breakevenYears: 0,
          futureValue: 0,
          capitalGainsTax: 0,
          setupAdminCost: 0
        }
      },
      highIncome: totalIncome >= 400000 // Minimum AGI threshold for eligibility
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
          propertyType: 'residential',
          landValue: 200000,
          improvementValue: 800000,
          bonusDepreciationRate: 60,
          yearAcquired: new Date().getFullYear(),
          currentYearDeduction: 0,
          years2to5Annual: 0,
          federalSavings: 0,
          stateSavings: 0,
          totalSavings: 0,
          totalBenefit: 0
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

  // Lower threshold for Energy Tax Credits for demo purposes
  if (breakdown.total > 50000) { // Lowered from 75000
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

  // Convertible Tax Bonds - Available for high-income taxpayers
  if (totalIncome > 200000) {
    strategies.push({
      id: 'convertible_tax_bonds',
      category: 'income_shifted',
      name: 'Convertible Tax Bonds',
      description: 'Offset remaining tax burden through strategic CTB payments',
      estimatedSavings: 0,
      link: 'Get Started',
      enabled: false,
      details: {
        convertibleTaxBonds: {
          ctbPayment: 0,
          ctbTaxOffset: 0,
          netSavings: 0,
          remainingTaxAfterCtb: 0,
          reductionRatio: 0.75
        }
      },
      highIncome: totalIncome >= 500000
    });
  }

  return strategies;
}