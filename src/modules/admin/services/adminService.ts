import { 
  TaxProposal, 
  AffiliateUser, 
  ClientProfile, 
  AdminStats, 
  ProposalStatus, 
  AdminNote,
  Expert,
  ApiResponse,
  PaginatedResponse,
  StrategyImplementation,
  ExpertReferral,
  Commission,
  StrategyStatus,
  ReferralStatus,
  CommissionStatus
} from '../../shared/types';

// Utility function for generating IDs
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Mock data for development - Based on actual calculator entries
const mockProposals: TaxProposal[] = [
  {
    id: 'prop-001',
    client_id: 'client-001',
    affiliate_id: 'affiliate-001',
    status: 'submitted',
    baseline_calculation: {
      total_income: 485000,
      federal_tax: 152800,
      state_tax: 24250,
      total_tax: 177050,
      effective_rate: 36.5
    },
    proposed_strategies: [
      {
        id: 'charitable_donation',
        name: 'Charitable Donation',
        category: 'new_deductions',
        description: 'Strategic charitable giving for tax benefits',
        estimated_savings: 18750,
        implementation_complexity: 'low',
        requires_expert: false,
        eligibility_criteria: ['Charitable intent', 'Sufficient income'],
        enabled: true
      },
      {
        id: 'augusta_rule',
        name: 'Augusta Rule',
        category: 'new_deductions',
        description: 'Rent home to business for meetings',
        estimated_savings: 8400,
        implementation_complexity: 'low',
        requires_expert: false,
        eligibility_criteria: ['Business owner', 'Home office available'],
        enabled: true
      }
    ],
    projected_savings: {
      annual_savings: 27150,
      five_year_value: 135750,
      total_tax_reduction: 27150
    },
    strategy_implementations: [
      {
        id: 'impl-001',
        proposal_id: 'prop-001',
        strategy_id: 'charitable_donation',
        strategy_name: 'Charitable Donation',
        status: 'not_started',
        estimated_savings: 18750,
        commission_status: 'pending',
        admin_notes: [],
        created_at: '2024-12-01T10:30:00Z',
        updated_at: '2024-12-01T10:30:00Z'
      },
      {
        id: 'impl-002',
        proposal_id: 'prop-001',
        strategy_id: 'augusta_rule',
        strategy_name: 'Augusta Rule',
        status: 'not_started',
        estimated_savings: 8400,
        commission_status: 'pending',
        admin_notes: [],
        created_at: '2024-12-01T10:30:00Z',
        updated_at: '2024-12-01T10:30:00Z'
      }
    ],
    client_profile: {
      id: 'client-001',
      affiliate_id: 'affiliate-001',
      personal_info: {
        full_name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@dentalcare.com',
        address: {
          street: '1234 Oak Street',
          city: 'Beverly Hills',
          state: 'CA',
          zip: '90210'
        }
      },
      tax_info: {
        filing_status: 'married_filing_jointly',
        dependents: 2,
        state: 'CA',
        wages_income: 0,
        business_income: 485000,
        passive_income: 0,
        capital_gains: 0,
        other_income: 0,
        current_deductions: 0,
        qbi_eligible: true,
        business_owner: true,
        high_income: true
      },
      created_at: '2024-12-01T10:00:00Z',
      updated_at: '2024-12-01T10:30:00Z'
    },
    detailed_calculations: {
      baseline_breakdown: {
        total_income: 485000,
        federal_tax: 152800,
        state_tax: 24250,
        total_tax: 177050,
        effective_rate: 36.5
      },
      strategy_breakdown: {
        charitable_donation: {
          donation_amount: 50000,
          tax_benefit: 18750,
          net_benefit: 18750
        },
        augusta_rule: {
          rental_days: 14,
          daily_rate: 600,
          total_benefit: 8400
        }
      },
      selected_year: 2024,
      tax_rates_used: {
        federal: { rate: 37, bracket: 'Over $693,750' },
        state: { rate: 13.3, bracket: 'Over $1,000,000' }
      }
    },
    strategy_details: [
      {
        id: 'charitable_donation',
        name: 'Charitable Donation',
        category: 'new_deductions',
        estimated_savings: 18750,
        details: {
          charitableDonation: {
            donationAmount: 50000,
            totalBenefit: 18750,
            netBenefit: 18750
          }
        }
      },
      {
        id: 'augusta_rule',
        name: 'Augusta Rule',
        category: 'new_deductions',
        estimated_savings: 8400,
        details: {
          augustaRule: {
            rentalDays: 14,
            dailyRate: 600,
            totalBenefit: 8400
          }
        }
      }
    ],
    submitted_at: '2024-12-01T10:30:00Z',
    admin_notes: [],
    documents: [],
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:30:00Z'
  },
  {
    id: 'prop-002',
    client_id: 'client-002',
    affiliate_id: 'affiliate-002',
    status: 'in_review',
    baseline_calculation: {
      total_income: 320000,
      federal_tax: 76800,
      state_tax: 16000,
      total_tax: 92800,
      effective_rate: 29.0
    },
    proposed_strategies: [
      {
        id: 'family_management_company',
        name: 'Family Management Company',
        category: 'income_shifted',
        description: 'Shift income to family members in lower tax brackets',
        estimated_savings: 28500,
        implementation_complexity: 'medium',
        requires_expert: true,
        eligibility_criteria: ['High income earner', 'Family members available'],
        enabled: true
      },
      {
        id: 'hire_children',
        name: 'Hire Your Kids',
        category: 'income_shifted',
        description: 'Employ children in your business',
        estimated_savings: 4200,
        implementation_complexity: 'low',
        requires_expert: false,
        eligibility_criteria: ['Business owner', 'Children available'],
        enabled: true
      }
    ],
    projected_savings: {
      annual_savings: 32700,
      five_year_value: 163500,
      total_tax_reduction: 32700
    },
    strategy_implementations: [
      {
        id: 'impl-003',
        proposal_id: 'prop-002',
        strategy_id: 'family_management_company',
        strategy_name: 'Family Management Company',
        status: 'referred',
        estimated_savings: 28500,
        commission_status: 'pending',
        expert_referral: {
          id: 'ref-001',
          strategy_implementation_id: 'impl-003',
          expert_id: 'expert-001',
          expert_name: 'Michael Chen',
          expert_email: 'michael.chen@taxexperts.com',
          expert_specialties: ['Business Structure', 'Tax Planning'],
          status: 'sent',
          referral_date: '2024-12-01T14:20:00Z',
          commission_rate: 15,
          estimated_commission: 4275,
          created_at: '2024-12-01T14:20:00Z',
          updated_at: '2024-12-01T14:20:00Z'
        },
        admin_notes: [
          {
            id: 'note-001',
            strategy_implementation_id: 'impl-003',
            admin_id: 'admin-001',
            admin_name: 'Admin User',
            note: 'Referred to Michael Chen for FMC implementation',
            note_type: 'referral',
            is_internal: true,
            created_at: '2024-12-01T14:20:00Z'
          }
        ],
        created_at: '2024-12-01T14:00:00Z',
        updated_at: '2024-12-01T14:20:00Z'
      },
      {
        id: 'impl-004',
        proposal_id: 'prop-002',
        strategy_id: 'hire_children',
        strategy_name: 'Hire Your Kids',
        status: 'not_started',
        estimated_savings: 4200,
        commission_status: 'pending',
        admin_notes: [],
        created_at: '2024-12-01T14:00:00Z',
        updated_at: '2024-12-01T14:00:00Z'
      }
    ],
    client_profile: {
      id: 'client-002',
      affiliate_id: 'affiliate-002',
      personal_info: {
        full_name: 'Robert Martinez',
        email: 'robert.martinez@techstartup.com',
        address: {
          street: '5678 Innovation Drive',
          city: 'Austin',
          state: 'TX',
          zip: '78701'
        }
      },
      tax_info: {
        filing_status: 'married_filing_jointly',
        dependents: 3,
        state: 'TX',
        wages_income: 0,
        business_income: 320000,
        passive_income: 0,
        capital_gains: 0,
        other_income: 0,
        current_deductions: 0,
        qbi_eligible: true,
        business_owner: true,
        high_income: false
      },
      created_at: '2024-12-01T14:00:00Z',
      updated_at: '2024-12-01T14:00:00Z'
    },
    detailed_calculations: {
      baseline_breakdown: {
        total_income: 320000,
        federal_tax: 76800,
        state_tax: 16000,
        total_tax: 92800,
        effective_rate: 29.0
      },
      strategy_breakdown: {
        family_management_company: {
          income_shifted: 95000,
          tax_benefit: 28500
        },
        hire_children: {
          children_employed: 2,
          total_wages: 14000,
          tax_benefit: 4200
        }
      },
      selected_year: 2024,
      tax_rates_used: {
        federal: { rate: 24, bracket: '$190,751 to $364,200' },
        state: { rate: 0, bracket: 'No state income tax' }
      }
    },
    strategy_details: [
      {
        id: 'family_management_company',
        name: 'Family Management Company',
        category: 'income_shifted',
        estimated_savings: 28500,
        details: {
          familyManagementCompany: {
            incomeShifted: 95000,
            totalBenefit: 28500
          }
        }
      },
      {
        id: 'hire_children',
        name: 'Hire Your Kids',
        category: 'income_shifted',
        estimated_savings: 4200,
        details: {
          hireChildren: {
            childrenEmployed: 2,
            totalWages: 14000,
            totalBenefit: 4200
          }
        }
      }
    ],
    submitted_at: '2024-12-01T14:00:00Z',
    reviewed_at: '2024-12-01T14:15:00Z',
    assigned_expert: 'expert-001',
    admin_notes: [
      {
        id: 'note-002',
        admin_id: 'admin-001',
        admin_name: 'Admin User',
        note: 'FMC strategy requires expert implementation. Referred to Michael Chen.',
        created_at: '2024-12-01T14:15:00Z',
        is_internal: true
      }
    ],
    documents: [],
    created_at: '2024-12-01T14:00:00Z',
    updated_at: '2024-12-01T14:20:00Z'
  },
  {
    id: 'prop-003',
    client_id: 'client-003',
    affiliate_id: 'affiliate-001',
    status: 'approved',
    baseline_calculation: {
      total_income: 180000,
      federal_tax: 36000,
      state_tax: 9000,
      total_tax: 45000,
      effective_rate: 25.0
    },
    proposed_strategies: [
      {
        id: 'cost_segregation',
        name: 'Cost Segregation',
        category: 'new_deductions',
        description: 'Accelerate depreciation on real estate',
        estimated_savings: 15600,
        implementation_complexity: 'high',
        requires_expert: true,
        eligibility_criteria: ['Real estate owner', 'Commercial property'],
        enabled: true
      }
    ],
    projected_savings: {
      annual_savings: 15600,
      five_year_value: 78000,
      total_tax_reduction: 15600
    },
    strategy_implementations: [
      {
        id: 'impl-005',
        proposal_id: 'prop-003',
        strategy_id: 'cost_segregation',
        strategy_name: 'Cost Segregation',
        status: 'engaged',
        estimated_savings: 15600,
        transaction_value: 520000,
        commission_amount: 2340,
        commission_status: 'earned',
        expert_referral: {
          id: 'ref-002',
          strategy_implementation_id: 'impl-005',
          expert_id: 'expert-002',
          expert_name: 'Jennifer Williams',
          expert_email: 'jennifer.williams@costseg.com',
          expert_specialties: ['Cost Segregation', 'Real Estate Tax'],
          status: 'accepted',
          referral_date: '2024-11-30T09:00:00Z',
          response_date: '2024-11-30T10:30:00Z',
          response_notes: 'Client engaged. Starting cost segregation study.',
          commission_rate: 15,
          estimated_commission: 2340,
          actual_commission: 2340,
          created_at: '2024-11-30T09:00:00Z',
          updated_at: '2024-11-30T10:30:00Z'
        },
        admin_notes: [
          {
            id: 'note-003',
            strategy_implementation_id: 'impl-005',
            admin_id: 'admin-001',
            admin_name: 'Admin User',
            note: 'Cost segregation study initiated. Property value: $520,000',
            note_type: 'progress',
            is_internal: false,
            created_at: '2024-11-30T10:30:00Z'
          }
        ],
        engaged_at: '2024-11-30T10:30:00Z',
        created_at: '2024-11-30T09:00:00Z',
        updated_at: '2024-11-30T10:30:00Z'
      }
    ],
    client_profile: {
      id: 'client-003',
      affiliate_id: 'affiliate-001',
      personal_info: {
        full_name: 'Lisa Thompson',
        email: 'lisa.thompson@restaurant.com',
        address: {
          street: '9012 Main Street',
          city: 'Nashville',
          state: 'TN',
          zip: '37201'
        }
      },
      tax_info: {
        filing_status: 'single',
        dependents: 0,
        state: 'TN',
        wages_income: 0,
        business_income: 180000,
        passive_income: 0,
        capital_gains: 0,
        other_income: 0,
        current_deductions: 0,
        qbi_eligible: true,
        business_owner: true,
        high_income: false
      },
      created_at: '2024-11-30T09:00:00Z',
      updated_at: '2024-11-30T09:00:00Z'
    },
    detailed_calculations: {
      baseline_breakdown: {
        total_income: 180000,
        federal_tax: 36000,
        state_tax: 9000,
        total_tax: 45000,
        effective_rate: 25.0
      },
      strategy_breakdown: {
        cost_segregation: {
          property_value: 520000,
          accelerated_depreciation: 52000,
          tax_benefit: 15600
        }
      },
      selected_year: 2024,
      tax_rates_used: {
        federal: { rate: 24, bracket: '$95,376 to $182,100' },
        state: { rate: 0, bracket: 'No state income tax' }
      }
    },
    strategy_details: [
      {
        id: 'cost_segregation',
        name: 'Cost Segregation',
        category: 'new_deductions',
        estimated_savings: 15600,
        details: {
          costSegregation: {
            propertyValue: 520000,
            acceleratedDepreciation: 52000,
            totalBenefit: 15600
          }
        }
      }
    ],
    submitted_at: '2024-11-30T09:00:00Z',
    reviewed_at: '2024-11-30T09:30:00Z',
    approved_at: '2024-11-30T09:45:00Z',
    assigned_expert: 'expert-002',
    admin_notes: [
      {
        id: 'note-004',
        admin_id: 'admin-001',
        admin_name: 'Admin User',
        note: 'Cost segregation strategy approved. Property qualifies for accelerated depreciation.',
        created_at: '2024-11-30T09:45:00Z',
        is_internal: false
      }
    ],
    documents: [],
    created_at: '2024-11-30T09:00:00Z',
    updated_at: '2024-11-30T10:30:00Z'
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

  async createProposal(proposal: TaxProposal): Promise<ApiResponse<TaxProposal>> {
    // In production, insert into Supabase. For now, add to mockProposals.
    mockProposals.push(proposal);
    return {
      success: true,
      data: proposal,
      message: 'Proposal created successfully'
    };
  }

  // Strategy Implementation Management
  async createStrategyImplementations(proposalId: string, strategies: any[]): Promise<StrategyImplementation[]> {
    try {
      const implementations = strategies.map(strategy => ({
        id: generateId(),
        proposal_id: proposalId,
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        status: 'not_started' as StrategyStatus,
        estimated_savings: strategy.estimated_savings || 0,
        commission_status: 'pending' as CommissionStatus,
        admin_notes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // In a real app, this would save to database
      console.log('Created strategy implementations:', implementations);
      return implementations;
    } catch (error) {
      console.error('Error creating strategy implementations:', error);
      throw error;
    }
  }

  async updateStrategyStatus(
    implementationId: string, 
    status: StrategyStatus, 
    transactionValue?: number,
    actualSavings?: number
  ): Promise<StrategyImplementation> {
    try {
      // In a real app, this would update the database
      const implementation = {
        id: implementationId,
        status,
        transaction_value: transactionValue,
        actual_savings: actualSavings,
        updated_at: new Date().toISOString()
      };

      console.log('Updated strategy implementation:', implementation);
      return implementation as StrategyImplementation;
    } catch (error) {
      console.error('Error updating strategy status:', error);
      throw error;
    }
  }

  // Expert Referral Management
  async createExpertReferral(
    strategyImplementationId: string,
    expertId: string,
    expertName: string,
    expertEmail: string,
    expertSpecialties: string[],
    commissionRate: number,
    estimatedCommission: number
  ): Promise<ExpertReferral> {
    try {
      const referral = {
        id: generateId(),
        strategy_implementation_id: strategyImplementationId,
        expert_id: expertId,
        expert_name: expertName,
        expert_email: expertEmail,
        expert_specialties: expertSpecialties,
        status: 'sent' as ReferralStatus,
        referral_date: new Date().toISOString(),
        commission_rate: commissionRate,
        estimated_commission: estimatedCommission,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Created expert referral:', referral);
      return referral;
    } catch (error) {
      console.error('Error creating expert referral:', error);
      throw error;
    }
  }

  async updateReferralStatus(
    referralId: string,
    status: ReferralStatus,
    responseNotes?: string
  ): Promise<ExpertReferral> {
    try {
      const referral = {
        id: referralId,
        status,
        response_notes: responseNotes,
        response_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Updated referral status:', referral);
      return referral as ExpertReferral;
    } catch (error) {
      console.error('Error updating referral status:', error);
      throw error;
    }
  }

  // Commission Management
  async createCommission(
    affiliateId: string,
    affiliateName: string,
    proposalId: string,
    clientId: string,
    clientName: string,
    strategyImplementationId: string,
    strategyName: string,
    commissionRate: number,
    transactionValue: number
  ): Promise<Commission> {
    try {
      const commissionAmount = transactionValue * (commissionRate / 100);
      
      const commission = {
        id: generateId(),
        affiliate_id: affiliateId,
        affiliate_name: affiliateName,
        proposal_id: proposalId,
        client_id: clientId,
        client_name: clientName,
        strategy_implementation_id: strategyImplementationId,
        strategy_name: strategyName,
        commission_rate: commissionRate,
        transaction_value: transactionValue,
        commission_amount: commissionAmount,
        status: 'pending' as CommissionStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Created commission:', commission);
      return commission;
    } catch (error) {
      console.error('Error creating commission:', error);
      throw error;
    }
  }

  async updateCommissionStatus(
    commissionId: string,
    status: CommissionStatus,
    earnedDate?: string,
    paidDate?: string,
    paymentReference?: string
  ): Promise<Commission> {
    try {
      const commission = {
        id: commissionId,
        status,
        earned_date: earnedDate,
        paid_date: paidDate,
        payment_reference: paymentReference,
        updated_at: new Date().toISOString()
      };

      console.log('Updated commission status:', commission);
      return commission as Commission;
    } catch (error) {
      console.error('Error updating commission status:', error);
      throw error;
    }
  }

  // Strategy Notes Management
  async addStrategyNote(
    strategyImplementationId: string,
    adminId: string,
    adminName: string,
    note: string,
    noteType: 'general' | 'referral' | 'progress' | 'completion' | 'cancellation',
    isInternal: boolean = false
  ): Promise<any> {
    try {
      const strategyNote = {
        id: generateId(),
        strategy_implementation_id: strategyImplementationId,
        admin_id: adminId,
        admin_name: adminName,
        note,
        note_type: noteType,
        is_internal: isInternal,
        created_at: new Date().toISOString()
      };

      console.log('Added strategy note:', strategyNote);
      return strategyNote;
    } catch (error) {
      console.error('Error adding strategy note:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService(); 