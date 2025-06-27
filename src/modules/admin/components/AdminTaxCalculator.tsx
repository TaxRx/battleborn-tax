import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  UserPlus, 
  Users, 
  FileText, 
  DollarSign, 
  ArrowRight,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  Building,
  Home,
  X,
  Info,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { AffiliateUser, TaxProposal } from '../../shared/types';
import CreateClientModal from './CreateClientModal';
import TaxCalculator from '../../../components/TaxCalculator';
import { TaxInfo } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { adminService } from '../../admin/services/adminService';
import { useUser } from '../../../context/UserContext';
import useAuthStore from '../../../store/authStore';

interface AdminTaxCalculatorProps {}

// Use the existing client_profiles table structure
interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  annual_income: number;
  filing_status: string;
  state: string;
  business_owner: boolean;
  current_stage: string;
  assigned_affiliate_id?: string;
  assigned_expert_id?: string;
  at_risk_of_loss: boolean;
  engagement_score: number;
  created_at: string;
  updated_at: string;
  // Add detailed income fields from tax_profiles
  wages_income?: number;
  passive_income?: number;
  unearned_income?: number;
  capital_gains?: number;
  ordinary_k1_income?: number;
  guaranteed_k1_income?: number;
  custom_deduction?: number;
  standard_deduction?: boolean;
  dependents?: number;
  home_address?: string;
  business_name?: string;
  entity_type?: string;
  business_address?: string;
  deduction_limit_reached?: boolean;
  household_income?: number;
}

