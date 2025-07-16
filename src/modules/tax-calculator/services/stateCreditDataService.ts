// Service to fetch and normalize data for state credit pro formas
import { supabase } from '../../../lib/supabase';

export interface StateCreditBaseData {
  wages: number;
  supplies: number;
  contractResearch: number;
  basePeriodAmount: number;
  basicResearchPayments: number;
  avgGrossReceipts: number; // Add average gross receipts
  computerLeases: number; // Add computer leases for completeness
  businessEntityType?: 'LLC' | 'S-Corp' | 'C-Corp' | 'Partnership' | 'Sole-Proprietor' | 'Other'; // Add business entity type for 280C
  
  // Alaska specific fields
  federalGeneralBusinessCredit?: number;
  federalInvestmentCredit?: number;
  otherFederalCredits?: number;
  passiveActivityCredit?: number;
  apportionmentFactor?: number;
  
  // Arizona specific fields
  hasQualifiedResearchExpenses?: number;
  isRefundable?: number;
  isPartnershipPassThrough?: number;
  qualifiedOrgBasePeriod?: number;
  
  // Add more as needed for other states
}

// Enhanced interfaces for alternative calculation methods and validation rules
export interface StateValidationRule {
  type: 'max_credit' | 'carryforward_limit' | 'apportionment_requirement' | 'entity_type_restriction' | 'gross_receipts_threshold';
  value: number;
  message: string;
  applies_to?: 'standard' | 'alternative' | 'both';
  condition?: (data: StateCreditBaseData) => boolean;
}

export interface AlternativeCalculationMethod {
  name: string;
  description: string;
  method: 'simplified' | 'gross_receipts_based' | 'percentage_of_qre' | 'fixed_amount' | 'custom';
  lines: StateProFormaLine[];
  validation_rules: StateValidationRule[];
  is_available: (data: StateCreditBaseData) => boolean;
}

export interface StateProFormaLine {
  line: string;
  label: string;
  field: string;
  editable: boolean;
  method: 'standard' | 'alternative';
  calc?: (data: StateCreditBaseData) => number;
  defaultValue?: number;
  type?: 'percentage' | 'currency' | 'number';
  line_type: 'input' | 'calculated' | 'total';
  sort_order: number;
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
    message?: string;
  };
}

export interface StateProFormaConfig {
  state: string;
  name: string;
  forms: {
    standard: {
      name: string;
      method: 'standard';
      lines: StateProFormaLine[];
    };
    alternative?: AlternativeCalculationMethod;
  };
  notes: string[];
  form_reference: string;
  credit_rate: number;
  max_fixed_base_percentage?: number;
  validation_rules: StateValidationRule[];
  alternative_methods?: AlternativeCalculationMethod[];
  carryforward_years?: number;
  max_credit_percentage?: number;
  apportionment_required?: boolean;
  entity_type_restrictions?: string[];
  gross_receipts_threshold?: number;
}

export interface StateProFormaData {
  business_year_id: string;
  state_code: string;
  method: 'standard' | 'alternative';
  data: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

// Interface matching SectionGQREEntry for consistency
export interface StateCreditQREEntry {
  activity_id: string;
  activity_title: string;
  subcomponent_id: string;
  subcomponent_name: string;
  step_id: string;
  step_name: string;
  category: 'Employee' | 'Contractor' | 'Supply';
  name: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  annual_cost: number;
  applied_percentage: number;
  calculated_qre: number;
  is_owner: boolean;
}

export class StateCreditDataService {
  
