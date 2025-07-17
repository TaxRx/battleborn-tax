// Epic 3 Sprint 3 Day 1: Profile Management Component
// File: ProfileManagement.tsx
// Purpose: Main profile management interface with comprehensive CRUD operations
// Story: 3.1 - Profile Management CRUD Operations

import React, { useState, useEffect, useCallback } from 'react';
import AdminProfileService, {
  ProfileSummary,
  ProfileFilters,
  ProfileListResponse,
  ProfileMetrics,
  BulkProfileOperation,
  BulkOperationResult
} from '../../services/adminProfileService';
import ProfileTable from './ProfileTable';
import ProfileDetailsModal from './ProfileDetailsModal';
import CreateProfileModal from './CreateProfileModal';
import BulkProfileOperations from './BulkProfileOperations';
import ProfileMetricsCards from './ProfileMetricsCards';
import ProfileFiltersPanel from './ProfileFiltersPanel';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import ErrorBoundary from '../../../shared/components/ErrorBoundary';

interface ProfileManagementProps {
  className?: string;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({ className = '' }) => {
  // State management
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);

  // Pagination and filtering
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState<ProfileFilters>({
    page: 1,
    limit: 50,
    sortBy: 'updated_at',
    sortOrder: 'desc'
  });

  // Services
  const profileService = AdminProfileService.getInstance();

  // Fetch profiles
  const fetchProfiles = useCallback(async (newFilters?: Partial<ProfileFilters>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedFilters = { ...filters, ...newFilters };
      const response: ProfileListResponse = await profileService.getProfiles(updatedFilters);
      
      setProfiles(response.profiles);
      setPagination(response.pagination);
      setFilters(updatedFilters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profiles';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, profileService]);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const metricsData = await profileService.getProfileMetrics();
      setMetrics(metricsData);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  }, [profileService]);

  // Initial load
  useEffect(() => {
    fetchProfiles();
    fetchMetrics();
  }, []);

  // Notification helper
  const showNotification = (message: string, type: NotificationState['type']) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Event handlers
  const handleFilterChange = (newFilters: Partial<ProfileFilters>) => {
    fetchProfiles({ ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    fetchProfiles({ page });
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    fetchProfiles({ sortBy, sortOrder, page: 1 });
  };

  const handleProfileSelect = (profileIds: string[]) => {
    setSelectedProfiles(profileIds);
  };

  const handleProfileView = (profileId: string) => {
    setSelectedProfile(profileId);
    setShowDetailsModal(true);
  };

  const handleProfileCreate = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchProfiles();
    fetchMetrics();
    showNotification('Profile created successfully', 'success');
  };

  const handleUpdateSuccess = () => {
    setShowDetailsModal(false);
    fetchProfiles();
    fetchMetrics();
    showNotification('Profile updated successfully', 'success');
  };

  const handleDeleteSuccess = () => {
    setShowDetailsModal(false);
    fetchProfiles();
    fetchMetrics();
    showNotification('Profile deleted successfully', 'success');
  };

  const handleBulkOperation = async (operation: BulkProfileOperation): Promise<BulkOperationResult> => {
    try {
      const result = await profileService.bulkUpdateProfiles(operation);
      
      if (result.success) {
        showNotification(`Bulk operation completed successfully: ${result.processed} profiles processed`, 'success');
      } else {
        showNotification(`Bulk operation completed with errors: ${result.processed} successful, ${result.failed} failed`, 'warning');
      }
      
      // Refresh data
      fetchProfiles();
      fetchMetrics();
      setSelectedProfiles([]);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk operation failed';
      showNotification(errorMessage, 'error');
      throw err;
    }
  };

  const handleRefresh = () => {
    fetchProfiles();
    fetchMetrics();
    showNotification('Data refreshed', 'info');
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      showNotification(`Preparing ${format.toUpperCase()} export...`, 'info');
      
      // Create export data
      const exportData = profiles.map(profile => ({
        'Full Name': profile.full_name || '',
        'Email': profile.email,
        'Role': profile.role,
        'Status': profile.status,
        'Account': profile.account_name || '',
        'Account Type': profile.account_type || '',
        'Last Login': profile.last_login_at ? new Date(profile.last_login_at).toLocaleDateString() : 'Never',
        'Login Count': profile.login_count,
        'Verified': profile.is_verified ? 'Yes' : 'No',
        'Sync Status': profile.auth_sync_status,
        'Created': new Date(profile.created_at).toLocaleDateString(),
        'Updated': new Date(profile.updated_at).toLocaleDateString()
      }));

      if (format === 'csv') {
        const csv = convertToCSV(exportData);
        downloadFile(csv, `profiles-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      } else if (format === 'pdf') {
        // For PDF, we'd typically use a library like jsPDF
        showNotification('PDF export not yet implemented', 'warning');
      }
      
      showNotification(`${format.toUpperCase()} export completed`, 'success');
    } catch (err) {
      showNotification('Export failed', 'error');
    }
  };

  // Helper functions
  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`profile-management ${className}`}>
        {/* Notification */}
        {notification.show && (
          <div className={`
            fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md
            ${notification.type === 'success' ? 'bg-green-100 border-green-500 text-green-800' : ''}
            ${notification.type === 'error' ? 'bg-red-100 border-red-500 text-red-800' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : ''}
            ${notification.type === 'info' ? 'bg-blue-100 border-blue-500 text-blue-800' : ''}
            border-l-4
          `}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="ml-3 text-xl font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
              <p className="text-gray-600 mt-1">
                Manage user profiles, roles, and authentication settings
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={handleProfileCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Profile
              </button>
            </div>
          </div>

          {/* Metrics Cards */}
          {metrics && (
            <ProfileMetricsCards 
              metrics={metrics}
              onMetricClick={(filter) => handleFilterChange(filter)}
            />
          )}
        </div>

        {/* Filters Panel */}
        <ProfileFiltersPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={() => handleFilterChange({ 
            search: undefined, 
            status: undefined, 
            role: undefined, 
            accountType: undefined, 
            syncStatus: undefined,
            verificationStatus: undefined,
            lastLoginRange: undefined,
            page: 1 
          })}
        />

        {/* Bulk Operations */}
        {selectedProfiles.length > 0 && (
          <div className="mb-4">
            <BulkProfileOperations
              selectedProfileIds={selectedProfiles}
              onOperation={handleBulkOperation}
              onCancel={() => setSelectedProfiles([])}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Error: {error}
            </div>
          </div>
        )}

        {/* Profiles Table */}
        <div className="bg-white rounded-lg shadow">
          <ProfileTable
            profiles={profiles}
            selectedProfiles={selectedProfiles}
            loading={loading}
            pagination={pagination}
            sortBy={filters.sortBy || 'updated_at'}
            sortOrder={filters.sortOrder || 'desc'}
            onProfileSelect={handleProfileSelect}
            onProfileView={handleProfileView}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateProfileModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {showDetailsModal && selectedProfile && (
          <ProfileDetailsModal
            isOpen={showDetailsModal}
            profileId={selectedProfile}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedProfile(null);
            }}
            onUpdate={handleUpdateSuccess}
            onDelete={handleDeleteSuccess}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProfileManagement;