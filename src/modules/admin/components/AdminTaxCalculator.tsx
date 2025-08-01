import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  UserPlus, 
  Users, 
  FileText, 
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
  Eye,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  AlertTriangle,
  Calendar,
  Briefcase,
  Settings,
  Archive
} from 'lucide-react';
import { AffiliateUser, TaxProposal, TaxStrategy } from '../../shared/types';
import CreateClientModal from './CreateClientModal';
import TaxCalculator from '../../../components/TaxCalculator';
import { TaxInfo } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { proposalService } from '../services/proposalService';
import { useUser } from '../../../context/UserContext';
import useAuthStore from '../../../store/authStore';
import { strategyPersistenceService } from '../../../services/strategyPersistenceService';
import { toast } from 'react-hot-toast';
import * as Dialog from '@radix-ui/react-dialog';

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
  // Add years and businesses for accordion display
  years?: any[];
  businesses?: any[];
}

// Custom TaxCalculator wrapper for admin context
const AdminTaxCalculatorWrapper: React.FC<{ 
  initialData?: TaxInfo;
  onTaxInfoUpdate?: (taxInfo: TaxInfo) => Promise<void>;
  clientId?: string;
}> = ({ initialData, onTaxInfoUpdate, clientId }) => {
  const { demoMode } = useAuthStore();

  const handleStrategiesSelect = async (selectedStrategies: TaxStrategy[]) => {
    if (!clientId || demoMode) return;

    // Save strategies for admin client
    for (const strategy of selectedStrategies) {
      try {
        await strategyPersistenceService.saveStrategyDetailsForAdminClient(
          strategy, 
          clientId, 
          new Date().getFullYear()
        );
      } catch (error) {
        console.error(`Failed to save admin strategy ${strategy.id}:`, error);
      }
    }
  };

  const handleStrategyAction = async (strategyId: string, action: string) => {
    if (!clientId || demoMode) return;

    // Handle strategy actions for admin client
    try {
      // For now, we'll just log the action since we don't have the strategy object here
      console.log(`Strategy action ${action} for ${strategyId} on client ${clientId}`);
    } catch (error) {
      console.error(`Failed to handle admin strategy action ${strategyId}:`, error);
    }
  };

  return (
    <TaxCalculator 
      initialData={initialData} 
      onTaxInfoUpdate={onTaxInfoUpdate}
      onStrategiesSelect={handleStrategiesSelect}
      onStrategyAction={handleStrategyAction}
      clientId={clientId}
    />
  );
};

// Client Card Component
interface ClientCardProps {
  client: ClientProfile;
  onClientSelect: (client: ClientProfile) => void;
  onArchiveClient: () => void;
  onDeleteClient: () => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  affiliates: AffiliateUser[];
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onClientSelect,
  onArchiveClient,
  onDeleteClient,
  openDropdownId,
  setOpenDropdownId,
  affiliates
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Extract tax data from client
  const taxData = client as any;
  const personalYears = taxData.years || [];
  const businesses = taxData.businesses || [];
  
  const getCreatedByBadge = (affiliateId?: string) => {
    if (!affiliateId) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>;
    const affiliate = affiliates.find(a => a.id === affiliateId);
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{affiliate?.full_name || 'Unknown Affiliate'}</span>;
  };

