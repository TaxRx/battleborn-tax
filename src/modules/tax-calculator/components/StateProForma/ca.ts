import { StateCreditBaseData } from '../../services/stateCreditDataService';

// Helper function to get 280C percentage based on business entity type
const get280CPercentage = (entityType?: string): number => {
  switch (entityType) {
    case 'C-Corp':
    case 'CCORP':
      return 91.16; // 91.16% for corporations
    case 'S-Corp':
    case 'SCORP':
      return 98.5; // 98.5% for S corporations
    case 'LLC':
    case 'Partnership':
    case 'Sole-Proprietor':
    case 'SOLEPROP':
    default:
      return 87.7; // 87.7% for individuals, estates, and trusts
  }
};

export const CA_PROFORMA_LINES = [
  // --- Alternative Calculation ---
  { line: '18', label: 'Basic research payments paid or incurred during the taxable year.', field: 'basicResearchPayments', editable: true, method: 'alternative' },
  { line: '19', label: 'Base period amount.', field: 'basePeriodAmount', editable: true, method: 'alternative' },
  { line: '20', label: 'Subtract line 19 from line 18. If less than zero, enter -0-.', field: 'line20', editable: false, method: 'alternative', calc: (data: StateCreditBaseData) => Math.max((data.basicResearchPayments || 0) - (data.basePeriodAmount || 0), 0) },
  { line: '21', label: 'Multiply line 20 by 24% (.24)', field: 'line21', editable: false, method: 'alternative', calc: (data: any) => (data.line20 || 0) * 0.24 },
  { line: '22', label: 'Wages for qualified services (do not include wages used in figuring the work opportunity credit)', field: 'wages', editable: true, method: 'alternative' },
  { line: '23', label: 'Cost of supplies', field: 'supplies', editable: true, method: 'alternative' },
  { line: '24', label: 'Rental or lease costs of computers', field: 'computerLeases', editable: true, method: 'alternative' },
  { line: '25', label: 'Contract research expenses', field: 'contractResearch', editable: true, method: 'alternative' },
  { line: '26', label: 'Total qualified research expenses', field: 'totalQRE', editable: false, method: 'alternative', calc: (data: any) => (data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) },
  { line: '27', label: 'Enter average annual gross receipts', field: 'avgGrossReceipts', editable: true, method: 'alternative' },
  { line: '28', label: 'Multiply line 27 by 1% (.01)', field: 'line28', editable: false, method: 'alternative', calc: (data: any) => (data.avgGrossReceipts || 0) * 0.01 },
  { line: '29', label: 'Subtract line 28 from line 26. If zero or less, enter -0-', field: 'line29', editable: false, method: 'alternative', calc: (data: any) => Math.max((data.totalQRE || 0) - (data.line28 || 0), 0) },
  { line: '30', label: 'Multiply line 27 by 1.5% (.015)', field: 'line30', editable: false, method: 'alternative', calc: (data: any) => (data.avgGrossReceipts || 0) * 0.015 },
  { line: '31', label: 'Subtract line 30 from line 26. If zero or less, enter -0-', field: 'line31', editable: false, method: 'alternative', calc: (data: any) => Math.max((data.totalQRE || 0) - (data.line30 || 0), 0) },
  { line: '32', label: 'Subtract line 31 from line 29. If zero or less, enter -0-', field: 'line32', editable: false, method: 'alternative', calc: (data: any) => Math.max((data.line29 || 0) - (data.line31 || 0), 0) },
  { line: '33', label: 'Multiply line 27 by 2% (.02)', field: 'line33', editable: false, method: 'alternative', calc: (data: any) => (data.avgGrossReceipts || 0) * 0.02 },
  { line: '34', label: 'Subtract line 33 from line 26. If zero or less, enter -0-', field: 'line34', editable: false, method: 'alternative', calc: (data: any) => Math.max((data.totalQRE || 0) - (data.line33 || 0), 0) },
  { line: '35', label: 'Subtract line 34 from line 31. If zero or less, enter -0-', field: 'line35', editable: false, method: 'alternative', calc: (data: any) => Math.max((data.line31 || 0) - (data.line34 || 0), 0) },
  { line: '36', label: 'Multiply line 32 by 1.49% (.0149)', field: 'line36', editable: false, method: 'alternative', calc: (data: any) => (data.line32 || 0) * 0.0149 },
  { line: '37', label: 'Multiply line 35 by 1.98% (.0198)', field: 'line37', editable: false, method: 'alternative', calc: (data: any) => (data.line35 || 0) * 0.0198 },
  { line: '38', label: 'Multiply line 34 by 2.48% (.0248)', field: 'line38', editable: false, method: 'alternative', calc: (data: any) => (data.line34 || 0) * 0.0248 },
  { line: '39a', label: 'Alternative incremental credit. Add line 21, line 36, line 37, and line 38. If you do not elect the reduced credit under IRC Section 280C(c), enter the result here, and see instructions for the schedule that must be attached', field: 'line39a', editable: false, method: 'alternative', calc: (data: any) => (data.line21 || 0) + (data.line36 || 0) + (data.line37 || 0) + (data.line38 || 0) },
  { line: '39b', label: 'Reduced alternative incremental credit under IRC Section 280C(c). Multiply line 39a by the applicable percentage below: • 87.7% (.877) for individuals, estates, and trusts • 91.16% (.9116) for corporations • 98.5% (.985) for S corporations', field: 'line39b', editable: false, method: 'alternative', calc: (data: StateCreditBaseData) => {
    const percentage = get280CPercentage(data.businessEntityType);
    return (data.line39a || 0) * (percentage / 100);
  }},

  // --- Standard Calculation ---
  { line: '1', label: 'Basic research payments paid or incurred during the taxable year.', field: 'basicResearchPayments', editable: true, method: 'standard' },
  { line: '2', label: 'Base period amount.', field: 'basePeriodAmount', editable: true, method: 'standard' },
  { line: '3', label: 'Subtract line 2 from line 1. If less than zero, enter -0-.', field: 'line3', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => Math.max((data.basicResearchPayments || 0) - (data.basePeriodAmount || 0), 0) },
  { line: '4', label: 'Multiply line 3 by 24% (.24)', field: 'line4', editable: false, method: 'standard', calc: (data: any) => (data.line3 || 0) * 0.24 },
  { line: '5', label: 'Wages for qualified services (do not include wages used in figuring the work opportunity credit)', field: 'wages', editable: true, method: 'standard' },
  { line: '6', label: 'Cost of supplies', field: 'supplies', editable: true, method: 'standard' },
  { line: '7', label: 'Rental or lease costs of computers', field: 'computerLeases', editable: true, method: 'standard' },
  { line: '8', label: 'Contract research expenses', field: 'contractResearch', editable: true, method: 'standard' },
  { line: '9', label: 'Total qualified research expenses', field: 'totalQRE', editable: false, method: 'standard', calc: (data: any) => (data.wages || 0) + (data.supplies || 0) + (data.computerLeases || 0) + (data.contractResearch || 0) },
  { line: '10', label: 'Enter fixed-base percentage, but not more than 16% (.16).', field: 'fixedBasePercent', editable: true, method: 'standard', defaultValue: 3 },
  { line: '11', label: 'Enter average annual gross receipts', field: 'avgGrossReceipts', editable: true, method: 'standard' },
  { line: '12', label: 'Multiply line 11 by the percentage on line 10', field: 'line12', editable: false, method: 'standard', calc: (data: any) => (data.avgGrossReceipts || 0) * ((data.fixedBasePercent || 3) / 100) },
  { line: '13', label: 'Subtract line 12 from line 9. If zero or less, enter -0-', field: 'line13', editable: false, method: 'standard', calc: (data: any) => Math.max((data.totalQRE || 0) - (data.line12 || 0), 0) },
  { line: '14', label: 'Multiply line 9 by 50%', field: 'line14', editable: false, method: 'standard', calc: (data: any) => (data.totalQRE || 0) * 0.5 },
  { line: '15', label: 'Enter the smaller of line 13 or line 14', field: 'line15', editable: false, method: 'standard', calc: (data: any) => Math.min(data.line13 || 0, data.line14 || 0) },
  { line: '16', label: 'Multiply line 15 by 15% (.15)', field: 'line16', editable: false, method: 'standard', calc: (data: any) => (data.line15 || 0) * 0.15 },
  { line: '17a', label: 'Regular credit. Add line 4 and line 16. If you do not elect the reduced credit under IRC Section 280C(c), enter the result here, and see instructions for the schedule to attach.', field: 'line17a', editable: false, method: 'standard', calc: (data: any) => (data.line4 || 0) + (data.line16 || 0) },
  { line: '17b', label: 'Reduced regular credit under IRC Section 280C(c). Multiply line 17a by the applicable percentage below: • 87.7% (.877) for individuals, estates, and trusts • 91.16% (.9116) for corporations • 98.5% (.985) for S corporations', field: 'line17b', editable: false, method: 'standard', calc: (data: StateCreditBaseData) => {
    const percentage = get280CPercentage(data.businessEntityType);
    return (data.line17a || 0) * (percentage / 100);
  }},
];

export const caConfig = {
  state: 'CA',
  name: 'California',
  forms: {
    standard: {
      name: 'California Form 3523 - Research Credit',
      method: 'standard',
      lines: CA_PROFORMA_LINES.filter(line => line.method === 'standard'),
    },
    alternative: {
      name: 'California Form 3523 - Alternative Research Credit',
      method: 'alternative',
      lines: CA_PROFORMA_LINES.filter(line => line.method === 'alternative'),
    },
  },
}; 