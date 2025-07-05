import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  UserPlus,
  ArrowRight,
  Settings,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useUser } from '../../../../context/UserContext';
import CreateBusinessModal from './CreateBusinessModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

// Types
interface TaxPlanningClient {
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
  created_at: string;
  updated_at: string;
}

interface RDBusiness {
  id: string;
  client_id: string;
  name: string;
  ein: string;
  entity_type: string;
  start_year: number;
  domicile_state: string;
  contact_info: any;
  is_controlled_grp: boolean;
  created_at: string;
  updated_at: string;
  // Progress tracking
  progress?: {
    business_setup: boolean;
    research_explorer: boolean;
    employee_setup: boolean;
    expense_entry: boolean;
    calculation: boolean;
    report_generation: boolean;
  };
  summary?: {
    total_qre: number;
    credit_amount: number;
    last_updated: string;
  };
}

interface ClientWithBusinesses extends TaxPlanningClient {
  rd_businesses: RDBusiness[];
  rd_client_id?: string;
}

const RDTaxCreditDashboard: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientWithBusinesses[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_businesses' | 'without_businesses'>('all');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [showCreateBusinessModal, setShowCreateBusinessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithBusinesses | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<RDBusiness | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'client' | 'business', id: string, name: string } | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      // Load tax planning clients
      const { data: taxClients, error: taxError } = await supabase
        .from('tax_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (taxError) {
        console.error('Error loading tax clients:', taxError);
        return;
      }

      // Map tax clients to R&D clients
      const mappedClients = taxClients.map(taxClient => ({
        ...taxClient,
        rd_client_id: null,
        rd_businesses: []
      }));

      setClients(mappedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async (businessData: any) => {
    try {
      // First, ensure we have a client record (from clients table)
      let clientId = selectedClient?.id;
      if (!clientId) {
        console.error('RDTaxCreditDashboard: Missing clientId for selected client', { selectedClient });
        setShowCreateBusinessModal(false);
        setSelectedClient(null);
        return;
      }
      // Create the business record
      const { data: newBusiness, error: businessError } = await supabase
        .from('rd_businesses')
        .insert({
          client_id: clientId,
          name: businessData.name,
          ein: businessData.ein,
          entity_type: businessData.entityType,
          start_year: businessData.startYear,
          domicile_state: businessData.state,
          contact_info: {
            address: businessData.address,
            city: businessData.city,
            state: businessData.state,
            zip: businessData.zip
          },
          is_controlled_grp: businessData.isControlledGroup || false,
          historical_data: businessData.historicalData || []
        })
        .select()
        .single();
      if (businessError) {
        console.error('Error creating business:', businessError);
        return;
      }

      // Update local state with the new business
      setClients(prevClients => 
        prevClients.map(client => {
          if (client.id === selectedClient?.id) {
            return {
              ...client,
              rd_businesses: [...(client.rd_businesses || []), newBusiness]
            };
          }
          return client;
        })
      );

      setShowCreateBusinessModal(false);
      setSelectedClient(null);
      
    } catch (error) {
      console.error('Error creating business:', error);
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    try {
      const { error } = await supabase
        .from('rd_businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      // Update local state
      setClients(prev => prev.map(c => ({
        ...c,
        rd_businesses: c.rd_businesses.filter(b => b.id !== businessId)
      })));

      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Failed to delete business');
    }
  };

  const toggleClientExpansion = (clientId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedClients(newExpanded);
  };

  const openRDTaxWizard = (business: RDBusiness) => {
    // Navigate to R&D Tax Wizard with business context
    navigate(`/admin/tax-tools/rd-credit/wizard/${business.id}`);
  };

  const getProgressPercentage = (business: RDBusiness) => {
    const progress = business.progress;
    if (!progress) return 0;
    
    const steps = Object.values(progress);
    const completed = steps.filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
  };

  const getStatusIcon = (business: RDBusiness) => {
    const progress = getProgressPercentage(business);
    if (progress === 100) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (progress > 0) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-gray-400" />;
  };

  const openCreateBusinessModal = (client: ClientWithBusinesses) => {
    setSelectedClient(client);
    setShowCreateBusinessModal(true);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'with_businesses' && client.rd_businesses.length > 0) ||
                         (filterStatus === 'without_businesses' && client.rd_businesses.length === 0);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rd-tax-credit-dashboard p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            R&D Tax Credit Management
          </h2>
          <p className="text-gray-600 mt-1">Manage clients and businesses for R&D tax credit calculations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateBusinessModal(true)}
            className="btn-primary-modern flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Business
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Businesses</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.reduce((sum, client) => sum + client.rd_businesses.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.reduce((sum, client) => 
                  sum + client.rd_businesses.filter(b => getProgressPercentage(b) === 100).length, 0
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold text-gray-900">
                ${clients.reduce((sum, client) => 
                  sum + client.rd_businesses.reduce((bSum, business) => 
                    bSum + (business.summary?.credit_amount || 0), 0
                  ), 0
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Clients</option>
              <option value="with_businesses">With Businesses</option>
              <option value="without_businesses">Without Businesses</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredClients.length} of {clients.length} clients
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Client Files</h3>
        </div>
        
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <div key={client.id} className="p-6">
                {/* Client Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleClientExpansion(client.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedClients.has(client.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{client.full_name}</h4>
                      <p className="text-sm text-gray-600">{client.email}</p>
                      {client.company && (
                        <p className="text-sm text-gray-500">{client.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {client.rd_businesses.length} businesses
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openCreateBusinessModal(client)}
                        className="btn-secondary-modern flex items-center text-sm"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Business
                      </button>
                      <button
                        onClick={() => toggleClientExpansion(client.id)}
                        className="btn-secondary-modern flex items-center text-sm"
                      >
                        {expandedClients.has(client.id) ? (
                          <>
                            <ChevronDown className="mr-1 h-3 w-3" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronRight className="mr-1 h-3 w-3" />
                            Show
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Businesses Accordion */}
                {expandedClients.has(client.id) && (
                  <div className="mt-4 ml-9">
                    {client.rd_businesses.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Building className="h-8 w-8 mx-auto mb-2" />
                        <p>No businesses yet</p>
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowCreateBusinessModal(true);
                          }}
                          className="btn-primary-modern text-sm mt-2"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add First Business
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {client.rd_businesses.map((business) => (
                          <div key={business.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {getStatusIcon(business)}
                                <div>
                                  <h5 className="font-medium text-gray-900">{business.name}</h5>
                                  <p className="text-sm text-gray-600">
                                    EIN: {business.ein} • {business.entity_type} • {business.domicile_state}
                                  </p>
                                  {business.summary && (
                                    <p className="text-sm text-green-600 font-medium">
                                      ${business.summary.credit_amount.toLocaleString()} credit
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <div className="text-sm text-gray-600">Progress</div>
                                  <div className="text-sm font-medium">{getProgressPercentage(business)}%</div>
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => openRDTaxWizard(business)}
                                    className="btn-primary-modern text-sm"
                                  >
                                    <Eye className="mr-1 h-3 w-3" />
                                    Open
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteTarget({
                                        type: 'business',
                                        id: business.id,
                                        name: business.name
                                      });
                                      setShowDeleteModal(true);
                                    }}
                                    className="btn-danger-modern text-sm"
                                  >
                                    <Trash2 className="mr-1 h-3 w-3" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateBusinessModal && selectedClient && (
        <CreateBusinessModal
          client={selectedClient}
          onCreate={handleCreateBusiness}
          onClose={() => {
            setShowCreateBusinessModal(false);
            setSelectedClient(null);
          }}
        />
      )}

      {showDeleteModal && deleteTarget && (
        <DeleteConfirmationModal
          target={deleteTarget}
          onConfirm={() => {
            if (deleteTarget.type === 'business') {
              handleDeleteBusiness(deleteTarget.id);
            }
          }}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default RDTaxCreditDashboard; 