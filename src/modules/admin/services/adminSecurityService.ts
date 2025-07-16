// Epic 3: Admin Security Service
// Enhanced security service for admin authentication, RBAC, and session management

import { supabase } from '../../../lib/supabase';

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'platform_admin';
  permissions: string[];
  session?: AdminSession;
}

export interface AdminSession {
  session_id: string;
  user_id: string;
  role: string;
  permissions: string[];
  created_at: string;
  last_activity: string;
  expires_at: string;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface SecurityAlert {
  alert_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  created_at: string;
  resolved: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PermissionCheck {
  permissions: string[];
}

class AdminSecurityService {
  private static instance: AdminSecurityService;
  private sessionCheckInterval: number | null = null;
  private readonly SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AdminSecurityService {
    if (!AdminSecurityService.instance) {
      AdminSecurityService.instance = new AdminSecurityService();
    }
    return AdminSecurityService.instance;
  }

  constructor() {
    this.startSessionMonitoring();
  }

  // Enhanced Admin Authentication
  async enhancedLogin(credentials: LoginCredentials): Promise<{
    user: AdminUser | null;
    error: string | null;
  }> {
    try {
      const response = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/security/enhance-login',
          ...credentials,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        },
      });

      if (response.error) {
        return { user: null, error: response.error.message };
      }

      const { data } = response;
      
      if (!data.success) {
        return { user: null, error: data.error || 'Login failed' };
      }

      // Store session info in localStorage for session management
      localStorage.setItem('admin_session', JSON.stringify(data.user.session));
      
      return { 
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          permissions: data.user.permissions,
          session: data.user.session
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Enhanced login error:', error);
      return { user: null, error: 'Login system error' };
    }
  }

  // Session Validation
  async validateSession(): Promise<{
    valid: boolean;
    user?: AdminUser;
    reason?: string;
  }> {
    try {
      const response = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/security/validate-session'
        },
      });

      if (response.error) {
        return { valid: false, reason: 'Validation error' };
      }

      const { data } = response;
      
      if (!data.valid) {
        // Clear local session if invalid
        localStorage.removeItem('admin_session');
        return { valid: false, reason: data.reason };
      }

      return {
        valid: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          permissions: data.user.permissions,
          session: {
            session_id: '',
            user_id: data.user.id,
            role: data.user.role,
            permissions: data.user.permissions,
            created_at: '',
            last_activity: '',
            expires_at: data.user.session_expires_at,
            ip_address: '',
            user_agent: '',
            is_active: true
          }
        }
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  // Session Extension
  async extendSession(): Promise<{ success: boolean; expires_at?: string; error?: string }> {
    try {
      const response = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/security/extend-session'
        },
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const { data } = response;
      
      if (!data.success) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        expires_at: data.expires_at
      };
    } catch (error) {
      console.error('Session extension error:', error);
      return { success: false, error: 'Extension failed' };
    }
  }

  // Enhanced Logout
  async enhancedLogout(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/security/logout'
        },
      });

      // Clear local session regardless of response
      localStorage.removeItem('admin_session');
      
      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const { data } = response;
      return { success: data.success };
    } catch (error) {
      console.error('Enhanced logout error:', error);
      localStorage.removeItem('admin_session');
      return { success: false, error: 'Logout error' };
    }
  }

  // Permission Management
  async getUserPermissions(): Promise<{
    role?: string;
    permissions: string[];
    level: number;
    error?: string;
  }> {
    try {
      const response = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/security/permissions'
        },
      });

      if (response.error) {
        return { permissions: [], level: 0, error: response.error.message };
      }

      const { data } = response;
      
      return {
        role: data.role,
        permissions: data.permissions || [],
        level: data.level || 0
      };
    } catch (error) {
      console.error('Get permissions error:', error);
      return { permissions: [], level: 0, error: 'Permission check failed' };
    }
  }

  async checkPermissions(requiredPermissions: string[]): Promise<{
    hasPermission: boolean;
    userRole?: string;
    userPermissions?: string[];
    reason?: string;
  }> {
    try {
      const response = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/security/check-permissions',
          permissions: requiredPermissions
        },
      });

      if (response.error) {
        return { hasPermission: false, reason: 'Permission check error' };
      }

      const { data } = response;
      
      return {
        hasPermission: data.hasPermission,
        userRole: data.userRole,
        userPermissions: data.userPermissions,
        reason: data.reason
      };
    } catch (error) {
      console.error('Check permissions error:', error);
      return { hasPermission: false, reason: 'Permission check failed' };
    }
  }

  // Permission Helper Methods
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission) || 
           userPermissions.includes('admin:all');
  }

  hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => 
      this.hasPermission(userPermissions, permission)
    );
  }

  hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => 
      this.hasPermission(userPermissions, permission)
    );
  }

  canAccessAdminPanel(user: AdminUser | null): boolean {
    if (!user) return false;
    return ['super_admin', 'admin', 'platform_admin'].includes(user.role);
  }

  canManageAccounts(user: AdminUser | null): boolean {
    if (!user) return false;
    return this.hasAnyPermission(user.permissions, ['accounts:write', 'accounts:all', 'admin:all']);
  }

  canViewSecurityLogs(user: AdminUser | null): boolean {
    if (!user) return false;
    return this.hasAnyPermission(user.permissions, ['security:read', 'security:all', 'admin:all']);
  }

  canManageSecurity(user: AdminUser | null): boolean {
    if (!user) return false;
    return this.hasAnyPermission(user.permissions, ['security:write', 'security:all', 'admin:all']);
  }

  isSuperAdmin(user: AdminUser | null): boolean {
    if (!user) return false;
    return user.role === 'super_admin';
  }

  // Security Monitoring
  async getSecurityAlerts(limit: number = 50, resolved: boolean = false): Promise<{
    alerts: SecurityAlert[];
    error?: string;
  }> {
    try {
      const response = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: `/admin-service/security/alerts?limit=${limit}&resolved=${resolved}`
        },
      });

      if (response.error) {
        return { alerts: [], error: response.error.message };
      }

      const { data } = response;
      return { alerts: data.alerts || [] };
    } catch (error) {
      console.error('Get security alerts error:', error);
      return { alerts: [], error: 'Failed to fetch alerts' };
    }
  }

  async getActiveSessions(): Promise<{
    sessions: AdminSession[];
    error?: string;
  }> {
    try {
      const response = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/security/active-sessions'
        },
      });

      if (response.error) {
        return { sessions: [], error: response.error.message };
      }

      const { data } = response;
      return { sessions: data.sessions || [] };
    } catch (error) {
      console.error('Get active sessions error:', error);
      return { sessions: [], error: 'Failed to fetch sessions' };
    }
  }

  async revokeSession(sessionId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/security/revoke-session',
          session_id: sessionId,
          user_id: userId
        },
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const { data } = response;
      return { success: data.success };
    } catch (error) {
      console.error('Revoke session error:', error);
      return { success: false, error: 'Failed to revoke session' };
    }
  }

  // Session Monitoring
  private startSessionMonitoring(): void {
    if (typeof window === 'undefined') return; // Skip in SSR

    this.sessionCheckInterval = window.setInterval(async () => {
      const sessionData = localStorage.getItem('admin_session');
      if (!sessionData) return;

      try {
        const session = JSON.parse(sessionData);
        const expiresAt = new Date(session.expires_at);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        // If session expires in less than 5 minutes, try to extend it
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          const result = await this.extendSession();
          if (result.success && result.expires_at) {
            session.expires_at = result.expires_at;
            localStorage.setItem('admin_session', JSON.stringify(session));
          }
        }

        // If session is expired, clear it and redirect to login
        if (timeUntilExpiry <= 0) {
          localStorage.removeItem('admin_session');
          // Emit custom event for session expiry
          window.dispatchEvent(new CustomEvent('admin-session-expired'));
        }
      } catch (error) {
        console.error('Session monitoring error:', error);
      }
    }, this.SESSION_CHECK_INTERVAL_MS);
  }

  stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // Utility Methods
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  getStoredSession(): AdminSession | null {
    try {
      const sessionData = localStorage.getItem('admin_session');
      if (!sessionData) return null;
      return JSON.parse(sessionData);
    } catch {
      return null;
    }
  }

  isSessionValid(): boolean {
    const session = this.getStoredSession();
    if (!session) return false;

    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    
    return now < expiresAt && session.is_active;
  }

  getTimeUntilExpiry(): number | null {
    const session = this.getStoredSession();
    if (!session) return null;

    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    
    return Math.max(0, expiresAt.getTime() - now.getTime());
  }
}

export const adminSecurityService = AdminSecurityService.getInstance();