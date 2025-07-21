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

const QuickEmployeeEntryForm: React.FC<{
  onAdd: (employee: QuickEmployeeEntry) => void;
  roles: Role[];
}> = ({ onAdd, roles }) => {
  const [formData, setFormData] = useState<QuickEmployeeEntry>({
    first_name: '',
    last_name: '',
    wage: '',
    role_id: '',
    is_owner: false
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
        is_owner: false
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
        
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_owner}
              onChange={(e) => setFormData(prev => ({ ...prev, is_owner: e.target.checked }))}
              className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Is Owner</span>
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

  // Load data only when modal opens
  useEffect(() => {
    if (isOpen && employee) {
      loadAllocationData();
    }
  }, [isOpen, employee]);

  // Recalculate total when non-R&D percentage changes
  useEffect(() => {
    calculateTotalAllocated(activities);
  }, [nonRdPercentage, activities]);

  const loadAllocationData = async () => {
    if (!employee) {
      console.log('⚠️ No employee provided to loadAllocationData');
      return;
    }
    
    console.log('🔍 loadAllocationData called for employee:', employee.id, 'role:', employee.role?.id);
    
    if (!businessYearId) {
      console.log('⚠️ No businessYearId provided to loadAllocationData');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 Loading allocation data for employee:', employee.id, 'role:', employee.role?.id);
      
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

        // Get employee's current allocations for this activity
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

        console.log('📋 Found employee allocations:', employeeAllocations?.length);

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
            baselinePracticePercentage: baselinePracticePercentage
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
      
      setActivities(activitiesWithSubcomponents);
      calculateTotalAllocated(activitiesWithSubcomponents);
      
      console.log('✅ Allocation data loaded:', activitiesWithSubcomponents);
    } catch (error) {
      console.error('❌ Error in loadAllocationData:', error);
      // Set empty activities as fallback
      setActivities([]);
      calculateTotalAllocated([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAllocated = (activitiesData: ResearchActivityAllocation[]) => {
    const total = activitiesData.reduce((sum, activity) => {
      if (activity.isEnabled) {
        return sum + activity.practicePercentage;
      }
      return sum;
    }, 0) + nonRdPercentage;
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

  // Calculate applied percentage segments for visualization (based on custom allocations or baseline)
  const getAppliedPercentageSegments = () => {
    const segments: any[] = [];
    let currentPosition = 0;
    
    // Calculate applied percentages directly from modal values (no baseline)
    for (const activity of activities) {
      if (activity.isEnabled) {
        let activityTotalApplied = 0;
        
        for (const subcomponent of activity.subcomponents) {
          if (subcomponent.isIncluded) {
            // Calculate applied percentage using modal's formula only
            const appliedPercentage = (activity.practicePercentage / 100) * 
                                   (subcomponent.yearPercentage / 100) * 
                                   (subcomponent.frequencyPercentage / 100) * 
                                   (subcomponent.timePercentage / 100) * 100;
            
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
        }
      }
    }
    
    return segments;
  };

  const updateActivityEnabled = (activityId: string, isEnabled: boolean) => {
    setActivities(prev => prev.map(activity => {
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
    }));
  };

  const updateActivityPracticePercentage = (activityId: string, percentage: number) => {
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
        
        return updated.map(activity => {
          if (activity.isEnabled) {
            return { ...activity, practicePercentage: Math.round(activity.practicePercentage * scaleFactor * 100) / 100 };
          }
          return activity;
        });
      }
      
      return updated;
    });
  };

  const updateSubcomponentTimePercentage = (activityId: string, subcomponentId: string, percentage: number) => {
    setActivities(prev => prev.map(activity => {
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
    }));
  };

  const saveAllocations = async () => {
    if (!employee) return;
    
    setLoading(true);
    try {
      console.log('💾 Saving allocations for employee:', employee.id);
      
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
      const calculatedQRE = Math.round((annualWage * finalAppliedPercentage) / 100);

      console.log('📊 Final calculations:', {
        appliedPercentage: finalAppliedPercentage,
        annualWage: annualWage,
        calculatedQRE: calculatedQRE,
        note: 'NO baseline constraints applied'
      });

      // Update rd_employee_year_data with exact calculated values
      const { error: yearDataError } = await supabase
        .from('rd_employee_year_data')
        .update({
          calculated_qre: calculatedQRE,
          applied_percent: finalAppliedPercentage // Use exact calculated total
        })
        .eq('employee_id', employee.id)
        .eq('business_year_id', businessYearId);
        
      if (yearDataError) {
        console.error('❌ Error updating employee year QRE after allocations:', yearDataError);
      } else {
        console.log('✅ Updated employee year data:', {
          calculatedQRE: calculatedQRE,
          appliedPercent: finalAppliedPercentage
        });
      }

      console.log('✅ Allocations saved successfully - employee roster should now match allocation modal');
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
              <span className="ml-2 text-gray-600">Loading allocations...</span>
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
                    <span className="text-lg font-bold text-blue-900">{formatPercentage(getAppliedPercentageSegments().reduce((sum, seg) => sum + seg.percentage, 0))}%</span>
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
                  onChange={(e) => setNonRdPercentage(parseFloat(e.target.value))}
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
                                      setActivities(prev => prev.map(a => {
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
                                      }));
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
  // Allocation Report Modal State
  const [showAllocationReport, setShowAllocationReport] = useState(false);
  // Add state to track the current year for display
  const [displayYear, setDisplayYear] = useState<number>(new Date().getFullYear());

  console.log('🔍 EmployeeSetupStep - Component props:', {
    businessYearId,
    businessId,
    employeesLength: employees?.length
  });

  // Note: Data isolation is now handled by parent component via key prop
  // which forces complete component remount when switching businesses

  const loadData = async () => {
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

      // Load roles with baseline_applied_percent
      const { data: rolesData, error: rolesError } = await supabase
        .from('rd_roles')
        .select('id, name, baseline_applied_percent')
        .eq('business_year_id', selectedYear || businessYearId);

      if (rolesError) {
        console.error('❌ EmployeeSetupStep - Error loading roles:', rolesError);
      } else {
        setRoles(rolesData || []);
      }

      // Load employees with calculated QRE - CORRECT: Filter by employees who have data for the selected year
      const currentBusinessYearId = selectedYear || businessYearId;
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
        const currentBusinessYearId = selectedYear || businessYearId;
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
            // Get year-specific employee data
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
          
          // Calculate applied percentage from subcomponents (year-specific)
          const totalAppliedPercentage = subcomponents.reduce((sum, sub) => sum + (sub.applied_percentage || 0), 0);
          
          // Use stored calculated_qre if available, otherwise calculate
          let calculatedQRE = yearData?.calculated_qre || 0;
          let actualAppliedPercentage = yearData?.applied_percent || 0;
          
          // If no stored data, calculate from subcomponents
          if (!calculatedQRE && totalAppliedPercentage > 0) {
            actualAppliedPercentage = totalAppliedPercentage;
            calculatedQRE = Math.round((annualWage * actualAppliedPercentage) / 100);
          } else if (!calculatedQRE) {
            // Fall back to baseline if no subcomponent data
            actualAppliedPercentage = baselinePercent;
            calculatedQRE = Math.round((annualWage * actualAppliedPercentage) / 100);
          }
          
          console.log(`🔍 Employee ${employee.first_name} ${employee.last_name}:`, {
            annualWage,
            actualAppliedPercentage,
            calculatedQRE,
            hasYearData: !!yearData,
            subcomponentsCount: subcomponents.length
          });

          return {
            ...employee,
            role: role, // Include the year-specific role data
            calculated_qre: calculatedQRE,
            baseline_applied_percent: baselinePercent,
            applied_percentage: actualAppliedPercentage,
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

      // Load contractors
      try {
        const contractors = await ContractorManagementService.getContractors(selectedYear || businessYearId);
        setContractorsWithData(contractors);
      } catch (error) {
        console.error('❌ EmployeeSetupStep - Error loading contractors:', error);
      }

      // Load expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('rd_expenses')
        .select('*')
        .eq('business_year_id', selectedYear || businessYearId);

      if (expensesError) {
        console.error('❌ EmployeeSetupStep - Error loading expenses:', expensesError);
      } else {
        setExpenses(expensesData || []);
      }

      // Load supplies with subcomponents for the selected year
      try {
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
          .eq('business_year_id', selectedYear || businessYearId);

        if (supplyError) {
          console.error('❌ EmployeeSetupStep - Error loading supply subcomponents:', supplyError);
        } else {
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
          
          const suppliesWithQRE = Array.from(suppliesMap.values()).map(supply => ({
            ...supply,
            calculated_qre: supply.total_qre
          }));
          
          setSupplies(suppliesWithQRE);
        }
      } catch (error) {
        console.error('❌ EmployeeSetupStep - Error loading supplies:', error);
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
    console.log('🔄 EmployeeSetupStep - useEffect triggered, businessId:', businessId, 'selectedYear:', selectedYear);
    
    // CRITICAL FIX: Clear all state when year changes to prevent data leakage
    if (selectedYear) {
      console.log('🔄 Clearing state for year change to prevent data corruption');
      setEmployeesWithData([]);
      setContractorsWithData([]);
      setSupplies([]);
      setExpenses([]);
      setRoles([]);
      
      // Load data for the specific year
      loadData();
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
  const getOrCreateDefaultRole = async (businessId: string) => {
    try {
      // First, try to find an existing default role for this business
      const { data: existingDefaultRole, error: findError } = await supabase
        .from('rd_roles')
        .select('id, name, baseline_applied_percent')
        .eq('business_id', businessId)
        .eq('is_default', true)
        .single();

      if (existingDefaultRole && !findError) {
        console.log('✅ Found existing default role:', existingDefaultRole);
        
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

      // If no default role exists, create one
      console.log('🔄 Creating default role for business:', businessId);
      const { data: newDefaultRole, error: createError } = await supabase
        .from('rd_roles')
        .insert({
          business_id: businessId,
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

      console.log('✅ Created default role:', newDefaultRole);
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
        roleId = await getOrCreateDefaultRole(businessId);
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
                const stepTimePercentage = selectedSubcomponent?.time_percentage || 0;
                const baselinePracticePercentage = selectedSubcomponent?.practice_percent || activity.practice_percent || 0;
                const yearPercentage = selectedSubcomponent?.year_percentage || 100;
                const frequencyPercentage = selectedSubcomponent?.frequency_percentage || 100;
                
                // Calculate baseline applied percentage: Practice% × Year% × Frequency% × Time%
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
        }
      }

      // Calculate and update QRE in rd_employee_year_data
      const employeeWage = annualWage; // Use the already parsed annualWage
      const totalAppliedPercentage = baselinePercent; // Use role's baseline percentage for initial QRE
      
      // Calculate QRE: (Annual Wage × Applied Percentage) / 100
      const calculatedQRE = Math.round((employeeWage * totalAppliedPercentage) / 100);
      
      // Update rd_employee_year_data with calculated QRE
      const { error: yearDataError } = await supabase
        .from('rd_employee_year_data')
        .update({
          calculated_qre: calculatedQRE,
          applied_percent: totalAppliedPercentage
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
    console.log('🔧 EmployeeSetupStep - handleEditEmployee called with:', employee);
    console.log('🔧 EmployeeSetupStep - Setting selectedEmployee and showEmployeeDetailModal to true');
    setSelectedEmployee(employee);
    setShowEmployeeDetailModal(true);
    console.log('🔧 EmployeeSetupStep - State should now be updated');
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

  // Calculate QRE totals for each group - FIXED: Add debugging and validation
  const employeeQRE = employeesWithData.reduce((sum, e) => {
    const qre = e.calculated_qre || 0;
    console.log(`💰 Employee QRE: ${e.first_name} ${e.last_name} = $${qre.toLocaleString()}`);
    return sum + qre;
  }, 0);
  
  const contractorQRE = contractorsWithData.reduce((sum, c) => {
    const qre = c.calculated_qre || 0;
    console.log(`💰 Contractor QRE: Contractor ${c.id} = $${qre.toLocaleString()}`);
    return sum + qre;
  }, 0);
  
  const supplyQRE = supplies.reduce((sum, s) => {
    const qre = s.calculated_qre || 0;
    console.log(`💰 Supply QRE: ${s.name} = $${qre.toLocaleString()}`);
    return sum + qre;
  }, 0);
  
  const totalQRE = employeeQRE + contractorQRE + supplyQRE;
  
  console.log(`💰 TOTAL QRE Breakdown for ${selectedYear}:`, {
    employees: `$${employeeQRE.toLocaleString()}`,
    contractors: `$${contractorQRE.toLocaleString()}`,
    supplies: `$${supplyQRE.toLocaleString()}`,
    total: `$${totalQRE.toLocaleString()}`
  });

  console.log('📊 EmployeeSetupStep - Render state:', {
    loading,
    employeesWithDataLength: employeesWithData.length,
    rolesLength: roles.length,
    selectedYear,
    businessId,
    showEmployeeDetailModal,
    selectedEmployee: selectedEmployee?.id
  });

  // Function to recalculate QRE for all employees
  const recalculateAllQRE = async () => {
    console.log('🔄 EmployeeSetupStep - Recalculating QRE for all employees');
    
    try {
      const updatedEmployees: any[] = [];
      
      for (const employee of employeesWithData) {
        const role = employee.role;
        const baselinePercent = role?.baseline_applied_percent || 0;
        const annualWage = employee.annual_wage || 0;
        
        // Get actual applied percentage from employee subcomponents
        const { data: subcomponents, error: subcomponentsError } = await supabase
          .from('rd_employee_subcomponents')
          .select('applied_percentage, baseline_applied_percent')
          .eq('employee_id', employee.id)
          .eq('business_year_id', selectedYear);
        
        if (subcomponentsError) {
          console.error('❌ EmployeeSetupStep - Error loading subcomponents for employee:', employee.id, subcomponentsError);
        }
        // Debug log: show subcomponents and their applied_percentage
        console.log(`🟦 Employee ${employee.first_name} ${employee.last_name} subcomponents:`, subcomponents);
        const totalAppliedPercentage = subcomponents?.reduce((sum, sub) => sum + (sub.applied_percentage || 0), 0) || 0;
        console.log(`🟦 Employee ${employee.first_name} ${employee.last_name} total applied_percentage:`, totalAppliedPercentage);
        
        // Use actual applied percentage if available, otherwise use baseline
        const actualAppliedPercentage = totalAppliedPercentage > 0 ? totalAppliedPercentage : baselinePercent;
        
        // Calculate QRE using actual applied percentage
        const calculatedQRE = Math.round((annualWage * actualAppliedPercentage) / 100);
        
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
      
      // Get actual applied percentage from employee subcomponents
      const { data: subcomponents, error: subcomponentsError } = await supabase
        .from('rd_employee_subcomponents')
        .select('applied_percentage, baseline_applied_percent')
        .eq('employee_id', employeeId)
        .eq('business_year_id', selectedYear);
      
      if (subcomponentsError) {
        console.error('❌ EmployeeSetupStep - Error loading subcomponents for employee:', employeeId, subcomponentsError);
      }
      
      // Calculate total applied percentage from subcomponents
      const totalAppliedPercentage = subcomponents?.reduce((sum, sub) => sum + (sub.applied_percentage || 0), 0) || 0;
      
      // Use actual applied percentage if available, otherwise use baseline
      const actualAppliedPercentage = totalAppliedPercentage > 0 ? totalAppliedPercentage : baselinePercent;
      
      // Calculate QRE using actual applied percentage
      const calculatedQRE = Math.round((newWage * actualAppliedPercentage) / 100);
      
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
        
        console.log('🔍 CSV Import - Processing', rows.length, 'rows');
        console.log('📋 CSV Headers detected:', results.meta.fields);
        
        for (const row of rows) {
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
            const defaultRoleId = await getOrCreateDefaultRole(businessId);
            
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
              throw employeeError;
            }

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
                const employeeSubcomponentData = selectedSubcomponents.map((subcomponent: any) => ({
                  employee_id: newEmployee.id,
                  subcomponent_id: subcomponent.subcomponent_id,
                  business_year_id: targetBusinessYearId,
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
              }
            }

            successCount++;
            console.log(`✅ Successfully imported employee ${firstName} ${lastName} into year ${yearNumber} (${targetBusinessYearId})`);
            
          } catch (error) {
            console.error(`❌ Failed to import employee ${firstName} ${lastName}:`, error);
            errorCount++;
          }
        }
        
        setCsvImporting(false);
        setCsvFile(null);
        
        // Reload data to show new employees
        await loadData();
        
        // Show comprehensive summary
        let summary = `Import complete: ${successCount} employees imported successfully`;
        if (errorCount > 0) summary += `, ${errorCount} failed`;
        if (rolesAssignedCount > 0) summary += `, ${rolesAssignedCount} with roles assigned`;
        if (invalidYearCount > 0) summary += `, ${invalidYearCount} with invalid years (skipped)`;
        
        console.log('📊 Import Summary:', summary);
        
        // Show success message
        const summaryMessage = `✅ ${successCount} employees imported across multiple years${rolesAssignedCount > 0 ? `. ${rolesAssignedCount} employees had roles assigned.` : '. All employees created without roles - assign roles manually as needed.'}`;
        toast?.success?.(summaryMessage) || console.log(summaryMessage);
        
        if (errorCount > 0) {
          const errorMessage = `⚠️ ${errorCount} employees failed to import. Check console for details.`;
          toast?.error?.(errorMessage) || console.error(errorMessage);
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
      await SupplyManagementService.addSupply(supplyData, businessId);
      // Reload supplies (call your loadData or similar function)
      await loadData();
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
      loadData();
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
              {/* Header without Year Selector - now controlled by parent wizard */}
              <div className="flex flex-col md:items-end mt-4 md:mt-0">
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
                    >
                      Applied %
                      <span className="text-xs ml-1">{getSortIcon('applied_percentage')}</span>
                    </button>
                    <div className="text-right">Actions</div>
                  </div>

                  {/* Employee Table Rows */}
                  {sortedEmployees.map((employee, index) => {
                    // Remove isCustom and chip logic
                    // Owner dot logic
                    const isOwner = employee.is_owner;
                    // Applied % color logic
                    let appliedColor = "text-blue-700";
                    let appliedValue = Number(employee.applied_percentage);
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
                        {/* Applied % Column */}
                        <div className={`text-center text-lg font-semibold ${appliedColor}`}>
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
              onUpdate={updates => {
                if (updates.supplies) setSupplies(updates.supplies);
              }}
              onNext={onNext}
              onPrevious={onPrevious}
              businessYearId={businessYearId}
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

      {/* Manage Allocations Modal */}
      {showEmployeeDetailModal && selectedEmployee && (
        <ManageAllocationsModal
          isOpen={showEmployeeDetailModal}
          onClose={() => {
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