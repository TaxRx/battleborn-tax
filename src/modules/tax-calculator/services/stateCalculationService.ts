import { supabase } from '../lib/supabase';

export interface StateCalculation {
  id: string;
  state: string;
  calculation_method: string;
  refundable: string | null;
  carryforward: string | null;
  eligible_entities: string[] | null;
  calculation_formula: string;
  special_notes: string | null;
  start_year: number;
  end_year: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  formula_correct: string | null;
}

export interface StateCalculationResult {
  state: string;
  credit_amount: number;
  calculation_method: string;
  refundable: string | null;
  carryforward: string | null;
  formula_used: string;
  special_notes?: string;
  formula_correct?: string;
}

export interface QREBreakdown {
  wages: number;
  contractor_costs: number;
  supply_costs: number;
  contract_research: number;
  total_qre: number;
}

export class StateCalculationService {
  private static instance: StateCalculationService;
  private calculationsCache: Map<string, StateCalculation[]> = new Map();
  private resultsCache: Map<string, StateCalculationResult[]> = new Map();

  private constructor() {}

  static getInstance(): StateCalculationService {
    if (!StateCalculationService.instance) {
      StateCalculationService.instance = new StateCalculationService();
    }
    return StateCalculationService.instance;
  }

  // Memoized function to get all state calculations
  async getStateCalculations(year: number = 2024): Promise<StateCalculation[]> {
    const cacheKey = `calculations_${year}`;
    
    if (this.calculationsCache.has(cacheKey)) {
      console.log(`[DEBUG] Returning cached calculations for year ${year}`);
      return this.calculationsCache.get(cacheKey)!;
    }

    console.log(`[DEBUG] Fetching state calculations from database for year ${year}`);
    
    const { data, error } = await supabase
      .from('rd_state_calculations')
      .select('*')
      .eq('is_active', true)
      .lte('start_year', year)
      .or(`end_year.is.null,end_year.gte.${year}`)
      .order('state');

    if (error) {
      console.error('Error fetching state calculations:', error);
      return [];
    }

    const calculations = data || [];
    console.log(`[DEBUG] Retrieved ${calculations.length} state calculations:`, calculations);
    
    this.calculationsCache.set(cacheKey, calculations);
    return calculations;
  }

  // Memoized function to calculate state credits
  async calculateStateCredits(
    qreBreakdown: QREBreakdown,
    year: number = 2024
  ): Promise<StateCalculationResult[]> {
    const cacheKey = `${JSON.stringify(qreBreakdown)}_${year}`;
    
    if (this.resultsCache.has(cacheKey)) {
      return this.resultsCache.get(cacheKey)!;
    }

    const calculations = await this.getStateCalculations(year);
    const results: StateCalculationResult[] = [];

    for (const calc of calculations) {
      const creditAmount = this.calculateCreditForState(calc, qreBreakdown);
      
      results.push({
        state: calc.state,
        credit_amount: creditAmount,
        calculation_method: calc.calculation_method,
        refundable: calc.refundable,
        carryforward: calc.carryforward,
        formula_used: calc.calculation_formula,
        special_notes: calc.special_notes || undefined,
        formula_correct: calc.formula_correct || undefined
      });
    }

    // Sort by credit amount descending
    results.sort((a, b) => b.credit_amount - a.credit_amount);
    
    this.resultsCache.set(cacheKey, results);
    return results;
  }

