import { QRA, Employee, Contractor, Supply } from '../types/rdCredit';

export const calculateQRAPercentage = (qra: QRA): number => {
  return qra.subcomponents.reduce((total, subcomponent) => {
    return total + (
      (subcomponent.utilizationPercentage / 100) *
      (subcomponent.timePercentage / 100) *
      (subcomponent.yearPercentage / 100)
    );
  }, 0) * (qra.practicePercentage / 100);
};

export const calculateEmployeeQRE = (employee: Employee, qras: QRA[]): number => {
  const includedModifiers = employee.qraModifiers.filter(m => m.included);
  const totalPercentage = includedModifiers.reduce((sum, m) => {
    const qra = qras.find(q => q.id === m.id);
    if (!qra) return sum;
    return sum + (m.modificationPercentage / 100) * calculateQRAPercentage(qra);
  }, 0);

  return employee.w2Wage * totalPercentage;
};

export const calculateContractorQRE = (contractor: Contractor, qras: QRA[]): number => {
  const includedModifiers = contractor.qraModifiers.filter(m => m.included);
  const totalPercentage = includedModifiers.reduce((sum, m) => {
    const qra = qras.find(q => q.id === m.id);
    if (!qra) return sum;
    return sum + (m.modificationPercentage / 100) * calculateQRAPercentage(qra);
  }, 0);

  return contractor.payment * 0.65 * totalPercentage;
};

export const calculateSupplyQRE = (supply: Supply, qras: QRA[]): number => {
  const includedModifiers = supply.qraModifiers.filter(m => m.included);
  const totalPercentage = includedModifiers.reduce((sum, m) => {
    const qra = qras.find(q => q.id === m.id);
    if (!qra) return sum;
    return sum + (m.modificationPercentage / 100) * calculateQRAPercentage(qra);
  }, 0);

  return supply.cost * totalPercentage;
};

export const calculateTotalQRE = (
  employees: Employee[],
  contractors: Contractor[],
  supplies: Supply[],
  qras: QRA[]
): number => {
  const employeeQRE = employees.reduce((total, employee) => {
    return total + calculateEmployeeQRE(employee, qras);
  }, 0);

  const contractorQRE = contractors.reduce((total, contractor) => {
    return total + calculateContractorQRE(contractor, qras);
  }, 0);

  const supplyQRE = supplies.reduce((total, supply) => {
    return total + calculateSupplyQRE(supply, qras);
  }, 0);

  return employeeQRE + contractorQRE + supplyQRE;
};

export const calculateASCCredit = (
  currentYearQRE: number,
  previousYearsQRE: number[],
  use280C: boolean = true
): number => {
  // Calculate the base amount (average of previous 3 years' QRE)
  const baseAmount = previousYearsQRE.length > 0
    ? previousYearsQRE.reduce((sum, qre) => sum + qre, 0) / previousYearsQRE.length
    : 0;

  // Calculate the fixed-base percentage
  const fixedBasePercentage = baseAmount > 0
    ? Math.min(0.16, currentYearQRE / baseAmount)
    : 0;

  // Calculate the incremental QRE
  const incrementalQRE = Math.max(0, currentYearQRE - (baseAmount * fixedBasePercentage));

  // Calculate the credit (20% of incremental QRE)
  const credit = incrementalQRE * 0.20;

  // Apply 280C reduction if specified
  return use280C ? credit * 0.65 : credit;
};

export const calculateStandardCredit = (
  currentYearQRE: number,
  previousYearsGrossReceipts: number[],
  use280C: boolean = true
): number => {
  // Calculate the base amount (average of previous 3 years' gross receipts)
  const baseAmount = previousYearsGrossReceipts.length > 0
    ? previousYearsGrossReceipts.reduce((sum, receipts) => sum + receipts, 0) / previousYearsGrossReceipts.length
    : 0;

  // Calculate the fixed-base percentage
  const fixedBasePercentage = baseAmount > 0
    ? Math.min(0.16, currentYearQRE / baseAmount)
    : 0;

  // Calculate the incremental QRE
  const incrementalQRE = Math.max(0, currentYearQRE - (baseAmount * fixedBasePercentage));

  // Calculate the credit (20% of incremental QRE)
  const credit = incrementalQRE * 0.20;

  // Apply 280C reduction if specified
  return use280C ? credit * 0.65 : credit;
}; 