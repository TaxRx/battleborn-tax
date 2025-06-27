import { supabase } from '../../../lib/supabase';
import {
  Expert,
  StrategyCommissionRate,
  ProposalAssignment,
  CommissionTransaction,
  ProposalTimeline,
  CommissionCalculation,
  CreateExpertForm,
  CreateStrategyRateForm,
  AssignExpertForm,
  RecordPaymentForm,
  CommissionStats,
  AffiliateCommissionDashboard,
  ExpertStatus,
  TransactionType,
  TransactionStatus,
  Priority,
  ClientProfile,
  ClientCommunication,
  ClientAlert,
  ClientStage,
  ClientAlertType,
  EnhancedProposal
} from '../../../types/commission';

class CommissionService {
  private static instance: CommissionService;

  static getInstance(): CommissionService {
    if (!CommissionService.instance) {
      CommissionService.instance = new CommissionService();
    }
    return CommissionService.instance;
  }

  // EXPERT MANAGEMENT
  async getExperts(includeInactive = false): Promise<Expert[]> {
    try {
      let query = supabase.from('experts').select('*');
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        // If the table doesn't exist, return mock data
        if (error.code === '42P01') {
          console.log('Experts table does not exist yet - returning mock data');
          return this.getMockExperts(includeInactive);
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching experts:', error);
      // Return mock data for any other errors
      return this.getMockExperts(includeInactive);
    }
  }

  private getMockExperts(includeInactive = false): Expert[] {
    const mockExperts: Expert[] = [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@taxexperts.com',
        phone: '+1 (555) 123-4567',
        company: 'Tax Strategy Solutions',
        specialties: ['R&D Tax Credits', 'Cost Segregation', 'Section 199A'],
        current_workload: 3,
        max_capacity: 5,
        commission_rate: 0.15,
        is_active: true,
        notes: 'Specializes in manufacturing R&D credits',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        name: 'Prof. Michael Chen',
        email: 'michael.chen@strategictax.com',
        phone: '+1 (555) 234-5678',
        company: 'Strategic Tax Partners',
        specialties: ['Augusta Rule', 'Charitable Strategies', 'Estate Planning'],
        current_workload: 4,
        max_capacity: 4,
        commission_rate: 0.18,
        is_active: true,
        notes: 'Former IRS agent with 20+ years experience',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-16T00:00:00Z'
      },
      {
        id: '3',
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@elitetax.com',
        phone: '+1 (555) 345-6789',
        company: 'Elite Tax Consultants',
        specialties: ['International Tax', 'Transfer Pricing', 'SALT'],
        current_workload: 2,
        max_capacity: 6,
        commission_rate: 0.20,
        is_active: true,
        notes: 'International tax specialist',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-17T00:00:00Z'
      },
      {
        id: '4',
        name: 'James Wilson',
        email: 'james.wilson@taxadvisors.com',
        phone: '+1 (555) 456-7890',
        company: 'Wilson Tax Advisors',
        specialties: ['Cost Segregation', 'Bonus Depreciation'],
        current_workload: 0,
        max_capacity: 3,
        commission_rate: 0.12,
        is_active: false,
        notes: 'Currently on sabbatical',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-18T00:00:00Z'
      }
    ];

    return includeInactive ? mockExperts : mockExperts.filter(expert => expert.is_active);
  }

