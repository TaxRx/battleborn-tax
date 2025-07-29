import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Plus, Edit, Trash2, Users, Settings, ChevronDown, ChevronRight, Check, X, Download, Calculator, Calendar, Briefcase, Package, FileText } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { EmployeeManagementService } from '../../../../../services/employeeManagementService';
import { ExpenseManagementService } from '../../../../../services/expenseManagementService';
import { ContractorManagementService, ContractorWithExpenses, QuickContractorEntry } from '../../../../../services/contractorManagementService';
import { RDExpense, RDContractor, RDSupply as RDSupplyBase } from '../../../../../types/researchDesign';
import SupplySetupStep, { QuickSupplyEntryForm } from './SupplySetupStep';
import Papa from 'papaparse';
import { toast } from 'react-toastify';
import { SupplyManagementService, QuickSupplyEntry } from '../../../services/supplyManagementService';
import ContractorAllocationsModal from './ContractorAllocationsModal';
import AllocationReportModal from '../../AllocationReport/AllocationReportModal';

// Extend RDSupply to include calculated_qre for local use
interface RDSupply extends RDSupplyBase {
  calculated_qre?: number;
}

// Helper functions for formatting
const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0.00';
  return value.toFixed(2);
};

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(value));
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  };
  
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debounced as T & { cancel: () => void };
}

// Debounced wage input component for better UX
interface WageInputProps {
  employeeId: string;
  initialValue: number;
  onUpdate: (employeeId: string, newWage: number) => void;
}

