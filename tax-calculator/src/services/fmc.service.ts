import { BaseStrategyService } from './strategy.service';
import { TaxStrategy, TaxInfo, TaxBreakdown, TaxRates } from '../types/strategy';
import { v4 as uuidv4 } from 'uuid';

export class FmcStrategyService extends BaseStrategyService {
  constructor() {
    super();
    this.strategies = [{
      id: uuidv4(),
      name: 'Family Management Company',
      description: 'Shift business income to family members through a management company',
      category: 'income_shifted',
      details: {
        shiftedAmount: 0,
        federalBenefit: 0,
        stateBenefit: 0,
        ficaBenefit: 0,
        familyMembers: []
      },
      enabled: false,
      estimatedSavings: 0
    }];
  }

  protected validateIncomeShiftStrategy(strategy: TaxStrategy): boolean {
    const details = strategy.details as any;
    return super.validateIncomeShiftStrategy(strategy) &&
           Array.isArray(details.familyMembers) &&
           details.familyMembers.length > 0 &&
           details.familyMembers.every((member: any) => 
             member.name && member.salary && member.salary > 0
           );
  }

  protected calculateIncomeShiftSavings(strategy: TaxStrategy, taxInfo: TaxInfo, rates: TaxRates): number {
    const details = strategy.details as any;
    const totalSalary = details.familyMembers.reduce((sum: number, member: any) => sum + member.salary, 0);
    
    // Calculate federal tax savings
    const federalRate = this.calculateMarginalRate(taxInfo.federalIncome, rates.federalBrackets);
    const federalSavings = totalSalary * federalRate;

    // Calculate state tax savings
    const stateRate = this.calculateMarginalRate(taxInfo.stateIncome, rates.stateBrackets);
    const stateSavings = totalSalary * stateRate;

    // Calculate FICA savings
    const ficaSavings = totalSalary * (rates.fica.employee + rates.fica.employer);

    return federalSavings + stateSavings + ficaSavings;
  }

  private calculateMarginalRate(income: number, brackets: Array<{rate: number, max: number}>): number {
    for (const bracket of brackets) {
      if (income <= bracket.max) {
        return bracket.rate;
      }
    }
    return brackets[brackets.length - 1].rate;
  }
} 