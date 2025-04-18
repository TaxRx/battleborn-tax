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