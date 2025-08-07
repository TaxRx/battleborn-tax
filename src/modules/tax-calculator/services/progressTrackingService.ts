import { supabase } from '../../../lib/supabase';

export interface ProgressMilestone {
  id: string;
  business_year_id: string;
  milestone_type: MilestoneType;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  engagement_contract_expiration?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type MilestoneType = 
  | 'engaged'
  | 'tax_returns_received'
  | 'wages_received' 
  | 'support_documents_received'
  | 'scoping_call'
  | 'data_entry'
  | 'qc_review'
  | 'jurat'
  | 'completed';

export interface ProgressDashboardRow {
  business_id: string;
  business_name: string;
  client_id: string;
  business_start_year: number;
  business_year_id: string;
  year: number;
  
  // Milestone completion status
  engaged_completed: boolean;
  engaged_completed_at?: string;
  engagement_expiration?: string;
  
  tax_returns_completed: boolean;
  tax_returns_completed_at?: string;
  
  wages_completed: boolean;
  wages_completed_at?: string;
  
  support_docs_completed: boolean;
  support_docs_completed_at?: string;
  
  scoping_call_completed: boolean;
  scoping_call_completed_at?: string;
  
  data_entry_completed: boolean;
  data_entry_completed_at?: string;
  
  qc_review_completed: boolean;
  qc_review_completed_at?: string;
  
  jurat_completed: boolean;
  jurat_completed_at?: string;
  
  project_completed: boolean;
  project_completed_at?: string;
  
  progress_percentage: number;
}

export interface MilestoneUpdateData {
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  engagement_contract_expiration?: string;
  notes?: string;
}

export class ProgressTrackingService {
  /**
   * Get progress dashboard data for all businesses in the system
   * Automatically filters to current year + previous 7 years based on business start year
   */
  static async getProgressDashboard(): Promise<ProgressDashboardRow[]> {
    try {
      console.log('📊 [ProgressTrackingService] Fetching progress dashboard data');
      
      const { data, error } = await supabase
        .from('rd_progress_dashboard')
        .select('*')
        .order('business_name', { ascending: true })
        .order('year', { ascending: false });

      if (error) {
        console.error('❌ Error fetching progress dashboard:', error);
        throw error;
      }

      // Filter to current year + previous 7 years based on business start year
      const currentYear = new Date().getFullYear();
      const filteredData = data.filter(row => {
        const businessAge = currentYear - row.business_start_year;
        const yearsToShow = Math.min(8, businessAge + 1); // Current + up to 7 previous
        const oldestYearToShow = currentYear - yearsToShow + 1;
        return row.year >= oldestYearToShow;
      });

      console.log('✅ [ProgressTrackingService] Progress dashboard data fetched:', {
        totalRows: data.length,
        filteredRows: filteredData.length,
        currentYear
      });

      return filteredData;
    } catch (error) {
      console.error('❌ [ProgressTrackingService] Error in getProgressDashboard:', error);
      throw error;
    }
  }

