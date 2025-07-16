// Epic 3: Account Activity Timeline Component
// File: AccountActivityTimeline.tsx
// Purpose: Timeline visualization for account activity history with advanced filtering

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Filter, 
  Download, 
  Search, 
  Calendar,
  User,
  Activity as ActivityIcon,
  Database,
  Shield,
  Settings,
  CreditCard,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AdminAccountService, { Activity, ActivityFilters } from '../services/adminAccountService';

interface ActivityTimelineProps {
  accountId: string;
  className?: string;
  showFilters?: boolean;
  maxHeight?: string;
}

const AdminAccountService_instance = AdminAccountService.getInstance();

export const AccountActivityTimeline: React.FC<ActivityTimelineProps> = ({ 
  accountId, 
  className = '',
  showFilters = true,
  maxHeight = 'max-h-96'
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<ActivityFilters>({
    page: 1,
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadActivities();
  }, [accountId, filters]);

  const loadActivities = async () => {
    if (!accountId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await AdminAccountService_instance.getAccountActivities(accountId, filters);
      setActivities(response.activities);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const handleFilterChange = (newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    try {
      await AdminAccountService_instance.exportActivities(accountId, { ...filters, format });
    } catch (err) {
      console.error('Error exporting activities:', err);
      setError('Failed to export activities. Please try again.');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'account_created':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'account_updated':
        return <Settings className="h-4 w-4 text-blue-600" />;
      case 'account_deleted':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'profile_added':
        return <User className="h-4 w-4 text-green-600" />;
      case 'profile_removed':
        return <User className="h-4 w-4 text-red-600" />;
      case 'profile_updated':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'status_changed':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case 'type_changed':
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      case 'access_granted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'access_revoked':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'tool_assigned':
        return <Settings className="h-4 w-4 text-blue-600" />;
      case 'tool_removed':
        return <Settings className="h-4 w-4 text-red-600" />;
      case 'billing_updated':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'subscription_changed':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'payment_processed':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'login_success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'login_failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'password_changed':
        return <Shield className="h-4 w-4 text-orange-600" />;
      case 'data_export':
        return <Download className="h-4 w-4 text-blue-600" />;
      case 'bulk_operation':
        return <Database className="h-4 w-4 text-purple-600" />;
      case 'admin_action':
        return <Shield className="h-4 w-4 text-orange-600" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'account_created':
      case 'profile_added':
      case 'access_granted':
      case 'billing_updated':
      case 'payment_processed':
      case 'login_success':
        return 'bg-green-100 border-green-300';
      case 'account_deleted':
      case 'profile_removed':
      case 'access_revoked':
      case 'tool_removed':
      case 'login_failed':
        return 'bg-red-100 border-red-300';
      case 'account_updated':
      case 'profile_updated':
      case 'tool_assigned':
      case 'subscription_changed':
      case 'data_export':
        return 'bg-blue-100 border-blue-300';
      case 'status_changed':
      case 'password_changed':
      case 'admin_action':
        return 'bg-orange-100 border-orange-300';
      case 'type_changed':
      case 'bulk_operation':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const activityTypes = useMemo(() => [
    { value: '', label: 'All Activities' },
    { value: 'account_created', label: 'Account Created' },
    { value: 'account_updated', label: 'Account Updated' },
    { value: 'account_deleted', label: 'Account Deleted' },
    { value: 'profile_added', label: 'Profile Added' },
    { value: 'profile_removed', label: 'Profile Removed' },
    { value: 'profile_updated', label: 'Profile Updated' },
    { value: 'status_changed', label: 'Status Changed' },
    { value: 'type_changed', label: 'Type Changed' },
    { value: 'access_granted', label: 'Access Granted' },
    { value: 'access_revoked', label: 'Access Revoked' },
    { value: 'tool_assigned', label: 'Tool Assigned' },
    { value: 'tool_removed', label: 'Tool Removed' },
    { value: 'billing_updated', label: 'Billing Updated' },
    { value: 'subscription_changed', label: 'Subscription Changed' },
    { value: 'payment_processed', label: 'Payment Processed' },
    { value: 'login_success', label: 'Login Success' },
    { value: 'login_failed', label: 'Login Failed' },
    { value: 'password_changed', label: 'Password Changed' },
    { value: 'data_export', label: 'Data Export' },
    { value: 'bulk_operation', label: 'Bulk Operation' },
    { value: 'admin_action', label: 'Admin Action' }
  ], []);

  if (loading && activities.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading activity timeline...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Activity Timeline</h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {pagination.total} activities
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {showFilters && (
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && showAdvancedFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Activity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <select
                value={filters.activityType || ''}
                onChange={(e) => handleFilterChange({ activityType: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange({ dateFrom: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange({ dateTo: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Export Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Export</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  JSON
                </button>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({ page: 1, limit: 50, sortBy: 'created_at', sortOrder: 'desc' })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

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

      {/* Timeline Content */}
      <div className={`${maxHeight} overflow-y-auto`}>
        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <ActivityIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No activities found</p>
            <p className="text-gray-400 text-sm">Activities will appear here when actions are performed on this account.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {activities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== activities.length - 1 && (
                        <span
                          className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className={`relative px-1`}>
                          <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${getActivityColor(activity.activity_type)}`}>
                            {getActivityIcon(activity.activity_type)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 font-medium">
                                {activity.description}
                              </p>
                              <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                                <span>{activity.actor_name || 'System'}</span>
                                <span>•</span>
                                <span>{activity.activity_type.replace(/_/g, ' ')}</span>
                                <span>•</span>
                                <span>{new Date(activity.created_at).toLocaleString()}</span>
                                {activity.ip_address && (
                                  <>
                                    <span>•</span>
                                    <span>{activity.ip_address}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {Object.keys(activity.metadata).length > 0 && (
                                <button
                                  onClick={() => setExpandedActivity(
                                    expandedActivity === activity.id ? null : activity.id
                                  )}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Metadata */}
                          {expandedActivity === activity.id && Object.keys(activity.metadata).length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <h4 className="text-xs font-medium text-gray-700 mb-2">Activity Details</h4>
                              <pre className="text-xs text-gray-600 overflow-x-auto">
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Load More / Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {activities.length} of {pagination.total} activities
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountActivityTimeline;