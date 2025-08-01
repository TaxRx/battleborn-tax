import { supabase } from '../lib/supabase';
import useLockStore from '../store/lockStore';

export interface StepCompletionData {
  businessSetup: boolean;
  researchActivities: boolean;
  researchDesign: boolean;
  calculations: boolean;
  qres: boolean;
}

export class StepCompletionService {
  /**
   * Load step completion data from database and sync with store
   */
  static async loadStepCompletion(businessYearId: string): Promise<StepCompletionData> {
    try {
      const { data: businessYear, error } = await supabase
        .from('rd_business_years')
        .select(`
          business_setup_completed,
          research_activities_completed,
          research_design_completed,
          calculations_completed,
          qre_locked
        `)
        .eq('id', businessYearId)
        .single();

      if (error) {
        console.error('Error loading step completion:', error);
        throw error;
      }

      const completionData: StepCompletionData = {
        businessSetup: businessYear?.business_setup_completed || false,
        researchActivities: businessYear?.research_activities_completed || false,
        researchDesign: businessYear?.research_design_completed || false,
        calculations: businessYear?.calculations_completed || false,
        qres: businessYear?.qre_locked || false
      };

      // Sync with store
      const { setStepCompletion } = useLockStore.getState();
      Object.entries(completionData).forEach(([step, completed]) => {
        setStepCompletion(businessYearId, step as keyof StepCompletionData, completed);
      });

      return completionData;

    } catch (error) {
      console.error('Error in loadStepCompletion:', error);
      throw error;
    }
  }

  /**
   * Update step completion in database
   */
  static async updateStepCompletion(
    businessYearId: string, 
    step: keyof StepCompletionData, 
    completed: boolean,
    userId?: string
  ): Promise<void> {
    try {
      const columnMap = {
        businessSetup: 'business_setup_completed',
        researchActivities: 'research_activities_completed',
        researchDesign: 'research_design_completed',
        calculations: 'calculations_completed',
        qres: 'qre_locked'
      };

      const updateData: any = {
        [columnMap[step]]: completed,
        updated_at: new Date().toISOString()
      };

      if (completed && step !== 'qres') {
        // Set completion metadata
        updateData[`${columnMap[step].replace('_completed', '_completed_at')}`] = new Date().toISOString();
        if (userId) {
          updateData[`${columnMap[step].replace('_completed', '_completed_by')}`] = userId;
        }
      } else if (!completed && step !== 'qres') {
        // Clear completion metadata
        updateData[`${columnMap[step].replace('_completed', '_completed_at')}`] = null;
        updateData[`${columnMap[step].replace('_completed', '_completed_by')}`] = null;
      }

      const { error } = await supabase
        .from('rd_business_years')
        .update(updateData)
        .eq('id', businessYearId);

      if (error) {
        console.error('Error updating step completion:', error);
        throw error;
      }

      // Update store
      const { setStepCompletion } = useLockStore.getState();
      setStepCompletion(businessYearId, step, completed);

      console.log(`✅ Step ${step} ${completed ? 'completed' : 'unlocked'} for business year ${businessYearId}`);

    } catch (error) {
      console.error('Error in updateStepCompletion:', error);
      throw error;
    }
  }

  /**
   * Check if a step is locked/completed
   */
  static isStepLocked(businessYearId: string, step: keyof StepCompletionData): boolean {
    const { getStepCompletion } = useLockStore.getState();
    return getStepCompletion(businessYearId, step);
  }

  /**
   * Get overall completion percentage for a business year
   */
  static getCompletionPercentage(businessYearId: string): number {
    const { getCompletionPercentage } = useLockStore.getState();
    return getCompletionPercentage(businessYearId);
  }

  /**
   * Get list of completed steps for a business year
   */
  static getCompletedSteps(businessYearId: string): string[] {
    const { getCompletedSteps } = useLockStore.getState();
    return getCompletedSteps(businessYearId);
  }

  /**
   * Load completion data for multiple business years (for dashboard)
   */
  static async loadMultipleBusinessYears(businessYearIds: string[]): Promise<{ [id: string]: StepCompletionData }> {
    try {
      const { data: businessYears, error } = await supabase
        .from('rd_business_years')
        .select(`
          id,
          business_setup_completed,
          research_activities_completed,
          research_design_completed,
          calculations_completed,
          qre_locked
        `)
        .in('id', businessYearIds);

      if (error) {
        console.error('Error loading multiple business years:', error);
        throw error;
      }

      const result: { [id: string]: StepCompletionData } = {};
      const { setStepCompletion } = useLockStore.getState();

      businessYears?.forEach(year => {
        const completionData: StepCompletionData = {
          businessSetup: year.business_setup_completed || false,
          researchActivities: year.research_activities_completed || false,
          researchDesign: year.research_design_completed || false,
          calculations: year.calculations_completed || false,
          qres: year.qre_locked || false
        };

        result[year.id] = completionData;

        // Sync with store
        Object.entries(completionData).forEach(([step, completed]) => {
          setStepCompletion(year.id, step as keyof StepCompletionData, completed);
        });
      });

      return result;

    } catch (error) {
      console.error('Error in loadMultipleBusinessYears:', error);
      throw error;
    }
  }

  /**
   * Utility method to validate step completion requirements
   */
  static validateStepCompletion(step: keyof StepCompletionData, data?: any): { valid: boolean; message?: string } {
    switch (step) {
      case 'businessSetup':
        // Add validation logic for business setup completion
        if (!data?.businessName || !data?.ein) {
          return { valid: false, message: 'Business name and EIN are required' };
        }
        break;

      case 'researchActivities':
        // Add validation logic for research activities
        if (!data?.selectedActivities || data.selectedActivities.length === 0) {
          return { valid: false, message: 'At least one research activity must be selected' };
        }
        break;

      case 'researchDesign':
        // Add validation logic for research design
        if (!data?.designComplete) {
          return { valid: false, message: 'Research design must be completed' };
        }
        break;

      case 'calculations':
        // Add validation logic for calculations
        if (!data?.federalCredit && !data?.stateCredit) {
          return { valid: false, message: 'Tax credit calculations must be completed' };
        }
        break;

      case 'qres':
        // Add validation logic for QREs
        if (!data?.employeeQre && !data?.contractorQre && !data?.supplyQre) {
          return { valid: false, message: 'At least one QRE category must have a value' };
        }
        break;
    }

    return { valid: true };
  }
}

export default StepCompletionService;