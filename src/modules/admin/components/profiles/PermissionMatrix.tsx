// Epic 3 Sprint 3: Permission Matrix Validation Component
// File: PermissionMatrix.tsx
// Purpose: Permission validation and matrix visualization for role management
// Story: 3.3 - Role and Permission Management

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Check, 
  X, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  AlertTriangle,
  Lock,
  Unlock,
  Grid3x3,
  Users,
  Settings
} from 'lucide-react';
import AdminProfileService, { 
  RoleDefinition, 
  ProfileRole, 
  ProfilePermission 
} from '../../services/adminProfileService';

interface PermissionMatrixProps {
  profileId: string;
  profileName: string;
  roles: ProfileRole[];
  permissions: ProfilePermission[];
  onPermissionChange?: () => void;
}

interface PermissionRule {
  resource: string;
  action: string;
  allowed: boolean;
  source: 'role' | 'direct' | 'inherited';
  roleName?: string;
  permissionId?: string;
  conflicts?: boolean;
}

interface ResourceGroup {
  name: string;
  permissions: PermissionRule[];
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  profileId,
  profileName,
  roles,
  permissions,
  onPermissionChange
}) => {
  const [permissionMatrix, setPermissionMatrix] = useState<ResourceGroup[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationResults, setValidationResults] = useState<{
    conflicts: number;
    redundant: number;
    gaps: number;
    recommendations: string[];
  }>({ conflicts: 0, redundant: 0, gaps: 0, recommendations: [] });
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  const profileService = AdminProfileService.getInstance();

  const resourceTypes = ['account', 'profile', 'tool', 'client', 'report', 'calculation', 'document', 'system'];
  const actionTypes = ['read', 'create', 'update', 'delete', 'manage', 'execute'];

  const loadPermissionMatrix = async () => {
    try {
      setLoading(true);
      const definitions = await profileService.getRoleDefinitions();
      setRoleDefinitions(definitions);
      
      const matrix = buildPermissionMatrix();
      setPermissionMatrix(matrix);
      
      const validation = validatePermissions(matrix);
      setValidationResults(validation);
    } catch (error) {
      console.error('Error loading permission matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildPermissionMatrix = (): ResourceGroup[] => {
    const matrix: ResourceGroup[] = [];
    
    resourceTypes.forEach(resource => {
      const resourceGroup: ResourceGroup = {
        name: resource,
        permissions: []
      };
      
      actionTypes.forEach(action => {
        const rule = determinePermissionRule(resource, action);
        resourceGroup.permissions.push(rule);
      });
      
      matrix.push(resourceGroup);
    });
    
    return matrix;
  };

  const determinePermissionRule = (resource: string, action: string): PermissionRule => {
    // Check direct permissions first
    const directPermission = permissions.find(p => 
      p.resource_type === resource && 
      p.action === action && 
      p.is_active
    );
    
    if (directPermission) {
      return {
        resource,
        action,
        allowed: true,
        source: 'direct',
        permissionId: directPermission.id
      };
    }
    
    // Check role-based permissions
    const rolePermissions = roles
      .filter(role => role.is_active && !role.is_expired)
      .map(role => {
        const definition = roleDefinitions.find(def => def.role_name === role.role_name);
        return { role, definition };
      })
      .filter(({ definition }) => definition && hasRolePermission(definition, resource, action))
      .map(({ role }) => role);
    
    if (rolePermissions.length > 0) {
      const conflicts = rolePermissions.length > 1;
      return {
        resource,
        action,
        allowed: true,
        source: 'role',
        roleName: rolePermissions[0].role_name,
        conflicts
      };
    }
    
    // Check inherited permissions (from higher hierarchy roles)
    const inheritedRole = roles
      .filter(role => role.is_active && !role.is_expired)
      .find(role => {
        const definition = roleDefinitions.find(def => def.role_name === role.role_name);
        return definition && hasInheritedPermission(definition, resource, action);
      });
    
    if (inheritedRole) {
      return {
        resource,
        action,
        allowed: true,
        source: 'inherited',
        roleName: inheritedRole.role_name
      };
    }
    
    return {
      resource,
      action,
      allowed: false,
      source: 'role'
    };
  };

  const hasRolePermission = (definition: RoleDefinition, resource: string, action: string): boolean => {
    return definition.default_permissions.some(perm => {
      const [permResource, permScope, permAction] = perm.split(':');
      return (
        (permResource === resource || permResource === '*') &&
        (permAction === action || permAction === '*' || permAction === 'manage')
      );
    });
  };

  const hasInheritedPermission = (definition: RoleDefinition, resource: string, action: string): boolean => {
    // Super admin and admin roles have broad permissions
    if (definition.role_name === 'super_admin') return true;
    if (definition.role_name === 'admin' && resource !== 'system') return true;
    
    // Check hierarchy-based inheritance
    if (definition.role_hierarchy_level >= 70) {
      return ['read', 'create', 'update'].includes(action) && 
             ['account', 'profile', 'client'].includes(resource);
    }
    
    return false;
  };

  const validatePermissions = (matrix: ResourceGroup[]) => {
    let conflicts = 0;
    let redundant = 0;
    let gaps = 0;
    const recommendations: string[] = [];
    
    matrix.forEach(group => {
      group.permissions.forEach(perm => {
        if (perm.conflicts) conflicts++;
        
        // Check for redundant permissions
        if (perm.source === 'direct' && hasRolePermission(
          roleDefinitions.find(def => roles.some(r => r.role_name === def.role_name))!,
          perm.resource,
          perm.action
        )) {
          redundant++;
        }
      });
    });
    
    // Check for permission gaps
    const criticalPermissions = [
      { resource: 'profile', action: 'read' },
      { resource: 'account', action: 'read' }
    ];
    
    criticalPermissions.forEach(({ resource, action }) => {
      const hasPermission = matrix
        .find(g => g.name === resource)
        ?.permissions.find(p => p.action === action)
        ?.allowed;
      
      if (!hasPermission) {
        gaps++;
        recommendations.push(`Missing critical permission: ${action} on ${resource}`);
      }
    });
    
    if (conflicts > 0) {
      recommendations.push(`Resolve ${conflicts} permission conflicts`);
    }
    
    if (redundant > 0) {
      recommendations.push(`Remove ${redundant} redundant direct permissions`);
    }
    
    return { conflicts, redundant, gaps, recommendations };
  };

  const getPermissionIcon = (rule: PermissionRule) => {
    if (!rule.allowed) return <X className="w-4 h-4 text-gray-400" />;
    
    switch (rule.source) {
      case 'direct':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'role':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'inherited':
        return <Users className="w-4 h-4 text-purple-600" />;
      default:
        return <X className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPermissionClass = (rule: PermissionRule) => {
    if (!rule.allowed) return 'bg-gray-50 border-gray-200';
    if (rule.conflicts) return 'bg-red-50 border-red-200';
    
    switch (rule.source) {
      case 'direct':
        return 'bg-green-50 border-green-200';
      case 'role':
        return 'bg-blue-50 border-blue-200';
      case 'inherited':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getValidationColor = (value: number) => {
    if (value === 0) return 'text-green-600';
    if (value <= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    loadPermissionMatrix();
  }, [roles, permissions, roleDefinitions.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-600">Loading permission matrix...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Grid3x3 className="w-5 h-5 mr-2 text-blue-600" />
            Permission Matrix
          </h3>
          <p className="text-sm text-gray-600">Comprehensive permission validation for {profileName}</p>
        </div>
        <button
          onClick={() => setShowValidationDetails(!showValidationDetails)}
          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center text-sm"
        >
          <Eye className="w-4 h-4 mr-1" />
          Validation Details
        </button>
      </div>

      {/* Validation Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Permission Validation</h4>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getValidationColor(validationResults.conflicts)}`}>
              {validationResults.conflicts}
            </div>
            <div className="text-sm text-gray-600">Conflicts</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getValidationColor(validationResults.redundant)}`}>
              {validationResults.redundant}
            </div>
            <div className="text-sm text-gray-600">Redundant</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getValidationColor(validationResults.gaps)}`}>
              {validationResults.gaps}
            </div>
            <div className="text-sm text-gray-600">Gaps</div>
          </div>
        </div>

        {validationResults.recommendations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h5 className="font-medium text-yellow-800 mb-2">Recommendations</h5>
            <ul className="space-y-1">
              {validationResults.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-yellow-700 flex items-start">
                  <AlertTriangle className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Permission Matrix</h4>
          <div className="flex items-center space-x-4 mt-2 text-xs">
            <div className="flex items-center">
              <Check className="w-3 h-3 text-green-600 mr-1" />
              <span>Direct Permission</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-3 h-3 text-blue-600 mr-1" />
              <span>Role-based</span>
            </div>
            <div className="flex items-center">
              <Users className="w-3 h-3 text-purple-600 mr-1" />
              <span>Inherited</span>
            </div>
            <div className="flex items-center">
              <X className="w-3 h-3 text-gray-400 mr-1" />
              <span>Not Allowed</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                {actionTypes.map(action => (
                  <th key={action} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissionMatrix.map((group) => (
                <tr key={group.name}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                    {group.name}
                  </td>
                  {group.permissions.map((perm, index) => (
                    <td key={index} className="px-3 py-3 whitespace-nowrap text-center">
                      <div 
                        className={`inline-flex items-center justify-center w-8 h-8 rounded border ${getPermissionClass(perm)}`}
                        title={`${perm.action} permission on ${perm.resource} - ${perm.source}${perm.roleName ? ` (${perm.roleName})` : ''}${perm.conflicts ? ' - CONFLICT' : ''}`}
                      >
                        {getPermissionIcon(perm)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Details Modal */}
      {showValidationDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Permission Validation Details</h3>
              <button
                onClick={() => setShowValidationDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Active Roles</h4>
                <div className="space-y-2">
                  {roles.filter(role => role.is_active && !role.is_expired).map(role => (
                    <div key={role.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="font-medium">{role.role_display_name || role.role_name}</span>
                      <span className="text-sm text-gray-600">Level {role.role_hierarchy_level}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Direct Permissions</h4>
                <div className="space-y-2">
                  {permissions.filter(perm => perm.is_active).map(perm => (
                    <div key={perm.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="font-medium">{perm.permission_name}</span>
                      <span className="text-sm text-gray-600">{perm.action} on {perm.resource_type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {validationResults.conflicts > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Permission Conflicts</h4>
                  <div className="space-y-2">
                    {permissionMatrix.flatMap(group => 
                      group.permissions.filter(perm => perm.conflicts)
                    ).map((perm, index) => (
                      <div key={index} className="p-2 bg-red-50 rounded">
                        <span className="font-medium text-red-800">
                          {perm.action} on {perm.resource}
                        </span>
                        <p className="text-sm text-red-600">Multiple roles grant this permission</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionMatrix;