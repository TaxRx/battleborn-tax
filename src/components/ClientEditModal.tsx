import React, { useState, useEffect } from 'react';
import { TaxInfo, BusinessInfo, BusinessYear, PersonalYear } from '../lib/core/types/tax';
import { CentralizedClientService } from '../services/centralizedClientService';
import { formatCurrency, parseCurrency, formatEIN, generateDefaultYears, generateDefaultBusinessYears } from '../utils/formatting';
import { NumericFormat } from 'react-number-format';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onClientUpdated: () => void;
}

interface BusinessFormData {
  businessName: string;
  entityType: 'LLC' | 'S-Corp' | 'C-Corp' | 'Partnership' | 'Sole-Proprietor' | 'Other';
  ein: string;
  startYear: number;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessPhone?: string;
  businessEmail?: string;
  industry?: string;
  employeeCount?: number;
  ordinaryK1Income?: number;
  guaranteedK1Income?: number;
  businessAnnualRevenue?: number;
  isActive: boolean;
  years: BusinessYear[];
}

const ClientEditModal: React.FC<ClientEditModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onClientUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal');
  const [editingBusinessIndex, setEditingBusinessIndex] = useState<number | null>(null);
  
  // Form data state
  const [formData, setFormData] = useState<TaxInfo>({
    fullName: '',
    email: '',
    phone: '',
    filingStatus: 'single',
    dependents: 0,
    homeAddress: '',
    city: '',
    state: '',
    zipCode: '',
    wagesIncome: 0,
    passiveIncome: 0,
    unearnedIncome: 0,
    capitalGains: 0,
    householdIncome: 0,
    standardDeduction: true,
    customDeduction: 0,
    businessOwner: false,
    businesses: [],
    personalYears: generateDefaultYears()
  });

  const [businesses, setBusinesses] = useState<BusinessFormData[]>([]);

  // Load client data
  useEffect(() => {
    if (isOpen && clientId) {
      loadClientData();
    }
  }, [isOpen, clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_client_files')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      if (data) {
        // Map database data to form structure
        const mappedData: TaxInfo = {
          fullName: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          filingStatus: data.filing_status || 'single',
          dependents: data.dependents || 0,
          homeAddress: data.home_address || '',
          city: '',
          state: data.state || '',
          zipCode: '',
          wagesIncome: data.wages_income || 0,
          passiveIncome: data.passive_income || 0,
          unearnedIncome: data.unearned_income || 0,
          capitalGains: data.capital_gains || 0,
          householdIncome: data.household_income || 0,
          standardDeduction: data.standard_deduction !== false, // Default to true if not explicitly false
          customDeduction: data.custom_deduction || 0,
          businessOwner: data.business_owner || false,
          businesses: [],
          personalYears: generateDefaultYears()
        };

        setFormData(mappedData);

        // Load business data if exists
        if (data.business_owner && data.business_name) {
          const businessData: BusinessFormData = {
            businessName: data.business_name || '',
            entityType: (data.entity_type as any) || 'LLC',
            ein: '',
            startYear: new Date().getFullYear(),
            businessAddress: data.business_address || '',
            businessCity: '',
            businessState: '',
            businessZip: '',
            businessPhone: '',
            businessEmail: '',
            industry: '',
            employeeCount: 0,
            ordinaryK1Income: data.ordinary_k1_income || 0,
            guaranteedK1Income: data.guaranteed_k1_income || 0,
            businessAnnualRevenue: data.business_annual_revenue || 0,
            isActive: true,
            years: generateDefaultBusinessYears()
          };
          setBusinesses([businessData]);
        }

        // Load personal years data from tax_profile_data if available
        if (data.tax_profile_data && data.tax_profile_data.personal_years) {
          setFormData(prev => ({
            ...prev,
            personalYears: data.tax_profile_data.personal_years
          }));
        }

        // Load business years data from tax_profile_data if available
        if (data.tax_profile_data && data.tax_profile_data.business_years && businesses.length > 0) {
          setBusinesses(prev => prev.map(business => ({
            ...business,
            years: data.tax_profile_data.business_years || generateDefaultBusinessYears()
          })));
        }
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoChange = (field: keyof TaxInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePersonalYearChange = (year: number, field: keyof PersonalYear, value: any) => {
    setFormData(prev => ({
      ...prev,
      personalYears: prev.personalYears.map(py => 
        py.year === year ? { ...py, [field]: value } : py
      )
    }));
  };

  const handleBusinessInfoChange = (index: number, field: keyof BusinessFormData, value: any) => {
    setBusinesses(prev => prev.map((business, i) => 
      i === index ? { ...business, [field]: value } : business
    ));
  };

  const addBusiness = () => {
    const newBusiness: BusinessFormData = {
      businessName: '',
      entityType: 'LLC',
      ein: '',
      startYear: new Date().getFullYear(),
      businessAddress: '',
      businessCity: '',
      businessState: '',
      businessZip: '',
      businessPhone: '',
      businessEmail: '',
      industry: '',
      employeeCount: 0,
      ordinaryK1Income: 0,
      guaranteedK1Income: 0,
      businessAnnualRevenue: 0,
      isActive: true,
      years: generateDefaultBusinessYears()
    };
    setBusinesses(prev => [...prev, newBusiness]);
  };

  const removeBusiness = (index: number) => {
    setBusinesses(prev => prev.filter((_, i) => i !== index));
  };

  const handleYearChange = (businessIndex: number, yearIndex: number, field: keyof BusinessYear, value: any) => {
    setBusinesses(prev => prev.map((business, i) => {
      if (i === businessIndex) {
        const newYears = [...business.years];
        newYears[yearIndex] = { ...newYears[yearIndex], [field]: value };
        return { ...business, years: newYears };
      }
      return business;
    }));
  };

  const addNewYear = () => {
    const currentYear = new Date().getFullYear();
    const maxYear = Math.max(...formData.personalYears.map(py => py.year));
    const newYear = maxYear + 1;
    
    setFormData(prev => ({
      ...prev,
      personalYears: [...prev.personalYears, {
        year: newYear,
        wagesIncome: 0,
        passiveIncome: 0,
        unearnedIncome: 0,
        capitalGains: 0,
        householdIncome: 0,
        standardDeduction: true,
        customDeduction: 0,
        k1Income: 0
      }]
    }));
  };

  const removePersonalYear = (yearToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      personalYears: prev.personalYears.filter(py => py.year !== yearToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Prepare update data with ALL available fields
      const updateData = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        filing_status: formData.filingStatus,
        dependents: formData.dependents,
        home_address: formData.homeAddress,
        state: formData.state,
        wages_income: formData.wagesIncome,
        passive_income: formData.passiveIncome,
        unearned_income: formData.unearnedIncome,
        capital_gains: formData.capitalGains,
        household_income: formData.householdIncome,
        standard_deduction: formData.standardDeduction,
        custom_deduction: formData.customDeduction,
        business_owner: formData.businessOwner,
        business_name: businesses.length > 0 ? businesses[0].businessName : null,
        entity_type: businesses.length > 0 ? businesses[0].entityType : null,
        business_address: businesses.length > 0 ? businesses[0].businessAddress : null,
        ordinary_k1_income: businesses.length > 0 ? businesses[0].ordinaryK1Income : 0,
        guaranteed_k1_income: businesses.length > 0 ? businesses[0].guaranteedK1Income : 0,
        business_annual_revenue: businesses.length > 0 ? businesses[0].businessAnnualRevenue : 0,
        // Store complete tax profile data as JSON
        tax_profile_data: {
          personal_years: formData.personalYears,
          business_years: businesses.length > 0 ? businesses[0].years : [],
          businesses: businesses.map(business => ({
            businessName: business.businessName,
            entityType: business.entityType,
            ein: business.ein,
            startYear: business.startYear,
            businessAddress: business.businessAddress,
            businessCity: business.businessCity,
            businessState: business.businessState,
            businessZip: business.businessZip,
            businessPhone: business.businessPhone,
            businessEmail: business.businessEmail,
            industry: business.industry,
            employeeCount: business.employeeCount,
            ordinaryK1Income: business.ordinaryK1Income,
            guaranteedK1Income: business.guaranteedK1Income,
            businessAnnualRevenue: business.businessAnnualRevenue,
            isActive: business.isActive,
            years: business.years
          }))
        },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('admin_client_files')
        .update(updateData)
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Client updated successfully');
      onClientUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Edit Client</h2>
            <p className="text-gray-600">Update client information and tax data</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                    activeTab === 'personal'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Personal Information
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('business')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                    activeTab === 'business'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Business Information
                </button>
              </div>

              {activeTab === 'personal' && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filing Status</label>
                        <select
                          value={formData.filingStatus}
                          onChange={(e) => handlePersonalInfoChange('filingStatus', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="single">Single</option>
                          <option value="married">Married Filing Jointly</option>
                          <option value="married_separate">Married Filing Separately</option>
                          <option value="head_of_household">Head of Household</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Dependents</label>
                        <input
                          type="number"
                          value={formData.dependents}
                          onChange={(e) => handlePersonalInfoChange('dependents', parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          min="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <select
                          value={formData.state}
                          onChange={(e) => handlePersonalInfoChange('state', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select State</option>
                          <option value="AL">Alabama</option>
                          <option value="AK">Alaska</option>
                          <option value="AZ">Arizona</option>
                          <option value="AR">Arkansas</option>
                          <option value="CA">California</option>
                          <option value="CO">Colorado</option>
                          <option value="CT">Connecticut</option>
                          <option value="DE">Delaware</option>
                          <option value="FL">Florida</option>
                          <option value="GA">Georgia</option>
                          <option value="HI">Hawaii</option>
                          <option value="ID">Idaho</option>
                          <option value="IL">Illinois</option>
                          <option value="IN">Indiana</option>
                          <option value="IA">Iowa</option>
                          <option value="KS">Kansas</option>
                          <option value="KY">Kentucky</option>
                          <option value="LA">Louisiana</option>
                          <option value="ME">Maine</option>
                          <option value="MD">Maryland</option>
                          <option value="MA">Massachusetts</option>
                          <option value="MI">Michigan</option>
                          <option value="MN">Minnesota</option>
                          <option value="MS">Mississippi</option>
                          <option value="MO">Missouri</option>
                          <option value="MT">Montana</option>
                          <option value="NE">Nebraska</option>
                          <option value="NV">Nevada</option>
                          <option value="NH">New Hampshire</option>
                          <option value="NJ">New Jersey</option>
                          <option value="NM">New Mexico</option>
                          <option value="NY">New York</option>
                          <option value="NC">North Carolina</option>
                          <option value="ND">North Dakota</option>
                          <option value="OH">Ohio</option>
                          <option value="OK">Oklahoma</option>
                          <option value="OR">Oregon</option>
                          <option value="PA">Pennsylvania</option>
                          <option value="RI">Rhode Island</option>
                          <option value="SC">South Carolina</option>
                          <option value="SD">South Dakota</option>
                          <option value="TN">Tennessee</option>
                          <option value="TX">Texas</option>
                          <option value="UT">Utah</option>
                          <option value="VT">Vermont</option>
                          <option value="VA">Virginia</option>
                          <option value="WA">Washington</option>
                          <option value="WV">West Virginia</option>
                          <option value="WI">Wisconsin</option>
                          <option value="WY">Wyoming</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Home Address</label>
                        <input
                          type="text"
                          value={formData.homeAddress}
                          onChange={(e) => handlePersonalInfoChange('homeAddress', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Income Information */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Current Year Income</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Wages & Salary Income</label>
                        <NumericFormat
                          value={formData.wagesIncome}
                          onValueChange={(values) => handlePersonalInfoChange('wagesIncome', parseFloat(values.value) || 0)}
                          thousandSeparator=","
                          prefix="$"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Passive Income</label>
                        <NumericFormat
                          value={formData.passiveIncome}
                          onValueChange={(values) => handlePersonalInfoChange('passiveIncome', parseFloat(values.value) || 0)}
                          thousandSeparator=","
                          prefix="$"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unearned Income</label>
                        <NumericFormat
                          value={formData.unearnedIncome}
                          onValueChange={(values) => handlePersonalInfoChange('unearnedIncome', parseFloat(values.value) || 0)}
                          thousandSeparator=","
                          prefix="$"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Capital Gains</label>
                        <NumericFormat
                          value={formData.capitalGains}
                          onValueChange={(values) => handlePersonalInfoChange('capitalGains', parseFloat(values.value) || 0)}
                          thousandSeparator=","
                          prefix="$"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Household Income</label>
                        <NumericFormat
                          value={formData.householdIncome}
                          onValueChange={(values) => handlePersonalInfoChange('householdIncome', parseFloat(values.value) || 0)}
                          thousandSeparator=","
                          prefix="$"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Deduction Information */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="standardDeduction"
                          checked={formData.standardDeduction}
                          onChange={(e) => handlePersonalInfoChange('standardDeduction', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="standardDeduction" className="text-sm font-medium text-gray-700">
                          Use Standard Deduction
                        </label>
                      </div>
                      {!formData.standardDeduction && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Deduction Amount</label>
                          <NumericFormat
                            value={formData.customDeduction}
                            onValueChange={(values) => handlePersonalInfoChange('customDeduction', parseFloat(values.value) || 0)}
                            thousandSeparator=","
                            prefix="$"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Tax Years */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Personal Tax Years</h3>
                      <button
                        type="button"
                        onClick={addNewYear}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Year
                      </button>
                    </div>
                    
                    {formData.personalYears.map((yearData, index) => (
                      <div key={yearData.year} className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold text-gray-800">Tax Year {yearData.year}</h4>
                          {formData.personalYears.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePersonalYear(yearData.year)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wages Income</label>
                            <NumericFormat
                              value={yearData.wagesIncome}
                              onValueChange={(values) => handlePersonalYearChange(yearData.year, 'wagesIncome', parseFloat(values.value) || 0)}
                              thousandSeparator=","
                              prefix="$"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Passive Income</label>
                            <NumericFormat
                              value={yearData.passiveIncome}
                              onValueChange={(values) => handlePersonalYearChange(yearData.year, 'passiveIncome', parseFloat(values.value) || 0)}
                              thousandSeparator=","
                              prefix="$"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Capital Gains</label>
                            <NumericFormat
                              value={yearData.capitalGains}
                              onValueChange={(values) => handlePersonalYearChange(yearData.year, 'capitalGains', parseFloat(values.value) || 0)}
                              thousandSeparator=","
                              prefix="$"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">K-1 Income</label>
                            <NumericFormat
                              value={yearData.k1Income}
                              onValueChange={(values) => handlePersonalYearChange(yearData.year, 'k1Income', parseFloat(values.value) || 0)}
                              thousandSeparator=","
                              prefix="$"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'business' && (
                <div className="space-y-6">
                  {/* Business Information */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Business Information</h3>
                      <button
                        type="button"
                        onClick={addBusiness}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Add Business
                      </button>
                    </div>

                    {businesses.map((business, index) => (
                      <div key={index} className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold text-gray-800">Business {index + 1}</h4>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => setEditingBusinessIndex(index)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Edit
                            </button>
                            {businesses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBusiness(index)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Business Name</label>
                            <p className="text-gray-900">{business.businessName || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                            <p className="text-gray-900">{business.entityType}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Annual Revenue</label>
                            <p className="text-gray-900">{formatCurrency(business.businessAnnualRevenue || 0)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">K-1 Income</label>
                            <p className="text-gray-900">{formatCurrency((business.ordinaryK1Income || 0) + (business.guaranteedK1Income || 0))}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientEditModal; 