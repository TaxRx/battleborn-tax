import { supabase } from "../../../lib/supabase";

// Standardized rounding functions
const roundToDollar = (value: number): number => Math.round(value);
const roundToPercentage = (value: number): number => Math.round(value * 100) / 100;

// Utility function to apply 80% threshold rule (matches display logic)
const applyEightyPercentThreshold = (appliedPercentage: number): number => {
  return appliedPercentage >= 80 ? 100 : appliedPercentage;
};

export interface QREBreakdown {
  employee_wages: number;
  contractor_costs: number;
  supply_costs: number;
  total: number;
}

export interface HistoricalData {
  year: number;
  qre: number;
  gross_receipts: number;
  // Enhanced fields for comprehensive QRE tracking
  manual_qre?: number;
  calculated_qre?: number;
  qre_breakdown?: QREBreakdown;
}

export interface StandardCreditCalculation {
  basePercentage: number;
  fixedBaseAmount: number;
  incrementalQRE: number;
  credit: number;
  adjustedCredit?: number;
  isEligible: boolean;
  missingData: string[];
  calculationDetails: string[];
}

export interface ASCCreditCalculation {
  avgPriorQRE: number;
  incrementalQRE: number;
  credit: number;
  adjustedCredit?: number;
  isStartup: boolean;
  missingData: string[];
  calculationDetails: string[];
}

export interface FederalCreditResults {
  standard: StandardCreditCalculation;
  asc: ASCCreditCalculation;
  selectedMethod: 'standard' | 'asc';
  use280C: boolean;
  corporateTaxRate: number;
}

export interface StateCreditCalculation {
  state: string;
  credit: number;
  rate: number;
  qre: number;
}

export interface CalculationResults {
  businessYearId: string;
  currentYearQRE: QREBreakdown;
  historicalData: HistoricalData[];
  federalCredits: FederalCreditResults;
  stateCredits: StateCreditCalculation[];
  totalFederalCredit: number;
  totalStateCredits: number;
  totalCredits: number;
  calculationDate: string;
}

export class RDCalculationsService {
  
