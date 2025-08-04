import { 
  TaxProposal, 
  TaxCalculationSummary,
  AdminStats, 
  ProposalStatus, 
  ProposalNote,
  ApiResponse,
  PaginatedResponse
} from '../types/proposal';
import { supabase } from '../../../lib/supabase';

// Utility function for generating IDs
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export class ProposalService {
  private static instance: ProposalService;

  static getInstance(): ProposalService {
    if (!ProposalService.instance) {
      ProposalService.instance = new ProposalService();
    }
    return ProposalService.instance;
  }

  // Create a new proposal from calculator data
  async createProposal(
    clientId: string,
    clientName: string,
    clientEmail: string,
    calculation: TaxCalculationSummary,
    affiliateId?: string,
    affiliateName?: string
  ): Promise<ApiResponse<TaxProposal>> {
    try {
      const proposal: TaxProposal = {
        id: generateId(),
        clientId,
        clientName,
        clientEmail,
        affiliateId,
        affiliateName,
        status: 'draft',
        calculation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: [],
        implementationStatus: 'not_started',
        projectedRevenue: this.calculateProjectedRevenue(calculation)
      };

      const { data, error } = await supabase
        .from('tax_proposals')
        .insert(proposal)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Proposal created successfully'
      };
    } catch (error) {
      console.error('Error creating proposal:', error);
      return {
        success: false,
        message: 'Failed to create proposal'
      };
    }
  }

  // Get all proposals with pagination
  async getAllProposals(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<TaxProposal>> {
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data: proposals, error, count } = await supabase
        .from('tax_proposals')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: proposals || [],
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: Math.ceil((count || 0) / perPage)
      };
    } catch (error) {
      console.error('Error fetching proposals:', error);
      return {
        data: [],
        total: 0,
        page,
        per_page: perPage,
        total_pages: 0
      };
    }
  }

  // Get a single proposal by ID
  async getProposal(id: string): Promise<TaxProposal | null> {
    try {
      const { data: proposal, error } = await supabase
        .from('tax_proposals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return proposal;
    } catch (error) {
      console.error('Error fetching proposal:', error);
      return null;
    }
  }

  // Update proposal status
  async updateProposalStatus(
    proposalId: string, 
    status: ProposalStatus, 
    note?: string
  ): Promise<ApiResponse<TaxProposal>> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add timestamp based on status
      if (status === 'submitted') {
        updateData.submitted_at = new Date().toISOString();
      } else if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'rejected') {
        updateData.rejected_at = new Date().toISOString();
      }

      const { data: proposal, error } = await supabase
        .from('tax_proposals')
        .update(updateData)
        .eq('id', proposalId)
        .select()
        .single();

      if (error) throw error;

      // Add note if provided
      if (note) {
        await this.addNote(proposalId, note, false);
      }

      return {
        success: true,
        data: proposal,
        message: `Proposal ${status} successfully`
      };
    } catch (error) {
      console.error('Error updating proposal status:', error);
      return {
        success: false,
        message: 'Failed to update proposal status'
      };
    }
  }

  // Add a note to a proposal
  async addNote(
    proposalId: string, 
    note: string, 
    isInternal: boolean = false
  ): Promise<ApiResponse<ProposalNote>> {
    try {
      const proposalNote: ProposalNote = {
        id: generateId(),
        proposalId,
        note,
        isInternal,
        createdBy: 'admin', // TODO: Get from auth context
        createdAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('proposal_notes')
        .insert(proposalNote)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Note added successfully'
      };
    } catch (error) {
      console.error('Error adding note:', error);
      return {
        success: false,
        message: 'Failed to add note'
      };
    }
  }

  // Get admin statistics
  async getAdminStats(): Promise<AdminStats> {
    try {
      const { data: proposals, error } = await supabase
        .from('tax_proposals')
        .select('*');

      if (error) throw error;

      console.log('Fetched proposals:', proposals);

      const stats: AdminStats = {
        totalProposals: proposals?.length || 0,
        pendingReview: proposals?.filter(p => p.status === 'submitted' || p.status === 'in_review').length || 0,
        approved: proposals?.filter(p => p.status === 'approved').length || 0,
        rejected: proposals?.filter(p => p.status === 'rejected').length || 0,
        implemented: proposals?.filter(p => p.status === 'implemented').length || 0,
        totalRevenue: proposals?.reduce((sum, p) => sum + (p.actualRevenue || 0), 0) || 0,
        averageSavings: this.calculateAverageSavings(proposals || []),
        topStrategies: this.getTopStrategies(proposals || []),
        recentActivity: this.getRecentActivity(proposals || [])
      };

      console.log('Calculated stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalProposals: 0,
        pendingReview: 0,
        approved: 0,
        rejected: 0,
        implemented: 0,
        totalRevenue: 0,
        averageSavings: 0,
        topStrategies: [],
        recentActivity: []
      };
    }
  }

  // Helper methods
  private calculateProjectedRevenue(calculation: TaxCalculationSummary): number {
    // Base fee + percentage of savings
    const baseFee = 500;
    const savingsPercentage = 0.15; // 15% of annual savings
    return baseFee + (calculation.savings.annualSavings * savingsPercentage);
  }

  private calculateAverageSavings(proposals: TaxProposal[]): number {
    if (proposals.length === 0) return 0;
    
    const validProposals = proposals.filter(p => 
      p.calculation && 
      p.calculation.savings && 
      typeof p.calculation.savings.annualSavings === 'number'
    );
    
    if (validProposals.length === 0) return 0;
    
    const totalSavings = validProposals.reduce((sum, p) => sum + p.calculation.savings.annualSavings, 0);
    return Math.round(totalSavings / validProposals.length);
  }

  private getTopStrategies(proposals: TaxProposal[]): Array<{name: string, count: number, averageSavings: number}> {
    const strategyCounts: Record<string, {count: number, totalSavings: number}> = {};
    
    proposals.forEach(proposal => { 
      if (!proposal || !proposal.calculation || !proposal.calculation.strategies) return;
      
      proposal.calculation.strategies.forEach(strategy => {
        if (strategy.enabled) {
          if (!strategyCounts[strategy.name]) {
            strategyCounts[strategy.name] = { count: 0, totalSavings: 0 };
          }
          strategyCounts[strategy.name].count++;
          strategyCounts[strategy.name].totalSavings += strategy.estimatedSavings;
        }
      });
    });

    return Object.entries(strategyCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        averageSavings: Math.round(data.totalSavings / data.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getRecentActivity(proposals: TaxProposal[]): Array<{id: string, type: string, description: string, timestamp: string}> {
    const activities: Array<{id: string, type: string, description: string, timestamp: string}> = [];
    
    proposals.forEach(proposal => { if (!proposal) return;
      if (proposal.submittedAt) {
        activities.push({
          id: proposal.id,
          type: 'submitted',
          description: `Proposal submitted by ${proposal.clientName}`,
          timestamp: proposal.submittedAt
        });
      }
      if (proposal.approvedAt) {
        activities.push({
          id: proposal.id,
          type: 'approved',
          description: `Proposal approved for ${proposal.clientName}`,
          timestamp: proposal.approvedAt
        });
      }
    });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  // Create strategy implementations (for backward compatibility)
  async createStrategyImplementations(proposalId: string, strategies: any[]): Promise<any[]> {
    try {
      const implementations = strategies.map(strategy => ({
        id: generateId(),
        proposal_id: proposalId,
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('strategy_implementations')
        .insert(implementations)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error creating strategy implementations:', error);
      return [];
    }
  }

  // Create proposal with old format (for backward compatibility)
  async createProposalLegacy(proposalData: any): Promise<ApiResponse<TaxProposal>> {
    try {
      // Convert old format to new format
      const calculation: TaxCalculationSummary = {
        totalIncome: proposalData.baseline_calculation?.total_income || 0,
        filingStatus: proposalData.client_profile?.tax_info?.filing_status || 'single',
        state: proposalData.client_profile?.tax_info?.state || 'CA',
        year: proposalData.detailed_calculations?.selected_year || new Date().getFullYear(),
        beforeTaxes: {
          federal: proposalData.baseline_calculation?.federal_tax || 0,
          state: proposalData.baseline_calculation?.state_tax || 0,
          socialSecurity: 0,
          medicare: 0,
          selfEmployment: 0,
          total: proposalData.baseline_calculation?.total_tax || 0,
          effectiveRate: proposalData.baseline_calculation?.effective_rate || 0
        },
        afterTaxes: {
          federal: (proposalData.baseline_calculation?.federal_tax || 0) - (proposalData.projected_savings?.annual_savings || 0) * 0.7,
          state: (proposalData.baseline_calculation?.state_tax || 0) - (proposalData.projected_savings?.annual_savings || 0) * 0.2,
          socialSecurity: 0,
          medicare: 0,
          selfEmployment: 0,
          total: (proposalData.baseline_calculation?.total_tax || 0) - (proposalData.projected_savings?.annual_savings || 0),
          effectiveRate: 0
        },
        strategies: (proposalData.proposed_strategies || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          enabled: s.enabled,
          estimatedSavings: s.estimated_savings || 0,
          category: s.category,
          details: s.details
        })),
        savings: {
          rawSavings: proposalData.projected_savings?.total_tax_reduction || 0,
          annualSavings: proposalData.projected_savings?.annual_savings || 0,
          fiveYearValue: proposalData.projected_savings?.five_year_value || 0,
          beforeRate: (proposalData.baseline_calculation?.effective_rate || 0).toString(),
          afterRate: '0',
          shiftedIncome: 0,
          deferredIncome: 0
        },
        incomeDistribution: {
          wagesIncome: proposalData.client_profile?.tax_info?.wages_income || 0,
          passiveIncome: proposalData.client_profile?.tax_info?.passive_income || 0,
          unearnedIncome: proposalData.client_profile?.tax_info?.other_income || 0,
          ordinaryK1Income: 0,
          guaranteedK1Income: 0
        }
      };

      const proposal: TaxProposal = {
        id: proposalData.id || generateId(),
        clientId: proposalData.client_id,
        clientName: proposalData.client_profile?.personal_info?.full_name || 'Unknown Client',
        clientEmail: proposalData.client_profile?.personal_info?.email || 'unknown@example.com',
        affiliateId: proposalData.affiliate_id,
        affiliateName: 'Unknown Affiliate',
        status: proposalData.status || 'draft',
        calculation,
        createdAt: proposalData.created_at || new Date().toISOString(),
        updatedAt: proposalData.updated_at || new Date().toISOString(),
        submittedAt: proposalData.submitted_at,
        approvedAt: proposalData.approved_at,
        rejectedAt: proposalData.rejected_at,
        assignedExpertId: proposalData.assigned_expert,
        assignedExpertName: proposalData.assigned_expert_name,
        notes: proposalData.admin_notes || [],
        implementationStatus: 'not_started',
        projectedRevenue: this.calculateProjectedRevenue(calculation),
        actualRevenue: proposalData.actual_revenue
      };

      const { data, error } = await supabase
        .from('tax_proposals')
        .insert(proposal)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Proposal created successfully'
      };
    } catch (error) {
      console.error('Error creating proposal:', error);
      return {
        success: false,
        message: 'Failed to create proposal'
      };
    }
  }

  // Approve proposal (for backward compatibility)
  async approveProposal(proposalId: string, note?: string): Promise<ApiResponse<TaxProposal>> {
    return this.updateProposalStatus(proposalId, 'approved', note);
  }

  // Reject proposal (for backward compatibility)
  async rejectProposal(proposalId: string, note?: string): Promise<ApiResponse<TaxProposal>> {
    return this.updateProposalStatus(proposalId, 'rejected', note);
  }

  // Test method to create a sample proposal
  async createTestProposal(): Promise<ApiResponse<TaxProposal>> {
    try {
      console.log('Creating test proposal...');
      
      const testCalculation = {
        totalIncome: 150000,
        filingStatus: 'single' as const,
        state: 'CA',
        year: 2024,
        beforeTaxes: {
          federal: 25000,
          state: 8000,
          socialSecurity: 0,
          medicare: 0,
          selfEmployment: 0,
          total: 33000,
          effectiveRate: 22
        },
        afterTaxes: {
          federal: 20000,
          state: 6000,
          socialSecurity: 0,
          medicare: 0,
          selfEmployment: 0,
          total: 26000,
          effectiveRate: 17.3
        },
        strategies: [
          {
            id: 'test-strategy-1',
            name: 'Test Strategy 1',
            enabled: true,
            estimatedSavings: 5000,
            category: 'deductions',
            details: {}
          }
        ],
        savings: {
          rawSavings: 7000,
          annualSavings: 7000,
          fiveYearValue: 35000,
          beforeRate: '22',
          afterRate: '17.3',
          shiftedIncome: 0,
          deferredIncome: 0
        },
        incomeDistribution: {
          wagesIncome: 150000,
          passiveIncome: 0,
          unearnedIncome: 0,
          ordinaryK1Income: 0,
          guaranteedK1Income: 0
        }
      };

      return await this.createProposal(
        'test-client-id',
        'Test Client',
        'test@example.com',
        testCalculation,
        'test-affiliate-id',
        'Test Affiliate'
      );
    } catch (error) {
      console.error('Error creating test proposal:', error);
      return {
        success: false,
        message: 'Failed to create test proposal'
      };
    }
  }

  // Get proposals for a specific client
  async getClientProposals(clientId: string): Promise<ApiResponse<TaxProposal[]>> {
    try {
      const { data: proposals, error } = await supabase
        .from('tax_proposals')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: proposals || [],
        message: 'Client proposals fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching client proposals:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch client proposals'
      };
    }
  }

  // Get proposals for all clients in an account
  async getAccountProposals(accountId: string): Promise<ApiResponse<TaxProposal[]>> {
    try {
      // First get all clients for this account
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .eq('account_id', accountId);

      if (clientsError) throw clientsError;

      if (!clients || clients.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No clients found for account'
        };
      }

      const clientIds = clients.map(c => c.id);

      // Fetch proposals for all clients in the account
      const { data: proposals, error } = await supabase
        .from('tax_proposals')
        .select('*')
        .in('client_id', clientIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: proposals || [],
        message: 'Account proposals fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching account proposals:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch account proposals'
      };
    }
  }

  // Get client's R&D tax credit data (for integration with R&D dashboard)
  async getClientRDData(clientId: string): Promise<ApiResponse<any>> {
    try {
      // Fetch client's historical tax data, QRE information, etc.
      const { data: proposals, error } = await supabase
        .from('tax_proposals')
        .select('*')
        .eq('client_id', clientId)
        .order('calculation->>year', { ascending: false });

      if (error) throw error;

      // Process proposals to extract R&D data
      const rdData = {
        historicalData: {},
        totalCredits: 0,
        averageSavings: 0,
        yearlyBreakdown: []
      };

      if (proposals && proposals.length > 0) {
        proposals.forEach((proposal) => {
          if (proposal.calculation && proposal.calculation.year) {
            const year = proposal.calculation.year;
            rdData.historicalData[year] = {
              qre: proposal.calculation.savings?.rawSavings || 0,
              federalCredit: proposal.calculation.savings?.annualSavings * 0.75 || 0,
              stateCredit: proposal.calculation.savings?.annualSavings * 0.25 || 0,
              paid: proposal.status === 'implemented'
            };
          }
        });
        
        rdData.totalCredits = proposals.reduce((sum, p) => 
          sum + (p.calculation?.savings?.annualSavings || 0), 0);
        rdData.averageSavings = rdData.totalCredits / proposals.length;
      }

      return {
        success: true,
        data: rdData,
        message: 'Client R&D data fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching client R&D data:', error);
      return {
        success: false,
        data: { historicalData: {}, totalCredits: 0, averageSavings: 0, yearlyBreakdown: [] },
        message: 'Failed to fetch client R&D data'
      };
    }
  }

  // Get R&D data for all clients in an account
  async getAccountRDData(accountId: string): Promise<ApiResponse<any>> {
    try {
      const proposalsResponse = await this.getAccountProposals(accountId);
      if (!proposalsResponse.success) {
        return proposalsResponse;
      }

      const proposals = proposalsResponse.data;

      // Process proposals to extract R&D data
      const rdData = {
        historicalData: {},
        totalCredits: 0,
        averageSavings: 0,
        yearlyBreakdown: [],
        clientBreakdown: {}
      };

      if (proposals && proposals.length > 0) {
        proposals.forEach((proposal) => {
          if (proposal.calculation && proposal.calculation.year) {
            const year = proposal.calculation.year;
            const clientId = proposal.client_id;
            
            // Initialize year data if not exists
            if (!rdData.historicalData[year]) {
              rdData.historicalData[year] = {
                qre: 0,
                federalCredit: 0,
                stateCredit: 0,
                paid: false
              };
            }

            // Initialize client data if not exists
            if (!rdData.clientBreakdown[clientId]) {
              rdData.clientBreakdown[clientId] = {
                clientName: proposal.client_name,
                totalCredits: 0,
                proposals: []
              };
            }

            // Aggregate data
            const annualSavings = proposal.calculation.savings?.annualSavings || 0;
            rdData.historicalData[year].qre += proposal.calculation.savings?.rawSavings || 0;
            rdData.historicalData[year].federalCredit += annualSavings * 0.75;
            rdData.historicalData[year].stateCredit += annualSavings * 0.25;
            rdData.historicalData[year].paid = rdData.historicalData[year].paid || (proposal.status === 'implemented');

            rdData.clientBreakdown[clientId].totalCredits += annualSavings;
            rdData.clientBreakdown[clientId].proposals.push(proposal);
          }
        });
        
        rdData.totalCredits = proposals.reduce((sum, p) => 
          sum + (p.calculation?.savings?.annualSavings || 0), 0);
        rdData.averageSavings = rdData.totalCredits / proposals.length;
      }

      return {
        success: true,
        data: rdData,
        message: 'Account R&D data fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching account R&D data:', error);
      return {
        success: false,
        data: { historicalData: {}, totalCredits: 0, averageSavings: 0, yearlyBreakdown: [], clientBreakdown: {} },
        message: 'Failed to fetch account R&D data'
      };
    }
  }

  // Delete proposal
  async deleteProposal(proposalId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('tax_proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;

      return {
        success: true,
        data: true,
        message: 'Proposal deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting proposal:', error);
      return {
        success: false,
        message: 'Failed to delete proposal'
      };
    }
  }
}

// Export singleton instance
export const proposalService = ProposalService.getInstance(); 