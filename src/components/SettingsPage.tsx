import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useUserStore } from '../store/userStore';
import { useTaxStore } from '../store/taxStore';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import Autocomplete from 'react-google-autocomplete';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X, MapPin, CreditCard } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { motion } from 'framer-motion';

interface YearlyData {
  year: string;
  filingStatus: string;
  state: string;
  homeAddress: string;
  businessAddress: string;
  businessName: string;
  entityType: string;
  wagesIncome: number;
  passiveIncome: number;
  unearnedIncome: number;
  ordinaryK1Income?: number;
  guaranteedK1Income?: number;
  standardDeduction?: boolean;
  customDeduction?: number;
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

const states = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

export default function SettingsPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const { user, updateUserProfile } = useUserStore();
  const { taxInfo, selectedYear } = useTaxStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYearData, setSelectedYearData] = useState<string | null>(null);
  const [staticProfile, setStaticProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [homeLocation, setHomeLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [businessLocation, setBusinessLocation] = useState({ lat: 40.7128, lng: -74.0060 });

  useEffect(() => {
    if (user) {
      const [firstName, lastName] = (user.fullName || '').split(' ');
      setStaticProfile({
        firstName: firstName || '',
        lastName: lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (taxInfo) {
      setYearlyData(prev => {
        // Remove any existing data for this year
        const filtered = prev.filter(d => d.year !== selectedYear.toString());
        // Add new data
        return [...filtered, {
          year: selectedYear.toString(),
          filingStatus: taxInfo.filingStatus,
          state: taxInfo.state,
          homeAddress: taxInfo.homeAddress,
          businessAddress: taxInfo.businessAddress || '',
          businessName: taxInfo.businessName || '',
          entityType: taxInfo.entityType || '',
          wagesIncome: taxInfo.wagesIncome,
          passiveIncome: taxInfo.passiveIncome,
          unearnedIncome: taxInfo.unearnedIncome,
          ordinaryK1Income: taxInfo.ordinaryK1Income,
          guaranteedK1Income: taxInfo.guaranteedK1Income,
          standardDeduction: taxInfo.standardDeduction,
          customDeduction: taxInfo.customDeduction
        }];
      });
    }
  }, [taxInfo, selectedYear]);

  const handleHomeAddressSelect = (place: any) => {
    if (place?.formatted_address) {
      setFormData(prev => ({ 
        ...prev, 
        homeAddress: place.formatted_address 
      }));
    }
  };

  const handleBusinessAddressSelect = (place: any) => {
    if (place?.formatted_address) {
      setFormData(prev => ({ 
        ...prev, 
        businessAddress: place.formatted_address 
      }));
    }
  };

  const handleStaticProfileSave = async () => {
    try {
      await updateUserProfile({
        fullName: `${staticProfile.firstName} ${staticProfile.lastName}`.trim(),
        email: staticProfile.email,
        phone: staticProfile.phone
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleYearDataSave = async (yearData: YearlyData) => {
    setYearlyData(prev => {
      const index = prev.findIndex(data => data.year === yearData.year);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = yearData;
        return updated;
      }
      return [...prev, yearData];
    });
    setIsModalOpen(false);
  };

  const handleYearCardClick = (year: string) => {
    setSelectedYearData(year);
    setIsModalOpen(true);
  };

  const handleAddYear = () => {
    // Show year selection dialog
    const dialog = document.createElement('dialog');
    dialog.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-[1000]';
    
    const currentYear = new Date().getFullYear();
    const existingYears = yearlyData.map(d => parseInt(d.year));
    const availableYears = Array.from({ length: 3 }, (_, i) => currentYear + i - 1)
      .filter(year => !existingYears.includes(year));

    if (availableYears.length === 0) {
      alert('All available years (previous, current, and next) already have data');
      return;
    }

    dialog.innerHTML = `
      <h3 class="text-lg font-bold mb-4">Select Year</h3>
      <div class="space-y-4">
        ${availableYears.map(year => `
          <button 
            class="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg"
            data-year="${year}"
          >
            ${year} Tax Year
          </button>
        `).join('')}
      </div>
    `;

    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const year = target.dataset.year;
      if (year) {
        setSelectedYearData(year);
        setIsModalOpen(true);
      }
      dialog.close();
      document.body.removeChild(dialog);
    });
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex space-x-1 border-b mb-8">
          <Tabs.Trigger
            value="profile"
            className={`px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === 'profile' 
                ? 'border-b-2 border-emerald-500 text-emerald-600' 
                : 'text-gray-600 hover:text-gray-900'}`}
          >
            Profile
          </Tabs.Trigger>
          <Tabs.Trigger
            value="billing"
            className={`px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === 'billing' 
                ? 'border-b-2 border-emerald-500 text-emerald-600' 
                : 'text-gray-600 hover:text-gray-900'}`}
          >
            Billing
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Profile Information</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={staticProfile.firstName}
                    onChange={(e) => setStaticProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={staticProfile.email}
                    onChange={(e) => setStaticProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={staticProfile.phone}
                    onChange={(e) => setStaticProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleStaticProfileSave}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Yearly Data</h2>
                <button
                  onClick={handleAddYear}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={20} />
                  <span>Add Year</span>
                </button>
              </div>

              <div className="space-y-4">
                {yearlyData.map((data) => (
                  <div
                    key={data.year}
                    onClick={() => handleYearCardClick(data.year)}
                    className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
                      <h3 className="text-lg font-bold text-white">{data.year} Tax Year</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>Filing Status: {data.filingStatus}</div>
                        <div>State: {data.state}</div>
                        <div>Business Type: {data.entityType}</div>
                        <div>
                          Income: ${(data.wagesIncome + data.passiveIncome + data.unearnedIncome).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="billing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Payment Method</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600">Coming soon...</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Billing History</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600">No billing history available.</p>
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Year Data Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white rounded-xl shadow-xl z-[999] focus:outline-none">
            <div className="sticky top-0 bg-[#f8f6f1] px-6 py-4 flex justify-between items-center border-b">
              <Dialog.Title className="text-xl font-bold">
                {selectedYearData} Tax Year Information
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>
            <div className="p-6">
              <YearDataForm
                yearData={yearlyData.find(d => d.year === selectedYearData)}
                onSave={handleYearDataSave}
                onClose={() => setIsModalOpen(false)}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function YearDataForm({ yearData, onSave, onClose }: {
  yearData?: YearlyData;
  onSave: (data: YearlyData) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<YearlyData>(yearData || {
    year: new Date().getFullYear().toString(),
    filingStatus: 'single',
    state: 'CA',
    homeAddress: '',
    businessAddress: '',
    businessName: '',
    entityType: '',
    wagesIncome: 0,
    passiveIncome: 0,
    unearnedIncome: 0
  });

  const [standardDeduction, setStandardDeduction] = useState(true);
  const [isBusinessOwner, setIsBusinessOwner] = useState(!!formData.businessName);
  const [customDeduction, setCustomDeduction] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      standardDeduction,
      customDeduction: !standardDeduction ? customDeduction : 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-start space-x-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={standardDeduction}
            onChange={(e) => setStandardDeduction(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-[#12ab61] focus:ring-[#12ab61]"
          />
          <span>Standard Deduction</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isBusinessOwner}
            onChange={(e) => setIsBusinessOwner(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-[#12ab61] focus:ring-[#12ab61]"
          />
          <span>Business Owner</span>
        </label>
      </div>

      {!standardDeduction && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Deduction Amount
          </label>
          <NumericFormat
            value={customDeduction}
            onValueChange={(values) => setCustomDeduction(values.floatValue || 0)}
            thousandSeparator={true}
            prefix="$"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
          <select
            value={formData.filingStatus}
            onChange={(e) => setFormData(prev => ({ ...prev, filingStatus: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
          >
            <option value="single">Single</option>
            <option value="married_joint">Married Filing Jointly</option>
            <option value="married_separate">Married Filing Separately</option>
            <option value="head_household">Head of Household</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State of Residence</label>
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

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Autocomplete
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              defaultValue={formData.homeAddress}
              onPlaceSelected={(place) => setFormData(prev => ({ ...prev, homeAddress: place.formatted_address }))}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
              options={{
                types: ['address'],
                componentRestrictions: { country: 'us' }
              }}
            />
          </div>
        </div>

        {isBusinessOwner && (
          <>
            <div className="col-span-2 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onChange={(e) => setFormData(prev => ({ ...prev, entityType: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  >
                    <option value="">Select Entity Type</option>
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
                      onPlaceSelected={(place) => setFormData(prev => ({ ...prev, businessAddress: place.formatted_address }))}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                      options={{
                        types: ['address'],
                        componentRestrictions: { country: 'us' }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="col-span-2 border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Income Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wages (W-2 box 1 Income)
              </label>
              <NumericFormat
                value={formData.wagesIncome}
                onValueChange={(values) => setFormData(prev => ({ ...prev, wagesIncome: values.floatValue || 0 }))}
                thousandSeparator={true}
                prefix="$"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passive K-1 Income
              </label>
              <NumericFormat
                value={formData.passiveIncome}
                onValueChange={(values) => setFormData(prev => ({ ...prev, passiveIncome: values.floatValue || 0 }))}
                thousandSeparator={true}
                prefix="$"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unearned Income
              </label>
              <NumericFormat
                value={formData.unearnedIncome}
                onValueChange={(values) => setFormData(prev => ({ ...prev, unearnedIncome: values.floatValue || 0 }))}
                thousandSeparator={true}
                prefix="$"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
              />
            </div>

            {isBusinessOwner && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordinary K-1 Income
                  </label>
                  <NumericFormat
                    value={formData.ordinaryK1Income}
                    onValueChange={(values) => setFormData(prev => ({ ...prev, ordinaryK1Income: values.floatValue || 0 }))}
                    thousandSeparator={true}
                    prefix="$"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guaranteed K-1 Income
                  </label>
                  <NumericFormat
                    value={formData.guaranteedK1Income}
                    onValueChange={(values) => setFormData(prev => ({ ...prev, guaranteedK1Income: values.floatValue || 0 }))}
                    thousandSeparator={true}
                    prefix="$"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61]"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[#12ab61] text-white rounded-lg hover:bg-[#0f9654]"
        >
          Save
        </button>
      </div>
    </form>
  );
}