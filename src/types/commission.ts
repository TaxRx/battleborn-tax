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
  // Additional dashboard properties
  total_commissions: number;
  pending_payouts: number;
  pending_transactions: number;
  active_experts: number;
  expert_utilization: number;
  average_commission: number;
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

// CLIENT TRACKING - Critical for preventing client loss
export interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  
  // Contact preferences
  preferred_contact_method: 'email' | 'phone' | 'text';
  timezone?: string;
  
  // Tax profile summary (for quick reference)
  annual_income: number;
  filing_status: string;
  state: string;
  business_owner: boolean;
  
  // Tracking & Status
  current_stage: ClientStage;
  last_contact_date?: string;
  next_followup_date?: string;
  assigned_affiliate_id: string;
  assigned_expert_id?: string;
  
  // Engagement tracking
  engagement_score: number; // 1-10 based on responsiveness
  communication_log: ClientCommunication[];
  
  // Alerts
  at_risk_of_loss: boolean;
  days_since_last_contact: number;
  
  created_at: string;
  updated_at: string;
}

export type ClientStage = 
  | 'initial_contact'       // Affiliate first contact
  | 'tax_analysis_complete' // Tax calculator completed
  | 'proposal_created'      // Proposal generated
  | 'proposal_submitted'    // Submitted to admin
  | 'admin_review'          // Under admin review
  | 'expert_assigned'       // Expert assigned
  | 'expert_contacted'      // Expert reached out to client
  | 'implementation_active' // Strategies being implemented
  | 'completed'             // All strategies implemented
  | 'lost_to_follow_up'     // Client stopped responding
  | 'declined_services'     // Client declined to proceed
  | 'competitor_lost';      // Lost to competitor

export interface ClientCommunication {
  id: string;
  client_id: string;
  user_id: string;
  user_role: 'affiliate' | 'admin' | 'expert';
  communication_type: 'email' | 'phone' | 'meeting' | 'text' | 'system_note';
  subject?: string;
  summary: string;
  outcome: 'positive' | 'neutral' | 'negative' | 'no_response';
  next_action_required?: string;
  next_action_due_date?: string;
  created_at: string;
  
  // Populated relationships
  user?: {
    full_name: string;
    email: string;
    role: string;
  };
}

// CLIENT ALERTS - Prevent client loss
export interface ClientAlert {
  id: string;
  client_id: string;
  alert_type: ClientAlertType;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  action_required: string;
  assigned_to?: string;
  due_date?: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
  
  // Populated relationships
  client?: ClientProfile;
  assigned_user?: {
    full_name: string;
    email: string;
    role: string;
  };
}

export type ClientAlertType = 
  | 'no_contact_7_days'
  | 'no_contact_14_days'
  | 'no_contact_30_days'
  | 'expert_no_response'
  | 'client_not_responding'
  | 'proposal_stuck_in_review'
  | 'implementation_delayed'
  | 'payment_overdue'
  | 'competitor_threat'
  | 'dissatisfaction_detected';

// ENHANCED PROPOSAL with client context
export interface EnhancedProposal extends TaxProposal {
  client_profile?: ClientProfile;
  affiliate_info?: {
    full_name: string;
    email: string;
    company: string;
    affiliate_code: string;
  };
  expert_assignment?: ProposalAssignment;
  communication_history?: ClientCommunication[];
  active_alerts?: ClientAlert[];
  days_in_current_stage: number;
  risk_score: number; // 1-10, higher = more likely to lose client
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