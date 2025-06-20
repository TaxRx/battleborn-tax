export interface User {
  id: string;
  email: string;
  fullName: string;
  homeAddress?: string;
  businessName?: string;
  businessAddress?: string;
  entityType?: 'LLC' | 'S-Corp' | 'C-Corp' | 'Sole Prop';
  filingStatus?: 'single' | 'married_joint' | 'married_separate' | 'head_household';
  state?: string;
  dependents?: number;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaxRates {
  year: number;
  federal: {
    brackets: Array<{
      rate: number;
      single: number;
      married_joint: number;
      married_separate: number;
      head_household: number;
    }>;
    standardDeduction: {
      single: number;
      married_joint: number;
      married_separate: number;
      head_household: number;
    };
  };
  state: {
    [key: string]: {
      brackets: Array<{
        rate: number;
        single: number;
        married_joint: number;
        married_separate: number;
        head_household: number;
      }>;
      standardDeduction: {
        single: number;
        married_joint: number;
        married_separate: number;
        head_household: number;
      };
    };
  };
  fica: {
    socialSecurity: {
      rate: number;
      wageBase: number;
    };
    medicare: {
      rate: number;
      additionalRate: number;
      additionalThreshold: number;
    };
  };
  selfEmployment: {
    rate: number;
  };
}

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
  steps?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
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
      totalSavings: number;
      totalBenefit: number;
    };
    deferredIncome?: {
      deferredAmount: number;
      federalSavings: number;
      stateSavings: number;
      totalBenefit: number;
    };
  };
}

export interface TaxInfo {
  standardDeduction: boolean;
  businessOwner: boolean;
  fullName: string;
  email: string;
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_household';
  dependents: number;
  homeAddress: string;
  state: string;
  wagesIncome: number;
  passiveIncome: number;
  unearnedIncome: number;
  capitalGains: number;
  customDeduction?: number;
  charitableDeduction?: number;
  businessName?: string;
  entityType?: 'LLC' | 'S-Corp' | 'C-Corp' | 'Sole Prop';
  ordinaryK1Income?: number;
  guaranteedK1Income?: number;
  businessAddress?: string;
  deductionLimitReached?: boolean;
  householdIncome?: number;
}

export interface SavedCalculation {
  id: string;
  year: number;
  date: string;
  taxInfo: TaxInfo;
  breakdown: TaxBreakdown;
  strategies: TaxStrategy[];
}

export interface TaxBreakdown {
  federal: number;
  state: number;
  socialSecurity: number;
  medicare: number;
  selfEmployment: number;
  fica: number;
  total: number;
  effectiveRate: number;
  federalBrackets: Array<{
    rate: number;
    min: number;
    max: number;
    taxable: number;
    tax: number;
  }>;
  stateBrackets: Array<{
    rate: number;
    min: number;
    max: number;
    taxable: number;
    tax: number;
  }>;
  totalDeductions: number;
  strategyDeductions: number;
  shiftedIncome: number;
  deferredIncome: number;
  taxableIncome: number;
}