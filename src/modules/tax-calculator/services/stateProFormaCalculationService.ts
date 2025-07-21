import { supabase } from '../lib/supabase';
import { StateCreditDataService } from './stateCreditDataService';

// Import all state pro forma configurations
import { CA_PROFORMA_LINES } from '../components/StateProForma/ca';
import { NY_PROFORMA_LINES, NY_ALTERNATIVE_LINES } from '../components/StateProForma/ny';
import { TX_PROFORMA_LINES } from '../components/StateProForma/tx';
import { IL_PROFORMA_LINES } from '../components/StateProForma/il';
import { GA_PROFORMA_LINES } from '../components/StateProForma/ga';
import { OH_PROFORMA_LINES } from '../components/StateProForma/oh';
import { PA_PROFORMA_LINES } from '../components/StateProForma/pa';
import { VA_PROFORMA_LINES } from '../components/StateProForma/va';
import { FL_PROFORMA_LINES } from '../components/StateProForma/fl';
import { NC_PROFORMA_LINES } from '../components/StateProForma/nc';
import { SC_PROFORMA_LINES } from '../components/StateProForma/sc';
import { TN_PROFORMA_LINES } from '../components/StateProForma/tn';
import { ID_PROFORMA_LINES } from '../components/StateProForma/id';
import { OR_PROFORMA_LINES } from '../components/StateProForma/or';
import { CO_PROFORMA_LINES } from '../components/StateProForma/co';
import { OK_PROFORMA_LINES } from '../components/StateProForma/ok';
import { AR_PROFORMA_LINES } from '../components/StateProForma/ar';
import { ME_PROFORMA_LINES } from '../components/StateProForma/me';
import { VT_PROFORMA_LINES } from '../components/StateProForma/vt';
import { RI_PROFORMA_LINES } from '../components/StateProForma/ri';
import { MA_PROFORMA_LINES } from '../components/StateProForma/ma';
import { ND_PROFORMA_LINES } from '../components/StateProForma/nd';
import { MO_PROFORMA_LINES } from '../components/StateProForma/mo';
import { MT_PROFORMA_LINES } from '../components/StateProForma/mt';
import { NH_PROFORMA_LINES } from '../components/StateProForma/nh';

/**
 * Real State Pro Forma Calculation Service
 * This service actually executes the real state pro forma calculations
 * and extracts the final credit values from the correct fields
 */
export class StateProFormaCalculationService {
  
  /**
   * State pro forma lines configuration mapping
   */
  private static STATE_LINES_MAP = {
    CA: { standard: CA_PROFORMA_LINES, finalField: 'line17b' },
    NY: { standard: NY_PROFORMA_LINES, alternative: NY_ALTERNATIVE_LINES, finalField: 'nyFinalCredit', altFinalField: 'nyAltCredit' },
    TX: { standard: TX_PROFORMA_LINES, finalField: 'txFinalCredit' },
    IL: { standard: IL_PROFORMA_LINES, finalField: 'ilFinalCredit' },
    GA: { standard: GA_PROFORMA_LINES, finalField: 'gaFinalCredit' },
    OH: { standard: OH_PROFORMA_LINES, finalField: 'ohFinalCredit' },
    PA: { standard: PA_PROFORMA_LINES, finalField: 'paFinalCredit' },
    VA: { standard: VA_PROFORMA_LINES, finalField: 'vaFinalCredit' },
    FL: { standard: FL_PROFORMA_LINES, finalField: 'flFinalCredit' },
    NC: { standard: NC_PROFORMA_LINES, finalField: 'ncFinalCredit' },
    SC: { standard: SC_PROFORMA_LINES, finalField: 'scFinalCredit' },
    TN: { standard: TN_PROFORMA_LINES, finalField: 'tnFinalCredit' },
    ID: { standard: ID_PROFORMA_LINES, finalField: 'idFinalCredit' },
    OR: { standard: OR_PROFORMA_LINES, finalField: 'orFinalCredit' },
    CO: { standard: CO_PROFORMA_LINES, finalField: 'coFinalCredit' },
    OK: { standard: OK_PROFORMA_LINES, finalField: 'okFinalCredit' },
    AR: { standard: AR_PROFORMA_LINES, finalField: 'arFinalCredit' },
    ME: { standard: ME_PROFORMA_LINES, finalField: 'meFinalCredit' },
    VT: { standard: VT_PROFORMA_LINES, finalField: 'vtFinalCredit' },
    RI: { standard: RI_PROFORMA_LINES, finalField: 'riFinalCredit' },
    MA: { standard: MA_PROFORMA_LINES, finalField: 'maFinalCredit' },
    ND: { standard: ND_PROFORMA_LINES, finalField: 'ndFinalCredit' },
    MO: { standard: MO_PROFORMA_LINES, finalField: 'moFinalCredit' },
    MT: { standard: MT_PROFORMA_LINES, finalField: 'mtFinalCredit' },
    NH: { standard: NH_PROFORMA_LINES, finalField: 'nhFinalCredit' },
  };

