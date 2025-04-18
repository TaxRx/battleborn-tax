import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, MapPin } from 'lucide-react';
import { TaxInfo } from '../types';
import { states } from '../data/states';
import { NumericFormat } from 'react-number-format';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import Autocomplete from 'react-google-autocomplete';

interface UpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taxInfo: TaxInfo;
  onUpdate: (info: TaxInfo) => void;
}

export default function UpdateDialog({ isOpen, onClose, taxInfo, onUpdate }: UpdateDialogProps) {
  const [formData, setFormData] = React.useState<TaxInfo>(taxInfo);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  if (!isLoaded) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-xl shadow-xl focus:outline-none">
          <div className="sticky top-0 bg-[#efebe2] px-6 py-4 border-b flex justify-between items-center">
            <Dialog.Title className="text-xl font-bold">
              2025 Tax Year Information
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
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
                      onChange={(e) => setFormData({ ...formData, filingStatus: e.target.value as TaxInfo['filingStatus'] })}
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
                        onChange={(e) => setFormData({ ...formData, entityType: e.target.value as TaxInfo['entityType'] })}
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
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#15a46f] text-white rounded-lg hover:bg-[#12965f]"
              >
                Save
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}