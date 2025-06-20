export interface Expert {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  specialties: string[];
  current_workload: number;
  max_capacity: number;
  commission_rate: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StrategyCommissionRate {
  id: string;
  affiliate_id: string;
  strategy_name: string;
  affiliate_rate: number; // 0.0-1.0 (percentage as decimal)
  admin_rate: number;     // 0.0-1.0 (percentage as decimal)
  expert_fee_percentage?: number; // 0.0-1.0 (what expert charges client)
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ExpertStatus = 'assigned' | 'contacted' | 'in_progress' | 'completed' | 'declined';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProposalAssignment {
  id: string;
  proposal_id: string;
  expert_id: string;
  assigned_by: string;
  assigned_at: string;
  submitted_to_expert_at?: string;
  expert_response_at?: string;
  expert_status: ExpertStatus;
  notes?: string;
  priority: Priority;
  created_at: string;
  updated_at: string;
  // Populated relationships
  expert?: Expert;
  assigned_by_user?: {
    full_name: string;
    email: string;
  };
}

export type TransactionType = 'expert_payment_received' | 'affiliate_payment_due' | 'affiliate_payment_sent' | 'admin_commission';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface CommissionTransaction {
  id: string;
  proposal_id: string;
  affiliate_id: string;
  expert_id: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  transaction_date: string;
  payment_method?: string;
  reference_number?: string;
  status: TransactionStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Populated relationships
  affiliate?: {
    full_name: string;
    email: string;
    affiliate_code: string;
  };
  expert?: Expert;
}

export interface ProposalTimeline {
  id: string;
  proposal_id: string;
  status_from?: string;
  status_to: string;
  changed_by: string;
  changed_at: string;
  notes?: string;
  metadata: Record<string, any>;
  // Populated relationships
  changed_by_user?: {
    full_name: string;
    email: string;
    role: string;
  };
}

// Commission calculation helpers
export interface CommissionCalculation {
  client_payment: number;
  expert_fee_percentage: number;
  total_expert_fee: number;
  affiliate_rate: number;
  admin_rate: number;
  affiliate_commission: number;
  admin_commission: number;
  total_commission: number;
}

// Form types
export interface CreateExpertForm {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  specialties: string[];
  max_capacity: number;
  commission_rate: number;
  notes?: string;
}

export interface CreateStrategyRateForm {
  affiliate_id: string;
  strategy_name: string;
  affiliate_rate: number;
  admin_rate: number;
  expert_fee_percentage?: number;
  notes?: string;
}

export interface AssignExpertForm {
  proposal_id: string;
  expert_id: string;
  priority: Priority;
  notes?: string;
}

export interface RecordPaymentForm {
  proposal_id: string;
  affiliate_id: string;
  expert_id: string;
  transaction_type: TransactionType;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
}

// Dashboard stats
export interface CommissionStats {
  total_expert_payments_received: number;
  total_affiliate_payments_due: number;
  total_affiliate_payments_sent: number;
  pending_assignments: number;
  active_assignments: number;
  completed_assignments: number;
  monthly_commission_volume: number;
  top_performing_affiliates: Array<{
    affiliate_id: string;
    affiliate_name: string;
    total_commission: number;
    proposal_count: number;
  }>;
  expert_workload: Array<{
    expert_id: string;
    expert_name: string;
    current_workload: number;
    max_capacity: number;
    utilization_rate: number;
  }>;
}

export interface AffiliateCommissionDashboard {
  total_earned: number;
  pending_payments: number;
  completed_payments: number;
  monthly_earnings: number;
  commission_by_strategy: Array<{
    strategy_name: string;
    total_commission: number;
    proposal_count: number;
  }>;
  recent_transactions: CommissionTransaction[];
  payment_schedule: Array<{
    due_date: string;
    amount: number;
    proposal_count: number;
  }>;
} 