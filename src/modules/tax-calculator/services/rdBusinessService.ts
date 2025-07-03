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
        .from('rd_clients')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingClient) {
        return existingClient.id;
      }

      // Create new client (only user_id is required)
      const { data: newClient, error } = await supabase
        .from('rd_clients')
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
        .select('*')
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
        .from('rd_clients')
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
} 