import { supabase } from '../../../lib/supabase';
import { User, UserRole } from '../../shared/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  full_name: string;
  role: UserRole;
  affiliate_code?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user data returned' };
      }

      // Fetch user profile
      const profile = await this.fetchUserProfile(data.user.id);
      return { user: profile, error: null };
    } catch (error) {
      return { user: null, error: 'Login failed' };
    }
  }

  async signup(signupData: SignupData): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.full_name,
            role: signupData.role,
            affiliate_code: signupData.affiliate_code,
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user data returned' };
      }

      // Create profile in database
      const profile = await this.createUserProfile(data.user.id, signupData);
      return { user: profile, error: null };
    } catch (error) {
      return { user: null, error: 'Signup failed' };
    }
  }

  async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: 'Logout failed' };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      return await this.fetchUserProfile(user.id);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data as User, error: null };
    } catch (error) {
      return { user: null, error: 'Failed to update profile' };
    }
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error: error?.message || null };
    } catch (error) {
      return { error: 'Password reset failed' };
    }
  }

  async changePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error: error?.message || null };
    } catch (error) {
      return { error: 'Password change failed' };
    }
  }

  private async fetchUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  private async createUserProfile(userId: string, signupData: SignupData): Promise<User | null> {
    try {
      const profileData = {
        id: userId,
        email: signupData.email,
        full_name: signupData.full_name,
        role: signupData.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Role-specific fields
        ...(signupData.role === 'affiliate' && {
          affiliate_code: signupData.affiliate_code || this.generateAffiliateCode(),
          commission_rate: 0.1, // Default 10%
          clients_count: 0,
          total_proposals: 0,
        }),
        ...(signupData.role === 'admin' && {
          permissions: ['view_all_proposals', 'edit_proposals'],
          department: 'Operations',
        }),
        ...(signupData.role === 'client' && {
          affiliate_id: '',
          proposals: [],
        }),
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  private generateAffiliateCode(): string {
    return 'AF' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // Role-based access control helpers
  hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;
    
    if (user.role === 'admin') {
      return (user as any).permissions?.includes(permission) || false;
    }
    
    return false;
  }

  canAccessAdminPanel(user: User | null): boolean {
    return user?.role === 'admin';
  }

  canManageClients(user: User | null): boolean {
    return user?.role === 'affiliate' || user?.role === 'admin';
  }

  canViewProposal(user: User | null, proposalAffiliate: string): boolean {
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    if (user.role === 'affiliate') return user.id === proposalAffiliate;
    
    return false;
  }
}

export const authService = AuthService.getInstance(); 