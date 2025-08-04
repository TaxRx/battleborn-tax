import React, { useState, useEffect, useMemo } from 'react';
import { authService, AuthUser, Client } from '../services/authService';
import { proposalService } from '../modules/admin/services/proposalService';
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon,
  CogIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import ClientProfileModal from './ClientProfileModal';
import UserManagementModal from './UserManagementModal';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

export default function ClientDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [clientProposals, setClientProposals] = useState<any[]>([]);
  const [clientRDData, setClientRDData] = useState<any>({ historicalData: {}, totalCredits: 0, averageSavings: 0 });
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [selectedYearModal, setSelectedYearModal] = useState<number | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        // Set primary client as default selection
        if (currentUser && currentUser.isClientUser) {
          const primaryClient = authService.getPrimaryClient(currentUser);
          setSelectedClient(primaryClient);
          // Load account data when user is set
          if (currentUser.profile.account_id) {
            loadAccountData(currentUser.profile.account_id);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Load account proposals and R&D data (for all clients in the account)
  const loadAccountData = async (accountId: string) => {
    setProposalsLoading(true);
    try {
      // Fetch all proposals for the account
      const proposalsResponse = await proposalService.getAccountProposals(accountId);
      if (proposalsResponse.success) {
        setClientProposals(proposalsResponse.data || []);
      }

      // Fetch account R&D data
      const rdResponse = await proposalService.getAccountRDData(accountId);
      if (rdResponse.success) {
        setClientRDData(rdResponse.data);
      }
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setProposalsLoading(false);
    }
  };

  // Calculate available years for R&D tracking
  const currentYear = new Date().getFullYear();
  const openYears = useMemo(() => {
    const years = [];
    for (let year = currentYear; year > currentYear - 4; year--) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  // Get QRE composition for a given year from proposals (filtered by selected client if needed)
  const getQREComposition = (year: number) => {
    // Filter proposals by selected client and year if a client is selected
    const yearProposals = clientProposals.filter(p => {
      const matchesYear = p.calculation && p.calculation.year === year;
      const matchesClient = !selectedClient || p.client_id === selectedClient.id;
      return matchesYear && matchesClient;
    });
    
    if (yearProposals.length === 0) {
      return { wages: 0, contractors: 0, supplies: 0 };
    }

    // Aggregate QRE from all proposals for the year
    const totalWages = yearProposals.reduce((sum, p) => 
      sum + (p.calculation?.incomeDistribution?.wagesIncome || 0), 0);
    const totalContractors = yearProposals.reduce((sum, p) => 
      sum + (p.calculation?.incomeDistribution?.passiveIncome || 0), 0);
    const totalSupplies = yearProposals.reduce((sum, p) => 
      sum + (p.calculation?.incomeDistribution?.unearnedIncome || 0), 0);

    return {
      wages: totalWages * 0.6, // Assume 60% qualifies for R&D
      contractors: totalContractors * 0.8, // Assume 80% qualifies
      supplies: totalSupplies * 0.4 // Assume 40% qualifies
    };
  };

  // Update selected client (data is already loaded for the entire account)
  const handleClientSelection = (client: Client) => {
    setSelectedClient(client);
    // No need to reload data since we have all account data
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Removed role helper functions since we no longer use roles

  const getPermissionDescription = (permission: string) => {
    if (permission.includes('full_access')) return 'Full access to all features';
    if (permission.includes('manage_users')) return 'Can invite and manage users';
    if (permission.includes('invite_users')) return 'Can send invitations';
    if (permission.includes('view_financials')) return 'Can view financial data';
    if (permission.includes('edit_financials')) return 'Can edit financial data';
    if (permission.includes('edit_profile')) return 'Can edit client profile';
    if (permission.includes('view_documents')) return 'Can view documents';
    if (permission.includes('upload_documents')) return 'Can upload documents';
    if (permission.includes('view_proposals')) return 'Can view tax proposals';
    if (permission.includes('approve_proposals')) return 'Can approve proposals';
    if (permission.includes('view_profile')) return 'Can view client profile';
    return permission;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">Please log in to access the client dashboard.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">GT</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {authService.getUserDisplayName(user)}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{user.profile.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Type</label>
                  <div className="flex items-center mt-1">
                    {user.isAdmin && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <ShieldCheckIcon className="w-4 h-4 mr-1" />
                        Administrator
                      </span>
                    )}
                    {user.isClientUser && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <UserGroupIcon className="w-4 h-4 mr-1" />
                        Client User
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Client Organizations</label>
                  <p className="text-sm text-gray-900">{user.clients?.length || 0} organizations</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Total Permissions</label>
                  <p className="text-sm text-gray-900">{user.permissions.length} permissions</p>
                </div>
              </div>
            </div>

            {/* Client Organizations */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Organizations</h2>
              
              <div className="space-y-3">
                {user.clients && user.clients.length > 0 ? (
                  user.clients.map((client) => (
                    <div 
                      key={client.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedClient?.id === client.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleClientSelection(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {client.full_name || 'Unknown Business'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {client.filing_status || 'Individual'}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Account Member
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
                    <p className="text-gray-600">No clients are associated with your account yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <div className="space-y-6">
                {/* Client Details */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedClient.full_name || 'Client Details'}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Account Member
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Filing Status</label>
                      <p className="text-sm text-gray-900">{selectedClient.filing_status || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">State</label>
                      <p className="text-sm text-gray-900">{selectedClient.state || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Email</label>
                      <p className="text-sm text-gray-900">{selectedClient.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{selectedClient.phone || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-sm text-gray-900">{selectedClient.home_address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Permissions for this Client */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Permissions</h2>
                  
                  <div className="space-y-2">
                    {user.permissions
                      .filter(p => p.includes(`client:${selectedClient.id}:`))
                      .map((permission, index) => (
                        <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                          <ShieldCheckIcon className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">
                            {getPermissionDescription(permission)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Tax Year Cards - R&D Integration */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Tax Credit Progress</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {openYears.map((year, index) => {
                      const qreComposition = getQREComposition(year);
                      const totalQRE = qreComposition.wages + qreComposition.contractors + qreComposition.supplies;
                      const yearData = clientRDData.historicalData[year];
                      const hasData = totalQRE > 0 || yearData;
                      
                      // Status logic
                      const now = new Date();
                      const julyCutoff = new Date(now.getFullYear() - 4, 6, 1);
                      let status = 'Not Started';
                      if (year < julyCutoff.getFullYear()) {
                        status = 'Closed';
                      } else if (yearData?.paid) {
                        status = 'Complete';
                      } else if (hasData) {
                        status = 'In Progress';
                      }

                      // Credit calculations
                      const totalCredit = yearData?.qre ? yearData.qre * 0.14 : (totalQRE * 0.14);
                      const federalCredit = totalCredit * 0.75;
                      const stateCredit = totalCredit * 0.25;

                      // Color strips
                      const colorStrips = [
                        'from-blue-600 to-purple-600',
                        'from-purple-600 to-indigo-600', 
                        'from-green-600 to-emerald-600',
                        'from-orange-600 to-amber-600'
                      ];

                      // Status color
                      const statusColor = status === 'Closed' ? 'bg-gray-200 text-gray-600' :
                        status === 'Complete' ? 'bg-blue-100 text-blue-700' :
                        status === 'In Progress' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500';

                      return (
                        <div key={year} className="relative overflow-hidden rounded-xl border border-gray-200 shadow-sm p-0">
                          <div 
                            className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${colorStrips[index % colorStrips.length]}`}
                            style={{ borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem' }}
                          />
                          <div className="flex flex-col h-full px-4 pt-3 pb-4">
                            {/* Year and Status */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm text-gray-700">Tax Year</span>
                                  <span className="font-bold text-xl text-blue-900">{year}</span>
                                </div>
                                <span className={`mt-1 inline-block text-xs font-semibold px-3 py-0.5 rounded-full ${statusColor}`}>
                                  {status}
                                </span>
                              </div>
                              <button
                                className="rounded-full bg-gray-100 hover:bg-gray-200 p-1 shadow-sm border border-gray-200"
                                onClick={() => setSelectedYearModal(year)}
                                aria-label="View details"
                              >
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                              </button>
                            </div>

                            {/* Credit Values */}
                            <div className="mb-3">
                              <div className="flex flex-col space-y-1">
                                <span className="text-sm font-bold text-purple-700">Total Credit</span>
                                <span className="text-lg font-extrabold text-gray-900">
                                  {totalCredit > 0 ? `$${Math.round(totalCredit).toLocaleString()}` : 
                                   <span className="text-gray-400">$0</span>}
                                </span>
                                <div className="text-xs space-y-0.5">
                                  <div className="text-green-600 font-semibold">
                                    {federalCredit > 0 ? `$${Math.round(federalCredit).toLocaleString()}` :
                                     <span className="text-gray-400">$0</span>} 
                                    <span className="font-normal">Federal</span>
                                  </div>
                                  <div className="text-blue-400 font-semibold">
                                    {stateCredit > 0 ? `$${Math.round(stateCredit).toLocaleString()}` :
                                     <span className="text-gray-400">$0</span>} 
                                    <span className="font-normal">State</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* QRE Bar */}
                            {hasData && (
                              <div className="flex-1 flex items-end">
                                <div className="w-full h-6 bg-gray-200 rounded-sm overflow-hidden">
                                  {totalQRE > 0 && (
                                    <>
                                      <div 
                                        className="h-full bg-orange-400 float-left"
                                        style={{ width: `${(qreComposition.wages / totalQRE) * 100}%` }}
                                        title={`Wages: $${qreComposition.wages.toLocaleString()}`}
                                      />
                                      <div 
                                        className="h-full bg-purple-400 float-left"
                                        style={{ width: `${(qreComposition.contractors / totalQRE) * 100}%` }}
                                        title={`Contractors: $${qreComposition.contractors.toLocaleString()}`}
                                      />
                                      <div 
                                        className="h-full bg-blue-400 float-left"
                                        style={{ width: `${(qreComposition.supplies / totalQRE) * 100}%` }}
                                        title={`Supplies: $${qreComposition.supplies.toLocaleString()}`}
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Client Proposals Section */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedClient ? `${selectedClient.full_name} Reports` : 'All Account Reports'}
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {(() => {
                        const filteredProposals = selectedClient 
                          ? clientProposals.filter(p => p.client_id === selectedClient.id)
                          : clientProposals;
                        return `${filteredProposals.length} Total`;
                      })()} 
                    </span>
                  </div>
                  
                  {proposalsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (() => {
                    // Filter proposals by selected client if one is selected
                    const filteredProposals = selectedClient 
                      ? clientProposals.filter(p => p.client_id === selectedClient.id)
                      : clientProposals;
                    
                    return filteredProposals.length > 0 ? (
                      <div className="space-y-4">
                        {filteredProposals.slice(0, 5).map((proposal) => (
                          <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {proposal.client_name} - Tax Year {proposal.calculation?.year || 'Unknown'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Created {new Date(proposal.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    proposal.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                    proposal.status === 'implemented' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                  </span>
                                  {proposal.calculation?.savings?.annualSavings && (
                                    <span className="text-sm font-medium text-green-600">
                                      ${proposal.calculation.savings.annualSavings.toLocaleString()} Annual Savings
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                                <EyeIcon className="w-4 h-4" />
                                <span className="text-sm">View</span>
                              </button>
                            </div>
                          </div>
                        ))}
                        {filteredProposals.length > 5 && (
                          <div className="text-center">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              View All {filteredProposals.length} Proposals
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
                        <p className="text-gray-600">
                          {selectedClient 
                            ? `No reports found for ${selectedClient.full_name}.`
                            : 'Your tax reports and proposals will appear here once they\'re created.'}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {authService.hasPermission(user, `client:${selectedClient.id}:view_documents`) && (
                      <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">View Documents</span>
                      </button>
                    )}
                    
                    {authService.hasPermission(user, `client:${selectedClient.id}:upload_documents`) && (
                      <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <PlusIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Upload Documents</span>
                      </button>
                    )}
                    
                    {authService.hasPermission(user, `client:${selectedClient.id}:view_proposals`) && (
                      <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <EyeIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">View All Reports</span>
                      </button>
                    )}
                    
                    {authService.hasPermission(user, `client:${selectedClient.id}:edit_profile`) && (
                      <button 
                        onClick={() => setShowProfileModal(true)}
                        className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <PencilIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Edit Profile</span>
                      </button>
                    )}
                    
                    {authService.hasPermission(user, `client:${selectedClient.id}:manage_users`) && (
                      <button 
                        onClick={() => setShowUserManagementModal(true)}
                        className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Manage Users</span>
                      </button>
                    )}
                    
                    {authService.hasPermission(user, `client:${selectedClient.id}:invite_users`) && (
                      <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <PlusIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Invite Users</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
                  <p className="text-gray-600">Choose an organization from the left panel to view details and available actions.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedClient && (
        <ClientProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          clientId={selectedClient.id}
          onProfileUpdated={() => {
            // Refresh user data after profile update
            const loadUser = async () => {
              try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
              } catch (error) {
                console.error('Error reloading user:', error);
              }
            };
            loadUser();
          }}
        />
      )}

      {/* User Management Modal */}
      {selectedClient && (
        <UserManagementModal
          isOpen={showUserManagementModal}
          onClose={() => setShowUserManagementModal(false)}
          clientId={selectedClient.id}
          onUsersUpdated={() => {
            // Refresh user data after user management changes
            const loadUser = async () => {
              try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
              } catch (error) {
                console.error('Error reloading user:', error);
              }
            };
            loadUser();
          }}
        />
      )}

      {/* Year Summary Modal */}
      {selectedYearModal && selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Tax Year {selectedYearModal} Summary
                </h3>
                <button
                  onClick={() => setSelectedYearModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">QRE Breakdown</h4>
                  {(() => {
                    const composition = getQREComposition(selectedYearModal);
                    const total = composition.wages + composition.contractors + composition.supplies;
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Qualified Wages</span>
                          <span className="text-sm font-medium">${composition.wages.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Contractor Expenses</span>
                          <span className="text-sm font-medium">${composition.contractors.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Supply Expenses</span>
                          <span className="text-sm font-medium">${composition.supplies.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">Total QRE</span>
                            <span className="text-sm font-bold text-blue-600">${total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Credit Calculation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Estimated Federal Credit</span>
                      <span className="text-sm font-medium">
                        ${Math.round(getQREComposition(selectedYearModal).wages + 
                           getQREComposition(selectedYearModal).contractors + 
                           getQREComposition(selectedYearModal).supplies * 0.14).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedYearModal(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 