  const getBusinessCountChip = () => {
    const count = businesses.length;
    if (count === 0) return null;
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Briefcase className="w-3 h-3 mr-1" />
        {count} {count === 1 ? 'Business' : 'Businesses'}
      </span>
    );
  };

  const getYearChips = () => {
    if (personalYears.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {personalYears.map((year: any, index: number) => (
          <span 
            key={index}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 cursor-pointer hover:bg-indigo-200 transition-colors"
            onClick={() => onClientSelect(client)}
          >
            <Calendar className="w-3 h-3 mr-1" />
            {year.year || year.tax_year || 'Unknown Year'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Client Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{client.full_name}</h3>
              {getCreatedByBadge(client.assigned_affiliate_id)}
              {getBusinessCountChip()}
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <FileCheck className="w-4 h-4 mr-1" />
                  {client.email}
                </span>
                {client.company && (
                  <span className="flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {client.company}
                  </span>
                )}

              </div>
            </div>

            {/* Year Chips */}
            {getYearChips()}
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdownId(openDropdownId === client.id ? null : client.id)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {openDropdownId === client.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setOpenDropdownId(null);
                      onClientSelect(client);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 mr-3" />
                    Edit Client
                  </button>
                  <button
                    onClick={() => {
                      setOpenDropdownId(null);
                      setShowArchiveConfirm(true);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                  >
                    <Archive className="w-4 h-4 mr-3" />
                    Archive Client
                  </button>
                  <button
                    onClick={() => {
                      setOpenDropdownId(null);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete Client
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 mr-1" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-1" />
          )}
          {isExpanded ? 'Collapse Details' : 'View Details'}
        </button>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6 space-y-6">
            {/* Businesses Section */}
            {businesses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Associated Businesses
                </h4>
                <div className="grid gap-3">
                  {businesses.map((business: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{business.business_name || business.name || 'Unnamed Business'}</h5>
                          <p className="text-sm text-gray-600">{business.entity_type || business.type || 'Unknown Type'}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {business.business_address || business.address || 'No address'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tax Calculator Section */}
            {personalYears.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  Tax Calculator Plans
                </h4>
                <div className="space-y-3">
                  {personalYears.map((year: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {year.year || year.tax_year || 'Unknown Year'}
                        </h5>
                        <button
                          onClick={() => onClientSelect(client)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View Calculator
                        </button>
                      </div>
                      
                      {/* Strategy Chips - This would need to be populated from actual strategy data */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Settings className="w-3 h-3 mr-1" />
                          Augusta Rule
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Settings className="w-3 h-3 mr-1" />
                          Cost Segregation
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {businesses.length === 0 && personalYears.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No businesses or tax plans associated with this client yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      <Dialog.Root open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-96 z-50">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <Dialog.Title className="text-lg font-semibold">Archive Client</Dialog.Title>
            </div>
            <Dialog.Description className="text-gray-600 mb-6">
              Are you sure you want to archive {client.full_name}? This action can be undone later.
            </Dialog.Description>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onArchiveClient();
                  setShowArchiveConfirm(false);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Archive
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-96 z-50">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <Dialog.Title className="text-lg font-semibold">Delete Client</Dialog.Title>
            </div>
            <Dialog.Description className="text-gray-600 mb-6">
              Are you sure you want to permanently delete {client.full_name}? This action cannot be undone.
            </Dialog.Description>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteClient();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

const AdminTaxCalculator: React.FC<AdminTaxCalculatorProps> = () => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([
    { id: '1', full_name: 'John Partner', email: 'john@partner.com' },
    { id: '2', full_name: 'Sarah Partner', email: 'sarah@partner.com' }
  ]);
  const [loading, setLoading] = useState(false);

  const { user } = useUser();
  const { demoMode } = useAuthStore();

  useEffect(() => {
    const loadClients = async () => {
      try {
        // Load clients from unified clients table
        let query = supabase
          .from('clients')
          .select('*')
          .eq('archived', false); // Only show non-archived clients

        // Only filter by admin_id if not in demo mode
        if (!demoMode && user?.id) {
          query = query.eq('admin_id', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading unified clients:', error);
          return;
        }

        // Map unified clients data to ClientProfile interface
        const mappedClients: ClientProfile[] = data.map(file => {
          const taxData = file.tax_profile_data || {};
          return {
            id: file.id,
            full_name: taxData.full_name || taxData.fullName || 'Unknown Client',
            email: taxData.email || '',
            phone: taxData.phone || '',
            company: taxData.business_name || taxData.businessName || taxData.company || '',
            annual_income: taxData.household_income || taxData.householdIncome || taxData.annual_income || taxData.annualIncome || 
              (taxData.wages_income || taxData.wagesIncome || 0) + 
              (taxData.passive_income || taxData.passiveIncome || 0) + 
              (taxData.unearned_income || taxData.unearnedIncome || 0) + 
              (taxData.capital_gains || taxData.capitalGains || 0),
            filing_status: taxData.filing_status || taxData.filingStatus || 'single',
            state: taxData.state || '',
            business_owner: taxData.business_owner || taxData.businessOwner || false,
            current_stage: 'active',
            engagement_score: 0,
            at_risk_of_loss: false,
            created_at: file.created_at,
            updated_at: file.updated_at,
            last_calculation_date: file.last_calculation_date,
            projected_savings: file.projected_savings || 0,
            // Map additional fields for detailed tax calculations using both snake_case and camelCase keys
            wages_income: taxData.wages_income || taxData.wagesIncome,
            passive_income: taxData.passive_income || taxData.passiveIncome,
            unearned_income: taxData.unearned_income || taxData.unearnedIncome,
            capital_gains: taxData.capital_gains || taxData.capitalGains,
            ordinary_k1_income: taxData.ordinary_k1_income || taxData.ordinaryK1Income,
            guaranteed_k1_income: taxData.guaranteed_k1_income || taxData.guaranteedK1Income,
            custom_deduction: taxData.custom_deduction || taxData.customDeduction,
            standard_deduction: taxData.standard_deduction !== undefined ? taxData.standard_deduction : taxData.standardDeduction,
            dependents: taxData.dependents,
            home_address: taxData.home_address || taxData.homeAddress,
            business_name: taxData.business_name || taxData.businessName,
            entity_type: taxData.entity_type || taxData.entityType,
            business_address: taxData.business_address || taxData.businessAddress,
            deduction_limit_reached: taxData.deduction_limit_reached || taxData.deductionLimitReached,
            household_income: taxData.household_income || taxData.householdIncome,
            // Include years and businesses for accordion display
            years: taxData.years || taxData.personal_years || [],
            businesses: taxData.businesses || []
          };
        });

        console.log('Loaded clients:', mappedClients);
        setClients(mappedClients);
      } catch (error) {
        console.error('Error in loadClients:', error);
      }
    };

    loadClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (client.company?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.current_stage === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
      wagesIncome: client.wages_income ?? 0,
      passiveIncome: client.passive_income ?? 0,
      unearnedIncome: client.unearned_income ?? 0,
      capitalGains: client.capital_gains ?? 0,
      businessOwner: client.business_owner,
      businessName: client.business_name || client.company || '',
      entityType: client.entity_type as any || 'LLC',
      businessAddress: client.business_address || '',
      deductionLimitReached: client.deduction_limit_reached || false,
      householdIncome: client.household_income || client.annual_income,
      customDeduction: client.custom_deduction || 0,
      standardDeduction: client.standard_deduction !== undefined ? client.standard_deduction : true,
      ordinaryK1Income: client.ordinary_k1_income || 0,
      guaranteedK1Income: client.guaranteed_k1_income || 0
    };

    return taxInfo;
  };

  function toSnakeCaseTaxInfo(taxInfo: TaxInfo) {
    return {
      full_name: taxInfo.fullName,
      email: taxInfo.email,
      phone: taxInfo.phone,
      filing_status: taxInfo.filingStatus,
      dependents: taxInfo.dependents,
      state: taxInfo.state,
      home_address: taxInfo.homeAddress,
      wages_income: taxInfo.wagesIncome,
      passive_income: taxInfo.passiveIncome,
      unearned_income: taxInfo.unearnedIncome,
      capital_gains: taxInfo.capitalGains,
      business_owner: taxInfo.businessOwner,
      business_name: taxInfo.businessName,
      entity_type: taxInfo.entityType,
      business_address: taxInfo.businessAddress,
      deduction_limit_reached: taxInfo.deductionLimitReached,
      household_income: taxInfo.householdIncome,
      custom_deduction: taxInfo.customDeduction,
      standard_deduction: taxInfo.standardDeduction,
      ordinary_k1_income: taxInfo.ordinaryK1Income,
      guaranteed_k1_income: taxInfo.guaranteedK1Income
    };
  }

  const handleCreateClient = async (clientData: TaxInfo) => {
    try {
      // Create client profile
      const newClientProfile: ClientProfile = {
        id: '',
        full_name: clientData.fullName,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.businessName,
        annual_income: clientData.householdIncome,
        filing_status: clientData.filingStatus,
        state: clientData.state,
        business_owner: clientData.businessOwner,
        current_stage: 'active',
        assigned_affiliate_id: undefined,
        assigned_expert_id: undefined,
        at_risk_of_loss: false,
        engagement_score: 0,
        created_at: '',
        updated_at: '',
        wages_income: clientData.wagesIncome,
        passive_income: clientData.passiveIncome,
        unearned_income: clientData.unearnedIncome,
        capital_gains: clientData.capitalGains,
        ordinary_k1_income: clientData.ordinaryK1Income,
        guaranteed_k1_income: clientData.guaranteedK1Income,
        custom_deduction: clientData.customDeduction,
        standard_deduction: clientData.standardDeduction,
        dependents: clientData.dependents,
        home_address: clientData.homeAddress,
        business_name: clientData.businessName,
        entity_type: clientData.entityType,
        business_address: clientData.businessAddress,
        deduction_limit_reached: clientData.deductionLimitReached,
        household_income: clientData.householdIncome,
        years: [],
        businesses: []
      };

      setClients(prev => [newClientProfile, ...prev]);
      setShowCreateModal(false);
      toast.success('Client created successfully!');
      
    } catch (error) {
      console.error('Error in handleCreateClient:', error);
      toast.error('Failed to create client');
    }
  };

  const handleClientSelect = (client: ClientProfile) => {
    setSelectedClient(client);
  };

  const handleTaxInfoUpdate = async (updatedTaxInfo: TaxInfo) => {
    if (!selectedClient) return;

    try {
      // Update local state
      const updatedClient: ClientProfile = {
        ...selectedClient,
        full_name: updatedTaxInfo.fullName,
        email: updatedTaxInfo.email,
        phone: updatedTaxInfo.phone,
        company: updatedTaxInfo.businessName,
        annual_income: updatedTaxInfo.householdIncome,
        filing_status: updatedTaxInfo.filingStatus,
        state: updatedTaxInfo.state,
        business_owner: updatedTaxInfo.businessOwner,
        wages_income: updatedTaxInfo.wagesIncome,
        passive_income: updatedTaxInfo.passiveIncome,
        unearned_income: updatedTaxInfo.unearnedIncome,
        capital_gains: updatedTaxInfo.capitalGains,
        ordinary_k1_income: updatedTaxInfo.ordinaryK1Income,
        guaranteed_k1_income: updatedTaxInfo.guaranteedK1Income,
        custom_deduction: updatedTaxInfo.customDeduction,
        standard_deduction: updatedTaxInfo.standardDeduction,
        dependents: updatedTaxInfo.dependents,
        home_address: updatedTaxInfo.homeAddress,
        business_name: updatedTaxInfo.businessName,
        entity_type: updatedTaxInfo.entityType,
        business_address: updatedTaxInfo.businessAddress,
        deduction_limit_reached: updatedTaxInfo.deductionLimitReached,
        household_income: updatedTaxInfo.householdIncome,
        updated_at: '',
        years: [],
        businesses: []
      };

      setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));
      setSelectedClient(updatedClient);
      toast.success('Client updated successfully!');
      
    } catch (error) {
      console.error('Error in handleTaxInfoUpdate:', error);
      toast.error('Failed to update client');
    }
  };

  const handleArchiveClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ archived: true })
        .eq('id', clientId);

      if (error) {
        console.error('Error archiving client:', error);
        toast.error('Failed to archive client');
        return;
      }

      setClients(prev => prev.filter(c => c.id !== clientId));
      toast.success('Client archived successfully!');
    } catch (error) {
      console.error('Error in handleArchiveClient:', error);
      toast.error('Failed to archive client');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Error deleting client:', error);
        toast.error('Failed to delete client');
        return;
      }

      setClients(prev => prev.filter(c => c.id !== clientId));
      toast.success('Client deleted successfully!');
    } catch (error) {
      console.error('Error in handleDeleteClient:', error);
      toast.error('Failed to delete client');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as Element).closest('.dropdown-menu')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  if (selectedClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => setSelectedClient(null)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Client Management
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Tax Calculator - {selectedClient.full_name}</h1>
          </div>
          
          <AdminTaxCalculatorWrapper
            initialData={convertClientToTaxInfo(selectedClient)}
            onTaxInfoUpdate={handleTaxInfoUpdate}
            clientId={selectedClient.id}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Management</h1>
          <p className="text-gray-600">Manage your clients and their tax planning strategies</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search clients by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Clients</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="implementation_active">Implementation Active</option>
                <option value="proposal_created">Proposal Created</option>
              </select>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Client
              </button>
            </div>
          </div>
        </div>

        {/* Client Cards */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first client.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Client
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClientSelect={handleClientSelect}
                onArchiveClient={() => handleArchiveClient(client.id)}
                onDeleteClient={() => handleDeleteClient(client.id)}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                affiliates={affiliates}
              />
            ))}
          </div>
        )}

        {/* Create Client Modal */}
        {showCreateModal && (
          <CreateClientModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onClientCreated={handleCreateClient}
          />
        )}
      </div>
    </div>
  );
};

export default AdminTaxCalculator;