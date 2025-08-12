import { supabase } from '../../../lib/supabase';

export interface SectionGQREEntry {
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

export class SectionGQREService {
  
  // Get all QRE data for Section G using the SAME approach as the Expense step
  // CRITICAL: This ensures Form 6765 Section G matches the Expense step exactly
  static async getQREDataForSectionG(businessYearId: string): Promise<SectionGQREEntry[]> {
    try {
      console.log('🔍 [SectionGQREService] Using Expense Step data source for exact matching');
      
      // Get the business_id from the business_year_id
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

      // PRIORITY 1: Get QRE data from the SAME source as Expense step (rd_employee_year_data.calculated_qre)
      const { data: employeeYearData, error: employeeYearError } = await supabase
        .from('rd_employee_year_data')
        .select(`
          employee_id,
          calculated_qre,
          applied_percent,
          employee:rd_employees (
            id,
            first_name,
            last_name,
            annual_wage,
            is_owner,
            role:rd_roles (
              id,
              name
            )
          )
        `)
        .eq('business_year_id', businessYearId);

      if (employeeYearError) {
        console.error('❌ Error fetching employee year data:', employeeYearError);
        throw employeeYearError;
      }

      // Get contractor year data from the same source as Expense step
      // NOTE: Handle gracefully if table doesn't exist or has no data
      let contractorYearData = null;
      try {
        const { data, error } = await supabase
          .from('rd_contractor_year_data')
          .select(`
            contractor_id,
            calculated_qre,
            applied_percent,
            name
          `)
          .eq('business_year_id', businessYearId);

        if (error) {
          console.warn('⚠️ rd_contractor_year_data query failed (table may not exist):', error.message);
          contractorYearData = [];
        } else {
          contractorYearData = data || [];
        }
      } catch (error) {
        console.warn('⚠️ rd_contractor_year_data table not available:', error);
        contractorYearData = [];
      }

      // Get supply year data from the same source as Expense step  
      // NOTE: Handle gracefully if table doesn't exist or has no data
      let supplyYearData = null;
      try {
        const { data, error } = await supabase
          .from('rd_supply_year_data')
          .select(`
            supply_id,
            calculated_qre,
            applied_percent,
            name
          `)
          .eq('business_year_id', businessYearId);

        if (error) {
          console.warn('⚠️ rd_supply_year_data query failed (table may not exist):', error.message);
          supplyYearData = [];
        } else {
          supplyYearData = data || [];
        }
      } catch (error) {
        console.warn('⚠️ rd_supply_year_data table not available:', error);
        supplyYearData = [];
      }

      // Get research activities for proper categorization
      const { data: selectedActivities, error: activitiesError } = await supabase
        .from('rd_selected_activities')
        .select(`
          activity_id,
          research_activity:rd_research_activities (
            id,
            title
          )
        `)
        .eq('business_year_id', businessYearId);

      if (activitiesError) {
        console.error('❌ Error fetching selected activities:', activitiesError);
        throw activitiesError;
      }

      console.log('📊 Section G QRE Data (from Expense step sources):', {
        employees: employeeYearData?.length || 0,
        contractors: contractorYearData?.length || 0,
        supplies: supplyYearData?.length || 0,
        activities: selectedActivities?.length || 0
      });

      const qreEntries: SectionGQREEntry[] = [];

      // Get employee activity allocations to properly distribute QRE by research activity
      const { data: employeeActivityData, error: activityError } = await supabase
        .from('rd_employee_year_data')
        .select(`
          employee_id,
          activity_roles
        `)
        .eq('business_year_id', businessYearId);

      if (activityError) {
        console.warn('⚠️ Could not load employee activity allocations:', activityError);
      }

      // Create activity mapping for easy lookup
      const activityMap = new Map();
      (selectedActivities || []).forEach(act => {
        if (act.research_activity) {
          activityMap.set(act.activity_id, act.research_activity);
        }
      });

      // Process employee year data - distribute QRE across research activities
      for (const empData of employeeYearData || []) {
        const employee = empData.employee;
        if (!employee) continue;

        const calculatedQRE = empData.calculated_qre || 0;
        
        if (calculatedQRE <= 0) continue;

        // Get this employee's activity allocations
        const empActivityData = employeeActivityData?.find(ea => ea.employee_id === empData.employee_id);
        const activityRoles = empActivityData?.activity_roles || {};

        console.log(`💰 [SectionGQREService] Employee ${employee.first_name} ${employee.last_name}: $${calculatedQRE.toLocaleString()} (from calculated_qre)`);
        console.log(`🎯 Activity allocations:`, activityRoles);

        // If employee has specific activity allocations, distribute QRE proportionally
        if (Object.keys(activityRoles).length > 0) {
          const totalActivityPercent = Object.values(activityRoles).reduce((sum: number, percent: any) => sum + (percent || 0), 0);
          
          if (totalActivityPercent > 0) {
            // Distribute QRE proportionally across activities
            for (const [activityId, activityPercent] of Object.entries(activityRoles)) {
              const activity = activityMap.get(activityId);
              if (!activity || !activityPercent) continue;

              const proportionalQRE = Math.round(calculatedQRE * (activityPercent as number) / totalActivityPercent);
              
              if (proportionalQRE > 0) {
                console.log(`  📊 ${activity.title}: ${activityPercent}% = $${proportionalQRE.toLocaleString()}`);
                
                qreEntries.push({
                  activity_id: activityId,
                  activity_title: activity.title,
                  subcomponent_id: 'aggregate',
                  subcomponent_name: 'Applied Wages',
                  step_id: 'aggregate',
                  step_name: 'Applied Wages',
                  category: 'Employee',
                  name: `${employee.first_name} ${employee.last_name}`.trim(),
                  first_name: employee.first_name || '',
                  last_name: employee.last_name || '',
                  role: employee.role?.name || '',
                  annual_cost: employee.annual_wage || 0,
                  applied_percentage: empData.applied_percent || 0,
                  calculated_qre: proportionalQRE,
                  is_owner: employee.is_owner || false
                });
              }
            }
          } else {
            // Fallback: if activity percentages sum to 0, use first activity
            const firstActivity = selectedActivities?.[0]?.research_activity;
            if (firstActivity) {
              qreEntries.push({
                activity_id: firstActivity.id,
                activity_title: firstActivity.title,
                subcomponent_id: 'aggregate',
                subcomponent_name: 'Applied Wages',
                step_id: 'aggregate',
                step_name: 'Applied Wages',
                category: 'Employee',
                name: `${employee.first_name} ${employee.last_name}`.trim(),
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                role: employee.role?.name || '',
                annual_cost: employee.annual_wage || 0,
                applied_percentage: empData.applied_percent || 0,
                calculated_qre: calculatedQRE,
                is_owner: employee.is_owner || false
              });
            }
          }
        } else {
          // No activity allocations - distribute evenly across all activities
          const activityCount = selectedActivities?.length || 1;
          const qrePerActivity = Math.round(calculatedQRE / activityCount);
          
          for (const selectedActivity of selectedActivities || []) {
            const activity = selectedActivity.research_activity;
            if (!activity) continue;

            console.log(`  📊 ${activity.title}: evenly distributed = $${qrePerActivity.toLocaleString()}`);
            
            qreEntries.push({
              activity_id: activity.id,
              activity_title: activity.title,
              subcomponent_id: 'aggregate',
              subcomponent_name: 'Applied Wages',
              step_id: 'aggregate',
              step_name: 'Applied Wages',
              category: 'Employee',
              name: `${employee.first_name} ${employee.last_name}`.trim(),
              first_name: employee.first_name || '',
              last_name: employee.last_name || '',
              role: employee.role?.name || '',
              annual_cost: employee.annual_wage || 0,
              applied_percentage: empData.applied_percent || 0,
              calculated_qre: qrePerActivity,
              is_owner: employee.is_owner || false
            });
          }
        }
      }

      // Process contractor year data - distribute across activities
      for (const contrData of contractorYearData || []) {
        const calculatedQRE = contrData.calculated_qre || 0;
        const contractorName = contrData.name || 'Unknown Contractor';
        
        if (calculatedQRE <= 0) continue;

        console.log(`💰 [SectionGQREService] Contractor ${contractorName}: $${calculatedQRE.toLocaleString()} (from calculated_qre)`);

        // Distribute contractor QRE evenly across all activities
        const activityCount = selectedActivities?.length || 1;
        const qrePerActivity = Math.round(calculatedQRE / activityCount);

        for (const selectedActivity of selectedActivities || []) {
          const activity = selectedActivity.research_activity;
          if (!activity) continue;

          qreEntries.push({
            activity_id: activity.id,
            activity_title: activity.title,
            subcomponent_id: 'aggregate',
            subcomponent_name: 'Applied Costs',
            step_id: 'aggregate',
            step_name: 'Applied Costs',
            category: 'Contractor',
            name: contractorName,
            first_name: '',
            last_name: '',
            role: '',
            annual_cost: 0,
            applied_percentage: contrData.applied_percent || 0,
            calculated_qre: qrePerActivity,
            is_owner: false
          });
        }
      }

      // Process supply year data - distribute across activities
      for (const suppData of supplyYearData || []) {
        const calculatedQRE = suppData.calculated_qre || 0;
        const supplyName = suppData.name || 'Unknown Supply';
        
        if (calculatedQRE <= 0) continue;

        console.log(`💰 [SectionGQREService] Supply ${supplyName}: $${calculatedQRE.toLocaleString()} (from calculated_qre)`);

        // Distribute supply QRE evenly across all activities
        const activityCount = selectedActivities?.length || 1;
        const qrePerActivity = Math.round(calculatedQRE / activityCount);

        for (const selectedActivity of selectedActivities || []) {
          const activity = selectedActivity.research_activity;
          if (!activity) continue;

          qreEntries.push({
            activity_id: activity.id,
            activity_title: activity.title,
            subcomponent_id: 'aggregate',
            subcomponent_name: 'Applied Supplies',
            step_id: 'aggregate',
            step_name: 'Applied Supplies',
            category: 'Supply',
            name: supplyName,
            annual_cost: 0,
            applied_percentage: suppData.applied_percent || 0,
            calculated_qre: qrePerActivity,
            is_owner: false
          });
        }
      }

      const totalQRE = qreEntries.reduce((sum, entry) => sum + entry.calculated_qre, 0);
      console.log('✅ Section G QRE data gathering completed successfully');
      console.log('📊 Total QRE entries:', qreEntries.length);
      console.log('💰 Total QRE amount:', `$${totalQRE.toLocaleString()}`);
      console.log('🎯 Source: EXACT same as Expense step (rd_employee_year_data.calculated_qre, etc.)');
      
      return qreEntries;
    } catch (error) {
      console.error('❌ Error gathering QRE data for Section G:', error);
      throw error;
    }
  }

  // Group QRE data by activity for Section G
  static async getQREByActivity(businessYearId: string) {
    const qreEntries = await this.getQREDataForSectionG(businessYearId);
    
    // Group by activity_id
    const groupedByActivity = qreEntries.reduce((acc, entry) => {
      if (!acc[entry.activity_id]) {
        acc[entry.activity_id] = {
          activity_id: entry.activity_id,
          activity_title: entry.activity_title,
          employees: [],
          contractors: [],
          supplies: [],
          total_qre: 0
        };
      }
      
      if (entry.category === 'Employee') {
        acc[entry.activity_id].employees.push(entry);
      } else if (entry.category === 'Contractor') {
        acc[entry.activity_id].contractors.push(entry);
      } else if (entry.category === 'Supply') {
        acc[entry.activity_id].supplies.push(entry);
      }
      
      acc[entry.activity_id].total_qre += entry.calculated_qre;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByActivity);
  }
} 