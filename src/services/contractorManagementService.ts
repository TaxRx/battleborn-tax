import { supabase } from '../lib/supabase';
import { RDContractor } from '../types/researchDesign';

export interface ContractorWithExpenses extends RDContractor {
  calculated_qre?: number;
  baseline_applied_percent?: number;
  practice_percentage?: number;
  time_percentage?: number;
  applied_percentage?: number;
}

export interface QuickContractorEntry {
  first_name: string;
  last_name: string;
  amount: string;
  role_id: string;
  is_owner: boolean;
}

export class ContractorManagementService {
  // Get contractors for a business year
  static async getContractors(businessYearId: string): Promise<ContractorWithExpenses[]> {
    try {
      console.log(`🔒 ContractorManagementService - STRICT YEAR FILTERING for business_year_id: ${businessYearId}`);
      
      // CRITICAL FIX: Get contractors ONLY for the specific business year
      // This prevents cross-year data leakage
      // SCHEMA FIX: contractor_id references rd_businesses, not rd_contractors
      // CACHE BUST: Force recompilation after business_name → name fix
      const { data: contractorYearData, error } = await supabase
        .from('rd_contractor_year_data')
        .select(`
          *,
          contractor:rd_businesses!contractor_id (
            id,
            name,
            ein
          )
        `)
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error(`❌ Error fetching contractor year data for ${businessYearId}:`, error);
        throw error;
      }

      console.log(`✅ Found ${contractorYearData?.length || 0} contractors for year ${businessYearId}`);

      // Process contractors with STRICT year filtering
      const contractorsWithQRE = await Promise.all((contractorYearData || []).map(async (yearRecord) => {
        const contractor = yearRecord.contractor;
        if (!contractor) {
          console.warn('⚠️ Contractor year record missing contractor data:', yearRecord);
          return null;
        }

        // Use stored QRE and applied percentage from year data (already year-specific)
        const calculatedQRE = yearRecord.calculated_qre || 0;
        const appliedPercent = yearRecord.applied_percent || 0;

        // Fetch sum of applied_percentage from subcomponents for VERIFICATION (year-specific)
        const { data: subcomponents, error: subError } = await supabase
          .from('rd_contractor_subcomponents')
          .select('applied_percentage')
          .eq('contractor_id', contractor.id)
          .eq('business_year_id', businessYearId);
          
        if (subError) {
          console.error('Error fetching contractor subcomponents:', subError);
        }
        
        const subcomponentAppliedPercent = (subcomponents || []).reduce((sum, s) => sum + (s.applied_percentage || 0), 0);

        // Use subcomponent calculation if no stored data
        const finalAppliedPercent = appliedPercent > 0 ? appliedPercent : subcomponentAppliedPercent;
        let finalCalculatedQRE = calculatedQRE;
        
        if (finalCalculatedQRE === 0 && finalAppliedPercent > 0) {
          // Calculate QRE based on 65% wage: cost × 0.65 × (applied_percentage / 100)
          finalCalculatedQRE = (yearRecord.cost_amount || 0) * 0.65 * (finalAppliedPercent / 100);
        }

        // Debug contractor data for year isolation
        
        return {
          ...contractor,
          ...yearRecord, // Include year-specific data
          calculated_qre: finalCalculatedQRE,
          applied_percentage: finalAppliedPercent,
          cost_amount: yearRecord.cost_amount
        };
      }));

      // Filter out null entries
      const validContractors = contractorsWithQRE.filter(c => c !== null);

      console.log(`🔒 ContractorManagementService - ISOLATED RESULT: ${validContractors.length} contractors for year ${businessYearId}`);
      return validContractors;
    } catch (error) {
      console.error('Error fetching contractors:', error);
      throw error;
    }
  }

  // Add a new contractor - DISABLED: Schema updated to use rd_contractor_year_data with rd_businesses
  static async addContractor(contractorData: QuickContractorEntry, businessId: string): Promise<void> {
    console.warn('⚠️ addContractor method disabled - schema migration in progress');
    // TODO: Implement contractor creation using new rd_contractor_year_data + rd_businesses schema
    return Promise.resolve();
  }

  // Update contractor - DISABLED: Schema updated to use rd_contractor_year_data with rd_businesses
  static async updateContractor(contractorId: string, updates: Partial<RDContractor>): Promise<void> {
    console.warn('⚠️ updateContractor method disabled - schema migration in progress');
    // TODO: Implement contractor update using new rd_contractor_year_data + rd_businesses schema
    return Promise.resolve();
  }

  // Delete contractor - DISABLED: Schema updated to use rd_contractor_year_data with rd_businesses
  static async deleteContractor(contractorId: string): Promise<void> {
    console.warn('⚠️ deleteContractor method disabled - schema migration in progress');
    // TODO: Implement contractor deletion using new rd_contractor_year_data + rd_businesses schema
    return Promise.resolve();
  }

  // Initialize contractor subcomponent data
  static async initializeContractorSubcomponentData({
    contractorId,
    roleId,
    businessYearId
  }: {
    contractorId: string;
    roleId: string;
    businessYearId: string;
  }): Promise<void> {
    try {
      // Get selected activities for this role and business year
      const { data: selectedActivities, error: activitiesError } = await supabase
        .from('rd_selected_activities')
        .select('activity_id, practice_percent')
        .eq('business_year_id', businessYearId)
        .contains('selected_roles', JSON.stringify([roleId]));

      if (activitiesError) throw activitiesError;

      // Get selected subcomponents for this role and business year
      const { data: subcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          subcomponent_id,
          research_activity_id,
          time_percentage,
          applied_percentage,
          year_percentage,
          frequency_percentage
        `)
        .eq('business_year_id', businessYearId)
        .contains('selected_roles', JSON.stringify([roleId]));

      if (subError) throw subError;

      // Get role baseline applied percent
      const { data: role, error: roleError } = await supabase
        .from('rd_roles')
        .select('baseline_applied_percent')
        .eq('id', roleId)
        .single();

      if (roleError) throw roleError;

      const baselineAppliedPercent = role?.baseline_applied_percent || 0;

      // Create contractor subcomponent records with proper baseline values
      const contractorSubcomponents = (subcomponents || []).map(sub => {
        // Find the activity this subcomponent belongs to to get practice percentage
        const selectedActivity = selectedActivities?.find(act => act.activity_id === sub.research_activity_id);
        const practicePercentage = selectedActivity?.practice_percent || 0;
        
        // Set baseline values to the original subcomponent values (these should never change)
        const baselineAppliedPercentForSub = (sub.applied_percentage || 0);
        const baselineTimePercentage = (sub.time_percentage || 0);
        const baselinePracticePercentage = practicePercentage;
        
        return {
          contractor_id: contractorId,
          subcomponent_id: sub.subcomponent_id,
          business_year_id: businessYearId,
          time_percentage: baselineTimePercentage, // Start with baseline
          applied_percentage: baselineAppliedPercentForSub, // Start with baseline
          year_percentage: sub.year_percentage || 0,
          frequency_percentage: sub.frequency_percentage || 0,
          practice_percentage: baselinePracticePercentage, // Start with baseline
          is_included: true,
          baseline_applied_percent: baselineAppliedPercentForSub,
          baseline_time_percentage: baselineTimePercentage,
          baseline_practice_percentage: baselinePracticePercentage
        };
      });

      if (contractorSubcomponents.length > 0) {
        const { error } = await supabase
          .from('rd_contractor_subcomponents')
          .insert(contractorSubcomponents);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error initializing contractor subcomponent data:', error);
      throw error;
    }
  }

  // Recalculate QRE for all contractors
  static async recalculateAllContractorQRE(businessYearId: string): Promise<void> {
    try {
      const contractors = await this.getContractors(businessYearId);
      
      for (const contractor of contractors) {
        // The getContractors method now calculates the correct applied percentage
        // and QRE, so we don't need to recalculate here
        console.log(`Contractor ${contractor.first_name} ${contractor.last_name}: Applied ${contractor.applied_percentage}%, QRE ${contractor.calculated_qre}`);
      }
    } catch (error) {
      console.error('Error recalculating contractor QRE:', error);
      throw error;
    }
  }
} 