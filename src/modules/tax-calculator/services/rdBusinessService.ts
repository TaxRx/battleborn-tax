import { supabase } from '../lib/supabase';
import { 
  RDBusiness, 
  RDBusinessYear, 
  HistoricalData, 
  BusinessSetupData,
  RDEmployee,
  RDExpense,
  RDCalculation,
  RDReport
} from '../types/rdTypes';

export class RDBusinessService {
  // Check if we're in demo mode
  private static isDemoMode(userId: string): boolean {
    return userId === 'demo-user' || userId === 'demo-admin' || userId.includes('demo');
  }

  // Create or update business with historical data
  static async saveBusiness(businessData: BusinessSetupData, userId: string): Promise<RDBusiness> {
    try {
      // Handle demo mode
      if (this.isDemoMode(userId)) {
        console.log('Demo mode detected, returning mock business data');
        return {
          id: 'demo-business-id',
          client_id: 'demo-client-id',
          name: businessData.business.name,
          ein: businessData.business.ein,
          entity_type: businessData.business.entityType,
          start_year: businessData.business.startYear,
          domicile_state: businessData.business.state,
          contact_info: {
            address: businessData.business.address,
            city: businessData.business.city,
            state: businessData.business.state,
            zip: businessData.business.zip
          },
          is_controlled_grp: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      // First, ensure we have a client record for this user
      let clientId = await this.getOrCreateClient(userId);

      // Transform historical data to match database format
      const historicalData = businessData.business.historicalData.map(item => ({
        year: item.year,
        gross_receipts: item.grossReceipts,
        qre: item.qre
      }));

      // Prepare business data for database (matching actual schema)
      const businessRecord = {
        client_id: clientId,
        name: businessData.business.name,
        ein: businessData.business.ein,
        entity_type: businessData.business.entityType,
        start_year: businessData.business.startYear,
        domicile_state: businessData.business.state,
        contact_info: {
          address: businessData.business.address,
          city: businessData.business.city,
          state: businessData.business.state,
          zip: businessData.business.zip
        },
        is_controlled_grp: false
      };

      // Check if business already exists for this client
      const { data: existingBusiness } = await supabase
        .from('rd_businesses')
        .select('*')
        .eq('client_id', clientId)
        .eq('ein', businessData.business.ein)
        .single();

      let result;
      if (existingBusiness) {
        // Update existing business
        const { data, error } = await supabase
          .from('rd_businesses')
          .update(businessRecord)
          .eq('id', existingBusiness.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new business
        const { data, error } = await supabase
          .from('rd_businesses')
          .insert(businessRecord)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Save historical data to business_years table
      for (const historicalItem of historicalData) {
        await this.saveBusinessYear(result.id, {
          year: historicalItem.year,
          grossReceipts: historicalItem.gross_receipts,
          qre: historicalItem.qre
        });
      }

      // Create or update business year record for the tax year
      await this.saveBusinessYear(result.id, businessData.selectedYear);

      return result;
    } catch (error) {
      console.error('Error saving business:', error);
      throw error;
    }
  }

  // Get or create client record for user
  static async getOrCreateClient(userId: string): Promise<string> {
    try {
      // Handle demo mode
      if (this.isDemoMode(userId)) {
        return 'demo-client-id';
      }

      // Check if client already exists
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingClient) {
        return existingClient.id;
      }

      // Create new client (only user_id is required)
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          user_id: userId
        })
        .select('id')
        .single();

      if (error) throw error;
      return newClient.id;
    } catch (error) {
      console.error('Error getting or creating client:', error);
      throw error;
    }
  }

  // Save business year data
  static async saveBusinessYear(businessId: string, yearData: { year: number; grossReceipts: number; qre: number }): Promise<RDBusinessYear> {
    try {
      // Check if year record already exists
      const { data: existingYear } = await supabase
        .from('rd_business_years')
        .select('*')
        .eq('business_id', businessId)
        .eq('year', yearData.year)
        .single();

      let result;
      if (existingYear) {
        // Update existing year record
        const { data, error } = await supabase
          .from('rd_business_years')
          .update({
            gross_receipts: yearData.grossReceipts,
            total_qre: yearData.qre
          })
          .eq('id', existingYear.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new year record
        const { data, error } = await supabase
          .from('rd_business_years')
          .insert({
            business_id: businessId,
            year: yearData.year,
            gross_receipts: yearData.grossReceipts,
            total_qre: yearData.qre
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Error saving business year:', error);
      throw error;
    }
  }

  // Get business by ID
  static async getBusiness(businessId: string): Promise<RDBusiness | null> {
    try {
      const { data, error } = await supabase
        .from('rd_businesses')
        .select(`
          *,
          rd_business_years (*)
        `)
        .eq('id', businessId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting business:', error);
      return null;
    }
  }

  // Get business by user ID
  static async getBusinessByUser(userId: string): Promise<RDBusiness | null> {
    try {
      // Handle demo mode
      if (this.isDemoMode(userId)) {
        console.log('Demo mode detected, returning null for getBusinessByUser');
        return null;
      }

      // First get the client ID for this user
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!client) {
        return null;
      }

      // Then get the business for this client with related business years
      const { data, error } = await supabase
        .from('rd_businesses')
        .select(`
          *,
          rd_business_years (*)
        `)
        .eq('client_id', client.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting business by user:', error);
      return null;
    }
  }

  // Get business year by business ID and year
  static async getBusinessYear(businessId: string, year: number): Promise<RDBusinessYear | null> {
    try {
      const { data, error } = await supabase
        .from('rd_business_years')
        .select('*')
        .eq('business_id', businessId)
        .eq('year', year)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting business year:', error);
      return null;
    }
  }

  // Save employees
  static async saveEmployees(businessId: string, employees: any[]): Promise<RDEmployee[]> {
    try {
      // Delete existing employees for this business
      await supabase
        .from('rd_employees')
        .delete()
        .eq('business_id', businessId);

      // Insert new employees
      const employeeRecords = employees.map(emp => ({
        business_id: businessId,
        name: emp.name,
        title: emp.title,
        rd_time_percentage: emp.rdTimePercentage,
        salary: emp.salary
      }));

      const { data, error } = await supabase
        .from('rd_employees')
        .insert(employeeRecords)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving employees:', error);
      throw error;
    }
  }

  // Save expenses
  static async saveExpenses(businessYearId: string, expenses: any[]): Promise<RDExpense[]> {
    try {
      // Delete existing expenses for this business year
      await supabase
        .from('rd_expenses')
        .delete()
        .eq('business_year_id', businessYearId);

      // Insert new expenses
      const expenseRecords = expenses.map(exp => ({
        business_year_id: businessYearId,
        type: exp.type,
        description: exp.description,
        amount: exp.amount,
        rd_percentage: exp.rdPercentage
      }));

      const { data, error } = await supabase
        .from('rd_expenses')
        .insert(expenseRecords)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving expenses:', error);
      throw error;
    }
  }

  // Save calculation results
  static async saveCalculation(businessYearId: string, calculation: any): Promise<RDCalculation> {
    try {
      // Check if calculation already exists
      const { data: existingCalc } = await supabase
        .from('rd_calculations')
        .select('*')
        .eq('business_year_id', businessYearId)
        .single();

      let result;
      if (existingCalc) {
        // Update existing calculation
        const { data, error } = await supabase
          .from('rd_calculations')
          .update({
            total_qre: calculation.totalQRE,
            base_amount: calculation.baseAmount,
            incremental_qre: calculation.incrementalQRE,
            federal_credit_rate: calculation.federalCreditRate,
            federal_credit_amount: calculation.federalCreditAmount,
            state_credit_rate: calculation.stateCreditRate,
            state_credit_amount: calculation.stateCreditAmount,
            total_credit_amount: calculation.totalCreditAmount
          })
          .eq('id', existingCalc.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new calculation
        const { data, error } = await supabase
          .from('rd_calculations')
          .insert({
            business_year_id: businessYearId,
            total_qre: calculation.totalQRE,
            base_amount: calculation.baseAmount,
            incremental_qre: calculation.incrementalQRE,
            federal_credit_rate: calculation.federalCreditRate,
            federal_credit_amount: calculation.federalCreditAmount,
            state_credit_rate: calculation.stateCreditRate,
            state_credit_amount: calculation.stateCreditAmount,
            total_credit_amount: calculation.totalCreditAmount
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Error saving calculation:', error);
      throw error;
    }
  }

  // Save report
  static async saveReport(businessYearId: string, reportData: any): Promise<RDReport> {
    try {
      const { data, error } = await supabase
        .from('rd_reports')
        .insert({
          business_year_id: businessYearId,
          report_data: reportData,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }

  // Get base amount calculation from database function
  static async getBaseAmount(businessId: string, taxYear: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_base_amount', {
          business_id: businessId,
          tax_year: taxYear
        });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating base amount:', error);
      return 0;
    }
  }

  // Get base period years from database function
  static async getBasePeriodYears(businessStartYear: number, taxYear: number): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_base_period_years', {
          business_start_year: businessStartYear,
          tax_year: taxYear
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting base period years:', error);
      return [];
    }
  }

  /**
   * Enroll a business from the main businesses table into rd_businesses for R&D workflow.
   * Prevents duplicate enrollments for the same EIN and client.
   * @param businessId - The ID of the business in the businesses table
   * @param clientId - The ID of the client in the clients table
   * @returns The new or existing RDBusiness row
   */
  static async enrollBusinessFromExisting(businessId: string, clientId: string): Promise<RDBusiness> {
    console.log('[RDBusinessService] enrollBusinessFromExisting called', { businessId, clientId });
    
    // Validate inputs
    if (!businessId || !clientId) {
      console.error('[RDBusinessService] Missing required parameters', { businessId, clientId });
      throw new Error('Missing required parameters: businessId and clientId are required');
    }
    
    // 1. Check if business is already enrolled in rd_businesses
    const { data: existingRdBusiness, error: existError } = await supabase
      .from('rd_businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();
    if (existError) {
      throw new Error(`Failed to check for existing enrollment: ${existError.message}`);
    }
    if (existingRdBusiness) {
      return existingRdBusiness;
    }
    // 2. If not found in rd_businesses, copy from businesses table (initial enrollment only)
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId);
    if (fetchError) {
      throw new Error(`Failed to fetch business: ${fetchError.message}`);
    }
    if (!businesses || businesses.length === 0) {
      throw new Error('Business not found in businesses table');
    }
    const business = businesses[0];
    const rdBusinessRecord = {
      id: businessId,
      client_id: clientId,
      name: business.business_name,
      ein: business.ein,
      entity_type: business.entity_type,
      start_year: business.year_established || new Date().getFullYear(),
      domicile_state: business.business_state,
      contact_info: {
        address: business.business_address,
        city: business.business_city,
        state: business.business_state,
        zip: business.business_zip
      },
      is_controlled_grp: false,
      historical_data: []
    };
    const { data: newRdBusiness, error: insertError } = await supabase
      .from('rd_businesses')
      .insert(rdBusinessRecord)
      .select()
      .single();
    if (insertError) {
      throw new Error(`Failed to insert into rd_businesses: ${insertError.message}`);
    }
    // 3. Create business year entries for the previous 8 years (or up to start year)
    const currentYear = new Date().getFullYear();
    const startYear = newRdBusiness.start_year || currentYear;
    const yearsToCreate = [];
    for (let year = currentYear; year >= Math.max(startYear, currentYear - 7); year--) {
      yearsToCreate.push(year);
    }
    try {
      await RDBusinessService.createOrUpdateBusinessYears(
        newRdBusiness.id,
        yearsToCreate
      );
    } catch (yearError) {
      // Don't throw error here - the business was created successfully
    }
    return newRdBusiness;
  }

  /**
   * Test method to verify enrollment process
   */
  static async testEnrollment(businessId: string, clientId: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('[RDBusinessService] Testing enrollment process', { businessId, clientId });
      
      // Test 1: Check if business exists in businesses table
      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();
        
      if (fetchError || !business) {
        return { 
          success: false, 
          message: `Business not found in businesses table: ${fetchError?.message || 'Business not found'}` 
        };
      }
      
      console.log('[RDBusinessService] Test 1 PASSED: Business found in businesses table', { businessName: business.business_name });
      
      // Test 2: Check if client exists in clients table
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
        
      if (clientError || !client) {
        return { 
          success: false, 
          message: `Client not found in clients table: ${clientError?.message || 'Client not found'}` 
        };
      }
      
      console.log('[RDBusinessService] Test 2 PASSED: Client found in clients table', { clientName: client.full_name });
      
      // Test 3: Check rd_businesses table structure
      const { data: rdBusinesses, error: rdError } = await supabase
        .from('rd_businesses')
        .select('*')
        .limit(1);
        
      if (rdError) {
        return { 
          success: false, 
          message: `Error accessing rd_businesses table: ${rdError.message}` 
        };
      }
      
      console.log('[RDBusinessService] Test 3 PASSED: rd_businesses table accessible');
      
      // Test 4: Try to insert a test record (will be rolled back)
      const testRecord = {
        client_id: clientId,
        name: 'TEST_BUSINESS_DELETE_ME',
        ein: '00-0000000',
        entity_type: 'LLC',
        start_year: 2024,
        domicile_state: 'CA',
        contact_info: { address: 'TEST', city: 'TEST', state: 'CA', zip: '00000' },
        is_controlled_grp: false
      };
      
      const { data: testInsert, error: insertError } = await supabase
        .from('rd_businesses')
        .insert(testRecord)
        .select()
        .single();
        
      if (insertError) {
        return { 
          success: false, 
          message: `Error inserting test record into rd_businesses: ${insertError.message}`,
          data: { insertError, testRecord }
        };
      }
      
      console.log('[RDBusinessService] Test 4 PASSED: Can insert into rd_businesses table');
      
      // Test 5: Check rd_business_years table structure
      const { data: rdBusinessYears, error: rdYearsError } = await supabase
        .from('rd_business_years')
        .select('*')
        .limit(1);
        
      if (rdYearsError) {
        return { 
          success: false, 
          message: `Error accessing rd_business_years table: ${rdYearsError.message}` 
        };
      }
      
      console.log('[RDBusinessService] Test 5 PASSED: rd_business_years table accessible');
      
      // Test 6: Try to insert a test business year record (will be rolled back)
      const testYearRecord = {
        business_id: testInsert.id,
        year: 2024,
        gross_receipts: 100000,
        total_qre: 0
      };
      
      const { data: testYearInsert, error: yearInsertError } = await supabase
        .from('rd_business_years')
        .insert(testYearRecord)
        .select()
        .single();
        
      if (yearInsertError) {
        return { 
          success: false, 
          message: `Error inserting test record into rd_business_years: ${yearInsertError.message}`,
          data: { yearInsertError, testYearRecord }
        };
      }
      
      console.log('[RDBusinessService] Test 6 PASSED: Can insert into rd_business_years table');
      
      // Clean up test year record
      await supabase
        .from('rd_business_years')
        .delete()
        .eq('id', testYearInsert.id);
        
      console.log('[RDBusinessService] Test cleanup: Removed test year record');
      
      // Clean up test record
      await supabase
        .from('rd_businesses')
        .delete()
        .eq('id', testInsert.id);
        
      console.log('[RDBusinessService] Test cleanup: Removed test record');
      
      return { 
        success: true, 
        message: 'All enrollment tests passed successfully',
        data: { business, client }
      };
      
    } catch (error) {
      console.error('[RDBusinessService] Test enrollment error:', error);
      return { 
        success: false, 
        message: `Test enrollment failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Create or update rd_business_years entries for the specified years
   * @param businessId - The ID of the business in rd_businesses table
   * @param years - Array of years to create/update
   * @param removeUnusedYears - Whether to remove years not in the specified array (default: false)
   * @returns Array of created/updated business year records
   */
  static async createOrUpdateBusinessYears(businessId: string, years: number[], removeUnusedYears: boolean = false): Promise<any[]> {
    console.log('[RDBusinessService] createOrUpdateBusinessYears called', { businessId, years, removeUnusedYears });
    
    if (!businessId || !years || years.length === 0) {
      console.error('[RDBusinessService] Missing required parameters', { businessId, years });
      throw new Error('Missing required parameters: businessId and years array');
    }

    try {
      // First, get existing business years for this business
      const { data: existingYears, error: fetchError } = await supabase
        .from('rd_business_years')
        .select('*')
        .eq('business_id', businessId);

      if (fetchError) {
        console.error('[RDBusinessService] Error fetching existing business years:', fetchError);
        throw new Error(`Failed to fetch existing business years: ${fetchError.message}`);
      }

      console.log('[RDBusinessService] Existing business years:', existingYears);

      const existingYearSet = new Set(existingYears?.map(y => y.year) || []);
      const yearsToCreate = years.filter(year => !existingYearSet.has(year));
      const yearsToUpdate = years.filter(year => existingYearSet.has(year));

      console.log('[RDBusinessService] Years to create:', yearsToCreate);
      console.log('[RDBusinessService] Years to update:', yearsToUpdate);

      const results = [];

      // Remove unused years if requested
      if (removeUnusedYears && existingYears) {
        const yearsToRemove = existingYears.filter(year => !years.includes(year.year));
        if (yearsToRemove.length > 0) {
          console.log('[RDBusinessService] Removing unused years:', yearsToRemove.map(y => y.year));
          
          const { error: deleteError } = await supabase
            .from('rd_business_years')
            .delete()
            .in('id', yearsToRemove.map(y => y.id));

          if (deleteError) {
            console.error('[RDBusinessService] Error removing unused years:', deleteError);
            // Don't throw error, just log it
          } else {
            console.log('[RDBusinessService] Successfully removed unused years');
          }
        }
      }

      // Create new business year entries
      if (yearsToCreate.length > 0) {
        const newYearRecords = yearsToCreate.map(year => ({
          business_id: businessId,
          year: year,
          gross_receipts: 0,
          total_qre: 0
        }));

        console.log('[RDBusinessService] Creating new business year records:', newYearRecords);

        const { data: createdYears, error: createError } = await supabase
          .from('rd_business_years')
          .insert(newYearRecords)
          .select();

        if (createError) {
          console.error('[RDBusinessService] Error creating business years:', createError);
          throw new Error(`Failed to create business years: ${createError.message}`);
        }

        console.log('[RDBusinessService] Successfully created business years:', createdYears);
        results.push(...(createdYears || []));
      }

      // Update existing business year entries (if needed)
      if (yearsToUpdate.length > 0) {
        console.log('[RDBusinessService] Years already exist, no update needed:', yearsToUpdate);
        // For now, we don't update existing records, just return them
        const existingRecords = existingYears?.filter(y => yearsToUpdate.includes(y.year)) || [];
        results.push(...existingRecords);
      }

      console.log('[RDBusinessService] createOrUpdateBusinessYears completed successfully', {
        totalResults: results.length,
        createdCount: yearsToCreate.length,
        existingCount: yearsToUpdate.length
      });

      return results;

    } catch (error) {
      console.error('[RDBusinessService] Error in createOrUpdateBusinessYears:', error);
      throw error;
    }
  }
} 