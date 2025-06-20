import { supabase } from '../lib/supabase';
import { Employee } from '../types';

export const getEmployeesForBusiness = async (businessId: string) => {
  return await supabase
    .from('employees')
    .select('*')
    .eq('business_id', businessId);
};

export const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
  return await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();
};

export const updateEmployee = async (id: string, updates: Partial<Employee>) => {
  return await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

export const deleteEmployee = async (id: string) => {
  return await supabase
    .from('employees')
    .delete()
    .eq('id', id);
};

export const updateEmployeeActivityPercentage = async (
  employeeId: string,
  year: number,
  activityId: string,
  percentage: number
) => {
  return await supabase
    .from('employee_activities')
    .upsert({
      employee_id: employeeId,
      year,
      activity_id: activityId,
      percentage
    })
    .select()
    .single();
};

export const updateEmployeeSubcomponentPercentage = async (
  employeeId: string,
  year: number,
  activityId: string,
  subcomponentId: string,
  percentage: number
) => {
  return await supabase
    .from('employee_subcomponents')
    .upsert({
      employee_id: employeeId,
      year,
      activity_id: activityId,
      subcomponent_id: subcomponentId,
      percentage
    })
    .select()
    .single();
}; 