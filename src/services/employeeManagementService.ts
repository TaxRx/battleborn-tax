import { supabase } from '../lib/supabase';
import { EmployeeSubcomponent, EmployeeWithSubcomponents } from '../types/researchDesign';

export class EmployeeManagementService {
  
  // Get all employees for a business with their roles
  static async getEmployeesWithRoles(businessYearId: string): Promise<EmployeeWithSubcomponents[]> {
    try {
      console.log('🔍 EmployeeManagementService.getEmployeesWithRoles - Starting query for businessYearId:', businessYearId);
      
      // Query employees directly and join with their year data and roles
      const { data, error } = await supabase
        .from('rd_employees')
        .select(`
          id,
          business_id,
          first_name,
          last_name,
          annual_wage,
          is_owner,
          role_id,
          created_at,
          updated_at,
          role:rd_roles (
            id,
            name
          ),
          employee_year_data:rd_employee_year_data (
            id,
            business_year_id,
            applied_percent,
            calculated_qre,
            activity_roles
          )
        `)
        .eq('employee_year_data.business_year_id', businessYearId)
        .order('first_name');

      if (error) {
        console.error('❌ EmployeeManagementService.getEmployeesWithRoles - Query error:', error);
        throw error;
      }
      
      console.log('✅ EmployeeManagementService.getEmployeesWithRoles - Query successful, data:', data);
      return data || [];
    } catch (error) {
      console.error('❌ EmployeeManagementService.getEmployeesWithRoles - Error:', error);
      throw error;
    }
  }

