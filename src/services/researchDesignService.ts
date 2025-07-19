import { supabase } from '../lib/supabase';
import {
  ResearchStep,
  ResearchSubcomponent,
  SelectedStep,
  SelectedSubcomponent,
  ResearchActivityWithSteps,
  StepWithSubcomponents
} from '../types/researchDesign';

export class ResearchDesignService {
  // Fetch steps for a specific research activity from rd_research_steps
  static async getStepsForActivity(activityId: string): Promise<ResearchStep[]> {
    console.log('ResearchDesignService: Fetching steps for activity:', activityId);
    
    const { data: steps, error } = await supabase
      .from('rd_research_steps')
      .select('*')
      .eq('research_activity_id', activityId);

    console.log('ResearchDesignService: Steps query result:', { steps, error });

    if (error) {
      console.error('Error fetching steps:', error);
      return [];
    }

    return steps || [];
  }

  // Fetch subcomponents for a specific step from rd_research_subcomponents
  static async getSubcomponentsForStep(stepId: string): Promise<ResearchSubcomponent[]> {
    const { data: subcomponents, error } = await supabase
      .from('rd_research_subcomponents')
      .select('*')
      .eq('step_id', stepId);

    if (error) {
      console.error('Error fetching subcomponents:', error);
      return [];
    }

    return subcomponents || [];
  }

  // Get activities with their steps and subcomponents
  static async getActivitiesWithSteps(activityIds: string[]): Promise<ResearchActivityWithSteps[]> {
    const activities: ResearchActivityWithSteps[] = [];

    for (const activityId of activityIds) {
      // Get activity details
      const { data: activity, error: activityError } = await supabase
        .from('rd_research_activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (activityError || !activity) {
        console.error('Error fetching activity:', activityError);
        continue;
      }

      // Get steps for this activity
      const steps = await this.getStepsForActivity(activityId);
      const stepsWithSubcomponents: StepWithSubcomponents[] = [];

      // Get subcomponents for each step
      for (const step of steps) {
        const subcomponents = await this.getSubcomponentsForStep(step.id);
        stepsWithSubcomponents.push({
          ...step,
          subcomponents
        });
      }

      activities.push({
        activityId,
        activityName: activity.title,
        steps: stepsWithSubcomponents
      });
    }

    return activities;
  }

  // Get selected steps for a business year
  static async getSelectedSteps(businessYearId: string): Promise<SelectedStep[]> {
    const { data: selectedSteps, error } = await supabase
      .from('rd_selected_steps')
      .select('*')
      .eq('business_year_id', businessYearId);

    if (error) {
      console.error('Error fetching selected steps:', error);
      return [];
    }

    return selectedSteps || [];
  }

  // Get selected subcomponents for a business year
  static async getSelectedSubcomponents(businessYearId: string): Promise<SelectedSubcomponent[]> {
    const { data: selectedSubcomponents, error } = await supabase
      .from('rd_selected_subcomponents')
      .select('*')
      .eq('business_year_id', businessYearId);

    if (error) {
      console.error('Error fetching selected subcomponents:', error);
      return [];
    }

    return selectedSubcomponents || [];
  }

