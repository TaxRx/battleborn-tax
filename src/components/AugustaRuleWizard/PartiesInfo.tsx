import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useTaxStore } from '../../store/taxStore';
import { useUserStore } from '../../store/userStore';
import Autocomplete from 'react-google-autocomplete';
import SignatureCanvas from 'react-signature-canvas';

interface FormData {
  businessInfo?: {
    businessAddress?: string;
  };
}

interface PartiesInfoProps {
  formData?: FormData;
  onNext: () => void;
  onBack: () => void;
  onSave: (data: any) => void;
}

interface CorporateOfficer {
  id: string;
  name: string;
  role: string;
}

const mapOptions = {
  mapTypeId: 'satellite',
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false
};

const PartiesInfo = ({ formData = { businessInfo: { businessAddress: '' } }, onNext, onBack, onSave }: PartiesInfoProps) => {
  const { isLoaded: isScriptLoaded, loadError: isScriptError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const { taxInfo } = useTaxStore();
  const { user } = useUserStore();

  // Homeowner Info
  const [taxpayerName, setTaxpayerName] = useState(taxInfo?.fullName || '');
  const [homeAddress, setHomeAddress] = useState(taxInfo?.homeAddress || '');
  const [householdIncome, setHouseholdIncome] = useState(taxInfo?.householdIncome?.toString() || '');
  const [filingType, setFilingType] = useState(taxInfo?.filingStatus || '');
  const [isAugustaProperty, setIsAugustaProperty] = useState(true);

  // Business Info
  const [businessName, setBusinessName] = useState(taxInfo?.businessName || '');
  const [businessAddress, setBusinessAddress] = useState(taxInfo?.businessAddress || formData.businessInfo?.businessAddress || '');
  const [entityType, setEntityType] = useState(taxInfo?.entityType || '');
  const [businessRepName, setBusinessRepName] = useState('');
  const [signature, setSignature] = useState<any>(null);

  // Corporate Officers
  const [officers, setOfficers] = useState<CorporateOfficer[]>([
    { id: '1', name: '', role: '' }
  ]);

  // Map States
  const [homeLocation, setHomeLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [businessLocation, setBusinessLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [isHomeMapLoading, setIsHomeMapLoading] = useState(true);
  const [isBusinessMapLoading, setIsBusinessMapLoading] = useState(true);

  const homeMapContainerStyle = {
    width: '100%',
    height: '300px'
  };

  const businessMapContainerStyle = {
    width: '100%',
    height: '300px'
  };

  const handleHomeAddressSelect = (place: any) => {
    if (place.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setHomeLocation({ lat, lng });
      setHomeAddress(place.formatted_address);
    }
  };

  const handleBusinessAddressSelect = (place: any) => {
    if (place.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setBusinessLocation({ lat, lng });
      setBusinessAddress(place.formatted_address);
    }
  };

  const addOfficer = () => {
    setOfficers([...officers, { id: Date.now().toString(), name: '', role: '' }]);
  };

  const removeOfficer = (id: string) => {
    if (officers.length > 1) {
      setOfficers(officers.filter(officer => officer.id !== id));
    }
  };

  const updateOfficer = (id: string, field: 'name' | 'role', value: string) => {
    setOfficers(officers.map(officer => 
      officer.id === id ? { ...officer, [field]: value } : officer
    ));
  };

  const handleNext = () => {
    onSave({
      homeowner: {
        taxpayerName,
        homeAddress,
        householdIncome,
        filingType,
        isAugustaProperty,
        homeLocation
      },
      business: {
        businessName,
        businessAddress,
        entityType,
        businessRepName,
        businessLocation,
        signature: signature?.toDataURL()
      },
      officers
    });
    onNext();
  };

  const isFormValid = () => {
    return (
      taxpayerName &&
      homeAddress &&
      householdIncome &&
      filingType &&
      businessName &&
      businessAddress &&
      entityType &&
      businessRepName &&
      signature?.toDataURL() &&
      officers.every(officer => officer.name && officer.role)
    );
  };

  if (!isScriptLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  if (isScriptError) {
    return (
      <div className="text-red-600 p-4">
        Error loading Google Maps. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Homeowner Info Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Homeowner Information</h3>
          <label className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Augusta Rule Property</span>
            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
              <input
                type="checkbox"
                className="hidden"
                checked={isAugustaProperty}
                onChange={(e) => setIsAugustaProperty(e.target.checked)}
              />
              <div
                className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                  isAugustaProperty ? 'bg-emerald' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow transform duration-200 ease-in-out ${
                    isAugustaProperty ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taxpayer's Name
            </label>
            <input
              type="text"
              value={taxpayerName}
              onChange={(e) => setTaxpayerName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
              placeholder="Enter taxpayer's name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filing Type
            </label>
            <select
              value={filingType}
              onChange={(e) => setFilingType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
            >
              <option value="">Select filing type</option>
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_household">Head of Household</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Household Income
            </label>
            <input
              type="number"
              value={householdIncome}
              onChange={(e) => setHouseholdIncome(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
              placeholder="Enter household income"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Home Address
            </label>
            <Autocomplete
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              defaultValue={homeAddress}
              onPlaceSelected={handleHomeAddressSelect}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
              options={{
                types: ['address'],
                componentRestrictions: { country: 'us' }
              }}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Location
          </label>
          <div className="h-[300px] rounded-lg overflow-hidden">
            <GoogleMap
              center={homeLocation}
              zoom={18}
              mapContainerStyle={homeMapContainerStyle}
              options={mapOptions}
              onLoad={() => setIsHomeMapLoading(false)}
            >
              <Marker position={homeLocation} />
            </GoogleMap>
          </div>
        </div>
      </div>

      {/* Business Info Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h3 className="text-lg font-medium mb-6">Business Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
              placeholder="Enter business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
            >
              <option value="">Select entity type</option>
              <option value="LLC">LLC</option>
              <option value="S-Corp">S-Corporation</option>
              <option value="C-Corp">C-Corporation</option>
              <option value="Sole Prop">Sole Proprietorship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Representative Name
            </label>
            <input
              type="text"
              value={businessRepName}
              onChange={(e) => setBusinessRepName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
              placeholder="Enter representative name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Address
            </label>
            <Autocomplete
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              defaultValue={businessAddress}
              onPlaceSelected={handleBusinessAddressSelect}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
              options={{
                types: ['address'],
                componentRestrictions: { country: 'us' }
              }}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Location
          </label>
          <div className="h-[300px] rounded-lg overflow-hidden">
            <GoogleMap
              center={businessLocation}
              zoom={18}
              mapContainerStyle={businessMapContainerStyle}
              options={mapOptions}
              onLoad={() => setIsBusinessMapLoading(false)}
            >
              <Marker position={businessLocation} />
            </GoogleMap>
          </div>
        </div>
      </div>

      {/* Corporate Officers Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Corporate Officers</h3>
          <button
            onClick={addOfficer}
            className="flex items-center space-x-2 text-navy hover:text-navy-700"
          >
            <Plus size={20} />
            <span>Add Officer</span>
          </button>
        </div>

        <div className="space-y-4">
          {officers.map((officer, index) => (
            <div key={officer.id} className="flex items-center space-x-4">
              <div className="flex-grow grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={officer.name}
                  onChange={(e) => updateOfficer(officer.id, 'name', e.target.value)}
                  placeholder="Officer name"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                />
                <input
                  type="text"
                  value={officer.role}
                  onChange={(e) => updateOfficer(officer.id, 'role', e.target.value)}
                  placeholder="Role/Title"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                />
              </div>
              {officers.length > 1 && (
                <button
                  onClick={() => removeOfficer(officer.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Signature Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">Rental Agreement Signature</h3>
        <div className="border rounded-lg p-4">
          <SignatureCanvas
            ref={(ref) => setSignature(ref)}
            canvasProps={{
              className: 'w-full h-40 border rounded-lg bg-gray-50',
            }}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => signature?.clear()}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Signature
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isFormValid()}
          className="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PartiesInfo;