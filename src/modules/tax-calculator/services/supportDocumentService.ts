import { supabase } from '../../../lib/supabase';

export interface SupportDocument {
  id: string;
  business_year_id: string;
  document_type: 'invoice' | 'form_1099' | 'procedure_report';
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  linked_to_type?: 'supply' | 'contractor' | null;
  linked_to_id?: string | null;
  ai_analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
  ai_analysis_results?: any;
  upload_status: 'uploading' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface ProcedureCodeAnalysis {
  activity_id: string;
  activity_title: string;
  subcomponent_id: string;
  subcomponent_name: string;
  procedure_codes: string[];
  confidence_score: number;
  billable_time_percentage: number;
  analysis_notes: string;
}

export interface DocumentUploadResult {
  success: boolean;
  document?: SupportDocument;
  error?: string;
}

export class SupportDocumentService {
  
  /**
   * Upload a file to Supabase storage and create a document record
   */
  static async uploadDocument(
    file: File,
    businessYearId: string,
    documentType: 'invoice' | 'form_1099' | 'procedure_report',
    linkedToType?: 'supply' | 'contractor',
    linkedToId?: string
  ): Promise<DocumentUploadResult> {
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${businessYearId}/${documentType}/${fileName}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('support-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('File upload error:', uploadError);
        return { success: false, error: 'Failed to upload file' };
      }

      // Create document record in database
      const { data: document, error: dbError } = await supabase
        .from('rd_support_documents')
        .insert({
          business_year_id: businessYearId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          linked_to_type: linkedToType || null,
          linked_to_id: linkedToId || null,
          upload_status: 'completed',
          ai_analysis_status: documentType === 'procedure_report' ? 'pending' : null
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return { success: false, error: 'Failed to save document record' };
      }

      // If it's a procedure report, trigger AI analysis
      if (documentType === 'procedure_report') {
        this.triggerAIAnalysis(document.id, businessYearId).catch(error => {
          console.error('AI analysis trigger failed:', error);
        });
      }

      return { success: true, document };
      
    } catch (error) {
      console.error('Upload document error:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get all support documents for a business year
   */
  static async getDocuments(businessYearId: string): Promise<SupportDocument[]> {
    try {
      const { data, error } = await supabase
        .from('rd_support_documents')
        .select('*')
        .eq('business_year_id', businessYearId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  /**
   * Get document download URL
   */
  static async getDocumentUrl(filePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('support-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  }

  /**
   * Delete a support document
   */
  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // First get the document to retrieve file path
      const { data: document, error: fetchError } = await supabase
        .from('rd_support_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('support-documents')
        .remove([document.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('rd_support_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  /**
   * Update document linking
   */
  static async updateDocumentLink(
    documentId: string,
    linkedToType: 'supply' | 'contractor' | null,
    linkedToId: string | null
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rd_support_documents')
        .update({
          linked_to_type: linkedToType,
          linked_to_id: linkedToId,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating document link:', error);
      return false;
    }
  }

  /**
   * Trigger AI analysis for procedure reports
   */
  private static async triggerAIAnalysis(documentId: string, businessYearId: string): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('rd_support_documents')
        .update({ ai_analysis_status: 'processing' })
        .eq('id', documentId);

      // In a real implementation, this would:
      // 1. Download the file
      // 2. Extract procedure codes using OCR/text parsing
      // 3. Use OpenAI to match codes to research activities
      // 4. Calculate billable time percentages
      // 5. Generate linking recommendations

      // For now, we'll simulate the analysis
      setTimeout(async () => {
        const mockAnalysis = await this.generateMockAnalysis(businessYearId);
        
        await supabase
          .from('rd_support_documents')
          .update({
            ai_analysis_status: 'completed',
            ai_analysis_results: mockAnalysis
          })
          .eq('id', documentId);
      }, 5000); // Simulate 5 second processing time

    } catch (error) {
      console.error('AI analysis error:', error);
      await supabase
        .from('rd_support_documents')
        .update({ ai_analysis_status: 'failed' })
        .eq('id', documentId);
    }
  }

  /**
   * Generate mock AI analysis results
   */
  private static async generateMockAnalysis(businessYearId: string): Promise<ProcedureCodeAnalysis[]> {
    // Get selected activities for this business year
    const { data: activities, error } = await supabase
      .from('rd_selected_activities')
      .select(`
        rd_research_activities (
          id,
          title
        )
      `)
      .eq('business_year_id', businessYearId);

    if (error || !activities) return [];

    // Generate mock analysis results
    return activities.map((activity, index) => ({
      activity_id: activity.rd_research_activities.id,
      activity_title: activity.rd_research_activities.title,
      subcomponent_id: `mock-subcomponent-${index}`,
      subcomponent_name: `Research Component ${index + 1}`,
      procedure_codes: [`CPT-${12000 + index}`, `CPT-${13000 + index}`],
      confidence_score: 0.85 + (Math.random() * 0.1),
      billable_time_percentage: 15 + (Math.random() * 25),
      analysis_notes: `High confidence match based on procedure code patterns. Recommended allocation aligns with research activity focus.`
    }));
  }

  /**
   * Get document statistics for a business year
   */
  static async getDocumentStats(businessYearId: string): Promise<{
    totalDocuments: number;
    linkedItems: number;
    aiAnalyzed: number;
    coveragePercentage: number;
  }> {
    try {
      const documents = await this.getDocuments(businessYearId);
      
      const totalDocuments = documents.length;
      const linkedItems = documents.filter(doc => doc.linked_to_id).length;
      const aiAnalyzed = documents.filter(doc => doc.ai_analysis_status === 'completed').length;
      const coveragePercentage = totalDocuments > 0 ? Math.round((linkedItems / totalDocuments) * 100) : 0;

      return {
        totalDocuments,
        linkedItems,
        aiAnalyzed,
        coveragePercentage
      };
    } catch (error) {
      console.error('Error calculating document stats:', error);
      return {
        totalDocuments: 0,
        linkedItems: 0,
        aiAnalyzed: 0,
        coveragePercentage: 0
      };
    }
  }

  /**
   * Get AI analysis results for procedure reports
   */
  static async getAIAnalysisResults(businessYearId: string): Promise<ProcedureCodeAnalysis[]> {
    try {
      const { data: documents, error } = await supabase
        .from('rd_support_documents')
        .select('ai_analysis_results')
        .eq('business_year_id', businessYearId)
        .eq('document_type', 'procedure_report')
        .eq('ai_analysis_status', 'completed')
        .not('ai_analysis_results', 'is', null);

      if (error) throw error;

      // Flatten all analysis results
      const allResults: ProcedureCodeAnalysis[] = [];
      documents?.forEach(doc => {
        if (doc.ai_analysis_results && Array.isArray(doc.ai_analysis_results)) {
          allResults.push(...doc.ai_analysis_results);
        }
      });

      return allResults;
    } catch (error) {
      console.error('Error fetching AI analysis results:', error);
      return [];
    }
  }
} 