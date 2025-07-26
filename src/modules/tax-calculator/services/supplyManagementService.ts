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

      // Get all supplies for this business
      const { data: supplies, error } = await supabase
        .from('rd_supplies')
        .select('*')
        .eq('business_id', businessYear.business_id);

      if (error) throw error;

      // For each supply, aggregate allocations for this business year
      const supplyIds = (supplies || []).map(s => s.id);
      let allocations: any[] = [];
      if (supplyIds.length > 0) {
        const { data: allocs, error: allocError } = await supabase
          .from('rd_supply_subcomponents')
          .select('supply_id, applied_percentage, amount_applied, is_included')
          .eq('business_year_id', businessYearId)
          .in('supply_id', supplyIds);
        if (allocError) throw allocError;
        allocations = allocs || [];
      }

      // Aggregate QRE and applied % for each supply
      const suppliesWithQRE = (supplies || []).map(supply => {
        const supplyAllocs = allocations.filter(a => a.supply_id === supply.id && a.is_included);
        const totalQRE = supplyAllocs.reduce((sum, a) => sum + (a.amount_applied || 0), 0);
        const totalAppliedPct = supplyAllocs.reduce((sum, a) => sum + (a.applied_percentage || 0), 0);
        return {
          ...supply,
          calculated_qre: totalQRE,
          applied_percentage: totalAppliedPct,
          cost_amount: supply.annual_cost
        };
      });
      
      console.log(`🔍 SupplyManagementService.getSupplies: Found ${suppliesWithQRE.length} total supplies for business, ${suppliesWithQRE.filter(s => s.calculated_qre > 0).length} with QRE > 0 for year ${businessYearId}`);
      
      return suppliesWithQRE;
    } catch (error) {
      console.error('Error fetching supplies:', error);
      throw error;
    }
  }

  // Add a new supply with year-specific subcomponent record
  static async addSupply(supplyData: QuickSupplyEntry, businessId: string, businessYearId?: string): Promise<void> {
    try {
      console.log('🔄 SupplyManagementService.addSupply: Creating supply for business:', businessId, 'year:', businessYearId);
      
      // Create the supply record
      const { data: newSupply, error: supplyError } = await supabase
        .from('rd_supplies')
        .insert({
          business_id: businessId,
          name: supplyData.name,
          description: supplyData.description,
          annual_cost: parseFloat(supplyData.amount.replace(/[^0-9.]/g, ''))
        })
        .select()
        .single();

      if (supplyError) throw supplyError;
      
      console.log('✅ Created supply:', newSupply.id);

      // CRITICAL FIX: Create a subcomponent record for the specific year so it shows up in EmployeeSetupStep
      if (businessYearId && newSupply) {
        console.log('🔗 Creating year-specific subcomponent record for supply:', newSupply.id, 'in year:', businessYearId);
        
        const { error: subcomponentError } = await supabase
          .from('rd_supply_subcomponents')
          .insert({
            supply_id: newSupply.id,
            business_year_id: businessYearId,
            applied_percentage: 0,
            amount_applied: 0,
            is_included: true,
            subcomponent_id: null // Will be set when user allocates to research activities
          });

        if (subcomponentError) {
          console.error('❌ Error creating subcomponent record:', subcomponentError);
          // Don't throw here - supply was created successfully, subcomponent can be added later
        } else {
          console.log('✅ Created year-specific subcomponent record for supply');
        }
      } else {
        console.log('⚠️ No businessYearId provided - supply will only appear when explicitly allocated');
      }
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
      // Fetch selected subcomponents with join to rd_research_subcomponents and steps
      const { data, error } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          *,
          subcomponent:rd_research_subcomponents (
            id,
            name
          ),
          step:rd_research_steps (
            id,
            name
          )
        `)
        .eq('business_year_id', businessYearId);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.subcomponent_id,
        subcomponent_id: item.subcomponent_id,
        title: item.subcomponent?.name || 'Untitled Subcomponent',
        step_name: item.step?.name || item.step_name || 'Untitled Step'
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
    try {
      console.log('💾 Saving supply allocations:', { supplyId, businessYearId, allocations });
      
      // First, let's check if we can access the supply and business year
      const { data: supply, error: supplyError } = await supabase
        .from('rd_supplies')
        .select('*')
        .eq('id', supplyId)
        .single();

      if (supplyError) {
        console.error('❌ Error accessing supply:', supplyError);
        throw supplyError;
      }

      const { data: businessYear, error: yearError } = await supabase
        .from('rd_business_years')
        .select('*')
        .eq('id', businessYearId)
        .single();

      if (yearError) {
        console.error('❌ Error accessing business year:', yearError);
        throw yearError;
      }

      console.log('✅ Supply and business year access confirmed:', { supply, businessYear });
      
      // First, delete existing allocations for this supply and business year
      const { error: deleteError } = await supabase
        .from('rd_supply_subcomponents')
        .delete()
        .eq('supply_id', supplyId)
        .eq('business_year_id', businessYearId);

      if (deleteError) {
        console.error('❌ Error deleting existing allocations:', deleteError);
        throw deleteError;
      }

      console.log('✅ Existing allocations deleted');

      // Then insert new allocations
      if (allocations.length > 0) {
        const inserts = allocations.map(a => ({
          supply_id: supplyId,
          subcomponent_id: a.subcomponent_id,
          business_year_id: businessYearId,
          applied_percentage: a.applied_percentage,
          is_included: a.is_included
        }));

        console.log('📝 Inserting allocations:', inserts);

        const { error: insertError } = await supabase
          .from('rd_supply_subcomponents')
          .insert(inserts);

        if (insertError) {
          console.error('❌ Error inserting allocations:', insertError);
          throw insertError;
        }
      }

      console.log('✅ Supply allocations saved successfully');
    } catch (error) {
      console.error('❌ Error saving supply allocations:', error);
      throw error;
    }
  }
} 