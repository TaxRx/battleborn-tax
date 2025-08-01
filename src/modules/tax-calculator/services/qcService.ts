import { supabase, supabaseAdmin } from '../lib/supabase';

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

  // Generate magic link for client portal access
  async generateMagicLink(businessId: string): Promise<string | null> {
    try {
      console.log('🔗 [QCService] Starting magic link generation for business:', businessId);

      // Check if admin client is available
      if (!supabaseAdmin) {
        console.error('❌ [QCService] Admin client not available - service key required');
        throw new Error('Magic link generation requires admin permissions. Please configure VITE_SUPABASE_SERVICE_KEY.');
      }

      // First, get the business and its associated client email
      const { data: business, error: businessError } = await supabase
        .from('rd_businesses')
        .select(`
          id,
          client_id,
          name,
          clients:client_id (
            id,
            email,
            full_name
          )
        `)
        .eq('id', businessId)
        .single();

      if (businessError) {
        console.error('❌ [QCService] Error fetching business:', businessError);
        throw businessError;
      }

      if (!business?.clients?.email) {
        console.error('❌ [QCService] No client email found for business:', business);
        throw new Error('No client email found for this business');
      }

      console.log('📧 [QCService] Generating magic link for:', business.clients.email);

      // Generate magic link using Supabase Admin API with service key
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: business.clients.email,
        options: {
          redirectTo: `${window.location.origin}/client-portal/${business.clients.id}`,
          data: {
            client_id: business.clients.id,
            business_id: businessId
          }
        }
      });

      if (error) {
        console.error('❌ [QCService] Error generating magic link:', error);
        throw error;
      }

      if (!data.properties?.action_link) {
        console.error('❌ [QCService] No action link returned from Supabase');
        throw new Error('No action link returned from Supabase');
      }

      console.log('✅ [QCService] Magic link generated successfully');
      return data.properties.action_link;

    } catch (error) {
      console.error('❌ [QCService] Error generating magic link:', error);
      
      // If it's a specific admin permission error, provide helpful message
      if (error.message?.includes('User not allowed') || error.message?.includes('403')) {
        throw new Error('Magic link generation requires admin permissions. Please ensure the service key is properly configured.');
      }
      
      throw error;
    }
  }

  // Legacy method - kept for backward compatibility but deprecated
  async generatePortalToken(businessId: string): Promise<string | null> {
    console.warn('generatePortalToken is deprecated. Use generateMagicLink instead.');
    const magicLink = await this.generateMagicLink(businessId);
    // Extract just a mock token for display purposes if needed
    return magicLink ? 'magic-link-generated' : null;
  }

  // Get portal token for a business
  async getPortalToken(businessId: string): Promise<PortalToken | null> {
    try {
      const { data, error } = await supabase
        .from('rd_client_portal_tokens')
        .select('*')
        .eq('business_id', businessId)
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
        .delete()
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