export interface BracketCalculation {
  rate: number;
  min: number;
  max: number;
  taxable: number;
  tax: number;
}

export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_household';

export interface TaxBracket {
  rate: number;
  min: number;
  max: number;
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
  state: {
    [key: string]: {
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
  };
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

export interface TaxStrategy {
  id: string;
  category: 'income_shifted' | 'income_deferred' | 'new_deductions' | 'new_credits';
  name: string;
  description: string;
  estimated_savings: number;
  link?: string;
  enabled: boolean;
  high_income?: boolean;
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
    augusta_rule?: {
      days_rented: number;
      daily_rate: number;
      total_rent: number;
      state_benefit: number;
      federal_benefit: number;
      fica_benefit: number;
      total_benefit: number;
    };
    family_management_company?: {
      members: Array<{
        id: string;
        name: string;
        role: string;
        salary: number;
      }>;
      total_salaries: number;
      state_benefit: number;
      federal_benefit: number;
      fica_benefit: number;
      total_benefit: number;
    };
    hire_children?: {
      children: Array<{
        age: string;
        filing_status: string;
        salary: number;
      }>;
      total_salaries: number;
      state_benefit: number;
      federal_benefit: number;
      fica_benefit: number;
      total_benefit: number;
    };
    charitable_donation?: {
      donation_amount: number;
      fmv_multiplier: number;
      deduction_value: number;
      federal_savings: number;
      state_savings: number;
      total_benefit: number;
    };
    cost_segregation?: {
      property_value: number;
      property_type: string;
      land_value: number;
      improvement_value: number;
      bonus_depreciation_rate: number;
      year_acquired: number;
      current_year_deduction: number;
      years_2_to_5_annual: number;
      federal_savings: number;
      state_savings: number;
      total_savings: number;
      total_benefit: number;
    };
    deferred_income?: {
      deferred_amount: number;
      federal_savings: number;
      state_savings: number;
      total_benefit: number;
    };
  };
}

export interface TaxInfo {
  user_id: string;
  filing_status: FilingStatus;
  standard_deduction: boolean;
  custom_deduction: number;
  wages_income: number;
  passive_income: number;
  unearned_income: number;
  capital_gains: number;
  business_owner: boolean;
  ordinary_k1_income: number;
  guaranteed_k1_income: number;
  state: string;
  full_name?: string;
  email?: string;
  home_address?: string;
  business_name?: string;
  entity_type?: 'LLC' | 'S-Corp' | 'C-Corp' | 'Sole Prop' | 'Partnership';
  business_address?: string;
  dependents?: number;
  household_income?: number;
  deduction_limit_reached?: boolean;
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
  federal_brackets: BracketCalculation[];
  state_brackets: BracketCalculation[];
  total_deductions: number;
  shifted_income: number;
  deferred_income: number;
  taxable_income: number;
}

export interface SavedCalculation {
  id: string;
  user_id: string;
  year: number;
  date: string;
  tax_info: TaxInfo;
  breakdown: TaxBreakdown;
  strategies: TaxStrategy[];
}