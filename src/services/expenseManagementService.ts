import { supabase } from '../lib/supabase';
import { RDExpense, RDContractor, RDSupply, EmployeeWithExpenses } from '../types/researchDesign';

export class ExpenseManagementService {
  
  // Utility function to apply 80% threshold rule (matches display logic)
  private static applyEightyPercentThreshold(appliedPercentage: number): number {
    return appliedPercentage >= 80 ? 100 : appliedPercentage;
  }

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
        const practicePercent = subcomponent.research_activity?.title ? employeePracticePercent : 0;
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
          research_activity_title: subcomponent.research_activity?.title || '',
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
            research_activity_title: subcomponent.research_activity?.title || '',
            research_activity_practice_percent: 100, // Contractors typically get full practice percentage
            step_name: subcomponent.step?.name || '',
            subcomponent_title: subcomponent.subcomponent?.name || '',
            subcomponent_year_percent: yearPercent,
            subcomponent_frequency_percent: freqPercent,
            subcomponent_time_percent: stepPercent,
            total_cost: contractor.amount,
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

      console.log(`Created ${expenseRecords.length} expense records for contractor ${contractor.first_name} ${contractor.last_name}`);
    } catch (error) {
      console.error('Error creating contractor expenses:', error);
      throw error;
    }
  }

  // NEW METHOD: Save contractor data to rd_contractor_year_data table
  static async saveContractorYearData(
    businessYearId: string,
    contractorName: string,
    costAmount: number,
    appliedPercent: number,
    activityLink: any[] = [],
    contractorId?: string,
    userId?: string
  ): Promise<string> {
    try {
      // Calculate QRE using 80% threshold rule
      const effectivePercent = this.applyEightyPercentThreshold(appliedPercent);
      const calculatedQre = (costAmount * effectivePercent) / 100;

      const contractorData = {
        business_year_id: businessYearId,
        name: contractorName,
        cost_amount: costAmount,
        applied_percent: appliedPercent,
        activity_link: activityLink, // jsonb field for activity associations
        contractor_id: contractorId || null,
        user_id: userId || null,
        calculated_qre: calculatedQre,
        activity_roles: null // jsonb field, can be populated later if needed
      };

      const { data, error } = await supabase
        .from('rd_contractor_year_data')
        .insert(contractorData)
        .select('id')
        .single();

      if (error) throw error;

      console.log(`✅ Saved contractor data to rd_contractor_year_data: ${contractorName} - $${costAmount} (${appliedPercent}%)`);
      return data.id;
    } catch (error) {
      console.error('❌ Error saving contractor to rd_contractor_year_data:', error);
      throw error;
    }
  }

  // NEW METHOD: Update contractor data in rd_contractor_year_data table  
  static async updateContractorYearData(
    contractorYearDataId: string,
    updates: {
      name?: string;
      costAmount?: number;
      appliedPercent?: number;
      activityLink?: any[];
      contractorId?: string;
    }
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.costAmount !== undefined) updateData.cost_amount = updates.costAmount;
      if (updates.appliedPercent !== undefined) {
        updateData.applied_percent = updates.appliedPercent;
        // Recalculate QRE if cost or percent changed
        if (updates.costAmount !== undefined) {
          const effectivePercent = this.applyEightyPercentThreshold(updates.appliedPercent);
          updateData.calculated_qre = (updates.costAmount * effectivePercent) / 100;
        }
      }
      if (updates.activityLink !== undefined) updateData.activity_link = updates.activityLink;
      if (updates.contractorId !== undefined) updateData.contractor_id = updates.contractorId;

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('rd_contractor_year_data')
        .update(updateData)
        .eq('id', contractorYearDataId);

      if (error) throw error;

      console.log(`✅ Updated contractor data in rd_contractor_year_data: ${contractorYearDataId}`);
    } catch (error) {
      console.error('❌ Error updating contractor in rd_contractor_year_data:', error);
      throw error;
    }
  }

  // NEW METHOD: Get contractor data from rd_contractor_year_data table
  static async getContractorYearData(businessYearId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('rd_contractor_year_data')
        .select(`
          id,
          business_year_id,
          name,
          cost_amount,
          applied_percent,
          activity_link,
          contractor_id,
          user_id,
          activity_roles,
          calculated_qre,
          created_at,
          updated_at
        `)
        .eq('business_year_id', businessYearId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching contractor year data:', error);
      throw error;
    }
  }

  // NEW METHOD: Delete contractor data from rd_contractor_year_data table
  static async deleteContractorYearData(contractorYearDataId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_contractor_year_data')
        .delete()
        .eq('id', contractorYearDataId);

      if (error) throw error;

      console.log(`✅ Deleted contractor data from rd_contractor_year_data: ${contractorYearDataId}`);
    } catch (error) {
      console.error('❌ Error deleting contractor from rd_contractor_year_data:', error);
      throw error;
    }
  }

  // NEW METHODS: Supply data management for rd_supply_year_data table
  
  // Save supply data to rd_supply_year_data table
  static async saveSupplyYearData(
    businessYearId: string,
    supplyName: string,
    costAmount: number,
    appliedPercent: number,
    activityLink: any[] = [],
    supplyId?: string,
    userId?: string
  ): Promise<string> {
    try {
      // Calculate QRE using 80% threshold rule
      const effectivePercent = this.applyEightyPercentThreshold(appliedPercent);
      const calculatedQre = (costAmount * effectivePercent) / 100;

      const supplyData = {
        business_year_id: businessYearId,
        name: supplyName,
        cost_amount: costAmount,
        applied_percent: appliedPercent,
        activity_link: activityLink, // jsonb field for activity associations
        supply_id: supplyId || null,
        user_id: userId || null,
        calculated_qre: calculatedQre,
        activity_roles: null // jsonb field, can be populated later if needed
      };

      const { data, error } = await supabase
        .from('rd_supply_year_data')
        .insert(supplyData)
        .select('id')
        .single();

      if (error) throw error;

      console.log(`✅ Saved supply data to rd_supply_year_data: ${supplyName} - $${costAmount} (${appliedPercent}%)`);
      return data.id;
    } catch (error) {
      console.error('❌ Error saving supply to rd_supply_year_data:', error);
      throw error;
    }
  }

  // Update supply data in rd_supply_year_data table  
  static async updateSupplyYearData(
    supplyYearDataId: string,
    updates: {
      name?: string;
      costAmount?: number;
      appliedPercent?: number;
      activityLink?: any[];
      supplyId?: string;
    }
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.costAmount !== undefined) updateData.cost_amount = updates.costAmount;
      if (updates.appliedPercent !== undefined) {
        updateData.applied_percent = updates.appliedPercent;
        // Recalculate QRE if cost or percent changed
        if (updates.costAmount !== undefined) {
          const effectivePercent = this.applyEightyPercentThreshold(updates.appliedPercent);
          updateData.calculated_qre = (updates.costAmount * effectivePercent) / 100;
        }
      }
      if (updates.activityLink !== undefined) updateData.activity_link = updates.activityLink;
      if (updates.supplyId !== undefined) updateData.supply_id = updates.supplyId;

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('rd_supply_year_data')
        .update(updateData)
        .eq('id', supplyYearDataId);

      if (error) throw error;

      console.log(`✅ Updated supply data in rd_supply_year_data: ${supplyYearDataId}`);
    } catch (error) {
      console.error('❌ Error updating supply in rd_supply_year_data:', error);
      throw error;
    }
  }

  // Get supply data from rd_supply_year_data table
  static async getSupplyYearData(businessYearId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('rd_supply_year_data')
        .select(`
          id,
          business_year_id,
          name,
          cost_amount,
          applied_percent,
          activity_link,
          supply_id,
          user_id,
          activity_roles,
          calculated_qre,
          created_at,
          updated_at
        `)
        .eq('business_year_id', businessYearId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching supply year data:', error);
      throw error;
    }
  }

  // Delete supply data from rd_supply_year_data table
  static async deleteSupplyYearData(supplyYearDataId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_supply_year_data')
        .delete()
        .eq('id', supplyYearDataId);

      if (error) throw error;

      console.log(`✅ Deleted supply data from rd_supply_year_data: ${supplyYearDataId}`);
    } catch (error) {
      console.error('❌ Error deleting supply from rd_supply_year_data:', error);
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
            research_activity_title: subcomponent.research_activity?.title || '',
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
        .select(`
          *,
          role:rd_roles(name)
        `)
        .order('last_name', { ascending: true });

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
      console.log('📊 ExpenseManagementService - Starting CSV export for business year:', businessYearId);
      
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
      const selectedYear = businessYear.year;
      console.log('📊 Using business_id:', businessId, 'selected year:', selectedYear);
      
      // Get all business years for this business
      const { data: allBusinessYears, error: yearsError } = await supabase
        .from('rd_business_years')
        .select('id, year')
        .eq('business_id', businessId)
        .order('year');

      if (yearsError) {
        console.error('❌ Error fetching business years:', yearsError);
        throw yearsError;
      }

      // Get all selected subcomponents for all years
      const { data: allSubcomponents, error: subError } = await supabase
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
          ),
          business_year:rd_business_years (
            id,
            year
          )
        `)
        .in('business_year_id', allBusinessYears?.map(by => by.id) || []);

      if (subError) {
        console.error('❌ Error fetching subcomponents:', subError);
        throw subError;
      }

      // Get all employees for this business
      const { data: allEmployees, error: employeesError } = await supabase
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
      const { data: allContractors, error: contractorsError } = await supabase
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
      const { data: allSupplies, error: suppliesError } = await supabase
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

      console.log('📊 CSV Export Data:', {
        subcomponents: allSubcomponents?.length || 0,
        employees: allEmployees?.length || 0,
        contractors: allContractors?.length || 0,
        supplies: allSupplies?.length || 0,
        years: allBusinessYears?.length || 0
      });

      // Define CSV headers based on the original structure
      const headers = [
        'Subcomponent',
        'Research Activity',
        'Step',
        'Year',
        'Category',
        'Name',
        'First Name',
        'Last Name',
        'Role',
        'Annual Wage/Cost',
        'Subcomponent Year %',
        'Subcomponent Frequency %',
        'Subcomponent Time %',
        'Practice %',
        'Time %',
        'Applied %',
        'Applied Dollar Amount',
        'Baseline Applied %',
        'Baseline Practice %',
        'Baseline Time %',
        'Calculated QRE',
        'Is Owner'
      ];

      const csvRows = [headers.join(',')];

      // Create rows for each subcomponent-expense combination
      for (const subcomponent of allSubcomponents || []) {
        const subcomponentName = subcomponent.subcomponent?.name || '';
        const researchActivityName = subcomponent.research_activity?.title || '';
        const stepName = subcomponent.step?.name || '';
        const year = subcomponent.business_year?.year || '';
        const businessYearId = subcomponent.business_year_id;

        // Add employee rows for this subcomponent
        for (const employee of allEmployees || []) {
          const employeeSubcomponent = employee.subcomponents?.find(
            sub => sub.subcomponent_id === subcomponent.subcomponent_id && 
                   sub.business_year_id === businessYearId
          );

          if (employeeSubcomponent) {
            const annualWage = employee.annual_wage || 0;
            const originalAppliedPercentage = employeeSubcomponent.applied_percentage || 0;
            // Apply 80% threshold rule for QRE calculation
            const qreAppliedPercentage = this.applyEightyPercentThreshold(originalAppliedPercentage);
            const appliedDollarAmount = Math.round((annualWage * qreAppliedPercentage) / 100);
            const calculatedQRE = appliedDollarAmount;

            console.log('🧮 [CSV Export] Employee calculation:', {
              name: `${employee.first_name} ${employee.last_name}`,
              annual_wage: annualWage,
              original_applied_percentage: originalAppliedPercentage,
              qre_applied_percentage_with_80_threshold: qreAppliedPercentage,
              applied_dollar_amount: appliedDollarAmount,
              calculated_qre: calculatedQRE,
              calculation_method: 'Math.round(wage * (applied_percentage >= 80 ? 100 : applied_percentage) / 100)'
            });

            const row = [
              subcomponentName,
              researchActivityName,
              stepName,
              year,
              'Employee',
              `${employee.first_name} ${employee.last_name}`.trim(),
              employee.first_name || '',
              employee.last_name || '',
              employee.role?.name || '',
              annualWage,
              subcomponent.year_percentage || 0,
              subcomponent.frequency_percentage || 0,
              subcomponent.time_percentage || 0,
              employeeSubcomponent.practice_percentage || 0,
              employeeSubcomponent.time_percentage || 0,
              employeeSubcomponent.applied_percentage || 0,
              appliedDollarAmount,
              employeeSubcomponent.baseline_applied_percent || 0,
              employeeSubcomponent.baseline_practice_percentage || 0,
              employeeSubcomponent.baseline_time_percentage || 0,
              calculatedQRE,
              employee.is_owner ? 'Yes' : 'No'
            ];

            csvRows.push(row.join(','));
          }
        }

        // Add contractor rows for this subcomponent
        for (const contractor of allContractors || []) {
          const contractorSubcomponent = contractor.subcomponents?.find(
            sub => sub.subcomponent_id === subcomponent.subcomponent_id && 
                   sub.business_year_id === businessYearId
          );

          if (contractorSubcomponent) {
            const annualCost = contractor.amount || 0;
            const originalAppliedPercentage = contractorSubcomponent.applied_percentage || 0;
            // Apply 80% threshold rule for contractor calculation
            const qreAppliedPercentage = this.applyEightyPercentThreshold(originalAppliedPercentage);
            const appliedDollarAmount = Math.round((annualCost * qreAppliedPercentage) / 100);
            // Calculate QRE (65% reduction for contractors)
            const calculatedQRE = Math.round(appliedDollarAmount * 0.65);

            console.log('🧮 [CSV Export] Contractor calculation:', {
              name: `${contractor.first_name} ${contractor.last_name}`,
              annual_cost: annualCost,
              original_applied_percentage: originalAppliedPercentage,
              qre_applied_percentage_with_80_threshold: qreAppliedPercentage,
              applied_dollar_amount: appliedDollarAmount,
              calculated_qre_with_65_percent: calculatedQRE,
              calculation_method: 'Math.round(Math.round(cost * (applied_percentage >= 80 ? 100 : applied_percentage) / 100) * 0.65)'
            });

            const row = [
              subcomponentName,
              researchActivityName,
              stepName,
              year,
              'Contractor',
              `${contractor.first_name} ${contractor.last_name}`.trim(),
              contractor.first_name || '',
              contractor.last_name || '',
              contractor.role?.name || '',
              annualCost,
              subcomponent.year_percentage || 0,
              subcomponent.frequency_percentage || 0,
              subcomponent.time_percentage || 0,
              contractorSubcomponent.practice_percentage || 0,
              contractorSubcomponent.time_percentage || 0,
              contractorSubcomponent.applied_percentage || 0,
              appliedDollarAmount,
              contractorSubcomponent.baseline_applied_percent || 0,
              contractorSubcomponent.baseline_practice_percentage || 0,
              contractorSubcomponent.baseline_time_percentage || 0,
              calculatedQRE,
              contractor.is_owner ? 'Yes' : 'No'
            ];

            csvRows.push(row.join(','));
          }
        }

        // Add supply rows for this subcomponent
        for (const supply of allSupplies || []) {
          const supplySubcomponent = supply.subcomponents?.find(
            sub => sub.subcomponent_id === subcomponent.subcomponent_id && 
                   sub.business_year_id === businessYearId
          );

          if (supplySubcomponent) {
            const annualCost = supply.annual_cost || 0;
            const appliedDollarAmount = Math.round(supplySubcomponent.amount_applied || 0);
            const calculatedQRE = appliedDollarAmount;

            const row = [
              subcomponentName,
              researchActivityName,
              stepName,
              year,
              'Supply',
              supply.name || '',
              '', // No first name for supplies
              '', // No last name for supplies
              '', // No role for supplies
              annualCost,
              subcomponent.year_percentage || 0,
              subcomponent.frequency_percentage || 0,
              subcomponent.time_percentage || 0,
              0, // Supplies don't have practice_percentage
              0, // Supplies don't have time_percentage
              supplySubcomponent.applied_percentage || 0,
              appliedDollarAmount,
              0, // Supplies don't have baseline_applied_percent
              0, // Supplies don't have baseline_practice_percentage
              0, // Supplies don't have baseline_time_percentage
              calculatedQRE,
              'No' // Supplies are never owners
            ];

            csvRows.push(row.join(','));
          }
        }
      }

      const csvContent = csvRows.join('\n');
      console.log('✅ CSV Export completed successfully');
      return csvContent;
    } catch (error) {
      console.error('❌ Error exporting expenses to CSV:', error);
      throw error;
    }
  }
} 