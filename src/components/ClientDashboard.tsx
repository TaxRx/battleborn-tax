import React, { useState, useEffect } from 'react';
import { authService, AuthUser, ClientUser } from '../services/authService';
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon,
  CogIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function ClientDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientUser | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        // Set primary client as default selection
        if (currentUser && currentUser.isClientUser) {
          const primaryClient = authService.getPrimaryClient(currentUser);
          setSelectedClient(primaryClient);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'member': return 'Member';
      case 'viewer': return 'Viewer';
      case 'accountant': return 'Accountant';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      case 'accountant': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
                <span className="text-white font-bold text-lg">B</span>
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
                  <p className="text-sm text-gray-900">{user.clientUsers.length} organizations</p>
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
                {user.clientUsers.map((clientUser) => (
                  <div 
                    key={clientUser.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedClient?.id === clientUser.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedClient(clientUser)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {clientUser.client?.full_name || 'Unknown Business'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {clientUser.client?.filing_status || 'Individual'}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(clientUser.role)}`}>
                        {getRoleDisplayName(clientUser.role)}
                      </span>
                    </div>
                  </div>
                ))}
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
                      {selectedClient.client?.full_name || 'Client Details'}
                    </h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(selectedClient.role)}`}>
                      {getRoleDisplayName(selectedClient.role)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Filing Status</label>
                      <p className="text-sm text-gray-900">{selectedClient.client?.filing_status || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">State</label>
                      <p className="text-sm text-gray-900">{selectedClient.client?.state || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Email</label>
                      <p className="text-sm text-gray-900">{selectedClient.client?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{selectedClient.client?.phone || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-sm text-gray-900">{selectedClient.client?.home_address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Permissions for this Client */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Permissions</h2>
                  
                  <div className="space-y-2">
                    {user.permissions
                      .filter(p => p.includes(`client:${selectedClient.client_id}:`))
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

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {authService.hasPermission(user, `client:${selectedClient.client_id}:view_documents`) && (
                      <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">View Documents</span>
                      </button>
                    )}
                    
                    {authService.hasPermission(user, `client:${selectedClient.client_id}:upload_documents`) && (
                      <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <PlusIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Upload Documents</span>
                      </button>
                    )}
                    
                    {authService.hasPermission(user, `client:${selectedClient.client_id}:view_proposals`) && (
                      <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <EyeIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">View Proposals</span>
                      </button>
                    )}
                    
                    {authService.hasPermission(user, `client:${selectedClient.client_id}:edit_profile`) && (
                      <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <PencilIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Edit Profile</span>
                      </button>
                    )}
                    
                    {authService.hasPermission(user, `client:${selectedClient.client_id}:manage_users`) && (
                      <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Manage Users</span>
                      </button>
                    )}
                    
                    {authService.hasPermission(user, `client:${selectedClient.client_id}:invite_users`) && (
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
    </div>
  );
} 