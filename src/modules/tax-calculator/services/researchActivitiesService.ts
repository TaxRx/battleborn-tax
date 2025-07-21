import { supabase } from '../../../lib/supabase';

export interface ResearchActivityData {
  id: string;
  name: string;
  applied_percent: number;
  practice_percent: number;
}

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
          rd_research_activities (
            id,
            title
          )
        `)
        .eq('business_year_id', businessYearId);

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

          console.log(`[ResearchActivitiesService] 🔧 BASELINE FIX: Activity ${activity.rd_research_activities?.title}:`, {
            subcomponentsCount: subcomponentsData?.length || 0,
            totalAppliedPercent: totalAppliedPercent.toFixed(2),
            practicePercent: activity.practice_percent || 0
          });

          activitiesWithAppliedPercentages.push({
            id: activity.activity_id,
            name: activity.rd_research_activities?.title || 'Unknown Activity',
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
      return { employees: 0, contractors: 0, supplies: 0 };
    }
  }
} 