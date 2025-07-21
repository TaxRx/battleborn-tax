// Epic 3: Account Form Modal Component
// File: AccountFormModal.tsx
// Purpose: Modal component for creating and editing accounts with validation

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Building, Globe, Image, Users, FileText } from 'lucide-react';
import AdminAccountService, { Account } from '../services/adminAccountService';
import ProfileManagement from './ProfileManagement';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  account?: Account | null; // null = create mode, Account = edit mode
  title?: string;
  initialTab?: 'account' | 'profiles';
}

interface FormData {
  name: string;
  type: string;
  address: string;
  website_url: string;
  logo_url: string;
  contact_email: string;
}

interface FormErrors {
  [key: string]: string[];
}

const adminAccountService = AdminAccountService.getInstance();

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  account = null,
  title,
  initialTab = 'account'
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'client',
    address: '',
    website_url: '',
    logo_url: '',
    contact_email: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'account' | 'profiles'>('account');

  const isEditMode = account !== null;
  const modalTitle = title || (isEditMode ? 'Edit Account' : 'Create New Account');

  // Reset form when modal opens/closes or account changes
  useEffect(() => {
    if (isOpen) {
      if (account) {
        // Edit mode - populate with existing account data
        setFormData({
          name: account.name || '',
          type: account.type || 'client',
          address: account.address || '',
          website_url: account.website_url || '',
          logo_url: account.logo_url || '',
          contact_email: account.contact_email || ''
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: '',
          type: 'client',
          address: '',
          website_url: '',
          logo_url: '',
          contact_email: ''
        });
      }
      setErrors({});
      setSubmitError('');
      setActiveTab(initialTab); // Use the specified initial tab
    }
  }, [isOpen, account, initialTab]);

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

  const validateForm = async (): Promise<boolean> => {
    setErrors({});
    setSubmitError('');

    const validation = await adminAccountService.validateAccountData(
      formData,
      isEditMode,
      account?.id
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const isValid = await validateForm();
      if (!isValid) return;

      let result;
      if (isEditMode && account) {
        // Update existing account
        result = await adminAccountService.updateAccount(account.id, formData);
      } else {
        // Create new account
        result = await adminAccountService.createAccount(formData);
      }

      if (result.success && result.account) {
        onSave(result.account);
        onClose();
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
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
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

          {/* Tabs - Only show for edit mode */}
          {isEditMode && (
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('account')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'account'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-2 inline" />
                  Account Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('profiles')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profiles'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2 inline" />
                  Profiles
                </button>
              </nav>
            </div>
          )}

          {/* Content */}
          {activeTab === 'account' ? (
            /* Account Info Form */
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter account name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.name.map((error, index) => (
                    <div key={index} className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Account Type *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.type ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="client">Client</option>
                <option value="affiliate">Affiliate</option>
                <option value="expert">Expert</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
              {errors.type && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.type.map((error, index) => (
                    <div key={index} className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email {formData.type !== 'admin' && '*'}
              </label>
              <input
                type="email"
                id="contact_email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contact_email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter contact email"
                disabled={isSubmitting}
              />
              {errors.contact_email && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.contact_email.map((error, index) => (
                    <div key={index} className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.type === 'admin' 
                  ? 'Optional - Admin accounts don\'t require Stripe integration'
                  : 'Required for Stripe billing integration'
                }
              </p>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address (optional)"
                disabled={isSubmitting}
              />
            </div>

            {/* Website URL */}
            <div>
              <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.website_url ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                />
              </div>
              {errors.website_url && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.website_url.map((error, index) => (
                    <div key={index} className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logo URL */}
            <div>
              <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/logo.png"
                  disabled={isSubmitting}
                />
              </div>
            </div>

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
                  Cancel
                </button>
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
                      {isEditMode ? 'Update Account' : 'Create Account'}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Profiles Tab Content */
            <div>
              {account && (
                <ProfileManagement 
                  accountId={account.id} 
                  accountName={account.name} 
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountFormModal;