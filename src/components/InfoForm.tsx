import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { TaxInfo } from '../types';
import { states } from '../data/states';
import { NumericFormat } from 'react-number-format';
import { useTaxStore } from '../store/taxStore';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { formatCurrency, parseCurrency } from '../utils/formatting';
import { CentralizedClientService } from '../services/centralizedClientService';
import { X, ChevronUp, ChevronDown, Save, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InfoFormProps {
  onSubmit: (data: TaxInfo, year: number) => void;
  initialData?: TaxInfo | null;
  onTaxInfoUpdate?: (taxInfo: TaxInfo) => Promise<void>;
  clientId?: string;
  selectedYear?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoForm({ 
  onSubmit, 
  initialData, 
  onTaxInfoUpdate, 
  clientId, 
  selectedYear,
  isOpen,
  onClose
}: InfoFormProps) {
  console.log('InfoForm rendered with isOpen:', isOpen);
  
  const { saveInitialState, setTaxInfo } = useTaxStore();
  const { user, fetchUserProfile } = useUserStore();

  const [activeTab, setActiveTab] = useState('personal');
  const [currentYear] = useState(selectedYear || new Date().getFullYear());
  const [ownBusiness, setOwnBusiness] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<TaxInfo | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState<TaxInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Create a clean default state with all income fields set to 0
  const getDefaultFormData = (): TaxInfo => ({
    standardDeduction: true,
    customDeduction: 0,
    businessOwner: false,
    fullName: '',
    email: user?.email || '',
    phone: '',
    filingStatus: 'single',
    dependents: 0,
    homeAddress: '',
    state: 'CA',
    wagesIncome: 0,
    passiveIncome: 0,
    unearnedIncome: 0,
    capitalGains: 0,
    businessName: '',
    entityType: 'LLC',
    businessAddress: '',
    ordinaryK1Income: 0,
    guaranteedK1Income: 0,
    householdIncome: 0,
    deductionLimitReached: false
  });

  const [formData, setFormData] = useState<TaxInfo>(() => {
    if (initialData) {
      return initialData;
    }
    return getDefaultFormData();
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData
      }));
      setOriginalData(initialData);
    }
  }, [initialData, user?.email]);

  // Load temporary data from local storage on mount
  useEffect(() => {
    const tempData = loadFromLocalStorage();
    if (tempData && !initialData) {
      console.log('[InfoForm] Loading temporary data from local storage');
      setFormData(tempData);
      setHasUnsavedChanges(true);
    }
  }, [initialData]);

  // Real-time calculation trigger - update tax store whenever form data changes
  useEffect(() => {
    if (formData.fullName && formData.fullName !== lastSavedData?.fullName) {
      console.log('[InfoForm] Updating tax store with new data:', formData);
      
      // Only update the tax store if we have meaningful changes
      const hasSignificantChanges = 
        formData.wagesIncome !== (lastSavedData?.wagesIncome || 0) ||
        formData.passiveIncome !== (lastSavedData?.passiveIncome || 0) ||
        formData.unearnedIncome !== (lastSavedData?.unearnedIncome || 0) ||
        formData.capitalGains !== (lastSavedData?.capitalGains || 0) ||
        formData.ordinaryK1Income !== (lastSavedData?.ordinaryK1Income || 0) ||
        formData.guaranteedK1Income !== (lastSavedData?.guaranteedK1Income || 0);
      
      if (hasSignificantChanges) {
        // Debounce the tax store update to prevent rapid changes
        const timeoutId = setTimeout(() => {
          setTaxInfo(formData);
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
      
      // Check if we have unsaved changes
      if (originalData) {
        const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
        setHasUnsavedChanges(hasChanges);
      }
    }
  }, [formData, setTaxInfo, lastSavedData, originalData]);

  // Save to local storage for temporary changes
  const saveToLocalStorage = (data: TaxInfo) => {
    try {
      const key = `temp_tax_info_${clientId || user?.id || 'default'}`;
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        originalData: originalData
      }));
      console.log('[InfoForm] Saved to local storage:', key);
    } catch (error) {
      console.error('[InfoForm] Error saving to local storage:', error);
    }
  };

  // Load from local storage
  const loadFromLocalStorage = (): TaxInfo | null => {
    try {
      const key = `temp_tax_info_${clientId || user?.id || 'default'}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[InfoForm] Loaded from local storage:', parsed);
        return parsed.data;
      }
    } catch (error) {
      console.error('[InfoForm] Error loading from local storage:', error);
    }
    return null;
  };

  // Clear local storage
  const clearLocalStorage = () => {
    try {
      const key = `temp_tax_info_${clientId || user?.id || 'default'}`;
      localStorage.removeItem(key);
      console.log('[InfoForm] Cleared local storage:', key);
    } catch (error) {
      console.error('[InfoForm] Error clearing local storage:', error);
    }
  };

  // Auto-save function for real-time updates (local storage only)
  const autoSave = async (updatedData: TaxInfo) => {
    if (!updatedData.fullName) return;

    try {
      console.log('[InfoForm] Auto-saving to local storage');
      saveToLocalStorage(updatedData);
      setLastSavedData(updatedData);
      console.log('[InfoForm] Auto-save completed successfully');
    } catch (error) {
      console.error('[InfoForm] Auto-save error:', error);
    }
  };

  // Debounced auto-save effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      autoSave(formData);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Save to Supabase function
  const saveToSupabase = async (data: TaxInfo) => {
    if (!clientId) return;

    try {
      console.log('[InfoForm] Saving to Supabase for client:', clientId, 'year:', currentYear);
      
      // Update client basic information
      const clientUpdates = {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        filing_status: data.filingStatus,
        dependents: data.dependents,
        home_address: data.homeAddress,
        state: data.state,
        standard_deduction: data.standardDeduction,
        custom_deduction: data.customDeduction
      };

      // Update client basic info
      await CentralizedClientService.updateClient(clientId, clientUpdates);

      // Check if personal year already exists for this year
      const existingYear = await CentralizedClientService.getPersonalYear(clientId, currentYear);

      const yearData = {
        year: currentYear,
        wages_income: data.wagesIncome,
        passive_income: data.passiveIncome,
        unearned_income: data.unearnedIncome,
        capital_gains: data.capitalGains,
        long_term_capital_gains: 0,
        household_income: data.householdIncome || 0,
        ordinary_income: data.wagesIncome + data.passiveIncome + data.unearnedIncome,
        is_active: true
      };

      if (existingYear) {
        await CentralizedClientService.updatePersonalYear(existingYear.id, yearData);
      } else {
        await CentralizedClientService.createPersonalYear(clientId, yearData);
      }

      setLastSavedData(data);
      setOriginalData(data);
      setHasUnsavedChanges(false);
      clearLocalStorage();
      console.log('[InfoForm] Successfully saved to Supabase');
    } catch (error) {
      console.error('[InfoForm] Supabase save error:', error);
      throw error;
    }
  };

  // Function to discard changes and revert to original data
  const discardChanges = () => {
    if (originalData) {
      setFormData(originalData);
      setHasUnsavedChanges(false);
      clearLocalStorage();
      console.log('[InfoForm] Discarded changes, reverted to original data');
    }
  };

  // Function to save changes to Supabase
  const saveChanges = async () => {
    if (!hasUnsavedChanges) return;
    
    try {
      setIsSaving(true);
      await saveToSupabase(formData);
      console.log('[InfoForm] Successfully saved changes to Supabase');
      onClose(); // Close the modal after successful save
    } catch (error) {
      console.error('[InfoForm] Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form submission (for backward compatibility)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveChanges();
  };

  // Calculate total income for display
  const totalIncome = formData.wagesIncome + formData.passiveIncome + formData.unearnedIncome + formData.capitalGains + 
                     (formData.businessOwner ? (formData.ordinaryK1Income || 0) + (formData.guaranteedK1Income || 0) : 0);

  console.log('InfoForm about to render modal, isOpen:', isOpen);

  const handleClose = () => {
    console.log('[InfoForm] Closing modal');
    
    // Reset form data to original state if there are unsaved changes
    if (hasUnsavedChanges && originalData) {
      setFormData(originalData);
      setHasUnsavedChanges(false);
    }
    
    // Reset expansion state
    setIsExpanded(false);
    
    // Close the modal
    onClose();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset form data when modal opens/closes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
      setOriginalData(initialData);
      setLastSavedData(initialData);
      setHasUnsavedChanges(false);
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    console.log('[InfoForm] Saving changes...');
    
    try {
      // Update the tax store with current form data
      setTaxInfo(formData);
      
      // Save to database if clientId is provided
      if (clientId && selectedYear) {
        // First get the existing personal year to get the yearId
        const existingYear = await CentralizedClientService.getPersonalYear(clientId, selectedYear);
        
        if (existingYear) {
          // Update existing year
          await CentralizedClientService.updatePersonalYear(existingYear.id, {
            wages_income: formData.wagesIncome,
            passive_income: formData.passiveIncome,
            unearned_income: formData.unearnedIncome,
            capital_gains: formData.capitalGains,
            household_income: formData.wagesIncome + formData.passiveIncome + formData.unearnedIncome + formData.capitalGains,
            ordinary_income: formData.wagesIncome + formData.passiveIncome + formData.unearnedIncome
          });
        } else {
          // Create new year
          await CentralizedClientService.createPersonalYear(clientId, {
            year: selectedYear,
            wages_income: formData.wagesIncome,
            passive_income: formData.passiveIncome,
            unearned_income: formData.unearnedIncome,
            capital_gains: formData.capitalGains,
            long_term_capital_gains: 0,
            household_income: formData.wagesIncome + formData.passiveIncome + formData.unearnedIncome + formData.capitalGains,
            ordinary_income: formData.wagesIncome + formData.passiveIncome + formData.unearnedIncome,
            is_active: true
          });
        }
        console.log('[InfoForm] Saved to database successfully');
      }
      
      // Update the last saved data
      setLastSavedData(formData);
      setHasUnsavedChanges(false);
      
      // Close the modal
      onClose();
      
      toast.success('Tax information updated successfully!');
    } catch (error) {
      console.error('[InfoForm] Error saving:', error);
      toast.error('Failed to save changes. Please try again.');
    }
  };

  const handleDiscard = () => {
    console.log('[InfoForm] Discarding changes...');
    
    // Reset form data to original state
    if (originalData) {
      setFormData(originalData);
    }
    
    setHasUnsavedChanges(false);
    onClose();
    
    toast('Changes discarded');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9998]"
            onClick={handleClose}
            style={{ pointerEvents: 'auto' }}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tax Information
                </h3>
                {hasUnsavedChanges && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className={`overflow-y-auto transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
              <div className="p-4 space-y-4">
                {/* Quick Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal Income
                    </label>
                    <input
                      type="text"
                      value={formData.wagesIncome + formData.passiveIncome + formData.unearnedIncome + formData.capitalGains ? 
                        `$${(formData.wagesIncome + formData.passiveIncome + formData.unearnedIncome + formData.capitalGains).toLocaleString()}` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[$,]/g, '');
                        const numValue = parseFloat(value) || 0;
                        const total = formData.wagesIncome + formData.passiveIncome + formData.unearnedIncome + formData.capitalGains;
                        if (total > 0) {
                          const ratio = numValue / total;
                          setFormData({
                            ...formData,
                            wagesIncome: Math.round(formData.wagesIncome * ratio),
                            passiveIncome: Math.round(formData.passiveIncome * ratio),
                            unearnedIncome: Math.round(formData.unearnedIncome * ratio),
                            capitalGains: Math.round(formData.capitalGains * ratio)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            wagesIncome: Math.round(numValue * 0.7),
                            passiveIncome: Math.round(numValue * 0.2),
                            unearnedIncome: Math.round(numValue * 0.1),
                            capitalGains: 0
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="$0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Income
                    </label>
                    <input
                      type="text"
                      value={(formData.ordinaryK1Income || 0) + (formData.guaranteedK1Income || 0) ? 
                        `$${((formData.ordinaryK1Income || 0) + (formData.guaranteedK1Income || 0)).toLocaleString()}` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[$,]/g, '');
                        const numValue = parseFloat(value) || 0;
                        const total = (formData.ordinaryK1Income || 0) + (formData.guaranteedK1Income || 0);
                        if (total > 0) {
                          const ratio = numValue / total;
                          setFormData({
                            ...formData,
                            ordinaryK1Income: Math.round((formData.ordinaryK1Income || 0) * ratio),
                            guaranteedK1Income: Math.round((formData.guaranteedK1Income || 0) * ratio)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            ordinaryK1Income: Math.round(numValue * 0.6),
                            guaranteedK1Income: Math.round(numValue * 0.4)
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="$0"
                    />
                  </div>
                </div>

                {/* Detailed Form */}
                <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <Tabs.List className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <Tabs.Trigger
                      value="personal"
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600"
                    >
                      Personal
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="business"
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600"
                    >
                      Business
                    </Tabs.Trigger>
                  </Tabs.List>

                  <Tabs.Content value="personal" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Wages & Salary
                        </label>
                        <input
                          type="text"
                          value={formData.wagesIncome ? `$${formData.wagesIncome.toLocaleString()}` : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[$,]/g, '');
                            const numValue = parseFloat(value) || 0;
                            setFormData({
                              ...formData,
                              wagesIncome: numValue
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="$0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passive Income
                        </label>
                        <input
                          type="text"
                          value={formData.passiveIncome ? `$${formData.passiveIncome.toLocaleString()}` : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[$,]/g, '');
                            const numValue = parseFloat(value) || 0;
                            setFormData({
                              ...formData,
                              passiveIncome: numValue
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="$0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Other Income
                        </label>
                        <input
                          type="text"
                          value={formData.unearnedIncome ? `$${formData.unearnedIncome.toLocaleString()}` : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[$,]/g, '');
                            const numValue = parseFloat(value) || 0;
                            setFormData({
                              ...formData,
                              unearnedIncome: numValue
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="$0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Capital Gains
                        </label>
                        <input
                          type="text"
                          value={formData.capitalGains ? `$${formData.capitalGains.toLocaleString()}` : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[$,]/g, '');
                            const numValue = parseFloat(value) || 0;
                            setFormData({
                              ...formData,
                              capitalGains: numValue
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="$0"
                        />
                      </div>
                    </div>
                  </Tabs.Content>

                  <Tabs.Content value="business" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ordinary K-1 Income
                        </label>
                        <input
                          type="text"
                          value={formData.ordinaryK1Income ? `$${formData.ordinaryK1Income.toLocaleString()}` : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[$,]/g, '');
                            const numValue = parseFloat(value) || 0;
                            setFormData({
                              ...formData,
                              ordinaryK1Income: numValue
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="$0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Guaranteed K-1 Income
                        </label>
                        <input
                          type="text"
                          value={formData.guaranteedK1Income ? `$${formData.guaranteedK1Income.toLocaleString()}` : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[$,]/g, '');
                            const numValue = parseFloat(value) || 0;
                            setFormData({
                              ...formData,
                              guaranteedK1Income: numValue
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="$0"
                        />
                      </div>
                    </div>
                  </Tabs.Content>
                </Tabs.Root>

                {/* Total Income Display */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Income:</span>
                    <span className="text-lg font-bold text-green-700">
                      {formatCurrency(totalIncome)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={handleDiscard}
                    disabled={!hasUnsavedChanges}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || isSaving}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}