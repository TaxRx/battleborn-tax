import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  XMarkIcon, 
  UserIcon, 
  BuildingOfficeIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  DocumentTextIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onProfileUpdated?: () => void;
}

interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  filing_status: string;
  state: string;
  dependents: number;
  home_address?: string;
  created_at: string;
  updated_at: string;
}

interface BusinessInfo {
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  entity_type?: string;
  ein?: string;
  industry?: string;
  annual_revenue?: number;
  employee_count?: number;
}

const filingStatuses = [
  { value: 'single', label: 'Single' },
  { value: 'married_filing_jointly', label: 'Married Filing Jointly' },
  { value: 'married_filing_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
  { value: 'qualifying_widow', label: 'Qualifying Widow(er)' }
];

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const entityTypes = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'llc', label: 'Limited Liability Company (LLC)' },
  { value: 's_corp', label: 'S Corporation' },
  { value: 'c_corp', label: 'C Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' }
];

export default function ClientProfileModal({ isOpen, onClose, clientId, onProfileUpdated }: ClientProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'security'>('personal');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({});
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (isOpen && clientId) {
      loadClientProfile();
    }
  }, [isOpen, clientId]);

  const loadClientProfile = async () => {
    setLoading(true);
    try {
      // Load client profile
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;
      setProfile(clientData);

      // Load business information from tax_profiles if it exists
      const { data: taxProfileData, error: taxProfileError } = await supabase
        .from('tax_profiles')
        .select('business_name, business_address, business_phone, business_email, entity_type, ein, industry, annual_revenue, employee_count')
        .eq('client_id', clientId)
        .maybeSingle();

      if (taxProfileData) {
        setBusinessInfo({
          business_name: taxProfileData.business_name || '',
          business_address: taxProfileData.business_address || '',
          business_phone: taxProfileData.business_phone || '',
          business_email: taxProfileData.business_email || '',
          entity_type: taxProfileData.entity_type || '',
          ein: taxProfileData.ein || '',
          industry: taxProfileData.industry || '',
          annual_revenue: taxProfileData.annual_revenue || 0,
          employee_count: taxProfileData.employee_count || 0
        });
      }
    } catch (error) {
      console.error('Error loading client profile:', error);
      toast.error('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      // Update client profile
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          filing_status: profile.filing_status,
          state: profile.state,
          dependents: profile.dependents,
          home_address: profile.home_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (clientError) throw clientError;

      // Update or create tax profile for business info
      if (Object.values(businessInfo).some(value => value)) {
        const { error: taxProfileError } = await supabase
          .from('tax_profiles')
          .upsert({
            client_id: clientId,
            business_name: businessInfo.business_name,
            business_address: businessInfo.business_address,
            business_phone: businessInfo.business_phone,
            business_email: businessInfo.business_email,
            entity_type: businessInfo.entity_type,
            ein: businessInfo.ein,
            industry: businessInfo.industry,
            annual_revenue: businessInfo.annual_revenue,
            employee_count: businessInfo.employee_count,
            updated_at: new Date().toISOString()
          });

        if (taxProfileError) throw taxProfileError;
      }

      toast.success('Profile updated successfully');
      onProfileUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
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
                Client Profile Management
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading profile...</p>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'personal'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <UserIcon className="h-4 w-4 inline mr-2" />
                    Personal Information
                  </button>
                  <button
                    onClick={() => setActiveTab('business')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'business'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BuildingOfficeIcon className="h-4 w-4 inline mr-2" />
                    Business Information
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'security'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <CogIcon className="h-4 w-4 inline mr-2" />
                    Security Settings
                  </button>
                </nav>
              </div>

              {/* Content */}
              <div className="px-6 py-6 max-h-96 overflow-y-auto">
                {activeTab === 'personal' && profile && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Filing Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={profile.filing_status}
                          onChange={(e) => setProfile({ ...profile, filing_status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          {filingStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={profile.state}
                          onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          {states.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Dependents
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={profile.dependents}
                          onChange={(e) => setProfile({ ...profile, dependents: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Home Address
                      </label>
                      <textarea
                        value={profile.home_address || ''}
                        onChange={(e) => setProfile({ ...profile, home_address: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your full address"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'business' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={businessInfo.business_name || ''}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, business_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter business name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Entity Type
                        </label>
                        <select
                          value={businessInfo.entity_type || ''}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, entity_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select entity type</option>
                          {entityTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          EIN (Tax ID)
                        </label>
                        <input
                          type="text"
                          value={businessInfo.ein || ''}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, ein: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="XX-XXXXXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Industry
                        </label>
                        <input
                          type="text"
                          value={businessInfo.industry || ''}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Technology, Healthcare, Retail"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Phone
                        </label>
                        <input
                          type="tel"
                          value={businessInfo.business_phone || ''}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, business_phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Email
                        </label>
                        <input
                          type="email"
                          value={businessInfo.business_email || ''}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, business_email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="business@company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Annual Revenue
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={businessInfo.annual_revenue || ''}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, annual_revenue: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Employees
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={businessInfo.employee_count || ''}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, employee_count: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Address
                      </label>
                      <textarea
                        value={businessInfo.business_address || ''}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, business_address: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter business address"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Account Security</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Keep your account secure by using a strong password and enabling two-factor authentication.
                      </p>
                      
                      <button
                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
                      </button>
                    </div>

                    {showPasswordSection && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter current password"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm new password"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={handlePasswordChange}
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {saving ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleProfileUpdate}
                  disabled={saving || !profile}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 