  // Get QRE breakdown for a business year
  // CRITICAL: Check locked QRE values first, then fall back to calculated values
  static async getQREBreakdown(businessYearId: string): Promise<QREBreakdown> {
    try {
      // PRIORITY 1: Check if QRE values are locked for this business year
      const { data: businessYearData, error: yearError } = await supabase
        .from('rd_business_years')
        .select('employee_qre, contractor_qre, supply_qre, qre_locked')
        .eq('id', businessYearId)
        .single();

      if (!yearError && businessYearData?.qre_locked) {
        const lockedQRE = {
          employee_wages: businessYearData.employee_qre || 0,
          contractor_costs: businessYearData.contractor_qre || 0,
          supply_costs: businessYearData.supply_qre || 0,
          total: (businessYearData.employee_qre || 0) + (businessYearData.contractor_qre || 0) + (businessYearData.supply_qre || 0)
        };
        
        console.log('🔒 [RDCalculationsService] Using LOCKED QRE values:', lockedQRE);
        return lockedQRE;
      }

      console.log('📊 [RDCalculationsService] QRE not locked, calculating from internal data');
      
      // PRIORITY 2: Calculate from internal data (existing logic)
      // Get employee wages (from rd_employee_year_data joined with rd_employees)
      const { data: employeeData, error: employeeError } = await supabase
        .from('rd_employee_year_data')
        .select(`
          applied_percent,
          calculated_qre,
          employee:rd_employees (
            annual_wage
          )
        `)
        .eq('business_year_id', businessYearId);

      if (employeeError) throw employeeError;

      const employeeWages = (employeeData || []).reduce((total, emp) => {
        const annualWage = emp.employee?.annual_wage || 0;
        const appliedPercent = emp.applied_percent || 0;
        const calculatedQRE = emp.calculated_qre || 0;
        
        // Use calculated QRE if available, otherwise calculate from wage and percent
        // Apply Math.round() and 80% threshold rule for consistency with other services
        const qreAppliedPercent = applyEightyPercentThreshold(appliedPercent);
        const employeeQRE = calculatedQRE > 0 ? calculatedQRE : Math.round(annualWage * qreAppliedPercent / 100);
        
        console.log('🧮 [RDCalculations] Employee QRE:', {
          annual_wage: annualWage,
          original_applied_percent: appliedPercent,
          qre_applied_percent_with_80_threshold: qreAppliedPercent,
          stored_calculated_qre: calculatedQRE,
          final_employee_qre: employeeQRE,
          calculation_used: calculatedQRE > 0 ? 'stored_calculated_qre' : 'Math.round(wage * (applied_percent >= 80 ? 100 : applied_percent) / 100)'
        });
        
        return total + employeeQRE;
      }, 0);

      // Get contractor costs (from rd_contractor_year_data table directly)
      const { data: contractorData, error: contractorError } = await supabase
        .from('rd_contractor_year_data')
        .select(`
          applied_percent,
          calculated_qre,
          cost_amount
        `)
        .eq('business_year_id', businessYearId);

      if (contractorError) throw contractorError;

      const contractorCosts = (contractorData || []).reduce((total, contractor) => {
        const amount = contractor.cost_amount || 0;
        const appliedPercent = contractor.applied_percent || 0;
        const calculatedQRE = contractor.calculated_qre || 0;
        
        // Use calculated QRE if available, otherwise calculate from amount and percent
        // Apply 65% reduction and 80% threshold rule for contractors (consistent with CSV export and other services)
        const qreAppliedPercent = applyEightyPercentThreshold(appliedPercent);
        const contractorQRE = calculatedQRE > 0 ? calculatedQRE : Math.round((amount * qreAppliedPercent / 100) * 0.65);
        
        console.log('🧮 [RDCalculations] Contractor QRE:', {
          amount: amount,
          original_applied_percent: appliedPercent,
          qre_applied_percent_with_80_threshold: qreAppliedPercent,
          stored_calculated_qre: calculatedQRE,
          final_contractor_qre: contractorQRE,
          calculation_used: calculatedQRE > 0 ? 'stored_calculated_qre' : 'Math.round((amount * (applied_percent >= 80 ? 100 : applied_percent) / 100) * 0.65)'
        });
        
        return total + contractorQRE;
      }, 0);

      // Get supply costs (from rd_supply_subcomponents joined with rd_supplies)
      const { data: supplySubcomponents, error: supplyError } = await supabase
        .from('rd_supply_subcomponents')
        .select(`
          amount_applied,
          applied_percentage,
          supply:rd_supplies (
            annual_cost
          )
        `)
        .eq('business_year_id', businessYearId);

      if (supplyError) throw supplyError;

      const supplyCosts = (supplySubcomponents || []).reduce((total, ssc) => {
        const amountApplied = ssc.amount_applied || 0;
        const appliedPercentage = ssc.applied_percentage || 0;
        const supplyCost = ssc.supply?.annual_cost || 0;
        
        // Use amount_applied if available, otherwise calculate from cost and percentage
        // Apply Math.round() for consistency with other services
        const supplyQRE = amountApplied > 0 ? amountApplied : Math.round(supplyCost * appliedPercentage / 100);
        return total + supplyQRE;
      }, 0);

      return {
        employee_wages: roundToDollar(employeeWages),
        contractor_costs: roundToDollar(contractorCosts),
        supply_costs: roundToDollar(supplyCosts),
        total: roundToDollar(employeeWages + contractorCosts + supplyCosts)
      };
    } catch (error) {
      console.error('Error getting QRE breakdown:', error);
      throw error;
    }
  }

