export interface TaxInfo {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  standardDeduction: boolean;
  businessOwner: boolean;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_household';
  dependents: number;
  homeAddress: string;
  city?: string;
  state: string;
  zipCode?: string;
  // Year-based income data
  years: PersonalYear[];
  // Legacy fields for backward compatibility
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
  householdIncome?: number;
  businessAnnualRevenue?: number;
  businesses?: BusinessInfo[];
}

export interface PersonalYear {
  year: number;
  wagesIncome: number;
  passiveIncome: number;
  unearnedIncome: number;
  capitalGains: number;
  longTermCapitalGains: number;
  householdIncome: number;
  ordinaryIncome: number;
  isActive: boolean;
}

export interface BusinessInfo {
  id?: string;
  businessName: string;
  entityType: 'LLC' | 'S-Corp' | 'C-Corp' | 'Partnership' | 'Sole Proprietorship' | 'Other';
  ein?: string;
  startYear?: number;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessZip?: string;
  businessPhone?: string;
  businessEmail?: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  ordinaryK1Income?: number;
  guaranteedK1Income?: number;
  years: BusinessYear[];
  isActive: boolean;
}

export interface BusinessYear {
  year: number;
  isActive: boolean;
  ordinaryK1Income?: number;
  guaranteedK1Income?: number;
  annualRevenue?: number;
  employeeCount?: number;
  industry?: string;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessZip?: string;
  businessPhone?: string;
  businessEmail?: string;
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
  state: Record<string, {
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
  }>;
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
}