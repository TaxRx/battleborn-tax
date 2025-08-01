import { supabase } from '../../../lib/supabase';

export interface StateProFormaLine {
  id?: string;
  state_proforma_id?: string;
  line_number: string;
  description: string;
  amount: number;
  is_editable: boolean;
  is_calculated: boolean;
  calculation_formula?: string;
  line_type?: string;
  sort_order: number;
}

export interface StateProForma {
  id?: string;
  business_year_id: string;
  state_code: string;
  config: any;
  total_credit: number;
  lines?: StateProFormaLine[];
}

export class StateProFormaService {
  // Get state pro forma for a business year and state
  static async getStateProForma(businessYearId: string, stateCode: string): Promise<StateProForma | null> {
    try {
      const { data, error } = await supabase
        .from('rd_state_proformas')
        .select(`
          *,
          rd_state_proforma_lines (*)
        `)
        .eq('business_year_id', businessYearId)
        .eq('state_code', stateCode)
        .single();

      if (error) {
        console.error('[StateProFormaService] Error fetching state pro forma:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[StateProFormaService] Error fetching state pro forma:', error);
      return null;
    }
  }

  // Save or update state pro forma
  static async saveStateProForma(proForma: StateProForma): Promise<StateProForma | null> {
    try {
      let result;

      if (proForma.id) {
        // Update existing pro forma
        const { data, error } = await supabase
          .from('rd_state_proformas')
          .update({
            config: proForma.config,
            total_credit: proForma.total_credit,
            updated_at: new Date().toISOString()
          })
          .eq('id', proForma.id)
          .select()
          .single();

        if (error) {
          console.error('[StateProFormaService] Error updating state pro forma:', error);
          return null;
        }

        result = data;
      } else {
        // Insert new pro forma
        const { data, error } = await supabase
          .from('rd_state_proformas')
          .insert({
            business_year_id: proForma.business_year_id,
            state_code: proForma.state_code,
            config: proForma.config,
            total_credit: proForma.total_credit
          })
          .select()
          .single();

        if (error) {
          console.error('[StateProFormaService] Error inserting state pro forma:', error);
          return null;
        }

        result = data;
      }

      // Save lines if provided
      if (proForma.lines && result) {
        await this.saveStateProFormaLines(result.id, proForma.lines);
      }

      return result;
    } catch (error) {
      console.error('[StateProFormaService] Error saving state pro forma:', error);
      return null;
    }
  }

  // Save state pro forma lines
  static async saveStateProFormaLines(stateProFormaId: string, lines: StateProFormaLine[]): Promise<boolean> {
    try {
      // Delete existing lines
      const { error: deleteError } = await supabase
        .from('rd_state_proforma_lines')
        .delete()
        .eq('state_proforma_id', stateProFormaId);

      if (deleteError) {
        console.error('[StateProFormaService] Error deleting existing lines:', deleteError);
        return false;
      }

      // Insert new lines
      const linesToInsert = lines.map(line => ({
        ...line,
        state_proforma_id: stateProFormaId
      }));

      const { error: insertError } = await supabase
        .from('rd_state_proforma_lines')
        .insert(linesToInsert);

      if (insertError) {
        console.error('[StateProFormaService] Error inserting lines:', insertError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[StateProFormaService] Error saving state pro forma lines:', error);
      return false;
    }
  }

  // Get all state pro formas for a business year
  static async getStateProFormasForBusinessYear(businessYearId: string): Promise<StateProForma[]> {
    try {
      const { data, error } = await supabase
        .from('rd_state_proformas')
        .select(`
          *,
          rd_state_proforma_lines (*)
        `)
        .eq('business_year_id', businessYearId)
        .order('state_code');

      if (error) {
        console.error('[StateProFormaService] Error fetching state pro formas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[StateProFormaService] Error fetching state pro formas:', error);
      return [];
    }
  }

  // Delete state pro forma
  static async deleteStateProForma(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rd_state_proformas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[StateProFormaService] Error deleting state pro forma:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[StateProFormaService] Error deleting state pro forma:', error);
      return false;
    }
  }
} 