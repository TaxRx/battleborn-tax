import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';

interface SupplyAllocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplyId: string;
  businessYearId: string;
  supplyName: string;
  annualCost: number;
}

interface SubcomponentAllocation {
  id: string;
  name: string;
  isIncluded: boolean;
  appliedPercentage: number;
}

const SupplyAllocationsModal: React.FC<SupplyAllocationsModalProps> = ({
  isOpen,
  onClose,
  supplyId,
  businessYearId,
  supplyName,
  annualCost
}) => {
  const [allocations, setAllocations] = useState<SubcomponentAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPercentage, setTotalPercentage] = useState(0);

  // Load subcomponents and existing allocations
  useEffect(() => {
    if (isOpen) {
      loadSubcomponents();
    }
  }, [isOpen, supplyId, businessYearId]);

  // Calculate total percentage whenever allocations change
  useEffect(() => {
    const total = allocations.reduce((sum, allocation) => {
      return sum + (allocation.isIncluded ? allocation.appliedPercentage : 0);
    }, 0);
    setTotalPercentage(total);
  }, [allocations]);

  const loadSubcomponents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all selected subcomponents for this business year
      const { data: subcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          subcomponent_id,
          subcomponent:rd_research_subcomponents (
            id,
            name
          )
        `)
        .eq('business_year_id', businessYearId);

      if (subError) throw subError;

      // Get existing allocations for this supply
      const { data: existingAllocations, error: allocError } = await supabase
        .from('rd_supply_subcomponents')
        .select('subcomponent_id, applied_percentage, is_included')
        .eq('supply_id', supplyId)
        .eq('business_year_id', businessYearId);

      if (allocError) throw allocError;

      // Create allocation objects
      const allocationMap = new Map();
      existingAllocations?.forEach(alloc => {
        allocationMap.set(alloc.subcomponent_id, {
          appliedPercentage: alloc.applied_percentage,
          isIncluded: alloc.is_included
        });
      });

      const newAllocations: SubcomponentAllocation[] = (subcomponents || []).map(sub => {
        const existing = allocationMap.get(sub.subcomponent_id);
        return {
          id: sub.subcomponent_id,
          name: sub.subcomponent?.name || 'Unknown Subcomponent',
          isIncluded: existing?.isIncluded ?? true,
          appliedPercentage: existing?.appliedPercentage ?? 0
        };
      });

      setAllocations(newAllocations);
    } catch (err) {
      console.error('Error loading subcomponents:', err);
      setError('Failed to load subcomponents');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIncluded = (index: number) => {
    const newAllocations = [...allocations];
    newAllocations[index].isIncluded = !newAllocations[index].isIncluded;
    if (!newAllocations[index].isIncluded) {
      newAllocations[index].appliedPercentage = 0;
    }
    setAllocations(newAllocations);
  };

  const handlePercentageChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newAllocations = [...allocations];
    newAllocations[index].appliedPercentage = Math.min(100, Math.max(0, numValue));
    setAllocations(newAllocations);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate total percentage doesn't exceed 100%
      if (totalPercentage > 100) {
        setError('Total percentage cannot exceed 100%');
        return;
      }

      console.log('Debug - Supply ID:', supplyId);
      console.log('Debug - Business Year ID:', businessYearId);
      console.log('Debug - Allocations to insert:', allocations.filter(alloc => alloc.isIncluded && alloc.appliedPercentage > 0));

      // Delete existing allocations for this supply and business year
      const { error: deleteError } = await supabase
        .from('rd_supply_subcomponents')
        .delete()
        .eq('supply_id', supplyId)
        .eq('business_year_id', businessYearId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Insert new allocations with calculated dollar amounts
      const allocationsToInsert = allocations
        .filter(alloc => alloc.isIncluded && alloc.appliedPercentage > 0)
        .map(alloc => {
          const appliedDollarAmount = (annualCost * alloc.appliedPercentage) / 100;
          return {
            supply_id: supplyId,
            subcomponent_id: alloc.id,
            business_year_id: businessYearId,
            applied_percentage: alloc.appliedPercentage,
            amount_applied: appliedDollarAmount,
            is_included: alloc.isIncluded
          };
        });

      console.log('Debug - Final allocations to insert:', allocationsToInsert);

      if (allocationsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('rd_supply_subcomponents')
          .insert(allocationsToInsert);

        if (insertError) {
          console.error('Insert error details:', insertError);
          throw insertError;
        }
      }

      onClose();
    } catch (err) {
      console.error('Error saving allocations:', err);
      setError('Failed to save allocations');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Supply Allocations
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {supplyName} - ${annualCost.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-500" size={20} />
              <span className="text-red-700">{error}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {allocations.map((allocation, index) => (
                <div
                  key={allocation.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  {/* Toggle */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`toggle-${allocation.id}`}
                      checked={allocation.isIncluded}
                      onChange={() => handleToggleIncluded(index)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  {/* Subcomponent Name */}
                  <div className="flex-1">
                    <label
                      htmlFor={`toggle-${allocation.id}`}
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      {allocation.name}
                    </label>
                  </div>

                  {/* Percentage Input */}
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={allocation.isIncluded ? allocation.appliedPercentage : 0}
                      onChange={(e) => handlePercentageChange(index, e.target.value)}
                      disabled={!allocation.isIncluded}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Dollar Amount Display */}
                  <div className="w-24 text-right">
                    <span className="text-sm text-gray-600">
                      ${allocation.isIncluded && allocation.appliedPercentage > 0 
                        ? ((annualCost * allocation.appliedPercentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                        : '$0'
                      }
                    </span>
                  </div>
                </div>
              ))}

              {/* Total Percentage Display */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Percentage:</span>
                  <span className={`text-lg font-semibold ${totalPercentage > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                    {totalPercentage.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-gray-700">Total Dollar Amount:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${((annualCost * totalPercentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                {totalPercentage > 100 && (
                  <p className="text-sm text-red-600 mt-1">
                    Total percentage cannot exceed 100%
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || totalPercentage > 100}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Allocations
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplyAllocationsModal; 