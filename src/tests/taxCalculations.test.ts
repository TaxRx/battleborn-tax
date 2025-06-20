import { jest, describe, test, expect } from '@jest/globals';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { taxRates } from '../data/taxRates';

describe('Tax Calculations', () => {
  const mockTaxInfo = {
    wagesIncome: 100000,
    passiveIncome: 0,
    unearnedIncome: 0,
    businessOwner: false,
    ordinaryK1Income: 0,
    guaranteedK1Income: 0,
    filingStatus: 'single' as const,
    standardDeduction: true,
    customDeduction: 0,
    state: 'CA',
    dependents: 0,
    fullName: 'Test User',
    email: 'test@example.com',
    homeAddress: '123 Test St',
    capitalGains: 0
  };

  test('should calculate federal tax correctly for single filer', () => {
    const result = calculateTaxBreakdown(mockTaxInfo, taxRates[2024]);
    
    // Verify federal tax calculation
    expect(result.federal).toBeGreaterThan(0);
    expect(result.federalBrackets).toHaveLength(4); // Should hit 4 brackets
    expect(result.federalBrackets[0].rate).toBe(0.10);
    expect(result.federalBrackets[1].rate).toBe(0.12);
    expect(result.federalBrackets[2].rate).toBe(0.22);
    expect(result.federalBrackets[3].rate).toBe(0.24);
  });

  test('should calculate state tax correctly for California', () => {
    const result = calculateTaxBreakdown(mockTaxInfo, taxRates[2024]);
    
    // Verify state tax calculation
    expect(result.state).toBeGreaterThan(0);
    expect(result.stateBrackets).toHaveLength(9); // CA has 9 brackets
    expect(result.stateBrackets[0].rate).toBe(0.01);
    expect(result.stateBrackets[8].rate).toBe(0.123);
  });

  test('should handle standard deduction correctly', () => {
    const result = calculateTaxBreakdown(mockTaxInfo, taxRates[2024]);
    
    // Verify standard deduction is applied
    const expectedDeduction = taxRates[2024].federal.standardDeduction.single;
    expect(result.totalDeductions).toBe(expectedDeduction);
    expect(result.taxableIncome).toBe(mockTaxInfo.wagesIncome - expectedDeduction);
  });

  test('should handle custom deduction correctly', () => {
    const customDeductionInfo = {
      ...mockTaxInfo,
      standardDeduction: false,
      customDeduction: 20000
    };
    
    const result = calculateTaxBreakdown(customDeductionInfo, taxRates[2024]);
    
    // Verify custom deduction is applied
    expect(result.totalDeductions).toBe(20000);
    expect(result.taxableIncome).toBe(mockTaxInfo.wagesIncome - 20000);
  });

  test('should calculate FICA taxes correctly', () => {
    const result = calculateTaxBreakdown(mockTaxInfo, taxRates[2024]);
    
    // Verify FICA calculations
    const expectedSocialSecurity = Math.min(mockTaxInfo.wagesIncome * 0.062, taxRates[2024].fica.socialSecurity.wageBase * 0.062);
    const expectedMedicare = mockTaxInfo.wagesIncome * 0.0145;
    
    expect(result.socialSecurity).toBe(expectedSocialSecurity);
    expect(result.medicare).toBe(expectedMedicare);
    expect(result.fica).toBe(expectedSocialSecurity + expectedMedicare);
  });

  test('should handle self-employment tax correctly', () => {
    const selfEmployedInfo = {
      ...mockTaxInfo,
      businessOwner: true,
      ordinaryK1Income: 50000
    };
    
    const result = calculateTaxBreakdown(selfEmployedInfo, taxRates[2024]);
    
    // Verify self-employment tax
    const expectedSelfEmploymentTax = 50000 * taxRates[2024].selfEmployment.rate;
    expect(result.selfEmployment).toBe(expectedSelfEmploymentTax);
  });

  test('should calculate effective tax rate correctly', () => {
    const result = calculateTaxBreakdown(mockTaxInfo, taxRates[2024]);
    
    // Verify effective tax rate calculation
    const expectedEffectiveRate = ((result.federal + result.state + result.fica) / mockTaxInfo.wagesIncome) * 100;
    expect(result.effectiveRate).toBe(Math.round(expectedEffectiveRate * 100) / 100);
  });

  test('should handle different filing statuses', () => {
    const marriedJointInfo = {
      ...mockTaxInfo,
      filingStatus: 'married_joint' as const
    };
    
    const result = calculateTaxBreakdown(marriedJointInfo, taxRates[2024]);
    
    // Verify married filing jointly calculations
    expect(result.federalBrackets[0].min).toBe(0);
    expect(result.federalBrackets[0].max).toBe(taxRates[2024].federal.brackets[0].married_joint);
    expect(result.totalDeductions).toBe(taxRates[2024].federal.standardDeduction.married_joint);
  });

  test('should handle state with no income tax', () => {
    const noTaxStateInfo = {
      ...mockTaxInfo,
      state: 'TX'
    };
    
    const result = calculateTaxBreakdown(noTaxStateInfo, taxRates[2024]);
    
    // Verify no state tax is calculated
    expect(result.state).toBe(0);
    expect(result.stateBrackets).toHaveLength(0);
  });
}); 