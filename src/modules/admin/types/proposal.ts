export interface TaxCalculationSummary {
  // Basic tax info
  totalIncome: number;
  filingStatus: string;
  state: string;
  year: number;
  
  // Tax breakdowns
  beforeTaxes: {
    federal: number;
    state: number;
    socialSecurity: number;
    medicare: number;
    selfEmployment: number;
    total: number;
    effectiveRate: number;
  };
  
  afterTaxes: {
    federal: number;
    state: number;
    socialSecurity: number;
    medicare: number;
    selfEmployment: number;
    total: number;
    effectiveRate: number;
  };
  
  // Strategy details
  strategies: {
    id: string;
    name: string;
    enabled: boolean;
    estimatedSavings: number;
    category: string;
    details?: any;
  }[];
  
  // Savings summary
  savings: {
    rawSavings: number;
    annualSavings: number;
    fiveYearValue: number;
    beforeRate: string;
    afterRate: string;
    shiftedIncome: number;
    deferredIncome: number;
  };
  
  // Income distribution
  incomeDistribution: {
    wagesIncome: number;
    passiveIncome: number;
    unearnedIncome: number;
    ordinaryK1Income: number;
    guaranteedK1Income: number;
  };
}

export interface TaxProposal {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  affiliateId?: string;
  affiliateName?: string;
  status: ProposalStatus;
  calculation: TaxCalculationSummary;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  assignedExpertId?: string;
  assignedExpertName?: string;
  notes: ProposalNote[];
  implementationStatus: ImplementationStatus;
  projectedRevenue: number;
  actualRevenue?: number;
}

export type ProposalStatus = 
  | 'draft' 
  | 'submitted' 
  | 'in_review' 
  | 'approved' 
  | 'rejected' 
  | 'finalized' 
  | 'implemented';

export type ImplementationStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface ProposalNote {
  id: string;
  proposalId: string;
  note: string;
  isInternal: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AdminStats {
  totalProposals: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  implemented: number;
  totalRevenue: number;
  averageSavings: number;
  topStrategies: Array<{
    name: string;
    count: number;
    averageSavings: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
} 