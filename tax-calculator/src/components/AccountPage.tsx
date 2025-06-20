import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import { states } from '../data/states';
import { Lock, CreditCard, MapPin, Loader2 } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import Autocomplete from 'react-google-autocomplete';

const mapOptions = {
  mapTypeId: 'satellite',
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  zoomControl: true
};

export default function AccountPage() {
  const { isLoaded: isScriptLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const { user, updateUserProfile } = useUserStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    filingStatus: 'single',
    dependents: 0,
    homeAddress: '',
    state: 'CA',
    businessName: '',
    entityType: 'LLC',
    businessAddress: '',
  });

  const [homeLocation, setHomeLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [businessLocation, setBusinessLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [isHomeMapLoading, setIsHomeMapLoading] = useState(true);
  const [isBusinessMapLoading, setIsBusinessMapLoading] = useState(true);

  const mapContainerStyle = {
    width: '100%',
    height: '300px'
  };

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        filingStatus: user.filingStatus || 'single',
        dependents: user.dependents || 0,
        homeAddress: user.homeAddress || '',
        state: user.state || 'CA',
        businessName: user.businessName || '',
        entityType: user.entityType || 'LLC',
        businessAddress: user.businessAddress || '',
      });

      // Update map locations if addresses exist
      if (user.homeAddress) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: user.homeAddress }, (results, status) => {
          if (status === 'OK' && results?.[0]?.geometry?.location) {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();
            setHomeLocation({ lat, lng });
          }
        });
      }

      if (user.businessAddress) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: user.businessAddress }, (results, status) => {
          if (status === 'OK' && results?.[0]?.geometry?.location) {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();
            setBusinessLocation({ lat, lng });
          }
        });
      }
    }
  }, [user]);

  const handleHomeAddressSelect = (place: any) => {
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setHomeLocation({ lat, lng });
      setFormData({ ...formData, homeAddress: place.formatted_address || '' });
    }
  };

  const handleBusinessAddressSelect = (place: any) => {
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setBusinessLocation({ lat, lng });
      setFormData({ ...formData, businessAddress: place.formatted_address || '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile(formData);
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
      successMessage.textContent = 'Profile updated successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
    } catch (error) {
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
      errorMessage.textContent = 'Failed to update profile. Please try again.';
      document.body.appendChild(errorMessage);
      setTimeout(() => errorMessage.remove(), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isScriptLoaded) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#12ab61]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Account Settings</h1>

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
          <Tabs.Trigger
            value="billing"
            className={`px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === 'billing' 
                ? 'border-b-2 border-[#12ab61] text-[#12ab61]' 
                : 'text-gray-600 hover:text-gray-900'}`}
          >
            Billing
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="profile">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Filing Status</label>
                  <select
                    value={formData.filingStatus}
                    onChange={(e) => setFormData({...formData, filingStatus: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    disabled={isSaving}
                  >
                    <option value="single">Single</option>
                    <option value="married_joint">Married Filing Jointly</option>
                    <option value="married_separate">Married Filing Separately</option>
                    <option value="head_household">Head of Household</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                    disabled={isSaving}
                  >
                    {states.map(state => (
                      <option key={state.code} value={state.code}>{state.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-8">
                <h3 className="text-lg font-medium mb-6">Home Address</h3>
                <div className="space-y-6">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      defaultValue={formData.homeAddress}
                      onPlaceSelected={handleHomeAddressSelect}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61] focus:border-[#12ab61]"
                      options={{
                        types: ['address'],
                        componentRestrictions: { country: 'us' }
                      }}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="h-[300px] rounded-lg overflow-hidden">
                    <GoogleMap
                      center={homeLocation}
                      zoom={18}
                      mapContainerStyle={mapContainerStyle}
                      options={mapOptions}
                      onLoad={() => setIsHomeMapLoading(false)}
                    >
                      <Marker position={homeLocation} />
                    </GoogleMap>
                  </div>
                </div>
              </div>

              <div className="border-t pt-8">
                <h3 className="text-lg font-medium mb-6">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Name</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                    <select
                      value={formData.entityType}
                      onChange={(e) => setFormData({...formData, entityType: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#12ab61] focus:ring-[#12ab61]"
                      disabled={isSaving}
                    >
                      <option value="LLC">LLC</option>
                      <option value="S-Corp">S-Corporation</option>
                      <option value="C-Corp">C-Corporation</option>
                      <option value="Sole Prop">Sole Proprietorship</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      defaultValue={formData.businessAddress}
                      onPlaceSelected={handleBusinessAddressSelect}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#12ab61] focus:border-[#12ab61]"
                      options={{
                        types: ['address'],
                        componentRestrictions: { country: 'us' }
                      }}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="h-[300px] rounded-lg overflow-hidden">
                    <GoogleMap
                      center={businessLocation}
                      zoom={18}
                      mapContainerStyle={mapContainerStyle}
                      options={mapOptions}
                      onLoad={() => setIsBusinessMapLoading(false)}
                    >
                      <Marker position={businessLocation} />
                    </GoogleMap>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-6 py-2 bg-[#12ab61] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12ab61] focus:ring-offset-2 flex items-center space-x-2
                    ${isSaving ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#0f9654]'}`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </Tabs.Content>

        <Tabs.Content value="billing">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-8"
          >
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Billing Coming Soon</h3>
              <p className="text-gray-600">
                We're working on adding billing functionality. Check back soon!
              </p>
            </div>
          </motion.div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}