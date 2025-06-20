import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { TaxInfo } from '../types/tax';
import { states } from '../data/states';
import { NumericFormat } from 'react-number-format';
import { useTaxStore } from '../store/taxStore';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';

interface InfoFormProps {
  onSubmit: (data: TaxInfo, year: number) => void;
  initialData?: TaxInfo | null;
}

export default function InfoForm({ onSubmit, initialData }: InfoFormProps) {
  const { setTaxInfo } = useTaxStore();
  const { user, fetchUserProfile } = useUserStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [selectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState<TaxInfo>({
    user_id: user?.id || '',
    filing_status: 'single',
    standard_deduction: false,
    custom_deduction: 0,
    wages_income: 0,
    passive_income: 0,
    unearned_income: 0,
    capital_gains: 0,
    business_owner: false,
    ordinary_k1_income: 0,
    guaranteed_k1_income: 0,
    state: 'CA',
    full_name: '',
    email: '',
    home_address: '',
    business_name: '',
    entity_type: undefined,
    business_address: '',
    dependents: 0,
    household_income: 0,
    deduction_limit_reached: false
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save to store
      setTaxInfo(formData);
      
      // Save to database if user is logged in
      if (user) {
        const { error } = await supabase
          .from('tax_profiles')
          .upsert({
            ...formData,
            user_id: user.id
          });
        
        if (error) throw error;
      }

      onSubmit(formData, selectedYear);
    } catch (error) {
      console.error('Error saving tax profile:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{selectedYear} Tax Year Information</h1>
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
          {formData.business_owner && (
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
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Filing Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.filing_status}
                    onChange={(e) => setFormData(prev => ({ ...prev, filing_status: e.target.value as any }))}
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
                      checked={formData.business_owner}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_owner: e.target.checked }))}
                      className="rounded border-gray-300 text-[#12ab61] focus:ring-[#12ab61]"
                    />
                    <span className="text-sm font-medium text-gray-700">I own a business</span>
                  </label>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Income Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Wages/Salary Income
                    </label>
                    <NumericFormat
                      value={formData.wages_income}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, wages_income: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passive Income
                    </label>
                    <NumericFormat
                      value={formData.passive_income}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, passive_income: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unearned Income
                    </label>
                    <NumericFormat
                      value={formData.unearned_income}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, unearned_income: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Capital Gains
                    </label>
                    <NumericFormat
                      value={formData.capital_gains}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, capital_gains: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </Tabs.Content>

          {formData.business_owner && (
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
                      value={formData.business_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Entity Type
                    </label>
                    <select
                      value={formData.entity_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, entity_type: e.target.value as any }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    >
                      <option value="">Select Entity Type</option>
                      <option value="LLC">LLC</option>
                      <option value="S-Corp">S-Corp</option>
                      <option value="C-Corp">C-Corp</option>
                      <option value="Sole Prop">Sole Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Business Address
                    </label>
                    <input
                      type="text"
                      value={formData.business_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ordinary K-1 Income
                    </label>
                    <NumericFormat
                      value={formData.ordinary_k1_income}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, ordinary_k1_income: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Guaranteed K-1 Income
                    </label>
                    <NumericFormat
                      value={formData.guaranteed_k1_income}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, guaranteed_k1_income: values.floatValue || 0 }))}
                      thousandSeparator={true}
                      prefix="$"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
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