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
  DollarSign,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  Briefcase,
  Home,
  Settings,
  RefreshCw,
  ExternalLink,
  Zap
} from 'lucide-react';
import RDTaxWizard from '../modules/tax-calculator/components/RDTaxWizard/RDTaxWizard';

interface RDClientManagementProps {
  onClientSelect?: (client: UnifiedClientRecord) => void;
}

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
                <span className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  ${client.total_income?.toLocaleString() || '0'}
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
              {/* R&D Enrollments Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  R&D Tax Credit Enrollments
                </h4>
                {rdEnrollments.length > 0 ? (
                  <div className="space-y-3">
                    {rdEnrollments.map((enrollment: any, index: number) => {
                      const business = client.businesses?.find((b: any) => 
                        b.tool_enrollments?.some((t: any) => t.id === enrollment.id)
                      );
                      
                      return (
                        <div key={enrollment.id} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Calculator className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">
                                  {business?.business_name || 'Unknown Business'}
                                </h5>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(enrollment.status, false)}`}>
                                    {enrollment.status}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                console.log('🔘 Launch Wizard button clicked for client:', client.id, 'business:', business?.id);
                                onLaunchWizard(client.id, business?.id || '');
                              }}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Launch Wizard
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-white rounded-lg border border-gray-200">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No R&D enrollments found</p>
                    <p className="text-xs text-gray-400 mt-1">Enroll in R&D Tax Credit Wizard from Unified Client Management</p>
                  </div>
                )}
              </div>

              {/* Business Summary */}
              {client.businesses && client.businesses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Businesses
                  </h4>
                  <div className="space-y-2">
                    {client.businesses.map((business: any) => (
                      <div key={business.id} className="bg-white rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">{business.business_name}</h5>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {business.entity_type || 'LLC'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {business.business_years?.length || 0} year{business.business_years?.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              ${business.annual_revenue?.toLocaleString() || '0'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {business.employee_count || 0} employees
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Load clients on component mount
  useEffect(() => {
    console.log('🔄 RDClientManagement useEffect triggered');
    loadClients();
  }, []);

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
      
      // Get all clients from unified system
      const allClients = await CentralizedClientService.getUnifiedClientList({});
      console.log('📊 All clients loaded:', allClients.length);
      
      if (allClients.length > 0) {
        console.log('📋 Sample client structure:', {
          id: allClients[0].id,
          name: allClients[0].full_name,
          businesses: allClients[0].businesses?.length || 0,
          tool_enrollments: allClients[0].tool_enrollments?.length || 0
        });
        
        // Log business structure for first client
        if (allClients[0].businesses?.length > 0) {
          console.log('🏢 First business structure:', {
            id: allClients[0].businesses[0].id,
            name: allClients[0].businesses[0].business_name,
            tool_enrollments: allClients[0].businesses[0].tool_enrollments?.length || 0
          });
          
          if (allClients[0].businesses[0].tool_enrollments?.length > 0) {
            console.log('🔧 Tool enrollments:', allClients[0].businesses[0].tool_enrollments);
          }
        }
      }
      
      // Filter to only show clients with R&D enrollments
      const rdClients = allClients.filter(client => {
        const hasRdEnrollment = client.businesses?.some((business: any) => 
          business.tool_enrollments?.some((tool: any) => tool.tool_slug === 'rd')
        );
        console.log(`👤 Client ${client.full_name} has R&D enrollment:`, hasRdEnrollment);
        if (hasRdEnrollment) {
          console.log('🎯 R&D enrollments for client:', client.businesses?.flatMap((b: any) => 
            b.tool_enrollments?.filter((t: any) => t.tool_slug === 'rd') || []
          ));
        }
        return hasRdEnrollment;
      });
      
      console.log('🎯 R&D clients filtered:', rdClients.length);
      
      // TEMPORARY: Show all clients for debugging
      if (rdClients.length === 0) {
        console.log('⚠️ No R&D clients found, showing all clients for debugging');
        setClients(allClients);
      } else {
        console.log('✅ Setting R&D clients:', rdClients.length);
        setClients(rdClients);
      }
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

  const handleLaunchWizard = (clientId: string, businessId: string) => {
    console.log('[RDClientManagement] Launch Wizard called for client:', clientId, 'business:', businessId);
    // Open R&D wizard modal
    setSelectedBusinessId(businessId);
    setShowRDTaxWizard(true);
    console.log('[RDClientManagement] R&D wizard modal opened');
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
          <p className="text-gray-600">Loading R&D clients...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">R&D Tax Credit Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage clients enrolled in R&D Tax Credit Wizard
                {clients.length > 0 && clients[0]?.tool_enrollments?.length === 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Debug Mode - Showing All Clients
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadClients}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              {clients.length > 0 && clients[0]?.tool_enrollments?.length === 0 && (
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
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              onExpand={handleExpandClient}
              onLaunchWizard={handleLaunchWizard}
              isExpanded={expandedClientId === client.id}
              menuOpenId={menuOpenId}
              setMenuOpenId={setMenuOpenId}
            />
          ))}
        </div>

        {filteredClients.length === 0 && !loading && (
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