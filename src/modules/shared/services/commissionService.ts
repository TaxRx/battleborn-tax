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
  Priority
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
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching experts:', error);
      return [];
    }
  }

  async createExpert(expertData: CreateExpertForm): Promise<Expert> {
    try {
      const { data, error } = await supabase
        .from('experts')
        .insert(expertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating expert:', error);
      throw error;
    }
  }

  // PROPOSAL ASSIGNMENTS
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
}

export const commissionService = CommissionService.getInstance(); 