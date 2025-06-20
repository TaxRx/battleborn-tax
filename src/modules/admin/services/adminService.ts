import { 
  TaxProposal, 
  AffiliateUser, 
  ClientProfile, 
  AdminStats, 
  ProposalStatus, 
  AdminNote,
  Expert,
  ApiResponse,
  PaginatedResponse 
} from '../../shared/types';

// Mock data for development
const mockProposals: TaxProposal[] = [
  {
    id: 'prop-001',
    client_id: 'client-001',
    affiliate_id: 'affiliate-001',
    status: 'submitted',
    baseline_calculation: {
      total_income: 500000,
      federal_tax: 157500,
      state_tax: 25000,
      total_tax: 182500,
      effective_rate: 36.5
    },
    proposed_strategies: [
      {
        id: 'strategy-001',
        name: 'Family Management Company',
        category: 'income_shifted',
        description: 'Shift income to family members in lower tax brackets',
        estimated_savings: 45000,
        implementation_complexity: 'medium',
        requires_expert: true,
        eligibility_criteria: ['High income earner', 'Family members available'],
        enabled: true
      }
    ],
    projected_savings: {
      annual_savings: 45000,
      five_year_value: 225000,
      total_tax_reduction: 45000
    },
    submitted_at: '2024-01-15T10:30:00Z',
    admin_notes: [],
    documents: [],
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'prop-002',
    client_id: 'client-002',
    affiliate_id: 'affiliate-002',
    status: 'in_review',
    baseline_calculation: {
      total_income: 750000,
      federal_tax: 245000,
      state_tax: 37500,
      total_tax: 282500,
      effective_rate: 37.7
    },
    proposed_strategies: [
      {
        id: 'strategy-002',
        name: 'Augusta Rule',
        category: 'new_deductions',
        description: 'Rent home to business for meetings',
        estimated_savings: 18000,
        implementation_complexity: 'low',
        requires_expert: false,
        eligibility_criteria: ['Business owner', 'Home office available'],
        enabled: true
      }
    ],
    projected_savings: {
      annual_savings: 18000,
      five_year_value: 90000,
      total_tax_reduction: 18000
    },
    submitted_at: '2024-01-14T14:20:00Z',
    reviewed_at: '2024-01-14T16:45:00Z',
    assigned_expert: 'expert-001',
    admin_notes: [
      {
        id: 'note-001',
        admin_id: 'admin-001',
        admin_name: 'Demo Admin',
        note: 'Reviewing documentation for Augusta Rule compliance',
        created_at: '2024-01-14T16:45:00Z',
        is_internal: true
      }
    ],
    documents: [],
    created_at: '2024-01-14T13:00:00Z',
    updated_at: '2024-01-14T16:45:00Z'
  },
  {
    id: 'prop-003',
    client_id: 'client-003',
    affiliate_id: 'affiliate-001',
    status: 'approved',
    baseline_calculation: {
      total_income: 300000,
      federal_tax: 72000,
      state_tax: 15000,
      total_tax: 87000,
      effective_rate: 29.0
    },
    proposed_strategies: [
      {
        id: 'strategy-003',
        name: 'Charitable Donations',
        category: 'new_deductions',
        description: 'Strategic charitable giving for tax benefits',
        estimated_savings: 12000,
        implementation_complexity: 'low',
        requires_expert: false,
        eligibility_criteria: ['Charitable intent', 'Sufficient income'],
        enabled: true
      }
    ],
    projected_savings: {
      annual_savings: 12000,
      five_year_value: 60000,
      total_tax_reduction: 12000
    },
    submitted_at: '2024-01-13T11:15:00Z',
    reviewed_at: '2024-01-13T15:30:00Z',
    approved_at: '2024-01-13T16:00:00Z',
    admin_notes: [
      {
        id: 'note-002',
        admin_id: 'admin-001',
        admin_name: 'Demo Admin',
        note: 'Straightforward charitable deduction strategy. Approved.',
        created_at: '2024-01-13T16:00:00Z',
        is_internal: false
      }
    ],
    documents: [],
    created_at: '2024-01-13T10:00:00Z',
    updated_at: '2024-01-13T16:00:00Z'
  }
];

const mockAffiliates: AffiliateUser[] = [
  {
    id: 'affiliate-001',
    email: 'john.smith@example.com',
    full_name: 'John Smith',
    role: 'affiliate',
    affiliate_code: 'JS001',
    commission_rate: 0.15,
    clients_count: 12,
    total_proposals: 8,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    is_active: true
  },
  {
    id: 'affiliate-002',
    email: 'sarah.johnson@example.com',
    full_name: 'Sarah Johnson',
    role: 'affiliate',
    affiliate_code: 'SJ002',
    commission_rate: 0.18,
    clients_count: 18,
    total_proposals: 15,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    is_active: true
  }
];

const mockExperts: Expert[] = [
  {
    id: 'expert-001',
    name: 'Dr. Michael Chen',
    email: 'mchen@battleborncapital.com',
    specialties: ['Family Management Companies', 'Estate Planning', 'Business Structures'],
    current_workload: 5,
    max_capacity: 10
  },
  {
    id: 'expert-002',
    name: 'Jennifer Rodriguez',
    email: 'jrodriguez@battleborncapital.com',
    specialties: ['Real Estate', 'Augusta Rule', 'Cost Segregation'],
    current_workload: 3,
    max_capacity: 8
  }
];

