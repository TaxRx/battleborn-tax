// Epic 3 Sprint 4: Commission Management Service
// File: commissionManagementService.ts
// Purpose: Commission calculation, tracking, and automated payout system
// Story: 4.4 - Commission Management System (6 points)

import { supabase } from '../../../lib/supabase';

export interface CommissionTier {
  id: string;
  tierName: string;
  tierLevel: number;
  minimumSales: number;
  commissionRate: number;
  bonusThreshold: number;
  bonusRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionRecord {
  id: string;
  affiliateId: string;
  affiliateName: string;
  subscriptionId: string;
  paymentId: string;
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  tierName: string;
  bonusAmount: number;
  totalCommission: number;
  status: 'pending' | 'approved' | 'paid' | 'disputed' | 'clawed_back';
  paidAt: string | null;
  clawbackReason: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionPayout {
  id: string;
  affiliateId: string;
  affiliateName: string;
  payoutPeriod: string;
  totalCommissions: number;
  totalPayments: number;
  payoutAmount: number;
  payoutMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'check';
  payoutStatus: 'pending' | 'processing' | 'completed' | 'failed';
  payoutDate: string;
  processingFee: number;
  taxWithholding: number;
  netPayout: number;
  payoutReference: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSummary {
  affiliateId: string;
  affiliateName: string;
  totalEarned: number;
  totalPaid: number;
  pendingCommissions: number;
  currentTier: string;
  monthlyEarnings: number;
  lifetimeEarnings: number;
  activeSubscriptions: number;
  averageCommissionRate: number;
  lastPayoutDate: string | null;
  nextPayoutDate: string | null;
}

export interface CommissionAnalytics {
  totalCommissionsPaid: number;
  totalPendingCommissions: number;
  averageCommissionRate: number;
  topPerformingAffiliates: Array<{
    affiliateId: string;
    affiliateName: string;
    totalEarnings: number;
    conversionRate: number;
  }>;
  commissionsByTier: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    totalCommissions: number;
    totalPayouts: number;
    averageCommissionPerAffiliate: number;
  }>;
}

export class CommissionManagementService {
  
  // Commission Tier Management
  async getCommissionTiers(): Promise<CommissionTier[]> {
    try {
      const { data: tiers, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .order('tier_level');

      if (error) throw error;

      return (tiers || []).map(tier => ({
        id: tier.id,
        tierName: tier.tier_name,
        tierLevel: tier.tier_level,
        minimumSales: tier.minimum_sales,
        commissionRate: tier.commission_rate,
        bonusThreshold: tier.bonus_threshold,
        bonusRate: tier.bonus_rate,
        isActive: tier.is_active,
        createdAt: tier.created_at,
        updatedAt: tier.updated_at
      }));
    } catch (error) {
      console.error('Error fetching commission tiers:', error);
      throw error;
    }
  }

  async createCommissionTier(tierData: {
    tierName: string;
    tierLevel: number;
    minimumSales: number;
    commissionRate: number;
    bonusThreshold: number;
    bonusRate: number;
  }): Promise<CommissionTier> {
    try {
      const { data: tier, error } = await supabase
        .from('commission_tiers')
        .insert({
          tier_name: tierData.tierName,
          tier_level: tierData.tierLevel,
          minimum_sales: tierData.minimumSales,
          commission_rate: tierData.commissionRate,
          bonus_threshold: tierData.bonusThreshold,
          bonus_rate: tierData.bonusRate,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: tier.id,
        tierName: tier.tier_name,
        tierLevel: tier.tier_level,
        minimumSales: tier.minimum_sales,
        commissionRate: tier.commission_rate,
        bonusThreshold: tier.bonus_threshold,
        bonusRate: tier.bonus_rate,
        isActive: tier.is_active,
        createdAt: tier.created_at,
        updatedAt: tier.updated_at
      };
    } catch (error) {
      console.error('Error creating commission tier:', error);
      throw error;
    }
  }

  // Commission Calculation
  async calculateCommission(
    affiliateId: string,
    subscriptionId: string,
    paymentId: string,
    baseAmount: number
  ): Promise<{ success: boolean; commissionId?: string; message: string }> {
    try {
      const { data: result, error } = await supabase.rpc('calculate_commission', {
        p_affiliate_id: affiliateId,
        p_subscription_id: subscriptionId,
        p_payment_id: paymentId,
        p_base_amount: baseAmount
      });

      if (error) throw error;

      const commissionResult = result[0];
      return {
        success: commissionResult.success,
        commissionId: commissionResult.commission_id,
        message: commissionResult.message
      };
    } catch (error) {
      console.error('Error calculating commission:', error);
      throw error;
    }
  }

  // Commission Records
  async getCommissionRecords(
    affiliateId?: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<CommissionRecord[]> {
    try {
      let query = supabase
        .from('commission_records')
        .select(`
          *,
          profiles!commission_records_affiliate_id_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (affiliateId) {
        query = query.eq('affiliate_id', affiliateId);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data: records, error } = await query;

      if (error) throw error;

      return (records || []).map(record => ({
        id: record.id,
        affiliateId: record.affiliate_id,
        affiliateName: record.profiles?.full_name || 'Unknown',
        subscriptionId: record.subscription_id,
        paymentId: record.payment_id,
        baseAmount: record.base_amount,
        commissionRate: record.commission_rate,
        commissionAmount: record.commission_amount,
        tierName: record.tier_name,
        bonusAmount: record.bonus_amount,
        totalCommission: record.total_commission,
        status: record.status,
        paidAt: record.paid_at,
        clawbackReason: record.clawback_reason,
        metadata: record.metadata || {},
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));
    } catch (error) {
      console.error('Error fetching commission records:', error);
      throw error;
    }
  }

  // Commission Payouts
  async createCommissionPayout(
    affiliateId: string,
    payoutPeriod: string,
    payoutMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'check'
  ): Promise<{ success: boolean; payoutId?: string; message: string }> {
    try {
      const { data: result, error } = await supabase.rpc('create_commission_payout', {
        p_affiliate_id: affiliateId,
        p_payout_period: payoutPeriod,
        p_payout_method: payoutMethod
      });

      if (error) throw error;

      const payoutResult = result[0];
      return {
        success: payoutResult.success,
        payoutId: payoutResult.payout_id,
        message: payoutResult.message
      };
    } catch (error) {
      console.error('Error creating commission payout:', error);
      throw error;
    }
  }

  async getCommissionPayouts(
    affiliateId?: string,
    options?: {
      status?: string;
      limit?: number;
    }
  ): Promise<CommissionPayout[]> {
    try {
      let query = supabase
        .from('commission_payouts')
        .select(`
          *,
          profiles!commission_payouts_affiliate_id_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (affiliateId) {
        query = query.eq('affiliate_id', affiliateId);
      }

      if (options?.status) {
        query = query.eq('payout_status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: payouts, error } = await query;

      if (error) throw error;

      return (payouts || []).map(payout => ({
        id: payout.id,
        affiliateId: payout.affiliate_id,
        affiliateName: payout.profiles?.full_name || 'Unknown',
        payoutPeriod: payout.payout_period,
        totalCommissions: payout.total_commissions,
        totalPayments: payout.total_payments,
        payoutAmount: payout.payout_amount,
        payoutMethod: payout.payout_method,
        payoutStatus: payout.payout_status,
        payoutDate: payout.payout_date,
        processingFee: payout.processing_fee,
        taxWithholding: payout.tax_withholding,
        netPayout: payout.net_payout,
        payoutReference: payout.payout_reference,
        createdAt: payout.created_at,
        updatedAt: payout.updated_at
      }));
    } catch (error) {
      console.error('Error fetching commission payouts:', error);
      throw error;
    }
  }

  // Commission Analytics
  async getCommissionSummary(affiliateId?: string): Promise<CommissionSummary[]> {
    try {
      const { data: summaries, error } = await supabase.rpc('get_commission_summary', {
        p_affiliate_id: affiliateId
      });

      if (error) throw error;

      return (summaries || []).map(summary => ({
        affiliateId: summary.affiliate_id,
        affiliateName: summary.affiliate_name,
        totalEarned: summary.total_earned,
        totalPaid: summary.total_paid,
        pendingCommissions: summary.pending_commissions,
        currentTier: summary.current_tier,
        monthlyEarnings: summary.monthly_earnings,
        lifetimeEarnings: summary.lifetime_earnings,
        activeSubscriptions: summary.active_subscriptions,
        averageCommissionRate: summary.average_commission_rate,
        lastPayoutDate: summary.last_payout_date,
        nextPayoutDate: summary.next_payout_date
      }));
    } catch (error) {
      console.error('Error fetching commission summary:', error);
      throw error;
    }
  }

  async getCommissionAnalytics(
    startDate: string,
    endDate: string
  ): Promise<CommissionAnalytics> {
    try {
      const { data: analytics, error } = await supabase.rpc('get_commission_analytics', {
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;

      const result = analytics[0];
      return {
        totalCommissionsPaid: result.total_commissions_paid,
        totalPendingCommissions: result.total_pending_commissions,
        averageCommissionRate: result.average_commission_rate,
        topPerformingAffiliates: result.top_performing_affiliates || [],
        commissionsByTier: result.commissions_by_tier || {},
        monthlyTrends: result.monthly_trends || []
      };
    } catch (error) {
      console.error('Error fetching commission analytics:', error);
      throw error;
    }
  }

  // Commission Actions
  async approveCommission(commissionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('commission_records')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', commissionId)
        .eq('status', 'pending');

      if (error) throw error;

      return {
        success: true,
        message: 'Commission approved successfully'
      };
    } catch (error) {
      console.error('Error approving commission:', error);
      throw error;
    }
  }

  async clawbackCommission(
    commissionId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('commission_records')
        .update({
          status: 'clawed_back',
          clawback_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', commissionId);

      if (error) throw error;

      return {
        success: true,
        message: 'Commission clawed back successfully'
      };
    } catch (error) {
      console.error('Error processing commission clawback:', error);
      throw error;
    }
  }

  async processAutomatedPayouts(
    payoutMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'check'
  ): Promise<{ success: boolean; processedCount: number; message: string }> {
    try {
      const { data: result, error } = await supabase.rpc('process_automated_payouts', {
        p_payout_method: payoutMethod
      });

      if (error) throw error;

      const processResult = result[0];
      return {
        success: processResult.success,
        processedCount: processResult.processed_count,
        message: processResult.message
      };
    } catch (error) {
      console.error('Error processing automated payouts:', error);
      throw error;
    }
  }

  // Tax Reporting
  async generate1099Reports(taxYear: number): Promise<{ success: boolean; reportCount: number; message: string }> {
    try {
      const { data: result, error } = await supabase.rpc('generate_1099_reports', {
        p_tax_year: taxYear
      });

      if (error) throw error;

      const reportResult = result[0];
      return {
        success: reportResult.success,
        reportCount: reportResult.report_count,
        message: reportResult.message
      };
    } catch (error) {
      console.error('Error generating 1099 reports:', error);
      throw error;
    }
  }
}

export default CommissionManagementService;