const AdminTaxCalculator: React.FC<AdminTaxCalculatorProps> = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'clients' | 'calculator' | 'proposals'>('clients');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [proposals, setProposals] = useState<TaxProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<TaxProposal | null>(null);
  const [showProposalReview, setShowProposalReview] = useState(false);
  const [proposalNote, setProposalNote] = useState('');
  const [affiliates] = useState<AffiliateUser[]>([
    { id: '1', full_name: 'John Affiliate', email: 'john@affiliate.com' },
    { id: '2', full_name: 'Sarah Partner', email: 'sarah@partner.com' }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        // Fetch from tax_profiles table instead of client_profiles
        const { data, error } = await supabase
          .from('tax_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading tax profiles:', error);
          return;
        }

        // Map tax_profiles data to ClientProfile interface
        const mappedClients: ClientProfile[] = data.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || 'Unknown Client',
          email: profile.email || '',
          phone: '', // Not stored in tax_profiles
          company: profile.business_name || '',
          annual_income: profile.household_income || 0,
          filing_status: profile.filing_status || 'single',
          state: profile.state || 'NV',
          business_owner: profile.business_owner || false,
          current_stage: 'initial_contact',
          assigned_affiliate_id: undefined, // Not stored in tax_profiles
          at_risk_of_loss: false,
          engagement_score: 5,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          wages_income: profile.wages_income,
          passive_income: profile.passive_income,
          unearned_income: profile.unearned_income,
          capital_gains: profile.capital_gains,
          ordinary_k1_income: profile.ordinary_k1_income,
          guaranteed_k1_income: profile.guaranteed_k1_income,
          custom_deduction: profile.custom_deduction,
          standard_deduction: profile.standard_deduction,
          dependents: profile.dependents,
          home_address: profile.home_address,
          business_name: profile.business_name,
          entity_type: profile.entity_type,
          business_address: profile.business_address,
          deduction_limit_reached: profile.deduction_limit_reached,
          household_income: profile.household_income
        }));

        setClients(mappedClients);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
    // Load proposals
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      const response = await adminService.getAllProposals();
      setProposals(response.data);
    } catch (error) {
      console.error('Failed to load proposals:', error);
    }
  };

  const handleCreateProposal = async () => {
    if (!selectedClient) return;
    
    // Create a proposal for the selected client
    const proposal: TaxProposal = {
      id: crypto.randomUUID(),
      client_id: selectedClient.id,
      affiliate_id: selectedClient.assigned_affiliate_id || 'admin',
      status: 'submitted',
      baseline_calculation: {
        total_income: selectedClient.annual_income,
        federal_tax: selectedClient.annual_income * 0.24, // Estimate
        state_tax: selectedClient.annual_income * 0.05, // Estimate
        total_tax: selectedClient.annual_income * 0.29,
        effective_rate: 29
      },
      proposed_strategies: [],
      projected_savings: {
        annual_savings: 0,
        five_year_value: 0,
        total_tax_reduction: 0
      },
      admin_notes: [],
      documents: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: new Date().toISOString()
    };

    try {
      await adminService.createProposal(proposal);
      setProposals(prev => [...prev, proposal]);
      setSelectedProposal(proposal);
      setShowProposalReview(true);
      alert('Proposal created successfully!');
    } catch (error) {
      alert('Failed to create proposal: ' + error);
    }
  };

  const handleProposalAction = async (proposalId: string, action: 'approve' | 'reject', note?: string) => {
    try {
      if (action === 'approve') {
        await adminService.approveProposal(proposalId, note || proposalNote);
      } else {
        await adminService.rejectProposal(proposalId, note || proposalNote || 'Rejected by admin');
      }
      
      // Reload proposals
      await loadProposals();
      setShowProposalReview(false);
      setSelectedProposal(null);
      setProposalNote('');
      alert(`Proposal ${action}d successfully!`);
    } catch (error) {
      alert(`Failed to ${action} proposal: ` + error);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (client.company?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.current_stage === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getCreatedByBadge = (affiliateId?: string) => {
    if (!affiliateId) return <span className="badge-admin">Admin Created</span>;
    const affiliate = affiliates.find(a => a.id === affiliateId);
    return <span className="badge-affiliate">{affiliate?.full_name || 'Unknown Affiliate'}</span>;
  };

  // Convert client profile to TaxInfo format for TaxCalculator
  const convertClientToTaxInfo = (client: ClientProfile): TaxInfo => {
    // Map filing status to correct format
    const mapFilingStatus = (status: string): 'single' | 'married_joint' | 'married_separate' | 'head_household' => {
      switch (status) {
        case 'single':
          return 'single';
        case 'married':
        case 'married_joint':
          return 'married_joint';
        case 'married_separate':
          return 'married_separate';
        case 'head_household':
          return 'head_household';
        default:
          return 'single'; // Default fallback
      }
    };

    const taxInfo = {
      fullName: client.full_name,
      email: client.email,
      phone: client.phone || '',
      filingStatus: mapFilingStatus(client.filing_status),
      dependents: client.dependents || 0,
      state: client.state,
      homeAddress: client.home_address || '',
      wagesIncome: client.wages_income || client.annual_income * 0.7,
      passiveIncome: client.passive_income || client.annual_income * 0.2,
      unearnedIncome: client.unearned_income || client.annual_income * 0.1,
      capitalGains: client.capital_gains || 0,
      businessOwner: client.business_owner,
      businessName: client.company || '',
      entityType: client.entity_type as any,
      businessAddress: client.business_address || '',
      ordinaryK1Income: client.ordinary_k1_income || 0,
      guaranteedK1Income: client.guaranteed_k1_income || 0,
      householdIncome: client.household_income || client.annual_income,
      standardDeduction: client.standard_deduction !== false,
      customDeduction: client.custom_deduction || 0,
      deductionLimitReached: client.deduction_limit_reached || false
    };

    console.log('=== CLIENT TO TAXINFO CONVERSION DEBUG ===');
    console.log('Input client:', client);
    console.log('Output taxInfo:', taxInfo);
    console.log('==========================================');

    return taxInfo;
  };

  const handleCreateClient = async (clientData: TaxInfo) => {
    console.log('Creating new client:', clientData);
    
    // Check if user is available
    if (!user?.id) {
      console.error('No authenticated user available');
      console.log('Current user context:', { user, loading });
      
      // Try to disable demo mode and get user again
      const { disableDemoMode } = useAuthStore.getState();
      disableDemoMode();
      
      // Wait a moment for the context to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to get user again
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.id) {
        alert('Error: No authenticated user available. Please log in again.');
        return;
      }
      
      console.log('Retrieved user after disabling demo mode:', currentUser);
    }
    
    try {
      // First, ensure a profile record exists for the current user
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id || (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking profile:', profileError);
        alert('Error checking user profile: ' + profileError.message);
        return;
      }

      // If profile doesn't exist, create one
      if (!existingProfile) {
        const currentUser = user || (await supabase.auth.getUser()).data.user;
        if (!currentUser) {
          alert('Error: No authenticated user available');
          return;
        }
        
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([{
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || 'Admin User',
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
          alert('Error creating user profile: ' + createProfileError.message);
          return;
        }
      }
      
      // Create tax profile data that matches the tax_profiles table schema
      const currentUser = user || (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        alert('Error: No authenticated user available');
        return;
      }
      
      const newTaxProfile = {
        user_id: currentUser.id,
        standard_deduction: clientData.standardDeduction || false,
        business_owner: clientData.businessOwner || false,
        full_name: clientData.fullName,
        email: clientData.email,
        phone: clientData.phone || '', // Add phone field
        filing_status: clientData.filingStatus || 'single',
        dependents: clientData.dependents || 0,
        home_address: clientData.homeAddress || '',
        state: clientData.state || 'NV',
        wages_income: clientData.wagesIncome || 0,
        passive_income: clientData.passiveIncome || 0,
        unearned_income: clientData.unearnedIncome || 0,
        capital_gains: clientData.capitalGains || 0,
        custom_deduction: clientData.customDeduction || 0,
        business_name: clientData.businessName || '',
        entity_type: clientData.entityType || '',
        ordinary_k1_income: clientData.ordinaryK1Income || 0,
        guaranteed_k1_income: clientData.guaranteedK1Income || 0,
        business_address: clientData.businessAddress || '',
        deduction_limit_reached: clientData.deductionLimitReached || false,
        household_income: clientData.householdIncome || 
          (clientData.wagesIncome || 0) + 
          (clientData.passiveIncome || 0) + 
          (clientData.unearnedIncome || 0) + 
          (clientData.capitalGains || 0),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert into tax_profiles table
      const { data, error } = await supabase
        .from('tax_profiles')
        .insert([newTaxProfile])
        .select()
        .single();

      if (error) {
        console.error('Failed to create tax profile:', error);
        alert('Failed to create client: ' + error.message);
        return;
      }

      // Create a client profile object for the UI
      const newClient: ClientProfile = {
        id: data.id,
        full_name: data.full_name || 'New Client',
        email: data.email || '',
        phone: data.phone || '',
        company: data.business_name || '',
        annual_income: data.household_income || 0,
        filing_status: data.filing_status || 'single',
        state: data.state || 'NV',
        business_owner: data.business_owner || false,
        current_stage: 'initial_contact',
        at_risk_of_loss: false,
        engagement_score: 5,
        created_at: data.created_at,
        updated_at: data.updated_at,
        wages_income: data.wages_income,
        passive_income: data.passive_income,
        unearned_income: data.unearned_income,
        capital_gains: data.capital_gains,
        ordinary_k1_income: data.ordinary_k1_income,
        guaranteed_k1_income: data.guaranteed_k1_income,
        custom_deduction: data.custom_deduction,
        standard_deduction: data.standard_deduction,
        dependents: data.dependents,
        home_address: data.home_address,
        business_name: data.business_name,
        entity_type: data.entity_type,
        business_address: data.business_address,
        deduction_limit_reached: data.deduction_limit_reached,
        household_income: data.household_income
      };

      setClients(prev => [...prev, newClient]);
      setShowCreateModal(false);
      setSelectedClient(newClient);
      setActiveTab('calculator');
      
    } catch (error) {
      console.error('Error in handleCreateClient:', error);
      alert('Error creating client: ' + (error as Error).message);
    }
  };

  const handleClientSelect = (client: ClientProfile) => {
    setSelectedClient(client);
    setActiveTab('calculator');
  };

  return (
    <div className="admin-tax-calculator p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Calculator className="mr-2" /> Tax Planning
        </h2>
        <div className="flex items-center space-x-2">
          <button
            className="btn-secondary-modern text-sm"
            onClick={async () => {
              console.log('Debug - Current user context:', { user, loading });
              console.log('Debug - Auth store state:', useAuthStore.getState());
              const { data: { user: currentUser } } = await supabase.auth.getUser();
              console.log('Debug - Direct Supabase user:', currentUser);
            }}
          >
            Debug User
          </button>
          <button
            className="btn-primary-modern flex items-center"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="mr-1" /> New Client File
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'clients' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="inline mr-2 h-4 w-4" />
          Client Files
        </button>
        {selectedClient && (
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'calculator' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calculator className="inline mr-2 h-4 w-4" />
            Tax Planning
          </button>
        )}
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'proposals' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="inline mr-2 h-4 w-4" />
          Proposals ({proposals.length})
        </button>
      </div>

      {/* Client List Tab */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Stages</option>
                <option value="initial_contact">Initial Contact</option>
                <option value="tax_analysis_complete">Analysis Complete</option>
                <option value="proposal_created">Proposal Created</option>
                <option value="proposal_submitted">Proposal Submitted</option>
                <option value="admin_review">Admin Review</option>
                <option value="expert_assigned">Expert Assigned</option>
                <option value="implementation_active">Implementation Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Client Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.full_name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                        {client.company && (
                          <div className="text-xs text-gray-400">{client.company}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        client.current_stage === 'completed' ? 'bg-green-100 text-green-800' :
                        client.current_stage === 'implementation_active' ? 'bg-blue-100 text-blue-800' :
                        client.current_stage === 'proposal_created' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {client.current_stage.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${client.annual_income.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCreatedByBadge(client.assigned_affiliate_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleClientSelect(client)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Open Calculator
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calculator Tab */}
      {activeTab === 'calculator' && selectedClient && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tax Planning for {selectedClient.full_name}
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCreateProposal}
                  className="btn-primary-modern flex items-center"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Create Proposal
                </button>
                <button
                  onClick={() => setActiveTab('clients')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <TaxCalculator initialData={convertClientToTaxInfo(selectedClient)} />
          </div>
        </div>
      )}

      {/* Proposals Tab */}
      {activeTab === 'proposals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tax Proposals</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Annual Savings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {clients.find(c => c.id === proposal.client_id)?.full_name || 'Unknown Client'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        proposal.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${proposal.projected_savings.annual_savings.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(proposal.submitted_at || proposal.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setShowProposalReview(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proposal Review Modal */}
      {showProposalReview && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Review Proposal</h3>
              <button
                onClick={() => setShowProposalReview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Client Information</h4>
                <p className="text-sm text-gray-600">
                  {clients.find(c => c.id === selectedProposal.client_id)?.full_name || 'Unknown Client'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Baseline Calculation</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Total Income: ${selectedProposal.baseline_calculation.total_income.toLocaleString()}</div>
                  <div>Federal Tax: ${selectedProposal.baseline_calculation.federal_tax.toLocaleString()}</div>
                  <div>State Tax: ${selectedProposal.baseline_calculation.state_tax.toLocaleString()}</div>
                  <div>Effective Rate: {selectedProposal.baseline_calculation.effective_rate}%</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Projected Savings</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Annual Savings: ${selectedProposal.projected_savings.annual_savings.toLocaleString()}</div>
                  <div>5-Year Value: ${selectedProposal.projected_savings.five_year_value.toLocaleString()}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Proposed Strategies</h4>
                <div className="space-y-2">
                  {selectedProposal.proposed_strategies.map((strategy, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="font-medium">{strategy.name}</div>
                      <div className="text-gray-600">${strategy.estimated_savings.toLocaleString()} annual savings</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                <textarea
                  value={proposalNote}
                  onChange={(e) => setProposalNote(e.target.value)}
                  placeholder="Add notes about this proposal..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowProposalReview(false);
                    // Find the client for this proposal and open calculator
                    const client = clients.find(c => c.id === selectedProposal.client_id);
                    if (client) {
                      setSelectedClient(client);
                      setActiveTab('calculator');
                    }
                  }}
                  className="btn-secondary-modern flex items-center"
                >
                  <Calculator className="mr-1 h-4 w-4" />
                  View Calculator
                </button>
                <button
                  onClick={() => handleProposalAction(selectedProposal.id, 'reject')}
                  className="btn-secondary-modern flex items-center"
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleProposalAction(selectedProposal.id, 'approve')}
                  className="btn-primary-modern flex items-center"
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onClientCreated={handleCreateClient}
        loading={loading}
      />
    </div>
  );
};

export default AdminTaxCalculator; 