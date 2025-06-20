export interface TaxInfo {
  standard_deduction: boolean;
  business_owner: boolean;
  full_name: string;
  email: string;
  filing_status: 'single' | 'married_joint' | 'married_separate' | 'head_household';
  dependents: number;
  home_address: string;
  state: string;
  wages_income: number;
  passive_income: number;
  unearned_income: number;
  capital_gains: number;
  custom_deduction?: number;
  charitable_donation?: number;
  business_name?: string;
  entity_type?: 'LLC' | 'S-Corp' | 'C-Corp' | 'Sole Prop';
  ordinary_k1_income?: number;
  guaranteed_k1_income?: number;
  business_address?: string;
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
    standard_deduction: {
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
    standard_deduction: {
      single: number;
      married_joint: number;
      married_separate: number;
      head_household: number;
    };
  }>;
  fica: {
    social_security: {
      rate: number;
      wage_base: number;
    };
    medicare: {
      rate: number;
      additional_rate: number;
      additional_threshold: number;
    };
  };
  self_employment: {
    rate: number;
  };
}

export interface TaxBreakdown {
  federal: number;
  state: number;
  social_security: number;
  medicare: number;
  self_employment: number;
  fica: number;
  total: number;
  effective_rate: number;
  federal_brackets: Array<{
    rate: number;
    min: number;
    max: number;
    taxable: number;
    tax: number;
  }>;
  state_brackets: Array<{
    rate: number;
    min: number;
    max: number;
    taxable: number;
    tax: number;
  }>;
}