// Epic 3: Account Management Component
// File: AccountManagement.tsx
// Purpose: Comprehensive account management interface with activity logging integration

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  User,
  UserCheck,
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  RotateCcw,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Activity as ActivityIcon
} from 'lucide-react';
import AccountActivityTimeline from './AccountActivityTimeline';
import AdminAccountService, { Account, AccountFilters, Activity } from '../services/adminAccountService';
import AccountFormModal from './AccountFormModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { supabase } from '../../../lib/supabase';

interface AccountManagementProps {
  className?: string;
}

const AdminAccountService_instance = AdminAccountService.getInstance();

export const AccountManagement: React.FC<AccountManagementProps> = ({ className = '' }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActivityTimeline, setShowActivityTimeline] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [editModalInitialTab, setEditModalInitialTab] = useState<'account' | 'profiles'>('account');

  // Filters and pagination
  const [filters, setFilters] = useState<AccountFilters>({
    page: 1,
    limit: 25,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // Metrics
  const [metrics, setMetrics] = useState({
    totalActivities: 0,
    recentActivities: 0,
    topActivityTypes: [] as { type: string; count: number }[],
    activityTrends: [] as { date: string; count: number }[]
  });

  // Wait for session to be ready before loading data
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AccountManagement - Session check:', {
          hasSession: !!session,
          userId: session?.user?.id
        });
        setSessionReady(!!session);
      } catch (error) {
        console.error('Session check error:', error);
        setSessionReady(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (sessionReady) {
      loadAccounts();
      loadMetrics();
    }
  }, [filters, sessionReady]);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AdminAccountService_instance.getAccounts(filters);
      setAccounts(response.accounts);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const metricsData = await AdminAccountService_instance.getActivityMetrics();
      setMetrics(metricsData);
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  };

  const handleFilterChange = (newFilters: Partial<AccountFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAccountSelect = async (account: Account) => {
    setSelectedAccount(account);
    setShowActivityTimeline(true);
  };

  const handleLogActivity = async (account: Account, activityData: {
    activityType: string;
    description: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      await AdminAccountService_instance.logActivity({
        accountId: account.id,
        activityType: activityData.activityType,
        targetType: 'account',
        targetId: account.id,
        description: activityData.description,
        metadata: activityData.metadata
      });
      
      // Refresh the current account's activities if viewing timeline
      if (selectedAccount?.id === account.id) {
        // The timeline component will refresh automatically
      }
    } catch (err) {
      console.error('Error logging activity:', err);
      setError('Failed to log activity. Please try again.');
    }
  };

  // CRUD handlers
  const handleCreateAccount = () => {
    setShowCreateModal(true);
  };

  const handleNavigateToClients = () => {
    window.location.href = '/admin/clients';
  };

  const handleEditAccount = (account: Account) => {
    setAccountToEdit(account);
    setEditModalInitialTab('account');
    setShowEditModal(true);
  };

  const handleViewProfiles = (account: Account) => {
    setAccountToEdit(account);
    setEditModalInitialTab('profiles');
    setShowEditModal(true);
  };

  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const handleAccountSaved = (savedAccount: Account) => {
    // Refresh the accounts list
    loadAccounts();
    
    // Update selected account if it was edited
    if (selectedAccount && selectedAccount.id === savedAccount.id) {
      setSelectedAccount(savedAccount);
    }
    
    setError(null);
  };

  const handleAccountDeleted = async () => {
    if (!accountToDelete) return;

    try {
      const result = await AdminAccountService_instance.deleteAccount(accountToDelete.id);
      
      if (result.success) {
        // Refresh the accounts list
        loadAccounts();
        
        // Clear selected account if it was deleted
        if (selectedAccount && selectedAccount.id === accountToDelete.id) {
          setSelectedAccount(null);
          setShowActivityTimeline(false);
        }
        
        setShowDeleteModal(false);
        setAccountToDelete(null);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
    }
  };

  const handleRestoreAccount = async (account: Account) => {
    try {
      const result = await AdminAccountService_instance.restoreAccount(account.id);
      
      if (result.success) {
        // Refresh the accounts list
        loadAccounts();
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error restoring account:', err);
      setError('Failed to restore account. Please try again.');
    }
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setAccountToEdit(null);
    setAccountToDelete(null);
  };

  // Note: Status badge removed since status is in profiles table, not accounts table

  const getTypeBadge = (type: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      client: 'bg-blue-100 text-blue-800',
      affiliate: 'bg-green-100 text-green-800',
      expert: 'bg-orange-100 text-orange-800',
      operator: 'bg-indigo-100 text-indigo-800',
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      deleted: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && accounts.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Total Accounts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{pagination.total}</h3>
              <p className="text-sm text-gray-500">Total Accounts</p>
            </div>
          </div>
        </div>

        {/* Total Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-green-100 flex items-center justify-center">
              <ActivityIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{metrics.totalActivities.toLocaleString()}</h3>
              <p className="text-sm text-gray-500">Total Activities</p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-orange-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{metrics.recentActivities.toLocaleString()}</h3>
              <p className="text-sm text-gray-500">Last 7 Days</p>
            </div>
          </div>
        </div>

        {/* Activity Growth */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                {metrics.topActivityTypes[0] ? metrics.topActivityTypes[0].type.replace(/_/g, ' ') : 'N/A'}
              </h3>
              <p className="text-sm text-gray-500">Top Activity Type</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Account Management</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleNavigateToClients}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Manage Clients
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Account
                  </button>
                  <button
                    onClick={loadAccounts}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
                  />
                </div>
                
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
                >
                  <option value="">All Types</option>
                  <option value="operator">Operator</option>
                  <option value="affiliate">Affiliate</option>
                  <option value="expert">Expert</option>
                </select>

                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="deleted">Deleted</option>
                </select>

                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={`${filters.sortBy || 'created_at'}_${filters.sortOrder || 'desc'}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('_');
                    handleFilterChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
                  }}
                >
                  <option value="created_at_desc">Newest First</option>
                  <option value="created_at_asc">Oldest First</option>
                  <option value="name_asc">Name A-Z</option>
                  <option value="name_desc">Name Z-A</option>
                  <option value="type_asc">Type A-Z</option>
                  <option value="status_asc">Status A-Z</option>
                  <option value="status_desc">Status Z-A</option>
                </select>
              </div>
              
              {/* Show Deleted Toggle */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.includeDeleted || false}
                    onChange={(e) => handleFilterChange({ includeDeleted: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show deleted accounts</span>
                </label>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-700">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Account Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      Account
                      {filters.sortBy === 'name' && (
                        <span className="ml-1">
                          {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profiles
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                      {filters.sortBy === 'created_at' && (
                        <span className="ml-1">
                          {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr 
                      key={account.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedAccount?.id === account.id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleAccountSelect(account)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{account.name}</div>
                          <div className="text-sm text-gray-500">{account.type}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(account.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(account.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfiles(account);
                          }}
                          className="text-blue-600 hover:text-blue-900 hover:underline font-medium"
                          title="View profiles for this account"
                        >
                          {account.profiles?.[0]?.count || 0}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(account.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccountSelect(account);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-purple-600 hover:text-purple-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfiles(account);
                            }}
                            title="Manage Profiles"
                          >
                            <User className="h-4 w-4" />
                          </button>
                          
                          {/* Stripe Dashboard Link */}
                          {account.stripe_customer_id && (
                            <button 
                              className="text-orange-600 hover:text-orange-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://dashboard.stripe.com/customers/${account.stripe_customer_id}`, '_blank');
                              }}
                              title="View in Stripe Dashboard"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.516-1.205 2.281-2.91 2.281-5.061 0-3.748-2.19-5.471-6.347-7.976z"/>
                              </svg>
                            </button>
                          )}
                          
                          {account.status === 'deleted' ? (
                            <button 
                              className="text-green-600 hover:text-green-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreAccount(account);
                              }}
                              title="Restore Account"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          ) : (
                            <>
                              <button 
                                className="text-gray-600 hover:text-gray-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAccount(account);
                                }}
                                title="Edit Account"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAccount(account);
                                }}
                                title="Delete Account"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} accounts
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFilterChange({ page: Math.max(1, filters.page! - 1) })}
                      disabled={filters.page === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-600">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handleFilterChange({ page: Math.min(pagination.pages, filters.page! + 1) })}
                      disabled={filters.page === pagination.pages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline Sidebar */}
        <div className="lg:col-span-1">
          {selectedAccount ? (
            <AccountActivityTimeline 
              accountId={selectedAccount.id}
              showFilters={true}
              maxHeight="max-h-96"
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <ActivityIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Timeline</h3>
                <p className="text-gray-500">Select an account to view its activity timeline</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Activity Types */}
      {metrics.topActivityTypes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Activity Types (Last 30 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.topActivityTypes.slice(0, 8).map((activityType, index) => (
              <div key={activityType.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activityType.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">Rank #{index + 1}</p>
                </div>
                <span className="text-lg font-bold text-blue-600">{activityType.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AccountFormModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
        onSave={handleAccountSaved}
        account={null}
        title="Create New Account"
      />

      <AccountFormModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        onSave={handleAccountSaved}
        account={accountToEdit}
        initialTab={editModalInitialTab}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseModals}
        onConfirm={handleAccountDeleted}
        title="Delete Account"
        message="Are you sure you want to delete this account?"
        itemName={accountToDelete?.name}
        confirmText="Delete Account"
      />
    </div>
  );
};

export default AccountManagement;