  async createExpert(expertData: CreateExpertForm): Promise<Expert> {
    try {
      const { data, error } = await supabase
        .from('experts')
        .insert(expertData)
        .select()
        .single();

      if (error) {
        // If the table doesn't exist, throw a specific error
        if (error.code === '42P01') {
          throw new Error('Database table does not exist yet. Please run the migration first.');
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error creating expert:', error);
      throw error;
    }
  }

  // PROPOSAL ASSIGNMENTS
  async getProposalAssignments(): Promise<ProposalAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('proposal_assignments')
        .select('*, expert:experts(*)')
        .order('assigned_at', { ascending: false });

      if (error) {
        // If the table doesn't exist, return mock data
        if (error.code === '42P01') {
          console.log('Proposal assignments table does not exist yet - returning mock data');
          return this.getMockProposalAssignments();
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching proposal assignments:', error);
      return this.getMockProposalAssignments();
    }
  }

  private getMockProposalAssignments(): ProposalAssignment[] {
    const mockExperts = this.getMockExperts(true);
    
    return [
      {
        id: '1',
        proposal_id: 'prop-001',
        expert_id: '1',
        assigned_by: 'admin-001',
        assigned_at: '2024-01-15T10:00:00Z',
        submitted_to_expert_at: '2024-01-15T10:30:00Z',
        expert_response_at: '2024-01-15T14:00:00Z',
        expert_status: 'in_progress',
        notes: 'R&D credit analysis for manufacturing client',
        priority: 'high',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T14:00:00Z',
        expert: mockExperts[0],
        assigned_by_user: {
          full_name: 'Admin User',
          email: 'admin@battleborn.com'
        }
      },
      {
        id: '2',
        proposal_id: 'prop-002',
        expert_id: '2',
        assigned_by: 'admin-001',
        assigned_at: '2024-01-16T09:00:00Z',
        submitted_to_expert_at: '2024-01-16T09:15:00Z',
        expert_status: 'assigned',
        notes: 'Augusta Rule consultation for real estate client',
        priority: 'medium',
        created_at: '2024-01-16T09:00:00Z',
        updated_at: '2024-01-16T09:15:00Z',
        expert: mockExperts[1],
        assigned_by_user: {
          full_name: 'Admin User',
          email: 'admin@battleborn.com'
        }
      },
      {
        id: '3',
        proposal_id: 'prop-003',
        expert_id: '3',
        assigned_by: 'admin-001',
        assigned_at: '2024-01-17T11:00:00Z',
        submitted_to_expert_at: '2024-01-17T11:30:00Z',
        expert_response_at: '2024-01-17T16:00:00Z',
        expert_status: 'completed',
        notes: 'International tax planning for multi-national corporation',
        priority: 'urgent',
        created_at: '2024-01-17T11:00:00Z',
        updated_at: '2024-01-17T16:00:00Z',
        expert: mockExperts[2],
        assigned_by_user: {
          full_name: 'Admin User',
          email: 'admin@battleborn.com'
        }
      }
    ];
  }

  async assignExpert(assignmentData: AssignExpertForm, assignedBy: string): Promise<ProposalAssignment> {
    try {
      const { data, error } = await supabase
        .from('proposal_assignments')
        .insert({
          ...assignmentData,
          assigned_by: assignedBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning expert:', error);
      throw error;
    }
  }

  // COMMISSION TRACKING
  async recordPayment(paymentData: RecordPaymentForm, createdBy: string): Promise<CommissionTransaction> {
    try {
      const { data, error } = await supabase
        .from('commission_transactions')
        .insert({
          ...paymentData,
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  // COMMISSION CALCULATIONS
  calculateCommission(
    clientPayment: number,
    expertFeePercentage: number,
    affiliateRate: number,
    adminRate: number
  ): CommissionCalculation {
    const totalExpertFee = clientPayment * expertFeePercentage;
    const totalCommission = totalExpertFee;
    const affiliateCommission = totalCommission * affiliateRate;
    const adminCommission = totalCommission * adminRate;

    return {
      client_payment: clientPayment,
      expert_fee_percentage: expertFeePercentage,
      total_expert_fee: totalExpertFee,
      affiliate_rate: affiliateRate,
      admin_rate: adminRate,
      affiliate_commission: affiliateCommission,
      admin_commission: adminCommission,
      total_commission: totalCommission,
    };
  }

  // DASHBOARD STATS
  async getCommissionStats(): Promise<CommissionStats> {
    try {
      // For now, return mock data since the database tables don't exist yet
      // This will be replaced with actual database queries once the migration is run
      return {
        total_expert_payments_received: 125000,
        total_affiliate_payments_due: 45000,
        total_affiliate_payments_sent: 80000,
        monthly_commission_volume: 25000,
        pending_assignments: 12,
        active_assignments: 8,
        completed_assignments: 45,
        // Additional properties for the dashboard
        total_commissions: 250000,
        pending_payouts: 45000,
        pending_transactions: 8,
        active_experts: 12,
        expert_utilization: 75,
        average_commission: 5200,
        expert_workload: [
          {
            expert_id: '1',
            expert_name: 'Dr. Sarah Johnson',
            current_workload: 3,
            max_capacity: 5,
            utilization_rate: 60
          },
          {
            expert_id: '2',
            expert_name: 'Prof. Michael Chen',
            current_workload: 4,
            max_capacity: 4,
            utilization_rate: 100
          },
          {
            expert_id: '3',
            expert_name: 'Dr. Emily Rodriguez',
            current_workload: 2,
            max_capacity: 6,
            utilization_rate: 33
          }
        ],
        top_performing_affiliates: [
          {
            affiliate_id: '1',
            affiliate_name: 'Tax Solutions Pro',
            proposal_count: 15,
            total_commission: 25000
          },
          {
            affiliate_id: '2',
            affiliate_name: 'Strategic Tax Group',
            proposal_count: 12,
            total_commission: 20000
          },
          {
            affiliate_id: '3',
            affiliate_name: 'Elite Tax Partners',
            proposal_count: 8,
            total_commission: 15000
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching commission stats:', error);
      throw error;
    }
  }

  // Additional methods for future implementation
  async getExpertWorkload(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('proposal_assignments')
        .select(`
          expert_id,
          experts(name),
          status
        `)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expert workload:', error);
      return [];
    }
  }

  async getAffiliatePerformance(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('commission_transactions')
        .select(`
          affiliate_id,
          amount,
          transaction_type
        `)
        .eq('transaction_type', 'affiliate_commission');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching affiliate performance:', error);
      return [];
    }
  }

  // CLIENT TRACKING & RETENTION - Critical for preventing client loss
  async getClientProfile(clientId: string): Promise<ClientProfile | null> {
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select(`
          *,
          communication_log:client_communications(*),
          active_alerts:client_alerts(*)
        `)
        .eq('id', clientId)
        .single();

      if (error) {
        if (error.code === '42P01') {
          return this.getMockClientProfile(clientId);
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      return this.getMockClientProfile(clientId);
    }
  }

  private getMockClientProfile(clientId: string): ClientProfile {
    return {
      id: clientId,
      full_name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 (555) 123-4567',
      company: 'Smith Manufacturing LLC',
      preferred_contact_method: 'email',
      timezone: 'EST',
      annual_income: 500000,
      filing_status: 'Married Filing Jointly',
      state: 'TX',
      business_owner: true,
      current_stage: 'expert_assigned',
      last_contact_date: '2024-01-15T10:00:00Z',
      next_followup_date: '2024-01-18T10:00:00Z',
      assigned_affiliate_id: 'aff-001',
      assigned_expert_id: '1',
      engagement_score: 8,
      communication_log: [],
      at_risk_of_loss: false,
      days_since_last_contact: 2,
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    };
  }

  async getClientsAtRisk(): Promise<ClientProfile[]> {
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('at_risk_of_loss', true)
        .order('days_since_last_contact', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          return this.getMockAtRiskClients();
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching at-risk clients:', error);
      return this.getMockAtRiskClients();
    }
  }

  private getMockAtRiskClients(): ClientProfile[] {
    return [
      {
        id: 'client-at-risk-1',
        full_name: 'Sarah Johnson',
        email: 'sarah.j@company.com',
        phone: '+1 (555) 987-6543',
        preferred_contact_method: 'email',
        annual_income: 300000,
        filing_status: 'Single',
        state: 'CA',
        business_owner: true,
        current_stage: 'expert_assigned',
        last_contact_date: '2024-01-05T14:00:00Z',
        assigned_affiliate_id: 'aff-002',
        assigned_expert_id: '2',
        engagement_score: 3,
        communication_log: [],
        at_risk_of_loss: true,
        days_since_last_contact: 12,
        created_at: '2024-01-03T09:00:00Z',
        updated_at: '2024-01-05T14:00:00Z'
      }
    ];
  }

  async getClientAlerts(clientId?: string): Promise<ClientAlert[]> {
    try {
      let query = supabase
        .from('client_alerts')
        .select(`
          *,
          client:client_profiles(full_name, email),
          assigned_user:profiles(full_name, email)
        `)
        .eq('is_resolved', false);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query.order('severity', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          return this.getMockClientAlerts(clientId);
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching client alerts:', error);
      return this.getMockClientAlerts(clientId);
    }
  }

  private getMockClientAlerts(clientId?: string): ClientAlert[] {
    const alerts = [
      {
        id: '1',
        client_id: 'client-at-risk-1',
        alert_type: 'no_contact_14_days' as ClientAlertType,
        severity: 'high' as const,
        title: 'Client Not Contacted in 14 Days',
        description: 'Sarah Johnson has not been contacted in 14 days. Risk of losing client.',
        action_required: 'Immediate follow-up required from assigned expert',
        assigned_to: 'expert-2',
        due_date: '2024-01-17T17:00:00Z',
        is_resolved: false,
        created_at: '2024-01-16T09:00:00Z',
        client: {
          full_name: 'Sarah Johnson',
          email: 'sarah.j@company.com'
        },
        assigned_user: {
          full_name: 'Prof. Michael Chen',
          email: 'michael.chen@strategictax.com',
          role: 'expert'
        }
      },
      {
        id: '2',
        client_id: 'client-002',
        alert_type: 'proposal_stuck_in_review' as ClientAlertType,
        severity: 'medium' as const,
        title: 'Proposal Stuck in Review',
        description: 'Proposal has been in admin review for 5 days without action.',
        action_required: 'Admin review and approval needed',
        assigned_to: 'admin-001',
        due_date: '2024-01-18T17:00:00Z',
        is_resolved: false,
        created_at: '2024-01-16T12:00:00Z',
        client: {
          full_name: 'Mike Wilson',
          email: 'mike.w@business.com'
        },
        assigned_user: {
          full_name: 'Admin User',
          email: 'admin@battleborn.com',
          role: 'admin'
        }
      }
    ];

    return clientId ? alerts.filter(alert => alert.client_id === clientId) : alerts;
  }

  async logClientCommunication(communication: Omit<ClientCommunication, 'id' | 'created_at'>): Promise<ClientCommunication> {
    try {
      const communicationData = {
        ...communication,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('client_communications')
        .insert(communicationData)
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          console.log('Client communications table does not exist - would log:', communicationData);
          return communicationData as ClientCommunication;
        }
        throw error;
      }

      // Update client's last contact date and engagement score
      await this.updateClientEngagement(communication.client_id, communication.outcome);

      return data;
    } catch (error) {
      console.error('Error logging client communication:', error);
      throw error;
    }
  }

  private async updateClientEngagement(clientId: string, outcome: string): Promise<void> {
    try {
      const engagementScoreChange = outcome === 'positive' ? 1 : outcome === 'negative' ? -1 : 0;
      
      const { error } = await supabase
        .from('client_profiles')
        .update({
          last_contact_date: new Date().toISOString(),
          days_since_last_contact: 0,
          engagement_score: supabase.raw(`GREATEST(1, LEAST(10, engagement_score + ${engagementScoreChange}))`),
          at_risk_of_loss: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error && error.code !== '42P01') {
        throw error;
      }
    } catch (error) {
      console.error('Error updating client engagement:', error);
    }
  }

  async updateClientStage(clientId: string, newStage: ClientStage, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('client_profiles')
        .update({
          current_stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error && error.code !== '42P01') {
        throw error;
      }

      // Log the stage change
      if (notes) {
        await this.logClientCommunication({
          client_id: clientId,
          user_id: 'system',
          user_role: 'admin',
          communication_type: 'system_note',
          subject: `Stage Updated: ${newStage}`,
          summary: notes,
          outcome: 'neutral'
        });
      }
    } catch (error) {
      console.error('Error updating client stage:', error);
    }
  }

  async getEnhancedProposals(): Promise<EnhancedProposal[]> {
    try {
      // This would normally join with client_profiles, but for now we'll enhance mock data
      const proposals = await this.getMockProposals();
      
      return proposals.map(proposal => ({
        ...proposal,
        client_profile: this.getMockClientProfile(proposal.client_id),
        affiliate_info: {
          full_name: 'Tax Solutions Pro',
          email: 'contact@taxsolutionspro.com',
          company: 'Tax Solutions Pro LLC',
          affiliate_code: 'TSP001'
        },
        communication_history: [],
        active_alerts: this.getMockClientAlerts(proposal.client_id),
        days_in_current_stage: this.calculateDaysInStage(proposal.status, proposal.submitted_at),
        risk_score: this.calculateRiskScore(proposal)
      }));
    } catch (error) {
      console.error('Error fetching enhanced proposals:', error);
      return [];
    }
  }

  private getMockProposals(): any[] {
    return [
      {
        id: 'prop-001',
        client_id: 'client-001',
        affiliate_id: 'aff-001',
        status: 'expert_assigned',
        submitted_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 'prop-002',
        client_id: 'client-at-risk-1',
        affiliate_id: 'aff-002',
        status: 'expert_assigned',
        submitted_at: '2024-01-05T14:00:00Z'
      }
    ];
  }

  private calculateDaysInStage(status: string, submittedAt?: string): number {
    if (!submittedAt) return 0;
    const submitted = new Date(submittedAt);
    const now = new Date();
    return Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateRiskScore(proposal: any): number {
    const daysInStage = this.calculateDaysInStage(proposal.status, proposal.submitted_at);
    
    // Risk factors
    let riskScore = 1;
    
    // Time in current stage
    if (daysInStage > 14) riskScore += 3;
    else if (daysInStage > 7) riskScore += 2;
    else if (daysInStage > 3) riskScore += 1;
    
    // Status-based risk
    if (proposal.status === 'submitted') riskScore += 1;
    if (proposal.status === 'in_review' && daysInStage > 5) riskScore += 2;
    
    return Math.min(10, riskScore);
  }
}

export const commissionService = CommissionService.getInstance(); 