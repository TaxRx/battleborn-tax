import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'user';
  account_id: string;
  created_at: string;
  updated_at: string;
  account?: {
    id: string;
    name: string;
    type: 'admin' | 'operator' | 'affiliate' | 'client' | 'expert';
    stripe_customer_id?: string;
  };
}

export interface Client {
  id: string;
  account_id: string;
  full_name: string;
  email: string;
  phone?: string;
  filing_status: string;
  home_address?: string;
  state?: string;
  dependents?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  profile: UserProfile;
  clients: Client[];
  isAdmin: boolean;
  isClientUser: boolean;
  isPlatformUser: boolean;
  isAffiliateUser: boolean;
  isExpertUser: boolean;
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
      // Get current Supabase user session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return null;

      // Get current session to extract token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return null;

      // Call user-service get-profile endpoint
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'http://localhost:54321/functions/v1';
      const response = await fetch(`${functionsUrl}/user-service/get-profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch profile from user-service:', response.status);
        return null;
      }

      const data = await response.json();
      if (!data.profile) {
        console.error('Invalid response from user-service:', data);
        return null;
      }

      // Transform the user data from service into AuthUser format
      const profile = data.profile;
      const accountType = profile.account?.type;

      // Fetch clients for this account (with safety check)
      const clients = profile.account_id ? await this.getClientsForAccount(profile.account_id) : [];

      // Use account type or default to client
      const determinedAccountType = accountType || 'client';

      // Determine user types based on account type
      const isAdmin = determinedAccountType === 'admin';
      const isPlatformUser = determinedAccountType === 'operator';
      const isAffiliateUser = determinedAccountType === 'affiliate';
      const isExpertUser = determinedAccountType === 'expert';
      const isClientUser = determinedAccountType === 'client' || (clients && clients.length > 0);

      // Generate permissions
      const permissions = this.generatePermissions({
        isAdmin,
        isPlatformUser,
        isAffiliateUser,
        isExpertUser,
        isClientUser,
        accountType: determinedAccountType
      }, clients || []);

      return {
        profile,
        clients: clients || [],
        isAdmin,
        isClientUser,
        isPlatformUser,
        isAffiliateUser,
        isExpertUser,
        permissions
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Method to fetch clients for an account
  private async getClientsForAccount(accountId: string): Promise<Client[]> {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('account_id', accountId);

      if (error) {
        console.error('Error fetching clients for account:', error);
        return [];
      }

      return clients || [];
    } catch (error) {
      console.error('Error fetching clients for account:', error);
      return [];
    }
  }

  private generatePermissions(userTypes: {
    isAdmin: boolean;
    isPlatformUser: boolean;
    isAffiliateUser: boolean;
    isExpertUser: boolean;
    isClientUser: boolean;
    accountType?: string;
  }, clients: Client[]): string[] {
    const permissions: string[] = [];

    // Admin permissions - full platform access
    if (userTypes.isAdmin) {
      permissions.push(
        'admin:view_all_accounts',
        'admin:manage_accounts',
        'admin:view_all_clients',
        'admin:manage_clients',
        'admin:view_all_proposals',
        'admin:manage_proposals',
        'admin:system_settings',
        'admin:user_management',
        'admin:billing_management'
      );
    }

    // Platform user permissions - service fulfillment
    if (userTypes.isPlatformUser) {
      permissions.push(
        'operator:view_clients',
        'operator:manage_clients',
        'operator:create_proposals',
        'operator:view_billing',
        'operator:manage_affiliates'
      );
    }

    // Affiliate user permissions - sales and referrals
    if (userTypes.isAffiliateUser) {
      permissions.push(
        'affiliate:view_clients',
        'affiliate:refer_clients',
        'affiliate:view_commissions',
        'affiliate:create_proposals'
      );
    }

    // Expert user permissions - consulting
    if (userTypes.isExpertUser) {
      permissions.push(
        'expert:view_assigned_clients',
        'expert:provide_consultation',
        'expert:create_reports'
      );
    }

    // Client permissions - since user belongs to account, they have full access to all clients in that account
    clients.forEach(client => {
      const clientId = client.id;
      
      // Full access to all clients in the same account
      permissions.push(
        `client:${clientId}:full_access`,
        `client:${clientId}:manage_users`,
        `client:${clientId}:invite_users`,
        `client:${clientId}:view_financials`,
        `client:${clientId}:edit_profile`,
        `client:${clientId}:view_documents`,
        `client:${clientId}:upload_documents`,
        `client:${clientId}:view_proposals`,
        `client:${clientId}:approve_proposals`,
        `client:${clientId}:edit_financials`
      );
    });

    return permissions;
  }

  hasPermission(user: AuthUser | null, permission: string): boolean {
    if (!user) return false;
    return user.permissions.includes(permission);
  }



  canManageClientUsers(user: AuthUser | null, clientId: string): boolean {
    if (!user) return false;
    
    // Admin can manage all
    if (user.isAdmin) return true;
    
    // Users have full access to clients in their account
    return user.permissions.includes(`client:${clientId}:manage_users`);
  }

  canInviteUsers(user: AuthUser | null, clientId: string): boolean {
    if (!user) return false;
    
    // Admin can invite to any client
    if (user.isAdmin) return true;
    
    // Users can invite to clients in their account
    return user.permissions.includes(`client:${clientId}:invite_users`);
  }

  getAccessibleClients(user: AuthUser | null): Client[] {
    if (!user) return [];
    
    // Return all clients in the user's account
    return user.clients;
  }

  // Helper method to check if client belongs to user's account
  canAccessClient(user: AuthUser | null, clientId: string): boolean {
    if (!user) return false;
    
    // Admin can access all clients
    if (user.isAdmin) return true;
    
    // Check if client is in user's account
    return user.clients.some(client => client.id === clientId);
  }

  async signIn(email: string, password: string, setUserCallback?: (user: any) => void): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Call user-service login endpoint
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'http://localhost:54321/functions/v1';
      const response = await fetch(`${functionsUrl}/user-service/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('signIn Details', {data})
      if (!response.ok) {
        return { user: null, error: data.error || 'Login failed' };
      }

      if (!data.success || !data.session) {
        return { user: null, error: 'Login failed - invalid response' };
      }

      // Set the session in Supabase client
      console.log('Calling setSession')
      const { data: sessionData,error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
      console.log('sessionDetails', {sessionData, sessionError})
      if (sessionError) {
        return { user: null, error: 'Failed to set session' };
      }
      
      // Call the setUser callback immediately so user data is available before redirect
      if (setUserCallback) {
        const extendedUser = {
          id: sessionData.user.id,
          email: sessionData.user.email || '',
          profile: data.user.profile,
          account: data.user.profile?.account || undefined
        };
        setUserCallback(extendedUser);
      }
      // Transform the user data from service into AuthUser format
      const profile = data.user.profile;
      const accountType = profile.account?.type;

      // Fetch clients for this account (with safety check)
      const clients = profile.account_id ? await this.getClientsForAccount(profile.account_id) : [];

      // Use account type or default to client
      const determinedAccountType = accountType || 'client';

      // Determine user types based on account type
      const isAdmin = determinedAccountType === 'admin';
      const isPlatformUser = determinedAccountType === 'operator';
      const isAffiliateUser = determinedAccountType === 'affiliate';
      const isExpertUser = determinedAccountType === 'expert';
      const isClientUser = determinedAccountType === 'client' || (clients && clients.length > 0);

      // Generate permissions
      const permissions = this.generatePermissions({
        isAdmin,
        isPlatformUser,
        isAffiliateUser,
        isExpertUser,
        isClientUser,
        accountType: determinedAccountType
      }, clients || []);

      const authUser: AuthUser = {
        profile,
        clients: clients || [],
        isAdmin,
        isClientUser,
        isPlatformUser,
        isAffiliateUser,
        isExpertUser,
        permissions
      };

      return { user: authUser, error: null };
    } catch (error) {
      console.error('Login error:', error);
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
    
    // Platform users go to partner dashboard
    if (user.isPlatformUser) {
      return '/operator';
    }
    
    // Affiliate users go to affiliate dashboard
    if (user.isAffiliateUser) {
      return '/affiliate';
    }
    
    // Expert users go to expert dashboard
    if (user.isExpertUser) {
      return '/expert';
    }
    
    // Client users go to client dashboard
    if (user.isClientUser && user.clients?.length > 0) {
      return '/client';
    }
    
    // Default fallback based on account type
    const accountType = user.profile.account?.type;
    switch (accountType) {
      case 'operator': return '/operator';
      case 'affiliate': return '/affiliate';
      case 'expert': return '/expert';
      case 'client': return '/client';
      default: return '/dashboard';
    }
  }

  // Helper method to get user display name
  getUserDisplayName(user: AuthUser): string {
    if (user.profile.full_name) {
      return user.profile.full_name;
    }
    
    return user.profile.email;
  }

  // Helper method to get user's primary client
  getPrimaryClient(user: AuthUser): Client | null {
    if (!user.isClientUser || !user.clients || user.clients.length === 0) {
      return null;
    }
    
    // Return the first client (since all clients in account have equal access)
    return user.clients[0];
  }
}

export const authService = AuthService.getInstance();
export default authService; 