import { StateCreditBaseData, StateValidationRule, StateProFormaConfig } from './stateCreditDataService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  maxCredit?: number;
  carryforwardAmount?: number;
}

export class StateValidationService {
  
  // Validate state pro forma data against state-specific rules
  static validateStateProForma(
    stateConfig: StateProFormaConfig,
    data: StateCreditBaseData,
    method: 'standard' | 'alternative' = 'standard'
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Apply validation rules
    for (const rule of stateConfig.validation_rules) {
      if (rule.applies_to && rule.applies_to !== method && rule.applies_to !== 'both') {
        continue;
      }

      if (rule.condition && !rule.condition(data)) {
        continue;
      }

      switch (rule.type) {
        case 'max_credit':
          this.validateMaxCredit(rule, data, result);
          break;
        case 'carryforward_limit':
          this.validateCarryforwardLimit(rule, data, result);
          break;
        case 'apportionment_requirement':
          this.validateApportionmentRequirement(rule, data, result);
          break;
        case 'entity_type_restriction':
          this.validateEntityTypeRestriction(rule, data, result);
          break;
        case 'gross_receipts_threshold':
          this.validateGrossReceiptsThreshold(rule, data, result);
          break;
      }
    }

    return result;
  }

  private static validateMaxCredit(rule: StateValidationRule, data: StateCreditBaseData, result: ValidationResult): void {
    const totalQRE = (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0);
    const maxCredit = totalQRE * (rule.value / 100);
    
    result.maxCredit = maxCredit;
    
    // This would be checked against the calculated credit amount
    // For now, we'll add it as a warning
    result.warnings.push(`Maximum credit allowed: $${maxCredit.toLocaleString()}`);
  }

  private static validateCarryforwardLimit(rule: StateValidationRule, data: StateCreditBaseData, result: ValidationResult): void {
    // This would typically be checked against existing carryforward amounts
    // For now, we'll add it as informational
    result.carryforwardAmount = rule.value;
    result.warnings.push(`Carryforward limit: ${rule.value} years`);
  }

  private static validateApportionmentRequirement(rule: StateValidationRule, data: StateCreditBaseData, result: ValidationResult): void {
    if (!data.apportionmentFactor || data.apportionmentFactor <= 0) {
      result.isValid = false;
      result.errors.push(rule.message);
    }
  }

  private static validateEntityTypeRestriction(rule: StateValidationRule, data: StateCreditBaseData, result: ValidationResult): void {
    if (data.businessEntityType && rule.value === 0) {
      // Check if entity type is restricted
      const restrictedTypes = ['LLC', 'Partnership']; // Example restricted types
      if (restrictedTypes.includes(data.businessEntityType)) {
        result.isValid = false;
        result.errors.push(rule.message);
      }
    }
  }

  private static validateGrossReceiptsThreshold(rule: StateValidationRule, data: StateCreditBaseData, result: ValidationResult): void {
    if (data.avgGrossReceipts && data.avgGrossReceipts < rule.value) {
      result.warnings.push(rule.message);
    }
  }

  // Check if alternative calculation methods are available
  static getAvailableAlternativeMethods(
    stateConfig: StateProFormaConfig,
    data: StateCreditBaseData
  ): AlternativeCalculationMethod[] {
    if (!stateConfig.alternative_methods) {
      return [];
    }

    return stateConfig.alternative_methods.filter(method => 
      method.is_available(data)
    );
  }

  // Calculate credit using alternative method
  static calculateAlternativeCredit(
    method: AlternativeCalculationMethod,
    data: StateCreditBaseData
  ): number {
    // Find the final credit line in the alternative method
    const finalCreditLine = method.lines.find(line => 
      line.field.includes('Credit') || line.field.includes('credit')
    );

    if (finalCreditLine && finalCreditLine.calc) {
      return finalCreditLine.calc(data);
    }

    return 0;
  }

  // Compare standard vs alternative methods
  static compareCalculationMethods(
    stateConfig: StateProFormaConfig,
    data: StateCreditBaseData
  ): {
    standard: number;
    alternative?: number;
    recommendation: 'standard' | 'alternative' | 'equal';
    difference?: number;
  } {
    // Calculate standard credit
    const standardCredit = this.calculateStandardCredit(stateConfig, data);
    
    // Get available alternative methods
    const availableMethods = this.getAvailableAlternativeMethods(stateConfig, data);
    
    if (availableMethods.length === 0) {
      return {
        standard: standardCredit,
        recommendation: 'standard'
      };
    }

    // Use the first available alternative method
    const alternativeMethod = availableMethods[0];
    const alternativeCredit = this.calculateAlternativeCredit(alternativeMethod, data);
    
    const difference = alternativeCredit - standardCredit;
    const recommendation = difference > 0 ? 'alternative' : 
                         difference < 0 ? 'standard' : 'equal';

    return {
      standard: standardCredit,
      alternative: alternativeCredit,
      recommendation,
      difference
    };
  }