  // Get historical data for base period calculations
  static async getHistoricalData(businessId: string, currentYear: number): Promise<HistoricalData[]> {
    try {
      // Loading historical data for business
      
      // Get business years with basic data (manually entered QREs and gross receipts)
      const { data: businessYears, error } = await supabase
        .from('rd_business_years')
        .select('id, year, total_qre, gross_receipts')
        .eq('business_id', businessId)
        .lt('year', currentYear)
        .order('year', { ascending: false })
        .limit(10); // Get last 10 years

      if (error) {
        console.error('🚨 [RDCalculationsService] Error loading historical data:', error);
        throw error;
      }

      console.log('📊 [RDCalculationsService] Base historical data loaded:', businessYears);

      // For each historical year, calculate QREs from internal data AND combine with manual QREs
      const enhancedHistoricalData: HistoricalData[] = [];

      for (const yearData of businessYears || []) {
        console.log(`🔍 [RDCalculationsService] Processing historical year ${yearData.year} (ID: ${yearData.id})`);
        
        try {
          // Calculate QREs from employees, contractors, supplies for this historical year
          const calculatedQRE = await this.getQREBreakdown(yearData.id);
          
          console.log(`📊 [RDCalculationsService] Year ${yearData.year} QRE breakdown:`, {
            manualQRE: yearData.total_qre || 0,
            calculatedQRE: calculatedQRE.total,
            calculatedBreakdown: calculatedQRE
          });

          // CRITICAL FIX: For historical years, prioritize Manual QRE over calculated
          // Only use calculated QRE if no manual QRE exists
          const manualQRE = yearData.total_qre || 0;
          const finalQRE = manualQRE > 0 ? manualQRE : calculatedQRE.total;

          console.log(`🎯 [RDCalculationsService] Year ${yearData.year} QRE PRIORITY LOGIC:`, {
            manualQRE,
            calculatedQRE: calculatedQRE.total,
            finalQRE,
            logic: manualQRE > 0 ? 'Using MANUAL QRE (Business Setup priority)' : 'Using CALCULATED QRE (no manual QRE)'
          });

          enhancedHistoricalData.push({
            year: yearData.year,
            qre: finalQRE, // Use priority-based QRE, not combined
            gross_receipts: yearData.gross_receipts || 0,
            // Additional breakdown for debugging
            manual_qre: manualQRE,
            calculated_qre: calculatedQRE.total,
            qre_breakdown: calculatedQRE
          });

          console.log(`✅ [RDCalculationsService] Year ${yearData.year} FINAL QRE:`, {
            manual: manualQRE,
            calculated: calculatedQRE.total,
            finalQRE: finalQRE,
            priorityUsed: manualQRE > 0 ? 'MANUAL (Business Setup)' : 'CALCULATED (internal data)'
          });

        } catch (qreError) {
          // Could not calculate QREs for this year
          
          // Fallback to manual QRE only if calculation fails
          const fallbackQRE = yearData.total_qre || 0;
          console.log(`🔄 [RDCalculationsService] Year ${yearData.year} FALLBACK to manual QRE:`, fallbackQRE);
          
          enhancedHistoricalData.push({
            year: yearData.year,
            qre: fallbackQRE,
            gross_receipts: yearData.gross_receipts || 0,
            manual_qre: fallbackQRE,
            calculated_qre: 0,
            qre_breakdown: { employee_wages: 0, contractor_costs: 0, supply_costs: 0, total: 0 }
          });
        }
      }

      console.log('📊 [RDCalculationsService] COMPREHENSIVE historical data loaded:', {
        businessId,
        currentYear,
        totalYears: enhancedHistoricalData.length,
        historicalData: enhancedHistoricalData,
        totalQREByYear: enhancedHistoricalData.map(y => ({ year: y.year, totalQRE: y.qre }))
      });

      return enhancedHistoricalData;
    } catch (error) {
      console.error('❌ [RDCalculationsService] Error getting comprehensive historical data:', error);
      throw error;
    }
  }

