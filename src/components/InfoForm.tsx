import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { TaxInfo } from '../types';
import { states } from '../data/states';
import { MapPin } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import Autocomplete from 'react-google-autocomplete';
import { NumericFormat } from 'react-number-format';
import { useTaxStore } from '../store/taxStore';

interface InfoFormProps {
  onSubmit: (data: TaxInfo, year: number) => void;
  initialData?: TaxInfo | null;
}

const mapOptions = {
  mapTypeId: 'satellite',
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  zoomControl: true
};

const mapContainerStyle = {
  width: '100%',
  height: '300px'
};

export default function InfoForm({ onSubmit, initialData }: InfoFormProps) {
  const { saveInitialState } = useTaxStore();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [selectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState<TaxInfo>(initialData || {
    standardDeduction: true,
    customDeduction: 0,
    businessOwner: false,
    fullName: '',
    email: '',
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
    guaranteedK1Income: 0
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const [homeLocation, setHomeLocation] = useState({ 
    lat: initialData?.homeLatitude || 40.7128, 
    lng: initialData?.homeLongitude || -74.0060 
  });
  
  const [businessLocation, setBusinessLocation] = useState({ 
    lat: initialData?.businessLatitude || 40.7128, 
    lng: initialData?.businessLongitude || -74.0060 
  });

  const handleHomeAddressSelect = (place: any) => {
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setHomeLocation({ lat, lng });
      setFormData(prev => ({ ...prev, homeAddress: place.formatted_address }));
    }
  };

  const handleBusinessAddressSelect = (place: any) => {
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setBusinessLocation({ lat, lng });
      setFormData(prev => ({ ...prev, businessAddress: place.formatted_address }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.homeAddress) {
      alert('Please fill in all required fields: Full Name, Email, and Home Address');
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
      alert('Please enter at least one source of income');
      return;
    }

    // If business owner, validate business fields
    if (formData.businessOwner) {
      if (!formData.businessName || !formData.businessAddress) {
        alert('Please fill in all business information');
        return;
      }
    }

    try {
      // Call the onSubmit callback
      onSubmit(formData, selectedYear);
    } catch (error) {
      console.error('Failed to save form data:', error);
      alert('Failed to save form data. Please try again.');
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

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
              <div className="flex items-start space-x-6 mb-8">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.standardDeduction}
                    onChange={(e) => setFormData(prev => ({ ...prev, standardDeduction: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-[#12ab61] focus:ring-[#12ab61]"
                  />
                  <span>Standard Deduction</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.businessOwner}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessOwner: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-[#12ab61] focus:ring-[#12ab61]"
                  />
                  <span>Business Owner</span>
                </label>
              </div>

              {!formData.standardDeduction && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Deduction Amount
                  </label>
                  <NumericFormat
                    value={formData.customDeduction}
                    onValueChange={(values) => setFormData(prev => ({ ...prev, customDeduction: values.floatValue || 0 }))}
                    thousandSeparator={true}
                    prefix="$"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                    placeholder="Enter custom deduction amount"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  >
                    {states.map(state => (
                      <option key={state.code} value={state.code}>{state.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
                  <select
                    value={formData.filingStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, filingStatus: e.target.value as TaxInfo['filingStatus'] }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  >
                    <option value="single">Single</option>
                    <option value="married_joint">Married Filing Jointly</option>
                    <option value="married_separate">Married Filing Separately</option>
                    <option value="head_household">Head of Household</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Dependents</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dependents}
                    onChange={(e) => setFormData(prev => ({ ...prev, dependents: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      defaultValue={formData.homeAddress}
                      onPlaceSelected={handleHomeAddressSelect}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                      options={{
                        types: ['address'],
                        componentRestrictions: { country: 'us' }
                      }}
                    />
                  </div>
                  <div className="mt-4 h-[300px] rounded-lg overflow-hidden">
                    <GoogleMap
                      center={homeLocation}
                      zoom={18}
                      mapContainerStyle={mapContainerStyle}
                      options={mapOptions}
                    >
                      <Marker position={homeLocation} />
                    </GoogleMap>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">W-2 Income</label>
                  <NumericFormat
                    value={formData.wagesIncome}
                    onValueChange={(values) => setFormData(prev => ({ ...prev, wagesIncome: values.floatValue || 0 }))}
                    thousandSeparator={true}
                    prefix="$"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passive Income</label>
                  <NumericFormat
                    value={formData.passiveIncome}
                    onValueChange={(values) => setFormData(prev => ({ ...prev, passiveIncome: values.floatValue || 0 }))}
                    thousandSeparator={true}
                    prefix="$"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unearned Income</label>
                  <NumericFormat
                    value={formData.unearnedIncome}
                    onValueChange={(values) => setFormData(prev => ({ ...prev, unearnedIncome: values.floatValue || 0 }))}
                    thousandSeparator={true}
                    prefix="$"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capital Gains</label>
                  <NumericFormat
                    value={formData.capitalGains}
                    onValueChange={(values) => setFormData(prev => ({ ...prev, capitalGains: values.floatValue || 0 }))}
                    thousandSeparator={true}
                    prefix="$"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>
              </div>

              {formData.businessOwner && (
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('business')}
                    className="flex items-center space-x-2 text-[#12ab61] hover:text-[#0f9654]"
                  >
                    <span>Next: Business Information</span>
                    <MapPin size={20} />
                  </button>
                </div>
              )}
            </motion.div>
          </Tabs.Content>

          <Tabs.Content value="business">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                  <select
                    value={formData.entityType}
                    onChange={(e) => setFormData(prev => ({ ...prev, entityType: e.target.value as TaxInfo['entityType'] }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  >
                    <option value="LLC">LLC</option>
                    <option value="S-Corp">S-Corporation</option>
                    <option value="C-Corp">C-Corporation</option>
                    <option value="Sole Prop">Sole Proprietorship</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      defaultValue={formData.businessAddress}
                      onPlaceSelected={handleBusinessAddressSelect}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                      options={{
                        types: ['address'],
                        componentRestrictions: { country: 'us' }
                      }}
                    />
                  </div>
                  <div className="mt-4 h-[300px] rounded-lg overflow-hidden">
                    <GoogleMap
                      center={businessLocation}
                      zoom={18}
                      mapContainerStyle={mapContainerStyle}
                      options={mapOptions}
                    >
                      <Marker position={businessLocation} />
                    </GoogleMap>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordinary K-1 Income</label>
                  <NumericFormat
                    value={formData.ordinaryK1Income}
                    onValueChange={(values) => setFormData(prev => ({ ...prev, ordinaryK1Income: values.floatValue || 0 }))}
                    thousandSeparator={true}
                    prefix="$"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guaranteed K-1 Income</label>
                  <NumericFormat
                    value={formData.guaranteedK1Income}
                    onValueChange={(values) => setFormData(prev => ({ ...prev, guaranteedK1Income: values.floatValue || 0 }))}
                    thousandSeparator={true}
                    prefix="$"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>
              </div>
            </motion.div>
          </Tabs.Content>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-[#12ab61] text-white rounded-lg hover:bg-[#0f9654]"
            >
              Calculate Tax Savings
            </button>
          </div>
        </form>
      </Tabs.Root>
    </div>
  );
}