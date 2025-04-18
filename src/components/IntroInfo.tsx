import React, { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { states } from '../data/states';
import { MapPin } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import Autocomplete from 'react-google-autocomplete';
import { NumericFormat } from 'react-number-format';

interface IntroInfoProps {
  onComplete: () => void;
}

interface UserData {
  staticProfile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  yearlyData: Array<{
    year: string;
    standardDeduction: boolean;
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
  }>;
}

const mapOptions = {
  mapTypeId: 'satellite',
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  zoomControl: true
};

export default function IntroInfo({ onComplete }: IntroInfoProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const { user, updateUserProfile } = useUserStore();
  const [userData, setUserData] = useState<UserData>({
    staticProfile: {
      firstName: user?.fullName?.split(' ')[0] || '',
      lastName: user?.fullName?.split(' ')[1] || '',
      email: user?.email || '',
      phone: user?.phone || ''
    },
    yearlyData: [{
      year: new Date().getFullYear().toString(),
      standardDeduction: true,
      businessOwner: false,
      filingStatus: 'single',
      state: 'CA',
      dependents: 0,
      homeAddress: user?.homeAddress || '',
      wagesIncome: 0,
      passiveIncome: 0,
      unearnedIncome: 0,
      capitalGains: 0,
      businessName: user?.businessName || '',
      entityType: user?.entityType || 'LLC',
      businessAddress: user?.businessAddress || '',
      ordinaryK1Income: 0,
      guaranteedK1Income: 0
    }]
  });

  const [homeLocation, setHomeLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [businessLocation, setBusinessLocation] = useState({ lat: 40.7128, lng: -74.0060 });

  const handleHomeAddressSelect = (place: any) => {
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setHomeLocation({ lat, lng });
      setUserData(prev => ({
        ...prev,
        yearlyData: [
          {
            ...prev.yearlyData[0],
            homeAddress: place.formatted_address || ''
          }
        ]
      }));
    }
  };

  const handleBusinessAddressSelect = (place: any) => {
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setBusinessLocation({ lat, lng });
      setUserData(prev => ({
        ...prev,
        yearlyData: [
          {
            ...prev.yearlyData[0],
            businessAddress: place.formatted_address || ''
          }
        ]
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      const fullName = `${userData.staticProfile.firstName} ${userData.staticProfile.lastName}`.trim();
      const yearData = userData.yearlyData[0];

      await updateUserProfile({
        fullName,
        email: userData.staticProfile.email,
        phone: userData.staticProfile.phone,
        homeAddress: yearData.homeAddress,
        businessName: yearData.businessName,
        businessAddress: yearData.businessAddress,
        entityType: yearData.entityType as any,
        filingStatus: yearData.filingStatus as any,
        state: yearData.state,
        dependents: yearData.dependents,
        yearlyData: userData.yearlyData
      });

      onComplete();
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#f8f6f1] px-6 py-4 border-b">
          <h2 className="text-xl font-bold uppercase">Initial Setup</h2>
        </div>

        <div className="p-6 space-y-8">
          {/* Profile Information */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-4">Profile Information</h3>
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
            </div>
          </div>

          {/* Tax Year Information */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-4">
              {userData.yearlyData[0].year} Tax Year Information
            </h3>
            
            <div className="flex space-x-6 mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={userData.yearlyData[0].standardDeduction}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      yearlyData: [
                        {
                          ...prev.yearlyData[0],
                          standardDeduction: e.target.checked,
                        },
                      ],
                    }))
                  }
                  className="w-5 h-5 border-gray-300 rounded text-[#12ab61] focus:ring-[#12ab61]"
                />
                <span>Standard Deduction</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={userData.yearlyData[0].businessOwner}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      yearlyData: [
                        {
                          ...prev.yearlyData[0],
                          businessOwner: e.target.checked,
                        },
                      ],
                    }))
                  }
                  className="w-5 h-5 border-gray-300 rounded text-[#12ab61] focus:ring-[#12ab61]"
                />
                <span>Business Owner</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Filing Status</label>
                <select
                  value={userData.yearlyData[0].filingStatus}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      yearlyData: [
                        {
                          ...prev.yearlyData[0],
                          filingStatus: e.target.value,
                        },
                      ],
                    }))
                  }
                  className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                >
                  <option value="single">Single</option>
                  <option value="married_joint">Married Filing Jointly</option>
                  <option value="married_separate">Married Filing Separately</option>
                  <option value="head_household">Head of Household</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">State</label>
                <select
                  value={userData.yearlyData[0].state}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      yearlyData: [
                        {
                          ...prev.yearlyData[0],
                          state: e.target.value,
                        },
                      ],
                    }))
                  }
                  className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                >
                  {states.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Home Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Autocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                  defaultValue={userData.yearlyData[0].homeAddress}
                  onPlaceSelected={handleHomeAddressSelect}
                  className="w-full pl-10 pr-4 py-2 bg-transparent border-0 border-b-2 border-[#12ab61] text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                  options={{ types: ['address'], componentRestrictions: { country: 'us' } }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">W-2 Income</label>
                <NumericFormat
                  value={userData.yearlyData[0].wagesIncome}
                  onValueChange={(values) =>
                    setUserData((prev) => ({
                      ...prev,
                      yearlyData: [
                        {
                          ...prev.yearlyData[0],
                          wagesIncome: values.floatValue || 0,
                        },
                      ],
                    }))
                  }
                  thousandSeparator={true}
                  prefix="$"
                  className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Passive Income</label>
                <NumericFormat
                  value={userData.yearlyData[0].passiveIncome}
                  onValueChange={(values) =>
                    setUserData((prev) => ({
                      ...prev,
                      yearlyData: [
                        {
                          ...prev.yearlyData[0],
                          passiveIncome: values.floatValue || 0,
                        },
                      ],
                    }))
                  }
                  thousandSeparator={true}
                  prefix="$"
                  className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Unearned Income</label>
                <NumericFormat
                  value={userData.yearlyData[0].unearnedIncome}
                  onValueChange={(values) =>
                    setUserData((prev) => ({
                      ...prev,
                      yearlyData: [
                        {
                          ...prev.yearlyData[0],
                          unearnedIncome: values.floatValue || 0,
                        },
                      ],
                    }))
                  }
                  thousandSeparator={true}
                  prefix="$"
                  className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Capital Gains</label>
                <NumericFormat
                  value={userData.yearlyData[0].capitalGains}
                  onValueChange={(values) =>
                    setUserData((prev) => ({
                      ...prev,
                      yearlyData: [
                        {
                          ...prev.yearlyData[0],
                          capitalGains: values.floatValue || 0,
                        },
                      ],
                    }))
                  }
                  thousandSeparator={true}
                  prefix="$"
                  className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                />
              </div>
            </div>

            {userData.yearlyData[0].businessOwner && (
              <div className="mt-8">
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-4">Business Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Business Name</label>
                    <input
                      type="text"
                      value={userData.yearlyData[0].businessName}
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          yearlyData: [
                            {
                              ...prev.yearlyData[0],
                              businessName: e.target.value,
                            },
                          ],
                        }))
                      }
                      className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Entity Type</label>
                    <select
                      value={userData.yearlyData[0].entityType}
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          yearlyData: [
                            {
                              ...prev.yearlyData[0],
                              entityType: e.target.value,
                            },
                          ],
                        }))
                      }
                      className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                    >
                      <option value="LLC">LLC</option>
                      <option value="S-Corp">S-Corp</option>
                      <option value="C-Corp">C-Corp</option>
                      <option value="Sole Prop">Sole Proprietorship</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Business Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      defaultValue={userData.yearlyData[0].businessAddress}
                      onPlaceSelected={handleBusinessAddressSelect}
                      className="w-full pl-10 pr-4 py-2 bg-transparent border-0 border-b-2 border-[#12ab61] text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                      options={{ types: ['address'], componentRestrictions: { country: 'us' } }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Ordinary K-1 Income</label>
                    <NumericFormat
                      value={userData.yearlyData[0].ordinaryK1Income}
                      onValueChange={(values) =>
                        setUserData((prev) => ({
                          ...prev,
                          yearlyData: [
                            {
                              ...prev.yearlyData[0],
                              ordinaryK1Income: values.floatValue || 0,
                            },
                          ],
                        }))
                      }
                      thousandSeparator={true}
                      prefix="$"
                      className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Guaranteed K-1 Income</label>
                    <NumericFormat
                      value={userData.yearlyData[0].guaranteedK1Income}
                      onValueChange={(values) =>
                        setUserData((prev) => ({
                          ...prev,
                          yearlyData: [
                            {
                              ...prev.yearlyData[0],
                              guaranteedK1Income: values.floatValue || 0,
                            },
                          ],
                        }))
                      }
                      thousandSeparator={true}
                      prefix="$"
                      className="w-full bg-transparent border-0 border-b-2 border-[#12ab61] px-0 py-2 text-lg font-medium focus:ring-0 focus:border-[#12ab61]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-[#12ab61] text-white rounded-lg hover:bg-[#0f9654]"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}