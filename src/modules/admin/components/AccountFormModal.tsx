// Epic 3: Account Form Modal Component
// File: AccountFormModal.tsx
// Purpose: Modal component for creating and editing accounts with validation

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Building, Globe, Image, Users, FileText, Link, Trash2, Plus, Check } from 'lucide-react';
import AdminAccountService, { Account } from '../services/adminAccountService';
import ProfileManagement from './ProfileManagement';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  account?: Account | null; // null = create mode, Account = edit mode
  title?: string;
  initialTab?: 'account' | 'profiles' | 'client-links';
}

interface FormData {
  name: string;
  type: string;
  address: string;
  website_url: string;
  logo_url: string;
  contact_email: string;
  auto_link_new_clients: boolean;
}

interface FormErrors {
  [key: string]: string[];
}

interface ClientLink {
  id: string;
  client_id: string;
  client_name: string;
  access_level: string;
  granted_at: string;
  granted_by: string;
}

interface UnlinkedClient {
  id: string;
  full_name: string;
  email: string;
  account_name: string;
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
    type: 'affiliate',
    address: '',
    website_url: '',
    logo_url: '',
    contact_email: '',
    auto_link_new_clients: false
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'account' | 'profiles' | 'client-links'>('account');
  
  // Client Links state
  const [clientLinks, setClientLinks] = useState<ClientLink[]>([]);
  const [unlinkedClients, setUnlinkedClients] = useState<UnlinkedClient[]>([]);
  const [showAddClients, setShowAddClients] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [newAccessLevel, setNewAccessLevel] = useState('admin');
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [linksError, setLinksError] = useState<string>('');

