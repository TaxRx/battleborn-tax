import { supabase } from '../../../lib/supabase';

export interface RDSelectedActivity {
  id: string;
  business_year_id: string;
  activity_id: string;
  practice_percent: number;
  selected_roles: string[];
  config: any;
  created_at: string;
  updated_at: string;
}

export interface RDSelectedSubcomponent {
  id: string;
  business_year_id: string;
  subcomponent_id: string;
  frequency_percentage: number;
  year_percentage: number;
  start_year: number;
  start_month: number;
  selected_roles: string[];
  applied_percentage: number;
  time_percentage?: number;
  step_name?: string;
  general_description?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  uncertainties?: string;
  developmental_process?: string;
  primary_goal?: string;
  expected_outcome_type?: string;
  cpt_codes?: string;
  cdt_codes?: string;
  alternative_paths?: string;
  created_at: string;
  updated_at: string;
}

export interface RDEmployee {
  id: string;
  business_id: string;
  name: string;
  role_id: string;
  is_owner: boolean;
  annual_wage: number;
  created_at: string;
  updated_at: string;
}

export interface RDEmployeeYearData {
  id: string;
  employee_id: string;
  business_year_id: string;
  applied_percent: number;
  calculated_qre: number;
  activity_roles: any;
  created_at: string;
  updated_at: string;
}

export interface RDSupplyYearData {
  id: string;
  business_year_id: string;
  name: string;
  cost_amount: number;
  applied_percent: number;
  activity_link: any;
  created_at: string;
  updated_at: string;
}

export interface RDContractorYearData {
  id: string;
  business_year_id: string;
  name: string;
  cost_amount: number;
  applied_percent: number;
  activity_link: any;
  created_at: string;
  updated_at: string;
}

