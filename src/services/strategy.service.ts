import { StrategyFactory, TaxStrategy, TaxInfo, TaxBreakdown, TaxRates } from '../types/strategy';
import { v4 as uuidv4 } from 'uuid';

export class BaseStrategyService implements StrategyFactory {
  protected strategies: TaxStrategy[] = [];

  createStrategy(taxInfo: TaxInfo, breakdown: TaxBreakdown): TaxStrategy[] {
    return this.strategies.map(strategy => ({
      ...strategy,
      id: uuidv4(),
      enabled: false,
      estimatedSavings: this.calculateSavings(strategy, taxInfo, breakdown.rates)
    }));
  }

  validateStrategy(strategy: TaxStrategy): boolean {
    // Base validation that all strategies must pass
    if (!strategy.id || !strategy.name || !strategy.description) {
      return false;
    }

    // Validate category-specific requirements
    switch (strategy.category) {
      case 'income_shifted':
        return this.validateIncomeShiftStrategy(strategy);
      case 'income_deferred':
        return this.validateDeferralStrategy(strategy);
      case 'new_deductions':
        return this.validateDeductionStrategy(strategy);
      case 'new_credits':
        return this.validateCreditStrategy(strategy);
      default:
        return false;
    }
  }

  calculateSavings(strategy: TaxStrategy, taxInfo: TaxInfo, rates: TaxRates): number {
    switch (strategy.category) {
      case 'income_shifted':
        return this.calculateIncomeShiftSavings(strategy, taxInfo, rates);
      case 'income_deferred':
        return this.calculateDeferralSavings(strategy, taxInfo, rates);
      case 'new_deductions':
        return this.calculateDeductionSavings(strategy, taxInfo, rates);
      case 'new_credits':
        return this.calculateCreditSavings(strategy, taxInfo, rates);
      default:
        return 0;
    }
  }

  // Protected methods for category-specific validation and calculations
  protected validateIncomeShiftStrategy(strategy: TaxStrategy): boolean {
    return 'shiftedAmount' in strategy.details && strategy.details.shiftedAmount > 0;
  }

  protected validateDeferralStrategy(strategy: TaxStrategy): boolean {
    return 'deferredAmount' in strategy.details && strategy.details.deferredAmount > 0;
  }

  protected validateDeductionStrategy(strategy: TaxStrategy): boolean {
    return 'deductionValue' in strategy.details && strategy.details.deductionValue > 0;
  }

  protected validateCreditStrategy(strategy: TaxStrategy): boolean {
    return 'creditValue' in strategy.details && strategy.details.creditValue > 0;
  }

  protected calculateIncomeShiftSavings(strategy: TaxStrategy, taxInfo: TaxInfo, rates: TaxRates): number {
    const details = strategy.details as any;
    return details.federalBenefit + details.stateBenefit + details.ficaBenefit;
  }

  protected calculateDeferralSavings(strategy: TaxStrategy, taxInfo: TaxInfo, rates: TaxRates): number {
    const details = strategy.details as any;
    return details.federalSavings + details.stateSavings;
  }

  protected calculateDeductionSavings(strategy: TaxStrategy, taxInfo: TaxInfo, rates: TaxRates): number {
    const details = strategy.details as any;
    return details.federalSavings + details.stateSavings;
  }

  protected calculateCreditSavings(strategy: TaxStrategy, taxInfo: TaxInfo, rates: TaxRates): number {
    const details = strategy.details as any;
    return details.federalSavings + details.stateSavings;
  }
} 