  const isEditMode = account !== null;
  const modalTitle = title || (isEditMode ? `Edit Account - ${account?.name}` : 'Create New Account');

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
          contact_email: account.contact_email || '',
          auto_link_new_clients: account.auto_link_new_clients || false
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: '',
          type: 'affiliate',
          address: '',
          website_url: '',
          logo_url: '',
          contact_email: '',
          auto_link_new_clients: false
        });
      }
      setErrors({});
      setSubmitError('');
      setActiveTab(initialTab); // Use the specified initial tab
    }
  }, [isOpen, account, initialTab]);

  // Load client links when client-links tab is selected
  useEffect(() => {
    if (isOpen && isEditMode && activeTab === 'client-links') {
      loadClientLinks();
      loadUnlinkedClients();
    }
  }, [isOpen, isEditMode, activeTab]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'auto_link_new_clients' ? (value === 'true' || value === true) : value 
    }));
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

  // Client Links handlers
  const loadClientLinks = async () => {
    if (!account) return;
    
    setLoadingLinks(true);
    setLinksError('');
    
    try {
      const response = await adminAccountService.getAccountClientLinks(account.id);
      if (response.success) {
        setClientLinks(response.links);
      } else {
        setLinksError(response.message || 'Failed to load client links');
      }
    } catch (error) {
      setLinksError('Failed to load client links');
    } finally {
      setLoadingLinks(false);
    }
  };

  const loadUnlinkedClients = async () => {
    if (!account) return;
    
    try {
      const response = await adminAccountService.getUnlinkedClients(account.id);
      if (response.success) {
        setUnlinkedClients(response.clients);
      } else {
        console.error('Failed to load unlinked clients:', response.message);
      }
    } catch (error) {
      console.error('Failed to load unlinked clients:', error);
    }
  };

  const handleUpdateAutoLink = async (newValue: boolean) => {
    if (!account) return;
    
    try {
      const response = await adminAccountService.updateAutoLinkSetting(account.id, newValue);
      if (response.success) {
        setFormData(prev => ({ ...prev, auto_link_new_clients: newValue }));
      } else {
        setLinksError(response.message || 'Failed to update auto-link setting');
      }
    } catch (error) {
      setLinksError('Failed to update auto-link setting');
    }
  };

  const handleDeleteClientLink = async (linkId: string) => {
    if (!account) return;
    
    try {
      const response = await adminAccountService.deleteClientLink(linkId);
      if (response.success) {
        setClientLinks(prev => prev.filter(link => link.id !== linkId));
        // Reload unlinked clients to show the newly unlinked client
        await loadUnlinkedClients();
      } else {
        setLinksError(response.message || 'Failed to delete client link');
      }
    } catch (error) {
      setLinksError('Failed to delete client link');
    }
  };

  const handleUpdateAccessLevel = async (linkId: string, newAccessLevel: string) => {
    if (!account) return;
    
    try {
      const response = await adminAccountService.updateClientLinkAccess(linkId, newAccessLevel);
      if (response.success) {
        setClientLinks(prev => prev.map(link => 
          link.id === linkId ? { ...link, access_level: newAccessLevel } : link
        ));
      } else {
        setLinksError(response.message || 'Failed to update access level');
      }
    } catch (error) {
      setLinksError('Failed to update access level');
    }
  };

  const handleAddClientLinks = async () => {
    if (!account || selectedClients.size === 0) return;
    
    try {
      const response = await adminAccountService.createClientLinks(
        account.id, 
        Array.from(selectedClients), 
        newAccessLevel
      );
      
      if (response.success) {
        // Reset state
        setSelectedClients(new Set());
        setShowAddClients(false);
        setNewAccessLevel('admin');
        
        // Reload links
        await loadClientLinks();
        await loadUnlinkedClients();
      } else {
        setLinksError(response.message || 'Failed to add client links');
      }
    } catch (error) {
      setLinksError('Failed to add client links');
    }
  };

  const handleSelectAllClients = () => {
    if (selectedClients.size === unlinkedClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(unlinkedClients.map(client => client.id)));
    }
  };

  const handleToggleClientSelection = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
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
                <button
                  type="button"
                  onClick={() => setActiveTab('client-links')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'client-links'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Link className="h-4 w-4 mr-2 inline" />
                  Client Links
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
                } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={isSubmitting || isEditMode}
              >
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="affiliate">Affiliate</option>
                <option value="expert">Expert</option>
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

            {/* Auto-link to new clients checkbox - only show for operator, affiliate, expert */}
            {['operator', 'affiliate', 'expert'].includes(formData.type) && (
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.auto_link_new_clients}
                    onChange={(e) => handleInputChange('auto_link_new_clients', e.target.checked.toString())}
                    disabled={isSubmitting}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Automatically link to all new clients
                  </span>
                </label>
                {errors.auto_link_new_clients && (
                  <div className="mt-1 text-sm text-red-600">
                    {errors.auto_link_new_clients.map((error, index) => (
                      <div key={index} className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  When enabled, this account will automatically gain access to all new clients created in the system.
                </p>
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
          ) : activeTab === 'profiles' ? (
            /* Profiles Tab Content */
            <div>
              {account && (
                <ProfileManagement 
                  accountId={account.id} 
                  accountName={account.name} 
                />
              )}
            </div>
          ) : (
            /* Client Links Tab Content */
            <div className="space-y-6">
              {/* Admin Account Message */}
              {account?.type === 'admin' ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Account Access</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Admin accounts have full access to all clients in the system by default. 
                    No client link configuration is needed.
                  </p>
                  <div className="mt-4 px-4 py-2 bg-blue-50 rounded-md inline-block">
                    <p className="text-sm text-blue-800 font-medium">
                      ✓ Full access to all current and future clients
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Auto-link Setting */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Auto-link Setting</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.auto_link_new_clients}
                    onChange={(e) => handleUpdateAutoLink(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Automatically link to all new clients
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  When enabled, this account will automatically gain access to all new clients created in the system.
                </p>
              </div>

              {/* Error Message */}
              {linksError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">{linksError}</span>
                  </div>
                </div>
              )}

              {/* Linked Clients Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">Linked Clients</h3>
                  <button
                    onClick={() => setShowAddClients(true)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client Links
                  </button>
                </div>

                {loadingLinks ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading client links...</p>
                  </div>
                ) : clientLinks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Link className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-sm">No client links found</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Client Links" to get started</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Client
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Access Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Granted
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {clientLinks.map((link) => (
                            <tr key={link.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {link.client_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={link.access_level}
                                  onChange={(e) => handleUpdateAccessLevel(link.id, e.target.value)}
                                  className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="view">View</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(link.granted_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to remove this client link?')) {
                                      handleDeleteClientLink(link.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  title="Remove Link"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Client Links Modal */}
              {showAddClients && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAddClients(false)} />
                    
                    <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Add Client Links</h3>
                        <button
                          onClick={() => setShowAddClients(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Access Level Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Access Level for Selected Clients
                          </label>
                          <select
                            value={newAccessLevel}
                            onChange={(e) => setNewAccessLevel(e.target.value)}
                            className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="view">View</option>
                          </select>
                        </div>

                        {/* Client Selection */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                              Select Clients to Link
                            </label>
                            <button
                              onClick={handleSelectAllClients}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              {selectedClients.size === unlinkedClients.length ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          
                          {unlinkedClients.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <p className="text-sm">No unlinked clients available</p>
                            </div>
                          ) : (
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                              {unlinkedClients.map((client) => (
                                <label key={client.id} className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                                  <input
                                    type="checkbox"
                                    checked={selectedClients.has(client.id)}
                                    onChange={() => handleToggleClientSelection(client.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{client.full_name}</p>
                                    <p className="text-xs text-gray-500">{client.email}</p>
                                    <p className="text-xs text-gray-400">{client.account_name}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setShowAddClients(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddClientLinks}
                            disabled={selectedClients.size === 0}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Add {selectedClients.size} Client{selectedClients.size !== 1 ? 's' : ''}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountFormModal;