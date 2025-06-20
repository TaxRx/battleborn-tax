import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useUserStore } from '../store/userStore';
import { useTaxProfileStore } from '../store/taxProfileStore';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import Autocomplete from 'react-google-autocomplete';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X, MapPin, CreditCard } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { motion } from 'framer-motion';
import InfoForm from './InfoForm';

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
  const { taxProfile, loading, error, fetchTaxProfile, updateTaxProfile } = useTaxProfileStore();
  const [showInfoForm, setShowInfoForm] = useState(false);

  useEffect(() => {
    fetchTaxProfile();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Tax Profile</h2>
          <button
            onClick={() => setShowInfoForm(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition"
          >
            Edit
          </button>
        </div>
        {taxProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-2"><strong>Name:</strong> {taxProfile.fullName}</div>
              <div className="mb-2"><strong>Email:</strong> {taxProfile.email}</div>
              <div className="mb-2"><strong>Filing Status:</strong> {taxProfile.filingStatus}</div>
              <div className="mb-2"><strong>State:</strong> {taxProfile.state}</div>
              <div className="mb-2"><strong>Dependents:</strong> {taxProfile.dependents}</div>
              <div className="mb-2"><strong>Home Address:</strong> {taxProfile.homeAddress}</div>
              <div className="mb-2"><strong>Business Owner:</strong> {taxProfile.businessOwner ? 'Yes' : 'No'}</div>
              {taxProfile.businessOwner && (
                <>
                  <div className="mb-2"><strong>Business Name:</strong> {taxProfile.businessName}</div>
                  <div className="mb-2"><strong>Entity Type:</strong> {taxProfile.entityType}</div>
                  <div className="mb-2"><strong>Business Address:</strong> {taxProfile.businessAddress}</div>
                </>
              )}
            </div>
            <div>
              <div className="mb-2"><strong>Wages Income:</strong> ${taxProfile.wagesIncome.toLocaleString()}</div>
              <div className="mb-2"><strong>Passive Income:</strong> ${taxProfile.passiveIncome.toLocaleString()}</div>
              <div className="mb-2"><strong>Unearned Income:</strong> ${taxProfile.unearnedIncome.toLocaleString()}</div>
              <div className="mb-2"><strong>Capital Gains:</strong> ${taxProfile.capitalGains.toLocaleString()}</div>
              {taxProfile.businessOwner && (
                <>
                  <div className="mb-2"><strong>Ordinary K-1 Income:</strong> ${taxProfile.ordinaryK1Income?.toLocaleString()}</div>
                  <div className="mb-2"><strong>Guaranteed K-1 Income:</strong> ${taxProfile.guaranteedK1Income?.toLocaleString()}</div>
                </>
              )}
              <div className="mb-2"><strong>Standard Deduction:</strong> {taxProfile.standardDeduction ? 'Yes' : 'No'}</div>
              <div className="mb-2"><strong>Custom Deduction:</strong> ${taxProfile.customDeduction?.toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div>No tax profile found.</div>
        )}
      </div>
      <Dialog.Root open={showInfoForm} onOpenChange={setShowInfoForm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}