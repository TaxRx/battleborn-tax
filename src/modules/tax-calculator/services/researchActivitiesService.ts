import { supabase } from '../../../lib/supabase';

export interface ResearchActivityData {
  id: string;
  name: string;
  applied_percent: number;
  practice_percent: number;
}

export interface ResearchActivity {
  id: string;
  title: string;
  focus_id: string;
  is_active: boolean;
  business_id?: string; // For business-specific activities
  default_roles: any;
  default_steps: any;
  time_percentage_locked?: boolean; // For time percentage locking
  created_at: string;
  updated_at: string;
  focus?: string;
  focus_name?: string; // Name of the associated focus
  category?: string;
  area?: string;
  research_activity?: string;
  subcomponent?: string;
  phase?: string;
  step?: string;
  deactivated_at?: string;
  deactivation_reason?: string;
}

export interface ResearchStep {
  id: string;
  research_activity_id: string;
  name: string;
  description: string;
  step_order: number;
  is_active: boolean;
  business_id?: string; // For business-specific steps (RLS support)
  default_time_percentage?: number; // For time allocation management
  created_at: string;
  updated_at: string;
  deactivated_at?: string;
  deactivation_reason?: string;
}

export interface ResearchSubcomponent {
  id: string;
  step_id: string;
  name: string;
  description: string;
  subcomponent_order: number;
  is_active: boolean;
  business_id?: string; // For business-specific subcomponents (RLS support)
  created_at: string;
  updated_at: string;
  hint?: string;
  general_description?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  uncertainties?: string;
  developmental_process?: string;
  primary_goal?: string;
  expected_outcome_type?: string;
  cpt_codes?: string;
  cdt_codes?: string;
  alternative_paths?: string;
  deactivated_at?: string;
  deactivation_reason?: string;
}

