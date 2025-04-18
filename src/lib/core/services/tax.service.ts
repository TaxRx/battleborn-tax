import { TaxInfo, TaxRates, TaxBreakdown, TaxStrategy } from '../types';
import { calculateTaxBreakdown } from '../utils/tax-calculations';
import { taxRates } from '../../../data/taxRates';

export class TaxService {
  private static instance: TaxService;

  private constructor() {}

  public static getInstance(): TaxService {
    if (!TaxService.instance) {
      TaxService.instance = new TaxService();
    }
    return TaxService.instance;
  }

  public getRatesForYear(year: number): TaxRates {
    return taxRates[year];
  }

  public calculateBreakdown(
    taxInfo: TaxInfo,
    rates: TaxRates,
    strategies: TaxStrategy[] = []
  ): TaxBreakdown {
    return calculateTaxBreakdown(taxInfo, rates, strategies);
  }

  public calculateStrategyImpact(
    taxInfo: TaxInfo,
    rates: TaxRates,
    strategy: TaxStrategy
  ) {
    const baseBreakdown = this.calculateBreakdown(taxInfo, rates);
    const withStrategyBreakdown = this.calculateBreakdown(taxInfo, rates, [{ ...strategy, enabled: true }]);

    return {
      federal: Math.max(0, baseBreakdown.federal - withStrategyBreakdown.federal),
      state: Math.max(0, baseBreakdown.state - withStrategyBreakdown.state),
      fica: Math.max(0, baseBreakdown.fica - withStrategyBreakdown.fica)
    };
  }
}

export const taxService = TaxService.getInstance();