export class AdminService {
  // Proposal Management
  async getAllProposals(): Promise<PaginatedResponse<TaxProposal>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: mockProposals,
      total: mockProposals.length,
      page: 1,
      per_page: 10,
      total_pages: 1
    };
  }

  async getProposal(id: string): Promise<TaxProposal | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProposals.find(p => p.id === id) || null;
  }

  async approveProposal(id: string, adminNote?: string): Promise<ApiResponse<TaxProposal>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const proposalIndex = mockProposals.findIndex(p => p.id === id);
    if (proposalIndex === -1) {
      return { success: false, error: 'Proposal not found' };
    }

    mockProposals[proposalIndex] = {
      ...mockProposals[proposalIndex],
      status: 'approved',
      approved_at: new Date().toISOString(),
      admin_notes: [
        ...mockProposals[proposalIndex].admin_notes,
        ...(adminNote ? [{
          id: `note-${Date.now()}`,
          admin_id: 'admin-001',
          admin_name: 'Demo Admin',
          note: adminNote,
          created_at: new Date().toISOString(),
          is_internal: false
        }] : [])
      ]
    };

    return { 
      success: true, 
      data: mockProposals[proposalIndex],
      message: 'Proposal approved successfully'
    };
  }

  async rejectProposal(id: string, reason: string): Promise<ApiResponse<TaxProposal>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const proposalIndex = mockProposals.findIndex(p => p.id === id);
    if (proposalIndex === -1) {
      return { success: false, error: 'Proposal not found' };
    }

    mockProposals[proposalIndex] = {
      ...mockProposals[proposalIndex],
      status: 'rejected',
      admin_notes: [
        ...mockProposals[proposalIndex].admin_notes,
        {
          id: `note-${Date.now()}`,
          admin_id: 'admin-001',
          admin_name: 'Demo Admin',
          note: `Rejected: ${reason}`,
          created_at: new Date().toISOString(),
          is_internal: false
        }
      ]
    };

    return { 
      success: true, 
      data: mockProposals[proposalIndex],
      message: 'Proposal rejected'
    };
  }

  async assignExpert(proposalId: string, expertId: string): Promise<ApiResponse<TaxProposal>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const proposalIndex = mockProposals.findIndex(p => p.id === proposalId);
    if (proposalIndex === -1) {
      return { success: false, error: 'Proposal not found' };
    }

    const expert = mockExperts.find(e => e.id === expertId);
    if (!expert) {
      return { success: false, error: 'Expert not found' };
    }

    mockProposals[proposalIndex] = {
      ...mockProposals[proposalIndex],
      assigned_expert: expertId,
      status: 'in_review',
      admin_notes: [
        ...mockProposals[proposalIndex].admin_notes,
        {
          id: `note-${Date.now()}`,
          admin_id: 'admin-001',
          admin_name: 'Demo Admin',
          note: `Assigned to expert: ${expert.name}`,
          created_at: new Date().toISOString(),
          is_internal: true
        }
      ]
    };

    return { 
      success: true, 
      data: mockProposals[proposalIndex],
      message: `Assigned to ${expert.name}`
    };
  }

  // User Management
  async getAllAffiliates(): Promise<AffiliateUser[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockAffiliates;
  }

  async getAffiliate(id: string): Promise<AffiliateUser | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockAffiliates.find(a => a.id === id) || null;
  }

  async updateAffiliateStatus(id: string, isActive: boolean): Promise<ApiResponse<AffiliateUser>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const affiliateIndex = mockAffiliates.findIndex(a => a.id === id);
    if (affiliateIndex === -1) {
      return { success: false, error: 'Affiliate not found' };
    }

    mockAffiliates[affiliateIndex] = {
      ...mockAffiliates[affiliateIndex],
      is_active: isActive,
      updated_at: new Date().toISOString()
    };

    return { 
      success: true, 
      data: mockAffiliates[affiliateIndex],
      message: `Affiliate ${isActive ? 'activated' : 'deactivated'}`
    };
  }

  // Expert Management
  async getAllExperts(): Promise<Expert[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockExperts;
  }

  async getAvailableExperts(): Promise<Expert[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockExperts.filter(e => e.current_workload < e.max_capacity);
  }

  // Notes Management
  async addNote(proposalId: string, note: string, isInternal: boolean = false): Promise<ApiResponse<AdminNote>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const proposalIndex = mockProposals.findIndex(p => p.id === proposalId);
    if (proposalIndex === -1) {
      return { success: false, error: 'Proposal not found' };
    }

    const newNote: AdminNote = {
      id: `note-${Date.now()}`,
      admin_id: 'admin-001',
      admin_name: 'Demo Admin',
      note,
      created_at: new Date().toISOString(),
      is_internal: isInternal
    };

    mockProposals[proposalIndex].admin_notes.push(newNote);

    return { 
      success: true, 
      data: newNote,
      message: 'Note added successfully'
    };
  }

  // Analytics
  async getAdminStats(): Promise<AdminStats> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const totalProposals = mockProposals.length;
    const pendingReview = mockProposals.filter(p => p.status === 'submitted').length;
    const totalSavingsProjected = mockProposals.reduce((sum, p) => sum + p.projected_savings.annual_savings, 0);
    const activeClients = new Set(mockProposals.map(p => p.client_id)).size;

    return {
      total_proposals: totalProposals,
      pending_review: pendingReview,
      total_savings_projected: totalSavingsProjected,
      active_clients: activeClients,
      monthly_growth: 15.2,
      proposals_by_status: {
        draft: 0,
        submitted: mockProposals.filter(p => p.status === 'submitted').length,
        in_review: mockProposals.filter(p => p.status === 'in_review').length,
        approved: mockProposals.filter(p => p.status === 'approved').length,
        rejected: mockProposals.filter(p => p.status === 'rejected').length,
        finalized: mockProposals.filter(p => p.status === 'finalized').length,
        implemented: mockProposals.filter(p => p.status === 'implemented').length
      },
      average_review_time: 24.5, // hours
      expert_utilization: 65.8 // percentage
    };
  }
}

export const adminService = new AdminService(); 