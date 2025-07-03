import React, { useState } from 'react';
import { X, Building, Save, AlertCircle } from 'lucide-react';

interface TaxPlanningClient {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  annual_income: number;
  filing_status: string;
  state: string;
  business_owner: boolean;
  current_stage: string;
  created_at: string;
  updated_at: string;
}

interface BusinessFormData {
  name: string;
  ein: string;
  entityType: string;
  startYear: number;
  state: string;
  address: string;
  city: string;
  zip: string;
}

interface CreateBusinessModalProps {
  client: TaxPlanningClient;
  onCreate: (businessData: BusinessFormData) => void;
  onClose: () => void;
}

const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  client,
  onCreate,
  onClose
}) => {
  const [formData, setFormData] = useState<BusinessFormData>({
    name: client.company || '',
    ein: '',
    entityType: 'LLC',
    startYear: new Date().getFullYear(),
    state: client.state || 'NV',
    address: '',
    city: '',
    zip: ''
  });

  const [errors, setErrors] = useState<Partial<BusinessFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entityTypes = [
    { value: 'LLC', label: 'Limited Liability Company (LLC)' },
    { value: 'SCORP', label: 'S Corporation' },
    { value: 'CCORP', label: 'C Corporation' },
    { value: 'PARTNERSHIP', label: 'Partnership' },
    { value: 'SOLEPROP', label: 'Sole Proprietorship' },
    { value: 'OTHER', label: 'Other' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<BusinessFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (!formData.ein.trim()) {
      newErrors.ein = 'EIN is required';
    } else if (!/^\d{2}-\d{7}$/.test(formData.ein)) {
      newErrors.ein = 'EIN must be in format XX-XXXXXXX';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required';
    }

    if (formData.startYear < 1900 || formData.startYear > new Date().getFullYear()) {
      newErrors.startYear = 'Start year must be between 1900 and current year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(formData);
    } catch (error) {
      console.error('Error creating business:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatEIN = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) {
      return cleaned;
    }
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 9)}`;
  };

  const handleEINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatEIN(e.target.value);
    setFormData(prev => ({ ...prev, ein: formatted }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add New Business</h2>
              <p className="text-sm text-gray-600">for {client.full_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Business Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter business name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EIN *
                  </label>
                  <input
                    type="text"
                    value={formData.ein}
                    onChange={handleEINChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.ein ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="XX-XXXXXXX"
                    maxLength={10}
                  />
                  {errors.ein && (
                    <p className="mt-1 text-sm text-red-600">{errors.ein}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Type *
                  </label>
                  <select
                    value={formData.entityType}
                    onChange={(e) => setFormData(prev => ({ ...prev, entityType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {entityTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Year *
                  </label>
                  <input
                    type="number"
                    value={formData.startYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, startYear: parseInt(e.target.value) }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.startYear ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                  {errors.startYear && (
                    <p className="mt-1 text-sm text-red-600">{errors.startYear}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter street address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter city"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.zip ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter ZIP code"
                    />
                    {errors.zip && (
                      <p className="mt-1 text-sm text-red-600">{errors.zip}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Next Steps</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    After creating this business, you'll be able to set up R&D activities, 
                    add employees, and calculate tax credits. The business will be linked to 
                    {client.full_name}'s client profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Business
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBusinessModal; 