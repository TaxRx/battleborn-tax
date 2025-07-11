// Battle Born Capital Advisors - Shared Types

export type UserRole = 'affiliate' | 'admin' | 'client';

export type ProposalStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'finalized' | 'implemented';

// Strategy Implementation Status
export type StrategyStatus = 'not_started' | 'referred' | 'engaged' | 'in_process' | 'completed' | 'cancelled';

// Expert Referral Status
export type ReferralStatus = 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';

// Commission Status
export type CommissionStatus = 'pending' | 'earned' | 'paid' | 'cancelled';

// User Profile Types
export interface BaseUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AffiliateUser extends BaseUser {
  role: 'affiliate';
  affiliate_code: string;
  commission_rate: number;
  clients_count: number;
  total_proposals: number;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  permissions: AdminPermission[];
  department: string;
}

export interface ClientUser extends BaseUser {
  role: 'client';
  affiliate_id: string;
  proposals: string[]; // proposal IDs
}

export type User = AffiliateUser | AdminUser | ClientUser;

// Admin Permissions
export type AdminPermission = 
  | 'view_all_proposals'
  | 'edit_proposals' 
  | 'approve_proposals'
  | 'manage_users'
  | 'export_reports'
  | 'system_settings';

// Client Profile for Tax Calculations
export interface ClientProfile {
  id: string;
  affiliate_id: string;
  personal_info: {
    full_name: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  tax_info: {
    filing_status: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
    dependents: number;
    state: string;
    wages_income: number;
    business_income: number;
    passive_income: number;
    capital_gains: number;
    other_income: number;
    current_deductions: number;
    qbi_eligible: boolean;
    business_owner: boolean;
    high_income: boolean; // > $400k
  };
  created_at: string;
  updated_at: string;
}

// Tax Strategy Types
export interface TaxStrategy {
  id: string;
  name: string;
  category: 'income_shifted' | 'income_deferred' | 'new_deductions' | 'new_credits';
  description: string;
  estimated_savings: number;
  implementation_complexity: 'low' | 'medium' | 'high';
  requires_expert: boolean;
  min_income_threshold?: number;
  eligibility_criteria: string[];
  details?: Record<string, any>;
  enabled: boolean;
}

// Proposal System
export interface TaxProposal {
  id: string;
  client_id: string;
  affiliate_id: string;
  status: ProposalStatus;
  
  // Tax Analysis
  baseline_calculation: {
    total_income: number;
    federal_tax: number;
    state_tax: number;
    total_tax: number;
    effective_rate: number;
  };
  
  proposed_strategies: TaxStrategy[];
  projected_savings: {
    annual_savings: number;
    five_year_value: number;
    total_tax_reduction: number;
  };
  
  // Strategy Implementations (for admin workflow tracking)
  strategy_implementations: StrategyImplementation[];
  
  // Workflow
  submitted_at?: string;
  reviewed_at?: string;
  approved_at?: string;
  assigned_expert?: string;
  admin_notes: AdminNote[];
  
  // Documents
  documents: ProposalDocument[];
  
  // Enhanced data from calculator
  client_profile?: ClientProfile;
  detailed_calculations?: {
    baseline_breakdown: any;
    strategy_breakdown: any;
    selected_year: number;
    tax_rates_used: any;
  };
  strategy_details?: any[];
  
  created_at: string;
  updated_at: string;
}

export interface AdminNote {
  id: string;
  admin_id: string;
  admin_name: string;
  note: string;
  created_at: string;
  is_internal: boolean; // true = admin only, false = visible to affiliate
}

export interface ProposalDocument {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'word' | 'image';
  url: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
}

// Expert Assignment
export interface Expert {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  current_workload: number;
  max_capacity: number;
}

// Dashboard Analytics
export interface DashboardStats {
  total_proposals: number;
  pending_review: number;
  total_savings_projected: number;
  active_clients: number;
  monthly_growth: number;
}

export interface AffiliateStats extends DashboardStats {
  commission_earned: number;
  conversion_rate: number;
}

export interface AdminStats extends DashboardStats {
  proposals_by_status: Record<ProposalStatus, number>;
  average_review_time: number;
  expert_utilization: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Form Types
export interface CreateClientForm {
  full_name: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface TaxInfoForm {
  filing_status: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
  dependents: number;
  state: string;
  wages_income: number;
  business_income: number;
  passive_income: number;
  capital_gains: number;
  other_income: number;
  current_deductions: number;
  qbi_eligible: boolean;
  business_owner: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'proposal_submitted' | 'proposal_approved' | 'proposal_rejected' | 'expert_assigned' | 'document_uploaded';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

// Export Types
export interface ExportRequest {
  type: 'pdf' | 'excel';
  proposal_id: string;
  include_calculations: boolean;
  include_strategies: boolean;
  include_documents: boolean;
}

// Search and Filter Types
export interface ProposalFilters {
  status?: ProposalStatus[];
  affiliate_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  min_savings?: number;
  max_savings?: number;
}

export interface SearchParams {
  query?: string;
  filters?: ProposalFilters;
  sort_by?: 'created_at' | 'updated_at' | 'projected_savings' | 'client_name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// Strategy Implementation Tracking
export interface StrategyImplementation {
  id: string;
  proposal_id: string;
  strategy_id: string;
  strategy_name: string;
  status: StrategyStatus;
  estimated_savings: number;
  actual_savings?: number;
  transaction_value?: number;
  commission_amount?: number;
  commission_status: CommissionStatus;
  
  // Expert Referral
  expert_referral?: ExpertReferral;
  
  // Admin Notes
  admin_notes: StrategyNote[];
  
  // Timeline
  referred_at?: string;
  engaged_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  
  created_at: string;
  updated_at: string;
}

// Expert Referral
export interface ExpertReferral {
  id: string;
  strategy_implementation_id: string;
  expert_id: string;
  expert_name: string;
  expert_email: string;
  expert_specialties: string[];
  status: ReferralStatus;
  referral_date: string;
  response_date?: string;
  response_notes?: string;
  commission_rate: number;
  estimated_commission: number;
  actual_commission?: number;
  
  created_at: string;
  updated_at: string;
}

// Strategy-specific Admin Notes
export interface StrategyNote {
  id: string;
  strategy_implementation_id: string;
  admin_id: string;
  admin_name: string;
  note: string;
  note_type: 'general' | 'referral' | 'progress' | 'completion' | 'cancellation';
  is_internal: boolean;
  created_at: string;
}

// Commission Tracking
export interface Commission {
  id: string;
  affiliate_id: string;
  affiliate_name: string;
  proposal_id: string;
  client_id: string;
  client_name: string;
  strategy_implementation_id: string;
  strategy_name: string;
  commission_rate: number;
  transaction_value: number;
  commission_amount: number;
  status: CommissionStatus;
  earned_date?: string;
  paid_date?: string;
  payment_reference?: string;
  
  created_at: string;
  updated_at: string;
} 