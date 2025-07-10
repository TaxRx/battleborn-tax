import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { SupplyManagementService, SupplyWithExpenses, QuickSupplyEntry } from '../../../services/supplyManagementService';
import { SupplyAllocationsModal } from './SupplyAllocationsModal';

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(1)}%`;
};

interface SupplySetupStepProps {
  supplies: SupplyWithExpenses[];
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  businessYearId?: string;
  businessId?: string;
}

interface QuickSupplyEntryFormProps {
  onAdd: (supply: QuickSupplyEntry) => void;
}

const QuickSupplyEntryForm: React.FC<QuickSupplyEntryFormProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount.trim()) return;

    onAdd({
      name: name.trim(),
      description: description.trim(),
      amount: amount.trim()
    });

    // Reset form
    setName('');
    setDescription('');
    setAmount('');
  };

  const formatAmount = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return numericValue;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatAmount(e.target.value);
    setAmount(formattedValue);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Supply</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Lab Equipment"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Brief description"
            />
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Total Amount *
            </label>
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supply
          </button>
        </div>
      </form>
    </div>
  );
};

const SupplySetupStep: React.FC<SupplySetupStepProps> = ({
  supplies,
  onUpdate,
  onNext,
  onPrevious,
  businessYearId = '',
  businessId = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<SupplyWithExpenses | null>(null);
  const [isAllocationsModalOpen, setIsAllocationsModalOpen] = useState(false);

  const loadData = async () => {
    if (!businessYearId) return;
    
    setLoading(true);
    try {
      const suppliesData = await SupplyManagementService.getSupplies(businessYearId);
      onUpdate({ supplies: suppliesData });
    } catch (error) {
      console.error('Error loading supplies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessYearId]);

  const handleQuickAddSupply = async (supplyData: QuickSupplyEntry) => {
    if (!businessId) return;
    
    try {
      console.log('🔄 Adding supply:', supplyData);
      
      await SupplyManagementService.addSupply(supplyData, businessId);
      
      // Reload data to show new supply
      await loadData();
      
      console.log('✅ Supply added successfully');
    } catch (error) {
      console.error('❌ Error adding supply:', error);
    }
  };

  const handleDeleteSupply = async (supplyId: string) => {
    if (!confirm('Are you sure you want to delete this supply? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('🗑️ Deleting supply:', supplyId);
      
      await SupplyManagementService.deleteSupply(supplyId);
      
      // Reload data
      await loadData();
      
      console.log('✅ Supply deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting supply:', error);
    }
  };

  const handleEditSupply = (supply: SupplyWithExpenses) => {
    setSelectedSupply(supply);
    setIsAllocationsModalOpen(true);
  };

  const handleAllocationsModalClose = () => {
    setIsAllocationsModalOpen(false);
    setSelectedSupply(null);
    loadData(); // Reload data after modal closes
  };

  const totalQRE = supplies.reduce((sum, supply) => sum + (supply.calculated_qre || 0), 0);
  const totalAppliedPercentage = supplies.reduce((sum, supply) => sum + (supply.applied_percentage || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Supply Management</h2>
            <p className="text-gray-600">Add and manage supplies for R&D activities</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalQRE)}</div>
            <div className="text-sm text-gray-500">Total QRE</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Total Supplies</div>
            <div className="text-2xl font-bold text-gray-900">{supplies.length}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Total Applied %</div>
            <div className="text-2xl font-bold text-gray-900">{formatPercentage(totalAppliedPercentage)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Average Applied %</div>
            <div className="text-2xl font-bold text-gray-900">
              {supplies.length > 0 ? formatPercentage(totalAppliedPercentage / supplies.length) : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Form */}
      <QuickSupplyEntryForm onAdd={handleQuickAddSupply} />

      {/* Supplies Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Supplies</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-2 text-gray-600">Loading supplies...</span>
          </div>
        ) : supplies.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-500 mb-2">No supplies added yet</div>
            <div className="text-sm text-gray-400">Use the Quick Add form above to add your first supply</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QRE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied %
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplies.map((supply) => (
                  <tr key={supply.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{supply.name}</div>
                        {supply.description && (
                          <div className="text-sm text-gray-500">{supply.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(supply.cost_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(supply.calculated_qre)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(supply.applied_percentage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditSupply(supply)}
                          className="text-orange-600 hover:text-orange-900 p-1"
                          title="Manage Allocations"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupply(supply.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Supply"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          Previous
        </button>
        
        <button
          onClick={onNext}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          Next
        </button>
      </div>

      {/* Allocations Modal */}
      {selectedSupply && (
        <SupplyAllocationsModal
          isOpen={isAllocationsModalOpen}
          onClose={handleAllocationsModalClose}
          supply={selectedSupply}
          businessYearId={businessYearId}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

export default SupplySetupStep; 