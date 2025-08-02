// Password Management Modal Component
// File: PasswordManagementModal.tsx
// Purpose: Modal for admin to manage user passwords - direct change or reset email

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  User,
  Send,
  Lock
} from 'lucide-react';
import { Profile } from '../services/adminAccountService';
import PasswordStrengthMeter, { validatePasswordStrength } from '../../../components/PasswordStrengthMeter';

interface PasswordManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
}

type ActionType = 'direct' | 'email';

export const PasswordManagementModal: React.FC<PasswordManagementModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  const [actionType, setActionType] = useState<ActionType>('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidPassword, setIsValidPassword] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActionType('email');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setError('');
      setSuccess('');
      setIsValidPassword(false);
    }
  }, [isOpen]);

  const handlePasswordStrengthChange = (strength: number, isValid: boolean) => {
    setIsValidPassword(isValid);
  };

  const handleDirectPasswordChange = async () => {
    if (!profile) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Validate password strength
      const { isValid, failedRequirements } = validatePasswordStrength(newPassword);
      if (!isValid) {
        throw new Error(`Password does not meet requirements: ${failedRequirements.join(', ')}`);
      }

      // Check if passwords match
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Get current auth session for admin authorization
      const { supabase } = await import('../../../lib/supabase');
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.access_token) {
        throw new Error('Authentication required');
      }

      // Call admin service to update user password
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-service/update-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          pathname: '/admin-service/update-user-password',
          userId: profile.id,
          newPassword: newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update password');
      }

      setSuccess('Password updated successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Password update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!profile) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Call the password reset service
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-service/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: profile.email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reset email');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to send reset email');
      }

      setSuccess('Password reset email sent successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Password reset email error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (actionType === 'direct') {
      await handleDirectPasswordChange();
    } else {
      await handleSendResetEmail();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Key className="h-5 w-5 mr-2 text-blue-600" />
              Manage Password
            </h3>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || profile.email}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <User className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {profile.full_name || 'No name'}
              </div>
              <div className="text-sm text-gray-500">{profile.email}</div>
            </div>
          </div>

          {/* Action Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Action
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="actionType"
                  value="email"
                  checked={actionType === 'email'}
                  onChange={(e) => setActionType(e.target.value as ActionType)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">Send Reset Email</span>
                  </div>
                  <p className="text-sm text-gray-500">User will receive an email to reset their password</p>
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="actionType"
                  value="direct"
                  checked={actionType === 'direct'}
                  onChange={(e) => setActionType(e.target.value as ActionType)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">Set New Password</span>
                  </div>
                  <p className="text-sm text-gray-500">Directly set a new password for the user</p>
                </div>
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Direct Password Fields */}
            {actionType === 'direct' && (
              <div className="space-y-4">
                {/* New Password */}
                <div className="relative">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Strength Meter */}
                <PasswordStrengthMeter 
                  password={newPassword} 
                  onStrengthChange={handlePasswordStrengthChange}
                />

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="flex items-center space-x-2">
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                      newPassword === confirmPassword ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <span className={`text-xs ${
                        newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {newPassword === confirmPassword ? '✓' : '✗'}
                      </span>
                    </div>
                    <span className={`text-sm ${
                      newPassword === confirmPassword ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm text-green-700">{success}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isLoading || 
                  (actionType === 'direct' && (!isValidPassword || newPassword !== confirmPassword))
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {actionType === 'direct' ? 'Updating...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    {actionType === 'direct' ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Update Password
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reset Email
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordManagementModal;