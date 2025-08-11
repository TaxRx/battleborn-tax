import React, { useState } from 'react';
import { X, User, Building, MapPin, DollarSign, Save, Plus } from 'lucide-react';
import InfoForm from '../../../components/InfoForm';
import { TaxInfo } from '../../../types';
import { CentralizedClientService } from '../../../services/centralizedClientService';
import { toast } from 'react-hot-toast';

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
  const [isCreating, setIsCreating] = useState(false);

  // Handler to adapt InfoForm's TaxInfo to client creation
  const handleInfoFormSubmit = async (taxInfo: TaxInfo, year: number) => {
    if (isCreating) return; // Prevent duplicate submissions
    
    console.log('[CreateClientModal] Creating client with tax info:', taxInfo);
    setIsCreating(true);

    try {
      // Create client data from TaxInfo
      const clientData = {
        full_name: taxInfo.fullName,
        email: taxInfo.email,
        phone: taxInfo.phone || null,
        filing_status: taxInfo.filingStatus,
        dependents: taxInfo.dependents,
        home_address: taxInfo.homeAddress || null,
        state: taxInfo.state,
        personal_years: [{
          year,
          wages_income: taxInfo.wagesIncome,
          passive_income: taxInfo.passiveIncome,
          unearned_income: taxInfo.unearnedIncome,
          capital_gains: taxInfo.capitalGains,
          long_term_capital_gains: 0,
          is_active: true
        }]
      };

      // Call the centralized client service to create the client
      const result = await CentralizedClientService.createClient(clientData);

      if (result.success) {
        toast.success('Client created successfully!');
        onClientCreated(taxInfo);
        onClose();
      } else {
        toast.error(result.error || 'Failed to create client');
      }
    } catch (error) {
      console.error('[CreateClientModal] Error creating client:', error);
      toast.error('Failed to create client. Please try again.');
    } finally {
      setIsCreating(false);
    }
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
          <InfoForm 
            onSubmit={handleInfoFormSubmit} 
            isOpen={true} 
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateClientModal; 