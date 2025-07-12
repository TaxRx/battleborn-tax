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
      // First get the business_id from the business year
      const { data: businessYear, error: yearError } = await supabase
        .from('rd_business_years')
        .select('business_id')
        .eq('id', businessYearId)
        .single();

      if (yearError) throw yearError;

      const { data: contractors, error } = await supabase
        .from('rd_contractors')
        .select(`
          *,
          role:rd_roles (
            id,
            name,
            baseline_applied_percent
          ),
          year_data:rd_contractor_year_data (
            calculated_qre,
            applied_percent
          )
        `)
        .eq('business_id', businessYear.business_id);

      if (error) throw error;

      // For each contractor, sum applied_percentage from rd_contractor_subcomponents for the business year
      const contractorsWithQRE = await Promise.all((contractors || []).map(async (contractor) => {
        const baselineAppliedPercent = contractor.role?.baseline_applied_percent || 0;
        const yearData = contractor.year_data?.[0];

        // Fetch sum of applied_percentage from subcomponents
        const { data: subcomponents, error: subError } = await supabase
          .from('rd_contractor_subcomponents')
          .select('applied_percentage')
          .eq('contractor_id', contractor.id)
          .eq('business_year_id', businessYearId);
        if (subError) {
          console.error('Error fetching contractor subcomponents:', subError);
        }
        const appliedPercent = (subcomponents || []).reduce((sum, s) => sum + (s.applied_percentage || 0), 0);

        // Calculate QRE based on 65% wage and current applied percentage: wage × 0.65 × (applied_percentage / 100)
        const calculatedQRE = contractor.amount * 0.65 * (appliedPercent / 100);

        // Debug log
        console.log(`[ContractorManagementService] Contractor ${contractor.first_name} ${contractor.last_name}:`, {
          cost_amount: contractor.amount,
          applied_percent: appliedPercent,
          calculated_qre: calculatedQRE
        });
        
        return {
          ...contractor,
          calculated_qre: calculatedQRE,
          baseline_applied_percent: baselineAppliedPercent,
          applied_percentage: appliedPercent
        };
      }));

      return contractorsWithQRE;
    } catch (error) {
      console.error('Error fetching contractors:', error);
      throw error;
    }
  }

  // Add a new contractor
  static async addContractor(contractorData: QuickContractorEntry, businessId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_contractors')
        .insert({
          business_id: businessId,
          first_name: contractorData.first_name,
          last_name: contractorData.last_name,
          role_id: contractorData.role_id,
          is_owner: contractorData.is_owner,
          amount: parseFloat(contractorData.amount.replace(/[^0-9]/g, ''))
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding contractor:', error);
      throw error;
    }
  }

  // Update contractor
  static async updateContractor(contractorId: string, updates: Partial<RDContractor>): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_contractors')
        .update(updates)
        .eq('id', contractorId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating contractor:', error);
      throw error;
    }
  }

  // Delete contractor
  static async deleteContractor(contractorId: string): Promise<void> {
    try {
      console.log('🗑️ Starting contractor deletion process for contractor:', contractorId);
      
      // First, try to delete the contractor directly (this should work if foreign key constraints are properly set up)
      console.log('🗑️ Attempting direct contractor deletion with CASCADE...');
      const { error: directDeleteError } = await supabase
        .from('rd_contractors')
        .delete()
        .eq('id', contractorId);

      if (!directDeleteError) {
        console.log('✅ Contractor deleted successfully with CASCADE');
        return;
      }

      // If direct deletion fails due to foreign key constraints, manually delete related records
      console.log('⚠️ Direct deletion failed, manually deleting related records...');
      console.log('🗑️ Deleting contractor subcomponents for contractor:', contractorId);
      const { error: subError } = await supabase
        .from('rd_contractor_subcomponents')
        .delete()
        .eq('contractor_id', contractorId);

      if (subError) {
        console.error('❌ Error deleting contractor subcomponents:', subError);
        // Continue anyway, as some records might not exist
      }

      console.log('🗑️ Deleting contractor year data for contractor:', contractorId);
      const { error: yearError } = await supabase
        .from('rd_contractor_year_data')
        .delete()
        .eq('contractor_id', contractorId);

      if (yearError) {
        console.error('❌ Error deleting contractor year data:', yearError);
        // Continue anyway, as some records might not exist
      }

      // Now try to delete the contractor again
      console.log('🗑️ Deleting contractor after manual cleanup:', contractorId);
      const { error } = await supabase
        .from('rd_contractors')
        .delete()
        .eq('id', contractorId);

      if (error) {
        console.error('❌ Error deleting contractor after cleanup:', error);
        throw error;
      }
      
      console.log('✅ Contractor deleted successfully after manual cleanup');
    } catch (error) {
      console.error('Error deleting contractor:', error);
      throw error;
    }
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