import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  ein: string;
  client_id: string;
}

interface BusinessSelectorProps {
  businesses: Business[];
  selectedBusiness: Business | null;
  onBusinessChange: (business: Business) => void;
  loading?: boolean;
}

const BusinessSelector: React.FC<BusinessSelectorProps> = ({
  businesses,
  selectedBusiness,
  onBusinessChange,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Building2 className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Business</span>
        </div>
        <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Building2 className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Business</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-500 text-sm">No businesses found for your account.</p>
        </div>
      </div>
    );
  }

  if (businesses.length === 1) {
    // Single business - show as static display
    const business = businesses[0];
    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Building2 className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Business</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {business.name}
              </p>
              <p className="text-sm text-gray-500">
                EIN: {business.ein}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple businesses - show dropdown
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-2">
        <Building2 className="h-5 w-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Select Business</span>
      </div>
      <div className="relative">
        <select
          value={selectedBusiness?.id || ''}
          onChange={(e) => {
            const business = businesses.find(b => b.id === e.target.value);
            if (business) {
              onBusinessChange(business);
            }
          }}
          className="w-full bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
        >
          <option value="">Select a business...</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name} (EIN: {business.ein})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {selectedBusiness && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">
                {selectedBusiness.name}
              </p>
              <p className="text-xs text-blue-700">
                EIN: {selectedBusiness.ein}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSelector;