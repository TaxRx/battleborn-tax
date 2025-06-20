import { supabase } from '../lib/supabase';
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
  Priority
} from '../types/commission';

class CommissionTrackingService {
  private static instance: CommissionTrackingService;

  static getInstance(): CommissionTrackingService {
    if (!CommissionTrackingService.instance) {
      CommissionTrackingService.instance = new CommissionTrackingService();
    }
    return CommissionTrackingService.instance;
  }

  // EXPERT MANAGEMENT
  async getExperts(includeInactive = false): Promise<Expert[]> {
    try {
      let query = supabase.from('experts').select('*');
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching experts:', error);
      return [];
    }
  }

  async getExpert(id: string): Promise<Expert | null> {
    try {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching expert:', error);
      return null;
    }
  }

  async createExpert(expertData: CreateExpertForm): Promise<Expert> {
    try {
      const { data, error } = await supabase
        .from('experts')
        .insert({
          name: expertData.name,
          email: expertData.email,
          phone: expertData.phone,
          company: expertData.company,
          specialties: expertData.specialties,
          max_capacity: expertData.max_capacity,
          commission_rate: expertData.commission_rate,
          notes: expertData.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating expert:', error);
      throw error;
    }
  }

  async updateExpert(id: string, updates: Partial<CreateExpertForm>): Promise<Expert | null> {
    try {
      const { data, error } = await supabase
        .from('experts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating expert:', error);
      return null;
    }
  }

  async toggleExpertStatus(id: string): Promise<Expert | null> {
    try {
      // First get current status
      const expert = await this.getExpert(id);
      if (!expert) return null;

      const { data, error } = await supabase
        .from('experts')
        .update({ is_active: !expert.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling expert status:', error);
      return null;
    }
  }

  // STRATEGY COMMISSION RATES
  async getStrategyRates(affiliateId?: string): Promise<StrategyCommissionRate[]> {
    try {
      let query = supabase.from('strategy_commission_rates').select('*');
      
      if (affiliateId) {
        query = query.eq('affiliate_id', affiliateId);
      }
      
      const { data, error } = await query.order('strategy_name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching strategy rates:', error);
      return [];
    }
  }

  async getStrategyRate(affiliateId: string, strategyName: string): Promise<StrategyCommissionRate | null> {
    try {
      const { data, error } = await supabase
        .from('strategy_commission_rates')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .eq('strategy_name', strategyName)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching strategy rate:', error);
      return null;
    }
  }

  async createStrategyRate(rateData: CreateStrategyRateForm): Promise<StrategyCommissionRate> {
    try {
      const { data, error } = await supabase
        .from('strategy_commission_rates')
        .insert(rateData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating strategy rate:', error);
      throw error;
    }
  }

  async updateStrategyRate(id: string, updates: Partial<CreateStrategyRateForm>): Promise<StrategyCommissionRate | null> {
    try {
      const { data, error } = await supabase
        .from('strategy_commission_rates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating strategy rate:', error);
      return null;
    }
  }

  // PROPOSAL ASSIGNMENTS
  async getProposalAssignments(proposalId?: string, expertId?: string): Promise<ProposalAssignment[]> {
    try {
      let query = supabase
        .from('proposal_assignments')
        .select(`
          *,
          expert:experts(*),
          assigned_by_user:profiles!assigned_by(full_name, email)
        `);

      if (proposalId) query = query.eq('proposal_id', proposalId);
      if (expertId) query = query.eq('expert_id', expertId);

      const { data, error } = await query.order('assigned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching proposal assignments:', error);
      return [];
    }
  }

  async assignExpert(assignmentData: AssignExpertForm, assignedBy: string): Promise<ProposalAssignment> {
    try {
      const { data, error } = await supabase
        .from('proposal_assignments')
        .insert({
          ...assignmentData,
          assigned_by: assignedBy,
        })
        .select(`
          *,
          expert:experts(*),
          assigned_by_user:profiles!assigned_by(full_name, email)
        `)
        .single();

      if (error) throw error;

      // Update expert workload
      const expert = await this.getExpert(assignmentData.expert_id);
      if (expert) {
        await this.updateExpert(assignmentData.expert_id, {
          ...expert,
          current_workload: expert.current_workload + 1
        });
      }

      // Record timeline event
      await this.recordTimelineEvent(
        assignmentData.proposal_id,
        'approved',
        'assigned_to_expert',
        assignedBy,
        `Assigned to expert: ${data.expert?.name}`,
        { expert_id: assignmentData.expert_id, priority: assignmentData.priority }
      );

      return data;
    } catch (error) {
      console.error('Error assigning expert:', error);
      throw error;
    }
  }

  async updateAssignmentStatus(
    id: string,
    status: ExpertStatus,
    notes?: string,
    userId?: string
  ): Promise<ProposalAssignment | null> {
    try {
      const { data, error } = await supabase
        .from('proposal_assignments')
        .update({
          expert_status: status,
          notes,
          ...(status === 'in_progress' && { submitted_to_expert_at: new Date().toISOString() }),
          ...(status === 'completed' && { expert_response_at: new Date().toISOString() }),
        })
        .eq('id', id)
        .select(`
          *,
          expert:experts(*),
          assigned_by_user:profiles!assigned_by(full_name, email)
        `)
        .single();

      if (error) throw error;

      // Record timeline event
      if (userId) {
        await this.recordTimelineEvent(
          data.proposal_id,
          data.expert_status,
          status,
          userId,
          notes || `Expert status updated to ${status}`,
          { assignment_id: id }
        );
      }

      return data;
    } catch (error) {
      console.error('Error updating assignment status:', error);
      return null;
    }
  }

  // COMMISSION TRANSACTIONS
  async getCommissionTransactions(
    proposalId?: string,
    affiliateId?: string,
    expertId?: string,
    transactionType?: TransactionType
  ): Promise<CommissionTransaction[]> {
    try {
      let query = supabase
        .from('commission_transactions')
        .select(`
          *,
          affiliate:profiles!affiliate_id(full_name, email),
          expert:experts(*)
        `);

      if (proposalId) query = query.eq('proposal_id', proposalId);
      if (affiliateId) query = query.eq('affiliate_id', affiliateId);
      if (expertId) query = query.eq('expert_id', expertId);
      if (transactionType) query = query.eq('transaction_type', transactionType);

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching commission transactions:', error);
      return [];
    }
  }

  async recordPayment(paymentData: RecordPaymentForm, createdBy: string): Promise<CommissionTransaction> {
    try {
      const { data, error } = await supabase
        .from('commission_transactions')
        .insert({
          ...paymentData,
          created_by: createdBy,
        })
        .select(`
          *,
          affiliate:profiles!affiliate_id(full_name, email),
          expert:experts(*)
        `)
        .single();

      if (error) throw error;

      // Record timeline event
      await this.recordTimelineEvent(
        paymentData.proposal_id,
        null,
        `payment_${paymentData.transaction_type}`,
        createdBy,
        `Payment recorded: ${paymentData.transaction_type} - $${paymentData.amount}`,
        { transaction_id: data.id, amount: paymentData.amount }
      );

      return data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    notes?: string
  ): Promise<CommissionTransaction | null> {
    try {
      const { data, error } = await supabase
        .from('commission_transactions')
        .update({ status, notes })
        .eq('id', id)
        .select(`
          *,
          affiliate:profiles!affiliate_id(full_name, email),
          expert:experts(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return null;
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
    const totalCommission = totalExpertFee; // Commission is what expert pays back
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

  // TIMELINE TRACKING
  async getProposalTimeline(proposalId: string): Promise<ProposalTimeline[]> {
    try {
      const { data, error } = await supabase
        .from('proposal_timeline')
        .select(`
          *,
          changed_by_user:profiles!changed_by(full_name, email, role)
        `)
        .eq('proposal_id', proposalId)
        .order('changed_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching proposal timeline:', error);
      return [];
    }
  }

  async recordTimelineEvent(
    proposalId: string,
    statusFrom: string | null,
    statusTo: string,
    changedBy: string,
    notes?: string,
    metadata?: Record<string, any>
  ): Promise<ProposalTimeline> {
    try {
      const { data, error } = await supabase
        .from('proposal_timeline')
        .insert({
          proposal_id: proposalId,
          status_from: statusFrom,
          status_to: statusTo,
          changed_by: changedBy,
          notes,
          metadata: metadata || {},
        })
        .select(`
          *,
          changed_by_user:profiles!changed_by(full_name, email, role)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording timeline event:', error);
      throw error;
    }
  }

  // DASHBOARD STATS
  async getCommissionStats(): Promise<CommissionStats> {
    try {
      const [
        expertPaymentsReceived,
        affiliatePaymentsDue,
        affiliatePaymentsSent,
        assignments,
        expertWorkload
      ] = await Promise.all([
        this.getCommissionTotal('expert_payment_received'),
        this.getCommissionTotal('affiliate_payment_due'),
        this.getCommissionTotal('affiliate_payment_sent'),
        this.getAssignmentStats(),
        this.getExpertWorkloadStats()
      ]);

      return {
        total_expert_payments_received: expertPaymentsReceived,
        total_affiliate_payments_due: affiliatePaymentsDue,
        total_affiliate_payments_sent: affiliatePaymentsSent,
        pending_assignments: assignments.pending,
        active_assignments: assignments.active,
        completed_assignments: assignments.completed,
        monthly_commission_volume: await this.getMonthlyCommissionVolume(),
        top_performing_affiliates: [],
        expert_workload: expertWorkload,
      };
    } catch (error) {
      console.error('Error fetching commission stats:', error);
      return {
        total_expert_payments_received: 0,
        total_affiliate_payments_due: 0,
        total_affiliate_payments_sent: 0,
        pending_assignments: 0,
        active_assignments: 0,
        completed_assignments: 0,
        monthly_commission_volume: 0,
        top_performing_affiliates: [],
        expert_workload: [],
      };
    }
  }

  // HELPER METHODS
  private async getCommissionTotal(transactionType: TransactionType): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('commission_transactions')
        .select('amount')
        .eq('transaction_type', transactionType)
        .eq('status', 'completed');

      if (error) throw error;
      return (data || []).reduce((sum, t) => sum + t.amount, 0);
    } catch (error) {
      console.error(`Error getting commission total for ${transactionType}:`, error);
      return 0;
    }
  }

  private async getAssignmentStats(): Promise<{ pending: number; active: number; completed: number }> {
    try {
      const { data, error } = await supabase
        .from('proposal_assignments')
        .select('expert_status');

      if (error) throw error;

      const stats = { pending: 0, active: 0, completed: 0 };
      (data || []).forEach(assignment => {
        if (['assigned', 'contacted'].includes(assignment.expert_status)) {
          stats.pending++;
        } else if (assignment.expert_status === 'in_progress') {
          stats.active++;
        } else if (assignment.expert_status === 'completed') {
          stats.completed++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return { pending: 0, active: 0, completed: 0 };
    }
  }

  private async getExpertWorkloadStats(): Promise<Array<{
    expert_id: string;
    expert_name: string;
    current_workload: number;
    max_capacity: number;
    utilization_rate: number;
  }>> {
    try {
      const experts = await this.getExperts();
      return experts.map(expert => ({
        expert_id: expert.id,
        expert_name: expert.name,
        current_workload: expert.current_workload,
        max_capacity: expert.max_capacity,
        utilization_rate: expert.max_capacity > 0 ? (expert.current_workload / expert.max_capacity) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error getting expert workload stats:', error);
      return [];
    }
  }

  private async getMonthlyCommissionVolume(): Promise<number> {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('commission_transactions')
        .select('amount')
        .gte('transaction_date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`)
        .lt('transaction_date', `${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-01`)
        .eq('status', 'completed');

      if (error) throw error;
      return (data || []).reduce((sum, t) => sum + t.amount, 0);
    } catch (error) {
      console.error('Error getting monthly commission volume:', error);
      return 0;
    }
  }
}

export const commissionTrackingService = CommissionTrackingService.getInstance(); 