import { supabase } from '../lib/supabase';
import { TaxInfo, PersonalYear, BusinessYear } from '../types/taxInfo';
import { RDBusinessService } from '../modules/tax-calculator/services/rdBusinessService';

export interface CentralizedClient {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  filing_status: string;
  home_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  dependents: number;
  standard_deduction: boolean;
  custom_deduction: number;
  created_at: string;
  updated_at: string;
  archived: boolean;
  archived_at?: string;
}

export interface CentralizedBusiness {
  id: string;
  client_id: string;
  business_name: string;
  entity_type: 'LLC' | 'S-Corp' | 'C-Corp' | 'Partnership' | 'Sole-Proprietor' | 'Other';
  ein?: string;
  business_address?: string;
  business_city?: string;
  business_state?: string;
  business_zip?: string;
  business_phone?: string;
  business_email?: string;
  industry?: string;
  year_established?: number;
  employee_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CentralizedPersonalYear {
  id: string;
  client_id: string;
  year: number;
  wages_income: number;
  passive_income: number;
  unearned_income: number;
  capital_gains: number;
  long_term_capital_gains: number;
  household_income: number;
  ordinary_income: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CentralizedBusinessYear {
  id: string;
  business_id: string;
  year: number;
  is_active: boolean;
  ordinary_k1_income: number;
  guaranteed_k1_income: number;
  annual_revenue: number;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface ToolEnrollment {
  id: string;
  client_id: string;
  business_id?: string;
  tool_slug: 'rd' | 'augusta' | 'hire_children' | 'cost_segregation' | 'convertible_bonds' | 'tax_planning';
  enrolled_by: string;
  enrolled_at: string;
  status: 'active' | 'inactive' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientTool {
  tool_slug: ToolEnrollment['tool_slug'];
  tool_name: string;
  status: string;
  enrolled_at: string;
}

export interface CreateClientData {
  full_name: string;
  email: string;
  phone?: string;
  filing_status: string;
  home_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  dependents: number;
  standard_deduction: boolean;
  custom_deduction: number;
  personal_years?: Array<{
    year: number;
    wages_income: number;
    passive_income: number;
    unearned_income: number;
    capital_gains: number;
    long_term_capital_gains: number;
    is_active: boolean;
  }>;
  businesses?: Array<{
    business_name: string;
    entity_type: string;
    ein?: string;
    business_address?: string;
    business_city?: string;
    business_state?: string;
    business_zip?: string;
    business_phone?: string;
    business_email?: string;
    industry?: string;
    year_established?: number;
    employee_count: number;
    is_active: boolean;
    business_years?: Array<{
      year: number;
      is_active: boolean;
      ordinary_k1_income: number;
      guaranteed_k1_income: number;
      annual_revenue: number;
      employee_count: number;
    }>;
  }>;
}

export class CentralizedClientService {
  /**
   * Create a new client with all related data
   */
  static async createClient(clientData: CreateClientData): Promise<{ success: boolean; clientId?: string; error?: string }> {
    try {
      console.log('[CentralizedClientService] createClient called with data:', clientData);
      
      // Validate required fields
      if (!clientData.full_name || clientData.full_name.trim() === '') {
        console.error('[CentralizedClientService] Missing or empty full_name:', clientData.full_name);
        return { success: false, error: 'Full name is required and cannot be empty' };
      }
      
      if (!clientData.email || clientData.email.trim() === '') {
        console.error('[CentralizedClientService] Missing or empty email:', clientData.email);
        return { success: false, error: 'Email is required and cannot be empty' };
      }

      console.log('[CentralizedClientService] Using admin-service edge function to create client');

      // Use the new admin-service edge function to create a complete client account
      const { data, error } = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/create-client',
          full_name: clientData.full_name,
          email: clientData.email,
          phone: clientData.phone || null,
          filing_status: clientData.filing_status || 'single',
          dependents: clientData.dependents || 0,
          home_address: clientData.home_address || null,
          state: clientData.state || 'CA'
        }
      });

      if (error) {
        console.error('[CentralizedClientService] Error calling admin-service:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('[CentralizedClientService] Admin service returned error:', data.error);
        return { success: false, error: data.error || 'Failed to create client' };
      }

      console.log('[CentralizedClientService] Client created successfully via admin-service:', data);

      const clientId = data.client?.id;
      if (!clientId) {
        console.error('[CentralizedClientService] No client ID returned from admin-service');
        return { success: false, error: 'No client ID returned from server' };
      }

      // Create personal years if provided
      if (clientData.personal_years && clientData.personal_years.length > 0) {
        const personalYearsData = clientData.personal_years.map(year => ({
          client_id: clientId,
          year: year.year,
          wages_income: year.wages_income,
          passive_income: year.passive_income,
          unearned_income: year.unearned_income,
          capital_gains: year.capital_gains,
          long_term_capital_gains: year.long_term_capital_gains,
          household_income: year.wages_income + year.passive_income + year.unearned_income + year.capital_gains,
          ordinary_income: year.wages_income + year.passive_income + year.unearned_income,
          is_active: year.is_active
        }));

        const { error: personalYearsError } = await supabase
          .from('personal_years')
          .insert(personalYearsData);

        if (personalYearsError) {
          console.error('Error creating personal years:', personalYearsError);
          // Continue anyway, don't fail the whole operation
        }
      }

      // Create businesses if provided
      if (clientData.businesses && clientData.businesses.length > 0) {
        for (const business of clientData.businesses) {
          // Create the business
          const { data: businessDataResult, error: businessError } = await supabase
            .from('businesses')
            .insert({
              client_id: clientId,
              business_name: business.business_name,
              entity_type: business.entity_type,
              ein: business.ein || null,
              business_address: business.business_address || null,
              business_city: business.business_city || null,
              business_state: business.business_state,
              business_zip: business.business_zip || null,
              business_phone: business.business_phone || null,
              business_email: business.business_email || null,
              industry: business.industry || null,
              year_established: business.year_established || null,
              annual_revenue: business.annual_revenue || 0,
              employee_count: business.employee_count || 0,
              is_active: business.is_active ?? true
            })
            .select('id')
            .single();

          if (businessError) {
            console.error('Error creating business:', businessError);
            continue; // Skip this business but continue with others
          }

          const businessId = businessDataResult.id;

          // Create business years if provided - only if explicitly defined with meaningful data
          if (business.business_years && business.business_years.length > 0 && business.business_years.some(year => year.year && (year.ordinary_k1_income > 0 || year.guaranteed_k1_income > 0 || year.annual_revenue > 0))) {
            const businessYearsData = business.business_years.map(year => ({
              business_id: businessId,
              year: year.year,
              is_active: year.is_active ?? true,
              ordinary_k1_income: year.ordinary_k1_income || 0,
              guaranteed_k1_income: year.guaranteed_k1_income || 0,
              annual_revenue: year.annual_revenue || 0,
              employee_count: year.employee_count || 0
            }));

            const { error: businessYearsError } = await supabase
              .from('business_years')
              .insert(businessYearsData);

            if (businessYearsError) {
              console.error('Error creating business years:', businessYearsError);
              // Continue anyway
            }
          }
        }
      }

      console.log('[CentralizedClientService] Client creation complete with ID:', clientId);
      return { success: true, clientId };
    } catch (error) {
      console.error('Error in createClient:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get all clients for the current user
   */
  static async getClients(): Promise<CentralizedClient[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting clients:', error);
        throw new Error(`Failed to get clients: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClients:', error);
      return [];
    }
  }

  /**
   * Get a single client with all related data
   */
  static async getClient(clientId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_client_with_data', {
        client_uuid: clientId
      });

      if (error) {
        console.error('Error getting client:', error);
        throw new Error(`Failed to get client: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getClient:', error);
      throw error;
    }
  }

  /**
   * Update a client
   */
  static async updateClient(clientId: string, updates: Partial<CentralizedClient>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId);

      if (error) {
        console.error('Error updating client:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateClient:', error);
      return false;
    }
  }

  /**
   * Archive or unarchive a client
   */
  static async archiveClient(clientId: string, archive: boolean = true): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('archive_client', {
        p_client_file_id: clientId,
        p_archive: archive
      });

      if (error) {
        console.error('Error archiving client:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in archiveClient:', error);
      return false;
    }
  }

  /**
   * Delete a client (permanently)
   */
  static async deleteClient(clientId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Error deleting client:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteClient:', error);
      return false;
    }
  }

  /**
   * Get all tools a client is enrolled in
   */
  static async getClientTools(clientId: string, businessId?: string): Promise<ClientTool[]> {
    try {
      const { data, error } = await supabase.rpc('get_client_tools', {
        p_client_file_id: clientId,
        p_business_id: businessId || null
      });

      if (error) {
        console.error('Error getting client tools:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClientTools:', error);
      return [];
    }
  }

  /**
   * Enroll a client in a specific tool
   */
  static async enrollClientInTool(
    clientId: string,
    businessId: string,
    toolSlug: ToolEnrollment['tool_slug'],
    notes?: string
  ): Promise<string> {
    console.log('[CentralizedClientService] enrollClientInTool called', { clientId, businessId, toolSlug, notes });
    
    try {
      // If enrolling in R&D, copy business to rd_businesses
      if (toolSlug === 'rd') {
        try {
          console.log('[CentralizedClientService] Enrolling in R&D: copying business to rd_businesses', { businessId, clientId });
          const rdBusiness = await RDBusinessService.enrollBusinessFromExisting(businessId, clientId);
          console.log('[CentralizedClientService] R&D business copy result:', rdBusiness);
        } catch (copyError) {
          console.error('[CentralizedClientService] Error copying business to rd_businesses:', copyError);
          throw new Error('Failed to copy business to rd_businesses: ' + (copyError instanceof Error ? copyError.message : copyError));
        }
      }
      
      // First, check if we need to create a corresponding admin_client_files record
      // for compatibility with the legacy tool_enrollments schema
      let clientFileId = clientId;
      
      try {
        // Check if admin_client_files record exists for this client
        const { data: existingClientFile, error: checkError } = await supabase
          .from('admin_client_files')
          .select('id')
          .eq('id', clientId)
          .single();
          
        if (checkError && checkError.code === 'PGRST116') {
          // Record doesn't exist, we need to create it
          console.log('[CentralizedClientService] Creating admin_client_files record for client:', clientId);
          
          // Get client data from the new clients table
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();
            
          if (clientError) {
            throw new Error(`Failed to fetch client data: ${clientError.message}`);
          }
          
          // Get current user ID
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id;
          
          // Create admin_client_files record
          const { data: newClientFile, error: insertError } = await supabase
            .from('admin_client_files')
            .insert({
              id: clientId, // Use same ID for consistency
              admin_id: userId,
              full_name: clientData.full_name,
              email: clientData.email,
              phone: clientData.phone,
              filing_status: clientData.filing_status,
              dependents: clientData.dependents,
              home_address: clientData.home_address,
              state: clientData.state,
              standard_deduction: clientData.standard_deduction,
              custom_deduction: clientData.custom_deduction,
              business_id: businessId,
              archived: false,
              tax_profile_data: {
                fullName: clientData.full_name,
                email: clientData.email,
                phone: clientData.phone,
                filingStatus: clientData.filing_status,
                dependents: clientData.dependents,
                homeAddress: clientData.home_address,
                state: clientData.state,
                standardDeduction: clientData.standard_deduction,
                customDeduction: clientData.custom_deduction
              }
            })
            .select('id')
            .single();
            
          if (insertError) {
            console.error('[CentralizedClientService] Error creating admin_client_files:', insertError);
            throw new Error(`Failed to create admin_client_files record: ${insertError.message}`);
          }
          
          console.log('[CentralizedClientService] Created admin_client_files record:', newClientFile.id);
          clientFileId = newClientFile.id;
        } else if (checkError) {
          throw checkError;
        } else {
          clientFileId = existingClientFile.id;
        }
      } catch (adminFileError) {
        console.error('[CentralizedClientService] Error handling admin_client_files:', adminFileError);
        // Continue with original clientId if we can't create the admin file record
        clientFileId = clientId;
      }
      
      console.log('[CentralizedClientService] Calling enroll_client_in_tool RPC', { clientFileId, businessId, toolSlug, notes });
      
      // Use the RPC function with the correct client file ID
      const { data, error } = await supabase.rpc('enroll_client_in_tool', {
        p_client_file_id: clientFileId,
        p_business_id: businessId,
        p_tool_slug: toolSlug,
        p_notes: notes || null
      });

      if (error) {
        console.error('[CentralizedClientService] Error enrolling client in tool:', error);
        throw new Error(`Failed to enroll client in tool: ${error.message}`);
      }

      console.log('[CentralizedClientService] enroll_client_in_tool RPC result:', data);
      return data;
    } catch (error) {
      console.error('[CentralizedClientService] Error in enrollClientInTool:', error);
      throw new Error(`Failed to enroll client in tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get businesses for a client
   */
  static async getClientBusinesses(clientId: string): Promise<CentralizedBusiness[]> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting client businesses:', error);
        throw new Error(`Failed to get client businesses: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClientBusinesses:', error);
      return [];
    }
  }

  /**
   * Create a new business
   */
  static async createBusiness(businessData: Omit<CentralizedBusiness, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; businessId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert(businessData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating business:', error);
        return { success: false, error: error.message };
      }

      return { success: true, businessId: data.id };
    } catch (error) {
      console.error('Error in createBusiness:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update a business
   */
  static async updateBusiness(businessId: string, updates: Partial<CentralizedBusiness>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', businessId);

      if (error) {
        console.error('Error updating business:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateBusiness:', error);
      return false;
    }
  }

  /**
   * Delete a business
   */
  static async deleteBusiness(businessId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) {
        console.error('Error deleting business:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteBusiness:', error);
      return false;
    }
  }

  /**
   * Create a business year
   */
  static async createBusinessYear(businessId: string, yearData: Omit<CentralizedBusinessYear, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; yearId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('business_years')
        .insert({
          business_id: businessId,
          year: yearData.year,
          is_active: yearData.is_active,
          ordinary_k1_income: yearData.ordinary_k1_income,
          guaranteed_k1_income: yearData.guaranteed_k1_income,
          annual_revenue: yearData.annual_revenue,
          employee_count: yearData.employee_count
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating business year:', error);
        return { success: false, error: error.message };
      }

      return { success: true, yearId: data.id };
    } catch (error) {
      console.error('Error in createBusinessYear:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update a business year
   */
  static async updateBusinessYear(yearId: string, yearData: Partial<CentralizedBusinessYear>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};
      if (yearData.ordinary_k1_income !== undefined) updateData.ordinary_k1_income = yearData.ordinary_k1_income;
      if (yearData.guaranteed_k1_income !== undefined) updateData.guaranteed_k1_income = yearData.guaranteed_k1_income;
      if (yearData.annual_revenue !== undefined) updateData.annual_revenue = yearData.annual_revenue;
      if (yearData.is_active !== undefined) updateData.is_active = yearData.is_active;

      const { error } = await supabase
        .from('business_years')
        .update(updateData)
        .eq('id', yearId);

      if (error) {
        console.error('Error updating business year:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateBusinessYear:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create a personal year
   */
  static async createPersonalYear(clientId: string, yearData: Omit<CentralizedPersonalYear, 'id' | 'client_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; yearId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('personal_years')
        .insert({
          client_id: clientId,
          year: yearData.year,
          wages_income: yearData.wages_income,
          passive_income: yearData.passive_income,
          unearned_income: yearData.unearned_income,
          capital_gains: yearData.capital_gains,
          long_term_capital_gains: yearData.long_term_capital_gains,
          household_income: yearData.household_income,
          ordinary_income: yearData.ordinary_income,
          is_active: yearData.is_active
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating personal year:', error);
        return { success: false, error: error.message };
      }

      return { success: true, yearId: data.id };
    } catch (error) {
      console.error('Error in createPersonalYear:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update a personal year
   */
  static async updatePersonalYear(yearId: string, yearData: Partial<CentralizedPersonalYear>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('personal_years')
        .update(yearData)
        .eq('id', yearId);

      if (error) {
        console.error('Error updating personal year:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updatePersonalYear:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check if client is enrolled in a specific tool
   */
  static async isClientEnrolledInTool(
    clientId: string,
    businessId: string,
    toolSlug: ToolEnrollment['tool_slug']
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('tool_enrollments')
        .select('id')
        .eq('client_id', clientId)
        .eq('business_id', businessId)
        .eq('tool_slug', toolSlug)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking tool enrollment:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isClientEnrolledInTool:', error);
      return false;
    }
  }

  /**
   * Get tool launch URL
   */
  static getToolLaunchUrl(
    toolSlug: ToolEnrollment['tool_slug'],
    clientId: string,
    businessId: string
  ): string {
    const baseUrl = window.location.origin;
    
    switch (toolSlug) {
      case 'rd':
        return `${baseUrl}/admin/rd-clients?clientId=${clientId}&businessId=${businessId}`;
      case 'augusta':
        return `${baseUrl}/solutions/augusta-rule?clientId=${clientId}&businessId=${businessId}`;
      case 'hire_children':
        return `${baseUrl}/tax-calculator?clientId=${clientId}&businessId=${businessId}`;
      case 'cost_segregation':
        return `${baseUrl}/tax-calculator?clientId=${clientId}&businessId=${businessId}`;
      case 'convertible_bonds':
        return `${baseUrl}/tax-calculator?clientId=${clientId}&businessId=${businessId}`;
      default:
        return `${baseUrl}/admin`;
    }
  }

  /**
   * Transform TaxInfo to CreateClientData format
   */
  static transformTaxInfoToCreateData(taxInfo: TaxInfo): CreateClientData {
    console.log('[CentralizedClientService] transformTaxInfoToCreateData called with:', taxInfo);
    console.log('[CentralizedClientService] taxInfo.fullName:', taxInfo.fullName);
    
    if (!taxInfo.fullName || taxInfo.fullName.trim() === '') {
      console.error('[CentralizedClientService] ERROR: TaxInfo fullName is missing or empty:', taxInfo.fullName);
      throw new Error('Full name is required and cannot be empty');
    }
    
    const transformedData = {
      full_name: taxInfo.fullName,
      email: taxInfo.email,
      phone: taxInfo.phone,
      filing_status: taxInfo.filingStatus,
      home_address: taxInfo.homeAddress,
      city: taxInfo.city,
      state: taxInfo.state,
      zip_code: taxInfo.zipCode,
      dependents: taxInfo.dependents || 0,
      standard_deduction: taxInfo.standardDeduction || true,
      custom_deduction: taxInfo.customDeduction || 0,
      personal_years: taxInfo.years?.map(year => ({
        year: year.year,
        wages_income: year.wagesIncome,
        passive_income: year.passiveIncome,
        unearned_income: year.unearnedIncome,
        capital_gains: year.capitalGains,
        long_term_capital_gains: year.longTermCapitalGains || 0,
        is_active: year.isActive
      })),
      businesses: taxInfo.businesses?.map(business => ({
        business_name: business.businessName,
        entity_type: business.entityType,
        ein: business.ein,
        business_address: business.businessAddress,
        business_city: business.businessCity,
        business_state: business.businessState,
        business_zip: business.businessZip,
        business_phone: business.businessPhone,
        business_email: business.businessEmail,
        industry: business.industry,
        year_established: business.startYear,
        annual_revenue: business.annualRevenue || 0,
        employee_count: business.employeeCount || 0,
        is_active: business.isActive,
        business_years: business.years?.map(year => ({
          year: year.year,
          is_active: year.isActive,
          ordinary_k1_income: year.ordinaryK1Income || 0,
          guaranteed_k1_income: year.guaranteedK1Income || 0,
          annual_revenue: year.annualRevenue || 0,
          employee_count: year.employeeCount || 0
        }))
      }))
    };
    
    console.log('[CentralizedClientService] Transformed data:', transformedData);
    console.log('[CentralizedClientService] Transformed full_name:', transformedData.full_name);
    
    return transformedData;
  }

  /**
   * Get unified client list with business and tool information
   */
  static async getUnifiedClientList(params: {
    toolFilter?: ToolEnrollment['tool_slug'];
    adminId?: string;
    affiliateId?: string;
    operatorAccountId?: string;
  }): Promise<any[]> {
    try {
      // First, get clients from the new clients table
      let clientsQuery = supabase
        .from('clients')
        .select(`
          id,
          full_name,
          email,
          phone,
          filing_status,
          home_address,
          city,
          state,
          zip_code,
          dependents,
          standard_deduction,
          custom_deduction,
          created_at,
          updated_at,
          archived,
          archived_at,
          businesses (
            id,
            business_name,
            entity_type,
            business_address,
            business_city,
            business_state,
            business_zip,
            business_phone,
            business_email,
            industry,
            ein,
            year_established,
            employee_count,
            is_active,
            created_at,
            business_years (
              id,
              year,
              is_active,
              ordinary_k1_income,
              guaranteed_k1_income,
              annual_revenue,
              employee_count
            )
          ),
          personal_years (
            id,
            year,
            wages_income,
            passive_income,
            unearned_income,
            capital_gains,
            long_term_capital_gains,
            household_income,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (params.adminId) {
        clientsQuery = clientsQuery.eq('created_by', params.adminId);
      }

      // Add operator filtering if provided - only show clients linked via account_links
      if (params.operatorAccountId) {
        // Join with account_links to filter by operator account
        // Get target account IDs linked to this operator
        const { data: linkedAccounts, error: linkError } = await supabase
          .from('account_links')
          .select(`
            target_account_id,
            accounts!account_links_target_account_id_fkey(type)
          `)
          .eq('source_account_id', params.operatorAccountId)
          .eq('is_active', true);
        
        if (linkError) {
          console.error('Error fetching linked accounts for operator:', linkError);
          throw linkError;
        }
        
        if (linkedAccounts && linkedAccounts.length > 0) {
          // Filter for client-type accounts only
          const clientAccountIds = linkedAccounts
            .filter(link => link.accounts?.type === 'client')
            .map(link => link.target_account_id);
          
          if (clientAccountIds.length > 0) {
            clientsQuery = clientsQuery.in('account_id', clientAccountIds);
          } else {
            // No linked client accounts - return empty result
            return [];
          }
        } else {
          // No linked accounts - return empty result
          return [];
        }
      }

      const { data: clients, error: clientsError } = await clientsQuery;

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        throw clientsError;
      }

      // Get tool enrollments from the existing tool_enrollments table
      // Note: This table references admin_client_files, not the new clients table
      const { data: toolEnrollments, error: toolError } = await supabase
        .from('tool_enrollments')
        .select(`
          id,
          client_file_id,
          business_id,
          tool_slug,
          enrolled_by,
          enrolled_at,
          status,
          notes
        `);

      if (toolError) {
        console.error('Error fetching tool enrollments:', toolError);
        // Don't throw error, just continue without tool data
      }

      // Transform the data to match expected format
      const unifiedClients = clients?.map(client => {
        // Find tool enrollments for this client (if any exist in admin_client_files)
        // For now, we'll set default values since the tables aren't connected yet
        const clientToolEnrollments = toolEnrollments?.filter(te => 
          te.client_file_id === client.id
        ) || [];

        // Get business tool enrollments
        const businessToolEnrollments = client.businesses?.map(business => {
          const businessTools = toolEnrollments?.filter(te => 
            te.business_id === business.id
          ) || [];

          return {
            ...business,
            tool_enrollments: businessTools.map(te => ({
              id: te.id,
              tool_slug: te.tool_slug,
              tool_name: this.getToolDisplayName(te.tool_slug),
              status: te.status,
              enrolled_at: te.enrolled_at,
              notes: te.notes
            }))
          };
        }) || [];

        // Calculate total income from personal tax years
        const latestPersonalYear = client.personal_years?.[0];
        const totalIncome = latestPersonalYear ? 
          (latestPersonalYear.wages_income || 0) + 
          (latestPersonalYear.passive_income || 0) + 
          (latestPersonalYear.unearned_income || 0) + 
          (latestPersonalYear.capital_gains || 0) 
          : 0;

        return {
          client_file_id: client.id,
          business_id: client.businesses?.[0]?.id || null, // Primary business for backward compatibility
          admin_id: client.created_by,
          affiliate_id: null, // Not implemented yet
          archived: client.archived || false,
          created_at: client.created_at,
          full_name: client.full_name,
          email: client.email,
          business_name: client.businesses?.[0]?.business_name || '', // Primary business name
          entity_type: client.businesses?.[0]?.entity_type || '', // Primary business entity type
          tool_slug: clientToolEnrollments[0]?.tool_slug || '',
          tool_status: clientToolEnrollments[0]?.status || 'inactive',
          total_income: totalIncome,
          filing_status: client.filing_status,
          // Additional fields for compatibility
          id: client.id,
          phone: client.phone,
          home_address: client.home_address,
          city: client.city,
          state: client.state,
          zip_code: client.zip_code,
          dependents: client.dependents,
          standard_deduction: client.standard_deduction,
          custom_deduction: client.custom_deduction,
          updated_at: client.updated_at,
          archived_at: client.archived_at,
          businesses: businessToolEnrollments,
          personal_years: client.personal_years || [],
          tool_enrollments: clientToolEnrollments.map(te => ({
            id: te.id,
            tool_slug: te.tool_slug,
            tool_name: this.getToolDisplayName(te.tool_slug),
            status: te.status,
            enrolled_at: te.enrolled_at,
            notes: te.notes
          }))
        };
      }) || [];

      // Apply tool filter if specified
      if (params.toolFilter) {
        return unifiedClients.filter(client => 
          client.tool_enrollments?.some(te => te.tool_slug === params.toolFilter) ||
          client.businesses?.some(business => 
            business.tool_enrollments?.some(te => te.tool_slug === params.toolFilter)
          )
        );
      }

      return unifiedClients;
    } catch (error) {
      console.error('Error in getUnifiedClientList:', error);
      throw error;
    }
  }

  /**
   * Get tool display name
   */
  static getToolDisplayName(toolSlug: ToolEnrollment['tool_slug']): string {
    const toolNames = {
      rd: 'R&D Tax Credit',
      augusta: 'Augusta Rule',
      hire_children: 'Hire Children',
      cost_segregation: 'Cost Segregation',
      convertible_bonds: 'Convertible Tax Bonds',
      tax_planning: 'Tax Planning'
    };
    return toolNames[toolSlug] || toolSlug;
  }

  /**
   * Transform client data from get_client_with_data to TaxInfo format
   */
  static transformClientDataToTaxInfo(clientData: any): TaxInfo {
    console.log('[transformClientDataToTaxInfo] Input clientData:', JSON.stringify(clientData, null, 2));
    
    const client = clientData.client;
    const personalYears = clientData.personal_years || [];
    const businesses = clientData.businesses || [];

    console.log('[transformClientDataToTaxInfo] Client:', client);
    console.log('[transformClientDataToTaxInfo] Personal years:', personalYears);
    console.log('[transformClientDataToTaxInfo] Businesses:', businesses);
    
    // Log each business in detail
    businesses.forEach((business: any, index: number) => {
      console.log(`[transformClientDataToTaxInfo] Business ${index} raw:`, JSON.stringify(business, null, 2));
      console.log(`[transformClientDataToTaxInfo] Business ${index} all keys:`, Object.keys(business));
      console.log(`[transformClientDataToTaxInfo] Business ${index} fields:`, {
        id: business.id,
        business_name: business.business_name,
        entity_type: business.entity_type,
        ein: business.ein,
        business_address: business.business_address,
        business_city: business.business_city,
        business_state: business.business_state,
        business_zip: business.business_zip,
        business_phone: business.business_phone,
        business_email: business.business_email,
        industry: business.industry,
        year_established: business.year_established,
        annual_revenue: business.annual_revenue,
        employee_count: business.employee_count,
        is_active: business.is_active,
        business_years: business.business_years
      });
    });

    const result = {
      id: client.id,
      fullName: client.full_name,
      email: client.email,
      phone: client.phone,
      homeAddress: client.home_address,
      city: client.city,
      state: client.state,
      zipCode: client.zip_code,
      filingStatus: client.filing_status,
      dependents: client.dependents,
      standardDeduction: client.standard_deduction,
      customDeduction: client.custom_deduction,
      businessOwner: businesses.length > 0,
      wagesIncome: personalYears[0]?.wages_income || 0,
      passiveIncome: personalYears[0]?.passive_income || 0,
      unearnedIncome: personalYears[0]?.unearned_income || 0,
      capitalGains: personalYears[0]?.capital_gains || 0,
      years: personalYears.map((py: any) => ({
        year: py.year,
        wagesIncome: py.wages_income,
        passiveIncome: py.passive_income,
        unearnedIncome: py.unearned_income,
        capitalGains: py.capital_gains,
        longTermCapitalGains: py.long_term_capital_gains,
        householdIncome: py.household_income,
        ordinaryIncome: py.ordinary_income,
        isActive: py.is_active
      })),
      businesses: businesses.map((business: any) => {
        // The business data is nested under a 'business' property
        const businessData = business.business || business;
        const businessYears = business.business_years || [];
        const latestYear = businessYears.sort((a: any, b: any) => b.year - a.year)[0];
        
        return {
          id: businessData.id || '',
          businessName: businessData.name || businessData.business_name || '',
          entityType: businessData.entity_type || '',
          ein: businessData.ein || '',
          businessAddress: businessData.contact_info?.address || businessData.business_address || '',
          businessCity: businessData.contact_info?.city || businessData.business_city || '',
          businessState: businessData.domicile_state || businessData.contact_info?.state || businessData.business_state || '',
          businessZip: businessData.contact_info?.zip || businessData.business_zip || '',
          businessPhone: businessData.contact_info?.phone || businessData.business_phone || '',
          businessEmail: businessData.contact_info?.email || businessData.business_email || '',
          industry: businessData.industry || '',
          startYear: businessData.start_year || businessData.year_established || 0,
          annualRevenue: businessData.historical_data?.[0]?.gross_receipts || businessData.annual_revenue || 0,
          employeeCount: businessData.historical_data?.[0]?.employee_count || businessData.employee_count || 0,
          isActive: businessData.is_active !== undefined ? businessData.is_active : true,
          ordinaryK1Income: latestYear?.ordinary_k1_income || 0,
          guaranteedK1Income: latestYear?.guaranteed_k1_income || 0,
          years: businessYears.map((year: any) => ({
            id: year.id || '',
            year: year.year || 0,
            isActive: year.is_active || false,
            ordinaryK1Income: year.ordinary_k1_income || 0,
            guaranteedK1Income: year.guaranteed_k1_income || 0,
            annualRevenue: year.annual_revenue || 0,
            employeeCount: year.employee_count || 0
          }))
        };
      }),
      createdAt: client.created_at,
      updatedAt: client.updated_at
    };

    console.log('[transformClientDataToTaxInfo] Result:', result);
    return result;
  }
} 