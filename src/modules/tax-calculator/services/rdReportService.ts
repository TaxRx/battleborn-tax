// R&D Report Service - Handles creation, retrieval, and management of research reports
import { supabase } from "../lib/supabase";

export interface RDReport {
  id: string;
  business_id?: string;
  business_year_id: string;
  type: string;
  generated_text: string;
  editable_text?: string;
  ai_version: string;
  locked: boolean;
  generated_html?: string | null;
  created_at: string;
  updated_at: string;
}

export class RDReportService {
  static async getReport(businessYearId: string, reportType: string = 'RESEARCH_SUMMARY'): Promise<RDReport | null> {
    try {
      const { data, error } = await supabase
        .from('rd_reports')
        .select('*')
        .eq('business_year_id', businessYearId)
        .eq('type', reportType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching report:', error);
      return null;
    }
  }

  static async saveReport(
    businessYearId: string, 
    htmlContent: string, 
    reportType: string = 'RESEARCH_SUMMARY',
    extras?: { owner_splits?: Array<{ name: string; percent: number; amount: number }> }
  ): Promise<RDReport> {
    try {
      const existingReport = await this.getReport(businessYearId, reportType);
      
      // Prepare update data based on report type
      const updateData: any = {
        generated_text: `${reportType === 'FILING_GUIDE' ? 'Filing Guide' : 'Research Report'} generated on ${new Date().toLocaleDateString()}`,
        editable_text: null,
        updated_at: new Date().toISOString()
      };
      if (extras?.owner_splits) {
        updateData.owner_splits = extras.owner_splits;
      }

      // Save to appropriate column based on report type
      if (reportType === 'FILING_GUIDE') {
        updateData.filing_guide = htmlContent;
      } else {
        updateData.generated_html = htmlContent;
      }
      
      if (existingReport) {
        // Update existing report
        const { data, error } = await supabase
          .from('rd_reports')
          .update(updateData)
          .eq('id', existingReport.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new report
        const insertData: any = {
          business_year_id: businessYearId,
          type: reportType,
          generated_text: `${reportType === 'FILING_GUIDE' ? 'Filing Guide' : 'Research Report'} generated on ${new Date().toLocaleDateString()}`,
          ai_version: 'gpt-4o-mini-2024-01-25',
          locked: false
        };
        if (extras?.owner_splits) {
          insertData.owner_splits = extras.owner_splits;
        }

        // Save to appropriate column based on report type
        if (reportType === 'FILING_GUIDE') {
          insertData.filing_guide = htmlContent;
        } else {
          insertData.generated_html = htmlContent;
        }

        const { data, error } = await supabase
          .from('rd_reports')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }

  static async deleteReport(businessYearId: string, reportType: string = 'RESEARCH_SUMMARY'): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_reports')
        .delete()
        .eq('business_year_id', businessYearId)
        .eq('type', reportType);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  static async lockReport(businessYearId: string, reportType: string = 'RESEARCH_SUMMARY'): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_reports')
        .update({ 
          locked: true
        })
        .eq('business_year_id', businessYearId)
        .eq('type', reportType);

      if (error) throw error;
    } catch (error) {
      console.error('Error locking report:', error);
      throw error;
    }
  }

  static async unlockReport(businessYearId: string, reportType: string = 'RESEARCH_SUMMARY'): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_reports')
        .update({ 
          locked: false
        })
        .eq('business_year_id', businessYearId)
        .eq('type', reportType);

      if (error) throw error;
    } catch (error) {
      console.error('Error unlocking report:', error);
      throw error;
    }
  }
}

export const rdReportService = RDReportService; 