  // Calculate Standard Credit (Regular Method)
  static calculateStandardCredit(
    currentYearQRE: number,
    historicalData: HistoricalData[],
    use280C: boolean = false,
    corporateTaxRate: number = 0.21
  ): StandardCreditCalculation {
    const missingData: string[] = [];
    const calculationDetails: string[] = [];
    // Use all available years (up to 4) for base period
    const baseYears = historicalData.slice(0, 4);
    let avgQRE = 0;
    let avgGrossReceipts = 0;
    let validYears = 0;
    baseYears.forEach((year) => {
      calculationDetails.push(`Year ${year.year}: QRE=$${year.qre}, Gross Receipts=$${year.gross_receipts}`);
      if (year.qre > 0) {
        avgQRE += year.qre;
        avgGrossReceipts += year.gross_receipts || 0;
        validYears++;
      }
    });
    if (validYears === 0) {
      calculationDetails.push('No valid QRE data found in base years. Using 0% base percentage.');
      avgQRE = 0;
      avgGrossReceipts = 0;
    } else {
      avgQRE /= validYears;
      avgGrossReceipts /= validYears;
    }
    // Calculate base percentage (capped at 16%)
    let basePercentage = avgGrossReceipts > 0 ? avgQRE / avgGrossReceipts : 0;
    basePercentage = Math.min(basePercentage, 0.16);
    calculationDetails.push(`Base Percentage: ${(basePercentage * 100).toFixed(2)}%`);
    // Fixed base amount is avgQRE if no gross receipts, else basePercentage * avgGrossReceipts
    const fixedBaseAmount = avgGrossReceipts > 0 ? basePercentage * avgGrossReceipts : 0;
    calculationDetails.push(`Fixed Base Amount: $${fixedBaseAmount.toFixed(2)}`);
    // Enforce minimum base amount (50% of current year QREs)
    const minBaseAmount = 0.5 * currentYearQRE;
    const baseAmount = Math.max(fixedBaseAmount, minBaseAmount);
    calculationDetails.push(`Base Amount (after 50% QRE min): $${baseAmount.toFixed(2)}`);
    // Incremental QRE
    const incrementalQRE = Math.max(currentYearQRE - baseAmount, 0);
    calculationDetails.push(`Incremental QRE: $${incrementalQRE.toFixed(2)}`);
    // Credit
    let credit = incrementalQRE * 0.20;
    calculationDetails.push(`Credit (20%): $${credit.toFixed(2)}`);
    // 280C adjustment
    let adjustedCredit: number | undefined;
    if (use280C) {
      adjustedCredit = credit * (1 - corporateTaxRate);
      calculationDetails.push(`280C Adjusted Credit: $${adjustedCredit.toFixed(2)}`);
    }
    // Always eligible (per IRS guidance, just use 0% base if no data)
    return {
      basePercentage,
      fixedBaseAmount,
      incrementalQRE,
      credit,
      adjustedCredit,
      isEligible: true,
      missingData,
      calculationDetails
    };
  }

  // Calculate Alternative Simplified Credit (ASC)
  static calculateASCCredit(
    currentYearQRE: number,
    historicalData: HistoricalData[],
    use280C: boolean = false,
    corporateTaxRate: number = 0.21
  ): ASCCreditCalculation {
    const missingData: string[] = [];
    const calculationDetails: string[] = [];
    // Use all available prior years (up to 3) for ASC
    const priorYears = historicalData.slice(0, 3);
    const validPriorYears = priorYears.filter(year => year.qre > 0);
    validPriorYears.forEach((year) => {
      calculationDetails.push(`ASC Prior Year ${year.year}: QRE=$${year.qre}`);
    });
    let avgPriorQRE = 0;
    let isStartup = false;
    let credit = 0;
    let incrementalQRE = 0;
    if (validPriorYears.length === 3) {
      avgPriorQRE = validPriorYears.reduce((sum, year) => sum + year.qre, 0) / 3;
      calculationDetails.push(`ASC Multi-year: Avg Prior QRE = $${avgPriorQRE.toFixed(2)}`);
      // FIXED: Use 50% of average prior QRE as base amount (IRS regulation)
      const baseAmount = avgPriorQRE * 0.5;
      incrementalQRE = Math.max(currentYearQRE - baseAmount, 0);
      calculationDetails.push(`Base Amount (50% of Avg Prior QRE): $${baseAmount.toFixed(2)}`);
      calculationDetails.push(`Incremental QRE: $${incrementalQRE.toFixed(2)}`);
      credit = incrementalQRE * 0.14;
      calculationDetails.push(`Credit (14%): $${credit.toFixed(2)}`);
      isStartup = false; // Multi-year method
    } else if (validPriorYears.length > 0) {
      avgPriorQRE = validPriorYears.reduce((sum, year) => sum + year.qre, 0) / validPriorYears.length;
      calculationDetails.push(`ASC Single-year: Avg Prior QRE = $${avgPriorQRE.toFixed(2)}`);
      // For single-year/startup method, use 6% of current year QRE (no incremental calculation)
      incrementalQRE = 0; // Not used for startup provision
      calculationDetails.push(`Using startup provision (6% of current QRE)`);
      credit = currentYearQRE * 0.06;
      calculationDetails.push(`Credit (6%): $${credit.toFixed(2)}`);
      isStartup = true; // Single-year method (startup provision)
      missingData.push(`Using ${validPriorYears.length} prior year(s) for ASC calculation`);
    } else {
      avgPriorQRE = 0;
      isStartup = true; // No prior years (startup provision)
      calculationDetails.push('No prior year QRE data available - using startup provision (6% of current year QRE)');
      credit = currentYearQRE * 0.06;
      calculationDetails.push(`Credit (6%): $${credit.toFixed(2)}`);
      missingData.push('No prior year QRE data available - using startup provision (6% of current year QRE)');
    }
    let adjustedCredit: number | undefined;
    if (use280C) {
      adjustedCredit = credit * (1 - corporateTaxRate);
      calculationDetails.push(`280C Adjusted Credit: $${adjustedCredit.toFixed(2)}`);
    }
    return {
      avgPriorQRE,
      incrementalQRE,
      credit,
      adjustedCredit,
      isStartup,
      missingData,
      calculationDetails
    };
  }

