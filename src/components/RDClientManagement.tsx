import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CentralizedClientService, 
  UnifiedClientRecord, 
  ClientTool,
  ToolEnrollment 
} from '../services/centralizedClientService';
import useAuthStore from '../store/authStore';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
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
  ExternalLink,
  Settings,
  Loader,
  Database,
  RefreshCw,
  Zap
} from 'lucide-react';
import { ClientDetailModal } from './ClientDetailModal';
import { UnifiedClientDashboard } from './UnifiedClientDashboard';
import { 
  RDTaxWizardBusiness,
  ResearchDesignService
} from '../modules/tax-calculator/services/researchDesignService';
import { BusinessService } from '../services/businessService';
import { formatCurrency } from '../utils/formatting';
import { useNavigationSidebar } from '../hooks/useNavigationSidebar';
import ModularResearchActivityManager from './research-activity-manager/ModularResearchActivityManager';
import RDTaxWizard from '../modules/tax-calculator/components/RDTaxWizard/RDTaxWizard';
import ClientProgressIndicator from './common/ClientProgressIndicator';

interface RDClientManagementProps {
  onClientSelect?: (client: UnifiedClientRecord) => void;
}

// Tab types
type TabType = 'clients' | 'activities';

// Business Accordion Component
interface BusinessAccordionProps {
  business: any;
  clientId: string;
  onLaunchWizard: (clientId: string, businessId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const BusinessAccordion: React.FC<BusinessAccordionProps> = ({
  business,
  clientId,
  onLaunchWizard,
  isExpanded,
  onToggle
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Business Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {business.business_name || 'Unknown Business'}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {business.entity_type || 'LLC'}
              </span>
              {business.ein && (
                <span className="text-xs text-gray-500">
                  EIN: {business.ein}
                </span>
              )}
              {business.business_years?.length > 0 && (
                <span className="text-xs text-gray-500">
                  {business.business_years.length} year{business.business_years.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              ${business.annual_revenue?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-gray-500">
              {business.employee_count || 0} employees
            </div>
          </div>
          
          {/* Single Open Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔘 Launch R&D Wizard for business:', business.id, 'client:', clientId);
              onLaunchWizard(clientId, business.id);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open R&D Wizard
          </button>
        </div>
      </div>
      
      {/* Progress Cards - Full Width Row Below */}
      <div className="px-4 pb-4">
        <ClientProgressIndicator 
          businessId={business.id}
          className="w-full"
          showYearLabels={true}
          maxYears={4}
        />
      </div>
    </div>
  );
};

// Client Card Component
interface ClientCardProps {
  client: any;
  onExpand: (clientId: string) => void;
  onLaunchWizard: (clientId: string, businessId: string) => void;
  isExpanded: boolean;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onExpand,
  onLaunchWizard,
  isExpanded,
  menuOpenId,
  setMenuOpenId
}) => {
  const [expandedBusinessId, setExpandedBusinessId] = useState<string | null>(null);
  
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

  const businessCount = client.businesses?.length || 0;
  const rdEnrollments = client.businesses?.flatMap((business: any) => 
    business.tool_enrollments?.filter((tool: any) => tool.tool_slug === 'rd') || []
  ) || [];

  const handleBusinessToggle = (businessId: string) => {
    setExpandedBusinessId(expandedBusinessId === businessId ? null : businessId);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Client Header */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {client.full_name}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.tool_status, client.archived)}`}>
                  {client.archived ? 'Archived' : client.tool_status || 'inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">{client.email}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center">
                  <Building className="w-4 h-4 mr-1" />
                  {businessCount} business{businessCount !== 1 ? 'es' : ''}
                </span>
                <span className="flex items-center">
                  <Zap className="w-4 h-4 mr-1" />
                  {rdEnrollments.length} R&D enrollment{rdEnrollments.length !== 1 ? 's' : ''}
                </span>

              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExpand(client.id)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
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
              {/* Businesses Accordion */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Businesses
                </h4>
                {client.businesses && client.businesses.length > 0 ? (
                  <div className="space-y-3">
                    {client.businesses.map((business: any) => {
                      const businessRdEnrollments = business.tool_enrollments?.filter((tool: any) => tool.tool_slug === 'rd') || [];
                      
                      // Show all businesses, not just those with R&D enrollments
                      return (
                        <BusinessAccordion
                          key={business.id}
                          business={business}
                          clientId={client.id}
                          onLaunchWizard={onLaunchWizard}
                          isExpanded={expandedBusinessId === business.id}
                          onToggle={() => handleBusinessToggle(business.id)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-white rounded-lg border border-gray-200">
                    <Building className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No businesses found</p>
                    <p className="text-xs text-gray-400 mt-1">Add businesses to enroll in R&D Tax Credit Wizard</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function RDClientManagement({
  onClientSelect
}: RDClientManagementProps) {
  console.log('🎯 RDClientManagement component rendered');
  
  const { userType, demoMode } = useAuthStore();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [showRDTaxWizard, setShowRDTaxWizard] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedBusinessForActivities, setSelectedBusinessForActivities] = useState<string | null>(null);

  // Default to Global mode (no auto-selection of business)
  useEffect(() => {
    if (selectedBusinessForActivities === null && clients.length > 0) {
      console.log('🌍 Defaulting to Global Research Activities mode');
      // Stay in global mode - don't auto-select a business
    }
  }, [clients, selectedBusinessForActivities]);

  // Load clients on component mount
  useEffect(() => {
    console.log('🔄 RDClientManagement useEffect triggered');
    if (activeTab === 'clients') {
      loadClients();
    }
  }, [activeTab]);

  // Handle URL parameters for launching R&D wizard
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const businessId = searchParams.get('businessId');
    
    if (clientId && businessId) {
      console.log('🎯 URL parameters detected:', { clientId, businessId });
      setSelectedBusinessId(businessId);
      setShowRDTaxWizard(true);
      
      // Clear URL parameters
      navigate('/admin/rd-clients', { replace: true });
    }
  }, [searchParams, navigate]);

  const loadClients = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting to load clients...');
      
      // Get only clients enrolled in R&D tools
      const allClients = await CentralizedClientService.getUnifiedClientList({
        toolFilter: 'rd'
      });
      console.log('📊 R&D clients loaded:', allClients.length);
      
      // Enhance clients with R&D business years data
      const enhancedClients = await Promise.all(
        allClients.map(async (client) => {
          if (!client.businesses || client.businesses.length === 0) {
            return client;
          }

          // For each business, fetch R&D business years
          const enhancedBusinesses = await Promise.all(
            client.businesses.map(async (business: any) => {
              try {
                // FIXED: Query rd_businesses by client_id instead of business.id
                // This prevents 406 errors from trying to fetch non-existent records
                const { data: rdBusinesses, error: rdError } = await supabase
                  .from('rd_businesses')
                  .select(`
                    id,
                    name,
                    start_year,
                    contact_info,
                    rd_business_years (
                      id,
                      year,
                      total_qre,
                      gross_receipts,
                      created_at,
                      updated_at
                    )
                  `)
                  .eq('client_id', client.id);

                // Find rd_business for this specific business (if any)
                const rdBusiness = rdBusinesses?.find(rd => 
                  rd.name === business.business_name || 
                  rdBusinesses.length === 1 // If only one R&D business for this client
                );

                if (rdError) {
                  console.warn(`RLS policy may be blocking access to rd_businesses for client ${client.id}:`, rdError);
                  return {
                    ...business,
                    business_years: business.business_years || []
                  };
                }

                if (!rdBusiness) {
                  // No R&D data for this business
                  return {
                    ...business,
                    business_years: business.business_years || []
                  };
                }

                // Merge R&D business years with regular business years
                const rdBusinessYears = rdBusiness.rd_business_years || [];
                const existingYears = business.business_years || [];

                // Combine and deduplicate by year
                const allYears = [...rdBusinessYears];
                existingYears.forEach((existingYear: any) => {
                  if (!rdBusinessYears.find(rdYear => rdYear.year === existingYear.year)) {
                    allYears.push(existingYear);
                  }
                });

                return {
                  ...business,
                  rd_business_id: rdBusiness.id,
                  business_years: allYears.sort((a, b) => b.year - a.year) // Sort newest first
                };
              } catch (error) {
                console.error(`Error fetching R&D data for business ${business.id}:`, error);
                return {
                  ...business,
                  business_years: business.business_years || []
                };
              }
            })
          );

          return {
            ...client,
            businesses: enhancedBusinesses
          };
        })
      );
      
      console.log('📊 Enhanced clients with R&D data');
      
      if (enhancedClients.length > 0) {
        console.log('📋 Sample enhanced client structure:', {
          id: enhancedClients[0].id,
          name: enhancedClients[0].full_name,
          businesses: enhancedClients[0].businesses?.length || 0,
          tool_enrollments: enhancedClients[0].tool_enrollments?.length || 0
        });
        
        // Log business structure for first client
        if (enhancedClients[0].businesses?.length > 0) {
          console.log('🏢 First enhanced business structure:', {
            id: enhancedClients[0].businesses[0].id,
            name: enhancedClients[0].businesses[0].business_name,
            business_years: enhancedClients[0].businesses[0].business_years?.length || 0,
            tool_enrollments: enhancedClients[0].businesses[0].tool_enrollments?.length || 0
          });
          
          if (enhancedClients[0].businesses[0].business_years?.length > 0) {
            console.log('📅 Business years:', enhancedClients[0].businesses[0].business_years);
          }
        }
      }
      
      // Set the R&D clients (already filtered by the service)
      console.log('✅ Setting R&D clients:', enhancedClients.length);
      setClients(enhancedClients);
    } catch (error) {
      console.error('❌ Error loading R&D clients:', error);
      toast.error('Failed to load R&D clients');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandClient = (clientId: string) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  const handleLaunchWizard = async (clientId: string, businessId: string) => {
    console.log('[RDClientManagement] Launch Wizard called for client:', clientId, 'business:', businessId);
    
    try {
      // CRITICAL FIX: Find existing R&D businesses by client_id first
      // This prevents creating duplicates when an R&D business already exists
      const { data: existingRdBusinesses, error: searchError } = await supabase
        .from('rd_businesses')
        .select('id, name, client_id')
        .eq('client_id', clientId);

      if (searchError) {
        console.error('[RDClientManagement] Error searching for existing R&D businesses:', searchError);
        toast.error('Error checking existing R&D data');
        return;
      }

      console.log('[RDClientManagement] Found existing R&D businesses for client:', existingRdBusinesses);

      let rdBusinessId: string;

      // Get the centralized business details first
      const client = clients.find(c => c.id === clientId);
      const business = client?.businesses?.find(b => b.id === businessId);
      
      if (!business) {
        console.error('[RDClientManagement] Business not found for ID:', businessId);
        toast.error('Business not found');
        return;
      }

      if (existingRdBusinesses && existingRdBusinesses.length > 0) {
        // FIXED: Find the specific R&D business that matches the selected business
        let matchingRdBusiness = null;
        
        // Try to find R&D business by name match first
        if (business.business_name) {
          matchingRdBusiness = existingRdBusinesses.find(rdBiz => 
            rdBiz.name === business.business_name
          );
        }
        
        // If no name match and only one R&D business exists, use it
        if (!matchingRdBusiness && existingRdBusinesses.length === 1) {
          matchingRdBusiness = existingRdBusinesses[0];
        }
        
        // If multiple R&D businesses and no clear match, let user choose
        if (!matchingRdBusiness && existingRdBusinesses.length > 1) {
          const businessNames = existingRdBusinesses.map(b => b.name).join(', ');
          const confirmed = confirm(
            `Multiple R&D businesses found for this client: ${businessNames}\n\n` +
            `Click OK to use the first one, or Cancel to create a new R&D business profile.`
          );
          
          if (confirmed) {
            matchingRdBusiness = existingRdBusinesses[0];
          }
        }
        
        if (matchingRdBusiness) {
          rdBusinessId = matchingRdBusiness.id;
          console.log('🎯 [RDClientManagement] Using existing R&D business:', matchingRdBusiness.name, 'ID:', rdBusinessId);
        } else {
          // Create new R&D business
          rdBusinessId = businessId;
          console.log('📝 [RDClientManagement] Will create new R&D business for:', business.business_name);
        }
      } else {
        // No existing R&D businesses - create new one
        const confirmed = confirm(
          `No existing R&D data found for this client.\n\n` +
          `Clicking OK will create a new R&D business profile for "${business.business_name || 'this business'}".\n\n` +
          `Cancel if you think R&D data should already exist.`
        );
        
        if (!confirmed) {
          console.log('[RDClientManagement] User cancelled R&D enrollment');
          return;
        }

        // Use the centralized business ID as the R&D business ID
        rdBusinessId = businessId;
        console.log('📝 [RDClientManagement] Will create new R&D business with ID:', rdBusinessId);
      }
      
      // Open R&D wizard modal with the correct business ID
      setSelectedBusinessId(rdBusinessId);
      setShowRDTaxWizard(true);
      console.log('[RDClientManagement] R&D wizard modal opened with business ID:', rdBusinessId);

    } catch (error) {
      console.error('[RDClientManagement] Error in handleLaunchWizard:', error);
      toast.error('Failed to launch R&D wizard');
    }
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'clients':
        return (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search R&D clients..."
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
                    <button
                      onClick={loadClients}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Client List */}
            <div className="bg-white border border-gray-200 rounded-lg">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
                  <p className="text-gray-600">Loading R&D clients...</p>
                </div>
              ) : (
                <div className="grid gap-6 p-6">
                  {filteredClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onExpand={handleExpandClient}
                      onLaunchWizard={handleLaunchWizard}
                      isExpanded={expandedClientId === client.id}
                      menuOpenId={menuOpenId}
                      setMenuOpenId={setMenuOpenId}
                    />
                  ))}

                  {filteredClients.length === 0 && (
                    <div className="text-center py-12">
                      <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No R&D clients found</h3>
                      <p className="text-gray-600 mb-6">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filter criteria.'
                          : 'No clients are currently enrolled in R&D Tax Credit Wizard.'
                        }
                      </p>
                      {!searchTerm && statusFilter === 'all' && (
                        <div className="text-sm text-gray-500">
                          <p>Enroll clients in R&D Tax Credit Wizard from the Unified Client Management dashboard.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="space-y-6">
            {/* Business Selection for Activity Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Activity Management Scope</h3>
                  <p className="text-sm text-gray-600">
                    Choose whether to manage global activities or business-specific activities for IP protection
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Global Activities</h4>
                      <p className="text-sm text-gray-600">
                        Manage activities available to all clients
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBusinessForActivities(null)}
                    className={`mt-3 w-full px-4 py-2 rounded-md transition-colors ${
                      selectedBusinessForActivities === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedBusinessForActivities === null ? 'Currently Selected' : 'Select Global'}
                  </button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Building className="w-8 h-8 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Business-Specific Activities</h4>
                      <p className="text-sm text-gray-600">
                        Manage activities for specific client businesses (IP protection)
                      </p>
                    </div>
                  </div>
                  <select
                    value={selectedBusinessForActivities || ''}
                    onChange={(e) => setSelectedBusinessForActivities(e.target.value || null)}
                    className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">🌍 Global Activities (Organization-wide)</option>
                    <optgroup label="Business-Specific Activities">
                      {clients.flatMap(client => 
                        client.businesses?.map(business => (
                          <option key={business.id} value={business.id}>
                            {business.business_name} ({client.full_name})
                          </option>
                        )) || []
                      )}
                    </optgroup>
                  </select>
                </div>
              </div>
              
              {selectedBusinessForActivities ? (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                      Managing activities for: {
                        clients.flatMap(c => c.businesses || [])
                          .find(b => b.id === selectedBusinessForActivities)?.business_name
                      }
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    Activities created here will only be visible to this specific business for IP protection
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      🌍 Managing Global Research Activities (Organization-wide)
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Activities created here will be available to all businesses in your organization. Perfect for standard research processes and templates.
                  </p>
                </div>
              )}
            </div>

            {/* Research Activity Manager */}
            <ModularResearchActivityManager businessId={selectedBusinessForActivities} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">R&D Tax Credit Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage clients enrolled in R&D Tax Credit Wizard and research activity database
                {clients.length > 0 && clients[0]?.tool_enrollments?.length === 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Debug Mode - Showing All Clients
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === 'clients' && clients.length > 0 && clients[0]?.tool_enrollments?.length === 0 && (
                <button
                  onClick={async () => {
                    const client = clients[0];
                    const business = client.businesses?.[0];
                    if (client && business) {
                      try {
                        console.log('[RDClientManagement] Test enrolling client in R&D:', client.id, business.id);
                        await CentralizedClientService.enrollClientInTool(
                          client.id,
                          business.id,
                          'rd',
                          'Test enrollment'
                        );
                        console.log('[RDClientManagement] enrollClientInTool returned for R&D');
                        toast.success('Client enrolled in R&D Tax Credit Wizard');
                        loadClients();
                      } catch (error) {
                        console.error('Error enrolling client:', error);
                        toast.error('Failed to enroll client');
                      }
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Enroll First Client
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('clients')}
                className={`${
                  activeTab === 'clients'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Users className="w-4 h-4" />
                <span>Client Management</span>
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`${
                  activeTab === 'activities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Database className="w-4 h-4" />
                <span>Research Activities</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>

      {/* R&D Tax Wizard Modal */}
      {showRDTaxWizard && selectedBusinessId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div 
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle"
              style={{
                maxWidth: 'calc(100vw - 2rem)',
                maxHeight: 'calc(100vh - 4rem)',
                width: '95vw',
                height: '95vh'
              }}
            >
              <div className="bg-white h-full flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    R&D Tax Credit Wizard
                  </h3>
                  <button
                    onClick={() => {
                      setShowRDTaxWizard(false);
                      setSelectedBusinessId(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <RDTaxWizard
                    businessId={selectedBusinessId}
                    isModal={false}
                    onClose={() => {
                      setShowRDTaxWizard(false);
                      setSelectedBusinessId(null);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 