import { StateCreditDataService, StateCreditBaseData } from './stateCreditDataService';
import { getStateConfig, StateConfig } from '../components/StateProForma';
import { supabase } from '../lib/supabase';

interface StateCalculationInput {
  wages: number;
  contractor_costs: number;
  supply_costs: number;
  contract_research: number;
  total_qre: number;
  gross_receipts?: number;
  avg_gross_receipts?: number;
  business_entity_type?: string;
}

interface StateCalculationResult {
  state: string;
  method: 'standard' | 'alternative';
  credit_amount: number;
  formula: string;
  info: string;
  refundable: string;
  carryforward: string;
  eligible_entities: string | null;
  special_notes: string;
  formula_correct: string;
  calculation_details: any;
}

export class EnhancedStateCalculationService {
  
  /**
   * Calculate state credits using the accurate StateCreditProForma logic
   * instead of simple fallback rates
   */
  static async calculateStateCreditsAccurate(
    businessYearId: string,
    state: string,
    method: 'standard' | 'alternative' = 'standard'
  ): Promise<StateCalculationResult[]> {
    try {
      console.log('🎯 [Enhanced State Calc] Starting accurate calculation for:', { businessYearId, state, method });

      // Get state configuration
      const stateConfig = getStateConfig(state);
      if (!stateConfig) {
        console.log('🎯 [Enhanced State Calc] No state config found for:', state);
        return [];
      }

      // Load base QRE data using the same service as Filing Guide
      const baseData = await StateCreditDataService.getAggregatedQREData(businessYearId);
      console.log('🎯 [Enhanced State Calc] Base QRE data:', baseData);

      // Get the appropriate lines for this state and method
      const formConfig = stateConfig.forms[method];
      if (!formConfig) {
        console.log('🎯 [Enhanced State Calc] No form config found for method:', method);
        return [];
      }

      const lines = formConfig.lines;
      const results: StateCalculationResult[] = [];

      // Execute the state-specific calculation using the pro forma logic
      const calculationData = await this.executeStateProFormaCalculation(
        state,
        method,
        lines,
        baseData
      );

      // Find the final credit line(s)
      const finalCreditLines = lines.filter(line => 
        line.field?.includes('FinalCredit') || 
        line.field?.includes('line17b') ||
        line.label?.toLowerCase().includes('credit')
      );

      for (const creditLine of finalCreditLines) {
        const creditAmount = calculationData[creditLine.field] || 0;
        
        results.push({
          state,
          method,
          credit_amount: creditAmount,
          formula: this.generateFormulaDescription(lines, creditLine.field),
          info: stateConfig.notes?.join('; ') || `${state} R&D credit calculation using ${method} method`,
          refundable: this.getStateProperty(state, 'refundable') || 'No',
          carryforward: this.getStateProperty(state, 'carryforward') || '10 years',
          eligible_entities: this.getStateProperty(state, 'eligible_entities'),
          special_notes: stateConfig.validationRules?.map(rule => rule.message).join('; ') || '',
          formula_correct: 'Accurate',
          calculation_details: calculationData
        });
      }

      console.log('🎯 [Enhanced State Calc] Results:', results);
      return results;

    } catch (error) {
      console.error('🎯 [Enhanced State Calc] Error:', error);
      
      // Fallback to simple calculation if detailed calculation fails
      return this.calculateFallbackStateCredit(state, method, businessYearId);
    }
  }