  /**
   * Calculate state credit using REAL pro forma calculation logic
   */
  static async getStateCreditsFromProForma(businessYearId: string, state: string, method: string = 'standard'): Promise<{ total: number; breakdown: Record<string, number> }> {
    try {
      console.log(`🔧 [REAL STATE PRO FORMA] Calculating ${state} credit using REAL pro forma logic...`);
      
      // Get base QRE data
      const qreData = await StateCreditDataService.getAggregatedQREData(businessYearId);
      console.log('🔧 [REAL STATE PRO FORMA] Base QRE data:', qreData);
      
      if (!qreData || qreData.wages === 0) {
        console.log('🔧 [REAL STATE PRO FORMA] No QRE data available');
        return { total: 0, breakdown: {} };
      }

      // Get state configuration
      const stateConfig = this.STATE_LINES_MAP[state];
      if (!stateConfig) {
        console.log(`🔧 [REAL STATE PRO FORMA] No configuration for state: ${state}`);
        return { total: 0, breakdown: {} };
      }

      // Get the correct lines for the method
      const lines = method === 'alternative' && stateConfig.alternative 
        ? stateConfig.alternative 
        : stateConfig.standard;
        
      const finalField = method === 'alternative' && stateConfig.altFinalField
        ? stateConfig.altFinalField
        : stateConfig.finalField;

      if (!lines) {
        console.log(`🔧 [REAL STATE PRO FORMA] No lines found for ${state} ${method}`);
        return { total: 0, breakdown: {} };
      }

      // Execute the real pro forma calculation
      const finalCredit = await this.executeProFormaCalculation(qreData, lines, finalField);
      
      console.log(`🔧 [REAL STATE PRO FORMA] ${state} final credit (${finalField}): $${finalCredit}`);
      
      const breakdown = {};
      breakdown[state] = finalCredit;
      
      return { 
        total: finalCredit, 
        breakdown 
      };
    } catch (error) {
      console.error(`🔧 [REAL STATE PRO FORMA] Error calculating ${state} credit:`, error);
      return { total: 0, breakdown: {} };
    }
  }

  /**
   * Execute the actual pro forma calculation logic
   */
  private static async executeProFormaCalculation(baseData: any, lines: any[], finalField: string): Promise<number> {
    try {
      // Initialize calculation data with base QRE data
      const calculationData = {
        ...baseData,
        // Add common field mappings
        wages: baseData.wages || 0,
        supplies: baseData.supplies || 0,
        contractResearch: baseData.contractResearch || 0,
        computerLeases: baseData.computerLeases || 0,
        avgGrossReceipts: baseData.avgGrossReceipts || 0,
        businessEntityType: baseData.businessEntityType || 'CORP',
      };

      console.log('🔧 [REAL STATE PRO FORMA] Starting calculation with data:', calculationData);

      // Execute each calculation line in order
      for (const line of lines) {
        if (line.calc && typeof line.calc === 'function') {
          try {
            const result = line.calc(calculationData);
            calculationData[line.field] = result;
            console.log(`🔧 [REAL STATE PRO FORMA] Line ${line.line} (${line.field}): $${result}`);
          } catch (calcError) {
            console.error(`🔧 [REAL STATE PRO FORMA] Error calculating line ${line.line}:`, calcError);
            calculationData[line.field] = 0;
          }
        } else if (line.defaultValue !== undefined) {
          calculationData[line.field] = line.defaultValue;
        } else if (line.editable && !calculationData[line.field]) {
          // Set default values for editable fields if not already set
          calculationData[line.field] = 0;
        }
      }

      // Extract the final credit value
      const finalCredit = calculationData[finalField] || 0;
      console.log(`🔧 [REAL STATE PRO FORMA] Final credit extracted from ${finalField}: $${finalCredit}`);
      
      return Math.max(finalCredit, 0);
    } catch (error) {
      console.error('🔧 [REAL STATE PRO FORMA] Error in executeProFormaCalculation:', error);
      return 0;
    }
  }

  /**
   * Get state credits for all states where business operates
   */
  static async getAllStateCreditsFromProForma(businessYearId: string, businessState?: string): Promise<{ total: number; breakdown: Record<string, number> }> {
    try {
      // Use provided business state or default to CA
      const primaryState = businessState || 'CA';
      console.log(`🔧 [REAL STATE PRO FORMA] Calculating REAL credits for primary state: ${primaryState}`);
      
      // Calculate using the REAL pro forma logic
      const stateCredit = await this.getStateCreditsFromProForma(businessYearId, primaryState, 'standard');
      
      console.log(`🔧 [REAL STATE PRO FORMA] Final result: $${stateCredit.total}`);
      
      return {
        total: stateCredit.total,
        breakdown: stateCredit.breakdown
      };
      
    } catch (error) {
      console.error('🔧 [REAL STATE PRO FORMA] Error in getAllStateCreditsFromProForma:', error);
      return { total: 0, breakdown: {} };
    }
  }

  /**
   * Get the final credit field name for a state and method
   */
  static getFinalCreditField(state: string, method: string = 'standard'): string {
    const stateConfig = this.STATE_LINES_MAP[state];
    if (!stateConfig) return '';
    
    return method === 'alternative' && stateConfig.altFinalField
      ? stateConfig.altFinalField
      : stateConfig.finalField;
  }
} 