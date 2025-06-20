import { supabase } from '../../../lib/supabase';
import { 
  ClientProfile, 
  TaxProposal, 
  AffiliateStats, 
  CreateClientForm,
  TaxInfoForm,
  ProposalStatus 
} from '../../shared/types';

class AffiliateService {
  private static instance: AffiliateService;

  static getInstance(): AffiliateService {
    if (!AffiliateService.instance) {
      AffiliateService.instance = new AffiliateService();
    }
    return AffiliateService.instance;
  }

  // Client Management
  async getClients(affiliateId: string): Promise<ClientProfile[]> {
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }

  async getClient(clientId: string): Promise<ClientProfile | null> {
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching client:', error);
      return null;
    }
  }

  async createClient(affiliateId: string, clientData: CreateClientForm): Promise<ClientProfile> {
    try {
      const newClient = {
        id: crypto.randomUUID(),
        affiliate_id: affiliateId,
        personal_info: {
          full_name: clientData.full_name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
        },
        tax_info: {
          filing_status: 'single' as const,
          dependents: 0,
          state: clientData.address.state,
          wages_income: 0,
          business_income: 0,
          passive_income: 0,
          capital_gains: 0,
          other_income: 0,
          current_deductions: 0,
          qbi_eligible: false,
          business_owner: false,
          high_income: false,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('client_profiles')
        .insert(newClient)
        .select()
        .single();

      if (error) throw error;

      // Update affiliate client count
      await this.updateAffiliateStats(affiliateId);

      return data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async updateClientTaxInfo(clientId: string, taxInfo: TaxInfoForm): Promise<ClientProfile | null> {
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .update({
          tax_info: {
            ...taxInfo,
            high_income: (taxInfo.wages_income + taxInfo.business_income) > 400000,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating client tax info:', error);
      return null;
    }
  }

  // Proposal Management
  async getProposals(affiliateId: string): Promise<TaxProposal[]> {
    try {
      const { data, error } = await supabase
        .from('tax_proposals')
        .select(`
          *,
          client_profiles!inner(personal_info)
        `)
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching proposals:', error);
      return [];
    }
  }

  async getProposal(proposalId: string): Promise<TaxProposal | null> {
    try {
      const { data, error } = await supabase
        .from('tax_proposals')
        .select(`
          *,
          client_profiles!inner(*)
        `)
        .eq('id', proposalId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching proposal:', error);
      return null;
    }
  }

  async createProposal(proposalData: {
    client_id: string;
    affiliate_id: string;
    tax_info: any;
    selected_strategies: any[];
    calculation: any;
    status: ProposalStatus;
  }): Promise<TaxProposal> {
    try {
      const proposal = {
        id: crypto.randomUUID(),
        client_id: proposalData.client_id,
        affiliate_id: proposalData.affiliate_id,
        status: 'draft' as ProposalStatus,
        baseline_calculation: {
          total_income: proposalData.calculation.totalIncome || 0,
          federal_tax: proposalData.calculation.federalTax || 0,
          state_tax: proposalData.calculation.stateTax || 0,
          total_tax: proposalData.calculation.totalTax || 0,
          effective_rate: proposalData.calculation.effectiveRate || 0,
        },
        proposed_strategies: proposalData.selected_strategies,
        projected_savings: {
          annual_savings: proposalData.calculation.annualSavings || 0,
          five_year_value: proposalData.calculation.fiveYearValue || 0,
          total_tax_reduction: proposalData.calculation.totalTaxReduction || 0,
        },
        admin_notes: [],
        documents: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tax_proposals')
        .insert(proposal)
        .select()
        .single();

      if (error) throw error;

      // Update affiliate stats
      await this.updateAffiliateStats(proposalData.affiliate_id);

      return data;
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }

  async submitProposal(proposalId: string): Promise<TaxProposal | null> {
    try {
      const { data, error } = await supabase
        .from('tax_proposals')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
        .select()
        .single();

      if (error) throw error;

      // Trigger notification to admins
      await this.notifyAdminsOfNewProposal(proposalId);

      return data;
    } catch (error) {
      console.error('Error submitting proposal:', error);
      return null;
    }
  }

  async updateProposal(proposalId: string, updates: Partial<TaxProposal>): Promise<TaxProposal | null> {
    try {
      const { data, error } = await supabase
        .from('tax_proposals')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating proposal:', error);
      return null;
    }
  }

  // Statistics
  async getStats(affiliateId: string): Promise<AffiliateStats> {
    try {
      // Get client count
      const { count: clientCount } = await supabase
        .from('client_profiles')
        .select('*', { count: 'exact' })
        .eq('affiliate_id', affiliateId);

      // Get proposal count and stats
      const { data: proposals } = await supabase
        .from('tax_proposals')
        .select('status, projected_savings')
        .eq('affiliate_id', affiliateId);

      const totalProposals = proposals?.length || 0;
      const pendingReview = proposals?.filter(p => p.status === 'in_review').length || 0;
      const totalSavingsProjected = proposals?.reduce((sum, p) => sum + (p.projected_savings?.annual_savings || 0), 0) || 0;

      // Calculate commission (10% of projected savings for approved proposals)
      const approvedProposals = proposals?.filter(p => p.status === 'approved' || p.status === 'finalized') || [];
      const commissionEarned = approvedProposals.reduce((sum, p) => sum + (p.projected_savings?.annual_savings || 0) * 0.1, 0);

      // Calculate conversion rate
      const submittedProposals = proposals?.filter(p => p.status !== 'draft').length || 0;
      const conversionRate = clientCount ? (submittedProposals / clientCount) * 100 : 0;

      // Mock monthly growth (would be calculated from historical data)
      const monthlyGrowth = 15.5;

      return {
        total_proposals: totalProposals,
        pending_review: pendingReview,
        total_savings_projected: totalSavingsProjected,
        active_clients: clientCount || 0,
        monthly_growth: monthlyGrowth,
        commission_earned: commissionEarned,
        conversion_rate: conversionRate,
      };
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
      return {
        total_proposals: 0,
        pending_review: 0,
        total_savings_projected: 0,
        active_clients: 0,
        monthly_growth: 0,
        commission_earned: 0,
        conversion_rate: 0,
      };
    }
  }

  // Helper Methods
  private async updateAffiliateStats(affiliateId: string): Promise<void> {
    try {
      const stats = await this.getStats(affiliateId);
      
      await supabase
        .from('profiles')
        .update({
          clients_count: stats.active_clients,
          total_proposals: stats.total_proposals,
          updated_at: new Date().toISOString(),
        })
        .eq('id', affiliateId);
    } catch (error) {
      console.error('Error updating affiliate stats:', error);
    }
  }

  private async notifyAdminsOfNewProposal(proposalId: string): Promise<void> {
    try {
      // Get all admin users
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'admin')
        .eq('is_active', true);

      if (!admins) return;

      // Create notifications for each admin
      const notifications = admins.map(admin => ({
        id: crypto.randomUUID(),
        user_id: admin.id,
        type: 'proposal_submitted' as const,
        title: 'New Proposal Submitted',
        message: `A new tax proposal has been submitted for review.`,
        read: false,
        created_at: new Date().toISOString(),
        action_url: `/admin/proposals/${proposalId}`,
      }));

      await supabase
        .from('notifications')
        .insert(notifications);
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }

  // Search and Filter
  async searchClients(affiliateId: string, query: string): Promise<ClientProfile[]> {
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .ilike('personal_info->>full_name', `%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching clients:', error);
      return [];
    }
  }

  async filterProposals(affiliateId: string, status?: ProposalStatus): Promise<TaxProposal[]> {
    try {
      let query = supabase
        .from('tax_proposals')
        .select(`
          *,
          client_profiles!inner(personal_info)
        `)
        .eq('affiliate_id', affiliateId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering proposals:', error);
      return [];
    }
  }
}

export const affiliateService = AffiliateService.getInstance(); 