  // Save or update a selected step
  static async saveSelectedStep(stepData: Omit<SelectedStep, 'id' | 'created_at' | 'updated_at'>): Promise<SelectedStep | null> {
    const { data: existingStep } = await supabase
      .from('rd_selected_steps')
      .select('id')
      .eq('business_year_id', stepData.business_year_id)
      .eq('step_id', stepData.step_id)
      .single();

    if (existingStep) {
      // Update existing step
      const { data: updatedStep, error } = await supabase
        .from('rd_selected_steps')
        .update({
          time_percentage: stepData.time_percentage,
          applied_percentage: stepData.applied_percentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStep.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating selected step:', error);
        return null;
      }

      return updatedStep;
    } else {
      // Insert new step
      const { data: newStep, error } = await supabase
        .from('rd_selected_steps')
        .insert(stepData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting selected step:', error);
        return null;
      }

      return newStep;
    }
  }

  // Save or update a selected subcomponent
  static async saveSelectedSubcomponent(subcomponentData: Omit<SelectedSubcomponent, 'id' | 'created_at' | 'updated_at'>): Promise<SelectedSubcomponent | null> {
    const { data: existingSubcomponent } = await supabase
      .from('rd_selected_subcomponents')
      .select('id')
      .eq('business_year_id', subcomponentData.business_year_id)
      .eq('subcomponent_id', subcomponentData.subcomponent_id)
      .eq('step_id', subcomponentData.step_id)
      .single();

    if (existingSubcomponent) {
      // Update existing subcomponent
      const updateData: any = {
        frequency_percentage: subcomponentData.frequency_percentage,
        year_percentage: subcomponentData.year_percentage,
        start_month: subcomponentData.start_month,
        start_year: subcomponentData.start_year,
        selected_roles: subcomponentData.selected_roles,
        non_rd_percentage: subcomponentData.non_rd_percentage,
        user_notes: subcomponentData.user_notes,
        approval_data: subcomponentData.approval_data,
        updated_at: new Date().toISOString()
      };

      // Add new schema fields if they exist in the data
      if (subcomponentData.hint !== undefined) updateData.hint = subcomponentData.hint;
      if (subcomponentData.general_description !== undefined) updateData.general_description = subcomponentData.general_description;
      if (subcomponentData.goal !== undefined) updateData.goal = subcomponentData.goal;
      if (subcomponentData.hypothesis !== undefined) updateData.hypothesis = subcomponentData.hypothesis;
      if (subcomponentData.alternatives !== undefined) updateData.alternatives = subcomponentData.alternatives;
      if (subcomponentData.uncertainties !== undefined) updateData.uncertainties = subcomponentData.uncertainties;
      if (subcomponentData.developmental_process !== undefined) updateData.developmental_process = subcomponentData.developmental_process;
      if (subcomponentData.primary_goal !== undefined) updateData.primary_goal = subcomponentData.primary_goal;
      if (subcomponentData.expected_outcome_type !== undefined) updateData.expected_outcome_type = subcomponentData.expected_outcome_type;
      if (subcomponentData.cpt_codes !== undefined) updateData.cpt_codes = subcomponentData.cpt_codes;
      if (subcomponentData.cdt_codes !== undefined) updateData.cdt_codes = subcomponentData.cdt_codes;
      if (subcomponentData.alternative_paths !== undefined) updateData.alternative_paths = subcomponentData.alternative_paths;
      if (subcomponentData.applied_percentage !== undefined) updateData.applied_percentage = subcomponentData.applied_percentage;
      if (subcomponentData.time_percentage !== undefined) updateData.time_percentage = subcomponentData.time_percentage;
      if (subcomponentData.step_name !== undefined) updateData.step_name = subcomponentData.step_name;

      const { data: updatedSubcomponent, error } = await supabase
        .from('rd_selected_subcomponents')
        .update(updateData)
        .eq('id', existingSubcomponent.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating selected subcomponent:', error);
        return null;
      }

      return updatedSubcomponent;
    } else {
      // Insert new subcomponent
      const { data: newSubcomponent, error } = await supabase
        .from('rd_selected_subcomponents')
        .insert(subcomponentData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting selected subcomponent:', error);
        return null;
      }

      return newSubcomponent;
    }
  }

  // Delete a selected step
  static async deleteSelectedStep(businessYearId: string, stepId: string): Promise<boolean> {
    const { error } = await supabase
      .from('rd_selected_steps')
      .delete()
      .eq('business_year_id', businessYearId)
      .eq('step_id', stepId);

    if (error) {
      console.error('Error deleting selected step:', error);
      return false;
    }

    return true;
  }

  // Delete a selected subcomponent
  static async deleteSelectedSubcomponent(businessYearId: string, subcomponentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('rd_selected_subcomponents')
      .delete()
      .eq('business_year_id', businessYearId)
      .eq('subcomponent_id', subcomponentId);

    if (error) {
      console.error('Error deleting selected subcomponent:', error);
      return false;
    }

    return true;
  }

  // Get step count for an activity
  static async getStepCountForActivity(activityId: string): Promise<number> {
    const steps = await this.getStepsForActivity(activityId);
    return steps.length;
  }

  // Get complete research design data
  static async getResearchDesignData(businessYearId: string, selectedActivityIds: string[]): Promise<ResearchActivityWithSteps[]> {
    return await this.getActivitiesWithSteps(selectedActivityIds);
  }

  // Get selected activities for a business year
  static async getSelectedActivities(businessYearId: string): Promise<Array<{
    id: string;
    activity_id: string;
    activity_name?: string;
    practice_percent: number;
    selected_roles: string[];
  }>> {
    console.log('ResearchDesignService: getSelectedActivities called with businessYearId:', businessYearId);
    
    const { data, error } = await supabase
      .from('rd_selected_activities')
      .select(`
        id,
        activity_id,
        practice_percent,
        selected_roles,
        rd_research_activities (
          id,
          title,
          focus_id
        )
      `)
      .eq('business_year_id', businessYearId);

    console.log('ResearchDesignService: Supabase query result - data:', data, 'error:', error);

    if (error) {
      console.error('ResearchDesignService: Error fetching selected activities:', error);
      return [];
    }

    if (!data) {
      console.log('ResearchDesignService: No data returned from query');
      return [];
    }

    const mappedActivities = data.map(activity => ({
      id: activity.id,
      activity_id: activity.activity_id,
      activity_name: activity.rd_research_activities?.title || 'Unknown Activity',
      practice_percent: activity.practice_percent,
      selected_roles: activity.selected_roles || []
    }));

    console.log('ResearchDesignService: Mapped activities:', mappedActivities);
    return mappedActivities;
  }

  // Calculate applied percentage
  static calculateAppliedPercentage(
    practicePercentage: number,
    timePercentage: number,
    frequencyPercentage: number
  ): number {
    return (practicePercentage / 100) * (timePercentage / 100) * (frequencyPercentage / 100) * 100;
  }

  // Get approval data
  static getApprovalData(): { timestamp: string; ip_address?: string } {
    return {
      timestamp: new Date().toISOString(),
      ip_address: typeof window !== 'undefined' ? window.location.hostname : undefined
    };
  }

  // Get all steps to check if any exist
  static async getAllSteps(): Promise<ResearchStep[]> {
    const { data: steps, error } = await supabase
      .from('rd_research_steps')
      .select('*');

    console.log('ResearchDesignService: All steps query result:', { steps, error });

    if (error) {
      console.error('Error fetching all steps:', error);
      return [];
    }

    return steps || [];
  }
} 