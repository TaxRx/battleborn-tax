import { supabase } from '../lib/supabase';

export interface QCStatus {
  qc_status: string;
  qc_approved_by: string | null;
  qc_approved_at: string | null;
  qc_notes: string | null;
  payment_received: boolean;
  payment_received_at: string | null;
  payment_amount: number | null;
  documents_released: boolean;
  documents_released_at: string | null;
}

export interface QCDocumentControl {
  id: string;
  document_type: string;
  is_released: boolean;
  released_at: string | null;
  release_notes: string | null;
  requires_jurat: boolean;
  requires_payment: boolean;
  qc_reviewer: string | null;
  qc_reviewed_at: string | null;
  qc_review_notes: string | null;
}

export interface PortalToken {
  id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  access_count: number;
  last_accessed_at: string | null;
}

export interface JuratSignature {
  id: string;
  business_year_id: string;
  signer_name: string;
  signer_title: string;
  signer_email: string;
  signed_at: string;
  jurat_text: string;
}

export class QCService {
  private static instance: QCService;

  static getInstance(): QCService {
    if (!QCService.instance) {
      QCService.instance = new QCService();
    }
    return QCService.instance;
  }

  // Get QC status for a business year
  async getQCStatus(businessYearId: string): Promise<QCStatus | null> {
    try {
      const { data, error } = await supabase
        .from('rd_business_years')
        .select('qc_status, qc_approved_by, qc_approved_at, qc_notes, payment_received, payment_received_at, payment_amount, documents_released, documents_released_at')
        .eq('id', businessYearId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting QC status:', error);
      return null;
    }
  }

  // Update QC status
  async updateQCStatus(businessYearId: string, status: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rd_business_years')
        .update({
          qc_status: status,
          qc_approved_at: ['approved', 'complete'].includes(status) ? new Date().toISOString() : null,
          qc_notes: notes
        })
        .eq('id', businessYearId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating QC status:', error);
      return false;
    }
  }

  // Toggle payment received status
  async togglePaymentReceived(businessYearId: string, amount?: number): Promise<boolean> {
    try {
      // First get current status
      const { data: current } = await supabase
        .from('rd_business_years')
        .select('payment_received')
        .eq('id', businessYearId)
        .single();

      const newStatus = !current?.payment_received;

      const { error } = await supabase
        .from('rd_business_years')
        .update({
          payment_received: newStatus,
          payment_received_at: newStatus ? new Date().toISOString() : null,
          payment_amount: newStatus ? amount : null
        })
        .eq('id', businessYearId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling payment status:', error);
      return false;
    }
  }

  // Get document controls for a business year
  async getDocumentControls(businessYearId: string): Promise<QCDocumentControl[]> {
    try {
      const { data, error } = await supabase
        .from('rd_qc_document_controls')
        .select('*')
        .eq('business_year_id', businessYearId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting document controls:', error);
      return [];
    }
  }

  // Update document control
  async updateDocumentControl(
    businessYearId: string, 
    documentType: string, 
    updates: Partial<QCDocumentControl>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rd_qc_document_controls')
        .update(updates)
        .eq('business_year_id', businessYearId)
        .eq('document_type', documentType);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating document control:', error);
      return false;
    }
  }

  // Release document
  async releaseDocument(businessYearId: string, documentType: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rd_qc_document_controls')
        .update({
          is_released: true,
          released_at: new Date().toISOString(),
          release_notes: notes
        })
        .eq('business_year_id', businessYearId)
        .eq('document_type', documentType);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error releasing document:', error);
      return false;
    }
  }

  // Generate portal token for a business
  async generatePortalToken(businessId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('generate_portal_token', {
        p_business_id: businessId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating portal token:', error);
      return null;
    }
  }

  // Get portal token for a business
  async getPortalToken(businessId: string): Promise<PortalToken | null> {
    try {
      const { data, error } = await supabase
        .from('rd_client_portal_tokens')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return data;
    } catch (error) {
      console.error('Error getting portal token:', error);
      return null;
    }
  }

  // Revoke portal token
  async revokePortalToken(tokenId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rd_client_portal_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error revoking portal token:', error);
      return false;
    }
  }

  // Get jurat signatures for a business year
  async getJuratSignatures(businessYearId: string): Promise<JuratSignature[]> {
    try {
      const { data, error } = await supabase
        .from('rd_signatures')
        .select('*')
        .eq('business_year_id', businessYearId)
        .eq('signature_type', 'jurat')
        .order('signed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting jurat signatures:', error);
      return [];
    }
  }

  // Check document release eligibility
  async checkDocumentReleaseEligibility(businessYearId: string, documentType: string): Promise<{
    can_release: boolean;
    reason: string;
    jurat_signed: boolean;
    payment_received: boolean;
    qc_approved: boolean;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('check_document_release_eligibility', {
        p_business_year_id: businessYearId,
        p_document_type: documentType
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error checking document release eligibility:', error);
      return null;
    }
  }

  // Get portal URL for a business
  getPortalUrl(businessId: string, token: string): string {
    return `${window.location.origin}/client-portal/${businessId}/${token}`;
  }

  // Initialize QC controls for a new business year
  async initializeQCControls(businessYearId: string): Promise<boolean> {
    try {
      const documentTypes = [
        { type: 'research_report', requires_jurat: false, requires_payment: false },
        { type: 'filing_guide', requires_jurat: true, requires_payment: true },
        { type: 'allocation_report', requires_jurat: false, requires_payment: false }
      ];

      const controls = documentTypes.map(doc => ({
        business_year_id: businessYearId,
        document_type: doc.type,
        requires_jurat: doc.requires_jurat,
        requires_payment: doc.requires_payment
      }));

      const { error } = await supabase
        .from('rd_qc_document_controls')
        .upsert(controls, { 
          onConflict: 'business_year_id,document_type',
          ignoreDuplicates: true 
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error initializing QC controls:', error);
      return false;
    }
  }
}

export const qcService = QCService.getInstance(); 