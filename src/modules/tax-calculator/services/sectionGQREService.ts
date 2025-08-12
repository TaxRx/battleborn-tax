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
      const { data: contractorYearData, error: contractorYearError } = await supabase
        .from('rd_contractor_year_data')
        .select(`
          contractor_id,
          calculated_qre,
          applied_percent,
          contractor:rd_contractors (
            id,
            first_name,
            last_name,
            amount,
            is_owner,
            role:rd_roles (
              id,
              name
            )
          )
        `)
        .eq('business_year_id', businessYearId);

      if (contractorYearError) {
        console.error('❌ Error fetching contractor year data:', contractorYearError);
        throw contractorYearError;
      }

      // Get supply year data from the same source as Expense step  
      const { data: supplyYearData, error: supplyYearError } = await supabase
        .from('rd_supply_year_data')
        .select(`
          supply_id,
          calculated_qre,
          applied_percent,
          supply:rd_supplies (
            id,
            name,
            annual_cost
          )
        `)
        .eq('business_year_id', businessYearId);

      if (supplyYearError) {
        console.error('❌ Error fetching supply year data:', supplyYearError);
        throw supplyYearError;
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

      // Use the first activity as the default activity for all entries
      // This matches how the Expense step aggregates QREs
      const defaultActivity = selectedActivities?.[0]?.research_activity || {
        id: 'default',
        title: 'Research Activities'
      };

      // Process employee year data - use EXACT same calculated_qre as Expense step
      for (const empData of employeeYearData || []) {
        const employee = empData.employee;
        if (!employee) continue;

        const calculatedQRE = empData.calculated_qre || 0;
        
        console.log(`💰 [SectionGQREService] Employee ${employee.first_name} ${employee.last_name}: $${calculatedQRE.toLocaleString()} (from calculated_qre)`);

        if (calculatedQRE > 0) {
          qreEntries.push({
            activity_id: defaultActivity.id,
            activity_title: defaultActivity.title,
            subcomponent_id: 'aggregate', // Use aggregate since we're using year-level data
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
            calculated_qre: calculatedQRE, // EXACT same value as Expense step
            is_owner: employee.is_owner || false
          });
        }
      }

      // Process contractor year data - use EXACT same calculated_qre as Expense step
      for (const contrData of contractorYearData || []) {
        const contractor = contrData.contractor;
        if (!contractor) continue;

        const calculatedQRE = contrData.calculated_qre || 0;
        
        console.log(`💰 [SectionGQREService] Contractor ${contractor.first_name} ${contractor.last_name}: $${calculatedQRE.toLocaleString()} (from calculated_qre)`);

        if (calculatedQRE > 0) {
          qreEntries.push({
            activity_id: defaultActivity.id,
            activity_title: defaultActivity.title,
            subcomponent_id: 'aggregate',
            subcomponent_name: 'Applied Costs',
            step_id: 'aggregate',
            step_name: 'Applied Costs',
            category: 'Contractor',
            name: `${contractor.first_name} ${contractor.last_name}`.trim(),
            first_name: contractor.first_name || '',
            last_name: contractor.last_name || '',
            role: contractor.role?.name || '',
            annual_cost: contractor.amount || 0,
            applied_percentage: contrData.applied_percent || 0,
            calculated_qre: calculatedQRE, // EXACT same value as Expense step
            is_owner: contractor.is_owner || false
          });
        }
      }

      // Process supply year data - use EXACT same calculated_qre as Expense step
      for (const suppData of supplyYearData || []) {
        const supply = suppData.supply;
        if (!supply) continue;

        const calculatedQRE = suppData.calculated_qre || 0;
        
        console.log(`💰 [SectionGQREService] Supply ${supply.name}: $${calculatedQRE.toLocaleString()} (from calculated_qre)`);

        if (calculatedQRE > 0) {
          qreEntries.push({
            activity_id: defaultActivity.id,
            activity_title: defaultActivity.title,
            subcomponent_id: 'aggregate',
            subcomponent_name: 'Applied Supplies',
            step_id: 'aggregate',
            step_name: 'Applied Supplies',
            category: 'Supply',
            name: supply.name || '',
            annual_cost: supply.annual_cost || 0,
            applied_percentage: suppData.applied_percent || 0,
            calculated_qre: calculatedQRE, // EXACT same value as Expense step
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