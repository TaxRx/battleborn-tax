import { supabase } from '../lib/supabase';

export interface Supply {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  annual_cost: number;
  created_at: string;
  updated_at: string;
}

export interface SupplyWithExpenses extends Supply {
  calculated_qre?: number;
  applied_percentage?: number;
  cost_amount?: number;
}

export interface QuickSupplyEntry {
  name: string;
  description: string;
  amount: string;
}

export interface SupplySubcomponentAllocation {
  id?: string;
  supply_id: string;
  subcomponent_id: string;
  business_year_id: string;
  applied_percentage: number;
  is_included: boolean;
  subcomponent_name?: string;
  step_name?: string;
}

export class SupplyManagementService {
  // Get supplies for a business year
  static async getSupplies(businessYearId: string): Promise<SupplyWithExpenses[]> {
    try {
      // First get the business_id from the business year
      const { data: businessYear, error: yearError } = await supabase
        .from('rd_business_years')
        .select('business_id')
        .eq('id', businessYearId)
        .single();

      if (yearError) throw yearError;

      const { data: supplies, error } = await supabase
        .from('rd_supplies')
        .select('*')
        .eq('business_id', businessYear.business_id);

      if (error) throw error;

      // For now, return supplies with basic info
      // We'll calculate QRE and percentages later when we have the allocation system working
      return (supplies || []).map(supply => ({
        ...supply,
        calculated_qre: 0, // Will be calculated when allocations are implemented
        applied_percentage: 0, // Will be calculated when allocations are implemented
        cost_amount: supply.annual_cost
      }));
    } catch (error) {
      console.error('Error fetching supplies:', error);
      throw error;
    }
  }

  // Add a new supply
  static async addSupply(supplyData: QuickSupplyEntry, businessId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_supplies')
        .insert({
          business_id: businessId,
          name: supplyData.name,
          description: supplyData.description,
          annual_cost: parseFloat(supplyData.amount.replace(/[^0-9.]/g, ''))
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding supply:', error);
      throw error;
    }
  }

  // Update supply
  static async updateSupply(supplyId: string, updates: Partial<Supply>): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_supplies')
        .update(updates)
        .eq('id', supplyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating supply:', error);
      throw error;
    }
  }

  // Delete supply
  static async deleteSupply(supplyId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting supply:', supplyId);
      
      // Delete the supply directly (related records will be handled by CASCADE)
      const { error } = await supabase
        .from('rd_supplies')
        .delete()
        .eq('id', supplyId);

      if (error) throw error;
      console.log('✅ Supply deleted successfully');
    } catch (error) {
      console.error('Error deleting supply:', error);
      throw error;
    }
  }

  // Get all available subcomponents for a business year (contractor modal approach)
  static async getAvailableSubcomponents(businessYearId: string): Promise<any[]> {
    try {
      // Fetch selected subcomponents with join to rd_research_subcomponents (like contractor modal)
      const { data, error } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          *,
          subcomponent:rd_research_subcomponents (
            id,
            name
          )
        `)
        .eq('business_year_id', businessYearId);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.subcomponent_id,
        subcomponent_id: item.subcomponent_id, // Use the original ID from rd_selected_subcomponents
        title: item.subcomponent?.name || item.step_name || 'Untitled',
        step_name: item.step_name
      }));
    } catch (error) {
      console.error('Error fetching available subcomponents:', error);
      throw error;
    }
  }

  // Get all allocations for a supply in a business year
  static async getSupplyAllocations(supplyId: string, businessYearId: string): Promise<SupplySubcomponentAllocation[]> {
    const { data, error } = await supabase
      .from('rd_supply_subcomponents')
      .select('*')
      .eq('supply_id', supplyId)
      .eq('business_year_id', businessYearId);
    if (error) throw error;
    return data || [];
  }

  // Save all allocations for a supply in a business year (upsert)
  static async saveSupplyAllocations(
    supplyId: string,
    businessYearId: string,
    allocations: SupplySubcomponentAllocation[]
  ): Promise<void> {
    // Upsert all allocations (unique on supply_id, subcomponent_id, business_year_id)
    if (!allocations.length) return;
    const upserts = allocations.map(a => ({
      supply_id: supplyId,
      subcomponent_id: a.subcomponent_id,
      business_year_id: businessYearId,
      applied_percentage: a.applied_percentage,
      is_included: a.is_included
    }));
    const { error } = await supabase
      .from('rd_supply_subcomponents')
      .upsert(upserts, { onConflict: 'supply_id,subcomponent_id,business_year_id' });
    if (error) throw error;
  }
} 