import { TaxInfo, TaxRates, TaxStrategy } from '../types';
import { calculateTaxBreakdown } from './taxCalculations';

export function debugCalculations(
  taxInfo: TaxInfo,
  rates: TaxRates,
  strategies: TaxStrategy[]
) {
  console.log('=== DEBUG CALCULATIONS ===');
  console.log('Tax Info:', taxInfo);
  const enabledStrategies = strategies.filter(s => s.enabled);
  console.log('Enabled Strategies:', enabledStrategies);
  
  // Debug strategy deductions calculation
  enabledStrategies.forEach(strategy => {
    console.log(`Strategy ${strategy.id}:`, strategy.details);
    if (strategy.id === 'charitable_donation' && strategy.details?.charitableDonation) {
      console.log(`  Charitable donation amount: ${strategy.details.charitableDonation.donationAmount}`);
      console.log(`  Charitable deduction value: ${strategy.details.charitableDonation.deductionValue}`);
      console.log(`  Federal savings: ${strategy.details.charitableDonation.federalSavings}`);
      console.log(`  State savings: ${strategy.details.charitableDonation.stateSavings}`);
    }
  });
  
  // Calculate baseline (no strategies)
  const baseline = calculateTaxBreakdown(taxInfo, rates, []);
  console.log('Baseline Tax Breakdown:', baseline);
  
  // Calculate with strategies
  const withStrategies = calculateTaxBreakdown(taxInfo, rates, strategies.filter(s => s.enabled));
  console.log('With Strategies Tax Breakdown:', withStrategies);
  
  // Calculate raw savings
  const rawSavings = baseline.total - withStrategies.total;
  console.log('Raw Tax Savings:', rawSavings);
  
  // Debug deductions
  console.log('Baseline Total Deductions:', baseline.totalDeductions);
  console.log('With Strategies Total Deductions:', withStrategies.totalDeductions);
  console.log('Strategy Deductions:', withStrategies.strategyDeductions);
  
  // Calculate charitable donation cost
  const charitableStrategy = strategies.find(s => s.enabled && s.id === 'charitable_donation');
  const charitableCost = charitableStrategy?.details?.charitableDonation?.donationAmount || 0;
  console.log('Charitable Donation Cost:', charitableCost);
  
  // Calculate net savings
  const netSavings = rawSavings - charitableCost;
  console.log('Net Savings (after charitable cost):', netSavings);
  
  console.log('=== END DEBUG ===');
  
  return {
    baseline,
    withStrategies,
    rawSavings,
    charitableCost,
    netSavings
  };
} 