  // Get all QRE data for state credits using the same approach as Section G
  static async getQREDataForStateCredits(businessYearId: string): Promise<StateCreditQREEntry[]> {
    try {
      console.log('📊 StateCreditDataService - Starting QRE data gathering for business year:', businessYearId);
      
      // First, get the business_id from the business_year_id
      const { data: businessYear, error: businessYearError } = await supabase
        .from('rd_business_years')
        .select('business_id, year')
        .eq('id', businessYearId)
        .single();

      if (businessYearError) {
        console.error('❌ Error fetching business year:', businessYearError);
        throw businessYearError;
      }

      const businessId = businessYear.business_id;
      console.log('📊 Using business_id:', businessId);
      
      // Get all selected subcomponents for this business year
      const { data: subcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          *,
          research_activity:rd_research_activities (
            id,
            title
          ),
          step:rd_research_steps (
            id,
            name
          ),
          subcomponent:rd_research_subcomponents (
            id,
            name
          )
        `)
        .eq('business_year_id', businessYearId);

      if (subError) {
        console.error('❌ Error fetching subcomponents:', subError);
        throw subError;
      }

      // Get all employees for this business
      const { data: employees, error: employeesError } = await supabase
        .from('rd_employees')
        .select(`
          *,
          role:rd_roles (
            id,
            name
          ),
          subcomponents:rd_employee_subcomponents (
            subcomponent_id,
            business_year_id,
            applied_percentage,
            time_percentage,
            practice_percentage,
            baseline_applied_percent,
            baseline_practice_percentage,
            baseline_time_percentage
          )
        `)
        .eq('business_id', businessId);

      if (employeesError) {
        console.error('❌ Error fetching employees:', employeesError);
        throw employeesError;
      }

      // Get all contractors for this business
      const { data: contractors, error: contractorsError } = await supabase
        .from('rd_contractors')
        .select(`
          *,
          role:rd_roles (
            id,
            name
          ),
          subcomponents:rd_contractor_subcomponents (
            subcomponent_id,
            business_year_id,
            applied_percentage,
            time_percentage,
            practice_percentage,
            baseline_applied_percent,
            baseline_practice_percentage,
            baseline_time_percentage
          )
        `)
        .eq('business_id', businessId);

      if (contractorsError) {
        console.error('❌ Error fetching contractors:', contractorsError);
        throw contractorsError;
      }

      // Get all supplies for this business
      const { data: supplies, error: suppliesError } = await supabase
        .from('rd_supplies')
        .select(`
          *,
          subcomponents:rd_supply_subcomponents (
            subcomponent_id,
            business_year_id,
            applied_percentage,
            amount_applied,
            is_included
          )
        `)
        .eq('business_id', businessId);

      if (suppliesError) {
        console.error('❌ Error fetching supplies:', suppliesError);
        throw suppliesError;
      }

      console.log('📊 State Credit QRE Data:', {
        subcomponents: subcomponents?.length || 0,
        employees: employees?.length || 0,
        contractors: contractors?.length || 0,
        supplies: supplies?.length || 0
      });

      const qreEntries: StateCreditQREEntry[] = [];

      // Process each subcomponent
      for (const subcomponent of subcomponents || []) {
        const subcomponentName = subcomponent.subcomponent?.name || 'Unknown Subcomponent';
        const researchActivityName = subcomponent.research_activity?.title || 'Unknown Activity';
        const stepName = subcomponent.step?.name || 'Unknown Step';
        const activityId = subcomponent.research_activity?.id || '';

        console.log(`🔍 [StateCreditDataService] Processing subcomponent: ${subcomponentName} for activity: ${researchActivityName}`);

        // Add employee entries for this subcomponent
        for (const employee of employees || []) {
          const employeeSubcomponent = employee.subcomponents?.find(
            sub => sub.subcomponent_id === subcomponent.subcomponent_id && 
                   sub.business_year_id === businessYearId
          );

          if (employeeSubcomponent) {
            const annualWage = employee.annual_wage || 0;
            const appliedDollarAmount = Math.round((annualWage * (employeeSubcomponent.applied_percentage || 0)) / 100);
            const calculatedQRE = appliedDollarAmount;

            console.log(`🔍 [StateCreditDataService] Employee ${employee.first_name} ${employee.last_name}:`, {
              role: employee.role?.name,
              is_owner: employee.is_owner,
              annual_wage: annualWage,
              applied_percentage: employeeSubcomponent.applied_percentage,
              calculated_qre: calculatedQRE
            });

            qreEntries.push({
              activity_id: activityId,
              activity_title: researchActivityName,
              subcomponent_id: subcomponent.subcomponent_id,
              subcomponent_name: subcomponentName,
              step_id: subcomponent.step_id,
              step_name: stepName,
              category: 'Employee',
              name: `${employee.first_name} ${employee.last_name}`,
              first_name: employee.first_name,
              last_name: employee.last_name,
              role: employee.role?.name,
              annual_cost: annualWage,
              applied_percentage: employeeSubcomponent.applied_percentage || 0,
              calculated_qre: calculatedQRE,
              is_owner: employee.is_owner || false
            });
          }
        }

        // Add contractor entries for this subcomponent
        for (const contractor of contractors || []) {
          const contractorSubcomponent = contractor.subcomponents?.find(
            sub => sub.subcomponent_id === subcomponent.subcomponent_id && 
                   sub.business_year_id === businessYearId
          );

          if (contractorSubcomponent) {
            const annualCost = contractor.annual_cost || 0;
            const appliedDollarAmount = Math.round((annualCost * (contractorSubcomponent.applied_percentage || 0)) / 100);
            const calculatedQRE = appliedDollarAmount;

            console.log(`🔍 [StateCreditDataService] Contractor ${contractor.name}:`, {
              role: contractor.role?.name,
              annual_cost: annualCost,
              applied_percentage: contractorSubcomponent.applied_percentage,
              calculated_qre: calculatedQRE
            });

            qreEntries.push({
              activity_id: activityId,
              activity_title: researchActivityName,
              subcomponent_id: subcomponent.subcomponent_id,
              subcomponent_name: subcomponentName,
              step_id: subcomponent.step_id,
              step_name: stepName,
              category: 'Contractor',
              name: contractor.name,
              role: contractor.role?.name,
              annual_cost: annualCost,
              applied_percentage: contractorSubcomponent.applied_percentage || 0,
              calculated_qre: calculatedQRE,
              is_owner: false
            });
          }
        }

        // Add supply entries for this subcomponent
        for (const supply of supplies || []) {
          const supplySubcomponent = supply.subcomponents?.find(
            sub => sub.subcomponent_id === subcomponent.subcomponent_id && 
                   sub.business_year_id === businessYearId
          );

          if (supplySubcomponent && supplySubcomponent.is_included) {
            const annualCost = supply.annual_cost || 0;
            const appliedDollarAmount = Math.round((annualCost * (supplySubcomponent.applied_percentage || 0)) / 100);
            const calculatedQRE = appliedDollarAmount;

            console.log(`🔍 [StateCreditDataService] Supply ${supply.name}:`, {
              annual_cost: annualCost,
              applied_percentage: supplySubcomponent.applied_percentage,
              calculated_qre: calculatedQRE
            });

            qreEntries.push({
              activity_id: activityId,
              activity_title: researchActivityName,
              subcomponent_id: subcomponent.subcomponent_id,
              subcomponent_name: subcomponentName,
              step_id: subcomponent.step_id,
              step_name: stepName,
              category: 'Supply',
              name: supply.name,
              annual_cost: annualCost,
              applied_percentage: supplySubcomponent.applied_percentage || 0,
              calculated_qre: calculatedQRE,
              is_owner: false
            });
          }
        }
      }

      console.log('📊 StateCreditDataService - Total QRE entries:', qreEntries.length);
      return qreEntries;

    } catch (error) {
      console.error('❌ Error in getQREDataForStateCredits:', error);
      throw error;
    }
  }

  // Get aggregated QRE data for state credits
  static async getAggregatedQREData(businessYearId: string): Promise<StateCreditBaseData> {
    try {
      const qreEntries = await this.getQREDataForStateCredits(businessYearId);
      
      // Aggregate by category
      const wages = qreEntries
        .filter(entry => entry.category === 'Employee')
        .reduce((sum, entry) => sum + (entry.calculated_qre || 0), 0);
      
      const supplies = qreEntries
        .filter(entry => entry.category === 'Supply')
        .reduce((sum, entry) => sum + (entry.calculated_qre || 0), 0);
      
      const contractResearch = qreEntries
        .filter(entry => entry.category === 'Contractor')
        .reduce((sum, entry) => sum + (entry.calculated_qre || 0), 0);

      // Get business year info for historical data calculation
      const { data: businessYear, error: businessYearError } = await supabase
        .from('rd_business_years')
        .select('business_id, year')
        .eq('id', businessYearId)
        .single();

      if (businessYearError) {
        console.error('❌ Error fetching business year for historical data:', businessYearError);
        throw businessYearError;
      }

      // Get business entity type for 280C calculations
      const { data: business, error: businessError } = await supabase
        .from('rd_businesses')
        .select('entity_type')
        .eq('id', businessYear.business_id)
        .single();

      if (businessError) {
        console.error('❌ Error fetching business entity type:', businessError);
        // Don't throw, just use undefined for entity type
      }

      // Get historical data for average gross receipts calculation (like federal form)
      const { data: historicalData, error: historicalError } = await supabase
        .from('rd_business_years')
        .select('year, gross_receipts')
        .eq('business_id', businessYear.business_id)
        .lt('year', businessYear.year) // Only prior years
        .order('year', { ascending: false })
        .limit(3); // Get exactly 3 most recent prior years

      if (historicalError) {
        console.error('❌ Error fetching historical data:', historicalError);
        // Don't throw, just use 0 for avg gross receipts
      }

      // Calculate average gross receipts from historical data (like federal form)
      // Use up to 3 most recent years, or fewer if not available
      const avgGrossReceipts = historicalData && historicalData.length > 0
        ? Math.round(historicalData.reduce((sum, year) => sum + (year.gross_receipts || 0), 0) / historicalData.length)
        : 0;

      console.log('📊 State Credit Historical Data:', {
        businessYear: businessYear.year,
        historicalYears: historicalData?.map(y => y.year) || [],
        avgGrossReceipts,
        businessEntityType: business?.entity_type
      });

      return {
        wages: Math.round(wages), // Round to nearest dollar
        supplies: Math.round(supplies), // Round to nearest dollar
        contractResearch: Math.round(contractResearch), // Round to nearest dollar
        computerLeases: 0, // TODO: Add computer leases when implemented
        basePeriodAmount: 0, // TODO: Calculate from historical data
        basicResearchPayments: 0, // TODO: Calculate from historical data
        avgGrossReceipts: Math.round(avgGrossReceipts), // Round to nearest dollar
        businessEntityType: business?.entity_type, // Include business entity type for 280C
      };
    } catch (error) {
      console.error('Error getting aggregated QRE data:', error);
      return {
        wages: 0,
        supplies: 0,
        contractResearch: 0,
        computerLeases: 0,
        basePeriodAmount: 0,
        basicResearchPayments: 0,
        avgGrossReceipts: 0,
      };
    }
  }
}

export async function getStateCreditBaseData(businessYearId: string): Promise<StateCreditBaseData> {
  return StateCreditDataService.getAggregatedQREData(businessYearId);
}

export async function saveStateProFormaData(
  businessYearId: string,
  stateCode: string,
  method: 'standard' | 'alternative',
  data: Record<string, number>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('rd_state_proforma_data')
      .upsert({
        business_year_id: businessYearId,
        state_code: stateCode.toUpperCase(),
        method,
        data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'business_year_id,state_code,method'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving state pro forma data:', error);
    throw error;
  }
}

export async function loadStateProFormaData(
  businessYearId: string,
  stateCode: string,
  method: 'standard' | 'alternative'
): Promise<Record<string, number> | null> {
  try {
    const { data, error } = await supabase
      .from('rd_state_proforma_data')
      .select('data')
      .eq('business_year_id', businessYearId)
      .eq('state_code', stateCode.toUpperCase())
      .eq('method', method)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    
    return data?.data || null;
  } catch (error) {
    console.error('Error loading state pro forma data:', error);
    return null;
  }
} 