  /**
   * Get milestones for a specific business year
   */
  static async getMilestones(businessYearId: string): Promise<ProgressMilestone[]> {
    try {
      const { data, error } = await supabase
        .from('rd_progress_milestones')
        .select('*')
        .eq('business_year_id', businessYearId)
        .order('milestone_type');

      if (error) {
        console.error('❌ Error fetching milestones:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ [ProgressTrackingService] Error in getMilestones:', error);
      throw error;
    }
  }

  /**
   * Update or create a milestone
   */
  static async updateMilestone(
    businessYearId: string,
    milestoneType: MilestoneType,
    updateData: MilestoneUpdateData,
    userId?: string
  ): Promise<ProgressMilestone> {
    try {
      console.log('📝 [ProgressTrackingService] Updating milestone:', {
        businessYearId,
        milestoneType,
        updateData,
        userId
      });

      const milestoneData = {
        business_year_id: businessYearId,
        milestone_type: milestoneType,
        ...updateData,
        completed_at: updateData.is_completed ? (updateData.completed_at || new Date().toISOString()) : null,
        completed_by: updateData.is_completed ? (updateData.completed_by || userId) : null
      };

      const { data, error } = await supabase
        .from('rd_progress_milestones')
        .upsert(milestoneData, {
          onConflict: 'business_year_id,milestone_type'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating milestone:', error);
        throw error;
      }

      console.log('✅ [ProgressTrackingService] Milestone updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ [ProgressTrackingService] Error in updateMilestone:', error);
      throw error;
    }
  }

  /**
   * Mark milestone as completed
   */
  static async completeMilestone(
    businessYearId: string,
    milestoneType: MilestoneType,
    userId?: string,
    notes?: string
  ): Promise<ProgressMilestone> {
    return this.updateMilestone(businessYearId, milestoneType, {
      is_completed: true,
      completed_at: new Date().toISOString(),
      completed_by: userId,
      notes
    }, userId);
  }

  /**
   * Mark milestone as incomplete
   */
  static async uncompleteMilestone(
    businessYearId: string,
    milestoneType: MilestoneType
  ): Promise<ProgressMilestone> {
    return this.updateMilestone(businessYearId, milestoneType, {
      is_completed: false,
      completed_at: undefined,
      completed_by: undefined
    });
  }

  /**
   * Set engagement contract expiration date
   */
  static async setEngagementExpiration(
    businessYearId: string,
    expirationDate: string,
    userId?: string
  ): Promise<ProgressMilestone> {
    return this.updateMilestone(businessYearId, 'engaged', {
      is_completed: true, // Engagement is completed when contract is signed
      engagement_contract_expiration: expirationDate
    }, userId);
  }

  /**
   * AUTO-SYNC: Update data_entry milestone based on wizard expenses step lock
   */
  static async syncDataEntryMilestone(businessYearId: string, isLocked: boolean, userId?: string): Promise<void> {
    try {
      console.log('🔗 [ProgressTrackingService] Syncing data_entry milestone:', {
        businessYearId,
        isLocked,
        userId
      });

      await this.updateMilestone(businessYearId, 'data_entry', {
        is_completed: isLocked,
        completed_at: isLocked ? new Date().toISOString() : undefined,
        completed_by: isLocked ? userId : undefined,
        notes: isLocked ? 'Automatically completed when expenses step was locked' : undefined
      }, userId);

      console.log('✅ [ProgressTrackingService] Data entry milestone synced');
    } catch (error) {
      console.error('❌ [ProgressTrackingService] Error syncing data entry milestone:', error);
      // Don't throw - this shouldn't break the wizard flow
    }
  }

  /**
   * AUTO-SYNC: Update jurat milestone based on client portal signature
   */
  static async syncJuratMilestone(businessYearId: string, hasSigned: boolean): Promise<void> {
    try {
      console.log('🔗 [ProgressTrackingService] Syncing jurat milestone:', {
        businessYearId,
        hasSigned
      });

      await this.updateMilestone(businessYearId, 'jurat', {
        is_completed: hasSigned,
        completed_at: hasSigned ? new Date().toISOString() : undefined,
        notes: hasSigned ? 'Automatically completed when client signed jurat in portal' : undefined
      });

      console.log('✅ [ProgressTrackingService] Jurat milestone synced');
    } catch (error) {
      console.error('❌ [ProgressTrackingService] Error syncing jurat milestone:', error);
      // Don't throw - this shouldn't break the signature flow
    }
  }

  /**
   * Get milestone completion status for a specific milestone type
   */
  static async getMilestoneStatus(
    businessYearId: string,
    milestoneType: MilestoneType
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('rd_progress_milestones')
        .select('is_completed')
        .eq('business_year_id', businessYearId)
        .eq('milestone_type', milestoneType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking milestone status:', error);
        throw error;
      }

      return data?.is_completed || false;
    } catch (error) {
      console.error('❌ [ProgressTrackingService] Error in getMilestoneStatus:', error);
      return false;
    }
  }

  /**
   * Get all milestone types for reference
   */
  static getMilestoneTypes(): { type: MilestoneType; label: string; description: string; isAuto: boolean }[] {
    return [
      {
        type: 'engaged',
        label: 'Engaged',
        description: 'Engagement contract signed with expiration date',
        isAuto: false
      },
      {
        type: 'tax_returns_received',
        label: 'Tax Returns',
        description: 'Client tax returns received',
        isAuto: false
      },
      {
        type: 'wages_received',
        label: 'Wages',
        description: 'Employee wage data received',
        isAuto: false
      },
      {
        type: 'support_documents_received',
        label: 'Support Docs',
        description: 'Supporting documents received',
        isAuto: false
      },
      {
        type: 'scoping_call',
        label: 'Scoping Call',
        description: 'Scoping call completed',
        isAuto: false
      },
      {
        type: 'data_entry',
        label: 'Data Entry',
        description: 'Expenses step locked in wizard',
        isAuto: true
      },
      {
        type: 'qc_review',
        label: 'QC Review',
        description: 'Quality control review completed',
        isAuto: false
      },
      {
        type: 'jurat',
        label: 'Jurat',
        description: 'Client portal jurat signature completed',
        isAuto: true
      },
      {
        type: 'completed',
        label: 'Completed',
        description: 'All work completed',
        isAuto: false
      }
    ];
  }
}

export default ProgressTrackingService;