// Retry helper for handling transient network errors
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2, // Reduced from 3
  baseDelay: number = 50   // Reduced from 100ms
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isRetryableError = 
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('ERR_INSUFFICIENT_RESOURCES') ||
        error?.code === 'NETWORK_ERROR';
      
      if (attempt === maxRetries || !isRetryableError) {
        throw error;
      }
      
      // Reduced exponential backoff: 50ms, 100ms
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`[ResearchActivitiesService] Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry limit exceeded');
};

export class ResearchActivitiesService {
  // Get research activities with applied percentages for a business year
  static async getResearchActivitiesWithAppliedPercentages(businessYearId: string): Promise<ResearchActivityData[]> {
    try {
      console.log('[ResearchActivitiesService] 🔧 BASELINE FIX: Fetching research activities for businessYearId:', businessYearId);
      
      const { data, error } = await supabase
        .from('rd_selected_activities')
        .select(`
          id,
          activity_id,
          practice_percent,
          activity_title_snapshot,
          rd_research_activities!inner (
            id,
            title,
            is_active
          )
        `)
        .eq('business_year_id', businessYearId)
        .eq('rd_research_activities.is_active', true);

      if (error) {
        console.error('[ResearchActivitiesService] Error fetching selected activities:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('[ResearchActivitiesService] No selected activities found');
        return [];
      }

      // Calculate applied percentages for each activity - FIXED: Real-time calculation
      const activitiesWithAppliedPercentages: ResearchActivityData[] = [];
      
      for (const activity of data) {
        try {
          // FIXED: Get the total applied percentage for this activity from rd_selected_subcomponents
          // This ensures we always have the most current data, not cached values
          const { data: subcomponentsData, error: subError } = await supabase
            .from('rd_selected_subcomponents')
            .select('applied_percentage')
            .eq('business_year_id', businessYearId)
            .eq('research_activity_id', activity.activity_id);

          if (subError) {
            console.error('[ResearchActivitiesService] Error fetching subcomponents for activity:', activity.activity_id, subError);
            continue;
          }

          // Sum up all applied percentages for this activity - FIXED: Handle edge cases
          const totalAppliedPercent = subcomponentsData?.reduce((sum, sub) => {
            const appliedPercent = sub.applied_percentage || 0;
            return sum + appliedPercent;
          }, 0) || 0;

          console.log(`[ResearchActivitiesService] 🔧 BASELINE FIX: Activity ${activity.activity_title_snapshot || activity.rd_research_activities?.title}:`, {
            subcomponentsCount: subcomponentsData?.length || 0,
            totalAppliedPercent: totalAppliedPercent.toFixed(2),
            practicePercent: activity.practice_percent || 0
          });

          activitiesWithAppliedPercentages.push({
            id: activity.activity_id,
            name: activity.activity_title_snapshot || activity.rd_research_activities?.title || 'Unknown Activity',
            applied_percent: totalAppliedPercent,
            practice_percent: activity.practice_percent || 0
          });
        } catch (err) {
          console.error('[ResearchActivitiesService] Error processing activity:', activity.activity_id, err);
        }
      }

      console.log('[ResearchActivitiesService] 🔧 BASELINE FIX: Processed activities with real-time applied percentages:', 
        activitiesWithAppliedPercentages.map(a => `${a.name}: ${a.applied_percent.toFixed(1)}%`));
      
      return activitiesWithAppliedPercentages;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error in getResearchActivitiesWithAppliedPercentages:', error);
      return [];
    }
  }

  // Get QRE breakdown data for donut chart
  static async getQREDataForCharts(businessYearId: string): Promise<{
    employees: number;
    contractors: number;
    supplies: number;
  }> {
    try {
      console.log('[ResearchActivitiesService] Fetching QRE data for businessYearId:', businessYearId);
      
      // Get employee wages from rd_employee_subcomponents
      const { data: employeeData, error: employeeError } = await supabase
        .from('rd_employee_subcomponents')
        .select('applied_percentage')
        .eq('business_year_id', businessYearId);

      if (employeeError) {
        console.error('[ResearchActivitiesService] Error fetching employee data:', employeeError);
      }

      // Get contractor costs from rd_contractor_year_data
      const { data: contractorData, error: contractorError } = await supabase
        .from('rd_contractor_year_data')
        .select('cost_amount')
        .eq('business_year_id', businessYearId);

      if (contractorError) {
        console.error('[ResearchActivitiesService] Error fetching contractor data:', contractorError);
      }

      // Get supply costs from rd_supply_year_data
      const { data: supplyData, error: supplyError } = await supabase
        .from('rd_supply_year_data')
        .select('cost_amount')
        .eq('business_year_id', businessYearId);

      if (supplyError) {
        console.error('[ResearchActivitiesService] Error fetching supply data:', supplyError);
      }

      const employees = employeeData?.reduce((sum, emp) => sum + (emp.applied_percentage || 0), 0) || 0;
      const contractors = contractorData?.reduce((sum, cont) => sum + (cont.cost_amount || 0), 0) || 0;
      const supplies = supplyData?.reduce((sum, sup) => sum + (sup.cost_amount || 0), 0) || 0;

      console.log('[ResearchActivitiesService] QRE breakdown:', { employees, contractors, supplies });
      
      return { employees, contractors, supplies };
    } catch (error) {
      console.error('[ResearchActivitiesService] Error in getQREDataForCharts:', error);
      return { employees: 0, contractors, supplies: 0 };
    }
  }

  // =======================
  // ADMIN MANAGEMENT METHODS
  // =======================

  // Get all active research activities (for new client selections)
  static async getActiveResearchActivities(businessId?: string): Promise<ResearchActivity[]> {
    try {
      let query = supabase
        .from('rd_research_activities')
        .select(`
          *,
          rd_focuses!rd_research_activities_focus_id_fkey (
            name
          )
        `)
        .eq('is_active', true)
        .order('title');

      // Include business-specific activities if businessId provided
      if (businessId) {
        query = query.or(`business_id.is.null,business_id.eq.${businessId}`);
      } else {
        query = query.is('business_id', null);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to include focus_name at the top level
      const transformedData = (data || []).map((activity: any) => ({
        ...activity,
        focus_name: activity.rd_focuses?.name || null,
        // Remove the nested object to clean up the response
        rd_focuses: undefined
      }));
      
      return transformedData;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error fetching active activities:', error);
      throw error;
    }
  }

  // Get all research activities (including inactive, for admin management)
  static async getAllResearchActivities(businessId?: string): Promise<ResearchActivity[]> {
    try {
      let query = supabase
        .from('rd_research_activities')
        .select(`
          *,
          rd_focuses!rd_research_activities_focus_id_fkey (
            name
          )
        `)
        .order('title');

      // Filter by business if specified
      if (businessId) {
        query = query.or(`business_id.is.null,business_id.eq.${businessId}`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to include focus_name at the top level
      const transformedData = (data || []).map((activity: any) => ({
        ...activity,
        focus_name: activity.rd_focuses?.name || null,
        // Remove the nested object to clean up the response
        rd_focuses: undefined
      }));
      
      return transformedData;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error fetching all activities:', error);
      throw error;
    }
  }

  // Create new research activity
  static async createResearchActivity(activity: Omit<ResearchActivity, 'id' | 'created_at' | 'updated_at'>): Promise<ResearchActivity> {
    try {
      const { data, error } = await supabase
        .from('rd_research_activities')
        .insert({
          ...activity,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error creating activity:', error);
      throw error;
    }
  }

  // Update research activity
  static async updateResearchActivity(id: string, updates: Partial<ResearchActivity>): Promise<ResearchActivity> {
    try {
      const { data, error } = await supabase
        .from('rd_research_activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error updating activity:', error);
      throw error;
    }
  }

  // Deactivate research activity
  static async deactivateResearchActivity(id: string, reason: string): Promise<ResearchActivity> {
    try {
      const { data, error } = await supabase
        .from('rd_research_activities')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error deactivating activity:', error);
      throw error;
    }
  }

  // Reactivate (unarchive) research activity
  static async reactivateResearchActivity(id: string): Promise<ResearchActivity> {
    try {
      const { data, error } = await supabase
        .from('rd_research_activities')
        .update({
          is_active: true,
          deactivated_at: null,
          deactivation_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error reactivating activity:', error);
      throw error;
    }
  }

  // Archive activity and all its steps and subcomponents (cascade archive)
  static async archiveActivityWithCascade(id: string, reason: string): Promise<ResearchActivity> {
    try {
      console.log(`[ResearchActivitiesService] Archiving activity ${id} and all related steps/subcomponents`);
      
      // First get all steps for this activity
      const { data: steps, error: stepsError } = await supabase
        .from('rd_research_steps')
        .select('id')
        .eq('research_activity_id', id)
        .eq('is_active', true);

      if (stepsError) throw stepsError;

      // Archive all subcomponents for each step
      if (steps && steps.length > 0) {
        for (const step of steps) {
          const { error: subError } = await supabase
            .from('rd_research_subcomponents')
            .update({
              is_active: false,
              deactivated_at: new Date().toISOString(),
              deactivation_reason: 'Activity archived - cascaded from parent activity',
              updated_at: new Date().toISOString()
            })
            .eq('step_id', step.id)
            .eq('is_active', true);

          if (subError) {
            console.error('[ResearchActivitiesService] Error archiving subcomponents:', subError);
            throw subError;
          }
        }

        // Archive all steps
        const { error: stepArchiveError } = await supabase
          .from('rd_research_steps')
          .update({
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivation_reason: 'Activity archived - cascaded from parent activity',
            updated_at: new Date().toISOString()
          })
          .eq('research_activity_id', id)
          .eq('is_active', true);

        if (stepArchiveError) throw stepArchiveError;
      }

      // Finally archive the activity itself
      const { data, error } = await supabase
        .from('rd_research_activities')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`[ResearchActivitiesService] ✅ Successfully archived activity ${id} with cascade`);
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error archiving activity with cascade:', error);
      throw error;
    }
  }

  // Duplicate research activity (for versioning)
  static async duplicateResearchActivity(id: string, newTitle: string, businessId?: string): Promise<ResearchActivity> {
    try {
      // Get original activity
      const { data: original, error: fetchError } = await supabase
        .from('rd_research_activities')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicate
      const duplicate = {
        ...original,
        id: undefined,
        title: newTitle,
        business_id: businessId || original.business_id,
        is_active: true,
        created_at: undefined,
        updated_at: undefined,
        deactivated_at: null,
        deactivation_reason: null
      };

      const { data, error } = await supabase
        .from('rd_research_activities')
        .insert(duplicate)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error duplicating activity:', error);
      throw error;
    }
  }

  // Get research steps for activity
  static async getResearchSteps(activityId: string, activeOnly: boolean = true): Promise<ResearchStep[]> {
    try {
      let query = supabase
        .from('rd_research_steps')
        .select('*')
        .eq('research_activity_id', activityId)
        .order('step_order');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[ResearchActivitiesService] Error fetching research steps:', error);
      throw error;
    }
  }

  // Create research step
  static async createResearchStep(step: Omit<ResearchStep, 'id' | 'created_at' | 'updated_at'>): Promise<ResearchStep> {
    try {
      const { data, error } = await supabase
        .from('rd_research_steps')
        .insert({
          ...step,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error creating step:', error);
      throw error;
    }
  }

  // Update research step
  static async updateResearchStep(id: string, updates: Partial<ResearchStep>): Promise<ResearchStep> {
    try {
      // Filter out UI-only properties that don't exist in the database schema
      const { expanded, subcomponents, ...dbUpdates } = updates as any;
      
      const { data, error } = await supabase
        .from('rd_research_steps')
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error updating step:', error);
      throw error;
    }
  }

  // Update research step time percentage with retry logic
  static async updateResearchStepTimePercentage(stepId: string, percentage: number): Promise<ResearchStep> {
    console.log(`[ResearchActivitiesService] Updating time percentage for step ${stepId}: ${percentage}%`);
    
    return await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('rd_research_steps')
        .update({
          default_time_percentage: percentage,
          time_percentage_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', stepId)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`[ResearchActivitiesService] ✅ Successfully updated time percentage for step ${stepId}`);
      return data;
    });
  }

  // Deactivate research step
  static async deactivateResearchStep(id: string, reason: string): Promise<ResearchStep> {
    try {
      const { data, error } = await supabase
        .from('rd_research_steps')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error deactivating step:', error);
      throw error;
    }
  }

  // Reactivate (unarchive) research step
  static async reactivateResearchStep(id: string): Promise<ResearchStep> {
    try {
      const { data, error } = await supabase
        .from('rd_research_steps')
        .update({
          is_active: true,
          deactivated_at: null,
          deactivation_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error reactivating step:', error);
      throw error;
    }
  }

  // Archive research step and all its subcomponents (safer than permanent deletion)
  static async deleteResearchStep(id: string): Promise<void> {
    try {
      console.log(`[ResearchActivitiesService] Archiving step ${id} and all related subcomponents`);
      
      // First archive all subcomponents of this step
      const { error: subError } = await supabase
        .from('rd_research_subcomponents')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: 'Step deleted - archived with parent step',
          updated_at: new Date().toISOString()
        })
        .eq('step_id', id)
        .eq('is_active', true); // Only update active subcomponents

      if (subError) {
        console.error('[ResearchActivitiesService] Error archiving step subcomponents:', subError);
        throw subError;
      }

      // Then archive the step itself
      const { error } = await supabase
        .from('rd_research_steps')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: 'Step deleted via UI',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      console.log(`[ResearchActivitiesService] ✅ Successfully archived step ${id} and its subcomponents`);
    } catch (error) {
      console.error('[ResearchActivitiesService] Error archiving step:', error);
      throw error;
    }
  }

  // Permanent deletion method (for admin use only)
  static async permanentlyDeleteResearchStep(id: string): Promise<void> {
    try {
      console.log(`[ResearchActivitiesService] PERMANENTLY deleting step ${id} and all related subcomponents`);
      
      // First delete all subcomponents of this step
      const { error: subError } = await supabase
        .from('rd_research_subcomponents')
        .delete()
        .eq('step_id', id);

      if (subError) {
        console.error('[ResearchActivitiesService] Error deleting step subcomponents:', subError);
        throw subError;
      }

      // Then delete the step itself
      const { error } = await supabase
        .from('rd_research_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log(`[ResearchActivitiesService] ✅ Successfully permanently deleted step ${id}`);
    } catch (error) {
      console.error('[ResearchActivitiesService] Error permanently deleting step:', error);
      throw error;
    }
  }

  // Get research subcomponents for step with retry logic
  static async getResearchSubcomponents(stepId: string, activeOnly: boolean = true): Promise<ResearchSubcomponent[]> {
    return await retryWithBackoff(async () => {
      let query = supabase
        .from('rd_research_subcomponents')
        .select('*')
        .eq('step_id', stepId)
        .order('subcomponent_order');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    });
  }

  // Create research subcomponent
  static async createResearchSubcomponent(subcomponent: Omit<ResearchSubcomponent, 'id' | 'created_at' | 'updated_at'>): Promise<ResearchSubcomponent> {
    try {
      const { data, error } = await supabase
        .from('rd_research_subcomponents')
        .insert({
          ...subcomponent,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error creating subcomponent:', error);
      throw error;
    }
  }

  // Update research subcomponent
  static async updateResearchSubcomponent(id: string, updates: Partial<ResearchSubcomponent>): Promise<ResearchSubcomponent> {
    try {
      const { data, error } = await supabase
        .from('rd_research_subcomponents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error updating subcomponent:', error);
      throw error;
    }
  }

  // Deactivate research subcomponent
  static async deactivateResearchSubcomponent(id: string, reason: string): Promise<ResearchSubcomponent> {
    try {
      const { data, error } = await supabase
        .from('rd_research_subcomponents')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error deactivating subcomponent:', error);
      throw error;
    }
  }

  // Reactivate (unarchive) research subcomponent
  static async reactivateResearchSubcomponent(id: string): Promise<ResearchSubcomponent> {
    try {
      const { data, error } = await supabase
        .from('rd_research_subcomponents')
        .update({
          is_active: true,
          deactivated_at: null,
          deactivation_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error reactivating subcomponent:', error);
      throw error;
    }
  }



  // Save selection with snapshot data
  static async saveSelectedActivityWithSnapshot(
    businessYearId: string,
    activityId: string,
    practicePercent: number,
    selectedRoles: any,
    config: any
  ): Promise<void> {
    try {
      // Get activity details for snapshot
      const { data: activity, error: activityError } = await supabase
        .from('rd_research_activities')
        .select('title, category')
        .eq('id', activityId)
        .single();

      if (activityError) throw activityError;

      // Save with snapshot data
      const { error } = await supabase
        .from('rd_selected_activities')
        .upsert({
          business_year_id: businessYearId,
          activity_id: activityId,
          practice_percent: practicePercent,
          selected_roles: selectedRoles,
          config: config,
          activity_title_snapshot: activity.title,
          activity_category_snapshot: activity.category
        });

      if (error) throw error;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error saving selected activity with snapshot:', error);
      throw error;
    }
  }

  // Save selected subcomponent with snapshot data
  static async saveSelectedSubcomponentWithSnapshot(
    businessYearId: string,
    researchActivityId: string,
    stepId: string,
    subcomponentId: string,
    data: any
  ): Promise<void> {
    try {
      // Get subcomponent and step details for snapshot
      const { data: subcomponent, error: subError } = await supabase
        .from('rd_research_subcomponents')
        .select('name')
        .eq('id', subcomponentId)
        .single();

      const { data: step, error: stepError } = await supabase
        .from('rd_research_steps')
        .select('name')
        .eq('id', stepId)
        .single();

      if (subError) throw subError;
      if (stepError) throw stepError;

      // Save with snapshot data
      const { error } = await supabase
        .from('rd_selected_subcomponents')
        .upsert({
          ...data,
          business_year_id: businessYearId,
          research_activity_id: researchActivityId,
          step_id: stepId,
          subcomponent_id: subcomponentId,
          subcomponent_name_snapshot: subcomponent.name,
          step_name_snapshot: step.name
        });

      if (error) throw error;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error saving selected subcomponent with snapshot:', error);
      throw error;
    }
  }

  // Move subcomponent to a different step
  static async moveSubcomponentToStep(subcomponentId: string, targetStepId: string, reason: string = 'Moved via UI'): Promise<ResearchSubcomponent> {
    try {
      console.log(`[ResearchActivitiesService] Moving subcomponent ${subcomponentId} to step ${targetStepId}`);
      
      const { data, error } = await supabase
        .from('rd_research_subcomponents')
        .update({
          step_id: targetStepId,
          updated_at: new Date().toISOString()
        })
        .eq('id', subcomponentId)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`[ResearchActivitiesService] ✅ Successfully moved subcomponent ${subcomponentId} to step ${targetStepId}`);
      return data;
    } catch (error) {
      console.error('[ResearchActivitiesService] Error moving subcomponent:', error);
      throw error;
    }
  }
} 