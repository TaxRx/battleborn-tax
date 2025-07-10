import { supabase } from '../lib/supabase';
import {
  RDBusiness,
  RDBusinessYear,
  RDEmployee,
  RDResearchCategory,
  RDArea,
  RDFocus,
  RDResearchActivity,
  RDSubcomponent,
  RDSelectedActivity,
  RDReport,
  BusinessFormData,
  EmployeeFormData,
  ActivitySelectionData,
  RDWizardState
} from '../types/rdTaxCredit';

export class RDTaxCreditService {
  // Research Library Methods
  static async getResearchCategories(): Promise<RDResearchCategory[]> {
    const { data, error } = await supabase
      .from('rd_research_categories')
      .select(`
        *,
        areas (
          *,
          focuses (
            *,
            activities (
              *,
              subcomponents (*)
            )
          )
        )
      `)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  static async getResearchActivities(): Promise<RDResearchActivity[]> {
    const { data, error } = await supabase
      .from('rd_research_activities')
      .select(`
        *,
        focus:focuses (
          *,
          area:rd_areas (
            *,
            category:rd_research_categories (*)
          )
        ),
        subcomponents (*)
      `)
      .eq('is_active', true)
      .order('title');

    if (error) throw error;
    return data || [];
  }

  // Business Management Methods
  static async createBusiness(businessData: BusinessFormData, clientId: string): Promise<RDBusiness> {
    const { data, error } = await supabase
      .from('rd_businesses')
      .insert({
        client_id: clientId,
        name: businessData.name,
        ein: businessData.ein,
        entity_type: businessData.entityType,
        start_year: businessData.startYear,
        domicile_state: businessData.domicileState,
        contact_info: businessData.contactInfo,
        is_controlled_grp: businessData.isControlledGrp
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getBusiness(businessId: string): Promise<RDBusiness> {
    const { data, error } = await supabase
      .from('rd_businesses')
      .select(`
        *,
        years:rd_business_years (*),
        roles:rd_roles (*),
        employees:rd_employees (
          *,
          role:rd_roles (*)
        ),
        reports:rd_reports (*)
      `)
      .eq('id', businessId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateBusiness(businessId: string, updates: Partial<BusinessFormData>): Promise<RDBusiness> {
    const { data, error } = await supabase
      .from('rd_businesses')
      .update({
        name: updates.name,
        ein: updates.ein,
        entity_type: updates.entityType,
        start_year: updates.startYear,
        domicile_state: updates.domicileState,
        contact_info: updates.contactInfo,
        is_controlled_grp: updates.isControlledGrp
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Business Year Management
  static async createBusinessYear(businessId: string, year: number, grossReceipts: number): Promise<RDBusinessYear> {
    const { data, error } = await supabase
      .from('rd_business_years')
      .insert({
        business_id: businessId,
        year,
        gross_receipts: grossReceipts,
        total_qre: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getBusinessYear(businessYearId: string): Promise<RDBusinessYear> {
    const { data, error } = await supabase
      .from('rd_business_years')
      .select(`
        *,
        business:rd_businesses (*),
        selected_activities:rd_selected_activities (
          *,
          activity:rd_research_activities (*)
        ),
        employees:rd_employee_year_data (
          *,
          employee:rd_employees (*)
        ),
        supplies:rd_supply_year_data (*),
        contractors:rd_contractor_year_data (*),
        reports:rd_reports (*)
      `)
      .eq('id', businessYearId)
      .single();

    if (error) throw error;
    return data;
  }

  // Employee Management
  static async createEmployee(employeeData: EmployeeFormData, businessId: string): Promise<RDEmployee> {
    const { data, error } = await supabase
      .from('rd_employees')
      .insert({
        business_id: businessId,
        name: employeeData.name,
        role_id: employeeData.roleId,
        is_owner: employeeData.isOwner,
        annual_wage: employeeData.annualWage
      })
      .select(`
        *,
        role:rd_roles (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getEmployees(businessId: string): Promise<RDEmployee[]> {
    const { data, error } = await supabase
      .from('rd_employees')
      .select(`
        *,
        role:rd_roles (*),
        year_data:rd_employee_year_data (*)
      `)
      .eq('business_id', businessId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Role Management
  static async createRole(name: string, businessYearId: string, parentId?: string): Promise<any> {
    const { data, error } = await supabase
      .from('rd_roles')
      .insert({
        business_year_id: businessYearId,
        name,
        parent_id: parentId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getRoles(businessYearId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('rd_roles')
      .select('*')
      .eq('business_year_id', businessYearId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Activity Selection
  static async selectActivity(selectionData: ActivitySelectionData, businessYearId: string): Promise<RDSelectedActivity> {
    const { data, error } = await supabase
      .from('rd_selected_activities')
      .insert({
        business_year_id: businessYearId,
        activity_id: selectionData.activityId,
        practice_percent: selectionData.practicePercent,
        selected_roles: selectionData.selectedRoles,
        config: selectionData.config
      })
      .select(`
        *,
        activity:rd_research_activities (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSelectedActivity(selectionId: string, updates: Partial<ActivitySelectionData>): Promise<RDSelectedActivity> {
    const { data, error } = await supabase
      .from('rd_selected_activities')
      .update({
        practice_percent: updates.practicePercent,
        selected_roles: updates.selectedRoles,
        config: updates.config
      })
      .eq('id', selectionId)
      .select(`
        *,
        activity:rd_research_activities (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async removeSelectedActivity(selectionId: string): Promise<void> {
    const { error } = await supabase
      .from('rd_selected_activities')
      .delete()
      .eq('id', selectionId);

    if (error) throw error;
  }

  // Supply and Contractor Management
  static async addSupply(businessYearId: string, name: string, costAmount: number, appliedPercent: number, activityLink: any): Promise<any> {
    const { data, error } = await supabase
      .from('rd_supply_year_data')
      .insert({
        business_year_id: businessYearId,
        name,
        cost_amount: costAmount,
        applied_percent: appliedPercent,
        activity_link: activityLink
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async addContractor(businessYearId: string, name: string, costAmount: number, appliedPercent: number, activityLink: any): Promise<any> {
    const { data, error } = await supabase
      .from('rd_contractor_year_data')
      .insert({
        business_year_id: businessYearId,
        name,
        cost_amount: costAmount,
        applied_percent: appliedPercent,
        activity_link: activityLink
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Report Generation
  static async generateReport(businessYearId: string, type: string, generatedText: string, aiVersion: string): Promise<RDReport> {
    const { data, error } = await supabase
      .from('rd_reports')
      .insert({
        business_year_id: businessYearId,
        type,
        generated_text: generatedText,
        ai_version: aiVersion,
        locked: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateReport(reportId: string, editableText: string): Promise<RDReport> {
    const { data, error } = await supabase
      .from('rd_reports')
      .update({
        editable_text: editableText
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async lockReport(reportId: string): Promise<RDReport> {
    const { data, error } = await supabase
      .from('rd_reports')
      .update({
        locked: true
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // QRE Calculations
  static async calculateQRE(businessYearId: string): Promise<number> {
    // Get all QRE components for the business year
    const { data: employeeData } = await supabase
      .from('rd_employee_year_data')
      .select('calculated_qre')
      .eq('business_year_id', businessYearId);

    const { data: supplyData } = await supabase
      .from('rd_supply_year_data')
      .select('cost_amount, applied_percent')
      .eq('business_year_id', businessYearId);

    const { data: contractorData } = await supabase
      .from('rd_contractor_year_data')
      .select('cost_amount, applied_percent')
      .eq('business_year_id', businessYearId);

    // Calculate total QRE
    const employeeQRE = employeeData?.reduce((sum, emp) => sum + (emp.calculated_qre || 0), 0) || 0;
    const supplyQRE = supplyData?.reduce((sum, supply) => sum + (supply.cost_amount * supply.applied_percent / 100), 0) || 0;
    const contractorQRE = contractorData?.reduce((sum, contractor) => sum + (contractor.cost_amount * contractor.applied_percent / 100), 0) || 0;

    const totalQRE = employeeQRE + supplyQRE + contractorQRE;

    // Update the business year with calculated QRE
    await supabase
      .from('rd_business_years')
      .update({ total_qre: totalQRE })
      .eq('id', businessYearId);

    return totalQRE;
  }

  // Wizard State Management
  static async saveWizardState(businessId: string, state: Partial<RDWizardState>): Promise<void> {
    // This could be stored in a separate wizard_state table or as JSON in the business record
    const { error } = await supabase
      .from('rd_businesses')
      .update({
        contact_info: {
          ...state,
          wizard_state: state
        }
      })
      .eq('id', businessId);

    if (error) throw error;
  }

  static async getWizardState(businessId: string): Promise<RDWizardState | null> {
    const { data, error } = await supabase
      .from('rd_businesses')
      .select('contact_info')
      .eq('id', businessId)
      .single();

    if (error) throw error;
    return data?.contact_info?.wizard_state || null;
  }
} 