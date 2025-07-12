import { supabase } from '../lib/supabase';

export interface InvitationRequest {
  clientId: string;
  email: string;
  role: 'owner' | 'member' | 'viewer' | 'accountant';
  message?: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  message?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  resent_count: number;
  last_resent_at?: string;
  client: {
    id: string;
    full_name: string;
  }[];
  inviter: {
    id: string;
    full_name: string;
    email: string;
  }[];
}

export class InvitationService {
  static async sendInvitation(invitationData: InvitationRequest): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(invitationData),
      });

      const result = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: result.error || 'Failed to send invitation' 
        };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Send invitation error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async getInvitations(clientId: string): Promise<{
    success: boolean;
    data?: Invitation[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          role,
          status,
          message,
          expires_at,
          created_at,
          updated_at,
          resent_count,
          last_resent_at,
          client:clients(id, full_name),
          inviter:profiles!invited_by(id, full_name, email)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get invitations error:', error);
        return { success: false, error: 'Failed to fetch invitations' };
      }

      return { success: true, data: data as Invitation[] };
    } catch (error) {
      console.error('Get invitations error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async resendInvitation(invitationId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Get the invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('client_id, email, role, message')
        .eq('id', invitationId)
        .eq('status', 'pending')
        .single();

      if (fetchError || !invitation) {
        return { success: false, error: 'Invitation not found or already processed' };
      }

      // Update resent count and timestamp
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          last_resent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) {
        console.error('Update invitation error:', updateError);
        return { success: false, error: 'Failed to update invitation' };
      }

      // Send the invitation again
      const sendResult = await this.sendInvitation({
        clientId: invitation.client_id,
        email: invitation.email,
        role: invitation.role,
        message: invitation.message
      });

      return sendResult;
    } catch (error) {
      console.error('Resend invitation error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async cancelInvitation(invitationId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('status', 'pending');

      if (error) {
        console.error('Cancel invitation error:', error);
        return { success: false, error: 'Failed to cancel invitation' };
      }

      return { success: true };
    } catch (error) {
      console.error('Cancel invitation error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async expireOldInvitations(): Promise<{
    success: boolean;
    expiredCount?: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('expire_old_invitations');

      if (error) {
        console.error('Expire invitations error:', error);
        return { success: false, error: 'Failed to expire invitations' };
      }

      return { success: true, expiredCount: data };
    } catch (error) {
      console.error('Expire invitations error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static formatRole(role: string): string {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'member':
        return 'Member';
      case 'viewer':
        return 'Viewer';
      case 'accountant':
        return 'Accountant';
      default:
        return role;
    }
  }

  static getRoleColor(role: string): string {
    switch (role) {
      case 'owner':
        return 'bg-red-100 text-red-800';
      case 'member':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      case 'accountant':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  static getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
} 