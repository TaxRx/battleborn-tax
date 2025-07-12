import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings, Package } from 'lucide-react';
import { SupplyManagementService, SupplyWithExpenses, QuickSupplyEntry } from '../../../services/supplyManagementService';
import SupplyAllocationsModal from './SupplyAllocationsModal';

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
    <form onSubmit={handleSubmit} className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-3">
          <Package className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Quick Add Supply</h3>
      </div>
      
      <div className="grid grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="Lab Equipment"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="Brief description"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="0.00"
            required
          />
        </div>
        
        <div></div>
        <div></div>
        
        <div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-md font-medium"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Supply
          </button>
        </div>
      </div>
    </form>
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
        
        {/* Remove the Supply Management summary card/section */}

      </div>

      {/* Quick Add Form */}
      {/* QuickSupplyEntryForm moved to Quick Actions card in EmployeeSetupStep */}

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
            <div className="text-sm text-gray-400">Use the Quick Add form in Quick Actions to add your first supply</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Supplies Table Header */}
            <div className="grid grid-cols-5 gap-2 px-6 py-2 bg-purple-50 border-b border-purple-200 font-semibold text-purple-700 text-base items-center">
              <div className="text-left">Name</div>
              <div className="text-left">Total Amount</div>
              <div className="text-center">QRE</div>
              <div className="text-center">Applied %</div>
              <div className="text-right">Actions</div>
            </div>
            {/* Supplies Table Rows */}
            {supplies.map((supply) => (
              <div
                key={supply.id}
                className="grid grid-cols-5 gap-2 px-6 py-3 border-b border-purple-100 items-center hover:bg-purple-50 transition-all duration-150"
                style={{ minHeight: '56px' }}
              >
                {/* Name */}
                <div className="font-bold text-lg text-gray-900">{supply.name}
                  {supply.description && (
                    <div className="text-sm text-gray-500 font-normal">{supply.description}</div>
                  )}
                </div>
                {/* Total Amount */}
                <div className="text-lg text-gray-900">{formatCurrency(supply.cost_amount)}</div>
                {/* QRE */}
                <div className="text-lg text-gray-900 text-center">{formatCurrency(supply.calculated_qre)}</div>
                {/* Applied % */}
                <div className="text-lg text-gray-900 text-center">{formatPercentage(supply.applied_percentage)}</div>
                {/* Actions */}
                <div className="flex justify-end items-center space-x-2">
                  <button
                    onClick={() => handleEditSupply(supply)}
                    className="p-2 rounded-full hover:bg-purple-100 transition"
                    title="Manage Allocations"
                  >
                    <Settings className="w-5 h-5 text-purple-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteSupply(supply.id)}
                    className="p-2 rounded-full hover:bg-red-100 transition"
                    title="Delete Supply"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
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
          supplyId={selectedSupply.id}
          businessYearId={businessYearId}
          supplyName={selectedSupply.name}
          annualCost={selectedSupply.cost_amount || 0}
        />
      )}
    </div>
  );
};

export { QuickSupplyEntryForm };
export default SupplySetupStep; 