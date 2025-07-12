import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Mail, CheckCircle, XCircle, RefreshCw, Users, Shield } from 'lucide-react';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  message?: string;
  expires_at: string;
  client: {
    full_name: string;
    email: string;
  }[];
  inviter: {
    full_name: string;
    email: string;
  }[];
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'error'>('loading');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [needsAccount, setNeedsAccount] = useState(false);

  useEffect(() => {
    const validateInvitation = async () => {
      try {
        const token = searchParams.get('token');
        if (!token) {
          setStatus('invalid');
          setLoading(false);
          return;
        }

        // Get invitation details
        const { data: invitationData, error } = await supabase
          .from('invitations')
          .select(`
            id,
            email,
            role,
            message,
            expires_at,
            status,
            client:clients(full_name, email),
            inviter:profiles!invited_by(full_name, email)
          `)
          .eq('token', token)
          .single();

        if (error || !invitationData) {
          console.error('Error fetching invitation:', error);
          setStatus('invalid');
          setLoading(false);
          return;
        }

        // Check if invitation is still valid
        const now = new Date();
        const expiresAt = new Date(invitationData.expires_at);

        if (invitationData.status !== 'pending') {
          setStatus('accepted');
          setLoading(false);
          return;
        }

        if (expiresAt <= now) {
          setStatus('expired');
          setLoading(false);
          return;
        }

        // Check if user needs to create an account
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setNeedsAccount(true);
        } else {
          // Check if user's email matches invitation email
          if (user.email !== invitationData.email) {
            toast.error('This invitation is for a different email address. Please sign out and create an account with the invited email.');
            setStatus('error');
            setLoading(false);
            return;
          }
        }

        setInvitation(invitationData);
        setStatus('valid');
        setLoading(false);

      } catch (error) {
        console.error('Invitation validation error:', error);
        setStatus('error');
        setLoading(false);
      }
    };

    validateInvitation();
  }, [searchParams]);

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    setAccepting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to accept this invitation');
        setAccepting(false);
        return;
      }

      // Call the accept_invitation function
      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: searchParams.get('token'),
        user_id: user.id
      });

      if (error) {
        console.error('Error accepting invitation:', error);
        toast.error('Failed to accept invitation');
        setAccepting(false);
        return;
      }

      if (!data.success) {
        toast.error(data.error || 'Failed to accept invitation');
        setAccepting(false);
        return;
      }

      toast.success(`Successfully joined ${data.client_name} as ${data.role}`);
      setStatus('accepted');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Accept invitation error:', error);
      toast.error('Failed to accept invitation');
      setAccepting(false);
    }
  };

  const handleCreateAccount = () => {
    // Store the invitation token in localStorage to retrieve after account creation
    localStorage.setItem('invitation_token', searchParams.get('token') || '');
    navigate('/register');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'member':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'viewer':
        return <Mail className="h-5 w-5 text-green-500" />;
      case 'accountant':
        return <Shield className="h-5 w-5 text-purple-500" />;
      default:
        return <Users className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Full access to manage the client account and invite others';
      case 'member':
        return 'Can view and edit client information';
      case 'viewer':
        return 'Can view client information but cannot make changes';
      case 'accountant':
        return 'Full access to financial information and tax documents';
      default:
        return 'Team member access';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {status === 'valid' && invitation && (
            <>
              <Users className="mx-auto h-16 w-16 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Invitation</h2>
              
                              <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">You've been invited to join:</p>
                  <p className="font-semibold text-gray-900 text-lg">{invitation.client[0]?.full_name}</p>
                  <p className="text-sm text-gray-600 mt-2">by {invitation.inviter[0]?.full_name}</p>
                
                <div className="flex items-center mt-4 p-3 bg-white rounded border">
                  {getRoleIcon(invitation.role)}
                  <div className="ml-3">
                    <p className="font-medium text-gray-900 capitalize">{invitation.role}</p>
                    <p className="text-sm text-gray-600">{getRoleDescription(invitation.role)}</p>
                  </div>
                </div>

                {invitation.message && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-gray-700">
                      <strong>Personal message:</strong> "{invitation.message}"
                    </p>
                  </div>
                )}
              </div>

              {needsAccount ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    You'll need to create an account with <strong>{invitation.email}</strong> to accept this invitation.
                  </p>
                  <button
                    onClick={handleCreateAccount}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Account & Accept Invitation
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handleAcceptInvitation}
                    disabled={accepting}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {accepting ? (
                      <>
                        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Invitation
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              )}
            </>
          )}

          {status === 'accepted' && (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
              <p className="text-gray-600 mb-6">
                You've successfully joined the team. Redirecting to dashboard...
              </p>
            </>
          )}

          {status === 'invalid' && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
              <p className="text-gray-600 mb-6">
                This invitation link is not valid. Please check the link or contact the person who invited you.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Sign In
              </button>
            </>
          )}

          {status === 'expired' && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Expired</h2>
              <p className="text-gray-600 mb-6">
                This invitation has expired. Please request a new invitation from the team owner.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Sign In
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">
                There was an error processing your invitation. Please try again or contact support.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 