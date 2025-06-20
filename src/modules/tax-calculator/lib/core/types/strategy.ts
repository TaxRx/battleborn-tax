export interface TaxStrategy {
  id: string;
  category: 'income_shifted' | 'income_deferred' | 'new_deductions' | 'new_credits';
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
  };
}