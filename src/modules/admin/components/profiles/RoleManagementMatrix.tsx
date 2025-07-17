// Epic 3 Sprint 3: Role Management Matrix Component
// File: RoleManagementMatrix.tsx
// Purpose: Role assignment and permission management interface
// Story: 3.3 - Role and Permission Management

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Minus, 
  Clock, 
  User, 
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Edit3,
  Trash2
} from 'lucide-react';
import AdminProfileService, { 
  RoleDefinition, 
  ProfileRole, 
  RoleAssignmentData,
  ProfilePermission,
  PermissionGrantData 
} from '../../services/adminProfileService';
import PermissionMatrix from './PermissionMatrix';

interface RoleManagementMatrixProps {
  profileId: string;
  profileName: string;
  onRoleChange?: () => void;
}

const RoleManagementMatrix: React.FC<RoleManagementMatrixProps> = ({
  profileId,
  profileName,
  onRoleChange
}) => {
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [profileRoles, setProfileRoles] = useState<ProfileRole[]>([]);
  const [profilePermissions, setProfilePermissions] = useState<ProfilePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningRole, setAssigningRole] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [newPermission, setNewPermission] = useState<PermissionGrantData>({
    permission_name: '',
    resource_type: 'account',
    action: 'read'
  });

  const profileService = AdminProfileService.getInstance();

  const loadRoleData = async () => {
    try {
      setLoading(true);
      const [definitions, roles, permissions] = await Promise.all([
        profileService.getRoleDefinitions(),
        profileService.getProfileRoles(profileId),
        profileService.getProfilePermissions(profileId)
      ]);

      setRoleDefinitions(definitions);
      setProfileRoles(roles);
      setProfilePermissions(permissions);
    } catch (error) {
      console.error('Error loading role data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (roleData: RoleAssignmentData) => {
    try {
      setAssigningRole(true);
      const result = await profileService.assignRole(profileId, roleData);
      
      if (result.success) {
        await loadRoleData();
        setShowAssignModal(false);
        setSelectedRole('');
        onRoleChange?.();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Failed to assign role');
    } finally {
      setAssigningRole(false);
    }
  };

  const revokeRole = async (roleId: string, roleName: string) => {
    if (confirm(`Are you sure you want to revoke the ${roleName} role?`)) {
      try {
        const result = await profileService.revokeRole(roleId, 'Revoked via admin interface');
        
        if (result.success) {
          await loadRoleData();
          onRoleChange?.();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('Error revoking role:', error);
        alert('Failed to revoke role');
      }
    }
  };

  const grantPermission = async () => {
    try {
      const result = await profileService.grantPermission(profileId, newPermission);
      
      if (result.success) {
        await loadRoleData();
        setShowPermissionModal(false);
        setNewPermission({
          permission_name: '',
          resource_type: 'account',
          action: 'read'
        });
        onRoleChange?.();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error granting permission:', error);
      alert('Failed to grant permission');
    }
  };

  const revokePermission = async (permissionId: string, permissionName: string) => {
    if (confirm(`Are you sure you want to revoke the ${permissionName} permission?`)) {
      try {
        await profileService.revokePermission(permissionId);
        await loadRoleData();
        onRoleChange?.();
      } catch (error) {
        console.error('Error revoking permission:', error);
        alert('Failed to revoke permission');
      }
    }
  };

  const getRoleHierarchyColor = (level: number) => {
    if (level >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (level >= 70) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level >= 50) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getExpirationStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { status: 'permanent', color: 'text-green-600', icon: CheckCircle };
    
    const expiration = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'text-red-600', icon: XCircle };
    if (daysUntilExpiry <= 7) return { status: 'expiring', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'active', color: 'text-green-600', icon: CheckCircle };
  };

  useEffect(() => {
    loadRoleData();
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-600">Loading role information...</div>
      </div>
    );
  }

  const availableRoles = roleDefinitions.filter(
    role => !profileRoles.some(pr => pr.role_name === role.role_name && pr.is_active)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            Role & Permission Management
          </h3>
          <p className="text-sm text-gray-600">Manage roles and permissions for {profileName}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Assign Role
          </button>
          <button
            onClick={() => setShowPermissionModal(true)}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-sm"
          >
            <Settings className="w-4 h-4 mr-1" />
            Grant Permission
          </button>
        </div>
      </div>

      {/* Current Roles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Current Roles</h4>
        {profileRoles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No roles assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profileRoles.map((role) => {
              const expiration = getExpirationStatus(role.expires_at);
              const ExpirationIcon = expiration.icon;
              
              return (
                <div key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleHierarchyColor(role.role_hierarchy_level || 0)}`}>
                      {role.role_display_name || role.role_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Scope:</span> {role.scope}
                      {role.scope_id && <span className="ml-1 text-gray-400">({role.scope_id.slice(0, 8)}...)</span>}
                    </div>
                    <div className={`flex items-center text-sm ${expiration.color}`}>
                      <ExpirationIcon className="w-4 h-4 mr-1" />
                      {role.expires_at ? (
                        <span>Expires: {new Date(role.expires_at).toLocaleDateString()}</span>
                      ) : (
                        <span>Permanent</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => revokeRole(role.id, role.role_name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Direct Permissions</h4>
        {profilePermissions.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No direct permissions granted</p>
          </div>
        ) : (
          <div className="space-y-2">
            {profilePermissions.map((permission) => (
              <div key={permission.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3 text-sm">
                  <span className="font-medium">{permission.permission_name}</span>
                  <span className="text-gray-500">on</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{permission.resource_type}</span>
                  <span className="text-gray-500">→</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{permission.action}</span>
                  {permission.expires_at && (
                    <span className="text-gray-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(permission.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => revokePermission(permission.id, permission.permission_name)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permission Matrix */}
      <PermissionMatrix
        profileId={profileId}
        profileName={profileName}
        roles={profileRoles}
        permissions={profilePermissions}
        onPermissionChange={onRoleChange}
      />

      {/* Role Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Assign Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a role...</option>
                  {availableRoles.map((role) => (
                    <option key={role.role_name} value={role.role_name}>
                      {role.display_name} (Level {role.role_hierarchy_level})
                    </option>
                  ))}
                </select>
              </div>
              {selectedRole && (
                <div className="p-3 bg-blue-50 rounded">
                  <div className="text-sm">
                    <strong>Description:</strong> {roleDefinitions.find(r => r.role_name === selectedRole)?.description}
                  </div>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={() => assignRole({ role_name: selectedRole })}
                  disabled={!selectedRole || assigningRole}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {assigningRole ? 'Assigning...' : 'Assign Role'}
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedRole('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Grant Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Grant Permission</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permission Name</label>
                <input
                  type="text"
                  value={newPermission.permission_name}
                  onChange={(e) => setNewPermission({ ...newPermission, permission_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., manage_clients"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                <select
                  value={newPermission.resource_type}
                  onChange={(e) => setNewPermission({ ...newPermission, resource_type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="account">Account</option>
                  <option value="profile">Profile</option>
                  <option value="tool">Tool</option>
                  <option value="client">Client</option>
                  <option value="report">Report</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={newPermission.action}
                  onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="read">Read</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="manage">Manage</option>
                  <option value="execute">Execute</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={grantPermission}
                  disabled={!newPermission.permission_name}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Grant Permission
                </button>
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setNewPermission({
                      permission_name: '',
                      resource_type: 'account',
                      action: 'read'
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementMatrix;