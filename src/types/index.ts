export interface TaxInfo {
  standardDeduction: boolean;
  customDeduction: number;
  businessOwner: boolean;
  fullName: string;
  email: string;
  filingStatus: string;
  dependents: number;
  homeAddress: string;
  homeLatitude?: number;
  homeLongitude?: number;
  state: string;
  wagesIncome: number;
  passiveIncome: number;
  unearnedIncome: number;
  capitalGains: number;
  businessName: string;
  entityType: string;
  businessAddress: string;
  businessLatitude?: number;
  businessLongitude?: number;
  ordinaryK1Income: number;
  guaranteedK1Income: number;
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