  private static calculateStandardCredit(stateConfig: StateProFormaConfig, data: StateCreditBaseData): number {
    // This would calculate the standard credit based on the state's standard method
    // For now, return a placeholder calculation
    const totalQRE = (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0);
    return totalQRE * stateConfig.credit_rate;
  }
}

// Enhanced state configurations with validation rules and alternative methods
export const ENHANCED_STATE_CONFIGS: Record<string, StateProFormaConfig> = {
  'NY': {
    state: 'NY',
    name: 'New York',
    forms: {
      standard: {
        name: 'NY Form CT-3 - Research and Development Credit',
        method: 'standard',
        lines: [] // Will be populated from existing config
      }
    },
    notes: [
      'New York uses a fixed-base percentage calculation similar to the federal credit.',
      'The credit is 9% of incremental qualified research expenses.',
      'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.',
      'Available only to corporations.',
      'Credit is non-refundable but can be carried forward for up to 15 years.'
    ],
    form_reference: 'NY Form CT-3',
    credit_rate: 0.09,
    max_fixed_base_percentage: 16,
    validation_rules: [
      {
        type: 'max_credit',
        value: 50, // 50% of tax liability
        message: 'Credit cannot exceed 50% of New York tax liability',
        applies_to: 'both'
      },
      {
        type: 'carryforward_limit',
        value: 15,
        message: 'Credit can be carried forward for up to 15 years',
        applies_to: 'both'
      },
      {
        type: 'entity_type_restriction',
        value: 0,
        message: 'Credit available only to corporations',
        applies_to: 'both',
        condition: (data) => data.businessEntityType !== 'C-Corp'
      }
    ],
    carryforward_years: 15,
    max_credit_percentage: 50,
    entity_type_restrictions: ['C-Corp']
  },
  
  'IL': {
    state: 'IL',
    name: 'Illinois',
    forms: {
      standard: {
        name: 'IL Form IL-1120 - Research and Development Credit',
        method: 'standard',
        lines: [] // Will be populated from existing config
      }
    },
    notes: [
      'Illinois uses a fixed-base percentage calculation similar to the federal credit.',
      'The credit is 6.5% of incremental qualified research expenses.',
      'Most taxpayers use a 3% fixed-base percentage unless they qualify for a higher rate.',
      'Available only to corporations.',
      'Credit is non-refundable but can be carried forward for up to 5 years.',
      'Credit can be used to offset up to 50% of Illinois income tax liability.'
    ],
    form_reference: 'IL Form IL-1120',
    credit_rate: 0.065,
    max_fixed_base_percentage: 16,
    validation_rules: [
      {
        type: 'max_credit',
        value: 50, // 50% of tax liability
        message: 'Credit cannot exceed 50% of Illinois tax liability',
        applies_to: 'both'
      },
      {
        type: 'carryforward_limit',
        value: 5,
        message: 'Credit can be carried forward for up to 5 years',
        applies_to: 'both'
      },
      {
        type: 'entity_type_restriction',
        value: 0,
        message: 'Credit available only to corporations',
        applies_to: 'both',
        condition: (data) => data.businessEntityType !== 'C-Corp'
      }
    ],
    carryforward_years: 5,
    max_credit_percentage: 50,
    entity_type_restrictions: ['C-Corp'],
    alternative_methods: [
      {
        name: 'Simplified Method',
        description: 'Alternative calculation for small businesses with gross receipts under $5M',
        method: 'simplified',
        lines: [
          {
            line: '1',
            label: 'Total qualified research expenses',
            field: 'ilAltQRE',
            editable: false,
            method: 'alternative',
            calc: (data) => (data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0),
            line_type: 'calculated',
            sort_order: 1
          },
          {
            line: '2',
            label: 'Simplified credit (Line 1 × 3.25%)',
            field: 'ilAltCredit',
            editable: false,
            method: 'alternative',
            calc: (data) => ((data.wages || 0) + (data.supplies || 0) + (data.contractResearch || 0)) * 0.0325,
            line_type: 'calculated',
            sort_order: 2
          }
        ],
        validation_rules: [
          {
            type: 'gross_receipts_threshold',
            value: 5000000,
            message: 'Simplified method available only for businesses with average gross receipts under $5M',
            applies_to: 'alternative'
          }
        ],
        is_available: (data) => (data.avgGrossReceipts || 0) < 5000000
      }
    ]
  }
};

// Helper function to get enhanced state config
export function getEnhancedStateConfig(stateCode: string): StateProFormaConfig | null {
  return ENHANCED_STATE_CONFIGS[stateCode.toUpperCase()] || null;
} 