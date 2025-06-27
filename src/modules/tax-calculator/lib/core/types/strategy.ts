export interface TaxStrategy {
  id: string;
  category: 'income_shifted' | 'income_deferred' | 'new_deductions' | 'new_credits';
  name: string;
  description: string;
  estimatedSavings: number;
  link?: string;
  enabled: boolean;
  highIncome?: boolean;
  featured?: boolean;
  synergy?: {
    with: string;
    label: string;
  };
  steps?: Array<{
    completed: boolean;
  }>;
  details?: {
    augustaRule?: {
      daysRented: number;
      dailyRate: number;
      totalRent: number;
      stateBenefit: number;
      federalBenefit: number;
      ficaBenefit: number;
      totalBenefit: number;
    };
    familyManagementCompany?: {
      members: Array<{
        id: string;
        name: string;
        role: string;
        salary: number;
      }>;
      totalSalaries: number;
      stateBenefit: number;
      federalBenefit: number;
      ficaBenefit: number;
      totalBenefit: number;
    };
    hireChildren?: {
      children: Array<{
        age: string;
        filingStatus: string;
        salary: number;
      }>;
      totalSalaries: number;
      stateBenefit: number;
      federalBenefit: number;
      ficaBenefit: number;
      totalBenefit: number;
    };
    charitableDonation?: {
      donationAmount: number;
      fmvMultiplier: number;
      deductionValue: number;
      federalSavings: number;
      stateSavings: number;
      totalBenefit: number;
    };
    costSegregation?: {
      propertyValue: number;
      propertyType: string;
      landValue: number;
      improvementValue: number;
      bonusDepreciationRate: number;
      yearAcquired: number;
      currentYearDeduction: number;
      years2to5Annual: number;
      federalSavings: number;
      stateSavings: number;
      ficaSavings?: number;
      totalBenefit: number;
      totalSavings: number;
    };
    convertibleTaxBonds?: {
      ctbPayment: number;
      ctbTaxOffset: number;
      netSavings: number;
      remainingTaxAfterCtb: number;
      reductionRatio: number;
    };
    reinsurance?: {
      userContribution: number;
      agiReduction: number;
      federalTaxBenefit: number;
      stateTaxBenefit: number;
      totalTaxSavings: number;
      netYear1Cost: number;
      breakevenYears: number;
      futureValue: number;
      capitalGainsTax: number;
      setupAdminCost: number;
    };
    deferredIncome?: {
      deferredAmount: number;
      federalSavings: number;
      stateSavings: number;
      totalBenefit: number;
    };
  };
}