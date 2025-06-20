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
  calculatedPercentage?: number;
}

export interface Employee {
  id: string;
  name: string;
  w2Wage: number;
  qraModifiers: {
    [qraId: string]: {
      included: boolean;
      modificationPercentage: number;
    }
  };
  calculatedQREAmount?: number;
}

export interface Contractor {
  id: string;
  name: string;
  wage1099: number;
  qraModifiers: {
    [qraId: string]: {
      included: boolean;
      modificationPercentage: number;
    }
  };
  calculatedQREAmount?: number;
}

export interface Supply {
  id: string;
  name: string;
  totalValue: number;
  subcomponentPercentages: {
    [subcomponentId: string]: number;
  };
  calculatedAmount?: number;
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

// Calculation Functions
export const calculateQRAPercentage = (qra: QRA): number => {
  const subcomponentTotal = qra.subcomponents.reduce((total, sub) => {
    return total + (sub.utilizationPercentage * sub.timePercentage * sub.yearPercentage) / 1000000; // Convert from percentages
  }, 0);
  
  return (qra.practicePercentage * subcomponentTotal) / 100;
};

export const calculateEmployeeQRE = (employee: Employee, qras: QRA[]): number => {
  if (!employee.qraModifiers) return 0;
  
  const totalPercentage = Object.entries(employee.qraModifiers).reduce((total, [qraId, modifier]) => {
    if (!modifier.included) return total;
    const qra = qras.find(q => q.id === qraId);
    if (!qra?.calculatedPercentage) return total;
    return total + (qra.calculatedPercentage * modifier.modificationPercentage) / 100;
  }, 0);
  
  return employee.w2Wage * totalPercentage;
};

export const calculateContractorQRE = (contractor: Contractor, qras: QRA[]): number => {
  if (!contractor.qraModifiers) return 0;
  
  const totalPercentage = Object.entries(contractor.qraModifiers).reduce((total, [qraId, modifier]) => {
    if (!modifier.included) return total;
    const qra = qras.find(q => q.id === qraId);
    if (!qra?.calculatedPercentage) return total;
    return total + (qra.calculatedPercentage * modifier.modificationPercentage) / 100;
  }, 0);
  
  return contractor.wage1099 * 0.65 * totalPercentage;
};

export const calculateSupplyQRE = (supply: Supply): number => {
  const totalPercentage = Object.values(supply.subcomponentPercentages)
    .reduce((total, percentage) => total + percentage, 0);
  
  return supply.totalValue * (totalPercentage / 100);
};

export const calculateASCCredit = (
  currentYearQRE: number,
  previousYearsQRE: number[],
  use280C: boolean
): number => {
  const hasThreeYears = previousYearsQRE.length === 3;
  const average = hasThreeYears
    ? previousYearsQRE.reduce((a, b) => a + b, 0) / 3
    : previousYearsQRE.filter(qre => qre > 0).reduce((a, b) => a + b, 0) / 
      Math.max(1, previousYearsQRE.filter(qre => qre > 0).length);
  
  const baseCredit = hasThreeYears
    ? 0.14 * (currentYearQRE - 0.5 * average)
    : 0.06 * (currentYearQRE - 0.5 * average);
  
  return use280C ? baseCredit * 0.79 : baseCredit;
};

export const calculateStandardCredit = (
  currentYearQRE: number,
  grossReceipts: number[],
  use280C: boolean
): number => {
  const averageReceipts = grossReceipts.reduce((a, b) => a + b, 0) / grossReceipts.length;
  const baseAmount = Math.max(0.1 * averageReceipts, 0.5 * currentYearQRE);
  const baseCredit = 0.2 * (currentYearQRE - baseAmount);
  
  return use280C ? baseCredit * 0.79 : baseCredit;
}; 