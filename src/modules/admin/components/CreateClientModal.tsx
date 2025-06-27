import React, { useState } from 'react';
import { X, User, Building, MapPin, DollarSign, Save, Plus } from 'lucide-react';
import InfoForm from '../../../components/InfoForm';
import { TaxInfo } from '../../../types';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (clientData: TaxInfo) => void;
  loading?: boolean;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
  loading = false
}) => {
  // Handler to adapt InfoForm's TaxInfo to client creation
  const handleInfoFormSubmit = (taxInfo: TaxInfo, year: number) => {
    // Pass the TaxInfo directly to the parent component
    onClientCreated(taxInfo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Client</h2>
              <p className="text-sm text-gray-600">Add a new client to your system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* InfoForm for new client creation */}
        <div className="p-6">
          <InfoForm onSubmit={handleInfoFormSubmit} />
        </div>
      </div>
    </div>
  );
};

export default CreateClientModal; 