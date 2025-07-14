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
  
  // Get all QRE data for Section G using the same approach as CSV export
  static async getQREDataForSectionG(businessYearId: string): Promise<SectionGQREEntry[]> {
    try {
      console.log('📊 SectionGQREService - Starting QRE data gathering for business year:', businessYearId);
      
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

      console.log('📊 Section G QRE Data:', {
        subcomponents: subcomponents?.length || 0,
        employees: employees?.length || 0,
        contractors: contractors?.length || 0,
        supplies: supplies?.length || 0
      });

      // Debug: Log all employees and their roles
      console.log('🔍 [SectionGQREService] All employees:', employees?.map(e => ({
        name: `${e.first_name} ${e.last_name}`,
        role: e.role?.name,
        is_owner: e.is_owner,
        annual_wage: e.annual_wage
      })));

      const qreEntries: SectionGQREEntry[] = [];

      // Process each subcomponent
      for (const subcomponent of subcomponents || []) {
        const subcomponentName = subcomponent.subcomponent?.name || 'Unknown Subcomponent';
        const researchActivityName = subcomponent.research_activity?.title || 'Unknown Activity';
        const stepName = subcomponent.step?.name || 'Unknown Step';
        const activityId = subcomponent.research_activity?.id || '';

        console.log(`🔍 [SectionGQREService] Processing subcomponent: ${subcomponentName} for activity: ${researchActivityName}`);

        // Track if any employees were found for this subcomponent
        let employeeFound = false;

        // Add employee entries for this subcomponent
        for (const employee of employees || []) {
          // DEBUG: Log employee role and is_owner
          if (employee.is_owner || (employee.role && employee.role.name === 'Research Leader')) {
            console.log('[SectionGQREService] Including Research Leader:', employee.first_name, employee.last_name, employee.role?.name, employee.is_owner);
          }
          const employeeSubcomponent = employee.subcomponents?.find(
            sub => sub.subcomponent_id === subcomponent.subcomponent_id && 
                   sub.business_year_id === businessYearId
          );

          if (employeeSubcomponent) {
            employeeFound = true;
            const annualWage = employee.annual_wage || 0;
            const appliedDollarAmount = Math.round((annualWage * (employeeSubcomponent.applied_percentage || 0)) / 100);
            const calculatedQRE = appliedDollarAmount;

            console.log(`🔍 [SectionGQREService] Employee ${employee.first_name} ${employee.last_name}:`, {
              role: employee.role?.name,
              is_owner: employee.is_owner,
              annual_wage: annualWage,
              applied_percentage: employeeSubcomponent.applied_percentage,
              calculated_qre: calculatedQRE,
              subcomponent_id: subcomponent.subcomponent_id,
              business_year_id: businessYearId
            });

            qreEntries.push({
              activity_id: activityId,
              activity_title: researchActivityName,
              subcomponent_id: subcomponent.subcomponent_id,
              subcomponent_name: subcomponentName,
              step_id: subcomponent.step_id,
              step_name: stepName,
              category: 'Employee',
              name: `${employee.first_name} ${employee.last_name}`.trim(),
              first_name: employee.first_name || '',
              last_name: employee.last_name || '',
              role: employee.role?.name || '',
              annual_cost: annualWage,
              applied_percentage: employeeSubcomponent.applied_percentage || 0,
              calculated_qre: calculatedQRE,
              is_owner: employee.is_owner || false
            });
          }
        }

        // Log if no employees were found for this subcomponent
        if (!employeeFound) {
          console.log(`⚠️ [SectionGQREService] No employees found for subcomponent: ${subcomponentName} (${subcomponent.subcomponent_id}) in activity: ${researchActivityName}`);
          console.log(`⚠️ [SectionGQREService] Available employees:`, employees?.map(e => ({
            name: `${e.first_name} ${e.last_name}`,
            subcomponents: e.subcomponents?.map(s => s.subcomponent_id)
          })));
        }

        // Add contractor entries for this subcomponent
        for (const contractor of contractors || []) {
          const contractorSubcomponent = contractor.subcomponents?.find(
            sub => sub.subcomponent_id === subcomponent.subcomponent_id && 
                   sub.business_year_id === businessYearId
          );

          if (contractorSubcomponent) {
            const annualCost = contractor.amount || 0;
            const appliedDollarAmount = Math.round((annualCost * (contractorSubcomponent.applied_percentage || 0)) / 100);
            // Calculate QRE (65% reduction for contractors)
            const calculatedQRE = Math.round(appliedDollarAmount * 0.65);

            qreEntries.push({
              activity_id: activityId,
              activity_title: researchActivityName,
              subcomponent_id: subcomponent.subcomponent_id,
              subcomponent_name: subcomponentName,
              step_id: subcomponent.step_id,
              step_name: stepName,
              category: 'Contractor',
              name: `${contractor.first_name} ${contractor.last_name}`.trim(),
              first_name: contractor.first_name || '',
              last_name: contractor.last_name || '',
              role: contractor.role?.name || '',
              annual_cost: annualCost,
              applied_percentage: contractorSubcomponent.applied_percentage || 0,
              calculated_qre: calculatedQRE,
              is_owner: contractor.is_owner || false
            });
          }
        }

        // Add supply entries for this subcomponent
        for (const supply of supplies || []) {
          const supplySubcomponent = supply.subcomponents?.find(
            sub => sub.subcomponent_id === subcomponent.subcomponent_id && 
                   sub.business_year_id === businessYearId
          );

          if (supplySubcomponent) {
            const annualCost = supply.annual_cost || 0;
            const appliedDollarAmount = Math.round(supplySubcomponent.amount_applied || 0);
            const calculatedQRE = appliedDollarAmount;

            qreEntries.push({
              activity_id: activityId,
              activity_title: researchActivityName,
              subcomponent_id: subcomponent.subcomponent_id,
              subcomponent_name: subcomponentName,
              step_id: subcomponent.step_id,
              step_name: stepName,
              category: 'Supply',
              name: supply.name || '',
              annual_cost: annualCost,
              applied_percentage: supplySubcomponent.applied_percentage || 0,
              calculated_qre: calculatedQRE,
              is_owner: false
            });
          }
        }
      }

      console.log('✅ Section G QRE data gathering completed successfully');
      console.log('📊 Total QRE entries:', qreEntries.length);
      
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