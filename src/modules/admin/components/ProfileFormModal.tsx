// Profile Form Modal Component
// File: ProfileFormModal.tsx
// Purpose: Modal component for creating and editing profiles with validation

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, User, Phone, Mail } from 'lucide-react';
import AdminAccountService, { Profile } from '../services/adminAccountService';

interface ProfileFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
  profile?: Profile | null;
  accountId: string;
  title?: string;
}

interface FormData {
  email: string;
  full_name: string;
  role: string;
  phone: string;
  status: string;
  createLogin: boolean;
}

interface FormErrors {
  [key: string]: string[];
}

const adminAccountService = AdminAccountService.getInstance();

export const ProfileFormModal: React.FC<ProfileFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profile = null,
  accountId,
  title
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    full_name: '',
    role: 'user',
    phone: '',
    status: 'pending',
    createLogin: false
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [hasAuthUser, setHasAuthUser] = useState<boolean>(false);
  const [checkingAuthUser, setCheckingAuthUser] = useState<boolean>(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string>('');

  const isEditMode = profile !== null;
  const modalTitle = title || (isEditMode ? 'Edit Profile' : 'Create New Profile');

  // Check if auth user exists for this profile
  const checkAuthUserExists = async (email: string) => {
    setCheckingAuthUser(true);
    try {
      const exists = await adminAccountService.checkAuthUserExists(email);
      setHasAuthUser(exists);
    } catch (error) {
      console.error('Error checking auth user existence:', error);
      setHasAuthUser(false);
    } finally {
      setCheckingAuthUser(false);
    }
  };

  // Reset form when modal opens/closes or profile changes
  useEffect(() => {
    if (isOpen) {
      if (profile) {
        // Edit mode - populate with existing profile data
        setFormData({
          email: profile.email || '',
          full_name: profile.full_name || '',
          role: profile.role || 'user',
          phone: profile.phone || '',
          status: profile.status || 'pending',
          createLogin: false // Default to false in edit mode
        });
        // Check if auth user exists for this profile's email
        checkAuthUserExists(profile.email);
      } else {
        // Create mode - reset to defaults
        setFormData({
          email: '',
          full_name: '',
          role: 'user',
          phone: '',
          status: 'pending',
          createLogin: false // Default to false, user can check if desired
        });
        setHasAuthUser(false);
        setCheckingAuthUser(false);
      }
      setErrors({});
      setSubmitError('');
      setTemporaryPassword('');
    }
  }, [isOpen, profile]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});
    setSubmitError('');

    try {
      let result;
      if (isEditMode && profile) {
        // Update existing profile (createLogin checkbox is disabled in edit mode if auth user exists)
        const updateData = { ...formData };
        delete updateData.createLogin; // Remove createLogin from update data
        result = await adminAccountService.updateProfile(profile.id, updateData);
      } else {
        // Create new profile - use createProfileWithAuth if createLogin is checked
        if (formData.createLogin) {
          result = await adminAccountService.createProfileWithAuth({
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            phone: formData.phone,
            status: formData.status,
            account_id: accountId
          }, true);
          
          // Store temporary password to show to user
          if (result.success && result.temporaryPassword) {
            setTemporaryPassword(result.temporaryPassword);
          }
        } else {
          // Regular profile creation without login
          result = await adminAccountService.createProfile({
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            phone: formData.phone,
            status: formData.status,
            account_id: accountId
          });
        }
      }

      if (result.success && result.profile) {
        onSave(result.profile);
        // Don't close immediately if we created a login - show password first
        if (!formData.createLogin || isEditMode) {
          onClose();
        }
      } else {
        setSubmitError(result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
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
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              {modalTitle}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="user@example.com"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <div className="mt-1 text-sm text-red-600">
                    {errors.email.map((error, index) => (
                      <div key={index} className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+1 (555) 123-4567"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone && (
                  <div className="mt-1 text-sm text-red-600">
                    {errors.phone.map((error, index) => (
                      <div key={index} className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>

            {/* Create User Login Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">User Login</h4>
                  <p className="text-sm text-gray-500">
                    {isEditMode 
                      ? hasAuthUser 
                        ? 'This profile already has a user login associated with it.'
                        : 'Create a user login to allow this profile to sign in to the application.'
                      : 'Create a user login to allow this profile to sign in to the application.'
                    }
                  </p>
                </div>
                {checkingAuthUser && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
              </div>
              
              {/* Show checkbox only in create mode OR edit mode when no auth user exists */}
              {(!isEditMode || (isEditMode && !hasAuthUser && !checkingAuthUser)) && (
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.createLogin}
                      onChange={(e) => handleInputChange('createLogin', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Create User Login
                    </span>
                  </label>
                  {formData.createLogin && (
                    <p className="mt-2 text-sm text-blue-600">
                      A temporary password will be generated and shown after creation.
                    </p>
                  )}
                </div>
              )}

              {/* Show auth user status in edit mode */}
              {isEditMode && !checkingAuthUser && (
                <div className="mt-4 p-3 rounded-md bg-gray-50">
                  <div className="flex items-center">
                    {hasAuthUser ? (
                      <>
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-700">User login exists</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 bg-gray-400 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-700">No user login found</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Temporary Password Display */}
            {temporaryPassword && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 text-green-600">✓</div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">
                      User Login Created Successfully
                    </h4>
                    <div className="mt-2 text-sm text-green-700">
                      <p className="mb-2">The profile and user login have been created successfully.</p>
                      <div className="bg-white p-3 rounded border">
                        <p className="font-medium text-gray-900">Temporary Password:</p>
                        <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1 select-all">
                          {temporaryPassword}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          Please share this password with the user securely. They should change it on first login.
                        </p>
                      </div>
                    </div>
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {temporaryPassword ? 'Close' : 'Cancel'}
              </button>
              {!temporaryPassword && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Profile' : 'Create Profile'}
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

export default ProfileFormModal;