import { supabase, handleSupabaseError, isDemoMode } from '../utils/supabaseClient';
import { demoEmployees } from '../data/demoSeed';

export interface Employee {
  id: string;
  name: string;
  role: string;
  annualWage: number;
  isBusinessOwner: boolean;
  annual_wage: number;
  is_business_owner: boolean;
  yearly_activities: {
    [year: number]: {
      [activityId: string]: {
        percentage: number;
        isSelected: boolean;
        subcomponents: {
          [subcomponentId: string]: {
            percentage: number;
            isSelected: boolean;
            roleDescription?: string;
          };
        };
      };
    };
  };
  [key: string]: any; // Allow index signature for dynamic properties
  business_id: string;
  created_at: string;
  updated_at: string;
}

export async function getEmployeesForBusiness(businessId: string) {
  if (isDemoMode()) {
    return { data: demoEmployees.filter(e => e.business_id === businessId) };
  }
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('business_id', businessId);
    if (error) throw error;
    return { data };
  } catch (error) {
    handleSupabaseError(error);
  }
}

export async function createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
  if (isDemoMode()) {
    const newEmployee: Employee = {
      id: Math.random().toString(),
      name: employee.name,
      role: employee.role,
      annualWage: employee.annualWage,
      isBusinessOwner: employee.isBusinessOwner,
      annual_wage: employee.annualWage,
      is_business_owner: employee.isBusinessOwner,
      yearly_activities: {},
      business_id: employee.business_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demoEmployees.push(newEmployee);
    return { data: newEmployee };
  }
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee]);
    if (error) throw error;
    return { data };
  } catch (error) {
    handleSupabaseError(error);
  }
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>) {
  if (isDemoMode()) {
    const idx = demoEmployees.findIndex(e => e.id === employeeId);
    if (idx !== -1) Object.assign(demoEmployees[idx], updates);
    return { data: demoEmployees[idx] };
  }
  try {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', employeeId);
    if (error) throw error;
    return { data };
  } catch (error) {
    handleSupabaseError(error);
  }
}

export async function deleteEmployee(employeeId: string) {
  if (isDemoMode()) {
    const idx = demoEmployees.findIndex(e => e.id === employeeId);
    if (idx !== -1) demoEmployees.splice(idx, 1);
    return { data: true };
  }
  try {
    const { data, error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);
    if (error) throw error;
    return { data };
  } catch (error) {
    handleSupabaseError(error);
  }
}

export async function updateEmployeeActivityPercentage(
  employeeId: string,
  year: number,
  activityId: string,
  percentage: number
) {
  if (isDemoMode()) {
    const idx = demoEmployees.findIndex(e => e.id === employeeId);
    if (idx !== -1) {
      const ya = demoEmployees[idx].yearly_activities as Record<number, any>;
      if (!ya[year]) ya[year] = {};
      if (!ya[year][activityId]) ya[year][activityId] = { percentage: 0, isSelected: false, subcomponents: {} };
      ya[year][activityId].percentage = percentage;
      demoEmployees[idx].updated_at = new Date().toISOString();
    }
    return { data: demoEmployees[idx] };
  }
  return await supabase
    .from('employee_activities')
    .upsert({
      employee_id: employeeId,
      year,
      activity_id: activityId,
      percentage,
      updated_at: new Date().toISOString()
    });
}

export async function updateEmployeeSubcomponentPercentage(
  employeeId: string,
  year: number,
  activityId: string,
  subcomponentId: string,
  percentage: number
) {
  if (isDemoMode()) {
    const idx = demoEmployees.findIndex(e => e.id === employeeId);
    if (idx !== -1) {
      const ya = demoEmployees[idx].yearly_activities as Record<number, any>;
      if (!ya[year]) ya[year] = {};
      if (!ya[year][activityId]) ya[year][activityId] = { percentage: 0, isSelected: false, subcomponents: {} };
      if (!ya[year][activityId].subcomponents[subcomponentId]) ya[year][activityId].subcomponents[subcomponentId] = { percentage: 0, isSelected: false };
      ya[year][activityId].subcomponents[subcomponentId].percentage = percentage;
      demoEmployees[idx].updated_at = new Date().toISOString();
    }
    return { data: demoEmployees[idx] };
  }
  return await supabase
    .from('employee_subcomponents')
    .upsert({
      employee_id: employeeId,
      year,
      activity_id: activityId,
      subcomponent_id: subcomponentId,
      percentage,
      updated_at: new Date().toISOString()
    });
} 