  // Calculate state credits
  static calculateStateCredits(
    qre: number,
    businessState: string
  ): StateCreditCalculation[] {
    // State R&D credit rates (simplified - would need more complex logic)
    const stateRates: { [key: string]: number } = {
      'CA': 0.15, // California
      'NY': 0.09, // New York
      'TX': 0.05, // Texas
      'FL': 0.00, // Florida (no state R&D credit)
      'IL': 0.065, // Illinois
      'PA': 0.10, // Pennsylvania
      'OH': 0.07, // Ohio
      'MI': 0.04, // Michigan
      'GA': 0.03, // Georgia
      'NC': 0.025, // North Carolina
      'VA': 0.15, // Virginia
      'WA': 0.00, // Washington (no state R&D credit)
      'CO': 0.03, // Colorado
      'AZ': 0.00, // Arizona (no state R&D credit)
      'TN': 0.00, // Tennessee (no state R&D credit)
      'IN': 0.10, // Indiana
      'WI': 0.05, // Wisconsin
      'MN': 0.10, // Minnesota
      'MO': 0.05, // Missouri
      'LA': 0.00, // Louisiana (no state R&D credit)
    };

    const results: StateCreditCalculation[] = [];

    if (stateRates[businessState] && stateRates[businessState] > 0) {
      results.push({
        state: businessState,
        credit: qre * stateRates[businessState],
        rate: stateRates[businessState],
        qre
      });
    }

    return results;
  }

  // Main calculation method
  static async calculateCredits(
    businessYearId: string,
    use280C: boolean = false,
    corporateTaxRate: number = 0.21
  ): Promise<CalculationResults> {
    try {
      console.log('🚀 [RDCalculationsService] Starting main calculateCredits for business year:', businessYearId);
      
      // Get business year info
      const { data: businessYear, error: yearError } = await supabase
        .from('rd_business_years')
        .select(`
          *,
          business:rd_businesses (
            id,
            domicile_state
          )
        `)
        .eq('id', businessYearId)
        .single();

      if (yearError) throw yearError;

      console.log('🔍 [RDCalculationsService] Business year data:', {
        id: businessYear.id,
        year: businessYear.year,
        business_id: businessYear.business_id,
        gross_receipts: businessYear.gross_receipts,
        total_qre: businessYear.total_qre
      });

      // Get current year QRE breakdown
      const currentYearQRE = await this.getQREBreakdown(businessYearId);

      console.log('📊 [RDCalculationsService] Current year QRE breakdown:', currentYearQRE);

      // Get historical data
      const historicalData = await this.getHistoricalData(businessYear.business_id, businessYear.year);

      console.log('📊 [RDCalculationsService] Historical data retrieved:', {
        businessId: businessYear.business_id,
        currentYear: businessYear.year,
        historicalDataCount: historicalData.length,
        historicalData: historicalData
      });

      // Calculate federal credits
      const standardCredit = this.calculateStandardCredit(
        currentYearQRE.total,
        historicalData,
        use280C,
        corporateTaxRate
      );

      const ascCredit = this.calculateASCCredit(
        currentYearQRE.total,
        historicalData,
        use280C,
        corporateTaxRate
      );

      // Always calculate both methods and let user choose
      // Default to ASC if Standard is not eligible, otherwise let user decide
      const selectedMethod = standardCredit.isEligible ? 'standard' : 'asc';

      const federalCredits: FederalCreditResults = {
        standard: standardCredit,
        asc: ascCredit,
        selectedMethod,
        use280C,
        corporateTaxRate
      };

      // Calculate state credits
      const stateCredits = this.calculateStateCredits(
        currentYearQRE.total,
        businessYear.business?.domicile_state || ''
      );

      // Calculate totals based on selected method
      const totalFederalCredit = selectedMethod === 'standard' 
        ? (standardCredit.adjustedCredit || standardCredit.credit)
        : (ascCredit.adjustedCredit || ascCredit.credit);

      const totalStateCredits = stateCredits.reduce((sum, credit) => sum + credit.credit, 0);
      const totalCredits = totalFederalCredit + totalStateCredits;

      const results: CalculationResults = {
        businessYearId,
        currentYearQRE,
        historicalData,
        federalCredits,
        stateCredits,
        totalFederalCredit,
        totalStateCredits,
        totalCredits,
        calculationDate: new Date().toISOString()
      };

      console.log('✅ [RDCalculationsService] Final calculation results:', {
        businessYearId: results.businessYearId,
        currentYearQRETotal: results.currentYearQRE.total,
        historicalDataCount: results.historicalData.length,
        historicalDataSample: results.historicalData.slice(0, 3),
        standardCredit: results.federalCredits.standard.credit,
        ascCredit: results.federalCredits.asc.credit,
        selectedMethod: results.federalCredits.selectedMethod,
        totalFederalCredit: results.totalFederalCredit
      });

      // Save results to database
      await this.saveCalculationResults(results);

      return results;
    } catch (error) {
      console.error('Error calculating credits:', error);
      throw error;
    }
  }

