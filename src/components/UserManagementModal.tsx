import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  XMarkIcon, 
  UserPlusIcon, 
  UserGroupIcon, 
  TrashIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onUsersUpdated?: () => void;
}

interface ClientUser {
  id: string;
  user_id: string;
  client_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface Invitation {
  id: string;
  client_id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
}

const roles = [
  { value: 'owner', label: 'Owner', description: 'Full access to all client data and settings' },
  { value: 'member', label: 'Member', description: 'Can view and edit client information' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to client information' },
  { value: 'accountant', label: 'Accountant', description: 'Financial data access and tax document management' }
];

export default function UserManagementModal({ isOpen, onClose, clientId, onUsersUpdated }: UserManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member',
    message: ''
  });

  useEffect(() => {
    if (isOpen && clientId) {
      loadUsers();
      loadInvitations();
    }
  }, [isOpen, clientId]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_users')
        .select(`
          *,
          user:profiles(id, email, full_name)
        `)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['pending', 'expired'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Failed to load invitations');
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if user is already a member
    const existingUser = users.find(u => u.user.email === inviteForm.email);
    if (existingUser) {
      toast.error('This user is already a member of this organization');
      return;
    }

    // Check if invitation already exists
    const existingInvitation = invitations.find(i => i.email === inviteForm.email && i.status === 'pending');
    if (existingInvitation) {
      toast.error('An invitation has already been sent to this email');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create invitation
      const invitationData = {
        client_id: clientId,
        email: inviteForm.email,
        role: inviteForm.role,
        invited_by: user.id,
        message: inviteForm.message
      };

      const { error } = await supabase
        .from('invitations')
        .insert(invitationData);

      if (error) throw error;

      // In a real app, you would send an email here
      // For now, we'll just show a success message
      toast.success('Invitation sent successfully');
      setInviteForm({ email: '', role: 'member', message: '' });
      setShowInviteForm(false);
      loadInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${userEmail} from this organization?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('client_id', clientId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User removed successfully');
      loadUsers();
      onUsersUpdated?.();
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation cancelled');
      loadInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      // Update expiration date
      const { error } = await supabase
        .from('invitations')
        .update({ 
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation resent successfully');
      loadInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'accepted': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'expired': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                User Management
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserGroupIcon className="h-4 w-4 inline mr-2" />
                Team Members ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invitations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4 inline mr-2" />
                Invitations ({invitations.length})
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-900">Team Members</h4>
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Invite User
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.user.full_name?.charAt(0) || user.user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.user.full_name || user.user.email}
                            </p>
                            <p className="text-sm text-gray-500">{user.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          {user.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveUser(user.user_id, user.user.email)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Remove user"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <div className="text-center py-6">
                        <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No team members found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-900">Pending Invitations</h4>
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(invitation.status)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                            <p className="text-sm text-gray-500">
                              Invited as {invitation.role} • {new Date(invitation.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {invitation.status}
                          </span>
                          <div className="flex space-x-2">
                            {invitation.status === 'pending' && (
                              <button
                                onClick={() => handleResendInvitation(invitation.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Resend
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {invitations.length === 0 && (
                      <div className="text-center py-6">
                        <PaperAirplaneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No pending invitations</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowInviteForm(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Invite New User
                  </h3>
                  <button
                    onClick={() => setShowInviteForm(false)}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      {roles.find(r => r.value === inviteForm.role)?.description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      value={inviteForm.message}
                      onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a personal message to the invitation..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleInviteUser}
                  disabled={loading || !inviteForm.email || !inviteForm.role}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
} 