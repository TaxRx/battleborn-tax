import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import { states } from '../data/states';
import { MapPin, X } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import Autocomplete from 'react-google-autocomplete';
import { NumericFormat } from 'react-number-format';

interface YearlyData {
  year: string;
  standardDeduction: boolean;
  customDeduction?: number;
  businessOwner: boolean;
  filingStatus: string;
  state: string;
  dependents: number;
  homeAddress: string;
  wagesIncome: number;
  passiveIncome: number;
  unearnedIncome: number;
  capitalGains: number;
  businessName: string;
  entityType: string;
  businessAddress: string;
  ordinaryK1Income: number;
  guaranteedK1Income: number;
}

const mapOptions = {
  mapTypeId: 'satellite',
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  zoomControl: true,
};

export default function Settings() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const { user, updateUserProfile } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    staticProfile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    yearlyData: [] as YearlyData[],
  });

  const [formData, setFormData] = useState<YearlyData>({
    year: new Date().getFullYear().toString(),
    standardDeduction: true,
    customDeduction: 0,
    businessOwner: false,
    filingStatus: 'single',
    state: 'CA',
    dependents: 0,
    homeAddress: '',
    wagesIncome: 0,
    passiveIncome: 0,
    unearnedIncome: 0,
    capitalGains: 0,
    businessName: '',
    entityType: 'LLC',
    businessAddress: '',
    ordinaryK1Income: 0,
    guaranteedK1Income: 0,
  });

  useEffect(() => {
    if (user) {
      const [firstName, lastName] = (user.fullName || '').split(' ');
      setUserData({
        staticProfile: {
          firstName: firstName || '',
          lastName: lastName || '',
          email: user.email || '',
          phone: user.phone || '',
        },
        yearlyData: user.yearlyData || [],
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile({
        fullName: `${userData.staticProfile.firstName} ${userData.staticProfile.lastName}`.trim(),
        email: userData.staticProfile.email,
        phone: userData.staticProfile.phone,
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleSaveYearlyData = async () => {
    const updatedYearlyData = [
      ...userData.yearlyData.filter((d) => d.year !== selectedYear),
      { ...formData, year: selectedYear as string },
    ];
    
    setUserData((prev) => ({
      ...prev,
      yearlyData: updatedYearlyData,
    }));

    try {
      await updateUserProfile({
        yearlyData: updatedYearlyData,
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save yearly data:', error);
    }
  };

  const handleAddYear = () => {
    const year = new Date().getFullYear().toString();
    setSelectedYear(year);
    setFormData({
      year,
      standardDeduction: true,
      customDeduction: 0,
      businessOwner: false,
      filingStatus: 'single',
      state: 'CA',
      dependents: 0,
      homeAddress: '',
      wagesIncome: 0,
      passiveIncome: 0,
      unearnedIncome: 0,
      capitalGains: 0,
      businessName: '',
      entityType: 'LLC',
      businessAddress: '',
      ordinaryK1Income: 0,
      guaranteedK1Income: 0,
    });
    setIsModalOpen(true);
  };

  const handleEditYear = (year: string) => {
    const yearData = userData.yearlyData.find((d) => d.year === year);
    if (yearData) {
      setSelectedYear(year);
      setFormData(yearData);
      setIsModalOpen(true);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-6">
        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">Profile</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">First Name</label>
                <input
                  type="text"
                  value={userData.staticProfile.firstName}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      staticProfile: { ...prev.staticProfile, firstName: e.target.value },
                    }))
                  }
                  className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  value={userData.staticProfile.lastName}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      staticProfile: { ...prev.staticProfile, lastName: e.target.value },
                    }))
                  }
                  className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email</label>
              <input
                type="email"
                value={userData.staticProfile.email}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    staticProfile: { ...prev.staticProfile, email: e.target.value },
                  }))
                }
                className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Phone</label>
              <input
                type="tel"
                value={userData.staticProfile.phone}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    staticProfile: { ...prev.staticProfile, phone: e.target.value },
                  }))
                }
                className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              className="w-full mt-6 px-4 py-2 bg-[#12ab61] text-white rounded-lg hover:bg-[#0f9654] transition-colors"
            >
              Save Profile
            </button>
          </div>
        </div>

        {/* Yearly Data Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Tax Years</h2>
            <button
              onClick={handleAddYear}
              className="px-4 py-2 bg-[#12ab61] text-white rounded-lg hover:bg-[#0f9654] transition-colors"
            >
              Add Year
            </button>
          </div>
          <div className="space-y-4">
            {userData.yearlyData.map((yearData) => (
              <div
                key={yearData.year}
                onClick={() => handleEditYear(yearData.year)}
                className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">{yearData.year} Tax Year</h3>
                  <span className="text-[#12ab61]">Edit</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>Filing Status: {yearData.filingStatus}</div>
                  <div>State: {yearData.state}</div>
                  <div>Business Type: {yearData.entityType}</div>
                  <div>
                    Income: ${(yearData.wagesIncome + yearData.passiveIncome + yearData.unearnedIncome).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Year Data Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-xl shadow-xl focus:outline-none">
            <div className="sticky top-0 bg-[#efebe2] px-6 py-4 border-b flex justify-between items-center">
              <Dialog.Title className="text-xl font-bold">
                {selectedYear} Tax Year Information
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>

            <div className="p-6">
              <div className="space-y-8">
                {/* Checkboxes */}
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.standardDeduction}
                      onChange={(e) => setFormData({ ...formData, standardDeduction: e.target.checked })}
                      className="w-5 h-5 border-gray-300 rounded text-[#15a46f] focus:ring-[#15a46f]"
                    />
                    <span>Standard Deduction</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.businessOwner}
                      onChange={(e) => setFormData({ ...formData, businessOwner: e.target.checked })}
                      className="w-5 h-5 border-gray-300 rounded text-[#15a46f] focus:ring-[#15a46f]"
                    />
                    <span>Business Owner</span>
                  </label>
                </div>

                {!formData.standardDeduction && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Custom Deduction
                    </label>
                    <NumericFormat
                      value={formData.customDeduction}
                      onValueChange={(values) => setFormData({ ...formData, customDeduction: values.floatValue || 0 })}
                      thousandSeparator={true}
                      prefix="$"
                      className="numeric-input"
                      placeholder="Enter custom deduction amount"
                    />
                  </div>
                )}

                {/* Personal Section */}
                <div>
                  <h3 className="section-label">Personal</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">State</label>
                      <select
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="underline-input"
                      >
                        {states.map((state) => (
                          <option key={state.code} value={state.code}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Filing Status</label>
                      <select
                        value={formData.filingStatus}
                        onChange={(e) => setFormData({ ...formData, filingStatus: e.target.value })}
                        className="underline-input"
                      >
                        <option value="single">Single</option>
                        <option value="married_joint">Married Filing Jointly</option>
                        <option value="married_separate">Married Filing Separately</option>
                        <option value="head_household">Head of Household</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="form-label">Home Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <Autocomplete
                        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                        defaultValue={formData.homeAddress}
                        onPlaceSelected={(place: any) => setFormData({ ...formData, homeAddress: place.formatted_address })}
                        className="pl-10 pr-4 underline-input"
                        options={{ types: ['address'], componentRestrictions: { country: 'us' } }}
                        placeholder="Enter address"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="form-label">W-2 Income</label>
                      <NumericFormat
                        value={formData.wagesIncome}
                        onValueChange={(values) => setFormData({ ...formData, wagesIncome: values.floatValue || 0 })}
                        thousandSeparator={true}
                        prefix="$"
                        className="numeric-input"
                        placeholder="Enter W-2 income"
                      />
                    </div>
                    <div>
                      <label className="form-label">Passive Income</label>
                      <NumericFormat
                        value={formData.passiveIncome}
                        onValueChange={(values) => setFormData({ ...formData, passiveIncome: values.floatValue || 0 })}
                        thousandSeparator={true}
                        prefix="$"
                        className="numeric-input"
                        placeholder="Enter passive income"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="form-label">Unearned Income</label>
                      <NumericFormat
                        value={formData.unearnedIncome}
                        onValueChange={(values) => setFormData({ ...formData, unearnedIncome: values.floatValue || 0 })}
                        thousandSeparator={true}
                        prefix="$"
                        className="numeric-input"
                        placeholder="Enter unearned income"
                      />
                    </div>
                    <div>
                      <label className="form-label">Capital Gains</label>
                      <NumericFormat
                        value={formData.capitalGains}
                        onValueChange={(values) => setFormData({ ...formData, capitalGains: values.floatValue || 0 })}
                        thousandSeparator={true}
                        prefix="$"
                        className="numeric-input"
                        placeholder="Enter capital gains"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Section */}
                {formData.businessOwner && (
                  <div>
                    <h3 className="section-label">Business</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">Business Name</label>
                        <input
                          type="text"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className="underline-input"
                          placeholder="Enter business name"
                        />
                      </div>
                      <div>
                        <label className="form-label">Entity Type</label>
                        <select
                          value={formData.entityType}
                          onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                          className="underline-input"
                        >
                          <option value="LLC">LLC</option>
                          <option value="S-Corp">S-Corp</option>
                          <option value="C-Corp">C-Corp</option>
                          <option value="Sole Prop">Sole Proprietorship</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="form-label">Business Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Autocomplete
                          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                          defaultValue={formData.businessAddress}
                          onPlaceSelected={(place: any) =>
                            setFormData({ ...formData, businessAddress: place.formatted_address })
                          }
                          className="pl-10 pr-4 underline-input"
                          options={{ types: ['address'], componentRestrictions: { country: 'us' } }}
                          placeholder="Enter business address"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="form-label">Ordinary K-1 Income</label>
                        <NumericFormat
                          value={formData.ordinaryK1Income}
                          onValueChange={(values) =>
                            setFormData({ ...formData, ordinaryK1Income: values.floatValue || 0 })
                          }
                          thousandSeparator={true}
                          prefix="$"
                          className="numeric-input"
                          placeholder="Enter ordinary K-1 income"
                        />
                      </div>
                      <div>
                        <label className="form-label">Guaranteed K-1 Income</label>
                        <NumericFormat
                          value={formData.guaranteedK1Income}
                          onValueChange={(values) =>
                            setFormData({ ...formData, guaranteedK1Income: values.floatValue || 0 })
                          }
                          thousandSeparator={true}
                          prefix="$"
                          className="numeric-input"
                          placeholder="Enter guaranteed K-1 income"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveYearlyData}
                  className="px-6 py-2 bg-[#15a46f] text-white rounded-lg hover:bg-[#12965f]"
                >
                  Save
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}