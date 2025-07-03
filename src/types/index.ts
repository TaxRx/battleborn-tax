export interface TaxInfo {
  id?: string; // Optional ID for edit mode
  standardDeduction: boolean;
  customDeduction: number;
  businessOwner: boolean;
  fullName: string;
  email: string;
  phone?: string;
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_household';
  dependents: number;
  homeAddress?: string;
  homeLatitude?: number;
  homeLongitude?: number;
  state: string;
  wagesIncome: number;
  passiveIncome: number;
  unearnedIncome: number;
  capitalGains: number;
  businessName?: string;
  entityType?: 'LLC' | 'S-Corp' | 'C-Corp' | 'Sole Prop' | 'Partnership';
  businessAddress?: string;
  businessLatitude?: number;
  businessLongitude?: number;
  ordinaryK1Income?: number;
  guaranteedK1Income?: number;
  totalIncome?: number;
  householdIncome?: number;
  businessAnnualRevenue?: number;
  deductionLimitReached?: boolean;
}

export interface BracketCalculation {
  rate: number;
  min: number;
  max: number;
  taxable: number;
  tax: number;
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
  federalBrackets: BracketCalculation[];
  stateBrackets: BracketCalculation[];
  totalDeductions: number;
  strategyDeductions: number;
  shiftedIncome: number;
  deferredIncome: number;
  taxableIncome: number;
}

export interface Category {
  id: string;
  name: string;
  areas: Area[];
}

export interface Area {
  id: string;
  name: string;
  focuses: Focus[];
}

export interface Focus {
  id: string;
  name: string;
  description: string;
}

export interface ResearchActivity {
  id: string;
  name: string;
  description: string;
  focusId: string;
  subcomponents: ResearchSubcomponent[];
  year: number;
  practicePercentage: number;
  qualifiedExpenses?: any;
}

export interface ResearchSubcomponent {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
  frequencyPercentage: number;
  timePercentage: number;
  yearPercentage: number;
  generalDescription?: string;
  hypothesis?: string;
  methodology?: string;
  documents?: any[];
}

export interface SelectedActivity extends ResearchActivity {
  subcomponents: SelectedSubcomponent[];
}

export interface SelectedSubcomponent extends ResearchSubcomponent {
  documents?: any[];
}

export interface Month {
  value: number;
  label: string;
  percentage: number;
}

export interface ContractorExpense {
  id: string;
  name: string;
  amount: number;
  year: number;
  activityId: string;
  subcomponentId: string;
  description: string;
  documents?: any[];
}

export interface SupplyExpense {
  id: string;
  name: string;
  amount: number;
  year: number;
  activityId: string;
  subcomponentId: string;
  description: string;
  documents?: any[];
}

export enum EmployeeRole {
  RESEARCH_LEADER = 'RESEARCH_LEADER',
  CLINICIAN = 'CLINICIAN',
  MIDLEVEL = 'MIDLEVEL',
  CLINICAL_ASSISTANT = 'CLINICAL_ASSISTANT'
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  annualWage: number;
  isBusinessOwner: boolean;
  yearlyActivities: {
    [year: number]: {
      [activityId: string]: {
        percentage: number;
        isSelected: boolean;
        subcomponents: {
          [subcomponentId: string]: {
            percentage: number;
            isSelected: boolean;
            roleDescription?: string;
          }
        }
      }
    }
  }
} 