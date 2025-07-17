// Epic 3 Sprint 3 Day 1: Profile Table Component
// File: ProfileTable.tsx
// Purpose: Table component for displaying and managing profiles list
// Story: 3.1 - Profile Management CRUD Operations

import React from 'react';
import { ProfileSummary } from '../../services/adminProfileService';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';

interface ProfileTableProps {
  profiles: ProfileSummary[];
  selectedProfiles: string[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onProfileSelect: (profileIds: string[]) => void;
  onProfileView: (profileId: string) => void;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

const ProfileTable: React.FC<ProfileTableProps> = ({
  profiles,
  selectedProfiles,
  loading,
  pagination,
  sortBy,
  sortOrder,
  onProfileSelect,
  onProfileView,
  onPageChange,
  onSortChange
}) => {
  const handleSelectAll = () => {
    if (selectedProfiles.length === profiles.length) {
      onProfileSelect([]);
    } else {
      onProfileSelect(profiles.map(p => p.id));
    }
  };

  const handleSelectProfile = (profileId: string) => {
    if (selectedProfiles.includes(profileId)) {
      onProfileSelect(selectedProfiles.filter(id => id !== profileId));
    } else {
      onProfileSelect([...selectedProfiles, profileId]);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      onSortChange(column, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      locked: 'bg-orange-100 text-orange-800'
    };
    
    return `px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`;
  };

  const getSyncStatusBadge = (status: string) => {
    const badges = {
      synced: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      conflict: 'bg-red-100 text-red-800',
      error: 'bg-red-100 text-red-800',
      requires_attention: 'bg-orange-100 text-orange-800'
    };
    
    return `px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`;
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      affiliate: 'bg-blue-100 text-blue-800'
    };
    
    return `px-2 py-1 text-xs font-medium rounded-full ${badges[role as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDaysAgo = (days: number | null) => {
    if (days === null) return 'Never';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="profile-table">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={profiles.length > 0 && selectedProfiles.length === profiles.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              
              {/* Profile Info */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('full_name')}
              >
                <div className="flex items-center gap-1">
                  Profile
                  {getSortIcon('full_name')}
                </div>
              </th>
              
              {/* Role */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-1">
                  Role
                  {getSortIcon('role')}
                </div>
              </th>
              
              {/* Status */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {getSortIcon('status')}
                </div>
              </th>
              
              {/* Account */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('account_name')}
              >
                <div className="flex items-center gap-1">
                  Account
                  {getSortIcon('account_name')}
                </div>
              </th>
              
              {/* Last Login */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('last_login_at')}
              >
                <div className="flex items-center gap-1">
                  Last Login
                  {getSortIcon('last_login_at')}
                </div>
              </th>
              
              {/* Sync Status */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('auth_sync_status')}
              >
                <div className="flex items-center gap-1">
                  Sync Status
                  {getSortIcon('auth_sync_status')}
                </div>
              </th>
              
              {/* Activities */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activities
              </th>
              
              {/* Actions */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && profiles.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <LoadingSpinner size="md" />
                  <p className="mt-2 text-gray-500">Loading profiles...</p>
                </td>
              </tr>
            ) : profiles.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No profiles found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                </td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr 
                  key={profile.id} 
                  className={`hover:bg-gray-50 ${selectedProfiles.includes(profile.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProfiles.includes(profile.id)}
                      onChange={() => handleSelectProfile(profile.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  
                  {/* Profile Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {profile.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={profile.avatar_url}
                            alt={profile.full_name || profile.email}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {profile.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {profile.email}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {profile.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Unverified</span>
                          )}
                          {profile.phone && (
                            <span className="text-xs text-gray-500">📞 {profile.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className={getRoleBadge(profile.role)}>
                      {profile.role}
                    </span>
                  </td>
                  
                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={getStatusBadge(profile.status)}>
                      {profile.status}
                    </span>
                  </td>
                  
                  {/* Account */}
                  <td className="px-6 py-4">
                    {profile.account_name ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {profile.account_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {profile.account_type}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No account</span>
                    )}
                  </td>
                  
                  {/* Last Login */}
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      {formatDate(profile.last_login_at)}
                    </div>
                    {profile.days_since_last_login !== null && (
                      <div className="text-xs text-gray-500">
                        {formatDaysAgo(profile.days_since_last_login)}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {profile.login_count} logins
                    </div>
                  </td>
                  
                  {/* Sync Status */}
                  <td className="px-6 py-4">
                    <span className={getSyncStatusBadge(profile.auth_sync_status)}>
                      {profile.auth_sync_status.replace('_', ' ')}
                    </span>
                    {profile.unresolved_conflicts > 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        {profile.unresolved_conflicts} conflicts
                      </div>
                    )}
                  </td>
                  
                  {/* Activities */}
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-col gap-1">
                      <div>{profile.total_activities} total</div>
                      <div className="text-xs text-gray-500">
                        {profile.active_roles} roles, {profile.active_permissions} permissions
                      </div>
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onProfileView(profile.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> profiles
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {loading && profiles.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  );
};

export default ProfileTable;