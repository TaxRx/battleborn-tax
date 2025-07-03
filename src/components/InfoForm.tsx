import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { TaxInfo } from '../types';
import { states } from '../data/states';
import { NumericFormat } from 'react-number-format';
import { useTaxStore } from '../store/taxStore';
import { useUserStore } from '../store/userStore';
import useAuthStore from '../store/authStore';
import { supabase } from '../lib/supabase';
import { formatCurrency, parseCurrency } from '../utils/formatting';

interface InfoFormProps {
  onSubmit: (data: TaxInfo, year: number) => void;
  initialData?: TaxInfo | null;
  onTaxInfoUpdate?: (taxInfo: TaxInfo) => Promise<void>;
}

export default function InfoForm({ onSubmit, initialData, onTaxInfoUpdate }: InfoFormProps) {
  const { saveInitialState, setTaxInfo } = useTaxStore();
  const { user, fetchUserProfile } = useUserStore();
  const { demoMode } = useAuthStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [selectedYear] = useState(new Date().getFullYear());
  const [ownBusiness, setOwnBusiness] = useState(false);
  
  // Create a clean default state with all income fields set to 0
  const getDefaultFormData = (): TaxInfo => ({
    standardDeduction: true,
    customDeduction: 0,
    businessOwner: false,
    fullName: '',
    email: user?.email || '',
    phone: '',
    filingStatus: 'single',
    dependents: 0,
    homeAddress: '',
    state: 'CA',
    wagesIncome: 0,
    passiveIncome: 0,
    unearnedIncome: 0,
    capitalGains: 0,
    businessName: '',
    entityType: 'LLC',
    businessAddress: '',
    ordinaryK1Income: 0,
    guaranteedK1Income: 0,
    householdIncome: 0,
    businessAnnualRevenue: 0,
    deductionLimitReached: false
  });

  const [formData, setFormData] = useState<TaxInfo>(() => {
    // If initialData is provided, use it; otherwise use clean defaults
    if (initialData) {
      return initialData;
    }
    return getDefaultFormData();
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      // If initialData is provided, use it but preserve any existing data that might not be in initialData
      setFormData(prevData => ({
        ...prevData,
        ...initialData
      }));
    }
    // Don't reset to defaults when initialData is null/undefined - keep existing data
  }, [initialData, user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.fullName) {
      console.error('Validation error: Full name is required');
      alert('Please enter your full name');
      return;
    }

    // Validate at least one income source
    const hasIncome = formData.wagesIncome > 0 || 
                     formData.passiveIncome > 0 || 
                     formData.unearnedIncome > 0 || 
                     formData.capitalGains > 0 ||
                     (formData.businessOwner && (
                       (formData.ordinaryK1Income || 0) > 0 || 
                       (formData.guaranteedK1Income || 0) > 0
                     ));

    if (!hasIncome) {
      console.error('Validation error: No income sources provided');
      alert('Please enter at least one source of income to calculate your tax strategy. You can enter $0 for income sources that don\'t apply to you.');
      return;
    }

    if (demoMode) {
      // In demo mode, skip Supabase operations
      console.log('Demo mode: Skipping Supabase operations');
      setTaxInfo(formData);
      onSubmit(formData, selectedYear);
      return;
    }

    if (onTaxInfoUpdate) {
      // If onTaxInfoUpdate callback is provided (admin context), use it
      try {
        console.log('Using onTaxInfoUpdate callback for admin context');
        await onTaxInfoUpdate(formData);
        setTaxInfo(formData);
        onSubmit(formData, selectedYear);
      } catch (error) {
        console.error('Error updating tax info via callback:', error);
        alert(`Failed to update tax information: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return;
    }

    try {
      // Get current user from Supabase auth
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Try to get existing profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: currentUser.id,
            email: currentUser.email,
            full_name: formData.fullName,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;
        console.log('Created new profile:', newProfile);
      } else if (profileError) {
        throw profileError;
      }

      // Now save the tax info
      console.log('Upserting tax profile:', {
        user_id: currentUser.id,
        ...formData,
        updated_at: new Date().toISOString()
      });
      const { error: taxError } = await supabase
        .from('tax_profiles')
        .upsert([
          {
            user_id: currentUser.id,
            filing_status: formData.filingStatus,
            standard_deduction: formData.standardDeduction,
            custom_deduction: formData.customDeduction,
            business_owner: formData.businessOwner,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            dependents: formData.dependents,
            home_address: formData.homeAddress,
            state: formData.state,
            wages_income: formData.wagesIncome,
            passive_income: formData.passiveIncome,
            unearned_income: formData.unearnedIncome,
            capital_gains: formData.capitalGains,
            business_name: formData.businessName,
            entity_type: formData.entityType,
            business_address: formData.businessAddress,
            ordinary_k1_income: formData.ordinaryK1Income,
            guaranteed_k1_income: formData.guaranteedK1Income,
            household_income: formData.householdIncome,
            business_annual_revenue: formData.businessAnnualRevenue,
            deduction_limit_reached: formData.deductionLimitReached,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'user_id' });

      if (taxError) throw taxError;

      // Update Zustand store with the latest form data
      setTaxInfo(formData);
      console.log('Updated tax info in store:', formData);

      // Call the onSubmit callback with the form data
      onSubmit(formData, selectedYear);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      alert(`Failed to save form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add professional input formatting and validation
  const formatCurrency = (value: string): string => {
    // Remove non-numeric characters except decimal
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Parse and format with commas
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '';
    
    return number.toLocaleString('en-US');
  };

  const validateIncome = (income: number): string | null => {
    if (income < 0) return 'Income cannot be negative';
    if (income > 100000000) return 'Please contact us for high-net-worth planning above $100M';
    if (income < 1000) return 'Minimum income of $1,000 required for analysis';
    return null;
  };

  const validateAge = (age: number): string | null => {
    if (age < 18) return 'Must be 18 or older';
    if (age > 120) return 'Please enter a valid age';
    return null;
  };

  // Function to clear all income fields
  const clearAllIncome = () => {
    setFormData(prev => ({
      ...prev,
      wagesIncome: 0,
      passiveIncome: 0,
      unearnedIncome: 0,
      capitalGains: 0,
      ordinaryK1Income: 0,
      guaranteedK1Income: 0,
      householdIncome: 0
    }));
  };

  // Function to reset entire form to clean defaults
  const resetForm = () => {
    setFormData(getDefaultFormData());
  };

  // Function to calculate total income
  const getTotalIncome = () => {
    return (formData.wagesIncome || 0) + 
           (formData.passiveIncome || 0) + 
           (formData.unearnedIncome || 0) + 
           (formData.capitalGains || 0) + 
           (formData.ordinaryK1Income || 0) + 
           (formData.guaranteedK1Income || 0);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{selectedYear} Tax Year Information</h1>
        <button
          type="button"
          onClick={resetForm}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Reset Form
        </button>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex space-x-1 border-b mb-8">
          <Tabs.Trigger
            value="profile"
            className={`px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === 'profile' 
                ? 'border-b-2 border-[#12ab61] text-[#12ab61]' 
                : 'text-gray-600 hover:text-gray-900'}`}
          >
            Profile
          </Tabs.Trigger>
          {formData.businessOwner && (
            <Tabs.Trigger
              value="business"
              className={`px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === 'business' 
                  ? 'border-b-2 border-[#12ab61] text-[#12ab61]' 
                  : 'text-gray-600 hover:text-gray-900'}`}
            >
              Business
            </Tabs.Trigger>
          )}
        </Tabs.List>

        <form onSubmit={handleSubmit}>
          <Tabs.Content value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Filing Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.filingStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, filingStatus: e.target.value as any }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    required
                  >
                    <option value="single">Single</option>
                    <option value="married_joint">Married Filing Jointly</option>
                    <option value="married_separate">Married Filing Separately</option>
                    <option value="head_household">Head of Household</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    required
                  >
                    {states.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Dependents
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dependents}
                    onChange={(e) => setFormData(prev => ({ ...prev, dependents: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.businessOwner}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessOwner: e.target.checked }))}
                      className="rounded border-gray-300 text-[#12ab61] focus:ring-[#12ab61]"
                    />
                    <span className="text-sm font-medium text-gray-700">I own a business</span>
                  </label>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Income Information</h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      Total Income: <span className="font-semibold">${getTotalIncome().toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAllIncome}
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Clear All Income
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Wages/Salary Income
                    </label>
                    <NumericFormat
                      value={formData.wagesIncome || ''}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, wagesIncome: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      allowNegative={false}
                      placeholder="0"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61] ${!formData.wagesIncome ? 'bg-gray-50' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passive Income
                    </label>
                    <NumericFormat
                      value={formData.passiveIncome || ''}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, passiveIncome: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      allowNegative={false}
                      placeholder="0"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61] ${!formData.passiveIncome ? 'bg-gray-50' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unearned Income
                    </label>
                    <NumericFormat
                      value={formData.unearnedIncome || ''}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, unearnedIncome: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      allowNegative={false}
                      placeholder="0"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61] ${!formData.unearnedIncome ? 'bg-gray-50' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Capital Gains
                    </label>
                    <NumericFormat
                      value={formData.capitalGains || ''}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, capitalGains: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      allowNegative={false}
                      placeholder="0"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61] ${!formData.capitalGains ? 'bg-gray-50' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Household Income
                    </label>
                    <NumericFormat
                      value={formData.householdIncome || ''}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, householdIncome: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      allowNegative={false}
                      placeholder="0"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61] ${!formData.householdIncome ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </Tabs.Content>

          {formData.businessOwner && (
            <Tabs.Content value="business">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Entity Type
                    </label>
                    <select
                      value={formData.entityType || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, entityType: e.target.value as 'LLC' | 'S-Corp' | 'C-Corp' | 'Sole Prop' | undefined }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    >
                      <option value="">Select Entity Type</option>
                      <option value="LLC">LLC</option>
                      <option value="S-Corp">S-Corporation</option>
                      <option value="C-Corp">C-Corporation</option>
                      <option value="Sole Prop">Sole Proprietorship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Business Annual Revenue
                    </label>
                    <NumericFormat
                      value={formData.businessAnnualRevenue || ''}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, businessAnnualRevenue: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      allowNegative={false}
                      placeholder="0"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61] ${!formData.businessAnnualRevenue ? 'bg-gray-50' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ordinary K-1 Income
                    </label>
                    <NumericFormat
                      value={formData.ordinaryK1Income || ''}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, ordinaryK1Income: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      allowNegative={false}
                      placeholder="0"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61] ${!formData.ordinaryK1Income ? 'bg-gray-50' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Guaranteed K-1 Income
                    </label>
                    <NumericFormat
                      value={formData.guaranteedK1Income || ''}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, guaranteedK1Income: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      allowNegative={false}
                      placeholder="0"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61] ${!formData.guaranteedK1Income ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>
              </motion.div>
            </Tabs.Content>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#12ab61] hover:bg-[#0f9a57] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#12ab61]"
            >
              Save and Continue
            </button>
          </div>
        </form>
      </Tabs.Root>
    </div>
  );
}