  // Save calculation results to database
  static async saveCalculationResults(results: CalculationResults): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_federal_credit_results')
        .upsert({
          business_year_id: results.businessYearId,
          standard_credit: results.federalCredits.standard.credit,
          standard_adjusted_credit: results.federalCredits.standard.adjustedCredit,
          asc_credit: results.federalCredits.asc.credit,
          asc_adjusted_credit: results.federalCredits.asc.adjustedCredit,
          selected_method: results.federalCredits.selectedMethod,
          use_280c: results.federalCredits.use280C,
          corporate_tax_rate: results.federalCredits.corporateTaxRate,
          total_federal_credit: results.totalFederalCredit,
          total_state_credits: results.totalStateCredits,
          total_credits: results.totalCredits,
          calculation_date: results.calculationDate,
          qre_breakdown: results.currentYearQRE,
          historical_data: results.historicalData,
          state_credits: results.stateCredits
        }, {
          onConflict: 'business_year_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving calculation results:', error);
      throw error;
    }
  }

  // Get saved calculation results
  static async getCalculationResults(businessYearId: string): Promise<CalculationResults | null> {
    try {
      const { data, error } = await supabase
        .from('rd_federal_credit_results')
        .select('*')
        .eq('business_year_id', businessYearId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No results found
        }
        throw error;
      }

      return {
        businessYearId: data.business_year_id,
        currentYearQRE: data.qre_breakdown,
        historicalData: data.historical_data,
        federalCredits: {
          standard: {
            basePercentage: data.standard_base_percentage || 0,
            fixedBaseAmount: data.standard_fixed_base_amount || 0,
            incrementalQRE: data.standard_incremental_qre || 0,
            credit: data.standard_credit,
            adjustedCredit: data.standard_adjusted_credit,
            isEligible: data.standard_is_eligible || false,
            missingData: data.standard_missing_data || [],
            calculationDetails: data.standard_calculation_details || []
          },
          asc: {
            avgPriorQRE: data.asc_avg_prior_qre || 0,
            incrementalQRE: data.asc_incremental_qre || 0,
            credit: data.asc_credit,
            adjustedCredit: data.asc_adjusted_credit,
            isStartup: data.asc_is_startup || false,
            missingData: data.asc_missing_data || [],
            calculationDetails: data.asc_calculation_details || []
          },
          selectedMethod: data.selected_method,
          use280C: data.use_280c,
          corporateTaxRate: data.corporate_tax_rate
        },
        stateCredits: data.state_credits || [],
        totalFederalCredit: data.total_federal_credit,
        totalStateCredits: data.total_state_credits,
        totalCredits: data.total_credits,
        calculationDate: data.calculation_date
      };
    } catch (error) {
      console.error('Error getting calculation results:', error);
      throw error;
    }
  }
} 