  // Calculate credit for a specific state
  private calculateCreditForState(
    calculation: StateCalculation,
    qreBreakdown: QREBreakdown
  ): number {
    const { wages, contractor_costs, supply_costs, contract_research, total_qre } = qreBreakdown;
    
    // Parse the formula and calculate credit
    const formula = calculation.calculation_formula.toLowerCase();
    
    if (formula.includes('no state r&d credit available') || calculation.calculation_method.toLowerCase().includes('no credit')) {
      return 0;
    }

    // Handle semicolon-separated formulas - use the first one for calculation
    const firstFormula = formula.split(';')[0].trim();
    
    // Extract credit rate from formula - look for percentage patterns
    const rateMatch = firstFormula.match(/(\d+\.?\d*)\s*%/);
    if (!rateMatch) {
      // Try alternative patterns
      const altRateMatch = firstFormula.match(/0\.(\d+)/);
      if (altRateMatch) {
        const rate = parseFloat(`0.${altRateMatch[1]}`);
        return rate * total_qre;
      }
      console.warn(`Could not parse rate from formula: ${firstFormula}`);
      return 0;
    }

    const rate = parseFloat(rateMatch[1]) / 100; // Convert percentage to decimal

    // Calculate based on formula type
    if (firstFormula.includes('wages') && firstFormula.includes('contractor costs') && firstFormula.includes('supply costs')) {
      // Standard formula with breakdown
      return rate * (wages + 0.65 * contractor_costs + supply_costs + contract_research);
    } else if (firstFormula.includes('qres') && firstFormula.includes('base')) {
      // Fixed-base percentage calculation (simplified)
      // For now, use total QRE as base calculation would require historical data
      return rate * total_qre;
    } else if (firstFormula.includes('qres')) {
      // Simple percentage of QREs
      return rate * total_qre;
    } else {
      // Default to total QRE calculation
      return rate * total_qre;
    }
  }

  // Clear cache when needed
  clearCache(): void {
    this.calculationsCache.clear();
    this.resultsCache.clear();
  }

  // Get calculation for specific state
  async getStateCalculation(state: string, year: number = 2024): Promise<StateCalculation | null> {
    console.log(`[DEBUG] getStateCalculation called for state: ${state}, year: ${year}`);
    
    const calculations = await this.getStateCalculations(year);
    console.log(`[DEBUG] All calculations:`, calculations);
    
    const result = calculations.find(calc => calc.state === state.toUpperCase()) || null;
    console.log(`[DEBUG] Found calculation for ${state}:`, result);
    
    return result;
  }

  // Get state calculations for a specific state with formula options
  async getStateCalculationWithOptions(state: string, year: number = 2024): Promise<{
    calculation: StateCalculation | null;
    formulaOptions: string[];
  }> {
    console.log(`[DEBUG] Looking for state calculation for: ${state}, year: ${year}`);
    
    const calculation = await this.getStateCalculation(state, year);
    console.log(`[DEBUG] Found calculation:`, calculation);
    
    if (!calculation) {
      console.log(`[DEBUG] No calculation found for state: ${state}`);
      return { calculation: null, formulaOptions: [] };
    }

    // Split formula by semicolon to get multiple options
    const formulaOptions = calculation.calculation_formula
      .split(';')
      .map(formula => formula.trim())
      .filter(formula => formula.length > 0);

    console.log(`[DEBUG] Formula options:`, formulaOptions);

    return {
      calculation,
      formulaOptions
    };
  }

  // Calculate credit for a specific state with selected formula option
  async calculateStateCreditForBusiness(
    businessState: string,
    qreBreakdown: QREBreakdown,
    selectedFormulaIndex: number = 0,
    year: number = 2024
  ): Promise<StateCalculationResult | null> {
    const { calculation, formulaOptions } = await this.getStateCalculationWithOptions(businessState, year);
    
    if (!calculation || formulaOptions.length === 0) {
      return null;
    }

    // Use the selected formula option or default to first
    const selectedFormula = formulaOptions[selectedFormulaIndex] || formulaOptions[0];
    
    // Create a temporary calculation object with the selected formula
    const tempCalculation = {
      ...calculation,
      calculation_formula: selectedFormula
    };

    const creditAmount = this.calculateCreditForState(tempCalculation, qreBreakdown);
    
    return {
      state: calculation.state,
      credit_amount: creditAmount,
      calculation_method: calculation.calculation_method,
      refundable: calculation.refundable,
      carryforward: calculation.carryforward,
      formula_used: selectedFormula,
      special_notes: calculation.special_notes || undefined,
      formula_correct: calculation.formula_correct || undefined
    };
  }

  // Get total state credits
  async getTotalStateCredits(qreBreakdown: QREBreakdown, year: number = 2024): Promise<number> {
    const results = await this.calculateStateCredits(qreBreakdown, year);
    return results.reduce((total, result) => total + result.credit_amount, 0);
  }
} 