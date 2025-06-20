// Tax Calculator Module - Main Exports
// This module preserves all existing tax calculation functionality

// Components
export { default as TaxResults } from './components/TaxResults';
export { default as TaxBracketBreakdown } from './components/TaxBracketBreakdown';
export { default as StrategyCards } from './components/StrategyCards';
export { default as InfoForm } from './components/InfoForm';
export { default as CharitableDonationCalculator } from './components/CharitableDonationCalculator';
export { default as AugustaRuleCalculator } from './components/AugustaRuleCalculator';
export { default as FmcModal } from './components/FmcModal';
export { default as HireChildrenCalculator } from './components/HireChildrenCalculator';
export { default as CostSegregationCalculator } from './components/CostSegregationCalculator';

// Wizards
export { default as AugustaRuleWizard } from './components/AugustaRuleWizard';
export { default as RDTCreditWizard } from './components/RDTCreditWizard';

// Utilities
export * from './utils/taxCalculations';
export * from './utils/taxStrategies';

// Store
export { useTaxStore } from './store/taxStore';

// Data
export { taxRates } from './taxRates';

// Types (re-export existing types)
export type {
  TaxInfo,
  TaxRates,
  TaxStrategy,
  TaxBreakdown,
  SavedCalculation
} from '../../types';

// Tax Calculator Wrapper Component
export { default as TaxCalculatorModule } from './TaxCalculatorModule'; 