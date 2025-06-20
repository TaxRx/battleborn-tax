import { supabase } from '../services/supabase.service';
import { SavedCalculation } from '../types';

export class CalculationRepository {
  private static instance: CalculationRepository;

  private constructor() {}

  public static getInstance(): CalculationRepository {
    if (!CalculationRepository.instance) {
      CalculationRepository.instance = new CalculationRepository();
    }
    return CalculationRepository.instance;
  }

  async getCalculations(userId: string): Promise<SavedCalculation[]> {
    try {
      const { data, error } = await supabase
        .from('tax_calculations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting calculations:', error);
      return [];
    }
  }

  async getCalculationByYear(userId: string, year: number): Promise<SavedCalculation | null> {
    try {
      const { data, error } = await supabase
        .from('tax_calculations')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting calculation by year:', error);
      return null;
    }
  }

  async saveCalculation(userId: string, calculation: SavedCalculation): Promise<SavedCalculation | null> {
    try {
      const { data, error } = await supabase
        .from('tax_calculations')
        .upsert({
          user_id: userId,
          year: calculation.year,
          tax_info: calculation.taxInfo,
          breakdown: calculation.breakdown,
          strategies: calculation.strategies,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving calculation:', error);
      return null;
    }
  }

  async deleteCalculation(userId: string, calculationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tax_calculations')
        .delete()
        .eq('user_id', userId)
        .eq('id', calculationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting calculation:', error);
      return false;
    }
  }
}

export const calculationRepository = CalculationRepository.getInstance();