export interface RDReport {
  id: string;
  business_id?: string;
  business_year_id?: string;
  type: string;
  generated_text: string;
  editable_text?: string;
  ai_version: string;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export class UnifiedRDService {
  // Selected Activities
  static async getSelectedActivities(businessYearId: string): Promise<RDSelectedActivity[]> {
    try {
      const { data, error } = await supabase
        .from('rd_selected_activities')
        .select('*')
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('Error fetching selected activities:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSelectedActivities:', error);
      throw error;
    }
  }

  static async saveSelectedActivity(activity: Partial<RDSelectedActivity>): Promise<RDSelectedActivity> {
    try {
      if (activity.id) {
        // Update existing
        const { data, error } = await supabase
          .from('rd_selected_activities')
          .update(activity)
          .eq('id', activity.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating selected activity:', error);
          throw error;
        }

        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('rd_selected_activities')
          .insert(activity)
          .select()
          .single();

        if (error) {
          console.error('Error creating selected activity:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in saveSelectedActivity:', error);
      throw error;
    }
  }

  static async deleteSelectedActivity(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_selected_activities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting selected activity:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteSelectedActivity:', error);
      throw error;
    }
  }

  // Selected Subcomponents
  static async getSelectedSubcomponents(businessYearId: string): Promise<RDSelectedSubcomponent[]> {
    try {
      const { data, error } = await supabase
        .from('rd_selected_subcomponents')
        .select('*')
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('Error fetching selected subcomponents:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSelectedSubcomponents:', error);
      throw error;
    }
  }

  static async saveSelectedSubcomponent(subcomponent: Partial<RDSelectedSubcomponent>): Promise<RDSelectedSubcomponent> {
    try {
      if (subcomponent.id) {
        // Update existing
        const { data, error } = await supabase
          .from('rd_selected_subcomponents')
          .update(subcomponent)
          .eq('id', subcomponent.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating selected subcomponent:', error);
          throw error;
        }

        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('rd_selected_subcomponents')
          .insert(subcomponent)
          .select()
          .single();

        if (error) {
          console.error('Error creating selected subcomponent:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in saveSelectedSubcomponent:', error);
      throw error;
    }
  }

  static async deleteSelectedSubcomponent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_selected_subcomponents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting selected subcomponent:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteSelectedSubcomponent:', error);
      throw error;
    }
  }

  // Employees
  static async getEmployees(businessId: string): Promise<RDEmployee[]> {
    try {
      const { data, error } = await supabase
        .from('rd_employees')
        .select('*')
        .eq('business_id', businessId);

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEmployees:', error);
      throw error;
    }
  }

  static async saveEmployee(employee: Partial<RDEmployee>): Promise<RDEmployee> {
    try {
      if (employee.id) {
        // Update existing
        const { data, error } = await supabase
          .from('rd_employees')
          .update(employee)
          .eq('id', employee.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating employee:', error);
          throw error;
        }

        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('rd_employees')
          .insert(employee)
          .select()
          .single();

        if (error) {
          console.error('Error creating employee:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in saveEmployee:', error);
      throw error;
    }
  }

  static async deleteEmployee(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_employees')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting employee:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      throw error;
    }
  }

  // Employee Year Data
  static async getEmployeeYearData(businessYearId: string): Promise<RDEmployeeYearData[]> {
    try {
      const { data, error } = await supabase
        .from('rd_employee_year_data')
        .select('*')
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('Error fetching employee year data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEmployeeYearData:', error);
      throw error;
    }
  }

  static async saveEmployeeYearData(employeeYearData: Partial<RDEmployeeYearData>): Promise<RDEmployeeYearData> {
    try {
      if (employeeYearData.id) {
        // Update existing
        const { data, error } = await supabase
          .from('rd_employee_year_data')
          .update(employeeYearData)
          .eq('id', employeeYearData.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating employee year data:', error);
          throw error;
        }

        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('rd_employee_year_data')
          .insert(employeeYearData)
          .select()
          .single();

        if (error) {
          console.error('Error creating employee year data:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in saveEmployeeYearData:', error);
      throw error;
    }
  }

  // Supply Year Data
  static async getSupplyYearData(businessYearId: string): Promise<RDSupplyYearData[]> {
    try {
      const { data, error } = await supabase
        .from('rd_supply_year_data')
        .select('*')
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('Error fetching supply year data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSupplyYearData:', error);
      throw error;
    }
  }

  static async saveSupplyYearData(supplyYearData: Partial<RDSupplyYearData>): Promise<RDSupplyYearData> {
    try {
      if (supplyYearData.id) {
        // Update existing
        const { data, error } = await supabase
          .from('rd_supply_year_data')
          .update(supplyYearData)
          .eq('id', supplyYearData.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating supply year data:', error);
          throw error;
        }

        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('rd_supply_year_data')
          .insert(supplyYearData)
          .select()
          .single();

        if (error) {
          console.error('Error creating supply year data:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in saveSupplyYearData:', error);
      throw error;
    }
  }

  static async deleteSupplyYearData(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_supply_year_data')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting supply year data:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteSupplyYearData:', error);
      throw error;
    }
  }

  // Contractor Year Data
  static async getContractorYearData(businessYearId: string): Promise<RDContractorYearData[]> {
    try {
      const { data, error } = await supabase
        .from('rd_contractor_year_data')
        .select('*')
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('Error fetching contractor year data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getContractorYearData:', error);
      throw error;
    }
  }

  static async saveContractorYearData(contractorYearData: Partial<RDContractorYearData>): Promise<RDContractorYearData> {
    try {
      // Ensure activity_link is always present and non-null
      const dataToSave = {
        ...contractorYearData,
        activity_link: contractorYearData.activity_link || {}
      };

      if (contractorYearData.id) {
        // Update existing
        const { data, error } = await supabase
          .from('rd_contractor_year_data')
          .update(dataToSave)
          .eq('id', contractorYearData.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating contractor year data:', error);
          throw error;
        }

        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('rd_contractor_year_data')
          .insert(dataToSave)
          .select()
          .single();

        if (error) {
          console.error('Error creating contractor year data:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in saveContractorYearData:', error);
      throw error;
    }
  }

  static async deleteContractorYearData(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_contractor_year_data')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting contractor year data:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteContractorYearData:', error);
      throw error;
    }
  }

  // Reports
  static async getReports(businessYearId: string): Promise<RDReport[]> {
    try {
      const { data, error } = await supabase
        .from('rd_reports')
        .select('*')
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReports:', error);
      throw error;
    }
  }

  static async saveReport(report: Partial<RDReport>): Promise<RDReport> {
    try {
      if (report.id) {
        // Update existing
        const { data, error } = await supabase
          .from('rd_reports')
          .update(report)
          .eq('id', report.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating report:', error);
          throw error;
        }

        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('rd_reports')
          .insert(report)
          .select()
          .single();

        if (error) {
          console.error('Error creating report:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in saveReport:', error);
      throw error;
    }
  }

  // Helper method to get business tax year ID from business ID and tax year
  static async getBusinessTaxYearId(businessId: string, taxYear: number): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('business_tax_years')
        .select('id')
        .eq('business_id', businessId)
        .eq('tax_year', taxYear)
        .maybeSingle();

      if (error) {
        console.error('Error fetching business tax year:', error);
        throw error;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in getBusinessTaxYearId:', error);
      throw error;
    }
  }

  // Helper method to create business tax year if it doesn't exist
  static async ensureBusinessTaxYear(businessId: string, taxYear: number, grossReceipts: number = 0): Promise<string> {
    try {
      // First try to get existing
      const existingId = await this.getBusinessTaxYearId(businessId, taxYear);
      if (existingId) {
        return existingId;
      }

      // Create new if doesn't exist
      const { data, error } = await supabase
        .from('business_tax_years')
        .insert({
          business_id: businessId,
          tax_year: taxYear,
          gross_receipts: grossReceipts,
          total_expenses: 0
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating business tax year:', error);
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Error in ensureBusinessTaxYear:', error);
      throw error;
    }
  }
} 