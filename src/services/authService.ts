import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'user';
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientUser {
  id: string;
  client_id: string;
  user_id: string;
  role: 'owner' | 'member' | 'viewer' | 'accountant';
  invited_by?: string;
  invited_at?: string;
  accepted_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    filing_status: string;
    home_address?: string;
    state?: string;
    dependents?: number;
    created_at: string;
    updated_at: string;
  };
}

export interface AuthUser {
  profile: UserProfile;
  clientUsers: ClientUser[];
  isAdmin: boolean;
  isClientUser: boolean;
  primaryClientRole?: 'owner' | 'member' | 'viewer' | 'accountant';
  permissions: string[];
}

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Get current Supabase user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return null;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Get client user relationships
      const { data: clientUsers, error: clientUsersError } = await supabase
        .from('client_users')
        .select(`
          *,
          client:clients (
            id,
            full_name,
            email,
            phone,
            filing_status,
            home_address,
            state,
            dependents,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (clientUsersError) {
        console.error('Error fetching client users:', clientUsersError);
        return null;
      }

      const isAdmin = profile.role === 'admin' || profile.is_admin;
      const isClientUser = clientUsers && clientUsers.length > 0;
      const primaryClientRole = clientUsers && clientUsers.length > 0 ? clientUsers[0].role : undefined;

      // Generate permissions based on roles
      const permissions = this.generatePermissions(isAdmin, clientUsers || []);

      return {
        profile,
        clientUsers: clientUsers || [],
        isAdmin,
        isClientUser,
        primaryClientRole,
        permissions
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  private generatePermissions(isAdmin: boolean, clientUsers: ClientUser[]): string[] {
    const permissions: string[] = [];

    // Admin permissions
    if (isAdmin) {
      permissions.push(
        'admin:view_all_clients',
        'admin:manage_clients',
        'admin:view_all_proposals',
        'admin:manage_proposals',
        'admin:system_settings',
        'admin:user_management'
      );
    }

    // Client user permissions
    clientUsers.forEach(clientUser => {
      const clientId = clientUser.client_id;
      
      switch (clientUser.role) {
        case 'owner':
          permissions.push(
            `client:${clientId}:full_access`,
            `client:${clientId}:manage_users`,
            `client:${clientId}:invite_users`,
            `client:${clientId}:view_financials`,
            `client:${clientId}:edit_profile`,
            `client:${clientId}:view_documents`,
            `client:${clientId}:upload_documents`,
            `client:${clientId}:view_proposals`,
            `client:${clientId}:approve_proposals`
          );
          break;
        case 'member':
          permissions.push(
            `client:${clientId}:view_profile`,
            `client:${clientId}:view_documents`,
            `client:${clientId}:upload_documents`,
            `client:${clientId}:view_proposals`
          );
          break;
        case 'viewer':
          permissions.push(
            `client:${clientId}:view_profile`,
            `client:${clientId}:view_documents`,
            `client:${clientId}:view_proposals`
          );
          break;
        case 'accountant':
          permissions.push(
            `client:${clientId}:view_profile`,
            `client:${clientId}:view_financials`,
            `client:${clientId}:view_documents`,
            `client:${clientId}:upload_documents`,
            `client:${clientId}:view_proposals`,
            `client:${clientId}:edit_financials`
          );
          break;
      }
    });

    return permissions;
  }

  hasPermission(user: AuthUser | null, permission: string): boolean {
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  canAccessClient(user: AuthUser | null, clientId: string): boolean {
    if (!user) return false;
    
    // Admin can access all clients
    if (user.isAdmin) return true;
    
    // Check if user has any permission for this client
    return user.permissions.some(p => p.startsWith(`client:${clientId}:`));
  }

  canManageClientUsers(user: AuthUser | null, clientId: string): boolean {
    if (!user) return false;
    
    // Admin can manage all
    if (user.isAdmin) return true;
    
    // Client owner can manage users
    return user.permissions.includes(`client:${clientId}:manage_users`);
  }

  canInviteUsers(user: AuthUser | null, clientId: string): boolean {
    if (!user) return false;
    
    // Admin can invite to any client
    if (user.isAdmin) return true;
    
    // Client owner can invite users
    return user.permissions.includes(`client:${clientId}:invite_users`);
  }

  getClientRole(user: AuthUser | null, clientId: string): 'owner' | 'member' | 'viewer' | 'accountant' | null {
    if (!user) return null;
    
    const clientUser = user.clientUsers.find(cu => cu.client_id === clientId);
    return clientUser ? clientUser.role : null;
  }

  getAccessibleClients(user: AuthUser | null): ClientUser[] {
    if (!user) return [];
    
    // Admin can access all clients (would need separate query)
    if (user.isAdmin) {
      // For now, return client users - in full implementation, 
      // we'd query all clients for admin
      return user.clientUsers;
    }
    
    return user.clientUsers;
  }

  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, error: error.message };
      }

      // Get full user data
      const authUser = await this.getCurrentUser();
      return { user: authUser, error: null };
    } catch (error) {
      return { user: null, error: 'Login failed' };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: 'Logout failed' };
    }
  }

  // Helper method to determine where to redirect user after login
  getRedirectPath(user: AuthUser): string {
    // Admin goes to admin dashboard
    if (user.isAdmin) {
      return '/admin';
    }
    
    // Client users go to client dashboard
    if (user.isClientUser && user.clientUsers.length > 0) {
      return '/client';
    }
    
    // Default fallback
    return '/dashboard';
  }

  // Helper method to get user display name
  getUserDisplayName(user: AuthUser): string {
    if (user.profile.full_name) {
      return user.profile.full_name;
    }
    
    return user.profile.email;
  }

  // Helper method to get user's primary client
  getPrimaryClient(user: AuthUser): ClientUser | null {
    if (!user.isClientUser || user.clientUsers.length === 0) {
      return null;
    }
    
    // Return the first owner role, or first client if no owner
    const ownerClient = user.clientUsers.find(cu => cu.role === 'owner');
    return ownerClient || user.clientUsers[0];
  }
}

export const authService = AuthService.getInstance();
export default authService; 