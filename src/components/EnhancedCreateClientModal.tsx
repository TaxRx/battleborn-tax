import React, { useState, useEffect } from 'react';
import { X, User, Building, MapPin, DollarSign, Save, Plus, Calendar, Hash } from 'lucide-react';
import { TaxInfo } from '../types';
import { CentralizedClientService } from '../services/centralizedClientService';
import { toast } from 'react-hot-toast';

interface EnhancedCreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (clientData: TaxInfo) => void;
  loading?: boolean;
  toolSlug?: string; // Optional tool to enroll in
}

interface BusinessFormData {
  businessName: string;
  entityType: 'LLC' | 'S-Corp' | 'C-Corp' | 'Partnership' | 'Sole Proprietorship' | 'Other';
  ein: string;
  startYear: number;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessPhone?: string;
  businessEmail?: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
}

const EnhancedCreateClientModal: React.FC<EnhancedCreateClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
  loading = false,
  toolSlug
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'business'>('profile');
  const [showBusinessTab, setShowBusinessTab] = useState(false);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    filingStatus: 'single' as 'single' | 'married_joint' | 'married_separate' | 'head_household',
    dependents: 0,
    homeAddress: '',
    state: 'NV',
    wagesIncome: 0,
    passiveIncome: 0,
    unearnedIncome: 0,
    capitalGains: 0,
    householdIncome: 0,
    standardDeduction: true,
    customDeduction: 0,
    businessOwner: false
  });

  // Business form data
  const [businessData, setBusinessData] = useState<BusinessFormData>({
    businessName: '',
    entityType: 'LLC',
    ein: '',
    startYear: new Date().getFullYear(),
    businessAddress: '',
    businessCity: '',
    businessState: 'NV',
    businessZip: '',
    businessPhone: '',
    businessEmail: '',
    industry: '',
    annualRevenue: 0,
    employeeCount: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entityTypes = [
    { value: 'LLC', label: 'Limited Liability Company (LLC)' },
    { value: 'S-Corp', label: 'S Corporation' },
    { value: 'C-Corp', label: 'C Corporation' },
    { value: 'Partnership', label: 'Partnership' },
    { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
    { value: 'Other', label: 'Other' }
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Professional Services',
    'Construction',
    'Real Estate',
    'Finance',
    'Education',
    'Transportation',
    'Food & Beverage',
    'Entertainment',
    'Other'
  ];

  // Format EIN input
  const formatEIN = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) {
      return digits;
    } else {
      return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
    }
  };

  // Validate profile form
  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profileData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!profileData.state) {
      newErrors.state = 'State is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate business form
  const validateBusiness = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!businessData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!businessData.ein.trim()) {
      newErrors.ein = 'EIN is required';
    } else if (!/^\d{2}-\d{7}$/.test(businessData.ein)) {
      newErrors.ein = 'EIN must be in format XX-XXXXXXX';
    }

    if (!businessData.startYear) {
      newErrors.startYear = 'Start year is required';
    } else if (businessData.startYear > new Date().getFullYear()) {
      newErrors.startYear = 'Start year cannot be in the future';
    }

    if (!businessData.businessAddress.trim()) {
      newErrors.businessAddress = 'Business address is required';
    }

    if (!businessData.businessCity.trim()) {
      newErrors.businessCity = 'City is required';
    }

    if (!businessData.businessState) {
      newErrors.businessState = 'State is required';
    }

    if (!businessData.businessZip.trim()) {
      newErrors.businessZip = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateProfile()) {
      setActiveTab('profile');
      return;
    }

    if (showBusinessTab && !validateBusiness()) {
      setActiveTab('business');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the TaxInfo object
      const taxInfo: TaxInfo = {
        ...profileData,
        businessName: businessData.businessName,
        entityType: businessData.entityType,
        businessAddress: businessData.businessAddress,
        // Add any other business-related fields that TaxInfo expects
      };

      // If we have business data and a tool slug, create business and enroll
      if (showBusinessTab && businessData.businessName && toolSlug) {
        // This would integrate with the centralized client service
        // For now, we'll just pass the data to the parent
        console.log('Would create business and enroll in tool:', toolSlug);
      }

      onClientCreated(taxInfo);
      onClose();
      toast.success('Client created successfully!');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle business owner checkbox change
  const handleBusinessOwnerChange = (checked: boolean) => {
    setProfileData(prev => ({ ...prev, businessOwner: checked }));
    setShowBusinessTab(checked);
    if (checked && activeTab === 'profile') {
      setActiveTab('business');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Client</h2>
              <p className="text-sm text-gray-600">
                Add a new client with comprehensive profile and business information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Personal Information
            </button>
            {showBusinessTab && (
              <button
                onClick={() => setActiveTab('business')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'business'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building className="h-4 w-4 inline mr-2" />
                Business Information
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filing Status
                  </label>
                  <select
                    value={profileData.filingStatus}
                    onChange={(e) => setProfileData(prev => ({ ...prev, filingStatus: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single">Single</option>
                    <option value="married_joint">Married Filing Jointly</option>
                    <option value="married_separate">Married Filing Separately</option>
                    <option value="head_household">Head of Household</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={profileData.state}
                    onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-red-600 text-sm mt-1">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Dependents
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profileData.dependents}
                    onChange={(e) => setProfileData(prev => ({ ...prev, dependents: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Home Address
                  </label>
                  <input
                    type="text"
                    value={profileData.homeAddress}
                    onChange={(e) => setProfileData(prev => ({ ...prev, homeAddress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter home address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Household Income
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profileData.householdIncome}
                    onChange={(e) => setProfileData(prev => ({ ...prev, householdIncome: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter total household income"
                  />
                </div>
              </div>

              {/* Income Breakdown */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Income Breakdown (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wages & Salaries
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profileData.wagesIncome}
                      onChange={(e) => setProfileData(prev => ({ ...prev, wagesIncome: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passive Income
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profileData.passiveIncome}
                      onChange={(e) => setProfileData(prev => ({ ...prev, passiveIncome: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unearned Income
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profileData.unearnedIncome}
                      onChange={(e) => setProfileData(prev => ({ ...prev, unearnedIncome: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capital Gains
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profileData.capitalGains}
                      onChange={(e) => setProfileData(prev => ({ ...prev, capitalGains: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Business Owner Checkbox */}
              <div className="border-t pt-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profileData.businessOwner}
                    onChange={(e) => handleBusinessOwnerChange(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    I own a business (add business information)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Business Tab */}
          {activeTab === 'business' && showBusinessTab && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessData.businessName}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, businessName: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.businessName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter business name"
                  />
                  {errors.businessName && (
                    <p className="text-red-600 text-sm mt-1">{errors.businessName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EIN (XX-XXXXXXX) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessData.ein}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, ein: formatEIN(e.target.value) }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ein ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12-3456789"
                    maxLength={10}
                  />
                  {errors.ein && (
                    <p className="text-red-600 text-sm mt-1">{errors.ein}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Type
                  </label>
                  <select
                    value={businessData.entityType}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, entityType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {entityTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={businessData.startYear}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, startYear: parseInt(e.target.value) }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.startYear ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Start Year</option>
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {errors.startYear && (
                    <p className="text-red-600 text-sm mt-1">{errors.startYear}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={businessData.industry}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Revenue
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={businessData.annualRevenue}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, annualRevenue: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter annual revenue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Employees
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={businessData.employeeCount}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter number of employees"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    value={businessData.businessPhone}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, businessPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email
                  </label>
                  <input
                    type="email"
                    value={businessData.businessEmail}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, businessEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business email"
                  />
                </div>
              </div>

              {/* Business Address */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Business Address</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessData.businessAddress}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, businessAddress: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.businessAddress ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter street address"
                    />
                    {errors.businessAddress && (
                      <p className="text-red-600 text-sm mt-1">{errors.businessAddress}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={businessData.businessCity}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, businessCity: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.businessCity ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter city"
                      />
                      {errors.businessCity && (
                        <p className="text-red-600 text-sm mt-1">{errors.businessCity}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={businessData.businessState}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, businessState: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.businessState ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.businessState && (
                        <p className="text-red-600 text-sm mt-1">{errors.businessState}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={businessData.businessZip}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, businessZip: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.businessZip ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter ZIP code"
                      />
                      {errors.businessZip && (
                        <p className="text-red-600 text-sm mt-1">{errors.businessZip}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Client
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCreateClientModal; 