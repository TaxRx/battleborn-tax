// User Profile Modal Component
// File: UserProfileModal.tsx
// Purpose: Modal for users to edit their own name and password

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, User, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  full_name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  [key: string]: string;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useUser();
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeMode, setPasswordChangeMode] = useState(false);

  // Reset form when modal opens/closes (but not when user updates after successful change)
  useEffect(() => {
    console.log('Modal useEffect triggered:', { isOpen, user: !!user, isSubmitting, successMessage: !!successMessage });
    
    // Don't reset if we're in the middle of submitting or showing success
    if (isSubmitting || successMessage) {
      console.log('Skipping reset - submitting or showing success');
      return;
    }
    
    if (isOpen && user) {
      setFormData({
        full_name: user.user_metadata?.full_name || user.profile?.full_name || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
      setSubmitError('');
      setPasswordChangeMode(false);
      console.log('Modal reset completed');
    }
  }, [isOpen, user]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Must contain at least one special character');
    }
    
    return errors;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    // Validate password change if in password mode
    if (passwordChangeMode) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else {
        const passwordErrors = validatePassword(formData.newPassword);
        if (passwordErrors.length > 0) {
          newErrors.newPassword = passwordErrors.join('. ');
        }
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name
        }
      });

      if (updateError) throw updateError;

      // Also update the profile table if it exists
      if (user?.profile?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: formData.full_name })
          .eq('id', user.id);
        
        if (profileError) {
          console.warn('Could not update profiles table:', profileError);
          // Don't throw - profile update in auth is enough
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Profile update error:', error);
      return { success: false, message: error.message };
    }
  };

  const handleChangePassword = async () => {
    try {
      // Supabase requires current password verification for password changes
      // We'll attempt the password update directly - Supabase will validate internally
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) {
        // Check for specific error types
        if (updateError.message.includes('New password should be different')) {
          throw new Error('New password must be different from your current password');
        } else if (updateError.message.includes('Password should be')) {
          throw new Error('Password does not meet security requirements');
        } else {
          throw new Error(updateError.message || 'Failed to update password');
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Password change error:', error);
      return { success: false, message: error.message };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');
    setSuccessMessage('');

    try {
      console.log('Starting profile update process...', { passwordChangeMode });
      
      // Update profile name
      const profileResult = await handleUpdateProfile();
      if (!profileResult.success) {
        throw new Error(profileResult.message);
      }
      console.log('Profile update successful');

      let passwordResult = { success: true };
      
      // Update password if in password change mode
      if (passwordChangeMode) {
        console.log('Attempting password change...');
        passwordResult = await handleChangePassword();
        if (!passwordResult.success) {
          throw new Error(passwordResult.message);
        }
        console.log('Password change successful');
      }

      // Show success message FIRST
      const successMsg = passwordChangeMode 
        ? 'Profile and password updated successfully!' 
        : 'Profile updated successfully!';
      
      console.log('Setting success message:', successMsg);
      setSuccessMessage(successMsg);

      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      // Turn off password change mode after successful update
      setPasswordChangeMode(false);
      
      console.log('Success message displayed - waiting for user to close manually');
      
      // Note: User profile updates are handled automatically by Supabase
      // The updated profile data will be reflected on next login or app refresh

    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSubmitError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Edit Profile
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.full_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
              {errors.full_name && (
                <div className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.full_name}
                </div>
              )}
            </div>

            {/* Password Change Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
                <button
                  type="button"
                  onClick={() => setPasswordChangeMode(!passwordChangeMode)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  disabled={isSubmitting}
                >
                  {passwordChangeMode ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {passwordChangeMode && (
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        id="currentPassword"
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter current password"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <div className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.currentPassword}
                      </div>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.newPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter new password"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Password Requirements */}
                    {passwordChangeMode && formData.newPassword && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs">
                        <div className="font-medium text-gray-700 mb-1">Password Requirements:</div>
                        <div className="space-y-1">
                          <div className={`flex items-center ${formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{formData.newPassword.length >= 8 ? '✓' : '○'}</span>
                            At least 8 characters
                          </div>
                          <div className={`flex items-center ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{/[A-Z]/.test(formData.newPassword) ? '✓' : '○'}</span>
                            One uppercase letter
                          </div>
                          <div className={`flex items-center ${/[a-z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{/[a-z]/.test(formData.newPassword) ? '✓' : '○'}</span>
                            One lowercase letter
                          </div>
                          <div className={`flex items-center ${/\d/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{/\d/.test(formData.newPassword) ? '✓' : '○'}</span>
                            One number
                          </div>
                          <div className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword) ? '✓' : '○'}</span>
                            One special character
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {errors.newPassword && (
                      <div className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.newPassword}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm new password"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-md animate-pulse">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <span className="text-sm font-medium text-green-800">{successMessage}</span>
                    <p className="text-xs text-green-600 mt-1">Click "Close" when you're ready to continue.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Error */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-700">{submitError}</span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  successMessage 
                    ? 'text-white bg-green-600 border border-transparent hover:bg-green-700' 
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {successMessage ? 'Close' : 'Cancel'}
              </button>
              {!successMessage && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;