// Epic 3: Admin Security Handler
// File: security-handler.ts
// Purpose: Enhanced admin security framework with RBAC, session management, and security monitoring

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AdminRole {
  role: 'super_admin' | 'admin' | 'platform_admin';
  permissions: string[];
  level: number;
}

export interface SecurityEvent {
  event_type: 'login_attempt' | 'access_denied' | 'suspicious_activity' | 'session_timeout' | 'privilege_escalation' | 'data_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  timestamp: string;
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

export interface SecurityAlert {
  alert_id: string;
  alert_type: 'failed_login' | 'suspicious_ip' | 'privilege_abuse' | 'data_breach' | 'session_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  description: string;
  metadata: Record<string, any>;
  resolved: boolean;
  created_at: string;
}

// Role hierarchy and permissions
const ADMIN_ROLES: Record<string, AdminRole> = {
  super_admin: {
    role: 'super_admin',
    level: 3,
    permissions: [
      'admin:all',
      'accounts:all',
      'users:all',
      'security:all',
      'system:all',
      'billing:all',
      'reports:all',
      'platform:manage'
    ]
  },
  admin: {
    role: 'admin',
    level: 2,
    permissions: [
      'accounts:read',
      'accounts:write',
      'users:read',
      'users:write',
      'security:read',
      'reports:read',
      'platform:view'
    ]
  },
  platform_admin: {
    role: 'platform_admin',
    level: 1,
    permissions: [
      'accounts:read',
      'users:read',
      'reports:read'
    ]
  }
};

// Session timeout configuration (30 minutes)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const SESSION_EXTENSION_MS = 30 * 60 * 1000;

export async function handleSecurityOperations(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  try {
    // GET /admin-service/security/validate-session - Validate admin session
    if (method === 'GET' && url.pathname.includes('/validate-session')) {
      return await validateAdminSession(request, supabase, corsHeaders);
    }

    // POST /admin-service/security/enhance-login - Enhanced admin login
    if (method === 'POST' && url.pathname.includes('/enhance-login')) {
      return await enhanceAdminLogin(request, supabase, corsHeaders);
    }

    // POST /admin-service/security/extend-session - Extend admin session
    if (method === 'POST' && url.pathname.includes('/extend-session')) {
      return await extendAdminSession(request, supabase, corsHeaders);
    }

    // POST /admin-service/security/logout - Enhanced admin logout
    if (method === 'POST' && url.pathname.includes('/logout')) {
      return await enhanceAdminLogout(request, supabase, corsHeaders);
    }

    // GET /admin-service/security/permissions - Get user permissions
    if (method === 'GET' && url.pathname.includes('/permissions')) {
      return await getAdminPermissions(request, supabase, corsHeaders);
    }

    // POST /admin-service/security/log-event - Log security event
    if (method === 'POST' && url.pathname.includes('/log-event')) {
      return await logSecurityEvent(request, supabase, corsHeaders);
    }

    // GET /admin-service/security/alerts - Get security alerts
    if (method === 'GET' && url.pathname.includes('/alerts')) {
      return await getSecurityAlerts(request, supabase, corsHeaders);
    }

    // POST /admin-service/security/check-permissions - Check user permissions
    if (method === 'POST' && url.pathname.includes('/check-permissions')) {
      return await checkAdminPermissions(request, supabase, corsHeaders);
    }

    // GET /admin-service/security/active-sessions - Get active admin sessions
    if (method === 'GET' && url.pathname.includes('/active-sessions')) {
      return await getActiveSessions(request, supabase, corsHeaders);
    }

    // POST /admin-service/security/revoke-session - Revoke admin session
    if (method === 'POST' && url.pathname.includes('/revoke-session')) {
      return await revokeAdminSession(request, supabase, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Security endpoint not found' }), 
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Security handler error:', error);
    
    // Log security event for handler errors
    await logSecurityEvent(request, supabase, corsHeaders, {
      event_type: 'suspicious_activity',
      severity: 'medium',
      details: {
        error: error.message,
        endpoint: url.pathname,
        method: method
      }
    });

    return new Response(
      JSON.stringify({ error: 'Internal security error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function validateAdminSession(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'No user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get admin role and permissions
    const adminData = await getAdminRoleAndPermissions(supabase, user.id);
    
    if (!adminData) {
      await logSecurityEvent(request, supabase, corsHeaders, {
        event_type: 'access_denied',
        severity: 'medium',
        user_id: user.id,
        details: { reason: 'Not an admin user' }
      });

      return new Response(
        JSON.stringify({ valid: false, reason: 'Not an admin user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check session timeout
    const sessionTimeout = await checkSessionTimeout(supabase, user.id);
    
    if (sessionTimeout.expired) {
      await logSecurityEvent(request, supabase, corsHeaders, {
        event_type: 'session_timeout',
        severity: 'low',
        user_id: user.id,
        details: { last_activity: sessionTimeout.last_activity }
      });

      return new Response(
        JSON.stringify({ valid: false, reason: 'Session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last activity
    await updateSessionActivity(supabase, user.id, request);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        user: {
          id: user.id,
          email: user.email,
          role: adminData.role,
          permissions: adminData.permissions,
          session_expires_at: sessionTimeout.expires_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Session validation error:', error);
    return new Response(
      JSON.stringify({ valid: false, reason: 'Validation error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function enhanceAdminLogin(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();
    const { email, password, ip_address, user_agent } = body;

    // Attempt login
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !authData.user) {
      // Log failed login attempt
      await logSecurityEvent(request, supabase, corsHeaders, {
        event_type: 'login_attempt',
        severity: 'medium',
        details: {
          email,
          success: false,
          error: error?.message || 'No user data',
          ip_address,
          user_agent
        }
      });

      return new Response(
        JSON.stringify({ success: false, error: 'Login failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin privileges
    const adminData = await getAdminRoleAndPermissions(supabase, authData.user.id);
    
    if (!adminData) {
      await supabase.auth.signOut(); // Force logout non-admin

      await logSecurityEvent(request, supabase, corsHeaders, {
        event_type: 'access_denied',
        severity: 'high',
        user_id: authData.user.id,
        details: {
          reason: 'Non-admin login attempt',
          email,
          ip_address,
          user_agent
        }
      });

      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin session
    const session = await createAdminSession(supabase, authData.user.id, adminData, request);

    // Log successful admin login
    await logSecurityEvent(request, supabase, corsHeaders, {
      event_type: 'login_attempt',
      severity: 'low',
      user_id: authData.user.id,
      details: {
        email,
        success: true,
        role: adminData.role,
        session_id: session.session_id,
        ip_address,
        user_agent
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: adminData.role,
          permissions: adminData.permissions,
          session: session
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Enhanced login error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Login system error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function extendAdminSession(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'No active session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extend session
    const newExpiresAt = new Date(Date.now() + SESSION_EXTENSION_MS).toISOString();
    
    const { error } = await supabase
      .from('admin_sessions')
      .update({
        expires_at: newExpiresAt,
        last_activity: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Session extension error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to extend session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        expires_at: newExpiresAt,
        extended_by_ms: SESSION_EXTENSION_MS
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Session extension error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Extension error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function enhanceAdminLogout(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Deactivate admin session
      await supabase
        .from('admin_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Log logout event
      await logSecurityEvent(request, supabase, corsHeaders, {
        event_type: 'login_attempt',
        severity: 'low',
        user_id: user.id,
        details: { action: 'logout', success: true }
      });
    }

    // Sign out from Supabase
    await supabase.auth.signOut();

    return new Response(
      JSON.stringify({ success: true, message: 'Logged out successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Enhanced logout error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Logout error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getAdminPermissions(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ permissions: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminData = await getAdminRoleAndPermissions(supabase, user.id);
    
    if (!adminData) {
      return new Response(
        JSON.stringify({ permissions: [] }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        role: adminData.role,
        permissions: adminData.permissions,
        level: ADMIN_ROLES[adminData.role]?.level || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get permissions error:', error);
    return new Response(
      JSON.stringify({ permissions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function checkAdminPermissions(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();
    const { permissions: requiredPermissions } = body;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ hasPermission: false, reason: 'No user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminData = await getAdminRoleAndPermissions(supabase, user.id);
    
    if (!adminData) {
      return new Response(
        JSON.stringify({ hasPermission: false, reason: 'Not an admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasPermissions = requiredPermissions.every((perm: string) => 
      adminData.permissions.includes(perm) || adminData.permissions.includes('admin:all')
    );

    if (!hasPermissions) {
      await logSecurityEvent(request, supabase, corsHeaders, {
        event_type: 'access_denied',
        severity: 'medium',
        user_id: user.id,
        details: {
          required_permissions: requiredPermissions,
          user_permissions: adminData.permissions,
          user_role: adminData.role
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        hasPermission: hasPermissions,
        userRole: adminData.role,
        userPermissions: adminData.permissions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Check permissions error:', error);
    return new Response(
      JSON.stringify({ hasPermission: false, reason: 'Permission check error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Helper functions

async function getAdminRoleAndPermissions(supabase: any, userId: string): Promise<AdminRole | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        account:accounts!inner(type),
        admin_role
      `)
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return null;
    }

    // Check if user is in an admin account
    if (profile.account?.type !== 'admin') {
      return null;
    }

    // Get role from profile or default to 'admin'
    const role = profile.admin_role || 'admin';
    
    return ADMIN_ROLES[role] || null;
  } catch (error) {
    console.error('Error getting admin role:', error);
    return null;
  }
}

async function checkSessionTimeout(supabase: any, userId: string): Promise<{
  expired: boolean;
  last_activity?: string;
  expires_at?: string;
}> {
  try {
    const { data: session } = await supabase
      .from('admin_sessions')
      .select('last_activity, expires_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!session) {
      return { expired: true };
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    return {
      expired: now > expiresAt,
      last_activity: session.last_activity,
      expires_at: session.expires_at
    };
  } catch (error) {
    console.error('Session timeout check error:', error);
    return { expired: true };
  }
}

async function updateSessionActivity(supabase: any, userId: string, request: Request): Promise<void> {
  try {
    const now = new Date().toISOString();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await supabase
      .from('admin_sessions')
      .update({
        last_activity: now,
        ip_address: ip,
        user_agent: userAgent
      })
      .eq('user_id', userId)
      .eq('is_active', true);
  } catch (error) {
    console.error('Session activity update error:', error);
  }
}

async function createAdminSession(
  supabase: any, 
  userId: string, 
  adminData: AdminRole, 
  request: Request
): Promise<AdminSession> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS);
  const sessionId = crypto.randomUUID();
  
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const sessionData = {
    session_id: sessionId,
    user_id: userId,
    role: adminData.role,
    permissions: adminData.permissions,
    created_at: now.toISOString(),
    last_activity: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    ip_address: ip,
    user_agent: userAgent,
    is_active: true
  };

  // Deactivate any existing sessions for this user
  await supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('user_id', userId);

  // Create new session
  await supabase
    .from('admin_sessions')
    .insert(sessionData);

  return sessionData;
}

async function logSecurityEvent(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>,
  eventData?: Partial<SecurityEvent>
): Promise<void> {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const event = {
      id: crypto.randomUUID(),
      event_type: eventData?.event_type || 'suspicious_activity',
      severity: eventData?.severity || 'low',
      user_id: eventData?.user_id || null,
      ip_address: eventData?.ip_address || ip,
      user_agent: eventData?.user_agent || userAgent,
      details: eventData?.details || {},
      timestamp: new Date().toISOString(),
      ...eventData
    };

    await supabase
      .from('security_events')
      .insert(event);

    // Create alert for high/critical severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      await createSecurityAlert(supabase, event);
    }
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

async function createSecurityAlert(supabase: any, event: SecurityEvent): Promise<void> {
  try {
    const alert = {
      alert_id: crypto.randomUUID(),
      alert_type: getAlertType(event.event_type),
      severity: event.severity,
      user_id: event.user_id,
      description: generateAlertDescription(event),
      metadata: {
        original_event: event,
        ip_address: event.ip_address,
        user_agent: event.user_agent
      },
      resolved: false,
      created_at: new Date().toISOString()
    };

    await supabase
      .from('security_alerts')
      .insert(alert);
  } catch (error) {
    console.error('Error creating security alert:', error);
  }
}

function getAlertType(eventType: string): string {
  const typeMap: Record<string, string> = {
    'login_attempt': 'failed_login',
    'access_denied': 'privilege_abuse',
    'suspicious_activity': 'suspicious_ip',
    'session_timeout': 'session_anomaly',
    'privilege_escalation': 'privilege_abuse'
  };
  
  return typeMap[eventType] || 'suspicious_ip';
}

function generateAlertDescription(event: SecurityEvent): string {
  const descriptions: Record<string, string> = {
    'login_attempt': `Failed admin login attempt from ${event.ip_address}`,
    'access_denied': `Unauthorized access attempt by user ${event.user_id}`,
    'suspicious_activity': `Suspicious activity detected from ${event.ip_address}`,
    'session_timeout': `Admin session timeout for user ${event.user_id}`,
    'privilege_escalation': `Potential privilege escalation attempt by user ${event.user_id}`
  };
  
  return descriptions[event.event_type] || `Security event: ${event.event_type}`;
}

async function getSecurityAlerts(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const resolved = url.searchParams.get('resolved') === 'true';
    const severity = url.searchParams.get('severity');

    let query = supabase
      .from('security_alerts')
      .select('*')
      .eq('resolved', resolved)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: alerts, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch security alerts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ alerts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get security alerts error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getActiveSessions(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { data: sessions, error } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq('is_active', true)
      .order('last_activity', { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch active sessions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ sessions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get active sessions error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function revokeAdminSession(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();
    const { session_id, user_id } = body;

    const { error } = await supabase
      .from('admin_sessions')
      .update({ is_active: false })
      .eq('session_id', session_id)
      .eq('user_id', user_id);

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to revoke session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log session revocation
    await logSecurityEvent(request, supabase, corsHeaders, {
      event_type: 'suspicious_activity',
      severity: 'medium',
      user_id: user_id,
      details: {
        action: 'session_revoked',
        session_id: session_id,
        revoked_by: 'admin'
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Session revoked successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Revoke session error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}