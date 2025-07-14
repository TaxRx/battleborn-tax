import { StateCreditBaseData } from '../../services/stateCreditDataService';

export const AZ_PROFORMA_LINES = [
  // --- Arizona Form 308 - Credit For Increased Research Activities ---
  { line: '1', label: 'Did you have qualified research expenses for the tax year indicated above?', field: 'hasQualifiedResearchExpenses', editable: true, defaultValue: 1, type: 'yesno' },
  { line: '2', label: 'Is this credit refundable?', field: 'isRefundable', editable: true, defaultValue: 0, type: 'yesno' },
  { line: '3', label: 'Are you claiming a pass through of this credit from a partnership?', field: 'isPartnershipPassThrough', editable: true, defaultValue: 0, type: 'yesno' },
  
  // Skip lines 4-7 as they're not in the provided spec
  
  { line: '8', label: 'Basic research payments paid or incurred to qualified organizations:', field: 'basicResearchPayments', editable: true },
  { line: '9', label: 'Qualified organization base period amount', field: 'qualifiedOrgBasePeriod', editable: true },
  { line: '10', label: 'Subtract line 10 from line 9. If less than zero, enter "0"', field: 'line10', editable: false, calc: (data: StateCreditBaseData) => Math.max((data.basicResearchPayments || 0) - (data.qualifiedOrgBasePeriod || 0), 0) },
  { line: '11', label: 'Wages for qualified services (do not include wages used in figuring the work opportunity credit)', field: 'wages', editable: true },
  { line: '12', label: 'Cost of supplies', field: 'supplies', editable: true },
  { line: '13', label: 'Cost to rent or lease computers', field: 'computerLeases', editable: true },
  { line: '14', label: 'Contract research expenses:', field: 'contractResearch', editable: true },
  { line: '15', label: 'Total research expenses:', field: 'line15', editable: false, calc: (data: StateCreditBaseData) => (data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) },
  { line: '16', label: 'Average annual Arizona gross receipts:', field: 'avgGrossReceipts', editable: true },
  { line: '17', label: 'Fixed-base percentage, but not more than 16% (0.16)', field: 'fixedBasePercentage', editable: true, defaultValue: 3, type: 'percentage' },
  { line: '18', label: 'Base amount: Multiply line 16 by the percentage on line 17', field: 'line18', editable: false, calc: (data: StateCreditBaseData) => (data.avgGrossReceipts || 0) * ((data.fixedBasePercentage || 3) / 100) },
  { line: '19', label: 'Subtract line 18 from line 15. If less than zero, enter "0"', field: 'line19', editable: false, calc: (data: StateCreditBaseData) => Math.max((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) - ((data.avgGrossReceipts || 0) * ((data.fixedBasePercentage || 3) / 100)), 0) },
  { line: '20', label: 'Multiply line 15 by 50% (.50).', field: 'line20', editable: false, calc: (data: StateCreditBaseData) => ((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0)) * 0.5 },
  { line: '21', label: 'Enter the lesser of line 19 or line 20', field: 'line21', editable: false, calc: (data: StateCreditBaseData) => {
    const line19 = Math.max((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) - ((data.avgGrossReceipts || 0) * ((data.fixedBasePercentage || 3) / 100)), 0);
    const line20 = ((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0)) * 0.5;
    return Math.min(line19, line20);
  }},
  { line: '22', label: 'Add lines 10 and 21.', field: 'line22', editable: false, calc: (data: StateCreditBaseData) => {
    const line10 = Math.max((data.basicResearchPayments || 0) - (data.qualifiedOrgBasePeriod || 0), 0);
    const line19 = Math.max((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) - ((data.avgGrossReceipts || 0) * ((data.fixedBasePercentage || 3) / 100)), 0);
    const line20 = ((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0)) * 0.5;
    const line21 = Math.min(line19, line20);
    return line10 + line21;
  }},
  { line: '23', label: 'Multiply line 22 by 24% (.24)', field: 'line23', editable: false, calc: (data: StateCreditBaseData) => {
    const line10 = Math.max((data.basicResearchPayments || 0) - (data.qualifiedOrgBasePeriod || 0), 0);
    const line19 = Math.max((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) - ((data.avgGrossReceipts || 0) * ((data.fixedBasePercentage || 3) / 100)), 0);
    const line20 = ((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0)) * 0.5;
    const line21 = Math.min(line19, line20);
    const line22 = line10 + line21;
    return line22 * 0.24;
  }},
  { line: '24', label: 'Subtract $2,500,000 from line 22.', field: 'line24', editable: false, calc: (data: StateCreditBaseData) => {
    const line10 = Math.max((data.basicResearchPayments || 0) - (data.qualifiedOrgBasePeriod || 0), 0);
    const line19 = Math.max((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) - ((data.avgGrossReceipts || 0) * ((data.fixedBasePercentage || 3) / 100)), 0);
    const line20 = ((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0)) * 0.5;
    const line21 = Math.min(line19, line20);
    const line22 = line10 + line21;
    return Math.max(line22 - 2500000, 0);
  }},
  { line: '25', label: 'Multiply line 24 by 15% (.15)', field: 'line25', editable: false, calc: (data: StateCreditBaseData) => {
    const line10 = Math.max((data.basicResearchPayments || 0) - (data.qualifiedOrgBasePeriod || 0), 0);
    const line19 = Math.max((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) - ((data.avgGrossReceipts || 0) * ((data.fixedBasePercentage || 3) / 100)), 0);
    const line20 = ((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0)) * 0.5;
    const line21 = Math.min(line19, line20);
    const line22 = line10 + line21;
    const line24 = Math.max(line22 - 2500000, 0);
    return line24 * 0.15;
  }},
  { line: '26', label: 'Add $600,000 to line 25', field: 'line26', editable: false, calc: (data: StateCreditBaseData) => {
    const line10 = Math.max((data.basicResearchPayments || 0) - (data.qualifiedOrgBasePeriod || 0), 0);
    const line19 = Math.max((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) - ((data.avgGrossReceipts || 0) * ((data.fixedBasePercentage || 3) / 100)), 0);
    const line20 = ((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0)) * 0.5;
    const line21 = Math.min(line19, line20);
    const line22 = line10 + line21;
    const line24 = Math.max(line22 - 2500000, 0);
    const line25 = line24 * 0.15;
    return line25 + 600000;
  }},
  { line: '27', label: 'Enter the amount from line 23 or line 26', field: 'line27', editable: false, calc: (data: StateCreditBaseData) => {
    const line10 = Math.max((data.basicResearchPayments || 0) - (data.qualifiedOrgBasePeriod || 0), 0);
    const line19 = Math.max((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) - ((data.avgGrossReceipts || 0) * ((data.fixedBasePercentage || 3) / 100)), 0);
    const line20 = ((data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0)) * 0.5;
    const line21 = Math.min(line19, line20);
    const line22 = line10 + line21;
    
    if (line22 <= 2500000) {
      // Use line 23 calculation
      return line22 * 0.24;
    } else {
      // Use line 26 calculation
      const line24 = Math.max(line22 - 2500000, 0);
      const line25 = line24 * 0.15;
      return line25 + 600000;
    }
  }},
]; 

export const azConfig = {
  state: 'AZ',
  name: 'Arizona',
  forms: {
    standard: {
      name: 'Arizona Form 308 - Credit For Increased Research Activities',
      method: 'standard',
      lines: AZ_PROFORMA_LINES,
    },
  },
}; 