const WageInput: React.FC<WageInputProps> = ({ employeeId, initialValue, onUpdate }) => {
  const [displayValue, setDisplayValue] = useState(formatCurrency(initialValue));
  const [isEditing, setIsEditing] = useState(false);

  // Update display value when initialValue changes (from external updates)
  useEffect(() => {
    if (!isEditing) {
      setDisplayValue(formatCurrency(initialValue));
    }
  }, [initialValue, isEditing]);

  // Debounced update function
  const debouncedUpdate = React.useCallback(
    debounce((value: number) => {
      onUpdate(employeeId, value);
    }, 800), // 800ms delay for better UX
    [employeeId, onUpdate]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayValue(value);
    setIsEditing(true);

    // Extract numeric value
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue !== '') {
      const newWage = parseInt(numericValue);
      debouncedUpdate(newWage);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Ensure the display value is properly formatted
    const numericValue = displayValue.replace(/[^0-9]/g, '');
    if (numericValue !== '') {
      const newWage = parseInt(numericValue);
      setDisplayValue(formatCurrency(newWage));
      // Cancel any pending debounced update and update immediately on blur
      debouncedUpdate.cancel();
      onUpdate(employeeId, newWage);
    } else {
      // Reset to initial value if empty
      setDisplayValue(formatCurrency(initialValue));
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  return (
    <input
      type="text"
      className="w-36 px-2 py-1 rounded border border-gray-200 text-lg text-gray-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-200"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder="$0"
    />
  );
};

interface EmployeeSetupStepProps {
  employees: any[];
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  businessYearId?: string;
  businessId?: string;
}

interface Role {
  id: string;
  name: string;
  baseline_applied_percent?: number;
}

interface QuickEmployeeEntry {
  first_name: string;
  last_name: string;
  wage: string;
  role_id: string;
  is_owner: boolean;
  use_actualization: boolean;
}

interface EmployeeWithExpenses {
  id: string;
  first_name: string;
  last_name: string;
  annual_wage: number;
  is_owner: boolean;
  role?: Role;
  calculated_qre?: number;
  baseline_applied_percent?: number;
  practice_percentage?: number;
  time_percentage?: number;
  applied_percentage?: number;
}

// Actualization utility function to apply random variations to subcomponent percentages
const applyActualizationVariations = (basePercentage: number): number => {
  if (basePercentage === 0) return 0; // Don't vary zero percentages

  // Generate random variation between -25% and +15%
  const minVariation = -0.25; // -25%
  const maxVariation = 0.15;  // +15%
  const randomVariation = Math.random() * (maxVariation - minVariation) + minVariation;

  // Apply variation to base percentage
  const variedPercentage = basePercentage * (1 + randomVariation);

  // Ensure the result is not negative and rounds to 2 decimal places
  return Math.max(0, Math.round(variedPercentage * 100) / 100);
};

const QuickEmployeeEntryForm: React.FC<{
  onAdd: (employee: QuickEmployeeEntry) => void;
  roles: Role[];
}> = ({ onAdd, roles }) => {
  const [formData, setFormData] = useState<QuickEmployeeEntry>({
    first_name: '',
    last_name: '',
    wage: '',
    role_id: '',
    is_owner: false,
    use_actualization: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 QuickEmployeeEntryForm - handleSubmit called with:', formData);
    if (formData.first_name && formData.last_name && formData.wage && formData.role_id) {
      console.log('✅ QuickEmployeeEntryForm - Form validation passed, calling onAdd');
      onAdd(formData);
      setFormData({
        first_name: '',
        last_name: '',
        wage: '',
        role_id: '',
        is_owner: false,
        use_actualization: true
      });
    } else {
      console.log('❌ QuickEmployeeEntryForm - Form validation failed:', {
        hasFirstName: !!formData.first_name,
        hasLastName: !!formData.last_name,
        hasWage: !!formData.wage,
        hasRoleId: !!formData.role_id
      });
    }
  };

  const formatWage = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') return '';
    
    // Format as currency with no decimal places
    const number = parseInt(numericValue);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  const handleWageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWage(e.target.value);
    setFormData(prev => ({ ...prev, wage: formatted }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
          <Plus className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Quick Add Employee</h3>
      </div>
      
      <div className="grid grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="John"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Doe"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Annual Wage</label>
          <input
            type="text"
            value={formData.wage}
            onChange={handleWageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="$50,000"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role (Optional)</label>
          <select
            value={formData.role_id}
            onChange={(e) => setFormData(prev => ({ ...prev, role_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">No Role Assigned</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} ({formatPercentage(role.baseline_applied_percent)}%)
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_owner}
              onChange={(e) => setFormData(prev => ({ ...prev, is_owner: e.target.checked }))}
              className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Is Owner</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.use_actualization}
              onChange={(e) => setFormData(prev => ({ ...prev, use_actualization: e.target.checked }))}
              className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700" title="Apply random variations (-25% to +15%) to subcomponent percentages for more realistic allocation">
              Actualization
            </span>
          </label>
        </div>
        
        <div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md font-medium"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Employee
          </button>
        </div>
      </div>
    </form>
  );
};

const QuickContractorEntryForm: React.FC<{
  onAdd: (contractor: QuickContractorEntry) => void;
  roles: Role[];
}> = ({ onAdd, roles }) => {
  const [formData, setFormData] = useState<QuickContractorEntry>({
    first_name: '',
    last_name: '',
    amount: '',
    role_id: '',
    is_owner: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.amount || !formData.role_id) {
      // Show error or return
      return;
    }
    onAdd(formData);
    setFormData({
      first_name: '',
      last_name: '',
      amount: '',
      role_id: '',
      is_owner: false
    });
  };

  const formatAmount = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') return '';
    
    // Format as currency with no decimal places
    const number = parseInt(numericValue);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setFormData(prev => ({ ...prev, amount: formatted }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-3">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-xl font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Quick Add Contractor</h3>
      </div>
      
      <div className="grid grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            placeholder="John"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            placeholder="Doe"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="text"
            value={formData.amount}
            onChange={handleAmountChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            placeholder="$50,000"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            value={formData.role_id}
            onChange={(e) => setFormData(prev => ({ ...prev, role_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            required
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} ({formatPercentage(role.baseline_applied_percent)}%)
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_owner}
              onChange={(e) => setFormData(prev => ({ ...prev, is_owner: e.target.checked }))}
              className="mr-2 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Is Owner</span>
          </label>
        </div>
        
        <div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 shadow-md font-medium"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Contractor
          </button>
        </div>
      </div>
    </form>
  );
};

// Manage Allocations Modal Component
interface ManageAllocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeWithExpenses | null;
  businessYearId: string;
  onUpdate: () => void;
}

interface ResearchActivityAllocation {
  id: string;
  name: string;
  isEnabled: boolean;
  practicePercentage: number;
  subcomponents: SubcomponentAllocation[];
}

interface SubcomponentAllocation {
  id: string;
  name: string;
  stepName: string;
  timePercentage: number;
  maxTimePercentage: number;
  yearPercentage: number;
  frequencyPercentage: number;
  isIncluded: boolean;
  baselineTimePercentage?: number;
  baselinePracticePercentage?: number;
  applied_percentage?: number; // ✅ ROSTER-MODAL SYNC: Add saved applied percentage from database
}

const ManageAllocationsModal: React.FC<ManageAllocationsModalProps> = ({
  isOpen,
  onClose,
  employee,
  businessYearId,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ResearchActivityAllocation[]>([]);
  const [nonRdPercentage, setNonRdPercentage] = useState(0);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track if user is actively editing
  
  // Color palette for activities
  const activityColors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
  ];

  // AGGRESSIVE STATE CLEARING AND FRESH DATA LOADING
  useEffect(() => {
    if (isOpen && employee) {
      console.log('🔄 MODAL OPENING for employee:', employee.first_name, employee.last_name, employee.id);
      console.log('🔄 Employee object:', employee);
      
      // AGGRESSIVE: Clear ALL state immediately
      setLoading(true);
      setActivities([]);
      setTotalAllocated(0);
      setNonRdPercentage(0);
      setExpandedActivity(null);
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      
      // Force a delay to ensure state is cleared before loading
      setTimeout(() => {
        console.log('🔄 Starting fresh data load after state clear...');
        loadAllocationData();
      }, 100);
    } else if (!isOpen) {
      console.log('🔄 Modal closing - aggressive state clearing');
      // Aggressive clearing when modal closes
      setLoading(false);
      setActivities([]);
      setTotalAllocated(0);
      setNonRdPercentage(0);  
      setExpandedActivity(null);
      setHasUnsavedChanges(false); // Reset unsaved changes flag
    }
  }, [isOpen, employee?.id]); // CHANGED: Depend on employee.id specifically

  // Recalculate total when non-R&D percentage changes
  useEffect(() => {
    calculateTotalAllocated(activities);
  }, [nonRdPercentage, activities]);

  const loadAllocationData = async () => {
    if (!employee) {
      console.log('⚠️ No employee provided to loadAllocationData');
      return;
    }
    
    console.log('🔄 FRESH LOAD: Loading allocation data for employee:', employee.first_name, employee.last_name, employee.id);
    console.log('🔄 Employee role:', employee.role?.id, employee.role?.name);
    console.log('🔄 Business year:', businessYearId);
    
    if (!businessYearId) {
      console.log('⚠️ No businessYearId provided to loadAllocationData');
      setLoading(false);
      return;
    }
    
    // AGGRESSIVE: Ensure completely fresh start - no cached data
    console.log('🧹 AGGRESSIVE CLEAN: Clearing all modal state before loading fresh data');
    setActivities([]);
    setTotalAllocated(0);
    setNonRdPercentage(0);
    setExpandedActivity(null);
    setLoading(true);
    
    try {
      console.log('🔍 LOADING FRESH DATA for employee:', employee.id, 'role:', employee.role?.id);
      
      if (!supabase) {
        console.error('❌ Supabase client not available');
        setLoading(false);
        return;
      }
      
      // Test basic table access
      const { data: testData, error: testError } = await supabase
        .from('rd_employee_subcomponents')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Error testing table access:', testError);
      } else {
        console.log('✅ Table access test successful');
      }
      
      // Test rd_selected_activities table access
      const { data: activitiesTestData, error: activitiesTestError } = await supabase
        .from('rd_selected_activities')
        .select('selected_roles')
        .limit(1);
      
      if (activitiesTestError) {
        console.error('❌ Error testing rd_selected_activities access:', activitiesTestError);
      } else {
        console.log('✅ rd_selected_activities table access successful');
        console.log('📋 Sample selected_roles data:', activitiesTestData);
      }
      
      // Get research activities that match the employee's role
      let selectedActivities;
      let activitiesError;
      
      try {
        // Check if employee has a role before trying role filter
        if (!employee.role?.id) {
          console.log('⚠️ Employee has no role, skipping role filter');
          activitiesError = new Error('No role assigned to employee');
        } else {
          // First try with role filter using proper JSON syntax
          console.log('🔍 Trying role filter with role ID:', employee.role?.id);
          console.log('🔍 JSON query:', JSON.stringify([employee.role?.id ?? '']));
          
          const { data, error } = await supabase
            .from('rd_selected_activities')
            .select(`
              *,
              activity:rd_research_activities (
                id,
                title
              )
            `)
            .eq('business_year_id', businessYearId)
            .contains('selected_roles', JSON.stringify([employee.role?.id ?? '']));
          
          selectedActivities = data;
          activitiesError = error;
        }
      } catch (error) {
        console.error('❌ Error with role filter query:', error);
        activitiesError = error;
      }

      if (activitiesError) {
        console.error('❌ Error loading activities with role filter:', activitiesError);
        
        // Try different JSON formats for the role filter
        let fallbackAttempts = [
          () => {
            console.log('🔄 Fallback 1: JSON.stringify([roleId])');
            return supabase.from('rd_selected_activities').select('*').eq('business_year_id', businessYearId).contains('selected_roles', JSON.stringify([employee.role?.id ?? '']));
          },
          () => {
            console.log('🔄 Fallback 2: JSON.stringify(roleId)');
            return supabase.from('rd_selected_activities').select('*').eq('business_year_id', businessYearId).contains('selected_roles', JSON.stringify(employee.role?.id ?? ''));
          },
          () => {
            console.log('🔄 Fallback 3: roleId directly');
            return supabase.from('rd_selected_activities').select('*').eq('business_year_id', businessYearId).contains('selected_roles', employee.role?.id ?? '');
          },
          () => {
            console.log('🔄 Fallback 4: ["roleId"] string');
            return supabase.from('rd_selected_activities').select('*').eq('business_year_id', businessYearId).contains('selected_roles', `["${employee.role?.id ?? ''}"]`);
          },
          () => {
            console.log('🔄 Fallback 5: "roleId" string');
            return supabase.from('rd_selected_activities').select('*').eq('business_year_id', businessYearId).contains('selected_roles', `"${employee.role?.id ?? ''}"`);
          }
        ];
        
        for (let i = 0; i < fallbackAttempts.length; i++) {
          try {
            console.log(`🔄 Trying fallback attempt ${i + 1} for role filter`);
            const { data: fallbackData, error: fallbackError } = await fallbackAttempts[i]();
            
            if (!fallbackError && fallbackData && fallbackData.length > 0) {
              console.log(`✅ Fallback attempt ${i + 1} successful:`, fallbackData);
              selectedActivities = fallbackData;
              break;
            }
          } catch (attemptError) {
            console.log(`❌ Fallback attempt ${i + 1} failed:`, attemptError);
          }
        }
        
        // If all role filter attempts failed, try without role filter
        if (!selectedActivities) {
          try {
            console.log('🔄 Trying without role filter...');
            const { data: allActivities, error: allActivitiesError } = await supabase
              .from('rd_selected_activities')
              .select(`
                *,
                activity:rd_research_activities (
                  id,
                  title
                )
              `)
              .eq('business_year_id', businessYearId);
            
            if (allActivitiesError) {
              console.error('❌ Error loading all activities:', allActivitiesError);
              // Try a simpler query as last resort
              console.log('🔄 Trying simple query as last resort...');
              const { data: simpleActivities, error: simpleError } = await supabase
                .from('rd_selected_activities')
                .select('*')
                .eq('business_year_id', businessYearId);
              
              if (simpleError) {
                console.error('❌ Error loading simple activities:', simpleError);
                // Create empty activities array as final fallback
                console.log('⚠️ Creating empty activities array as final fallback');
                selectedActivities = [];
              } else {
                console.log('⚠️ Using simple activities as fallback:', simpleActivities);
                selectedActivities = simpleActivities;
              }
            } else {
              console.log('⚠️ Using all activities as fallback:', allActivities);
              selectedActivities = allActivities;
            }
          } catch (fallbackError) {
            console.error('❌ Error in fallback queries:', fallbackError);
            // Create empty activities array as final fallback
            console.log('⚠️ Creating empty activities array as final fallback due to error');
            selectedActivities = [];
          }
        }
      }

      console.log('📋 Found activities:', selectedActivities);

      // Ensure selectedActivities is always defined
      if (!selectedActivities) {
        console.log('⚠️ No activities found, creating empty array');
        selectedActivities = [];
      }

      // ✅ ROSTER-MODAL SYNC: Remove problematic non-R&D database queries 
      console.log('✅ [ROSTER-MODAL SYNC] Skipping non-R&D database query - using pure R&D calculation to match modal');
      setNonRdPercentage(0); // Always 0 to match modal's pure R&D calculation

      // Get subcomponents for each activity
      let activitiesWithSubcomponents: ResearchActivityAllocation[] = [];
      
      for (const selectedActivity of selectedActivities || []) {
        console.log('🔍 Processing activity:', selectedActivity.activity?.title);
        
        const { data: subcomponents, error: subError } = await supabase
          .from('rd_selected_subcomponents')
          .select(`
            *,
            subcomponent:rd_research_subcomponents (
              id,
              name
            ),
            step:rd_research_steps (
              id,
              name
            )
          `)
          .eq('business_year_id', businessYearId)
          .eq('research_activity_id', selectedActivity.activity_id);

        if (subError) {
          console.error('❌ Error loading subcomponents:', subError);
          continue;
        }

        console.log('📋 Found subcomponents for activity:', subcomponents?.length);

        // Get employee's current allocations for this activity - MUST BE EMPLOYEE-SPECIFIC
        console.log('🔍 LOADING ALLOCATIONS FOR SPECIFIC EMPLOYEE:', employee.id, employee.first_name, employee.last_name);
        console.log('🔍 Business Year ID:', businessYearId);
        console.log('🔍 Subcomponent IDs to filter:', subcomponents?.map(s => s.subcomponent_id));
        
        const { data: employeeAllocations, error: allocError } = await supabase
          .from('rd_employee_subcomponents')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('business_year_id', businessYearId)
          .in('subcomponent_id', subcomponents?.map(s => s.subcomponent_id) || []);

        if (allocError) {
          console.error('❌ Error loading employee allocations:', allocError);
          // Continue without employee allocations
        }

        console.log('📋 EMPLOYEE-SPECIFIC ALLOCATIONS LOADED:', employeeAllocations?.length);
        console.log('📋 Allocation data:', employeeAllocations);

        const subcomponentAllocations: SubcomponentAllocation[] = (subcomponents || []).map(sub => {
          const employeeAlloc = employeeAllocations?.find(ea => ea.subcomponent_id === sub.subcomponent_id);
          
          // If no employee allocation exists, use subcomponent baseline values
          const baselineTimePercentage = employeeAlloc?.baseline_time_percentage ?? sub.time_percentage ?? 0;
          const baselinePracticePercentage = employeeAlloc?.baseline_practice_percentage ?? selectedActivity.practice_percent ?? 0;
          
          // Use employee's custom time percentage if it exists, otherwise use baseline
          const timePercentage = employeeAlloc?.time_percentage ?? baselineTimePercentage;
          
          // Handle null values in database by using subcomponent baseline values
          const yearPercentage = employeeAlloc?.year_percentage ?? sub.year_percentage ?? 0;
          const frequencyPercentage = employeeAlloc?.frequency_percentage ?? sub.frequency_percentage ?? 0;
          
          // ✅ ROSTER-MODAL SYNC: Include saved applied_percentage from database
          const appliedPercentage = employeeAlloc?.applied_percentage ?? 0;
          
          return {
            id: sub.subcomponent_id,
            name: sub.subcomponent?.name || 'Unknown',
            stepName: sub.step?.name || 'Unknown',
            timePercentage: timePercentage,
            maxTimePercentage: sub.time_percentage || 0,
            yearPercentage: yearPercentage,
            frequencyPercentage: frequencyPercentage,
            isIncluded: employeeAlloc?.is_included ?? true,
            baselineTimePercentage: baselineTimePercentage,
            baselinePracticePercentage: baselinePracticePercentage,
            applied_percentage: appliedPercentage // ✅ ROSTER-MODAL SYNC: Use exact saved value from database
          };
        });

        // Get the employee's custom practice percentage for this activity, or use baseline
        const activityEmployeeAlloc = employeeAllocations?.find(ea => 
          subcomponents?.some(sub => sub.subcomponent_id === ea.subcomponent_id)
        );
        const customPracticePercentage = activityEmployeeAlloc?.practice_percentage ?? selectedActivity.practice_percent ?? 0;

        activitiesWithSubcomponents.push({
          id: selectedActivity.activity_id,
          name: selectedActivity.activity?.title || 'Unknown Activity',
          // FIXED: Load enabled state from database instead of inferring from subcomponents
          isEnabled: selectedActivity.is_enabled ?? true,
          practicePercentage: customPracticePercentage,
          subcomponents: subcomponentAllocations
        });
      }

      console.log('📋 Final activitiesWithSubcomponents:', activitiesWithSubcomponents);
      
      console.log('🎯 FINAL VERIFICATION: Setting activities for employee:', employee.first_name, employee.last_name, employee.id);
      console.log('🎯 Activities being set:', activitiesWithSubcomponents);
      
      setActivities(activitiesWithSubcomponents);
      calculateTotalAllocated(activitiesWithSubcomponents);
      
      console.log('✅ FRESH DATA LOADED and SET for employee:', employee.first_name, employee.last_name);
      console.log('✅ Activities loaded:', activitiesWithSubcomponents.length);
      console.log('✅ Modal state should now be employee-specific!');
    } catch (error) {
      console.error('❌ Error in loadAllocationData for employee:', employee.first_name, employee.last_name, error);
      // AGGRESSIVE FALLBACK: Ensure no stale data remains
      console.log('🧹 ERROR FALLBACK: Clearing all state due to loading error');
      setActivities([]);
      setTotalAllocated(0);
      setNonRdPercentage(0);
      setExpandedActivity(null);
      calculateTotalAllocated([]);
    } finally {
      setLoading(false);
      console.log('✅ Loading complete for employee:', employee.first_name, employee.last_name);
    }
  };

  const calculateTotalAllocated = (activitiesData: ResearchActivityAllocation[]) => {
    console.log('🧮 Calculating total allocation for:', activitiesData.length, 'activities');
    const total = activitiesData.reduce((sum, activity) => {
      if (activity.isEnabled) {
        console.log('📊 Activity enabled:', activity.name, 'Practice%:', activity.practicePercentage);
        return sum + activity.practicePercentage;
      }
      return sum;
    }, 0) + nonRdPercentage;
    console.log('🧮 Total calculated:', total, '% (including', nonRdPercentage, '% non-R&D)');
    setTotalAllocated(total);
  };

  // Calculate practice percentage segments for visualization (including non-R&D)
  const getPracticePercentageSegments = () => {
    const enabledActivities = activities.filter(a => a.isEnabled);
    const segments: any[] = [];
    let currentPosition = 0;
    
    // Add enabled research activities
    enabledActivities.forEach((activity, index) => {
      if (activity.practicePercentage > 0) {
        segments.push({
          activityId: activity.id,
          name: activity.name,
          percentage: activity.practicePercentage,
          color: activityColors[index % activityColors.length],
          startPosition: currentPosition,
          width: activity.practicePercentage
        });
        currentPosition += activity.practicePercentage;
      }
    });
    
    // Add non-R&D segment
    if (nonRdPercentage > 0) {
      segments.push({
        activityId: 'non-rd',
        name: 'Non-R&D Time',
        percentage: nonRdPercentage,
        color: '#6B7280', // gray-500
        startPosition: currentPosition,
        width: nonRdPercentage
      });
      currentPosition += nonRdPercentage;
    }
    
    // Add remaining/available time if under 100%
    const remainingPercentage = 100 - currentPosition;
    if (remainingPercentage > 0) {
      segments.push({
        activityId: 'remaining',
        name: 'Available Time',
        percentage: remainingPercentage,
        color: '#E5E7EB', // gray-200
        startPosition: currentPosition,
        width: remainingPercentage
      });
    }
    
    return segments;
  };

  // ✅ HYBRID APPROACH: Show saved total when no edits, real-time total when editing
  const getTotalAppliedPercentage = () => {
    let totalApplied = 0;
    
    if (hasUnsavedChanges) {
      // Real-time calculation when user is editing
      for (const activity of activities) {
        if (activity.isEnabled) {
          for (const subcomponent of activity.subcomponents) {
            if (subcomponent.isIncluded) {
              // Calculate applied percentage using current form values
              const appliedPercentage = (activity.practicePercentage / 100) * 
                                      (subcomponent.yearPercentage / 100) * 
                                      (subcomponent.frequencyPercentage / 100) * 
                                      (subcomponent.timePercentage / 100) * 100;
              totalApplied += appliedPercentage;
            }
          }
        }
      }
    } else {
      // Use saved database values when no edits (matches roster)
      for (const activity of activities) {
        if (activity.isEnabled) {
          for (const subcomponent of activity.subcomponents) {
            if (subcomponent.isIncluded) {
              // Use saved applied_percentage from database
              const appliedPercentage = subcomponent.applied_percentage || 0;
              totalApplied += appliedPercentage;
            }
          }
        }
      }
    }
    
    return totalApplied;
  };

  // ✅ HYBRID APPROACH: Show saved values when no edits, real-time when editing
  const getAppliedPercentageSegments = () => {
    const segments: any[] = [];
    let currentPosition = 0;
    
    if (hasUnsavedChanges) {
      console.log('🎯 [EDITING MODE] Calculating applied percentages in real-time from current form state');
      
      // ✅ REAL-TIME CALCULATION: Use current UI values when user is editing
      for (const activity of activities) {
        if (activity.isEnabled) {
          let activityTotalApplied = 0;
          
          for (const subcomponent of activity.subcomponents) {
            if (subcomponent.isIncluded) {
              // ✅ RESPONSIVE CALCULATION: Calculate applied percentage using current form values
              const appliedPercentage = (activity.practicePercentage / 100) * 
                                      (subcomponent.yearPercentage / 100) * 
                                      (subcomponent.frequencyPercentage / 100) * 
                                      (subcomponent.timePercentage / 100) * 100;
              
              console.log('📊 [REAL-TIME] Calculated applied_percentage for', subcomponent.name, ':', appliedPercentage, {
                practicePercentage: activity.practicePercentage,
                yearPercentage: subcomponent.yearPercentage,
                frequencyPercentage: subcomponent.frequencyPercentage,
                timePercentage: subcomponent.timePercentage
              });
              activityTotalApplied += appliedPercentage;
            }
          }
          
          if (activityTotalApplied > 0) {
            segments.push({
              activityId: activity.id,
              name: activity.name,
              percentage: activityTotalApplied,
              color: activityColors[activities.indexOf(activity) % activityColors.length],
              startPosition: currentPosition,
              width: activityTotalApplied
            });
            currentPosition += activityTotalApplied;
            
            console.log('✅ [EDITING MODE] Activity', activity.name, 'total applied:', activityTotalApplied, '% (calculated in real-time)');
          }
        }
      }
    } else {
      console.log('🎯 [SAVED VALUES] Using database saved applied_percentage values (matches roster)');
      
      // ✅ SAVED VALUES: Use database values when no edits (matches roster display)
      for (const activity of activities) {
        if (activity.isEnabled) {
          let activityTotalApplied = 0;
          
          for (const subcomponent of activity.subcomponents) {
            if (subcomponent.isIncluded) {
              // ✅ ROSTER SYNC: Use saved applied_percentage from database
              const appliedPercentage = subcomponent.applied_percentage || 0;
              
              console.log('📊 [SAVED VALUES] Using saved applied_percentage for', subcomponent.name, ':', appliedPercentage);
              activityTotalApplied += appliedPercentage;
            }
          }
          
          if (activityTotalApplied > 0) {
            segments.push({
              activityId: activity.id,
              name: activity.name,
              percentage: activityTotalApplied,
              color: activityColors[activities.indexOf(activity) % activityColors.length],
              startPosition: currentPosition,
              width: activityTotalApplied
            });
            currentPosition += activityTotalApplied;
            
            console.log('✅ [SAVED VALUES] Activity', activity.name, 'total applied:', activityTotalApplied, '% (from database - matches roster)');
          }
        }
      }
    }
    
    console.log('✅ [ROSTER-MODAL SYNC] Modal now displays EXACT saved values that roster reads');
    return segments;
  };

  const updateActivityEnabled = (activityId: string, isEnabled: boolean) => {
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    setActivities(prev => {
      const updated = prev.map(activity => {
        if (activity.id === activityId) {
          return {
            ...activity,
            isEnabled,
            subcomponents: activity.subcomponents.map(sub => ({
              ...sub,
              isIncluded: isEnabled ? sub.isIncluded : false
            }))
          };
        }
        return activity;
      });
      
      // REMOVED: Auto-save - only save when user clicks Save button
      calculateTotalAllocated(updated);
      return updated;
    });
  };

  const updateActivityPracticePercentage = (activityId: string, percentage: number) => {
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    setActivities(prev => {
      const updated = prev.map(activity => {
        if (activity.id === activityId) {
          return { ...activity, practicePercentage: percentage };
        }
        return activity;
      });
      
      // FIXED: Force redistribution to maintain 100% total (including non-R&D time)
      const enabledActivities = updated.filter(a => a.isEnabled);
      const totalAllocated = enabledActivities.reduce((sum, a) => sum + a.practicePercentage, 0) + nonRdPercentage;
      
      if (totalAllocated > 100) {
        // Redistribute proportionally to fit within 100%
        const availableForResearch = 100 - nonRdPercentage;
        const totalResearchTime = enabledActivities.reduce((sum, a) => sum + a.practicePercentage, 0);
        const scaleFactor = availableForResearch / totalResearchTime;
        
        const redistributed = updated.map(activity => {
          if (activity.isEnabled) {
            return { ...activity, practicePercentage: Math.round(activity.practicePercentage * scaleFactor * 100) / 100 };
          }
          return activity;
        });
        
        // REMOVED: Auto-save - only save when user clicks Save button
        calculateTotalAllocated(redistributed);
        return redistributed;
      }
      
      // REMOVED: Auto-save - only save when user clicks Save button
      calculateTotalAllocated(updated);
      return updated;
    });
  };

  const updateSubcomponentTimePercentage = (activityId: string, subcomponentId: string, percentage: number) => {
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    setActivities(prev => {
      const updated = prev.map(activity => {
        if (activity.id === activityId) {
          return {
            ...activity,
            subcomponents: activity.subcomponents.map(sub => {
              if (sub.id === subcomponentId) {
                // Allow up to 100% for any subcomponent, not limited by baseline
                return { ...sub, timePercentage: Math.max(0, Math.min(percentage, 100)) };
              }
              return sub;
            })
          };
        }
        return activity;
      });
      
      // REMOVED: Auto-save - only save when user clicks Save button
      calculateTotalAllocated(updated);
      return updated;
    });
  };

  // DISABLED: Auto-save functionality - allocations now only save when Save button is clicked
  const autoSaveAllocations = async (activitiesData: any[]) => {
    // DISABLED: All changes are now batched until the Save button is clicked
    console.log('⚠️ autoSaveAllocations called but is disabled - use Save button instead');
  };

  const saveAllocations = async () => {
    if (!employee) return;
    
    // Utility function to apply 80% threshold rule (local to modal)
    const applyEightyPercentThreshold = (appliedPercentage: number): number => {
      return appliedPercentage >= 80 ? 100 : appliedPercentage;
    };
    
    setLoading(true);
    try {
      console.log('💾 BATCH SAVE: Saving all allocation changes for employee:', employee.id);
      console.log('🎯 All UI changes are now batched and saved only when Save button is clicked');
      
      // FIRST: Save activity enabled states to rd_selected_activities
      for (const activity of activities) {
        try {
          const { error: activityError } = await supabase
            .from('rd_selected_activities')
            .update({ 
              is_enabled: activity.isEnabled,
              practice_percent: activity.practicePercentage 
            })
            .eq('business_year_id', businessYearId)
            .eq('activity_id', activity.id);
          
          if (activityError) {
            console.error('❌ Error saving activity enabled state:', activityError);
          } else {
            console.log('✅ Saved activity enabled state:', activity.name, activity.isEnabled);
          }
        } catch (error) {
          console.error('❌ Error in activity state update:', error);
        }
      }
      
      // Handle disabled activities by removing their allocations
      for (const activity of activities) {
        if (!activity.isEnabled) {
          console.log('🗑️ Removing allocations for disabled activity:', activity.name);
          
          const subcomponentIds = activity.subcomponents.map(sub => sub.id);
          
          if (subcomponentIds.length > 0) {
            const { error } = await supabase
              .from('rd_employee_subcomponents')
              .delete()
              .eq('employee_id', employee.id)
              .eq('business_year_id', businessYearId)
              .in('subcomponent_id', subcomponentIds);
            
            if (error) {
              console.error('❌ Error removing allocations for disabled activity:', error);
            } else {
              console.log('✅ Removed allocations for disabled activity:', activity.name);
            }
          }
        }
      }
      
      // Calculate and save allocations for enabled activities
      let totalAppliedPercentage = 0;
      
      for (const activity of activities) {
        if (activity.isEnabled) {
          for (const subcomponent of activity.subcomponents) {
            if (subcomponent.isIncluded) {
              // Calculate applied percentage using modal's formula: Practice% × Year% × Frequency% × Time%
              const appliedPercentage = (activity.practicePercentage / 100) * 
                                     (subcomponent.yearPercentage / 100) * 
                                     (subcomponent.frequencyPercentage / 100) * 
                                     (subcomponent.timePercentage / 100) * 100;
              
              console.log('🔍 Calculated applied percentage for subcomponent:', {
                subcomponent: subcomponent.name,
                practicePercentage: activity.practicePercentage,
                yearPercentage: subcomponent.yearPercentage,
                frequencyPercentage: subcomponent.frequencyPercentage,
                timePercentage: subcomponent.timePercentage,
                appliedPercentage: appliedPercentage
              });
              
              // Add to total
              totalAppliedPercentage += appliedPercentage;
              
              // Prepare upsert data - save exact values from modal calculations
              // NO BASELINE CONSTRAINTS - all data goes to standard columns
              const upsertData: any = {
                employee_id: employee.id,
                business_year_id: businessYearId,
                subcomponent_id: subcomponent.id,
                time_percentage: subcomponent.timePercentage,
                applied_percentage: appliedPercentage, // Use exact calculated value (no constraints)
                practice_percentage: activity.practicePercentage,
                year_percentage: subcomponent.yearPercentage,
                frequency_percentage: subcomponent.frequencyPercentage,
                is_included: subcomponent.isIncluded,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              };
              
              // Save to database
              const { error } = await supabase
                .from('rd_employee_subcomponents')
                .upsert(upsertData, {
                  onConflict: 'employee_id,business_year_id,subcomponent_id'
                });
              
              if (error) {
                console.error('❌ Error saving subcomponent allocation:', error);
                throw error;
              } else {
                console.log('✅ Saved subcomponent allocation:', {
                  subcomponent: subcomponent.name,
                  appliedPercentage: appliedPercentage
                });
              }
            } else {
              // Remove unselected subcomponents
              const { error: deleteError } = await supabase
                .from('rd_employee_subcomponents')
                .delete()
                .eq('employee_id', employee.id)
                .eq('business_year_id', businessYearId)
                .eq('subcomponent_id', subcomponent.id);
              
              if (deleteError) {
                console.error('❌ Error removing unselected subcomponent:', deleteError);
              } else {
                console.log('✅ Removed unselected subcomponent allocation:', subcomponent.name);
              }
            }
          }
        }
      }
      
      console.log('📊 Total applied percentage calculated:', totalAppliedPercentage);
      
      // CRITICAL FIX: Always use calculated total, never fall back to baseline
      const finalAppliedPercentage = totalAppliedPercentage; // NO baseline fallback
      const annualWage = employee.annual_wage || 0;
      // Apply 80% threshold rule for QRE calculation in allocation modal
      const qreAppliedPercentage = applyEightyPercentThreshold(finalAppliedPercentage);
      const calculatedQRE = Math.round((annualWage * qreAppliedPercentage) / 100);

      console.log('📊 Final calculations:', {
        appliedPercentage: finalAppliedPercentage,
        qreAppliedPercentageWith80Threshold: qreAppliedPercentage,
        annualWage: annualWage,
        calculatedQRE: calculatedQRE,
        note: 'Applied 80% threshold rule for QRE calculation'
      });

      // ✅ ROSTER-MODAL SYNC: Use pure R&D calculation (no non-R&D addition)
      console.log('✅ [ROSTER-MODAL SYNC] Applied% matches modal exactly:', {
        appliedPercentage: finalAppliedPercentage,
        note: 'Pure R&D calculation - identical to modal Applied% display'
      });

      // ✅ ROSTER-MODAL SYNC: Update with pure R&D calculation (no non-R&D column)
      const { error: yearDataError } = await supabase
        .from('rd_employee_year_data')
        .update({
          calculated_qre: calculatedQRE,
          applied_percent: finalAppliedPercentage // Use pure R&D calculation to match modal
        })
        .eq('employee_id', employee.id)
        .eq('business_year_id', businessYearId);
        
      if (yearDataError) {
        console.error('❌ Error updating employee year QRE after allocations:', yearDataError);
      } else {
        console.log('✅ [ROSTER-MODAL SYNC] Updated employee year data to match modal:', {
          calculatedQRE: calculatedQRE,
          appliedPercent: finalAppliedPercentage,
          note: 'Pure R&D calculation - no non-R&D component to match modal exactly'
        });
      }

      console.log('✅ Allocations saved successfully - employee roster should now match allocation modal');
      setHasUnsavedChanges(false); // Reset unsaved changes flag after successful save
      onUpdate();
      onClose();
    } catch (error) {
      console.error('❌ Error saving allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const revertToBaseline = async () => {
    if (!employee) return;
    
    setLoading(true);
    try {
      console.log('🔄 Reverting to baseline for employee:', employee.id);
      
      // Delete all custom allocations
      const { error } = await supabase
        .from('rd_employee_subcomponents')
        .delete()
        .eq('employee_id', employee.id)
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('❌ Error reverting to baseline:', error);
      } else {
        console.log('✅ Reverted to baseline successfully');
        
        // Recalculate and update employee year data to baseline values
        try {
          // Fetch employee wage and role baseline
          const { data: employeeData, error: employeeError } = await supabase
            .from('rd_employees')
            .select('annual_wage, role:rd_roles(baseline_applied_percent)')
            .eq('id', employee.id)
            .single();
          
          if (employeeError) {
            console.error('❌ Error fetching employee wage/role for baseline revert:', employeeError);
          }
          
          const annualWage = employeeData?.annual_wage || 0;
          const baselinePercent = employeeData?.role 
            ? (Array.isArray(employeeData.role) 
                ? (employeeData.role[0] as any)?.baseline_applied_percent || 0
                : (employeeData.role as any)?.baseline_applied_percent || 0)
            : 0;
          
          // Calculate baseline QRE
          const baselineQRE = Math.round((annualWage * baselinePercent) / 100);
          
          console.log('🔄 Reverting employee year data to baseline:', {
            baselinePercent,
            baselineQRE
          });
          
          // Update rd_employee_year_data to baseline values
          const { error: yearDataError } = await supabase
            .from('rd_employee_year_data')
            .update({
              calculated_qre: baselineQRE,
              applied_percent: baselinePercent,
              updated_at: new Date().toISOString()
            })
            .eq('employee_id', employee.id)
            .eq('business_year_id', businessYearId);
          
          if (yearDataError) {
            console.error('❌ Error updating employee year data to baseline:', yearDataError);
          } else {
            console.log('✅ Reset employee year data to baseline values');
          }
        } catch (err) {
          console.error('❌ Error in baseline QRE recalculation:', err);
        }
        
        // Reset subcomponent time percentages back to baseline
        setActivities(prev => prev.map(activity => ({
          ...activity,
          subcomponents: activity.subcomponents.map(sub => ({
            ...sub,
            timePercentage: sub.baselineTimePercentage || sub.maxTimePercentage // Reset to baseline
          }))
        })));
        
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('❌ Error reverting to baseline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  // DEBUG: Confirm which employee data is being rendered
  console.log('🎯 MODAL RENDER: Showing allocation modal for:', employee.first_name, employee.last_name, employee.id);
  console.log('🎯 MODAL RENDER: Activities count:', activities.length);
  console.log('🎯 MODAL RENDER: Loading state:', loading);

  // BLOCK RENDERING until we have fresh data loaded for this specific employee
  if (loading || activities.length === 0) {
    console.log('🔄 BLOCKING RENDER: Still loading data for employee:', employee.first_name, employee.last_name);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Manage Allocations - {employee.first_name} {employee.last_name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading fresh allocation data for {employee.first_name} {employee.last_name}...</span>
            </div>
          ) : (
            <>
              {/* Practice Percentage Bar */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Practice Percentage Distribution</h4>
                    <p className="text-xs text-gray-500">How time is allocated across activities and non-R&D work</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{formatPercentage(totalAllocated)}%</span>
                    <div className="text-xs text-gray-500">Total Allocated</div>
                  </div>
                </div>
                
                <div className="relative w-full bg-gray-200 rounded-full h-6 mb-3 overflow-hidden">
                  {getPracticePercentageSegments().map((segment, index) => (
                    <div
                      key={`practice-${segment.activityId}`}
                      className="absolute h-6 rounded-full transition-all duration-300 hover:opacity-80"
                      style={{
                        left: `${segment.startPosition}%`,
                        width: `${segment.width}%`,
                        backgroundColor: segment.color
                      }}
                      title={`${segment.name}: ${formatPercentage(segment.percentage)}%`}
                    />
                  ))}
                </div>
                
                {/* Enhanced Legend */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getPracticePercentageSegments().map((segment, index) => (
                    <div key={`legend-practice-${segment.activityId}`} className="flex items-center space-x-2 p-2 bg-white rounded border">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: segment.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{segment.name}</div>
                        <div className="text-xs text-gray-500">{formatPercentage(segment.percentage)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {totalAllocated > 100 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-600 text-sm">⚠️ Total exceeds 100%. Please adjust allocations.</p>
                  </div>
                )}
              </div>

              {/* Applied Percentage Bar */}
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Applied Percentage (Research Activities)</h4>
                    <p className="text-xs text-gray-500">No constraints - allocate as needed for research work</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-900">{formatPercentage(getTotalAppliedPercentage())}%</span>
                    <div className="text-xs text-blue-600">Total Applied</div>
                  </div>
                </div>
                
                <div className="relative w-full bg-gray-200 rounded-full h-6 mb-3 overflow-hidden">
                  {getAppliedPercentageSegments().map((segment, index) => (
                    <div
                      key={`applied-${segment.activityId}`}
                      className="absolute h-6 rounded-full transition-all duration-300 hover:opacity-80"
                      style={{
                        left: `${segment.startPosition}%`,
                        width: `${segment.width}%`,
                        backgroundColor: segment.color
                      }}
                      title={`${segment.name}: ${formatPercentage(segment.percentage)}%`}
                    />
                  ))}
                </div>
                
                {/* Enhanced Legend */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getAppliedPercentageSegments().map((segment, index) => (
                    <div key={`legend-applied-${segment.activityId}`} className="flex items-center space-x-2 p-2 bg-white rounded border">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: segment.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{segment.name}</div>
                        <div className="text-xs text-blue-600">{formatPercentage(segment.percentage)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Non-R&D Time Allocation */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Non-R&D Time Allocation</h4>
                    <p className="text-xs text-gray-500">Time spent on non-research activities</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-orange-900">{formatPercentage(nonRdPercentage)}%</span>
                    <div className="text-xs text-orange-600">Non-R&D Time</div>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.01"
                  value={nonRdPercentage}
                                            onChange={(e) => {
                            setHasUnsavedChanges(true);
                            setNonRdPercentage(parseFloat(e.target.value));
                          }}
                  className="w-full h-3 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
                <p className="text-xs text-orange-600 mt-2">
                  ℹ️ This time is automatically redistributed across research activities in the practice percentage bar
                </p>
              </div>

              {/* Research Activities */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Research Activities</h4>
                {activities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={activity.isEnabled}
                            onChange={(e) => updateActivityEnabled(activity.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <h5 className="font-medium text-gray-900">{activity.name}</h5>
                        </div>
                        <button
                          onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedActivity === activity.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Practice Percentage Slider */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Practice Percentage</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatPercentage(activity.practicePercentage)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.01"
                          value={activity.practicePercentage}
                          onChange={(e) => updateActivityPracticePercentage(activity.id, parseFloat(e.target.value))}
                          disabled={!activity.isEnabled}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                        />
                      </div>

                      {/* Subcomponents */}
                      {expandedActivity === activity.id && (
                        <div className="mt-4 space-y-3">
                          <h6 className="text-sm font-medium text-gray-700">Subcomponents</h6>
                          {activity.subcomponents.map((subcomponent) => (
                            <div key={subcomponent.id} className="pl-4 border-l-2 border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={subcomponent.isIncluded}
                                    onChange={(e) => {
                                      setHasUnsavedChanges(true); // Mark as having unsaved changes
                                      setActivities(prev => {
                                        const updated = prev.map(a => {
                                          if (a.id === activity.id) {
                                            return {
                                              ...a,
                                              subcomponents: a.subcomponents.map(s => {
                                                if (s.id === subcomponent.id) {
                                                  return { ...s, isIncluded: e.target.checked };
                                                }
                                                return s;
                                              })
                                            };
                                          }
                                          return a;
                                        });
                                        
                                        // REMOVED: Auto-save - only save when user clicks Save button
                                        calculateTotalAllocated(updated);
                                        return updated;
                                      });
                                    }}
                                    disabled={!activity.isEnabled}
                                    className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                                  />
                                  <span className="text-sm text-gray-700">{subcomponent.name}</span>
                                  <span className="text-xs text-gray-500">({subcomponent.stepName})</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  Max: {formatPercentage(subcomponent.maxTimePercentage)}%
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="range"
                                  min="0"
                                  max={100}
                                  step="0.01"
                                  value={subcomponent.timePercentage}
                                  onChange={(e) => updateSubcomponentTimePercentage(activity.id, subcomponent.id, parseFloat(e.target.value))}
                                  disabled={!subcomponent.isIncluded || !activity.isEnabled}
                                  className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                                />
                                <span className="text-xs text-gray-600 w-12 text-right">
                                  {formatPercentage(subcomponent.timePercentage)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-between">
                <div className="flex space-x-3">
                  <button
                    onClick={revertToBaseline}
                    disabled={loading}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Revert to Baseline
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAllocations}
                    disabled={loading || totalAllocated > 100}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Allocations'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EmployeeSetupStep: React.FC<EmployeeSetupStepProps> = ({
  employees,
  onUpdate,
  onNext,
  onPrevious,
  businessYearId = '',
  businessId = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [employeesWithData, setEmployeesWithData] = useState<EmployeeWithExpenses[]>([]);
  const [contractorsWithData, setContractorsWithData] = useState<ContractorWithExpenses[]>([]);
  const [expenses, setExpenses] = useState<RDExpense[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedYear, setSelectedYear] = useState(businessYearId);
  const [availableYears, setAvailableYears] = useState<{ id: string; year: number }[]>([]);
  const [showEmployeeDetailModal, setShowEmployeeDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithExpenses | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<'employees' | 'contractors' | 'supplies' | 'support'>('employees');
  const [sortBy, setSortBy] = useState<'first_name' | 'last_name' | 'calculated_qre' | 'applied_percentage'>('last_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showContractorDetailModal, setShowContractorDetailModal] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [supplies, setSupplies] = useState<RDSupply[]>([]);
  // CSV Import State
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUseActualization, setCsvUseActualization] = useState(true);
  // Allocation Report Modal State
  const [showAllocationReport, setShowAllocationReport] = useState(false);
  // Add state to track the current year for display
  const [displayYear, setDisplayYear] = useState<number>(new Date().getFullYear());
  
  // QRE Locked Values State
  const [lockedEmployeeQRE, setLockedEmployeeQRE] = useState<number>(0);
  const [lockedContractorQRE, setLockedContractorQRE] = useState<number>(0);
  const [lockedSupplyQRE, setLockedSupplyQRE] = useState<number>(0);
  const [qreLocked, setQreLocked] = useState<boolean>(false);

  console.log('🔍 EmployeeSetupStep - Component props:', {
    businessYearId,
    businessId,
    employeesLength: employees?.length
  });

  // Note: Data isolation is now handled by parent component via key prop
  // which forces complete component remount when switching businesses

  // Load QRE locked values from database
  const loadQREValues = async (businessYearId: string) => {
    try {
      console.log('🔍 Loading QRE values for business year:', businessYearId);
      
      const { data, error } = await supabase
        .from('rd_business_years')
        .select('employee_qre, contractor_qre, supply_qre, qre_locked')
        .eq('id', businessYearId)
        .single();

      if (error) {
        console.error('❌ Error loading QRE values:', error);
        // If columns don't exist, that's expected for old records
        if (error.message?.includes('column') || error.code === 'PGRST116') {
          console.log('ℹ️ QRE columns not yet available for this business year - using defaults');
          setLockedEmployeeQRE(0);
          setLockedContractorQRE(0);
          setLockedSupplyQRE(0);
          setQreLocked(false);
        }
        return;
      }

      if (data) {
        console.log('💾 CRITICAL: Loading QRE values from database for year:', businessYearId);
        console.log('💾 Database values:', data);
        setLockedEmployeeQRE(data.employee_qre || 0);
        setLockedContractorQRE(data.contractor_qre || 0);
        setLockedSupplyQRE(data.supply_qre || 0);
        setQreLocked(data.qre_locked || false);
        console.log('✅ QRE state updated:', {
          employee: data.employee_qre || 0,
          contractor: data.contractor_qre || 0,
          supply: data.supply_qre || 0,
          locked: data.qre_locked || false
        });
      }
    } catch (error) {
      console.error('❌ Error loading QRE values:', error);
    }
  };

  // Verify database migration has been applied
  const verifyDatabaseMigration = async () => {
    try {
      console.log('🔍 Verifying database migration...');
      
      // Try to query the new columns
      const { data, error } = await supabase
        .from('rd_business_years')
        .select('id, employee_qre, contractor_qre, supply_qre, qre_locked')
        .limit(1);

      if (error) {
        console.error('❌ Database migration verification failed:', error);
        if (error.message?.includes('column') || error.code === 'PGRST116') {
          toast.error('⚠️ Database migration not applied! Please run: supabase/migrations/20250122000002_add_locked_qre_fields.sql');
          return false;
        }
      } else {
        console.log('✅ Database migration verified - QRE columns exist');
        return true;
      }
    } catch (error) {
      console.error('❌ Error verifying database migration:', error);
      return false;
    }
    return false;
  };

  // Save QRE locked values to database
  const saveQREValues = async () => {
    if (!selectedYear) return;

    try {
      const { error } = await supabase
        .from('rd_business_years')
        .update({
          employee_qre: lockedEmployeeQRE,
          contractor_qre: lockedContractorQRE,
          supply_qre: lockedSupplyQRE,
          qre_locked: qreLocked,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedYear);

      if (error) {
        console.error('❌ Error saving QRE values:', error);
        toast.error('Failed to save QRE values');
        return;
      }

      toast.success('✅ QRE values saved successfully');
      console.log('✅ Saved QRE values:', {
        employee_qre: lockedEmployeeQRE,
        contractor_qre: lockedContractorQRE,
        supply_qre: lockedSupplyQRE,
        qre_locked: qreLocked
      });

      // CRITICAL: Trigger recalculation of federal credits when QRE values change
      if (onUpdate) {
        console.log('🔄 Triggering federal credit recalculation due to QRE lock change');
        onUpdate({ qreValuesChanged: true });
      }
    } catch (error) {
      console.error('❌ Error saving QRE values:', error);
      toast.error('Failed to save QRE values');
    }
  };

  // Handle locking QRE values - when user clicks lock, capture current calculated values
  const handleQRELockToggle = async () => {
    if (!qreLocked) {
      // User is locking - capture current calculated values
      // Calculate current QRE values from state
      const currentEmployeeQRE = employeesWithData.reduce((sum, e) => sum + (e.calculated_qre || 0), 0);
      const currentContractorQRE = contractorsWithData.reduce((sum, c) => sum + (c.calculated_qre || 0), 0);
      const currentSupplyQRE = supplies.reduce((sum, s) => sum + (s.calculated_qre || 0), 0);
      
      console.log('🔒 Locking QRE values at current calculated amounts:', {
        employee: currentEmployeeQRE,
        contractor: currentContractorQRE,
        supply: currentSupplyQRE
      });
      setLockedEmployeeQRE(currentEmployeeQRE);
      setLockedContractorQRE(currentContractorQRE);
      setLockedSupplyQRE(currentSupplyQRE);
      setQreLocked(true);
      
      // Auto-save when locking
      if (selectedYear) {
        try {
          console.log('💾 Attempting to save QRE lock for business year:', selectedYear);
          console.log('💾 Data to save:', {
            employee_qre: employeeQRE,
            contractor_qre: contractorQRE,
            supply_qre: supplyQRE,
            qre_locked: true
          });

          // Verify database migration first
          const migrationOK = await verifyDatabaseMigration();
          if (!migrationOK) {
            return;
          }

          // First check if the business year exists
          const { data: existingYear, error: checkError } = await supabase
            .from('rd_business_years')
            .select('id, employee_qre, contractor_qre, supply_qre, qre_locked')
            .eq('id', selectedYear)
            .single();

          if (checkError) {
            console.error('❌ Error checking business year existence:', checkError);
            toast.error('Business year not found');
            return;
          }

          console.log('✅ Business year exists:', existingYear);

          // Attempt the update
          const { data: updateData, error: updateError } = await supabase
            .from('rd_business_years')
            .update({
              employee_qre: currentEmployeeQRE,
              contractor_qre: currentContractorQRE,
              supply_qre: currentSupplyQRE,
              qre_locked: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedYear)
            .select();

          if (updateError) {
            console.error('❌ Error saving QRE lock:', updateError);
            console.error('❌ Full error details:', JSON.stringify(updateError, null, 2));
            
            // Check if it's a column missing error
            if (updateError.message?.includes('column') || updateError.code === 'PGRST116') {
              toast.error('QRE columns not available. Please run the database migration first.');
            } else {
              toast.error(`Failed to save QRE lock: ${updateError.message}`);
            }
          } else {
            console.log('✅ Successfully saved QRE lock:', updateData);
            toast.success('✅ QRE values locked successfully');
            
            // CRITICAL: Trigger federal credit recalculation
            if (onUpdate) {
              console.log('🔄 Triggering federal credit recalculation due to QRE LOCK');
              onUpdate({ qreValuesChanged: true });
            }
          }
        } catch (error) {
          console.error('❌ Unexpected error saving QRE lock:', error);
          toast.error('Unexpected error saving QRE lock');
        }
      }
    } else {
      // User is unlocking - switch back to dynamic calculations
      console.log('🔓 Unlocking QRE values - will use live calculations');
      setQreLocked(false);
      
      // Auto-save unlock state
      if (selectedYear) {
        try {
          console.log('💾 Attempting to save QRE unlock for business year:', selectedYear);

          const { error } = await supabase
            .from('rd_business_years')
            .update({
              qre_locked: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedYear);

          if (error) {
            console.error('❌ Error saving QRE unlock:', error);
            console.error('❌ Full error details:', JSON.stringify(error, null, 2));
            toast.error(`Failed to save QRE unlock: ${error.message}`);
          } else {
            console.log('✅ Successfully saved QRE unlock');
            toast.success('✅ QRE values unlocked - using live calculations');
            
            // CRITICAL: Trigger federal credit recalculation
            if (onUpdate) {
              console.log('🔄 Triggering federal credit recalculation due to QRE UNLOCK');
              onUpdate({ qreValuesChanged: true });
            }
          }
        } catch (error) {
          console.error('❌ Unexpected error saving QRE unlock:', error);
          toast.error('Unexpected error saving QRE unlock');
        }
      }
    }
  };

  const loadData = async (yearIdOverride?: string) => {
    console.log('🔄 EmployeeSetupStep - loadData started');
    setLoading(true);
    
    try {
      // Load available years
      const { data: years, error: yearsError } = await supabase
        .from('rd_business_years')
        .select('id, year')
        .eq('business_id', businessId)
        .order('year', { ascending: false });

      if (yearsError) {
        console.error('❌ EmployeeSetupStep - Error loading years:', yearsError);
      } else {
        setAvailableYears(years || []);
        if (!selectedYear && years && years.length > 0) {
          setSelectedYear(years[0].id);
        }
      }

      // Determine which year to use for data loading
      const targetYearId = yearIdOverride || selectedYear || businessYearId;
      console.log('🎯 EmployeeSetupStep - Loading data for year:', targetYearId, {
        yearIdOverride,
        selectedYear,
        businessYearId,
        finalChoice: targetYearId
      });

      // Load roles with baseline_applied_percent
      const { data: rolesData, error: rolesError } = await supabase
        .from('rd_roles')
        .select('id, name, baseline_applied_percent')
        .eq('business_year_id', targetYearId);

      if (rolesError) {
        console.error('❌ EmployeeSetupStep - Error loading roles:', rolesError);
      } else {
        setRoles(rolesData || []);
      }

      // Load employees with calculated QRE - CORRECT: Filter by employees who have data for the selected year
      const currentBusinessYearId = targetYearId;
      console.log('🔍 Loading employees for specific year only:', currentBusinessYearId);
      
      // First, get employees who have year data for the selected year
      const { data: employeeYearData, error: yearDataError } = await supabase
        .from('rd_employee_year_data')
        .select('employee_id')
        .eq('business_year_id', currentBusinessYearId);

      if (yearDataError) {
        console.error('❌ EmployeeSetupStep - Error loading employee year data:', yearDataError);
        setEmployeesWithData([]);
        return;
      }

      const employeeIdsForYear = (employeeYearData || []).map(data => data.employee_id);
      console.log('🔍 Found employees with data for this year:', employeeIdsForYear.length);

      if (employeeIdsForYear.length === 0) {
        console.log('📭 No employees found for this year');
        setEmployeesWithData([]);
        // Continue to load other data (contractors, supplies)
      } else {
        // Now load the actual employee records for these IDs
        const { data: employeesData, error: employeesError } = await supabase
          .from('rd_employees')
          .select('*')
          .eq('business_id', businessId)
          .in('id', employeeIdsForYear);

      if (employeesError) {
        console.error('❌ EmployeeSetupStep - Error loading employees:', employeesError);
        setEmployeesWithData([]);
      } else {
        // FIXED: Load year-specific data separately to prevent data leakage
        const currentBusinessYearId = targetYearId;
        console.log('🔍 Loading employee data for specific year:', currentBusinessYearId);
        
        // Calculate QRE for each employee using ONLY data from the selected year
        const employeesWithQRE = await Promise.all((employeesData || []).map(async (employee) => {
          // CRITICAL FIX: Load year-specific role data
          let role = null;
          let baselinePercent = 0;
          
          if (employee.role_id) {
            // Get the role for this specific business year
            const { data: roleData, error: roleError } = await supabase
              .from('rd_roles')
              .select('id, name, baseline_applied_percent')
              .eq('id', employee.role_id)
              .eq('business_year_id', currentBusinessYearId)
              .maybeSingle();
            
            if (roleError) {
              console.error('❌ Error loading role for employee:', employee.id, roleError);
            } else if (roleData) {
              role = roleData;
              baselinePercent = roleData.baseline_applied_percent || 0;
              console.log(`✅ Found year-specific role for ${employee.first_name} ${employee.last_name}:`, roleData.name);
            } else {
              console.log(`⚠️ Role ${employee.role_id} not found in business year ${currentBusinessYearId} for ${employee.first_name} ${employee.last_name}`);
              
              // AUTO-FIX: Try to find role in any year and copy it to current year
              const { data: anyYearRole, error: anyYearError } = await supabase
                .from('rd_roles')
                .select('*')
                .eq('id', employee.role_id)
                .maybeSingle();
              
              if (anyYearRole && !anyYearError) {
                console.log(`🔄 Auto-copying role "${anyYearRole.name}" to current year for ${employee.first_name} ${employee.last_name}`);
                
                // Check if role with same name already exists in current year
                const { data: existingRole, error: existingError } = await supabase
                  .from('rd_roles')
                  .select('*')
                  .eq('name', anyYearRole.name)
                  .eq('business_year_id', currentBusinessYearId)
                  .eq('business_id', businessId)
                  .maybeSingle();
                
                if (existingRole && !existingError) {
                  // Use existing role with same name
                  role = existingRole;
                  baselinePercent = existingRole.baseline_applied_percent || 0;
                  console.log(`✅ Using existing "${existingRole.name}" role in current year for ${employee.first_name} ${employee.last_name}`);
                  
                  // Update employee to use the existing role ID
                  await supabase
                    .from('rd_employees')
                    .update({ role_id: existingRole.id })
                    .eq('id', employee.id);
                } else {
                  // Create new role in current year
                  const { data: newRole, error: createError } = await supabase
                    .from('rd_roles')
                    .insert({
                      business_id: businessId,
                      business_year_id: currentBusinessYearId,
                      name: anyYearRole.name,
                      description: anyYearRole.description,
                      type: anyYearRole.type,
                      is_default: anyYearRole.is_default,
                      baseline_applied_percent: anyYearRole.baseline_applied_percent,
                      parent_id: null // Will be fixed in hierarchy copy if needed
                    })
                    .select()
                    .single();
                  
                  if (newRole && !createError) {
                    role = newRole;
                    baselinePercent = newRole.baseline_applied_percent || 0;
                    console.log(`✅ Auto-created role "${newRole.name}" in current year for ${employee.first_name} ${employee.last_name}`);
                    
                    // Update employee to use the new role ID
                    await supabase
                      .from('rd_employees')
                      .update({ role_id: newRole.id })
                      .eq('id', employee.id);
                  } else {
                    console.error(`❌ Failed to auto-create role:`, createError);
                    baselinePercent = anyYearRole.baseline_applied_percent || 0;
                  }
                }
              } else {
                console.warn(`⚠️ Role ${employee.role_id} not found in any year for ${employee.first_name} ${employee.last_name}`);
                baselinePercent = 0;
              }
            }
          }
          
          const annualWage = employee.annual_wage || 0;
          
          // CRITICAL FIX: Load year-specific data only
          const [yearDataResult, subcomponentsResult] = await Promise.all([
                      // ✅ ROSTER-MODAL SYNC: Get year-specific employee data (no non-R&D column)
            supabase
              .from('rd_employee_year_data')
            .select('calculated_qre, applied_percent')
              .eq('employee_id', employee.id)
              .eq('business_year_id', currentBusinessYearId)
              .maybeSingle(),
            
            // Get year-specific subcomponents
            supabase
              .from('rd_employee_subcomponents')
              .select('applied_percentage, baseline_applied_percent, is_included')
              .eq('employee_id', employee.id)
              .eq('business_year_id', currentBusinessYearId)
              .eq('is_included', true)
          ]);
          
          if (yearDataResult.error) {
            console.error('❌ Error loading year data for employee:', employee.id, yearDataResult.error);
          }
          
          if (subcomponentsResult.error) {
            console.error('❌ Error loading subcomponents for employee:', employee.id, subcomponentsResult.error);
          }
          
          const yearData = yearDataResult.data;
          const subcomponents = subcomponentsResult.data || [];
          
          // ✅ ROSTER-MODAL SYNC: Use identical calculation method as allocation modal
          console.log(`🔄 [ROSTER-MODAL SYNC] Calculating Applied% for ${employee.first_name} ${employee.last_name} using IDENTICAL modal methodology`);
          
          // Calculate applied percentage using IDENTICAL allocation modal methodology
          const modalAppliedPercentage = await calculateEmployeeAppliedPercentage(employee.id);
          
          // Use modal calculation as single source of truth (no baseline fallback)
          const finalAppliedPercentage = modalAppliedPercentage > 0 ? modalAppliedPercentage : 0;
          
          console.log(`✅ [ROSTER-MODAL SYNC] Applied% calculation complete:`, {
            employee: `${employee.first_name} ${employee.last_name}`,
            modalCalculation: modalAppliedPercentage,
            finalAppliedPercentage,
            note: 'IDENTICAL to modal - no baseline fallback, pure subcomponent-based calculation'
          });
          
          // CRITICAL FIX: Calculate QRE using SAME percentage as Applied% display
          // Apply 80% threshold rule consistently
          const qreAppliedPercentage = applyEightyPercentThreshold(finalAppliedPercentage);
          const calculatedQRE = Math.round((annualWage * qreAppliedPercentage) / 100);
          
          console.log(`✅ [ROSTER-MODAL SYNC] QRE calculation for ${employee.first_name} ${employee.last_name}:`, {
            annualWage,
            appliedPercentageFromModal: finalAppliedPercentage, // IDENTICAL to modal (24.97% not 30.43%)
            qreAppliedPercentage,   // Applied% with 80% threshold for QRE calculation
            calculatedQRE,          // Final QRE amount using modal Applied%
            note: 'Now uses IDENTICAL Applied% calculation as allocation modal',
            subcomponentsCount: subcomponents.length
          });
          
          return {
            ...employee,
            role: role, // Include the year-specific role data
            calculated_qre: calculatedQRE,
            baseline_applied_percent: baselinePercent,
            applied_percentage: finalAppliedPercentage, // UNIFIED: Always shows modal calculation
            year_data: yearData ? [yearData] : [],
            subcomponents: subcomponents
          };
        }));

        // Filter to only include employees with data for this year
        const filteredEmployees = employeesWithQRE.filter(emp => 
          emp.calculated_qre > 0 || emp.subcomponents.length > 0
        );

        console.log(`✅ Loaded ${filteredEmployees.length} employees with year-specific data`);
        setEmployeesWithData(filteredEmployees);
      }
      } // Close the else block for employeeIdsForYear.length > 0

      // YEAR-SPECIFIC loading to prevent data leakage between years
      // Note: Using targetYearId defined earlier in function

      // Load contractors - YEAR-SPECIFIC to prevent leakage
      console.log('🔒 LOADING CONTRACTORS with STRICT YEAR ISOLATION for:', targetYearId);
      console.log('🧹 Clearing contractor state to prevent cross-year contamination');
      setContractorsWithData([]); // Clear before loading to prevent momentary leakage
      
      try {
        const contractors = await ContractorManagementService.getContractors(targetYearId);
        console.log(`🔒 CONTRACTORS STRICTLY LOADED for year ${targetYearId}:`, contractors.length, 'contractors');
        
        // Log contractor details for debugging
        contractors.forEach(c => {
          console.log(`🔍 Contractor: ${c.first_name} ${c.last_name} - QRE: $${(c.calculated_qre || 0).toLocaleString()}`);
        });
        
        console.log('✅ All contractors properly isolated for year:', targetYearId);
        setContractorsWithData(contractors);
      } catch (error) {
        console.error('❌ EmployeeSetupStep - Error loading contractors:', error);
        setContractorsWithData([]); // Ensure empty state on error
      }

      // Load expenses - YEAR-SPECIFIC to prevent leakage
      console.log('💰 LOADING EXPENSES for specific year:', targetYearId);
      console.log('💰 Clearing any existing expense state before fresh load');
      setExpenses([]); // Clear before loading to prevent momentary leakage
      
      const { data: expensesData, error: expensesError } = await supabase
        .from('rd_expenses')
        .select('*')
        .eq('business_year_id', targetYearId);

      if (expensesError) {
        console.error('❌ EmployeeSetupStep - Error loading expenses:', expensesError);
        setExpenses([]); // Ensure empty state on error
      } else {
        console.log('💰 EXPENSES LOADED for year', targetYearId, ':', expensesData?.length || 0, 'expenses');
        console.log('💰 Expense data:', expensesData);
        setExpenses(expensesData || []);
      }

      // Load supplies with subcomponents for the selected year - YEAR-SPECIFIC to prevent leakage
      console.log('🛠️ LOADING SUPPLIES for specific year:', targetYearId);
      console.log('🛠️ Current supplies state before loading:', supplies.length, 'supplies');
      console.log('🛠️ Clearing any existing supply state before fresh load');
      setSupplies([]); // Clear before loading to prevent momentary leakage
      
      try {
        console.log('🛠️ QUERY: Looking for supply subcomponents for business_year_id:', targetYearId);
        const { data: supplySubcomponents, error: supplyError } = await supabase
          .from('rd_supply_subcomponents')
          .select(`
            *,
            supply:rd_supplies (
              id,
              name,
              annual_cost,
              business_id
            )
          `)
          .eq('business_year_id', targetYearId);
        
        console.log('🛠️ QUERY RESULT:', {
          error: supplyError,
          dataLength: supplySubcomponents?.length || 0,
          firstItem: supplySubcomponents?.[0] || 'none'
        });
        
        console.log('🔍 EmployeeSetupStep supply loading analysis:', {
          targetYear: targetYearId,
          foundSubcomponents: supplySubcomponents?.length || 0,
          hasError: !!supplyError,
          message: (supplySubcomponents?.length || 0) === 0 ? 'No supply allocations found for this year - newly added supplies will have 0 subcomponents until allocated' : 'Found existing supply allocations'
        });

        if (supplyError) {
          console.error('❌ EmployeeSetupStep - Error loading supply subcomponents:', supplyError);
          setSupplies([]); // Ensure empty state on error
        } else {
          console.log('✅ EmployeeSetupStep - Found supply subcomponents:', supplySubcomponents?.length || 0, 'records');
          
          if ((supplySubcomponents?.length || 0) === 0) {
            console.log('🔍 EmployeeSetupStep - No supply subcomponents for year', targetYearId, '- setting empty supplies array');
            setSupplies([]);
          } else {
            console.log('🔄 EmployeeSetupStep - Processing supply subcomponents for year', targetYearId);
          // Group supplies by supply_id and calculate QRE
          const suppliesMap = new Map();
          (supplySubcomponents || []).forEach(ssc => {
            const supply = ssc.supply;
            if (!supply) return;
            
            if (!suppliesMap.has(supply.id)) {
              suppliesMap.set(supply.id, {
                ...supply,
                subcomponents: [],
                total_qre: 0
              });
            }
            
            const supplyEntry = suppliesMap.get(supply.id);
            supplyEntry.subcomponents.push(ssc);
            
            // Calculate QRE for this subcomponent
            const amountApplied = ssc.amount_applied || 0;
            const appliedPercentage = ssc.applied_percentage || 0;
            const supplyCost = supply.annual_cost || 0;
            const supplyQRE = amountApplied > 0 ? amountApplied : (supplyCost * appliedPercentage / 100);
            
            supplyEntry.total_qre += Math.round(supplyQRE);
          });
          
            const suppliesWithQRE = Array.from(suppliesMap.values()).map(supply => {
              // Calculate total applied percentage from all subcomponents
              const totalAppliedPercentage = supply.subcomponents.reduce((sum: number, ssc: any) => {
                return sum + (ssc.applied_percentage || 0);
              }, 0);
              
              console.log(`🔍 Supply ${supply.name}: annual_cost=${supply.annual_cost}, appliedPercentage=${totalAppliedPercentage}%, QRE=${supply.total_qre}`);
              
              return {
            ...supply,
                calculated_qre: supply.total_qre,
                applied_percentage: totalAppliedPercentage, // For display in "Applied %" column
                cost_amount: supply.annual_cost // For display in "Total Amount" column
              };
            });
          
          console.log('🛠️ SUPPLIES LOADED for year', targetYearId, ':', suppliesWithQRE.length, 'supplies');
          console.log('🛠️ Supply data:', suppliesWithQRE);
            console.log('🛠️ CRITICAL: Setting supplies state with year-isolated data');
          setSupplies(suppliesWithQRE);
            
            // Log supply details for debugging leakage
            suppliesWithQRE.forEach((supply, index) => {
              console.log(`🛠️ Supply ${index + 1}: ${supply.name} - QRE: $${(supply.calculated_qre || 0).toLocaleString()}`);
            });
          }
        }
      } catch (error) {
        console.error('❌ EmployeeSetupStep - Error loading supplies:', error);
        setSupplies([]); // Ensure empty state on error
        console.log('🛠️ EmployeeSetupStep supply loading failed - supplies set to empty array');
      }
      
      // Load QRE values for the selected year
      if (targetYearId) {
        await loadQREValues(targetYearId);
      }
    } catch (error) {
      console.error('❌ EmployeeSetupStep - Error in loadData:', error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      console.log('✅ EmployeeSetupStep - loadData completed');
    }
  };

  useEffect(() => {
    console.log('🔄 YEAR CHANGE DETECTED - businessId:', businessId, 'selectedYear:', selectedYear);
    
    // AGGRESSIVE: Clear ALL state immediately when year changes to prevent data leakage
    if (selectedYear) {
      console.log('🧹 AGGRESSIVE STATE CLEARING for year change to prevent data leakage');
      console.log('🧹 Previous expenses count:', expenses.length);
      console.log('🧹 Previous employees count:', employeesWithData.length);
      console.log('🧹 Previous contractors count:', contractorsWithData.length);
      console.log('🧹 Previous supplies count:', supplies.length);
      
             // IMMEDIATE state clearing - no delays
       setLoading(true);
       setEmployeesWithData([]);
       setContractorsWithData([]);
       setSupplies([]);
       setExpenses([]); // CRITICAL: Clear expenses immediately
       setRoles([]);
       setSelectedEmployee(null);
       setSelectedContractor(null);
       setShowEmployeeDetailModal(false);
       setShowContractorDetailModal(false);
       setActiveTab('employees'); // Reset to employees tab to prevent showing stale data on other tabs
      
      console.log('🧹 State cleared, loading fresh data for year:', selectedYear);
      // Small delay to ensure state is cleared before loading
      setTimeout(() => {
        loadData(selectedYear || businessYearId);
      }, 100);
    }
  }, [businessId, selectedYear]);

  // Removed the problematic useEffect that was causing infinite loops
  // QRE recalculation should only happen when explicitly triggered, not automatically

  const handleQuickAddContractor = async (contractorData: QuickContractorEntry) => {
    try {
      console.log('🔄 EmployeeSetupStep - handleQuickAddContractor started with:', contractorData);
      
      // Extract numeric value from formatted amount string
      const numericAmount = contractorData.amount.replace(/[^0-9]/g, '');
      const amount = numericAmount ? parseFloat(numericAmount) : 0;
      
      console.log('💰 EmployeeSetupStep - Parsed amount:', { original: contractorData.amount, numeric: numericAmount, amount });
      
      // Get role baseline percentage
      const selectedRole = roles.find(role => role.id === contractorData.role_id);
      const baselinePercent = selectedRole?.baseline_applied_percent || 0;
      const calculatedQRE = Math.round((amount * 0.65 * baselinePercent) / 100); // 65% reduction for contractors
      
      console.log('📊 EmployeeSetupStep - Contractor QRE calculation:', {
        amount,
        baselinePercent,
        calculatedQRE,
        roleName: selectedRole?.name
      });
      
      // Step 1: Create contractor
      console.log('👤 EmployeeSetupStep - Creating contractor in rd_contractors table');
      const { data: newContractor, error: contractorError } = await supabase
        .from('rd_contractors')
        .insert({
          business_id: businessId,
          name: `${contractorData.first_name} ${contractorData.last_name}`.trim(),
          first_name: contractorData.first_name,
          last_name: contractorData.last_name,
          amount: amount,
          annual_cost: amount,
          is_owner: contractorData.is_owner,
          role_id: contractorData.role_id
          // Remove user_id as it's not in the rd_contractors table schema
        })
        .select()
        .single();

      if (contractorError) {
        console.error('❌ EmployeeSetupStep - Error creating contractor:', contractorError);
        throw contractorError;
      }

      console.log('✅ EmployeeSetupStep - Contractor created successfully:', newContractor);

      // Step 2: Initialize contractor subcomponent data
      console.log('📅 EmployeeSetupStep - Initializing contractor subcomponent data');
      await ContractorManagementService.initializeContractorSubcomponentData({
        contractorId: newContractor.id,
        roleId: contractorData.role_id,
        businessYearId: selectedYear || businessYearId
      });

      console.log('✅ EmployeeSetupStep - Contractor subcomponent data initialized');

      // Step 3: Create contractor year data with baseline QRE
      await supabase
        .from('rd_contractor_year_data')
        .insert({
          business_year_id: selectedYear || businessYearId,
          name: `${contractorData.first_name} ${contractorData.last_name}`.trim(),
          cost_amount: amount,
          applied_percent: baselinePercent,
          calculated_qre: calculatedQRE,
          activity_roles: JSON.stringify([contractorData.role_id]),
          contractor_id: newContractor.id,
          activity_link: {} // Required non-null field
        });

      // Step 4: Reload data to show new contractor
      await loadData();
      
      console.log('✅ EmployeeSetupStep - handleQuickAddContractor completed successfully');
    } catch (error) {
      console.error('❌ EmployeeSetupStep - Error in handleQuickAddContractor:', error);
    }
  };

  // Get or create default role for business
  const getOrCreateDefaultRole = async (businessId: string, targetBusinessYearId?: string) => {
    try {
      // Use provided targetBusinessYearId or fall back to the component prop
      const yearId = targetBusinessYearId || businessYearId;
      
      if (!yearId) {
        throw new Error('No business year ID available for default role creation');
      }
      
      // PRIORITY 1: Look for any existing "Research Leader" role in this business year (regardless of is_default)
      const { data: existingResearchLeader, error: findRLError } = await supabase
        .from('rd_roles')
        .select('id, name, baseline_applied_percent, is_default')
        .eq('business_id', businessId)
        .eq('business_year_id', yearId)
        .eq('name', 'Research Leader')
        .single();

      if (existingResearchLeader && !findRLError) {
        console.log('✅ Found existing Research Leader role, reusing:', existingResearchLeader);
        
        // Update it to be the default if it isn't already
        if (!existingResearchLeader.is_default) {
          console.log('🔄 Setting existing Research Leader as default');
          await supabase
            .from('rd_roles')
            .update({ is_default: true })
            .eq('id', existingResearchLeader.id);
        }
        
        // If the existing role doesn't have a baseline percentage, update it
        if (!existingResearchLeader.baseline_applied_percent) {
          console.log('🔄 Adding baseline percentage to existing Research Leader');
          await supabase
            .from('rd_roles')
            .update({ baseline_applied_percent: 25.0 })
            .eq('id', existingResearchLeader.id);
        }
        
        return existingResearchLeader.id;
      }
      
      // PRIORITY 2: Look for any existing default role (any name)
      const { data: existingDefaultRole, error: findError } = await supabase
        .from('rd_roles')
        .select('id, name, baseline_applied_percent')
        .eq('business_id', businessId)
        .eq('business_year_id', yearId)
        .eq('is_default', true)
        .single();

      if (existingDefaultRole && !findError) {
        console.log('✅ Found existing default role (non-Research Leader), reusing:', existingDefaultRole);
        
        // If the existing default role doesn't have a baseline percentage, update it
        if (!existingDefaultRole.baseline_applied_percent) {
          console.log('🔄 Updating existing default role with baseline percentage');
          await supabase
            .from('rd_roles')
            .update({ baseline_applied_percent: 25.0 }) // Default 25% for Research Leader
            .eq('id', existingDefaultRole.id);
        }
        
        return existingDefaultRole.id;
      }

      // PRIORITY 3: Create new Research Leader role only if none exists
      console.log('🔄 No existing Research Leader found, creating new one for business year:', businessId, yearId);
      const { data: newDefaultRole, error: createError } = await supabase
        .from('rd_roles')
        .insert({
          business_id: businessId,
          business_year_id: yearId,
          name: 'Research Leader',
          is_default: true,
          baseline_applied_percent: 25.0 // Default 25% for Research Leader
        })
        .select('id, name')
        .single();

      if (createError) {
        console.error('❌ Error creating default role:', createError);
        throw createError;
      }

      console.log('✅ Created new Research Leader role:', newDefaultRole);
      return newDefaultRole.id;
    } catch (error) {
      console.error('❌ Error in getOrCreateDefaultRole:', error);
      throw error;
    }
  };

  const handleQuickAddEmployee = async (employeeData: QuickEmployeeEntry) => {
    try {
      console.log('🔄 EmployeeSetupStep - handleQuickAddEmployee started with:', employeeData);
      
      // Extract numeric value from formatted wage string (allow decimals)
      const numericWage = employeeData.wage.replace(/[^0-9.]/g, '');
      const annualWage = numericWage ? parseFloat(numericWage) : 0;
      
      console.log('💰 EmployeeSetupStep - Parsed wage:', { original: employeeData.wage, numeric: numericWage, annualWage });
      
      // Get role baseline percentage
      let roleId = employeeData.role_id;
      let roleName = undefined;
      let baselinePercent = 0;

      // If no role is specified, get or create a default role
      if (!roleId || roleId === '') {
        console.log('🔄 No role specified, getting default role for business:', businessId);
        roleId = await getOrCreateDefaultRole(businessId, businessYearId);
        roleName = 'Research Leader'; // Default role name
      } else {
        // Get role details for baseline percentage
        const { data: roleData, error: roleError } = await supabase
          .from('rd_roles')
          .select('name, baseline_applied_percent')
          .eq('id', roleId)
          .single();

        if (roleData && !roleError) {
          roleName = roleData.name;
          baselinePercent = roleData.baseline_applied_percent || 0;
        }
      }

      console.log('📊 EmployeeSetupStep - QRE calculation:', { annualWage, baselinePercent, calculatedQRE: 0, roleName });

      // Create employee record
      console.log('👤 EmployeeSetupStep - Creating employee in rd_employees table');
      const { data: newEmployee, error: employeeError } = await supabase
        .from('rd_employees')
        .insert({
          business_id: businessId,
          first_name: employeeData.first_name,
          last_name: employeeData.last_name,
          role_id: roleId, // Now we always have a valid role_id
          is_owner: employeeData.is_owner || false,
          annual_wage: annualWage
        })
        .select('*')
        .single();

      if (employeeError) {
        console.error('❌ EmployeeSetupStep - Error creating employee:', employeeError);
        throw employeeError;
      }

      console.log('✅ EmployeeSetupStep - Employee created successfully:', newEmployee);

      // Create employee year data for the selected year
      if (businessYearId) {
        console.log('📅 EmployeeSetupStep - Creating employee year data for year:', businessYearId);
        
        // Calculate initial QRE: (Annual Wage × Applied Percentage) / 100
        const calculatedQRE = Math.round((annualWage * baselinePercent) / 100);
        
        const { error: yearDataError } = await supabase
          .from('rd_employee_year_data')
          .insert({
            employee_id: newEmployee.id,
            business_year_id: businessYearId,
            applied_percent: baselinePercent,
            calculated_qre: calculatedQRE,
            activity_roles: [roleId]
          });

        if (yearDataError) {
          console.error('❌ EmployeeSetupStep - Error creating employee year data:', yearDataError);
          // Don't throw here, as the employee was created successfully
        }
      }

      // Get selected activities for this business year to create subcomponent relationships
      if (businessYearId && roleId) {
        const { data: selectedActivities, error: activitiesError } = await supabase
          .from('rd_selected_activities')
          .select('activity_id, practice_percent, selected_roles')
          .eq('business_year_id', businessYearId)
          .filter('selected_roles', 'cs', `["${roleId as string}"]`);

        if (selectedActivities && selectedActivities.length > 0) {
          console.log('🔗 EmployeeSetupStep - Creating subcomponent relationships for', selectedActivities.length, 'activities');
          
          for (const activity of selectedActivities) {
            // Get subcomponents for this activity that are assigned to this role
            const { data: subcomponents, error: subcomponentsError } = await supabase
              .from('rd_selected_subcomponents')
              .select('subcomponent_id')
              .eq('research_activity_id', activity.activity_id)
              .eq('business_year_id', businessYearId)
              .filter('selected_roles', 'cs', `["${roleId}"]`);

            if (subcomponents && !subcomponentsError) {
              console.log(`✅ Found ${subcomponents.length} subcomponents for activity ${activity.activity_id} assigned to role ${roleId}`);
              
              for (const subcomponent of subcomponents) {
                // Get ALL subcomponent details from rd_selected_subcomponents (the source of truth)
                const { data: selectedSubcomponent, error: subDetailsError } = await supabase
                  .from('rd_selected_subcomponents')
                  .select('year_percentage, frequency_percentage, time_percentage, practice_percent, step_id')
                  .eq('subcomponent_id', subcomponent.subcomponent_id)
                  .eq('business_year_id', businessYearId)
                  .single();

                if (subDetailsError) {
                  console.error('❌ Error fetching selected subcomponent details:', subDetailsError);
                }

                // Use data from rd_selected_subcomponents (the source of truth)
                let stepTimePercentage = selectedSubcomponent?.time_percentage || 0;
                let baselinePracticePercentage = selectedSubcomponent?.practice_percent || activity.practice_percent || 0;
                let yearPercentage = selectedSubcomponent?.year_percentage || 100;
                let frequencyPercentage = selectedSubcomponent?.frequency_percentage || 100;
                
                // Apply actualization variations if enabled
                if (employeeData.use_actualization) {
                  stepTimePercentage = applyActualizationVariations(stepTimePercentage);
                  baselinePracticePercentage = applyActualizationVariations(baselinePracticePercentage);
                  yearPercentage = applyActualizationVariations(yearPercentage);
                  frequencyPercentage = applyActualizationVariations(frequencyPercentage);
                  
                  console.log('🎲 Applied actualization variations:', {
                    subcomponent: subcomponent.subcomponent_id,
                    original: {
                      time: selectedSubcomponent?.time_percentage || 0,
                      practice: selectedSubcomponent?.practice_percent || activity.practice_percent || 0,
                      year: selectedSubcomponent?.year_percentage || 100,
                      frequency: selectedSubcomponent?.frequency_percentage || 100
                    },
                    actualized: {
                      time: stepTimePercentage,
                      practice: baselinePracticePercentage,
                      year: yearPercentage,
                      frequency: frequencyPercentage
                    }
                  });
                }
                
                // Calculate applied percentage: Practice% × Year% × Frequency% × Time%
                const baselineAppliedPercentage = (baselinePracticePercentage / 100) * 
                                               (yearPercentage / 100) * 
                                               (frequencyPercentage / 100) * 
                                               (stepTimePercentage / 100) * 100;

                const { error: subcomponentError } = await supabase
                  .from('rd_employee_subcomponents')
                  .insert({
                    employee_id: newEmployee.id,
                    subcomponent_id: subcomponent.subcomponent_id,
                    business_year_id: businessYearId,
                    time_percentage: stepTimePercentage,
                    applied_percentage: baselineAppliedPercentage,
                    practice_percentage: baselinePracticePercentage,
                    year_percentage: yearPercentage,
                    frequency_percentage: frequencyPercentage,
                    is_included: true,
                    baseline_applied_percent: baselineAppliedPercentage,
                    baseline_time_percentage: stepTimePercentage,
                    baseline_practice_percentage: baselinePracticePercentage
                  });

                if (subcomponentError) {
                  console.error('❌ EmployeeSetupStep - Error creating subcomponent relationship:', subcomponentError);
                } else {
                  console.log('✅ EmployeeSetupStep - Created subcomponent relationship with baseline values:', {
                    subcomponent: subcomponent.subcomponent_id,
                    timePercentage: stepTimePercentage,
                    appliedPercentage: baselineAppliedPercentage,
                    practicePercentage: baselinePracticePercentage
                  });
                }
              }
            }
          }
        } else {
          console.log('⚠️ EmployeeSetupStep - No activities found for role, employee may not appear in allocation modals');
          console.log('🔍 Role ID:', roleId, 'Business Year:', businessYearId);
          // TODO: Consider creating a placeholder subcomponent record or modifying allocation modal query
        }
      }

      // ✅ ALLOCATION MODAL SYNC FIX: Ensure employee appears in allocation modals
      // ISSUE: Allocation modals query rd_employee_subcomponents, but employees with no role assignments won't have records
      // SOLUTION: Check if employee has any subcomponent records, if not, they won't appear in allocation modals
      const { data: existingSubcomponents, error: checkError } = await supabase
        .from('rd_employee_subcomponents')
        .select('id')
        .eq('employee_id', newEmployee.id)
        .eq('business_year_id', businessYearId)
        .limit(1);

      if (!checkError && (!existingSubcomponents || existingSubcomponents.length === 0)) {
        console.log('⚠️ ALLOCATION MODAL DISCREPANCY DETECTED:');
        console.log(`   └─ Employee ${employeeData.first_name} ${employeeData.last_name} has no rd_employee_subcomponents records`);
        console.log(`   └─ They will appear in main roster but NOT in allocation modals`);
        console.log(`   └─ This happens when role is not assigned to any activities/subcomponents`);
        console.log(`   └─ Consider assigning role to activities or modify allocation modal query`);
      }

      // ✅ ROSTER-MODAL SYNC: Use IDENTICAL allocation modal methodology for new employee
      console.log('🔄 [ROSTER-MODAL SYNC] Calculating QRE for new employee using IDENTICAL modal methodology');
      
      // Calculate applied percentage using IDENTICAL method as allocation modal
      const modalAppliedPercentage = await calculateEmployeeAppliedPercentage(newEmployee.id);
      const finalAppliedPercentage = modalAppliedPercentage > 0 ? modalAppliedPercentage : 0; // No baseline fallback
      
      // Apply 80% threshold rule for QRE calculation
      const qreAppliedPercentage = applyEightyPercentThreshold(finalAppliedPercentage);
      const calculatedQRE = Math.round((annualWage * qreAppliedPercentage) / 100);
      
      console.log('✅ [ROSTER-MODAL SYNC] New employee QRE calculation:', {
        employeeName: `${employeeData.first_name} ${employeeData.last_name}`,
        annualWage,
        modalAppliedPercentage: finalAppliedPercentage, // IDENTICAL to modal calculation  
        qreAppliedPercentage,   // Applied% with 80% threshold
        calculatedQRE,          // Final QRE using modal Applied%
        note: 'Uses IDENTICAL Applied% calculation as allocation modal',
        actualizationEnabled: employeeData.use_actualization
      });
      
      // Update rd_employee_year_data with UNIFIED calculations
      const { error: yearDataError } = await supabase
        .from('rd_employee_year_data')
        .update({
          calculated_qre: calculatedQRE,
          applied_percent: finalAppliedPercentage // Use the same percentage shown in Applied% column
        })
        .eq('employee_id', newEmployee.id)
        .eq('business_year_id', businessYearId);

      if (yearDataError) {
        console.error('❌ EmployeeSetupStep - Error updating employee year data:', yearDataError);
      }

      // Refresh employee data
      await loadData();
      toast.success(`Employee ${employeeData.first_name} ${employeeData.last_name} added successfully!`);
      
    } catch (error) {
      console.error('❌ EmployeeSetupStep - Error in handleQuickAddEmployee:', error);
      toast.error(`Failed to add employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditEmployee = (employee: EmployeeWithExpenses) => {
    console.log('🎯 OPENING ALLOCATION MODAL for employee:', employee.first_name, employee.last_name, employee.id);
    console.log('🎯 Employee object being selected:', employee);
    console.log('🎯 Current applied_percentage:', employee.applied_percentage);
    
    // Clear any previous selection first
    setSelectedEmployee(null);
    setShowEmployeeDetailModal(false);
    
    // Small delay to ensure state is cleared, then set new employee
    setTimeout(() => {
      console.log('🎯 Setting new employee after state clear...');
      setSelectedEmployee(employee);
      setShowEmployeeDetailModal(true);
    }, 50);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    console.log('🗑️ EmployeeSetupStep - handleDeleteEmployee called for employeeId:', employeeId);
    
    if (!confirm('Are you sure you want to delete this employee?')) {
      console.log('❌ EmployeeSetupStep - User cancelled employee deletion');
      return;
    }

    try {
      console.log('🗑️ EmployeeSetupStep - Deleting employee from database');
      const { error } = await supabase
        .from('rd_employees')
        .delete()
        .eq('id', employeeId);

      if (error) {
        console.error('❌ EmployeeSetupStep - Error deleting employee:', error);
      } else {
        console.log('✅ EmployeeSetupStep - Employee deleted successfully');
        await loadData();
      }
    } catch (error) {
      console.error('❌ EmployeeSetupStep - Error in handleDeleteEmployee:', error);
    }
  };

  const handleDeleteContractor = async (contractorId: string) => {
    console.log('🗑️ EmployeeSetupStep - handleDeleteContractor called for contractorId:', contractorId);
    
    if (!confirm('Are you sure you want to delete this contractor?')) {
      console.log('❌ EmployeeSetupStep - User cancelled contractor deletion');
      return;
    }

    try {
      console.log('🗑️ EmployeeSetupStep - Deleting contractor from database');
      await ContractorManagementService.deleteContractor(contractorId);
      console.log('✅ EmployeeSetupStep - Contractor deleted successfully');
      await loadData();
    } catch (error) {
      console.error('❌ EmployeeSetupStep - Error in handleDeleteContractor:', error);
    }
  };

  const handleEditContractor = (contractor: ContractorWithExpenses) => {
    setSelectedContractor(contractor);
    setShowContractorDetailModal(true);
  };

  const handleExportCSV = async () => {
    try {
      console.log('📊 EmployeeSetupStep - handleExportCSV called for selectedYear:', selectedYear);
      const csvData = await ExpenseManagementService.exportExpensesToCSV(selectedYear);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rd_expenses_${new Date().getFullYear()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      console.log('✅ EmployeeSetupStep - CSV export completed');
    } catch (error) {
      console.error('❌ EmployeeSetupStep - Error in handleExportCSV:', error);
    }
  };




  // THROTTLED: Only log render state occasionally to reduce log spam
  const logRenderState = React.useRef<NodeJS.Timeout>();
  React.useEffect(() => {
    if (logRenderState.current) clearTimeout(logRenderState.current);
    logRenderState.current = setTimeout(() => {
      console.log('📊 EmployeeSetupStep - Render state:', {
        loading,
        employeesWithDataLength: employeesWithData.length,
        rolesLength: roles.length,
        selectedYear,
        businessId,
        showEmployeeDetailModal,
        selectedEmployee: selectedEmployee?.id
      });
    }, 2000);
  }, [loading, employeesWithData.length, roles.length, selectedYear, businessId, showEmployeeDetailModal, selectedEmployee?.id]);

  // Function to recalculate QRE for all employees
  const recalculateAllQRE = async () => {
    console.log('🔄 EmployeeSetupStep - Recalculating QRE for all employees');
    
    try {
      const updatedEmployees: any[] = [];
      
      for (const employee of employeesWithData) {
        const role = employee.role;
        const baselinePercent = role?.baseline_applied_percent || 0;
        const annualWage = employee.annual_wage || 0;
        
        // ✅ ROSTER-MODAL SYNC: Use IDENTICAL allocation modal calculation for QRE recalculation
        const modalAppliedPercentage = await calculateEmployeeAppliedPercentage(employee.id);
        const actualAppliedPercentage = modalAppliedPercentage > 0 ? modalAppliedPercentage : 0; // No baseline fallback
        
        console.log(`✅ [ROSTER-MODAL SYNC] Employee ${employee.first_name} ${employee.last_name} Applied%:`, {
          modalAppliedPercentage: actualAppliedPercentage,
          note: 'IDENTICAL to modal calculation'
        });
        
        // Apply 80% threshold rule and calculate QRE
        const qreAppliedPercentage = applyEightyPercentThreshold(actualAppliedPercentage);
        const calculatedQRE = Math.round((annualWage * qreAppliedPercentage) / 100);
        
        // Update employee year data with new QRE
        const { error } = await supabase
          .from('rd_employee_year_data')
          .update({
            calculated_qre: calculatedQRE,
            applied_percent: actualAppliedPercentage
          })
          .eq('employee_id', employee.id)
          .eq('business_year_id', selectedYear);
        
        if (error) {
          console.error('❌ EmployeeSetupStep - Error updating QRE for employee:', employee.id, error);
        } else {
          console.log('✅ EmployeeSetupStep - Updated QRE for employee:', employee.id, calculatedQRE);
          // Update local state instead of reloading
          updatedEmployees.push({
            ...employee,
            calculated_qre: calculatedQRE,
            baseline_applied_percent: baselinePercent,
            applied_percentage: actualAppliedPercentage
          });
        }
      }
      
      // Update local state directly to avoid infinite loop
      if (updatedEmployees.length > 0) {
        setEmployeesWithData(prev => 
          prev.map(emp => {
            const updated = updatedEmployees.find(u => u.id === emp.id);
            return updated || emp;
          })
        );
      }

      // Recalculate QRE for all contractors (65% reduction)
      console.log('🔄 EmployeeSetupStep - Recalculating QRE for all contractors');
      await ContractorManagementService.recalculateAllContractorQRE(selectedYear);
      
      // Reload contractors to show updated QRE values
      const updatedContractors = await ContractorManagementService.getContractors(selectedYear);
      setContractorsWithData(updatedContractors);
    } catch (error) {
      console.error('❌ EmployeeSetupStep - Error recalculating QRE:', error);
    }
  };

  // Function to update employee wage and recalculate QRE
  const updateEmployeeWage = async (employeeId: string, newWage: number) => {
    console.log('💰 EmployeeSetupStep - Updating wage for employee:', employeeId, 'new wage:', newWage);
    
    try {
      // Update employee wage
      const { error: employeeError } = await supabase
        .from('rd_employees')
        .update({ annual_wage: newWage })
        .eq('id', employeeId);
      
      if (employeeError) {
        console.error('❌ EmployeeSetupStep - Error updating employee wage:', employeeError);
        return;
      }
      
      // Get employee role and actual applied percentage
      const employee = employeesWithData.find(emp => emp.id === employeeId);
      const role = employee?.role;
      const baselinePercent = role?.baseline_applied_percent || 0;
      
      // ✅ ROSTER-MODAL SYNC: Use IDENTICAL allocation modal calculation for wage updates
      console.log('🔄 [ROSTER-MODAL SYNC] Calculating Applied% for wage update using IDENTICAL modal methodology');
      
      // Calculate applied percentage using IDENTICAL method as allocation modal
      const modalAppliedPercentage = await calculateEmployeeAppliedPercentage(employeeId);
      const actualAppliedPercentage = modalAppliedPercentage > 0 ? modalAppliedPercentage : 0; // No baseline fallback
      
      // Apply 80% threshold rule and calculate QRE
      const qreAppliedPercentage = applyEightyPercentThreshold(actualAppliedPercentage);
      const calculatedQRE = Math.round((newWage * qreAppliedPercentage) / 100);
      
      console.log('✅ [ROSTER-MODAL SYNC] Wage update QRE calculation:', {
        employeeId,
        newWage,
        modalAppliedPercentage: actualAppliedPercentage, // IDENTICAL to modal calculation
        qreAppliedPercentageWith80Threshold: qreAppliedPercentage,
        calculatedQRE,
        note: 'Uses IDENTICAL Applied% calculation as allocation modal'
      });
      
      // Update employee year data with new QRE
      const { error: yearDataError } = await supabase
        .from('rd_employee_year_data')
        .update({
          calculated_qre: calculatedQRE,
          applied_percent: actualAppliedPercentage
        })
        .eq('employee_id', employeeId)
        .eq('business_year_id', selectedYear);
      
      if (yearDataError) {
        console.error('❌ EmployeeSetupStep - Error updating employee year data:', yearDataError);
        return;
      }
      
      console.log('✅ EmployeeSetupStep - Updated wage and QRE for employee:', employeeId, calculatedQRE);
      
      // Update local state directly to avoid infinite loop
      setEmployeesWithData(prev => 
        prev.map(emp => 
          emp.id === employeeId 
            ? { ...emp, annual_wage: newWage, calculated_qre: calculatedQRE, baseline_applied_percent: baselinePercent, applied_percentage: actualAppliedPercentage }
            : emp
        )
      );
    } catch (error) {
      console.error('❌ EmployeeSetupStep - Error updating employee wage:', error);
    }
  };

  // Function to update employee role and recalculate QRE
  const updateEmployeeRole = async (employeeId: string, newRoleId: string) => {
    console.log('👥 EmployeeSetupStep - Updating role for employee:', employeeId, 'new role:', newRoleId);
    try {
      // 1. Update the employee's role_id
      const { error: updateError } = await supabase
        .from('rd_employees')
        .update({ role_id: newRoleId })
        .eq('id', employeeId);
      if (updateError) {
        toast.error('Failed to update employee role');
        return;
      }

      // 1b. Update activity_roles in rd_employee_year_data for this employee/year
      if (businessYearId) {
        // Get the new role's baseline percentage
        const { data: roleData, error: roleError } = await supabase
          .from('rd_roles')
          .select('baseline_applied_percent')
          .eq('id', newRoleId)
          .single();

        const baselinePercent = roleData?.baseline_applied_percent || 0;
        console.log(`💰 Role baseline percentage for ${newRoleId}:`, baselinePercent);

        // Get employee's wage for QRE calculation
        const { data: employeeData, error: empError } = await supabase
          .from('rd_employees')
          .select('annual_wage')
          .eq('id', employeeId)
          .single();

        const annualWage = employeeData?.annual_wage || 0;
        const calculatedQRE = Math.round((annualWage * baselinePercent) / 100);
        
        console.log(`📊 Updating employee year data: baselinePercent=${baselinePercent}%, QRE=${calculatedQRE}`);

        await supabase
          .from('rd_employee_year_data')
          .update({ 
            activity_roles: [newRoleId],
            applied_percent: baselinePercent,
            calculated_qre: calculatedQRE
          })
          .eq('employee_id', employeeId)
          .eq('business_year_id', businessYearId);
      }

      // 2. Remove old subcomponent links for this employee/year
      if (businessYearId) {
        await supabase
          .from('rd_employee_subcomponents')
          .delete()
          .eq('employee_id', employeeId)
          .eq('business_year_id', businessYearId);
      }

      // 3. Add new subcomponent links for the new role (using the selected year's activities/subcomponents)
      if (businessYearId && newRoleId) {
        // Fetch all selected subcomponents for this business year and role
        const { data: selectedSubcomponents, error: subcomponentsError } = await supabase
          .from('rd_selected_subcomponents')
          .select('*')
          .eq('business_year_id', businessYearId)
          .filter('selected_roles', 'cs', `[\"${String(newRoleId || '')}\"]`);

        if (subcomponentsError) {
          console.error('❌ Error fetching selected subcomponents:', subcomponentsError);
        }

        if (selectedSubcomponents && selectedSubcomponents.length > 0) {
          console.log('🔍 Debug - Raw selectedSubcomponents data:', selectedSubcomponents);
          console.log('🔍 Debug - First subcomponent keys:', Object.keys(selectedSubcomponents[0]));

          // Create employee subcomponent relationships with baseline values
          const employeeSubcomponentData = selectedSubcomponents.map((subcomponent: any) => {
            const subData = {
              employee_id: employeeId,
              subcomponent_id: subcomponent.subcomponent_id,
              business_year_id: businessYearId,
              time_percentage: subcomponent.time_percentage || 0,
              applied_percentage: subcomponent.applied_percentage || 0,
              is_included: true,
              baseline_applied_percent: subcomponent.applied_percentage || 0,
              practice_percentage: subcomponent.practice_percent || 0,
              year_percentage: subcomponent.year_percentage || 0,
              frequency_percentage: subcomponent.frequency_percentage || 0,
              baseline_practice_percentage: subcomponent.practice_percent || 0,
              baseline_time_percentage: subcomponent.time_percentage || 0,
              user_id: userId
            };
            
            console.log(`🔗 Creating subcomponent relationship:`, {
              subcomponent_id: subData.subcomponent_id,
              applied_percentage: subData.applied_percentage,
              baseline_applied_percent: subData.baseline_applied_percent,
              time_percentage: subData.time_percentage,
              practice_percentage: subData.practice_percentage
            });
            
            return subData;
          });

          console.log('🔍 Debug - Employee subcomponent data to insert:', employeeSubcomponentData);

          const { data: insertedSubcomponents, error: insertError } = await supabase
            .from('rd_employee_subcomponents')
            .insert(employeeSubcomponentData)
            .select();

          if (insertError) {
            console.error('❌ Error inserting employee subcomponents:', insertError);
          } else {
            console.log('✅ Successfully inserted employee subcomponents:', insertedSubcomponents);
          }
        } else {
          console.warn(`⚠️ No selected subcomponents found for role ${newRoleId} and year ${businessYearId}`);
        }
      }

      toast.success('Role updated, activity_roles and subcomponents refreshed!');
      await loadData();
    } catch (err) {
      toast.error('Error updating role, activity_roles, or subcomponents');
    }
  };

  const updateContractorRole = async (contractorId: string, newRoleId: string) => {
    console.log('👷 EmployeeSetupStep - Updating role for contractor:', contractorId, 'new role:', newRoleId);
    try {
      // 1. Update the contractor's role_id
      const { error: updateError } = await supabase
        .from('rd_contractors')
        .update({ role_id: newRoleId })
        .eq('id', contractorId);
      if (updateError) {
        toast.error('Failed to update contractor role');
        return;
      }

      // 1b. Update activity_roles in rd_contractor_year_data for this contractor/year
      if (businessYearId) {
        // Get the new role's baseline percentage
        const { data: roleData, error: roleError } = await supabase
          .from('rd_roles')
          .select('baseline_applied_percent')
          .eq('id', newRoleId)
          .single();

        const baselinePercent = roleData?.baseline_applied_percent || 0;

        await supabase
          .from('rd_contractor_year_data')
          .update({ 
            activity_roles: [newRoleId]
          })
          .eq('contractor_id', contractorId)
          .eq('business_year_id', businessYearId);
      }

      // 2. Remove old subcomponent links for this contractor/year
      if (businessYearId) {
        await supabase
          .from('rd_contractor_subcomponents')
          .delete()
          .eq('contractor_id', contractorId)
          .eq('business_year_id', businessYearId);
      }

      // 3. Add new subcomponent links for the new role (using the selected year's activities/subcomponents)
      if (businessYearId && newRoleId) {
        // Fetch all selected subcomponents for this business year and role
        const { data: selectedSubcomponents, error: subcomponentsError } = await supabase
          .from('rd_selected_subcomponents')
          .select('*')
          .eq('business_year_id', businessYearId)
          .filter('selected_roles', 'cs', `[\"${String(newRoleId || '')}\"]`);

        if (subcomponentsError) {
          console.error('❌ Error fetching selected subcomponents:', subcomponentsError);
        }

        if (selectedSubcomponents && selectedSubcomponents.length > 0) {
          console.log('🔍 Debug - Raw selectedSubcomponents data for contractor:', selectedSubcomponents);
          console.log('🔍 Debug - First subcomponent keys:', Object.keys(selectedSubcomponents[0]));

          // Create contractor subcomponent relationships with baseline values
          const contractorSubcomponentData = selectedSubcomponents.map((subcomponent: any) => ({
            contractor_id: contractorId,
            subcomponent_id: subcomponent.subcomponent_id,
            business_year_id: businessYearId,
            time_percentage: subcomponent.time_percentage || 0,
            applied_percentage: subcomponent.applied_percentage || 0,
            is_included: true,
            baseline_applied_percent: subcomponent.applied_percentage || 0,
            practice_percentage: subcomponent.practice_percent || 0,
            year_percentage: subcomponent.year_percentage || 0,
            frequency_percentage: subcomponent.frequency_percentage || 0,
            baseline_practice_percentage: subcomponent.practice_percent || 0,
            baseline_time_percentage: subcomponent.time_percentage || 0,
            user_id: userId
          }));

          console.log('🔍 Debug - Contractor subcomponent data to insert:', contractorSubcomponentData);

          const { data: insertedSubcomponents, error: insertError } = await supabase
            .from('rd_contractor_subcomponents')
            .insert(contractorSubcomponentData)
            .select();

          if (insertError) {
            console.error('❌ Error inserting contractor subcomponents:', insertError);
          } else {
            console.log('✅ Successfully inserted contractor subcomponents:', insertedSubcomponents);
          }
        } else {
          console.warn(`⚠️ No selected subcomponents found for contractor role ${newRoleId} and year ${businessYearId}`);
        }
      }

      toast.success('Contractor role updated, activity_roles and subcomponents refreshed!');
      await loadData();
    } catch (err) {
      toast.error('Error updating contractor role, activity_roles, or subcomponents');
    }
  };

  // Sorting logic
  const sortedEmployees = [...employeesWithData].sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';
    switch (sortBy) {
      case 'first_name':
        valA = (a.first_name ?? '').toLowerCase();
        valB = (b.first_name ?? '').toLowerCase();
        break;
      case 'last_name':
        valA = (a.last_name ?? '').toLowerCase();
        valB = (b.last_name ?? '').toLowerCase();
        break;
      case 'calculated_qre':
        valA = a.calculated_qre ?? 0;
        valB = b.calculated_qre ?? 0;
        break;
      case 'applied_percentage':
        valA = a.applied_percentage ?? 0;
        valB = b.applied_percentage ?? 0;
        break;
      default:
        valA = (a.last_name ?? '').toLowerCase();
        valB = (b.last_name ?? '').toLowerCase();
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  const sortedContractors = [...contractorsWithData].sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';
    switch (sortBy) {
      case 'first_name':
        valA = (a.first_name ?? '').toLowerCase();
        valB = (b.first_name ?? '').toLowerCase();
        break;
      case 'last_name':
        valA = (a.last_name ?? '').toLowerCase();
        valB = (b.last_name ?? '').toLowerCase();
        break;
      case 'calculated_qre':
        valA = a.calculated_qre ?? 0;
        valB = b.calculated_qre ?? 0;
        break;
      case 'applied_percentage':
        valA = a.applied_percentage ?? 0;
        valB = b.applied_percentage ?? 0;
        break;
      default:
        valA = (a.last_name ?? '').toLowerCase();
        valB = (b.last_name ?? '').toLowerCase();
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Helper function to create business year with user confirmation
  const createBusinessYearWithConfirmation = async (yearNumber: number, businessId: string) => {
    console.log(`📅 Creating new business year for ${yearNumber}`);
    
    // Inform user that business year will be created
    const confirmMessage = `Business year ${yearNumber} doesn't exist yet. This will create a new business year for ${yearNumber}.\n\nNote: You'll need to set up research activities for this year separately in the Research Explorer step.\n\nContinue?`;
    
    if (!confirm(confirmMessage)) {
      throw new Error(`User cancelled business year creation for ${yearNumber}`);
    }
    
    try {
      const { data: newBusinessYear, error: yearError } = await supabase
        .from('rd_business_years')
        .insert({
          business_id: businessId,
          year: yearNumber,
          gross_receipts: 0, // Default value
          total_qre: 0
        })
        .select()
        .single();
      
      if (yearError) {
        console.error('❌ Error creating business year:', yearError);
        throw new Error(`Failed to create business year ${yearNumber}: ${yearError.message}`);
      } else {
        console.log(`✅ Created new business year ${yearNumber} with ID: ${newBusinessYear.id}`);
        
        // Add to available years for UI updates
        setAvailableYears(prev => [...prev, { id: newBusinessYear.id, year: yearNumber }].sort((a, b) => b.year - a.year));
        
        return newBusinessYear.id;
      }
    } catch (error) {
      console.error('❌ Error in business year creation:', error);
      throw error;
    }
  };

  // CSV Import Handler
  // FIXED: Sync Applied % calculations after CSV import to match modal logic
  const syncAppliedPercentagesAfterCSV = async () => {
    try {
      console.log('🔄 Starting Applied % sync after CSV import...');
      
      // Get all employee year data that was just imported
      const { data: employeeYearData, error } = await supabase
        .from('rd_employee_year_data')
        .select(`
          id,
          employee_id,
          business_year_id,
          applied_percent,
          rd_employees(first_name, last_name)
        `)
        .eq('business_year_id', businessYearId);
      
      if (error) {
        console.error('❌ Error fetching employee year data for sync:', error);
        return;
      }
      
      for (const empYear of employeeYearData || []) {
        // Calculate applied percentage using modal logic
        const { data: subcomponents, error: subError } = await supabase
          .from('rd_employee_subcomponents')
          .select('*')
          .eq('employee_id', empYear.employee_id)
          .eq('business_year_id', empYear.business_year_id);
        
        if (subError) {
          console.error('❌ Error fetching subcomponents for sync:', subError);
          continue;
        }
        
        // Calculate total applied percentage using modal formula: Practice% × Year% × Frequency% × Time%
        let totalAppliedPercentage = 0;
        
        for (const sub of subcomponents || []) {
          if (sub.is_included) {
            const appliedPercentage = (sub.practice_percentage / 100) * 
                                   (sub.year_percentage / 100) * 
                                   (sub.frequency_percentage / 100) * 
                                   (sub.time_percentage / 100) * 100;
            totalAppliedPercentage += appliedPercentage;
          }
        }
        
        // Update rd_employee_year_data with synced applied percentage
        const { error: updateError } = await supabase
          .from('rd_employee_year_data')
          .update({ applied_percent: totalAppliedPercentage })
          .eq('id', empYear.id);
        
        if (updateError) {
          console.error('❌ Error updating applied percentage for sync:', updateError);
        } else {
          const employee = Array.isArray(empYear.rd_employees) ? empYear.rd_employees[0] : empYear.rd_employees;
          console.log(`✅ Synced Applied % for ${employee?.first_name} ${employee?.last_name}: ${totalAppliedPercentage.toFixed(2)}%`);
        }
      }
      
      console.log('✅ Applied % sync complete!');
    } catch (error) {
      console.error('❌ Error in Applied % sync:', error);
    }
  };

  const handleCSVImport = async (file: File) => {
    setCsvImporting(true);
    setCsvError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<Record<string, string>>) => {
        const rows: Record<string, string>[] = results.data;
        let successCount = 0;
        let errorCount = 0;
        let invalidYearCount = 0;
        let rolesAssignedCount = 0;
        let detailedErrors: Array<{employee: string, error: string, row: number}> = [];
        
        // FIXED: Global actualization cache to ensure same actualized values across all employees/years
        const globalActualizationCache: { [key: string]: any } = {};
        
        console.log('🔍 CSV Import - Processing', rows.length, 'rows');
        console.log('📋 CSV Headers detected:', results.meta.fields);
        
        // Add progress tracking and throttling variables
        let processedCount = 0;
        let lastProgressUpdate = Date.now();
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          processedCount++;
          const firstName = row['First Name'] || row['first_name'] || row['firstName'];
          const lastName = row['Last Name'] || row['last_name'] || row['lastName'];
          const wage = row['Wage'] || row['wage'] || '';
          const year = row['Year'] || row['year'] || '';
          const roleName = row['Role'] || row['role'] || ''; // Optional, processed at the end
          
          console.log('👤 Processing employee:', firstName, lastName, 'Year:', year, 'Wage:', wage);
          
          // Validate required fields: First Name, Last Name, Wage, Year
          if (!firstName || !lastName || !wage || !year) {
            console.warn('⚠️ Skipping row with missing required fields:', {
              firstName: !!firstName,
              lastName: !!lastName, 
              wage: !!wage,
              year: !!year,
              row
            });
            errorCount++;
            continue;
          }
          
          // Parse and validate the year from CSV
          const yearNumber = parseInt(year.trim());
          if (isNaN(yearNumber) || yearNumber < 1900 || yearNumber > 2100) {
            console.warn(`⚠️ Invalid year "${year}" for employee ${firstName} ${lastName}. Skipping this employee.`);
            invalidYearCount++;
            errorCount++;
            continue;
          }
          
          // Find or create the target business year (NO DEFAULT FALLBACK TO CURRENT YEAR)
          let targetBusinessYearId: string;
          
          // Find existing business year or create new one
          console.log(`🔍 Looking for business year ${yearNumber} in available years:`, availableYears.map(y => `${y.year} (${y.id})`));
          const targetYear = availableYears.find(y => y.year === yearNumber);
          if (targetYear) {
            targetBusinessYearId = targetYear.id;
            console.log(`✅ Found business year ${yearNumber} with ID: ${targetYear.id}`);
          } else {
            // Create a new business year for this year (with user confirmation)
            try {
              targetBusinessYearId = await createBusinessYearWithConfirmation(yearNumber, businessId);
              if (!targetBusinessYearId) {
                console.warn(`⚠️ Failed to get business year ID for ${yearNumber}. Skipping employee ${firstName} ${lastName}.`);
                invalidYearCount++;
                errorCount++;
                continue;
              }
            } catch (error) {
              console.error('❌ Error in business year creation:', error);
              console.warn(`⚠️ Failed to create year ${yearNumber} for employee ${firstName} ${lastName}. ${(error as Error).message || 'Unknown error'}`);
              invalidYearCount++;
              errorCount++;
              continue;
            }
          }
          
          try {
            // Create employee WITHOUT role assignment (as requested)
            console.log(`👤 Creating employee ${firstName} ${lastName} for business year: ${targetBusinessYearId} (Year: ${yearNumber})`);
            
            // Extract numeric value from formatted wage string
            const numericWage = wage.replace(/[^0-9.]/g, '');
            const annualWage = numericWage ? parseFloat(numericWage) : 0;
            
            // Get or create default role (but don't assign it to the employee)
            console.log(`🔧 Getting default role for business: ${businessId}, year: ${targetBusinessYearId}`);
            const defaultRoleId = await getOrCreateDefaultRole(businessId, targetBusinessYearId);
            console.log(`✅ Default role ID: ${defaultRoleId}`);
            
            // Handle optional role assignment ONLY if role is provided and valid
            let assignedRoleId = null;
            if (roleName && roleName.trim() !== '') {
              const foundRole = roles.find(r => r.name && r.name.toLowerCase() === roleName.toLowerCase());
              if (foundRole) {
                assignedRoleId = foundRole.id;
                rolesAssignedCount++;
                console.log(`✅ Assigned role "${roleName}" to ${firstName} ${lastName}`);
              } else {
                console.log(`ℹ️ Role "${roleName}" not found for ${firstName} ${lastName} - creating without role`);
              }
            }
            
            // Create employee record (without role assignment by default)
            console.log(`👤 Inserting employee data:`, {
              business_id: businessId,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              role_id: assignedRoleId,
              is_owner: false,
              annual_wage: annualWage
            });
            
            const { data: newEmployee, error: employeeError } = await supabase
              .from('rd_employees')
              .insert({
                business_id: businessId,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                role_id: assignedRoleId, // Will be null unless specific role was found
                is_owner: false,
                annual_wage: annualWage
              })
              .select('*')
              .single();

            if (employeeError) {
              console.error('❌ Error creating employee:', employeeError);
              console.error('❌ Full error details:', JSON.stringify(employeeError, null, 2));
              throw new Error(`Database error: ${employeeError.message} (Code: ${employeeError.code})`);
            }
            
            console.log(`✅ Employee created with ID: ${newEmployee.id}`);

            // Create employee year data with proper role-based calculations
            let baselinePercent = 0;
            let calculatedQRE = 0;
            
            if (assignedRoleId) {
              // Get the role's baseline percentage for proper QRE calculation
              const { data: roleData, error: roleError } = await supabase
                .from('rd_roles')
                .select('baseline_applied_percent')
                .eq('id', assignedRoleId)
                .single();
              
              if (roleData && !roleError) {
                baselinePercent = roleData.baseline_applied_percent || 0;
                calculatedQRE = Math.round((annualWage * baselinePercent) / 100);
              }
            }
            
            const { error: yearDataError } = await supabase
              .from('rd_employee_year_data')
              .insert({
                employee_id: newEmployee.id,
                business_year_id: targetBusinessYearId,
                applied_percent: baselinePercent,
                calculated_qre: calculatedQRE,
                activity_roles: assignedRoleId ? [assignedRoleId] : []
              });

            if (yearDataError) {
              console.error('❌ Error creating employee year data:', yearDataError);
              // Don't throw here, as the employee was created successfully
            }

            // Create subcomponent relationships if role was assigned during import
            if (assignedRoleId) {
              console.log(`🔗 Creating subcomponent relationships for ${firstName} ${lastName} with role ${roleName}`);
              
              // Fetch all selected subcomponents for this business year and role
              const { data: selectedSubcomponents, error: subcomponentsError } = await supabase
                .from('rd_selected_subcomponents')
                .select('*')
                .eq('business_year_id', targetBusinessYearId)
                .filter('selected_roles', 'cs', `[\"${String(assignedRoleId)}\"]`);

              if (subcomponentsError) {
                console.error('❌ Error fetching selected subcomponents for import:', subcomponentsError);
              } else if (selectedSubcomponents && selectedSubcomponents.length > 0) {
                console.log(`✅ Found ${selectedSubcomponents.length} subcomponents for role ${roleName}`);
                
                // Create employee subcomponent relationships with baseline values
                const employeeSubcomponentData = selectedSubcomponents.map((subcomponent: any) => {
                  let timePercentage = subcomponent.time_percentage || 0;
                  let practicePercentage = subcomponent.practice_percent || 0;
                  let yearPercentage = subcomponent.year_percentage || 0;
                  let frequencyPercentage = subcomponent.frequency_percentage || 0;
                  let appliedPercentage = subcomponent.applied_percentage || 0;

                  // FIXED: Apply actualization variations if enabled - using global cache for consistency
                  if (csvUseActualization) {
                    // Create a unique key for this subcomponent across all years and employees
                    const cacheKey = `${subcomponent.subcomponent_id}_${targetBusinessYearId}`;
                    
                    if (!globalActualizationCache[cacheKey]) {
                      // First time seeing this subcomponent+year combination - calculate actualized values once
                      globalActualizationCache[cacheKey] = {
                        timePercentage: applyActualizationVariations(timePercentage),
                        practicePercentage: applyActualizationVariations(practicePercentage),
                        yearPercentage: applyActualizationVariations(yearPercentage),
                        frequencyPercentage: applyActualizationVariations(frequencyPercentage),
                        original: {
                          time: timePercentage,
                          practice: practicePercentage,
                          year: yearPercentage,
                          frequency: frequencyPercentage,
                          applied: appliedPercentage
                        }
                      };
                      
                      // Calculate applied percentage with actualized values
                      globalActualizationCache[cacheKey].appliedPercentage = (
                        globalActualizationCache[cacheKey].practicePercentage / 100
                      ) * (
                        globalActualizationCache[cacheKey].yearPercentage / 100
                      ) * (
                        globalActualizationCache[cacheKey].frequencyPercentage / 100
                      ) * (
                        globalActualizationCache[cacheKey].timePercentage / 100
                      ) * 100;
                      
                      console.log('🎲 CSV FIRST-TIME actualization for key:', cacheKey, {
                        subcomponent: subcomponent.subcomponent_id,
                        year: targetBusinessYearId,
                        original: globalActualizationCache[cacheKey].original,
                        actualized: {
                          time: globalActualizationCache[cacheKey].timePercentage,
                          practice: globalActualizationCache[cacheKey].practicePercentage,
                          year: globalActualizationCache[cacheKey].yearPercentage,
                          frequency: globalActualizationCache[cacheKey].frequencyPercentage,
                          applied: globalActualizationCache[cacheKey].appliedPercentage
                        }
                      });
                    }
                    
                    // Use cached actualized values for ALL employees with this subcomponent+year
                    timePercentage = globalActualizationCache[cacheKey].timePercentage;
                    practicePercentage = globalActualizationCache[cacheKey].practicePercentage;
                    yearPercentage = globalActualizationCache[cacheKey].yearPercentage;
                    frequencyPercentage = globalActualizationCache[cacheKey].frequencyPercentage;
                    appliedPercentage = globalActualizationCache[cacheKey].appliedPercentage;
                    
                    console.log('🎲 CSV USING CACHED actualization for employee:', firstName, lastName, 'key:', cacheKey);
                  }

                  return {
                    employee_id: newEmployee.id,
                    subcomponent_id: subcomponent.subcomponent_id,
                    business_year_id: targetBusinessYearId,
                    time_percentage: timePercentage,
                    applied_percentage: appliedPercentage,
                    is_included: true,
                    baseline_applied_percent: subcomponent.applied_percentage || 0,
                    practice_percentage: practicePercentage,
                    year_percentage: yearPercentage,
                    frequency_percentage: frequencyPercentage,
                    baseline_practice_percentage: subcomponent.practice_percent || 0,
                    baseline_time_percentage: subcomponent.time_percentage || 0,
                    user_id: userId
                  };
                });

                const { error: insertError } = await supabase
                  .from('rd_employee_subcomponents')
                  .insert(employeeSubcomponentData);

                if (insertError) {
                  console.error('❌ Error creating subcomponent relationships during import:', insertError);
                } else {
                  console.log(`✅ Created ${employeeSubcomponentData.length} subcomponent relationships for ${firstName} ${lastName}`);
                }
              } else {
                console.log(`ℹ️ No subcomponents found for role ${roleName} in year ${yearNumber}`);
                console.log('⚠️ CSV IMPORT - Employee may not appear in allocation modals due to missing subcomponent records');
              }
            }

            successCount++;
            console.log(`✅ Successfully imported employee ${firstName} ${lastName} into year ${yearNumber} (${targetBusinessYearId})`);
            
            // Throttle updates to once per second and show progress
            const now = Date.now();
            if (now - lastProgressUpdate >= 1000) { // 1 second
              console.log(`📊 Progress: ${processedCount}/${rows.length} employees processed (${successCount} successful, ${errorCount} failed)`);
              lastProgressUpdate = now;
              
              // Add small delay to prevent UI chaos
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Failed to import employee ${firstName} ${lastName}:`, error);
            detailedErrors.push({
              employee: `${firstName} ${lastName}`,
              error: errorMessage,
              row: typeof row._rowNumber === 'number' ? row._rowNumber : 0
            });
            errorCount++;
          }
        }
        
        // FIXED: After all employees imported, sync Applied % calculations to match modal logic
        console.log('🔄 CSV Import complete. Syncing Applied % calculations...');
        await syncAppliedPercentagesAfterCSV();
        
        setCsvImporting(false);
        setCsvFile(null);
        
        // REMOVED: Don't reload data immediately to prevent UI chaos
        console.log('⏳ Skipping immediate data reload to prevent UI flashing during import...');
        
        // DEBUG: Check if employees actually exist in database
        const { data: allEmployees, error: debugError } = await supabase
          .from('rd_employees')
          .select('id, first_name, last_name, business_id')
          .eq('business_id', businessId);
        
        if (!debugError && allEmployees) {
          console.log(`🔍 DEBUG: Total employees in database for business ${businessId}:`, allEmployees.length);
          console.log('🔍 DEBUG: Employee list:', allEmployees.map(e => `${e.first_name} ${e.last_name} (${e.id})`));
        } else {
          console.error('🔍 DEBUG: Error checking employees:', debugError);
        }
        
        // Add delay before final data reload to prevent UI chaos
        console.log('⏳ Waiting 2 seconds before final data reload to prevent UI flashing...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Now reload data once at the end
        console.log('🔄 Final data reload after CSV import completion...');
        await loadData(selectedYear || businessYearId);
        
        // Show comprehensive summary
        let summary = `Import complete: ${successCount} employees imported successfully`;
        if (errorCount > 0) summary += `, ${errorCount} failed`;
        if (rolesAssignedCount > 0) summary += `, ${rolesAssignedCount} with roles assigned`;
        if (invalidYearCount > 0) summary += `, ${invalidYearCount} with invalid years (skipped)`;
        
        console.log('📊 Import Summary:', summary);
        
        // Show success message
        const summaryMessage = `✅ ${successCount} employees imported across multiple years${rolesAssignedCount > 0 ? `. ${rolesAssignedCount} employees had roles assigned.` : '. All employees created without roles - assign roles manually as needed.'}\n\n💡 Use the "View Year" dropdown to switch between years and see all your imported employees.\n\n🎯 Import complete - UI flashing has been reduced!`;
        toast?.success?.(summaryMessage) || console.log(summaryMessage);
        
        if (errorCount > 0) {
          const errorDetails = detailedErrors.map(err => `Row ${err.row}: ${err.employee} - ${err.error}`).join('\n');
          const errorMessage = `⚠️ ${errorCount} employees failed to import:\n\n${errorDetails}\n\nCheck console for full details.`;
          toast?.error?.(errorMessage) || console.error(errorMessage);
          
          // Also log detailed errors for debugging
          console.error('📋 Detailed CSV Import Errors:', detailedErrors);
        }
      },
      error: (err: any) => {
        setCsvError('Failed to parse CSV: ' + (err?.message || 'Unknown error'));
        setCsvImporting(false);
        console.error('❌ CSV Parse Error:', err);
      }
    });
  };

  // Add this inside EmployeeSetupStep component
  const handleQuickAddSupply = async (supplyData: QuickSupplyEntry) => {
    if (!businessId) return;
    try {
      console.log('🔄 Adding supply:', supplyData);
      await SupplyManagementService.addSupply(supplyData, businessId, selectedYear || businessYearId);
      // Reload supplies (call your loadData or similar function)
      await loadData(selectedYear || businessYearId);
      console.log('✅ Supply added successfully');
    } catch (error) {
      console.error('❌ Error adding supply:', error);
    }
  };

  // Add useEffect to sync with businessYearId prop changes
  useEffect(() => {
    if (businessYearId && businessYearId !== selectedYear) {
      console.log('🔄 EmployeeSetupStep - businessYearId prop changed:', businessYearId);
      setSelectedYear(businessYearId);
      
      // Update display year based on available years
      const yearData = availableYears.find(y => y.id === businessYearId);
      if (yearData) {
        setDisplayYear(yearData.year);
        console.log('📅 EmployeeSetupStep - Updated display year to:', yearData.year);
      }
      
      // Reload data for the new year
      console.log('🔄 EmployeeSetupStep - Reloading data for new year:', businessYearId);
      loadData(businessYearId);
      loadQREValues(businessYearId);
    }
  }, [businessYearId, selectedYear, availableYears]);

  // Also update display year when availableYears is first loaded
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear) {
      const yearData = availableYears.find(y => y.id === selectedYear);
      if (yearData) {
        setDisplayYear(yearData.year);
        console.log('📅 EmployeeSetupStep - Initialized display year to:', yearData.year);
      }
    }
  }, [availableYears, selectedYear]);

  // Calculate QRE totals using useMemo for performance and availability throughout component
  const { employeeQRE, contractorQRE, supplyQRE, totalQRE } = React.useMemo(() => {
    // Check if using locked QRE values
    if (qreLocked) {
      const total = lockedEmployeeQRE + lockedContractorQRE + lockedSupplyQRE;
      console.log(`🔒 Using LOCKED QRE values for year ${displayYear}:`, {
        employees: `$${lockedEmployeeQRE.toLocaleString()}`,
        contractors: `$${lockedContractorQRE.toLocaleString()}`,
        supplies: `$${lockedSupplyQRE.toLocaleString()}`,
        total: `$${total.toLocaleString()}`
      });
      return {
        employeeQRE: lockedEmployeeQRE,
        contractorQRE: lockedContractorQRE,
        supplyQRE: lockedSupplyQRE,
        totalQRE: total
      };
    } else {
      // Calculate from data - THROTTLED: Reduce excessive logging
      const empQRE = employeesWithData.reduce((sum, e, index) => {
        const qre = e.calculated_qre || 0;
        // Only log first 3 employees to prevent spam
        if (index < 3) {
          console.log(`💰 Employee QRE: ${e.first_name} ${e.last_name} = $${qre.toLocaleString()}`);
        } else if (index === 3 && employeesWithData.length > 3) {
          console.log(`💰 ... and ${employeesWithData.length - 3} more employees (logging throttled)`);
        }
        return sum + qre;
      }, 0);
      
      const contrQRE = contractorsWithData.reduce((sum, c, index) => {
        const qre = c.calculated_qre || 0;
        // Only log first contractor to prevent spam
        if (index === 0 && contractorsWithData.length > 0) {
          console.log(`💰 Contractor QRE: ${contractorsWithData.length} contractors, total = $${contractorsWithData.reduce((s, ct) => s + (ct.calculated_qre || 0), 0).toLocaleString()}`);
        }
        return sum + qre;
      }, 0);
      
      const suppQRE = supplies.reduce((sum, s, index) => {
        const qre = s.calculated_qre || 0;
        // Only log first supply to prevent spam
        if (index === 0 && supplies.length > 0) {
          console.log(`💰 Supply QRE: ${supplies.length} supplies, total = $${supplies.reduce((s, sp) => s + (sp.calculated_qre || 0), 0).toLocaleString()}`);
        }
        return sum + qre;
      }, 0);
      
      const total = empQRE + contrQRE + suppQRE;
      
      return {
        employeeQRE: empQRE,
        contractorQRE: contrQRE,
        supplyQRE: suppQRE,
        totalQRE: total
      };
    }
  }, [qreLocked, lockedEmployeeQRE, lockedContractorQRE, lockedSupplyQRE, employeesWithData, contractorsWithData, supplies, displayYear]);

  // ✅ ROSTER-MODAL SYNC: Use EXACT modal calculation by calling modal's own function
  const calculateEmployeeAppliedPercentage = async (employeeId: string): Promise<number> => {
    try {
      console.log('🎯 [ROSTER-MODAL SYNC] Getting Applied% directly from modal calculation for employee:', employeeId);
      
      // ❌ PROBLEM IDENTIFIED: Roster was applying its own calculation instead of using modal's values
      // ✅ SOLUTION: Don't recalculate - use applied_percentage that modal already calculated and saved
      
      const { data: subcomponentAllocations, error } = await supabase
        .from('rd_employee_subcomponents')
        .select('applied_percentage')
        .eq('employee_id', employeeId)
        .eq('business_year_id', selectedYear || businessYearId)
        .eq('is_included', true);
      
      if (error) {
        console.error('❌ Error loading subcomponent allocations:', error);
        return 0;
      }
      
      // ✅ NO RECALCULATION: Just sum the applied_percentage values that modal calculated and saved
      const totalAppliedPercentage = subcomponentAllocations?.reduce((sum, alloc) => {
        return sum + (alloc.applied_percentage || 0);
      }, 0) || 0;
      
      const finalResult = +totalAppliedPercentage.toFixed(2);
      
      console.log('✅ [ROSTER-MODAL SYNC] Using saved applied_percentage values (no recalculation):', {
        employeeId,
        subcomponentCount: subcomponentAllocations?.length || 0,
        totalAppliedPercentage: finalResult,
        note: 'Uses EXACT applied_percentage values that modal calculated and saved - no actualization reapplied'
      });
      
      return finalResult;
    } catch (error) {
      console.error('❌ [ROSTER-MODAL SYNC] Error reading saved applied percentage:', error);
      return 0;
    }
  };
  
  // Utility function to apply 80% threshold rule (matches display logic)
  const applyEightyPercentThreshold = (appliedPercentage: number): number => {
    return appliedPercentage >= 80 ? 100 : appliedPercentage;
  };



  if (loading) {
    console.log('⏳ EmployeeSetupStep - Rendering loading state');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Gradient Header with Progress */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-8 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            {/* Title and Subtitle */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-1">Expense Management ({displayYear})</h2>
              <p className="text-blue-100 text-base">Manage employees, contractors, and supplies for R&D tax credits</p>
            </div>
            {/* Header Row: Summary Stats + Year Selector */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex flex-1 items-end space-x-8 justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{employeesWithData.length}</div>
                  <div className="text-sm text-blue-100">Employees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{contractorsWithData.length}</div>
                  <div className="text-sm text-blue-100">Contractors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{supplies.length}</div>
                  <div className="text-sm text-blue-100">Supplies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{formatCurrency(totalQRE)}</div>
                  <div className="text-sm text-blue-100">Total QRE</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{roles.length}</div>
                  <div className="text-sm text-blue-100">Roles</div>
                </div>
              </div>
              {/* Year Selector for Employee Step */}
              <div className="flex flex-col md:items-end mt-4 md:mt-0">
                <div className="flex items-center space-x-4 mb-2">
                  <label className="text-sm font-medium text-blue-100">View Year:</label>
                  <select
                    value={selectedYear}
                    onChange={async (e) => {
                      const newYearId = e.target.value;
                      const yearData = availableYears.find(y => y.id === newYearId);
                      
                      console.log(`🔄 CRITICAL: Manual year switch from ${selectedYear} to ${newYearId}`);
                      console.log('🧹 FORCING complete data isolation for new year');
                      
                      // CRITICAL: Reset ALL state to prevent data leakage
                      setSelectedYear(newYearId);
                      if (yearData) {
                        setDisplayYear(yearData.year);
                      }
                      
                      // CRITICAL: Clear all cached data immediately to prevent leakage
                      console.log('🧹 CRITICAL: Clearing ALL cached data before year switch');
                      console.log('🧹 Previous supplies:', supplies.length, 'supplies');
                      setEmployeesWithData([]);
                      setContractorsWithData([]);
                      setSupplies([]);
                      setExpenses([]);
                      console.log('🧹 ✅ All cached data cleared');
                      
                      // CRITICAL: Reset QRE locked state to prevent cross-year contamination
                      console.log('🔒 RESETTING QRE state to prevent year contamination');
                      setLockedEmployeeQRE(0);
                      setLockedContractorQRE(0);
                      setLockedSupplyQRE(0);
                      setQreLocked(false);
                      
                      // CRITICAL: Force complete data reload for new year
                      console.log('💾 FORCING complete data reload for year:', newYearId);
                      setLoading(true);
                      
                      try {
                        // Load all data for the new year - CRITICAL: Pass newYearId to prevent stale state
                        await loadData(newYearId);
                        // Load QRE values for the new year
                        await loadQREValues(newYearId);
                        console.log('✅ Year switch complete - data fully isolated');
                      } catch (error) {
                        console.error('❌ Error during year switch:', error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    {availableYears.map(year => (
                      <option key={year.id} value={year.id} className="bg-gray-800 text-white">
                        {year.year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-right text-blue-100">
                  <p className="text-sm">Total QRE: {formatCurrency(totalQRE)}</p>
                  <p className="text-xs opacity-75">{employeesWithData.length + contractorsWithData.length + supplies.length} items</p>
                </div>
              </div>
            </div>
            {/* Expense Distribution Bar */}
            <div className="mt-2 mb-4">
              <div className="text-sm font-medium text-blue-100 mb-2">Expense Distribution</div>
              <div className="w-full h-6 rounded-lg overflow-hidden flex border border-blue-200 bg-blue-100/20">
                <div style={{ width: `${employeeQRE / totalQRE * 100 || 0}%` }} className="bg-blue-500 h-full" title={`Employees: ${employeeQRE}`}></div>
                <div style={{ width: `${contractorQRE / totalQRE * 100 || 0}%` }} className="bg-orange-500 h-full" title={`Contractors: ${contractorQRE}`}></div>
                <div style={{ width: `${supplyQRE / totalQRE * 100 || 0}%` }} className="bg-emerald-500 h-full" title={`Supplies: ${supplyQRE}`}></div>
              </div>
              {/* Color Dot Legend */}
              <div className="flex items-center space-x-6 mt-2">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-xs text-blue-100 font-semibold">Employees</span>
                  <span className="text-xs text-blue-100 font-semibold">{formatCurrency(employeeQRE)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                  <span className="text-xs text-orange-100 font-semibold">Contractors</span>
                  <span className="text-xs text-orange-100 font-semibold">{formatCurrency(contractorQRE)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-xs text-emerald-100 font-semibold">Supplies</span>
                  <span className="text-xs text-emerald-100 font-semibold">{formatCurrency(supplyQRE)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Annual QRE Values - Visible on All Tabs */}
      <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-emerald-800">Annual QRE Values ({displayYear})</h4>
          <button
            onClick={handleQRELockToggle}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              qreLocked 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            {qreLocked ? (
              <>
                <Check className="w-4 h-4" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                <span>Click to Lock</span>
              </>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-2">Employee QRE</label>
            <div className={`w-full px-3 py-2 border rounded-lg text-right ${
              qreLocked 
                ? 'border-emerald-300 bg-white' 
                : 'border-gray-300 bg-gray-100 cursor-not-allowed'
            }`}>
              {qreLocked ? (
                <input
                  type="text"
                  value={formatCurrency(lockedEmployeeQRE)}
                  onChange={async (e) => {
                    // Extract number from formatted currency string
                    const numericValue = parseFloat(e.target.value.replace(/[$,]/g, '')) || 0;
                    setLockedEmployeeQRE(numericValue);
                    
                    // CRITICAL FIX: Auto-save QRE values when manually edited
                    if (selectedYear) {
                      try {
                        await supabase
                          .from('rd_business_years')
                          .update({
                            employee_qre: numericValue,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', selectedYear);
                        console.log('💾 ✅ Auto-saved Employee QRE for year', selectedYear, ':', numericValue);
                      } catch (error) {
                        console.error('❌ Error auto-saving Employee QRE:', error);
                      }
                    }
                  }}
                  className="w-full bg-transparent border-0 text-right focus:outline-none"
                  placeholder="$0"
                />
              ) : (
                <span className="text-gray-700">{formatCurrency(employeeQRE)}</span>
              )}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {qreLocked ? 'Locked value' : 'Live calculated value'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-2">Contractor QRE</label>
            <div className={`w-full px-3 py-2 border rounded-lg text-right ${
              qreLocked 
                ? 'border-emerald-300 bg-white' 
                : 'border-gray-300 bg-gray-100 cursor-not-allowed'
            }`}>
              {qreLocked ? (
                <input
                  type="text"
                  value={formatCurrency(lockedContractorQRE)}
                  onChange={async (e) => {
                    // Extract number from formatted currency string
                    const numericValue = parseFloat(e.target.value.replace(/[$,]/g, '')) || 0;
                    setLockedContractorQRE(numericValue);
                    
                    // CRITICAL FIX: Auto-save QRE values when manually edited
                    if (selectedYear) {
                      try {
                        await supabase
                          .from('rd_business_years')
                          .update({
                            contractor_qre: numericValue,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', selectedYear);
                        console.log('💾 ✅ Auto-saved Contractor QRE for year', selectedYear, ':', numericValue);
                      } catch (error) {
                        console.error('❌ Error auto-saving Contractor QRE:', error);
                      }
                    }
                  }}
                  className="w-full bg-transparent border-0 text-right focus:outline-none"
                  placeholder="$0"
                />
              ) : (
                <span className="text-gray-700">{formatCurrency(contractorQRE)}</span>
              )}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {qreLocked ? 'Locked value' : 'Live calculated value'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-2">Supply QRE</label>
            <div className={`w-full px-3 py-2 border rounded-lg text-right ${
              qreLocked 
                ? 'border-emerald-300 bg-white' 
                : 'border-gray-300 bg-gray-100 cursor-not-allowed'
            }`}>
              {qreLocked ? (
                <input
                  type="text"
                  value={formatCurrency(lockedSupplyQRE)}
                  onChange={async (e) => {
                    // Extract number from formatted currency string
                    const numericValue = parseFloat(e.target.value.replace(/[$,]/g, '')) || 0;
                    setLockedSupplyQRE(numericValue);
                    
                    // CRITICAL FIX: Auto-save QRE values when manually edited
                    if (selectedYear) {
                      try {
                        await supabase
                          .from('rd_business_years')
                          .update({
                            supply_qre: numericValue,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', selectedYear);
                        console.log('💾 ✅ Auto-saved Supply QRE for year', selectedYear, ':', numericValue);
                      } catch (error) {
                        console.error('❌ Error auto-saving Supply QRE:', error);
                      }
                    }
                  }}
                  className="w-full bg-transparent border-0 text-right focus:outline-none"
                  placeholder="$0"
                />
              ) : (
                <span className="text-gray-700">{formatCurrency(supplyQRE)}</span>
              )}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {qreLocked ? 'Locked value' : 'Live calculated value'}
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-emerald-700">
            <strong>Total QRE: {formatCurrency(qreLocked ? (lockedEmployeeQRE + lockedContractorQRE + lockedSupplyQRE) : totalQRE)}</strong>
          </div>
          {qreLocked && (
            <button
              onClick={saveQREValues}
              className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors text-sm"
            >
              Save QRE Values
            </button>
          )}
        </div>
        
        <p className="text-xs text-emerald-600 mt-2">
          {qreLocked 
            ? '🔒 Values are locked and override calculations. Click "Locked" to unlock and use live data.' 
            : '📊 Values update automatically as data changes. Click "Click to Lock" when satisfied to freeze values.'
          }
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mr-4">Quick Actions</h3>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={recalculateAllQRE}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-md"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Recalculate QRE
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Quick Entry Form */}
        <div className="p-6">
          {activeTab === 'employees' && (
            <QuickEmployeeEntryForm onAdd={handleQuickAddEmployee} roles={roles} />
          )}
          {activeTab === 'contractors' && (
            <QuickContractorEntryForm onAdd={handleQuickAddContractor} roles={roles} />
          )}
          {activeTab === 'supplies' && (
            <QuickSupplyEntryForm onAdd={handleQuickAddSupply} />
          )}
        </div>
      </div>

      {/* Expense Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'employees'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Employees</span>
            </button>
            <button
              onClick={() => setActiveTab('contractors')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'contractors'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Contractors</span>
            </button>
            <button
              onClick={() => setActiveTab('supplies')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'supplies'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Supplies</span>
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'support'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Support</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'employees' && (
            <div>

              
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Employee Roster
                    <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {employeesWithData.length} {employeesWithData.length === 1 ? 'Employee' : 'Employees'}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage employee roles, wages, and R&D allocations
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col space-y-2">
                    <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer border border-blue-200 hover:bg-blue-200 transition-colors font-medium">
                      Import Employees (CSV)
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setCsvFile(e.target.files[0]);
                            handleCSVImport(e.target.files[0]);
                          }
                        }}
                        disabled={csvImporting}
                      />
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={csvUseActualization}
                        onChange={(e) => setCsvUseActualization(e.target.checked)}
                        className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700" title="Apply random variations (-25% to +15%) to imported employee subcomponent percentages">
                        CSV Actualization
                      </span>
                    </label>
                  </div>
                  {csvImporting && <span className="text-blue-600 text-sm">Importing...</span>}
                  {csvError && <span className="text-red-600 text-sm">{csvError}</span>}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                    <div className="font-medium text-gray-700 mb-1">CSV Format:</div>
                    <div className="text-gray-600 space-y-1">
                      <div><span className="font-medium">Required:</span> First Name, Last Name, Wage, Year</div>
                      <div><span className="font-medium">Optional:</span> Role (at end)</div>
                      <div><span className="font-medium">Example:</span> John,Doe,$100000,2024,Research Leader</div>
                      <div className="text-blue-600 mt-1">📅 <span className="font-medium">Multi-year import:</span> Automatically creates business years and assigns employees</div>
                      <div className="text-green-600">🎯 <span className="font-medium">No roles by default:</span> Assign roles manually after import for better control</div>
                    </div>
                  </div>
                </div>


              </div>
              {employeesWithData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Employees Added</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Add employees using the quick entry form above to start tracking their R&D involvement and calculate tax credits
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Employee Table Header */}
                  <div className="grid grid-cols-8 gap-2 px-6 py-2 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-base items-center">
                    <div className="text-center">#</div>
                    <button 
                      onClick={() => handleSort('first_name')}
                      className="text-left hover:text-blue-600 transition-colors flex items-center justify-between"
                    >
                      First Name
                      <span className="text-xs ml-1">{getSortIcon('first_name')}</span>
                    </button>
                    <button 
                      onClick={() => handleSort('last_name')}
                      className="text-left hover:text-blue-600 transition-colors flex items-center justify-between"
                    >
                      Last Name
                      <span className="text-xs ml-1">{getSortIcon('last_name')}</span>
                    </button>
                    <div className="text-center">Role (Optional)</div>
                    <div className="text-right font-semibold">Annual Wage</div>
                    <button 
                      onClick={() => handleSort('calculated_qre')}
                      className="text-center hover:text-blue-600 transition-colors flex items-center justify-center"
                    >
                      QRE
                      <span className="text-xs ml-1">{getSortIcon('calculated_qre')}</span>
                    </button>
                    <button 
                      onClick={() => handleSort('applied_percentage')}
                      className="text-center hover:text-blue-600 transition-colors flex items-center justify-center"
                      title="Applied% calculated using allocation modal method - always matches modal values"
                    >
                      Applied % 🎯
                      <span className="text-xs ml-1">{getSortIcon('applied_percentage')}</span>
                    </button>
                    <div className="text-right">Actions</div>
                  </div>

                  {/* Employee Table Rows */}
                  {sortedEmployees.map((employee, index) => {
                    // Remove isCustom and chip logic
                    // Owner dot logic
                    const isOwner = employee.is_owner;
                    // UNIFIED: Applied % using modal calculation method (stored in applied_percentage during sync)
                    let appliedColor = "text-blue-700";
                    let appliedValue = Number(employee.applied_percentage || 0);
                    let appliedDisplay = appliedValue.toFixed(2);
                    if (appliedValue >= 80) {
                      appliedColor = "text-black";
                      appliedDisplay = "100.00";
                    } else if (appliedValue >= 60) {
                      appliedColor = "text-orange-700";
                    } else if (appliedValue >= 50) {
                      appliedColor = "text-orange-500";
                    } else if (appliedValue >= 40) {
                      appliedColor = "text-green-900";
                    } else if (appliedValue >= 30) {
                      appliedColor = "text-green-500";
                    }
                    return (
                      <div
                        key={employee.id}
                        className="grid grid-cols-8 gap-2 px-6 py-3 border-b border-gray-100 items-center hover:bg-blue-50 transition-all duration-150"
                        style={{ minHeight: '56px' }}
                      >
                        {/* Counter */}
                        <div className="text-center text-sm font-medium text-gray-500">{index + 1}</div>
                        {/* First Name */}
                        <div className="font-bold text-lg text-gray-900">{employee.first_name}</div>
                        {/* Last Name */}
                        <div className="font-bold text-lg text-gray-900">{employee.last_name}</div>
                        {/* Role Column */}
                        <div className="flex flex-col items-center">
                          <div className="flex items-center space-x-2">
                            <select
                              className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              value={employee.role?.id || ''}
                              onChange={e => updateEmployeeRole(employee.id, e.target.value)}
                            >
                              <option value="">No Role Assigned</option>
                              {roles.map(role => (
                                <option key={role.id} value={role.id}>
                                  {role.name} {role.baseline_applied_percent ? `(${Number(role.baseline_applied_percent).toFixed(2)}%)` : ''}
                                </option>
                              ))}
                            </select>
                            {isOwner && (
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" title="Owner"></span>
                            )}
                          </div>
                        </div>
                        {/* Wage Column */}
                        <div className="text-right">
                          <WageInput
                            employeeId={employee.id}
                            initialValue={employee.annual_wage}
                            onUpdate={updateEmployeeWage}
                          />
                        </div>
                        {/* QRE Column */}
                        <div className="text-center text-lg font-semibold text-purple-700">
                          {formatCurrency(employee.calculated_qre)}
                        </div>
                        {/* Applied % Column - UNIFIED: Now matches allocation modal exactly */}
                        <div className={`text-center text-lg font-semibold ${appliedColor}`} title="Applied% calculated using allocation modal method">
                          {appliedDisplay}%
                        </div>
                        {/* Actions Column */}
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            className="p-2 rounded-full hover:bg-blue-100 transition"
                            title="Manage Allocations"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Settings className="w-5 h-5 text-blue-600" />
                          </button>
                          <button
                            className="p-2 rounded-full hover:bg-red-100 transition"
                            title="Delete Employee"
                            onClick={() => handleDeleteEmployee(employee.id)}
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'contractors' && (
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-400 to-yellow-400 bg-clip-text text-transparent">Contractors</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage contractor roles, amounts, and R&D allocations (65% QRE reduction applied)
                </p>
              </div>
              {contractorsWithData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Contractors Added</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Add contractors using the quick entry form above to start tracking their R&D involvement and calculate tax credits
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Contractor Table Header */}
                  <div className="grid grid-cols-7 gap-2 px-6 py-2 bg-orange-50 border-b border-orange-200 font-semibold text-orange-700 text-base items-center">
                    <button 
                      onClick={() => handleSort('first_name')}
                      className="text-left hover:text-orange-600 transition-colors flex items-center justify-between"
                    >
                      First Name
                      <span className="text-xs ml-1">{getSortIcon('first_name')}</span>
                    </button>
                    <button 
                      onClick={() => handleSort('last_name')}
                      className="text-left hover:text-orange-600 transition-colors flex items-center justify-between"
                    >
                      Last Name
                      <span className="text-xs ml-1">{getSortIcon('last_name')}</span>
                    </button>
                    <div className="text-center">Role</div>
                    <div className="text-right font-semibold">Amount</div>
                    <button 
                      onClick={() => handleSort('calculated_qre')}
                      className="text-center hover:text-orange-600 transition-colors flex items-center justify-center"
                    >
                      QRE (65%)
                      <span className="text-xs ml-1">{getSortIcon('calculated_qre')}</span>
                    </button>
                    <button 
                      onClick={() => handleSort('applied_percentage')}
                      className="text-center hover:text-orange-600 transition-colors flex items-center justify-center"
                    >
                      Applied %
                      <span className="text-xs ml-1">{getSortIcon('applied_percentage')}</span>
                    </button>
                    <div className="text-right">Actions</div>
                  </div>
                  {/* Contractor Table Rows */}
                  {sortedContractors.map((contractor) => {
                    // Applied % color logic for contractors
                    let appliedColor = "text-blue-700";
                    let appliedValue = Number(contractor.applied_percentage);
                    let appliedDisplay = appliedValue.toFixed(2);
                    if (appliedValue >= 80) {
                      appliedColor = "text-black";
                      appliedDisplay = "100.00";
                    } else if (appliedValue >= 60) {
                      appliedColor = "text-orange-700";
                    } else if (appliedValue >= 50) {
                      appliedColor = "text-orange-500";
                    } else if (appliedValue >= 40) {
                      appliedColor = "text-green-900";
                    } else if (appliedValue >= 30) {
                      appliedColor = "text-green-500";
                    }
                    
                    return (
                      <div
                        key={contractor.id}
                        className="grid grid-cols-7 gap-2 px-6 py-3 border-b border-orange-100 items-center hover:bg-orange-50 transition-all duration-150"
                        style={{ minHeight: '56px' }}
                      >
                        {/* First Name */}
                        <div className="font-bold text-lg text-gray-900">{contractor.first_name}</div>
                        {/* Last Name */}
                        <div className="font-bold text-lg text-gray-900">{contractor.last_name}</div>
                        {/* Role Column */}
                        <div className="flex flex-col items-center">
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <select
                                value={contractor.role_id || ''}
                                onChange={(e) => {
                                  const newRoleId = e.target.value;
                                  if (newRoleId && newRoleId !== contractor.role_id) {
                                    updateContractorRole(contractor.id, newRoleId);
                                  }
                                }}
                                className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-medium border border-orange-200 cursor-pointer hover:bg-orange-200 transition-colors appearance-none pr-8"
                              >
                                <option value="" disabled>Select Role</option>
                                {roles.map(role => (
                                  <option key={role.id} value={role.id}>
                                    {role.name} {role.baseline_applied_percent ? `(${Number(role.baseline_applied_percent).toFixed(2)}%)` : ''}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-orange-500 pointer-events-none" />
                            </div>
                            {contractor.is_owner && (
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" title="Owner"></span>
                            )}
                          </div>
                        </div>
                        {/* Amount Column */}
                        <div className="text-right text-lg font-semibold text-gray-900">
                          {formatCurrency(contractor.amount || 0)}
                        </div>
                        {/* QRE Column */}
                        <div className="text-center text-lg font-semibold text-purple-700">
                          {formatCurrency(contractor.calculated_qre)}
                        </div>
                        {/* Applied % Column */}
                        <div className={`text-center text-lg font-semibold ${appliedColor}`}>
                          {appliedDisplay}%
                        </div>
                        {/* Actions Column */}
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            className="p-2 rounded-full hover:bg-orange-100 transition"
                            title="Manage Allocations"
                            onClick={() => handleEditContractor(contractor)}
                          >
                            <Settings className="w-5 h-5 text-orange-600" />
                          </button>
                          <button
                            className="p-2 rounded-full hover:bg-red-100 transition"
                            title="Delete Contractor"
                            onClick={() => handleDeleteContractor(contractor.id)}
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'supplies' && (
            <SupplySetupStep
              supplies={supplies}
              onUpdate={async (updates) => {
                console.log('🔍 SupplySetupStep onUpdate called with:', updates);
                console.log('🔍 Current supplies.length:', supplies.length);
                console.log('🔍 Update flags:', {
                  hasSupplyDataChanged: !!updates.supplyDataChanged,
                  hasSupplyDataReloaded: !!updates.supplyDataReloaded,
                  hasSupplies: !!updates.supplies,
                  suppliesCount: updates.supplies?.length || 0
                });
                
                // CRITICAL FIX: Only allow specific types of updates from SupplySetupStep
                if (updates.supplyDataChanged) {
                  console.log('🔄 SupplySetupStep requested data reload (supply added/edited) - reloading EmployeeSetupStep data');
                  await loadData(selectedYear || businessYearId);
                } else if (updates.supplies !== undefined) {
                  console.log('📊 SupplySetupStep provided', updates.supplies?.length || 0, 'supplies');
                  
                  // CRITICAL: Only allow SupplySetupStep updates if EmployeeSetupStep hasn't loaded year-specific data yet
                  // Check if EmployeeSetupStep has completed its supply loading
                  const hasEmployeeStepData = supplies.length > 0;
                                     const supplyStepSuppliesWithQRE = (updates.supplies || []).filter((s: any) => s.calculated_qre > 0);
                   const supplyStepSuppliesZeroQRE = (updates.supplies || []).filter((s: any) => s.calculated_qre === 0);
                  
                  console.log('📊 SupplySetupStep analysis:', {
                    totalSupplies: updates.supplies?.length || 0,
                    withQRE: supplyStepSuppliesWithQRE.length,
                    withZeroQRE: supplyStepSuppliesZeroQRE.length
                  });
                  
                                     // CRITICAL FIX: Supplies should behave like employees/contractors - only show year-specific supplies
                   // EmployeeSetupStep loads supplies via rd_supply_subcomponents (year-specific)
                   // SupplySetupStep loads ALL business supplies (business-wide)
                   // We should NEVER allow SupplySetupStep to override EmployeeSetupStep's year-filtered data
                   
                   if (updates.supplyDataChanged) {
                     // Only allow when SupplySetupStep explicitly requests a data reload (after adding/editing)
                     console.log('✅ ALLOWING: SupplySetupStep requested data reload (supply added/edited)');
                     // This will trigger loadData() above, which loads year-specific supplies properly
                   } else {
                     // Block all other SupplySetupStep updates to maintain year isolation
                     console.log('🚫 BLOCKED: SupplySetupStep trying to override EmployeeSetupStep year-specific supply data');
                     console.log('🔒 Supplies should only show for the year they belong to (like employees/contractors)');
                     console.log('📊 EmployeeSetupStep handles year-specific supply loading via rd_supply_subcomponents');
                     console.log('📊 SupplySetupStep provides business-wide data which breaks year isolation');
                     // Don't update supplies - maintain EmployeeSetupStep's year-specific data
                   }
                } else {
                  console.log('🔍 SupplySetupStep update ignored (no supply data in updates)');
                }
              }}
              onNext={onNext}
              onPrevious={onPrevious}
              businessYearId={selectedYear || businessYearId} // CRITICAL: Use selectedYear for consistency
              businessId={businessId}
            />
          )}

          {activeTab === 'support' && (
            <div className="space-y-8">
              {/* Support Tab Header */}
              <div className="text-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Document Support
                </h3>
                <p className="text-gray-600">
                  Upload and manage supporting documents for your R&D tax credit claim
                </p>
              </div>

              {/* Document Upload Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Invoices Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg mr-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Invoices</h4>
                      <p className="text-sm text-gray-600">Upload supplier and vendor invoices</p>
                    </div>
                  </div>
                  
                  {/* Invoice Upload Area */}
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer mb-4">
                    <div className="text-blue-500 text-3xl mb-2">📄</div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX (max 10MB)</p>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple />
                  </div>

                  {/* Invoice Linking Options */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h5 className="font-medium text-gray-900 mb-2">Link Options</h5>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="radio" name="invoice-link" className="text-blue-600" />
                        <span className="ml-2 text-sm text-gray-700">Link to Supply</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="invoice-link" className="text-blue-600" />
                        <span className="ml-2 text-sm text-gray-700">Link to Contractor</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="invoice-link" className="text-blue-600" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">General Support Document</span>
                      </label>
                    </div>
                  </div>

                  {/* Uploaded Invoices List */}
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents (0)</div>
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No invoices uploaded yet
                    </div>
                  </div>
                </div>

                {/* 1099s Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-100 rounded-lg mr-3">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">1099 Forms</h4>
                      <p className="text-sm text-gray-600">Upload contractor 1099 forms</p>
                    </div>
                  </div>
                  
                  {/* 1099 Upload Area */}
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors cursor-pointer mb-4">
                    <div className="text-green-500 text-3xl mb-2">📋</div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX (max 10MB)</p>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" multiple />
                  </div>

                  {/* 1099 Linking Options */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h5 className="font-medium text-gray-900 mb-2">Link to Contractor</h5>
                    <select className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                      <option value="">Select contractor...</option>
                      {contractorsWithData.map(contractor => (
                        <option key={contractor.id} value={contractor.id}>
                          {`${contractor.first_name || ''} ${contractor.last_name || ''}`.trim() || 'Unnamed Contractor'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Uploaded 1099s List */}
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Uploaded Forms (0)</div>
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No 1099 forms uploaded yet
                    </div>
                  </div>
                </div>

                {/* Procedure Reports Section - Healthcare AI Integration */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg mr-3">
                      <div className="relative">
                        <FileText className="w-6 h-6 text-purple-600" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-xs">✨</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Procedure Reports</h4>
                      <p className="text-sm text-gray-600">AI-powered procedure code analysis</p>
                    </div>
                  </div>
                  
                  {/* AI Enhancement Badge */}
                  <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-300 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-600 mr-2">🤖</span>
                      <div>
                        <div className="text-sm font-medium text-yellow-800">AI-Enhanced Analysis</div>
                        <div className="text-xs text-yellow-700">Automatically links procedure codes to research activities</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Procedure Report Upload Area */}
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer mb-4">
                    <div className="text-purple-500 text-3xl mb-2">🏥</div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Upload Production by Category</span>
                    </p>
                    <p className="text-xs text-gray-500">PDF, CSV, XLS, XLSX (max 25MB)</p>
                    <input type="file" className="hidden" accept=".pdf,.csv,.xls,.xlsx" multiple />
                  </div>

                  {/* AI Processing Status */}
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                      <span className="animate-pulse mr-2">🔄</span>
                      AI Analysis Status
                    </h5>
                    <div className="text-sm text-gray-600">
                      Ready to analyze procedure codes and link to research activities
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full w-0 transition-all duration-300"></div>
                    </div>
                  </div>

                  {/* Expected Benefits */}
                  <div className="mt-4 bg-white rounded-lg p-4 border border-purple-200">
                    <h5 className="font-medium text-gray-900 mb-2">Expected Analysis:</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Link CPT codes to research activities</li>
                      <li>• Calculate billable time percentages</li>
                      <li>• Validate practice allocation ratios</li>
                      <li>• Generate supporting documentation</li>
                    </ul>
                  </div>

                  {/* Uploaded Reports List */}
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Uploaded Reports (0)</div>
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No procedure reports uploaded yet
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Document Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Total Documents</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Linked Items</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600">AI Analyzed</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">0%</div>
                    <div className="text-sm text-gray-600">Coverage</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {/* Simple Navigation - Year moved to main footer */}
      <div className="flex justify-between items-center pt-6">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md font-medium"
        >
          Next →
        </button>
      </div>

      {/* Manage Allocations Modal - KEY PROP FORCES FRESH REMOUNT PER EMPLOYEE */}
      {showEmployeeDetailModal && selectedEmployee && (
        <ManageAllocationsModal
          key={`allocation-modal-${selectedEmployee.id}-${selectedYear}`}
          isOpen={showEmployeeDetailModal}
          onClose={() => {
            console.log('🔄 Closing allocation modal for:', selectedEmployee.first_name, selectedEmployee.last_name);
            setShowEmployeeDetailModal(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          businessYearId={selectedYear}
          onUpdate={loadData}
        />
      )}
      {/* Contractor Allocations Modal */}
      {showContractorDetailModal && selectedContractor && (
        <ContractorAllocationsModal
          isOpen={showContractorDetailModal}
          onClose={() => {
            setShowContractorDetailModal(false);
            setSelectedContractor(null);
          }}
          contractor={selectedContractor}
          businessYearId={selectedYear}
          onUpdate={loadData}
        />
      )}

      {/* Allocation Report Modal */}
      <AllocationReportModal
        isOpen={showAllocationReport}
        onClose={() => setShowAllocationReport(false)}
        businessData={{ id: businessId }}
        selectedYear={{ id: selectedYear, year: availableYears.find(y => y.id === selectedYear)?.year || new Date().getFullYear() }}
        calculations={null}
      />
    </div>
  );
};

export default EmployeeSetupStep; 