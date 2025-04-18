import { TaxInfo, TaxRates, TaxStrategy, TaxBreakdown } from '../types';
import { calculateTaxBreakdown } from '../utils/tax-calculations';

export enum StrategyType {
  INCOME_SHIFT = 'income_shifted',
  DEDUCTION = 'new_deductions',
  DEFERRAL = 'income_deferred',
  CREDIT = 'new_credits'
}

export interface StrategyCalculator {
  calculateImpact: (
    strategy: TaxStrategy,
    taxInfo: TaxInfo,
    rates: TaxRates
  ) => {
    modifiedTaxInfo: TaxInfo;
    savings: {
      federal: number;
      state: number;
      fica: number;
      total: number;
    };
  };
}

class IncomeShiftCalculator implements StrategyCalculator {
  calculateImpact(strategy: TaxStrategy, taxInfo: TaxInfo, rates: TaxRates) {
    const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);
    const modifiedTaxInfo = { ...taxInfo };
    let shiftedAmount = 0;

    // Calculate total shifted income based on strategy
    switch (strategy.id) {
      case 'augusta_rule':
        if (strategy.details?.augustaRule) {
          shiftedAmount = strategy.details.augustaRule.daysRented * strategy.details.augustaRule.dailyRate;
        }
        break;
      case 'hire_children':
        if (strategy.details?.hireChildren) {
          shiftedAmount = strategy.details.hireChildren.totalSalaries;
        }
        break;
      case 'family_management_company':
        if (strategy.details?.familyManagementCompany) {
          shiftedAmount = strategy.details.familyManagementCompany.totalSalaries;
        }
        break;
    }

    // Apply shifted income reduction
    if (modifiedTaxInfo.wagesIncome > 160000) {
      const w2Reduction = Math.min(
        modifiedTaxInfo.wagesIncome - 160000,
        shiftedAmount
      );
      modifiedTaxInfo.wagesIncome -= w2Reduction;

      const remainingReduction = shiftedAmount - w2Reduction;
      if (remainingReduction > 0 && modifiedTaxInfo.ordinaryK1Income) {
        modifiedTaxInfo.ordinaryK1Income = Math.max(
          0,
          modifiedTaxInfo.ordinaryK1Income - remainingReduction
        );
      }
    } else if (modifiedTaxInfo.ordinaryK1Income) {
      modifiedTaxInfo.ordinaryK1Income = Math.max(
        0,
        modifiedTaxInfo.ordinaryK1Income - shiftedAmount
      );
    }

    const modifiedBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates);

    return {
      modifiedTaxInfo,
      savings: {
        federal: Math.max(0, baseBreakdown.federal - modifiedBreakdown.federal),
        state: Math.max(0, baseBreakdown.state - modifiedBreakdown.state),
        fica: Math.max(0, baseBreakdown.fica - modifiedBreakdown.fica),
        total: Math.max(0, baseBreakdown.total - modifiedBreakdown.total)
      }
    };
  }
}

class DeductionCalculator implements StrategyCalculator {
  calculateImpact(strategy: TaxStrategy, taxInfo: TaxInfo, rates: TaxRates) {
    const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);
    const modifiedTaxInfo = { ...taxInfo };
    let deductionAmount = 0;

    // Calculate total deduction based on strategy
    switch (strategy.id) {
      case 'charitable_donation':
        if (strategy.details?.charitableDonation) {
          deductionAmount = strategy.details.charitableDonation.deductionValue;
        }
        break;
      case 'cost_segregation':
        if (strategy.details?.costSegregation) {
          deductionAmount = strategy.details.costSegregation.currentYearDeduction;
        }
        break;
    }

    // Calculate total income
    const totalIncome = modifiedTaxInfo.wagesIncome +
      modifiedTaxInfo.passiveIncome +
      modifiedTaxInfo.unearnedIncome +
      (modifiedTaxInfo.ordinaryK1Income || 0) +
      (modifiedTaxInfo.guaranteedK1Income || 0);

    // Calculate current total deductions
    const standardOrCustomDeduction = modifiedTaxInfo.standardDeduction ?
      (rates.federal.standardDeduction[modifiedTaxInfo.filingStatus] || 0) :
      (modifiedTaxInfo.customDeduction || 0);

    const currentDeductions = standardOrCustomDeduction;
    
    // Check if new deduction would exceed 80% limit
    const maxAllowedDeduction = totalIncome * 0.8;
    const totalProposedDeductions = currentDeductions + deductionAmount;

    if (totalProposedDeductions > maxAllowedDeduction) {
      // Adjust deduction to meet 80% limit
      deductionAmount = Math.max(0, maxAllowedDeduction - currentDeductions);
      
      // Set flag to show warning
      modifiedTaxInfo.deductionLimitReached = true;
    }

