// Epic 3: Enhanced Admin Authentication Guard
// Component for protecting admin routes with enhanced security

import React, { useState, useEffect, useCallback } from 'react';
import { adminSecurityService, AdminUser } from '../../services/adminSecurityService';

interface AdminAuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({
  children,
  requiredPermissions = [],
  fallback,
  redirectTo = '/admin/login'
}) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const validateAccess = useCallback(async () => {
    try {
      // First check if there's a stored session
      if (!adminSecurityService.isSessionValid()) {
        setLoading(false);
        return;
      }

      // Validate session with backend
      const validation = await adminSecurityService.validateSession();
      
      if (!validation.valid) {
        if (validation.reason === 'Session expired') {
          setSessionExpired(true);
        }
        setLoading(false);
        return;
      }

      const validatedUser = validation.user!;
      setUser(validatedUser);

      // Check permissions if required
      if (requiredPermissions.length > 0) {
        const permissionCheck = await adminSecurityService.checkPermissions(requiredPermissions);
        
        if (!permissionCheck.hasPermission) {
          setPermissionDenied(true);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Admin auth guard error:', error);
      setLoading(false);
    }
  }, [requiredPermissions]);

  useEffect(() => {
    validateAccess();

    // Listen for session expiry events
    const handleSessionExpired = () => {
      setSessionExpired(true);
      setUser(null);
    };

    window.addEventListener('admin-session-expired', handleSessionExpired);

    // Validate session every 2 minutes
    const validationInterval = setInterval(validateAccess, 2 * 60 * 1000);

    return () => {
      window.removeEventListener('admin-session-expired', handleSessionExpired);
      clearInterval(validationInterval);
    };
  }, [validateAccess]);

  const handleLogin = () => {
    if (redirectTo) {
      window.location.href = redirectTo;
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating access...</p>
        </div>
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Session Expired</h3>
            <p className="mt-2 text-sm text-gray-500">
              Your admin session has expired for security reasons. Please log in again to continue.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </button>
              <button
                onClick={handleRefresh}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-2 text-sm text-gray-500">
              You don't have the required permissions to access this area.
            </p>
            {requiredPermissions.length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-xs text-gray-600">Required permissions:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {requiredPermissions.map(permission => (
                    <span
                      key={permission}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Admin Access Required</h3>
            <p className="mt-2 text-sm text-gray-500">
              Please log in with your admin credentials to access this area.
            </p>
            <div className="mt-6">
              <button
                onClick={handleLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

// Hook for checking specific permissions within components
export const useAdminPermissions = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      const validation = await adminSecurityService.validateSession();
      if (validation.valid && validation.user) {
        setUser(validation.user);
      }
      setLoading(false);
    };

    checkPermissions();
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return adminSecurityService.hasPermission(user.permissions, permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    if (!user) return false;
    return adminSecurityService.hasAnyPermission(user.permissions, permissions);
  }, [user]);

  const hasAllPermissions = useCallback((permissions: string[]) => {
    if (!user) return false;
    return adminSecurityService.hasAllPermissions(user.permissions, permissions);
  }, [user]);

  const canAccessAdminPanel = useCallback(() => {
    return adminSecurityService.canAccessAdminPanel(user);
  }, [user]);

  const canManageAccounts = useCallback(() => {
    return adminSecurityService.canManageAccounts(user);
  }, [user]);

  const canViewSecurityLogs = useCallback(() => {
    return adminSecurityService.canViewSecurityLogs(user);
  }, [user]);

  const canManageSecurity = useCallback(() => {
    return adminSecurityService.canManageSecurity(user);
  }, [user]);

  const isSuperAdmin = useCallback(() => {
    return adminSecurityService.isSuperAdmin(user);
  }, [user]);

  return {
    user,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessAdminPanel,
    canManageAccounts,
    canViewSecurityLogs,
    canManageSecurity,
    isSuperAdmin
  };
};

// Component for conditional rendering based on permissions
interface PermissionGateProps {
  children: React.ReactNode;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  role?: 'super_admin' | 'admin' | 'platform_admin';
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions = [],
  requireAll = false,
  fallback = null,
  role
}) => {
  const { user, loading, hasPermission, hasAnyPermission, hasAllPermissions } = useAdminPermissions();

  if (loading) {
    return null; // or a loading spinner
  }

  if (!user) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (role && user.role !== role) {
    return <>{fallback}</>;
  }

  // Check permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};