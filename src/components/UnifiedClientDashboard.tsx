import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CentralizedClientService, 
  UnifiedClientRecord, 
  ClientTool,
  ToolEnrollment 
} from '../services/centralizedClientService';
import useAuthStore from '../store/authStore';
import { toast } from 'react-hot-toast';
import NewClientModal from './NewClientModal';
import TaxCalculator from './TaxCalculator';
import BusinessAccordion from './BusinessAccordion';
import { TaxInfo } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Archive, 
  ChevronDown, 
  ChevronRight,
  Building,
  Calculator,
  Calendar,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  Briefcase,
  Home,
  Settings,
  RefreshCw
} from 'lucide-react';

interface UnifiedClientDashboardProps {
  toolFilter?: ToolEnrollment['tool_slug'];
  adminId?: string;
  affiliateId?: string;
  onClientSelect?: (client: UnifiedClientRecord) => void;
}

// Client Card Component
interface ClientCardProps {
  client: any;
  onEdit: (client: any) => void;
  onArchive: (clientId: string, archive: boolean) => void;
  onDelete: (clientId: string) => void;
  onExpand: (clientId: string) => void;
  onAddTaxYear: (client: any, year?: number) => void;
  onRefresh: () => void;
  isExpanded: boolean;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onEdit,
  onArchive,
  onDelete,
  onExpand,
  onAddTaxYear,
  onRefresh,
  isExpanded,
  menuOpenId,
  setMenuOpenId
}) => {
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getStatusColor = (status: string, archived: boolean) => {
    if (archived) return 'bg-gray-500 text-white';
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAffiliateBadge = (adminId: string) => {
    // For now, show "Admin" for all clients
    // In the future, this could check against affiliate data
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Admin
      </span>
    );
  };

  const businessCount = client.businesses?.length || 0;
  const personalYearsCount = client.personal_years?.length || 0;
  const currentYear = new Date().getFullYear();

  // Generate available years (current year and next 2 years)
  const getAvailableYears = () => {
    const years = [];
    for (let i = 0; i < 3; i++) {
      years.push(currentYear + i);
    }
    return years;
  };

  // Check if a year already exists for this client
  const yearExists = (year: number) => {
    return client.personal_years?.some((py: any) => py.year === year);
  };

  // Get existing years for this client
  const getExistingYears = () => {
    return client.personal_years?.map((py: any) => py.year) || [];
  };

  const handleAddTaxYear = () => {
    const existingYears = getExistingYears();
    const availableYears = getAvailableYears();
    
    // If no current year exists, use current year
    if (!yearExists(currentYear)) {
      onAddTaxYear(client, currentYear);
      return;
    }
    
    // If current year exists, find the next available year
    const nextAvailableYear = availableYears.find(year => !yearExists(year));
    if (nextAvailableYear) {
      onAddTaxYear(client, nextAvailableYear);
    } else {
      // All years are taken, ask user to select
      onAddTaxYear(client);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
    >
      {/* Client Card Header */}
      <div 
        className="p-6 cursor-pointer"
        onClick={() => onExpand(client.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {client.full_name || 'Unknown Client'}
              </h3>
              {getAffiliateBadge(client.admin_id)}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.tool_status, client.archived)}`}>
                {client.archived ? 'Archived' : client.tool_status || 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {client.email}
              </span>
              {client.business_name && (
                <span className="flex items-center">
                  <Building className="w-4 h-4 mr-1" />
                  {client.business_name}
                </span>
              )}

            </div>

            <div className="flex items-center space-x-3">
              {businessCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {businessCount} Business{businessCount !== 1 ? 'es' : ''}
                </span>
              )}
              {personalYearsCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {personalYearsCount} Tax Year{personalYearsCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === client.id ? null : client.id);
                }}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              
              {/* Dropdown Menu */}
              {menuOpenId === client.id && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(client);
                setMenuOpenId(null);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowArchiveConfirm(true);
                setMenuOpenId(null);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
            >
              <Archive className="w-4 h-4 mr-2" />
              {client.archived ? 'Unarchive' : 'Archive'}
            </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                      setMenuOpenId(null);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand(client.id);
              }}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-gray-100 bg-gray-50"
          >
            <div className="p-6 space-y-6">
              {/* Businesses Section */}
              {client.businesses && client.businesses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Businesses
                  </h4>
                  <BusinessAccordion
                    businesses={client.businesses}
                    clientId={client.id}
                    onRefresh={onRefresh}
                  />
                </div>
              )}

              {/* Tax Calculator Section - Always Show */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Calculator className="w-4 h-4 mr-2" />
                    Tax Calculator Years
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddTaxYear();
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Year
                  </button>
                </div>
                
                {client.personal_years && client.personal_years.length > 0 ? (
                  <div className="grid gap-3">
                    {client.personal_years.map((year: any) => (
                      <div key={year.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {year.year}
                            </span>
                            <span className="text-sm text-gray-600">
                              ${(year.wages_income + year.passive_income + year.unearned_income + year.capital_gains).toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddTaxYear(client, year.year);
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            View Calculator
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-white rounded-lg border border-gray-200">
                    <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No tax years created yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Year" to create your first tax plan</p>
                  </div>
                )}
              </div>

              {/* No Data Message - Only show if no businesses AND no tax years */}
              {(!client.businesses || client.businesses.length === 0) && 
               (!client.personal_years || client.personal_years.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No businesses or tax years found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold">Confirm Action</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {client.archived ? 'unarchive' : 'archive'} this client?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onArchive(client.id, !client.archived);
                  setShowArchiveConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                {client.archived ? 'Unarchive' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this client? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(client.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function UnifiedClientDashboard({
  toolFilter,
  adminId,
  affiliateId,
  onClientSelect
}: UnifiedClientDashboardProps) {
  const { userType, demoMode } = useAuthStore();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientTools, setClientTools] = useState<ClientTool[]>([]);
  const [showTools, setShowTools] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingClientData, setEditingClientData] = useState<TaxInfo | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  
  // Tax Calculator Modal State
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  const [taxCalculatorClient, setTaxCalculatorClient] = useState<any | null>(null);
  const [taxCalculatorYear, setTaxCalculatorYear] = useState<number | null>(null);
  const [showYearSelector, setShowYearSelector] = useState(false);

  // Load clients on component mount and when filters change
  useEffect(() => {
    loadClients();
  }, [toolFilter, adminId, affiliateId]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientList = await CentralizedClientService.getUnifiedClientList({
        toolFilter,
        adminId,
        affiliateId,
      });
      setClients(clientList);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = async (client: any) => {
    setSelectedClient(client);
    setShowTools(true);
    
    // Note: Tool loading is now handled by BusinessAccordion for each business individually
    // This ensures all businesses can be enrolled, not just the first one
    try {
      // Get tools for all businesses combined (for display purposes)
      const allBusinessTools: any[] = [];
      if (client.businesses && client.businesses.length > 0) {
        for (const business of client.businesses) {
          const businessTools = await CentralizedClientService.getClientTools(client.id, business.id);
          allBusinessTools.push(...businessTools);
        }
      }
      setClientTools(allBusinessTools);
    } catch (error) {
      console.error('Error loading client tools:', error);
      toast.error('Failed to load client tools');
    }

    onClientSelect?.(client);
  };

  const handleToolLaunch = (toolSlug: ToolEnrollment['tool_slug'], businessId?: string) => {
    console.log('🚀 handleToolLaunch called with toolSlug:', toolSlug, 'businessId:', businessId);
    console.log('🚀 selectedClient:', selectedClient);
    
    if (!selectedClient) {
      console.log('❌ No selected client, returning');
      return;
    }

    // Use provided businessId or fall back to first business (for backward compatibility)
    const targetBusinessId = businessId || selectedClient.business_id;
    
    if (!targetBusinessId) {
      toast.error('No business selected for tool launch');
      return;
    }

    const launchUrl = CentralizedClientService.getToolLaunchUrl(
      toolSlug,
      selectedClient.id,
      targetBusinessId
    );

    console.log('🚀 Launch URL:', launchUrl);

    // For demo mode, just show a toast
    if (demoMode) {
      console.log('🚀 Demo mode, showing toast');
      toast.success(`Would launch ${CentralizedClientService.getToolDisplayName(toolSlug)}`);
      return;
    }

    // Open in new tab
    console.log('🚀 Opening in new tab:', launchUrl);
    window.open(launchUrl, '_blank');
  };

  const handleArchiveClient = async (clientId: string, archive: boolean) => {
    try {
      await CentralizedClientService.archiveClient(clientId, archive);
      await loadClients();
      toast.success(`Client ${archive ? 'archived' : 'unarchived'} successfully`);
    } catch (error) {
      console.error('Error archiving client:', error);
      toast.error('Failed to archive client');
    }
  };

  const handleEnrollInTool = async (toolSlug: ToolEnrollment['tool_slug'], businessId?: string) => {
    if (!selectedClient) return;

    // Use provided businessId or fall back to first business (for backward compatibility)
    const targetBusinessId = businessId || selectedClient.business_id;
    
    if (!targetBusinessId) {
      toast.error('No business selected for enrollment');
      return;
    }

    try {
      console.log('[UnifiedClientDashboard] Enrolling client in tool:', toolSlug, selectedClient.id, targetBusinessId);
      await CentralizedClientService.enrollClientInTool(
        selectedClient.id,
        targetBusinessId,
        toolSlug
      );
      console.log('[UnifiedClientDashboard] enrollClientInTool returned for tool:', toolSlug);
      toast.success(`Enrolled in ${CentralizedClientService.getToolDisplayName(toolSlug)}`);
      
      // Reload all client tools (for all businesses)
      const allBusinessTools: any[] = [];
      if (selectedClient.businesses && selectedClient.businesses.length > 0) {
        for (const business of selectedClient.businesses) {
          const businessTools = await CentralizedClientService.getClientTools(selectedClient.id, business.id);
          allBusinessTools.push(...businessTools);
        }
      }
      setClientTools(allBusinessTools);
    } catch (error) {
      console.error('Error enrolling in tool:', error);
      toast.error('Failed to enroll in tool');
    }
  };

  const handleCreateClient = async (taxInfo: TaxInfo) => {
    try {
      setAddingClient(true);
      const createClientData = CentralizedClientService.transformTaxInfoToCreateData(taxInfo);
      const result = await CentralizedClientService.createClient(createClientData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create client');
      }
      
      await loadClients();
      setShowAddClientModal(false);
      toast.success('Client created successfully');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    } finally {
      setAddingClient(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await CentralizedClientService.deleteClient(clientId);
      await loadClients();
      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const handleEditClient = async (client: any) => {
    console.log('[handleEditClient] Raw client data:', client);
    console.log('[handleEditClient] Client personal_years:', client.personal_years);
    console.log('[handleEditClient] Client businesses:', client.businesses);
    
    // Transform client data to TaxInfo format for NewClientModal
    const transformedClient: TaxInfo = {
      id: client.id,
      fullName: client.full_name || '',
      email: client.email || '',
      phone: client.phone || '',
      homeAddress: client.home_address || '',
      city: client.city || '',
      state: client.state || '',
      zipCode: client.zip_code || '',
      filingStatus: client.filing_status || 'single',
      dependents: client.dependents || 0,
      standardDeduction: client.standard_deduction !== undefined ? client.standard_deduction : true,
      businessOwner: client.businesses && client.businesses.length > 0,
      wagesIncome: 0, // Will be calculated from personal_years
      passiveIncome: 0, // Will be calculated from business K-1 income
      unearnedIncome: 0,
      capitalGains: 0,
      customDeduction: client.custom_deduction || 0,
      years: client.personal_years ? client.personal_years.map((py: any) => ({
        year: py.year,
        wagesIncome: py.wages_income || 0,
        passiveIncome: py.passive_income || 0,
        unearnedIncome: py.unearned_income || 0,
        capitalGains: py.capital_gains || 0,
        longTermCapitalGains: py.long_term_capital_gains || 0,
        householdIncome: py.household_income || 0,
        ordinaryIncome: 0,
        isActive: py.is_active !== undefined ? py.is_active : true
      })) : [],
      businesses: client.businesses ? client.businesses.map((business: any) => ({
        id: business.id,
        businessName: business.business_name || '',
        entityType: business.entity_type === 'llc' ? 'LLC' :
                    business.entity_type === 's_corp' ? 'S-Corp' :
                    business.entity_type === 'corporation' ? 'C-Corp' :
                    business.entity_type === 'partnership' ? 'Partnership' :
                    business.entity_type === 'sole_proprietorship' ? 'Sole-Proprietor' : 'LLC',
        ein: business.ein || '',
        startYear: business.year_established || new Date().getFullYear(),
        businessAddress: business.business_address || '',
        businessCity: business.business_city || '',
        businessState: business.business_state || '',
        businessZip: business.business_zip || '',
        businessPhone: business.business_phone || '',
        businessEmail: business.business_email || '',
        industry: business.industry || '',
        annualRevenue: business.annual_revenue || 0,
        employeeCount: business.employee_count || 0,
        ordinaryK1Income: 0, // Will be calculated from business_years
        guaranteedK1Income: 0, // Will be calculated from business_years
        isActive: business.is_active !== undefined ? business.is_active : true,
        years: business.business_years ? business.business_years.map((by: any) => ({
          year: by.year,
          ordinaryK1Income: by.ordinary_k1_income || 0,
          guaranteedK1Income: by.guaranteed_k1_income || 0,
          annualRevenue: by.annual_revenue || 0,
          employeeCount: by.employee_count || 0,
          isActive: by.is_active !== undefined ? by.is_active : true
        })) : []
      })) : [],
      createdAt: client.created_at || new Date().toISOString(),
      updatedAt: client.updated_at || new Date().toISOString()
    };

    console.log('[handleEditClient] Transformed client data:', transformedClient);
    console.log('[handleEditClient] Transformed years:', transformedClient.years);
    console.log('[handleEditClient] Transformed businesses:', transformedClient.businesses);
    setEditingClientData(transformedClient);
    setEditClientId(client.id);
    setEditModalOpen(true);
  };

  const handleExpandClient = (clientId: string) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  // Convert client data to TaxInfo format for TaxCalculator
  const convertClientToTaxInfo = (client: any): TaxInfo => {
    // Get the most recent personal year data for income information
    const latestPersonalYear = client.personal_years?.[0];
    
    return {
      fullName: client.full_name || 'Unknown Client',
      email: client.email || '',
      phone: client.phone || '',
      filingStatus: client.filing_status || 'single',
      dependents: client.dependents || 0,
      state: client.state || 'CA',
      homeAddress: client.home_address || '',
      wagesIncome: latestPersonalYear?.wages_income || 0,
      passiveIncome: latestPersonalYear?.passive_income || 0,
      unearnedIncome: latestPersonalYear?.unearned_income || 0,
      capitalGains: latestPersonalYear?.capital_gains || 0,
      businessOwner: client.businesses && client.businesses.length > 0,
      businessName: client.businesses?.[0]?.business_name || '',
      entityType: client.businesses?.[0]?.entity_type || 'LLC',
      businessAddress: client.businesses?.[0]?.business_address || '',
      deductionLimitReached: false, // Default value
      householdIncome: latestPersonalYear?.household_income || 0,
      customDeduction: client.custom_deduction || 0,
      standardDeduction: client.standard_deduction !== undefined ? client.standard_deduction : true,
      ordinaryK1Income: client.businesses?.[0]?.business_years?.[0]?.ordinary_k1_income || 0,
      guaranteedK1Income: client.businesses?.[0]?.business_years?.[0]?.guaranteed_k1_income || 0
    };
  };

  // Handle adding a new tax year
  const handleAddTaxYear = (client: any, year?: number) => {
    setTaxCalculatorClient(client);
    
    if (year) {
      // If year is specified, open tax calculator directly
      setTaxCalculatorYear(year);
      setShowTaxCalculator(true);
      setShowYearSelector(false);
    } else {
      // If no year specified, show year selector
      setShowYearSelector(true);
      setTaxCalculatorYear(null);
    }
  };

  // Handle year selection
  const handleYearSelect = (year: number) => {
    setTaxCalculatorYear(year);
    setShowYearSelector(false);
    setShowTaxCalculator(true);
  };

  // Handle tax info update from calculator
  const handleTaxInfoUpdate = async (updatedTaxInfo: TaxInfo) => {
    if (!taxCalculatorClient || !taxCalculatorYear) return;

    try {
      // Update client basic information
      const clientUpdates = {
        full_name: updatedTaxInfo.fullName,
        email: updatedTaxInfo.email,
        phone: updatedTaxInfo.phone,
        filing_status: updatedTaxInfo.filingStatus,
        dependents: updatedTaxInfo.dependents,
        home_address: updatedTaxInfo.homeAddress,
        state: updatedTaxInfo.state,
        standard_deduction: updatedTaxInfo.standardDeduction,
        custom_deduction: updatedTaxInfo.customDeduction
      };

      // Update client basic info
      const clientUpdateSuccess = await CentralizedClientService.updateClient(
        taxCalculatorClient.id, 
        clientUpdates
      );

      if (!clientUpdateSuccess) {
        throw new Error('Failed to update client information');
      }

      // Check if personal year already exists for this year
      const existingYear = taxCalculatorClient.personal_years?.find(
        (py: any) => py.year === taxCalculatorYear
      );

      const yearData = {
        year: taxCalculatorYear,
        wages_income: updatedTaxInfo.wagesIncome,
        passive_income: updatedTaxInfo.passiveIncome,
        unearned_income: updatedTaxInfo.unearnedIncome,
        capital_gains: updatedTaxInfo.capitalGains,
        household_income: updatedTaxInfo.householdIncome,
        is_active: true
      };

      let yearUpdateSuccess = false;

      if (existingYear) {
        // Update existing personal year
        yearUpdateSuccess = await CentralizedClientService.updatePersonalYear(
          existingYear.id,
          yearData
        );
      } else {
        // Create new personal year
        const result = await CentralizedClientService.createPersonalYear(
          taxCalculatorClient.id,
          yearData
        );
        yearUpdateSuccess = result.success;
      }

      if (!yearUpdateSuccess) {
        throw new Error('Failed to update tax year information');
      }

      // Reload clients to get updated data
      await loadClients();

      toast.success(`Tax information updated for ${taxCalculatorYear}`);
      setShowTaxCalculator(false);
      setTaxCalculatorClient(null);
      setTaxCalculatorYear(null);
    } catch (error) {
      console.error('Error updating tax info:', error);
      toast.error('Failed to update tax information');
    }
  };

  // Generate available years for year selector
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 3; i++) {
      years.push(currentYear + i);
    }
    return years;
  };

  // Check if a year already exists for a client
  const yearExists = (client: any, year: number) => {
    return client.personal_years?.some((py: any) => py.year === year);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || client.tool_status === statusFilter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    const nameA = (a.full_name || '').toLowerCase();
    const nameB = (b.full_name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your clients and their tax planning strategies
              </p>
            </div>
            <button
              onClick={() => setShowAddClientModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEditClient}
              onArchive={handleArchiveClient}
              onDelete={handleDeleteClient}
              onExpand={handleExpandClient}
              onAddTaxYear={handleAddTaxYear}
              onRefresh={() => {
                // Refresh the client data when tools are enrolled
                loadClients();
              }}
              isExpanded={expandedClientId === client.id}
              menuOpenId={menuOpenId}
              setMenuOpenId={setMenuOpenId}
            />
          ))}
        </div>

        {filteredClients.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first client.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowAddClientModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Your First Client
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <NewClientModal
          isOpen={showAddClientModal}
          onClose={() => setShowAddClientModal(false)}
          onClientCreated={handleCreateClient}
          loading={addingClient}
        />
      )}

      {/* Edit Client Modal */}
      {editModalOpen && editingClientData && (
        <NewClientModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingClientData(null);
            setEditClientId(null);
          }}
          onClientCreated={handleCreateClient}
          loading={addingClient}
          initialData={editingClientData}
        />
      )}

      {/* Year Selector Modal */}
      {showYearSelector && taxCalculatorClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <Calendar className="w-6 h-6 text-indigo-500 mr-2" />
              <h3 className="text-lg font-semibold">Select Tax Year</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Choose which tax year you'd like to create a plan for:
            </p>
            <div className="space-y-2">
              {getAvailableYears().map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  disabled={yearExists(taxCalculatorClient, year)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    yearExists(taxCalculatorClient, year)
                      ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 hover:bg-gray-50 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{year}</span>
                    {yearExists(taxCalculatorClient, year) && (
                      <span className="text-xs text-gray-500">Already exists</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowYearSelector(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Calculator Modal */}
      {showTaxCalculator && taxCalculatorClient && taxCalculatorYear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[90vh] m-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center">
                <Calculator className="w-6 h-6 text-indigo-500 mr-2" />
                <h3 className="text-lg font-semibold">
                  Tax Calculator - {taxCalculatorClient.full_name} ({taxCalculatorYear})
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowTaxCalculator(false);
                  setTaxCalculatorClient(null);
                  setTaxCalculatorYear(null);
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="h-full overflow-auto">
              <TaxCalculator
                initialData={convertClientToTaxInfo(taxCalculatorClient)}
                onTaxInfoUpdate={handleTaxInfoUpdate}
                clientId={taxCalculatorClient.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 