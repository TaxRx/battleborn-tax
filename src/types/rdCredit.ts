export interface Subcomponent {
  id: string;
  name: string;
  utilizationPercentage: number;
  timePercentage: number;
  yearPercentage: number;
}

export interface QRA {
  id: string;
  name: string;
  practicePercentage: number;
  subcomponents: Subcomponent[];
}

export interface QRAModifier {
  id: string;
  included: boolean;
  modificationPercentage: number;
}

export interface Employee {
  id: string;
  name: string;
  w2Wage: number;
  qraModifiers: QRAModifier[];
}

export interface Contractor {
  id: string;
  name: string;
  payment: number;
  qraModifiers: QRAModifier[];
}

export interface Supply {
  id: string;
  name: string;
  cost: number;
  qraModifiers: QRAModifier[];
}

export interface YearData {
  year: number;
  grossReceipts: number;
  qreAmount: number;
}

export interface CreditCalculation {
  year: number;
  qreAmount: number;
  previousYears: YearData[];
  use280C: boolean;
  calculationType: 'ASC' | 'STANDARD';
  state?: string;
}

export interface CreditResult {
  federal: {
    ascCredit?: number;
    standardCredit?: number;
    selectedMethod: 'ASC' | 'STANDARD';
    finalAmount: number;
  };
  state?: {
    amount: number;
    method: string;
  };
}

export interface RDCreditCalculation {
  id: string;
  userId: string;
  year: number;
  qras: QRA[];
  employees: Employee[];
  contractors: Contractor[];
  supplies: Supply[];
  totalCredit: number;
  createdAt: string;
  updatedAt: string;
} 