  // Get employee subcomponents for a specific business year
  static async getEmployeeSubcomponents(employeeId: string, businessYearId: string): Promise<EmployeeSubcomponent[]> {
    try {
      console.log('🔍 EmployeeManagementService.getEmployeeSubcomponents - Starting query for employeeId:', employeeId, 'businessYearId:', businessYearId);
      
      const { data, error } = await supabase
        .from('rd_employee_subcomponents')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('❌ EmployeeManagementService.getEmployeeSubcomponents - Query error:', error);
        throw error;
      }
      
      console.log('✅ EmployeeManagementService.getEmployeeSubcomponents - Query successful, data:', data);
      return data || [];
    } catch (error) {
      console.error('❌ EmployeeManagementService.getEmployeeSubcomponents - Error:', error);
      throw error;
    }
  }

  // Calculate baseline time percentages for an employee based on their roles
  static async calculateBaselinePercentages(
    employeeId: string, 
    businessYearId: string,
    selectedRoles: string[]
  ): Promise<EmployeeSubcomponent[]> {
    try {
      console.log('🔍 EmployeeManagementService.calculateBaselinePercentages - Starting calculation for employeeId:', employeeId, 'businessYearId:', businessYearId, 'selectedRoles:', selectedRoles);
      
      // Get all selected subcomponents for this business year
      const { data: selectedSubcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          *,
          step:rd_research_steps (
            id,
            name,
            time_percentage
          )
        `)
        .eq('business_year_id', businessYearId);

      if (subError) {
        console.error('❌ EmployeeManagementService.calculateBaselinePercentages - Error fetching selected subcomponents:', subError);
        throw subError;
      }

      console.log('✅ EmployeeManagementService.calculateBaselinePercentages - Selected subcomponents loaded:', selectedSubcomponents);

      // Get employee info
      const { data: employee, error: empError } = await supabase
        .from('rd_employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (empError) {
        console.error('❌ EmployeeManagementService.calculateBaselinePercentages - Error fetching employee:', empError);
        throw empError;
      }

      console.log('✅ EmployeeManagementService.calculateBaselinePercentages - Employee loaded:', employee);

      const baselineSubcomponents: EmployeeSubcomponent[] = [];

      for (const subcomponent of selectedSubcomponents || []) {
        // Check if this subcomponent has any of the employee's roles
        const hasMatchingRole = subcomponent.selected_roles?.some(roleId => 
          selectedRoles.includes(roleId)
        );

        if (hasMatchingRole) {
          // Calculate baseline time percentage
          const stepTimePercent = subcomponent.step?.time_percentage || 0;
          const baselineTimePercent = stepTimePercent; // This is the baseline from the step

          baselineSubcomponents.push({
            id: '', // Will be set when saved
            employee_id: employeeId,
            business_year_id: businessYearId,
            subcomponent_id: subcomponent.subcomponent_id,
            step_id: subcomponent.step_id,
            research_activity_id: subcomponent.research_activity_id,
            employee_time_percentage: baselineTimePercent, // Initially same as baseline
            baseline_time_percentage: baselineTimePercent,
            is_included: true,
            notes: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      console.log('✅ EmployeeManagementService.calculateBaselinePercentages - Baseline subcomponents calculated:', baselineSubcomponents);
      return baselineSubcomponents;
    } catch (error) {
      console.error('❌ EmployeeManagementService.calculateBaselinePercentages - Error:', error);
      throw error;
    }
  }

  // Assign roles to an employee and create baseline subcomponent entries
  static async assignRolesToEmployee(
    employeeId: string,
    businessYearId: string,
    roleIds: string[]
  ): Promise<void> {
    try {
      console.log('🔍 EmployeeManagementService.assignRolesToEmployee - Starting assignment for employeeId:', employeeId, 'businessYearId:', businessYearId, 'roleIds:', roleIds);
      
      // Update the employee's primary role (use the first role for now)
      if (roleIds.length > 0) {
        const { error: updateError } = await supabase
          .from('rd_employees')
          .update({ role_id: roleIds[0] })
          .eq('id', employeeId);

        if (updateError) {
          console.error('❌ EmployeeManagementService.assignRolesToEmployee - Error updating employee role:', updateError);
          throw updateError;
        }
        console.log('✅ EmployeeManagementService.assignRolesToEmployee - Employee role updated successfully');
      }

      // Create baseline subcomponent entries for the employee
      await this.createBaselineSubcomponentEntries(employeeId, businessYearId, roleIds);
      console.log('✅ EmployeeManagementService.assignRolesToEmployee - Assignment completed successfully');
    } catch (error) {
      console.error('❌ EmployeeManagementService.assignRolesToEmployee - Error:', error);
      throw error;
    }
  }

  // Create baseline subcomponent entries for an employee
  static async createBaselineSubcomponentEntries(
    employeeId: string,
    businessYearId: string,
    roleIds: string[] = []
  ): Promise<void> {
    try {
      console.log('🔍 EmployeeManagementService.createBaselineSubcomponentEntries - Starting creation for employeeId:', employeeId, 'businessYearId:', businessYearId, 'roleIds:', roleIds);
      
      // Get all selected subcomponents for this business year
      const { data: subcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select('*')
        .eq('business_year_id', businessYearId);

      if (subError) {
        console.error('❌ EmployeeManagementService.createBaselineSubcomponentEntries - Error fetching subcomponents:', subError);
        throw subError;
      }

      console.log('✅ EmployeeManagementService.createBaselineSubcomponentEntries - Subcomponents loaded:', subcomponents);

      // Filter subcomponents to only include those that match the employee's roles
      const filteredSubcomponents = (subcomponents || []).filter(subcomponent => {
        // If no roles are specified, include all subcomponents
        if (roleIds.length === 0) {
          return true;
        }
        
        // Check if this subcomponent has any of the employee's roles
        const hasMatchingRole = subcomponent.selected_roles?.some(roleId => 
          roleIds.includes(roleId)
        );
        
        return hasMatchingRole;
      });

      console.log('🔧 EmployeeManagementService.createBaselineSubcomponentEntries - Filtered subcomponents:', filteredSubcomponents);

      // Create baseline entries for each filtered subcomponent using actual percentages from rd_selected_subcomponents
      const baselineEntries = filteredSubcomponents.map(subcomponent => {
        const time_percentage = subcomponent.time_percentage || 0;
        const practice_percentage = subcomponent.practice_percent || 0;
        const year_percentage = subcomponent.year_percentage || 0;
        const frequency_percentage = subcomponent.frequency_percentage || 0;
        const applied_percentage = (practice_percentage * time_percentage * year_percentage * frequency_percentage) / 1000000;
        const baseline_applied_percent = subcomponent.applied_percentage || applied_percentage;
        const baseline_time_percentage = time_percentage;
        const baseline_practice_percentage = practice_percentage;
        return {
          employee_id: employeeId,
          business_year_id: businessYearId,
          subcomponent_id: subcomponent.subcomponent_id,
          time_percentage,
          applied_percentage,
          is_included: true,
          baseline_applied_percent,
          practice_percentage,
          year_percentage,
          frequency_percentage,
          baseline_practice_percentage,
          baseline_time_percentage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      console.log('🔧 EmployeeManagementService.createBaselineSubcomponentEntries - Baseline entries to create:', baselineEntries);

      if (baselineEntries.length > 0) {
        const { error } = await supabase
          .from('rd_employee_subcomponents')
          .insert(baselineEntries);

        if (error) {
          console.error('❌ EmployeeManagementService.createBaselineSubcomponentEntries - Error inserting baseline entries:', error);
          throw error;
        }
        console.log('✅ EmployeeManagementService.createBaselineSubcomponentEntries - Baseline entries created successfully');
      } else {
        console.log('⚠️ EmployeeManagementService.createBaselineSubcomponentEntries - No baseline entries to create');
      }
    } catch (error) {
      console.error('❌ EmployeeManagementService.createBaselineSubcomponentEntries - Error:', error);
      throw error;
    }
  }

  // Update employee subcomponent
  static async updateEmployeeSubcomponent(
    employeeId: string,
    subcomponentId: string,
    businessYearId: string,
    updates: Partial<EmployeeSubcomponent>
  ): Promise<void> {
    try {
      console.log('🔍 EmployeeManagementService.updateEmployeeSubcomponent - Starting update for employeeId:', employeeId, 'subcomponentId:', subcomponentId, 'businessYearId:', businessYearId, 'updates:', updates);
      
      const { error } = await supabase
        .from('rd_employee_subcomponents')
        .update(updates)
        .eq('employee_id', employeeId)
        .eq('subcomponent_id', subcomponentId)
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('❌ EmployeeManagementService.updateEmployeeSubcomponent - Error updating subcomponent:', error);
        throw error;
      }
      
      console.log('✅ EmployeeManagementService.updateEmployeeSubcomponent - Update completed successfully');
    } catch (error) {
      console.error('❌ EmployeeManagementService.updateEmployeeSubcomponent - Error:', error);
      throw error;
    }
  }

  // Get all roles for a business year
  static async getRoles(businessYearId: string): Promise<any[]> {
    try {
      console.log('🔍 EmployeeManagementService.getRoles - Starting query for businessYearId:', businessYearId);
      
      const { data, error } = await supabase
        .from('rd_roles')
        .select('*')
        .eq('business_year_id', businessYearId)
        .order('name');

      if (error) {
        console.error('❌ EmployeeManagementService.getRoles - Query error:', error);
        throw error;
      }
      
      console.log('✅ EmployeeManagementService.getRoles - Query successful, data:', data);
      return data || [];
    } catch (error) {
      console.error('❌ EmployeeManagementService.getRoles - Error:', error);
      throw error;
    }
  }

  // Get employee with all their subcomponent data for a business year
  static async getEmployeeWithSubcomponents(
    employeeId: string,
    businessYearId: string
  ): Promise<EmployeeWithSubcomponents | null> {
    try {
      console.log('🔍 EmployeeManagementService.getEmployeeWithSubcomponents - Starting query for employeeId:', employeeId, 'businessYearId:', businessYearId);
      
      // Get employee with role
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

      if (empError) {
        console.error('❌ EmployeeManagementService.getEmployeeWithSubcomponents - Error fetching employee:', empError);
        throw empError;
      }

      console.log('✅ EmployeeManagementService.getEmployeeWithSubcomponents - Employee loaded:', employee);

      // Get employee subcomponents
      const subcomponents = await this.getEmployeeSubcomponents(employeeId, businessYearId);

      const result = {
        ...employee,
        subcomponents
      };
      
      console.log('✅ EmployeeManagementService.getEmployeeWithSubcomponents - Final result:', result);
      return result;
    } catch (error) {
      console.error('❌ EmployeeManagementService.getEmployeeWithSubcomponents - Error:', error);
      throw error;
    }
  }

  // Calculate total QRE for an employee
  static async calculateEmployeeQRE(employeeId: string, businessYearId: string): Promise<number> {
    try {
      console.log('🔍 EmployeeManagementService.calculateEmployeeQRE - Starting calculation for employeeId:', employeeId, 'businessYearId:', businessYearId);
      
      const employee = await this.getEmployeeWithSubcomponents(employeeId, businessYearId);
      if (!employee) {
        console.log('⚠️ EmployeeManagementService.calculateEmployeeQRE - Employee not found');
        return 0;
      }

      let totalQRE = 0;
      const annualWage = employee.annual_wage || 0;

      console.log('💰 EmployeeManagementService.calculateEmployeeQRE - Calculating QRE with annualWage:', annualWage);

      for (const subcomponent of employee.subcomponents || []) {
        if (subcomponent.is_included) {
          // Calculate QRE for this subcomponent
          const timePercentage = subcomponent.employee_time_percentage / 100;
          const subcomponentQRE = annualWage * timePercentage;
          totalQRE += subcomponentQRE;
          
          console.log('📊 EmployeeManagementService.calculateEmployeeQRE - Subcomponent calculation:', {
            subcomponentId: subcomponent.subcomponent_id,
            timePercentage,
            subcomponentQRE,
            runningTotal: totalQRE
          });
        }
      }

      console.log('✅ EmployeeManagementService.calculateEmployeeQRE - Final total QRE:', totalQRE);
      return totalQRE;
    } catch (error) {
      console.error('❌ EmployeeManagementService.calculateEmployeeQRE - Error:', error);
      throw error;
    }
  }
} 