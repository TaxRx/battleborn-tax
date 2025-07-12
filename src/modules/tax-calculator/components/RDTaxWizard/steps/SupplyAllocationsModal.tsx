import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { SupplyManagementService, SupplyWithExpenses, SupplySubcomponentAllocation } from '../../../services/supplyManagementService';

interface SupplyAllocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supply: SupplyWithExpenses;
  businessYearId: string;
  onUpdate: () => void;
}

export const SupplyAllocationsModal: React.FC<SupplyAllocationsModalProps> = ({
  isOpen,
  onClose,
  supply,
  businessYearId,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState<SupplySubcomponentAllocation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && supply) {
      loadAllocationData();
    }
    // eslint-disable-next-line
  }, [isOpen, supply]);

  const loadAllocationData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get all selected subcomponents for this business year
      const subcomponents = await SupplyManagementService.getAvailableSubcomponents(businessYearId);
      // 2. Get existing allocations for this supply
      const existingAllocations = await SupplyManagementService.getSupplyAllocations(supply.id, businessYearId);
      // 3. Merge: for each subcomponent, find allocation or create default
      const merged = subcomponents.map((sub: any) => {
        const found = existingAllocations.find(a => a.subcomponent_id === sub.subcomponent_id);
        return {
          id: found?.id,
          supply_id: supply.id,
          subcomponent_id: sub.subcomponent_id,
          business_year_id: businessYearId,
          applied_percentage: found?.applied_percentage ?? 0,
          is_included: found?.is_included ?? false,
          subcomponent_name: sub.title,
          step_name: sub.step_name
        };
      });
      setAllocations(merged);
    } catch (e: any) {
      setError(e.message || 'Error loading allocations');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (subcomponentId: string, field: keyof SupplySubcomponentAllocation, value: any) => {
    setAllocations(prev => prev.map(a =>
      a.subcomponent_id === subcomponentId ? { ...a, [field]: value } : a
    ));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Only save included allocations
      const toSave = allocations.filter(a => a.is_included && a.applied_percentage > 0);
      await SupplyManagementService.saveSupplyAllocations(supply.id, businessYearId, toSave);
      onUpdate();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error saving allocations');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !supply) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Supply Allocations</h2>
            <p className="text-sm text-gray-600">{supply.name} - {supply.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-2 text-gray-600">Loading allocations...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-sm text-gray-700 mb-2">Assign a percentage of this supply to each subcomponent. Only included rows with &gt;0% will be saved.</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Include</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcomponent</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allocations.map((a) => (
                      <tr key={a.subcomponent_id}>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={a.is_included}
                            onChange={e => handleChange(a.subcomponent_id, 'is_included', e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-2">{a.subcomponent_name}</td>
                        <td className="px-4 py-2">{a.step_name}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={a.applied_percentage}
                            disabled={!a.is_included}
                            onChange={e => handleChange(a.subcomponent_id, 'applied_percentage', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
                          />
                          <span className="ml-1 text-gray-500">%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Allocations
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 