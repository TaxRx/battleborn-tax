import { supabase } from '../lib/supabase';
import { RDExpense, RDContractor, RDSupply, EmployeeWithExpenses } from '../types/researchDesign';

export class ExpenseManagementService {
  
  // Create expense records for an employee across all their subcomponents
  static async createEmployeeExpenses(
    employeeId: string,
    businessYearId: string,
    employeePracticePercent: number,
    employeeTimePercentages: Record<string, number>
  ): Promise<void> {
    try {
      // Get employee data
      const { data: employee, error: empError } = await supabase
        .from('rd_employees')
        .select(`
          *,
          role:rd_roles (
            id,
            name
          )
        `)
        .eq('id', employeeId)
        .single();

      if (empError) throw empError;

      // Get all subcomponents for this business year
      const { data: subcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          *,
          research_activity:rd_research_activities (
            id,
            name
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

      if (subError) throw subError;

      // Delete existing expense records for this employee
      await supabase
        .from('rd_expenses')
        .delete()
        .eq('employee_id', employeeId)
        .eq('business_year_id', businessYearId);

      // Create expense records for each subcomponent
      const expenseRecords: Partial<RDExpense>[] = [];

      for (const subcomponent of subcomponents || []) {
        const employeeTimePercent = employeeTimePercentages[subcomponent.subcomponent_id] || 0;
        
        // Calculate applied percentage
        const practicePercent = subcomponent.research_activity?.name ? employeePracticePercent : 0;
        const stepPercent = subcomponent.step?.time_percentage || 0;
        const freqPercent = subcomponent.frequency_percentage || 0;
        const yearPercent = subcomponent.year_percentage || 0;
        
        const appliedPercent = (practicePercent / 100) * (stepPercent / 100) * (freqPercent / 100) * (yearPercent / 100) * (employeeTimePercent / 100) * 100;
        const baselineAppliedPercent = (practicePercent / 100) * (stepPercent / 100) * (freqPercent / 100) * (yearPercent / 100) * 100;

        expenseRecords.push({
          business_year_id: businessYearId,
          research_activity_id: subcomponent.research_activity_id,
          step_id: subcomponent.step_id,
          subcomponent_id: subcomponent.subcomponent_id,
          employee_id: employeeId,
          category: 'Employee',
          first_name: employee.name?.split(' ')[0] || '',
          last_name: employee.name?.split(' ').slice(1).join(' ') || '',
          role_name: employee.role?.name || '',
          research_activity_title: subcomponent.research_activity?.name || '',
          research_activity_practice_percent: practicePercent,
          step_name: subcomponent.step?.name || '',
          subcomponent_title: subcomponent.subcomponent?.name || '',
          subcomponent_year_percent: yearPercent,
          subcomponent_frequency_percent: freqPercent,
          subcomponent_time_percent: stepPercent,
          total_cost: employee.annual_wage || 0,
          applied_percent: appliedPercent,
          baseline_applied_percent: baselineAppliedPercent,
          employee_practice_percent: practicePercent,
          employee_time_percent: employeeTimePercent
        });
      }

      // Insert expense records
      if (expenseRecords.length > 0) {
        const { error } = await supabase
          .from('rd_expenses')
          .insert(expenseRecords);

        if (error) throw error;
      }

      console.log(`Created ${expenseRecords.length} expense records for employee ${employee.name}`);
    } catch (error) {
      console.error('Error creating employee expenses:', error);
      throw error;
    }
  }

  // Create expense records for a contractor
  static async createContractorExpenses(
    contractorId: string,
    businessYearId: string,
    subcomponentAllocations: Record<string, number>
  ): Promise<void> {
    try {
      // Get contractor data
      const { data: contractor, error: contractorError } = await supabase
        .from('rd_contractors')
        .select('*')
        .eq('id', contractorId)
        .single();

      if (contractorError) throw contractorError;

      // Get subcomponents for this business year
      const { data: subcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          *,
          research_activity:rd_research_activities (
            id,
            name
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

      if (subError) throw subError;

      // Delete existing expense records for this contractor
      await supabase
        .from('rd_expenses')
        .delete()
        .eq('contractor_id', contractorId)
        .eq('business_year_id', businessYearId);

      // Create expense records for each subcomponent
      const expenseRecords: Partial<RDExpense>[] = [];

      for (const subcomponent of subcomponents || []) {
        const allocationPercent = subcomponentAllocations[subcomponent.subcomponent_id] || 0;
        
        if (allocationPercent > 0) {
          const stepPercent = subcomponent.step?.time_percentage || 0;
          const freqPercent = subcomponent.frequency_percentage || 0;
          const yearPercent = subcomponent.year_percentage || 0;
          
          const appliedPercent = (stepPercent / 100) * (freqPercent / 100) * (yearPercent / 100) * (allocationPercent / 100) * 100;

          expenseRecords.push({
            business_year_id: businessYearId,
            research_activity_id: subcomponent.research_activity_id,
            step_id: subcomponent.step_id,
            subcomponent_id: subcomponent.subcomponent_id,
            contractor_id: contractorId,
            category: 'Contractor',
            research_activity_title: subcomponent.research_activity?.name || '',
            research_activity_practice_percent: 100, // Contractors typically get full practice percentage
            step_name: subcomponent.step?.name || '',
            subcomponent_title: subcomponent.subcomponent?.name || '',
            subcomponent_year_percent: yearPercent,
            subcomponent_frequency_percent: freqPercent,
            subcomponent_time_percent: stepPercent,
            total_cost: contractor.total_cost,
            applied_percent: appliedPercent,
            baseline_applied_percent: appliedPercent
          });
        }
      }

      // Insert expense records
      if (expenseRecords.length > 0) {
        const { error } = await supabase
          .from('rd_expenses')
          .insert(expenseRecords);

        if (error) throw error;
      }

      console.log(`Created ${expenseRecords.length} expense records for contractor ${contractor.name}`);
    } catch (error) {
      console.error('Error creating contractor expenses:', error);
      throw error;
    }
  }

  // Create expense records for a supply
  static async createSupplyExpenses(
    supplyId: string,
    businessYearId: string,
    subcomponentAllocations: Record<string, number>
  ): Promise<void> {
    try {
      // Get supply data
      const { data: supply, error: supplyError } = await supabase
        .from('rd_supplies')
        .select('*')
        .eq('id', supplyId)
        .single();

      if (supplyError) throw supplyError;

      // Get subcomponents for this business year
      const { data: subcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          *,
          research_activity:rd_research_activities (
            id,
            name
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

      if (subError) throw subError;

      // Delete existing expense records for this supply
      await supabase
        .from('rd_expenses')
        .delete()
        .eq('supply_id', supplyId)
        .eq('business_year_id', businessYearId);

      // Create expense records for each subcomponent
      const expenseRecords: Partial<RDExpense>[] = [];

      for (const subcomponent of subcomponents || []) {
        const allocationPercent = subcomponentAllocations[subcomponent.subcomponent_id] || 0;
        
        if (allocationPercent > 0) {
          const stepPercent = subcomponent.step?.time_percentage || 0;
          const freqPercent = subcomponent.frequency_percentage || 0;
          const yearPercent = subcomponent.year_percentage || 0;
          
          const appliedPercent = (stepPercent / 100) * (freqPercent / 100) * (yearPercent / 100) * (allocationPercent / 100) * 100;

          expenseRecords.push({
            business_year_id: businessYearId,
            research_activity_id: subcomponent.research_activity_id,
            step_id: subcomponent.step_id,
            subcomponent_id: subcomponent.subcomponent_id,
            supply_id: supplyId,
            category: 'Supply',
            supply_name: supply.name,
            research_activity_title: subcomponent.research_activity?.name || '',
            research_activity_practice_percent: 100, // Supplies typically get full practice percentage
            step_name: subcomponent.step?.name || '',
            subcomponent_title: subcomponent.subcomponent?.name || '',
            subcomponent_year_percent: yearPercent,
            subcomponent_frequency_percent: freqPercent,
            subcomponent_time_percent: stepPercent,
            total_cost: supply.total_cost,
            applied_percent: appliedPercent,
            baseline_applied_percent: appliedPercent
          });
        }
      }

      // Insert expense records
      if (expenseRecords.length > 0) {
        const { error } = await supabase
          .from('rd_expenses')
          .insert(expenseRecords);

        if (error) throw error;
      }

      console.log(`Created ${expenseRecords.length} expense records for supply ${supply.name}`);
    } catch (error) {
      console.error('Error creating supply expenses:', error);
      throw error;
    }
  }

  // Get all expenses for a business year
  static async getExpenses(businessYearId: string): Promise<RDExpense[]> {
    try {
      const { data, error } = await supabase
        .from('rd_expenses')
        .select('*')
        .eq('business_year_id', businessYearId)
        .order('category', { ascending: true })
        .order('research_activity_title', { ascending: true })
        .order('step_name', { ascending: true })
        .order('subcomponent_title', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  // Get contractors for a business year
  static async getContractors(businessYearId: string): Promise<RDContractor[]> {
    try {
      const { data, error } = await supabase
        .from('rd_contractors')
        .select('*')
        .eq('business_year_id', businessYearId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contractors:', error);
      throw error;
    }
  }

  // Get supplies for a business year
  static async getSupplies(businessYearId: string): Promise<RDSupply[]> {
    try {
      const { data, error } = await supabase
        .from('rd_supplies')
        .select('*')
        .eq('business_year_id', businessYearId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching supplies:', error);
      throw error;
    }
  }

  // Calculate total QRE for a business year
  static async calculateTotalQRE(businessYearId: string): Promise<number> {
    try {
      const expenses = await this.getExpenses(businessYearId);
      
      let totalQRE = 0;
      for (const expense of expenses) {
        const expenseQRE = (expense.total_cost * expense.applied_percent) / 100;
        totalQRE += expenseQRE;
      }

      return totalQRE;
    } catch (error) {
      console.error('Error calculating total QRE:', error);
      throw error;
    }
  }

  // Export expenses to CSV format
  static async exportExpensesToCSV(businessYearId: string): Promise<string> {
    try {
      const expenses = await this.getExpenses(businessYearId);
      
      const headers = [
        'Year',
        'Research Activity Title',
        'Research Activity Practice Percent',
        'Step',
        'Subcomponent Title',
        'Subcomponent Year %',
        'Subcomponent Frequency %',
        'Subcomponent Time %',
        'First Name',
        'Last Name',
        'Role',
        'Supply Name',
        'Total Cost',
        'Applied Percent',
        'Category'
      ];

      const csvRows = [headers.join(',')];

      for (const expense of expenses) {
        const row = [
          new Date().getFullYear(), // Year
          expense.research_activity_title,
          expense.research_activity_practice_percent,
          expense.step_name,
          expense.subcomponent_title,
          expense.subcomponent_year_percent,
          expense.subcomponent_frequency_percent,
          expense.subcomponent_time_percent,
          expense.first_name || '',
          expense.last_name || '',
          expense.role_name || '',
          expense.supply_name || '',
          expense.total_cost,
          expense.applied_percent,
          expense.category
        ];

        csvRows.push(row.join(','));
      }

      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting expenses to CSV:', error);
      throw error;
    }
  }
} 