  /**
   * Execute the state pro forma calculation logic
   */
  private static async executeStateProFormaCalculation(
    state: string,
    method: string,
    lines: any[],
    baseData: StateCreditBaseData
  ): Promise<Record<string, number>> {
    const calculationData: Record<string, number> = {
      // Base data
      wages: baseData.wages,
      supplies: baseData.supplies,
      contractResearch: baseData.contractResearch,
      computerLeases: baseData.computerLeases,
      avgGrossReceipts: baseData.avgGrossReceipts,
      businessEntityType: baseData.businessEntityType
    };

    // Execute calculations in line order
    for (const line of lines.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))) {
      if (line.calc) {
        try {
          calculationData[line.field] = line.calc(calculationData);
        } catch (error) {
          console.error(`Error calculating line ${line.line}:`, error);
          calculationData[line.field] = 0;
        }
      } else if (line.defaultValue !== undefined) {
        calculationData[line.field] = line.defaultValue;
      }
    }

    return calculationData;
  }

  /**
   * Generate a human-readable formula description
   */
  private static generateFormulaDescription(lines: any[], finalField: string): string {
    const finalLine = lines.find(line => line.field === finalField);
    if (finalLine?.label) {
      return finalLine.label;
    }
    return `State R&D credit calculation based on qualified research expenses`;
  }

  /**
   * Get state-specific properties
   */
  private static getStateProperty(state: string, property: string): string | null {
    const stateProperties: Record<string, Record<string, string>> = {
      'CA': {
        refundable: 'No',
        carryforward: '10 years',
        eligible_entities: 'Corporations and partnerships'
      },
      'NY': {
        refundable: 'No', 
        carryforward: '15 years',
        eligible_entities: 'All entities'
      },
      'IL': {
        refundable: 'No',
        carryforward: '5 years',
        eligible_entities: 'Corporations'
      },
      'PA': {
        refundable: 'No',
        carryforward: '15 years', 
        eligible_entities: 'All entities'
      },
      'TX': {
        refundable: 'No',
        carryforward: '20 years',
        eligible_entities: 'All entities'
      },
      'GA': {
        refundable: 'No',
        carryforward: '10 years',
        eligible_entities: 'All entities'
      }
    };

    return stateProperties[state]?.[property] || null;
  }

  /**
   * Fallback calculation if detailed calculation fails
   */
  private static async calculateFallbackStateCredit(
    state: string,
    method: string,
    businessYearId: string
  ): Promise<StateCalculationResult[]> {
    try {
      // Get basic QRE data
      const baseData = await StateCreditDataService.getAggregatedQREData(businessYearId);
      const totalQRE = baseData.wages + baseData.supplies + baseData.contractResearch;

      // Basic state credit rates
      const stateRates: Record<string, number> = {
        'CA': 0.15,
        'NY': 0.09,
        'TX': 0.05,
        'IL': 0.065,
        'PA': 0.10,
        'OH': 0.07,
        'GA': 0.10,
        'VA': 0.15,
        'FL': 0.03,
        'AZ': 0.24,
        'CT': 0.06
      };

      const rate = stateRates[state] || 0.05;
      const creditAmount = totalQRE * rate;

      return [{
        state,
        method,
        credit_amount: creditAmount,
        formula: `${(rate * 100).toFixed(1)}% of total QRE (${totalQRE.toLocaleString()})`,
        info: `Fallback calculation for ${state}`,
        refundable: 'No',
        carryforward: '10 years',
        eligible_entities: null,
        special_notes: 'This is a fallback calculation. Please verify with your tax advisor.',
        formula_correct: 'Estimated',
        calculation_details: { totalQRE, rate, creditAmount }
      }];

    } catch (error) {
      console.error('Fallback calculation failed:', error);
      return [];
    }
  }

  /**
   * Calculate all state credits for multiple states using accurate calculations
   */
  static async calculateMultiStateCreditsAccurate(
    businessYearId: string,
    states: string[]
  ): Promise<StateCalculationResult[]> {
    const allResults: StateCalculationResult[] = [];

    for (const state of states) {
      const stateConfig = getStateConfig(state);
      if (!stateConfig) continue;

      // Calculate standard method
      const standardResults = await this.calculateStateCreditsAccurate(
        businessYearId,
        state,
        'standard'
      );
      allResults.push(...standardResults);

      // Calculate alternative method if available
      if (stateConfig.hasAlternativeMethod) {
        const alternativeResults = await this.calculateStateCreditsAccurate(
          businessYearId,
          state,
          'alternative'
        );
        allResults.push(...alternativeResults);
      }
    }

    return allResults;
  }

  /**
   * Get the best credit calculation for a state (higher of standard vs alternative)
   */
  static async getBestStateCredit(
    businessYearId: string,
    state: string
  ): Promise<StateCalculationResult | null> {
    const stateConfig = getStateConfig(state);
    if (!stateConfig) return null;

    const standardResults = await this.calculateStateCreditsAccurate(
      businessYearId,
      state,
      'standard'
    );

    let bestResult = standardResults[0] || null;

    // Check alternative method if available
    if (stateConfig.hasAlternativeMethod) {
      const alternativeResults = await this.calculateStateCreditsAccurate(
        businessYearId,
        state,
        'alternative'
      );

      if (alternativeResults[0] && alternativeResults[0].credit_amount > (bestResult?.credit_amount || 0)) {
        bestResult = alternativeResults[0];
      }
    }

    return bestResult;
  }
} 