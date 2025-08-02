// Profile Management Component
// File: ProfileManagement.tsx
// Purpose: CRUD interface for managing profiles within an account

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  RotateCcw,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Shield,
  Phone,
  Mail,
  Key
} from 'lucide-react';
import AdminAccountService, { Profile, ProfileFilters } from '../services/adminAccountService';
import ProfileFormModal from './ProfileFormModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import PasswordManagementModal from './PasswordManagementModal';

interface ProfileManagementProps {
  accountId: string;
  accountName: string;
}

const adminAccountService = AdminAccountService.getInstance();

export const ProfileManagement: React.FC<ProfileManagementProps> = ({ 
  accountId, 
  accountName 
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const [profileToManagePassword, setProfileToManagePassword] = useState<Profile | null>(null);

  // Filters
  const [filters, setFilters] = useState<ProfileFilters>({
    accountId,
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadProfiles();
  }, [filters]);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminAccountService.getProfiles(filters);
      setProfiles(response.profiles);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<ProfileFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleCreateProfile = () => {
    setShowCreateModal(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setProfileToEdit(profile);
    setShowEditModal(true);
  };

  const handleDeleteProfile = (profile: Profile) => {
    setProfileToDelete(profile);
    setShowDeleteModal(true);
  };

  const handleManagePassword = (profile: Profile) => {
    setProfileToManagePassword(profile);
    setShowPasswordModal(true);
  };

  const handleRestoreProfile = async (profile: Profile) => {
    try {
      const result = await adminAccountService.restoreProfile(profile.id);
      
      if (result.success) {
        loadProfiles();
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error restoring profile:', err);
      setError('Failed to restore profile. Please try again.');
    }
  };

  const handleProfileSaved = (savedProfile: Profile) => {
    loadProfiles();
    setError(null);
  };

  const handleProfileDeleted = async () => {
    if (!profileToDelete) return;

    try {
      const result = await adminAccountService.deleteProfile(profileToDelete.id);
      
      if (result.success) {
        loadProfiles();
        setShowDeleteModal(false);
        setProfileToDelete(null);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError('Failed to delete profile. Please try again.');
    }
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowPasswordModal(false);
    setProfileToEdit(null);
    setProfileToDelete(null);
    setProfileToManagePassword(null);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-blue-100 text-blue-800',
      locked: 'bg-gray-100 text-gray-800',
      deleted: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    // Admin role detection based on role string
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </span>
      );
    }
    
    const colors = {
      user: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Profiles for {accountName}</h3>
          <p className="text-sm text-gray-500">Manage user profiles associated with this account</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCreateProfile}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Profile
          </button>
          <button
            onClick={loadProfiles}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search profiles..."
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
          />
        </div>
        
        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.status || ''}
          onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
          <option value="locked">Locked</option>
          <option value="deleted">Deleted</option>
        </select>

        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.role || ''}
          onChange={(e) => handleFilterChange({ role: e.target.value || undefined })}
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="viewer">Viewer</option>
        </select>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.includeDeleted || false}
            onChange={(e) => handleFilterChange({ includeDeleted: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Show deleted</span>
        </label>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Profiles Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading profiles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center">
            <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No profiles found for this account</p>
            <button
              onClick={handleCreateProfile}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Profile
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            {profile.avatar_url ? (
                              <img 
                                src={profile.avatar_url} 
                                alt={profile.full_name || profile.email}
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <User className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {profile.full_name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {profile.email}
                            </div>
                            {profile.phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {profile.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(profile.role || 'user')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(profile.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {profile.last_login_at ? 
                          new Date(profile.last_login_at).toLocaleDateString() : 
                          'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {profile.status === 'deleted' ? (
                            <button 
                              className="text-green-600 hover:text-green-900"
                              onClick={() => handleRestoreProfile(profile)}
                              title="Restore Profile"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          ) : (
                            <>
                              <button 
                                className="text-gray-600 hover:text-gray-900"
                                onClick={() => handleEditProfile(profile)}
                                title="Edit Profile"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-blue-600 hover:text-blue-900"
                                onClick={() => handleManagePassword(profile)}
                                title="Manage Password"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteProfile(profile)}
                                title="Delete Profile"
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
                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} profiles
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
          </>
        )}
      </div>

      {/* Modals */}
      <ProfileFormModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
        onSave={handleProfileSaved}
        profile={null}
        accountId={accountId}
        title="Create New Profile"
      />

      <ProfileFormModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        onSave={handleProfileSaved}
        profile={profileToEdit}
        accountId={accountId}
        title="Edit Profile"
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseModals}
        onConfirm={handleProfileDeleted}
        title="Delete Profile"
        message="Are you sure you want to delete this profile?"
        itemName={profileToDelete?.email}
        confirmText="Delete Profile"
      />

      <PasswordManagementModal
        isOpen={showPasswordModal}
        onClose={handleCloseModals}
        profile={profileToManagePassword}
      />
    </div>
  );
};

export default ProfileManagement;