    // Apply deduction
    if (modifiedTaxInfo.ordinaryK1Income) {
      modifiedTaxInfo.ordinaryK1Income = Math.max(
        0,
        modifiedTaxInfo.ordinaryK1Income - deductionAmount
      );
    } else {
      modifiedTaxInfo.wagesIncome = Math.max(
        0,
        modifiedTaxInfo.wagesIncome - deductionAmount
      );
    }

    const modifiedBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates);

    return {
      modifiedTaxInfo,
      savings: {
        federal: Math.max(0, baseBreakdown.federal - modifiedBreakdown.federal),
        state: Math.max(0, baseBreakdown.state - modifiedBreakdown.state),
        fica: Math.max(0, baseBreakdown.fica - modifiedBreakdown.fica),
        total: Math.max(0, baseBreakdown.total - modifiedBreakdown.total)
      }
    };
  }
}

class DeferralCalculator implements StrategyCalculator {
  calculateImpact(strategy: TaxStrategy, taxInfo: TaxInfo, rates: TaxRates) {
    const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);
    const modifiedTaxInfo = { ...taxInfo };
    let deferredAmount = 0;

    // Calculate deferred amount based on strategy
    switch (strategy.id) {
      case 'reinsurance':
        // Add reinsurance-specific calculation logic
        break;
    }

    // Apply deferral
    if (modifiedTaxInfo.ordinaryK1Income) {
      modifiedTaxInfo.ordinaryK1Income = Math.max(
        0,
        modifiedTaxInfo.ordinaryK1Income - deferredAmount
      );
    }

    const modifiedBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates);

    return {
      modifiedTaxInfo,
      savings: {
        federal: Math.max(0, baseBreakdown.federal - modifiedBreakdown.federal),
        state: Math.max(0, baseBreakdown.state - modifiedBreakdown.state),
        fica: Math.max(0, baseBreakdown.fica - modifiedBreakdown.fica),
        total: Math.max(0, baseBreakdown.total - modifiedBreakdown.total)
      }
    };
  }
}

export class StrategyService {
  private static instance: StrategyService;
  private calculators: Map<StrategyType, StrategyCalculator>;

  private constructor() {
    this.calculators = new Map([
      [StrategyType.INCOME_SHIFT, new IncomeShiftCalculator()],
      [StrategyType.DEDUCTION, new DeductionCalculator()],
      [StrategyType.DEFERRAL, new DeferralCalculator()]
    ]);
  }

  public static getInstance(): StrategyService {
    if (!StrategyService.instance) {
      StrategyService.instance = new StrategyService();
    }
    return StrategyService.instance;
  }

  public calculateStrategyImpact(
    strategy: TaxStrategy,
    taxInfo: TaxInfo,
    rates: TaxRates
  ) {
    const calculator = this.calculators.get(strategy.category as StrategyType);
    if (!calculator) {
      throw new Error(`No calculator found for strategy type: ${strategy.category}`);
    }

    return calculator.calculateImpact(strategy, taxInfo, rates);
  }

  public calculateCombinedImpact(
    strategies: TaxStrategy[],
    taxInfo: TaxInfo,
    rates: TaxRates
  ): TaxBreakdown {
    let currentTaxInfo = { ...taxInfo };
    let totalSavings = {
      federal: 0,
      state: 0,
      fica: 0,
      total: 0
    };

    // Process strategies in order: Income Shift -> Deductions -> Deferrals
    const orderedStrategies = this.orderStrategiesByType(strategies);

    for (const strategy of orderedStrategies) {
      const { modifiedTaxInfo, savings } = this.calculateStrategyImpact(
        strategy,
        currentTaxInfo,
        rates
      );

      currentTaxInfo = modifiedTaxInfo;
      totalSavings.federal += savings.federal;
      totalSavings.state += savings.state;
      totalSavings.fica += savings.fica;
      totalSavings.total += savings.total;
    }

    return calculateTaxBreakdown(currentTaxInfo, rates);
  }

  private orderStrategiesByType(strategies: TaxStrategy[]): TaxStrategy[] {
    const typeOrder = [
      StrategyType.INCOME_SHIFT,
      StrategyType.DEDUCTION,
      StrategyType.DEFERRAL,
      StrategyType.CREDIT
    ];

    return strategies.sort((a, b) => {
      const aIndex = typeOrder.indexOf(a.category as StrategyType);
      const bIndex = typeOrder.indexOf(b.category as StrategyType);
      return aIndex - bIndex;
    });
  }
}

export const strategyService = StrategyService.getInstance();