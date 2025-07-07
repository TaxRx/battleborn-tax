import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Settings, ChevronDown, ChevronRight, Check, X, Download, Calculator, Calendar } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { EmployeeManagementService } from '../../../../../services/employeeManagementService';
import { ExpenseManagementService } from '../../../../../services/expenseManagementService';
import { EmployeeWithExpenses, RDExpense, RDContractor, RDSupply } from '../../../../../types/researchDesign';

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
}

interface QuickEmployeeEntry {
  first_name: string;
  last_name: string;
  wage: string;
  role_id: string;
  is_owner: boolean;
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
    
    // Format as currency
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
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Add Employee</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Doe"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Annual Wage</label>
          <input
            type="text"
            value={formData.wage}
            onChange={handleWageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="$50,000"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={formData.role_id}
            onChange={(e) => setFormData(prev => ({ ...prev, role_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_owner}
              onChange={(e) => setFormData(prev => ({ ...prev, is_owner: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Is Owner</span>
          </label>
        </div>
      </div>
      
      <div className="mt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Employee
        </button>
      </div>
    </form>
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
  const [expenses, setExpenses] = useState<RDExpense[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedYear, setSelectedYear] = useState(businessYearId);
  const [availableYears, setAvailableYears] = useState<{ id: string; year: number }[]>([]);
  const [showEmployeeDetailModal, setShowEmployeeDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithExpenses | null>(null);

  console.log('🔍 EmployeeSetupStep - Component props:', {
    businessYearId,
    businessId,
    employeesLength: employees?.length
  });

  const loadData = async () => {
    try {
      console.log('🔄 EmployeeSetupStep - loadData started');
      setLoading(true);

      // Load business years
      console.log('📊 EmployeeSetupStep - Loading business years for businessId:', businessId);
      const { data: yearsData, error: yearsError } = await supabase
        .from('rd_business_years')
        .select('*')
        .eq('business_id', businessId)
        .order('year', { ascending: false });
      
      if (yearsError) {
        console.error('❌ EmployeeSetupStep - Error loading business years:', yearsError);
      } else {
        console.log('✅ EmployeeSetupStep - Business years loaded:', yearsData);
        setAvailableYears(yearsData || []);
      }

      // Load roles for the business and year
      console.log('👥 EmployeeSetupStep - Loading roles for selectedYear:', selectedYear);
      const rolesData = await EmployeeManagementService.getRoles(selectedYear);
      console.log('✅ EmployeeSetupStep - Roles loaded:', rolesData);
      setRoles(rolesData || []);

      // Load employees with roles
      console.log('👤 EmployeeSetupStep - Loading employees with roles for selectedYear:', selectedYear);
      const employeesData = await EmployeeManagementService.getEmployeesWithRoles(selectedYear);
      console.log('✅ EmployeeSetupStep - Employees with roles loaded:', employeesData);
      setEmployeesWithData(employeesData);

      // Load expenses
      console.log('💰 EmployeeSetupStep - Loading expenses for selectedYear:', selectedYear);
      const { data: expensesData, error: expensesError } = await supabase
        .from('rd_expenses')
        .select('*')
        .eq('business_year_id', selectedYear);
      
      if (expensesError) {
        console.error('❌ EmployeeSetupStep - Error loading expenses:', expensesError);
      } else {
        console.log('✅ EmployeeSetupStep - Expenses loaded:', expensesData);
        setExpenses(expensesData || []);
      }
    } catch (error) {
      console.error('❌ EmployeeSetupStep - Error in loadData:', error);
    } finally {
      setLoading(false);
      console.log('✅ EmployeeSetupStep - loadData completed');
    }
  };

  useEffect(() => {
    console.log('🔄 EmployeeSetupStep - useEffect triggered, businessId:', businessId, 'selectedYear:', selectedYear);
    loadData();
  }, [businessId, selectedYear]);

  const handleQuickAddEmployee = async (employeeData: QuickEmployeeEntry) => {
    try {
      console.log('🔄 EmployeeSetupStep - handleQuickAddEmployee started with:', employeeData);
      
      // Extract numeric value from formatted wage string (allow decimals)
      const numericWage = employeeData.wage.replace(/[^0-9.]/g, '');
      const annualWage = numericWage ? parseFloat(numericWage) : 0;
      
      console.log('💰 EmployeeSetupStep - Parsed wage:', { original: employeeData.wage, numeric: numericWage, annualWage });
      
      // Step 1: Create employee with selected role
      console.log('👤 EmployeeSetupStep - Creating employee in rd_employees table');
      const { data: newEmployee, error: employeeError } = await supabase
        .from('rd_employees')
        .insert({
          business_id: businessId,
          first_name: employeeData.first_name,
          last_name: employeeData.last_name,
          annual_wage: annualWage,
          is_owner: employeeData.is_owner,
          role_id: employeeData.role_id
        })
        .select()
        .single();

      if (employeeError) {
        console.error('❌ EmployeeSetupStep - Error creating employee:', employeeError);
        throw employeeError;
      }

      console.log('✅ EmployeeSetupStep - Employee created successfully:', newEmployee);

      // Step 2: Create employee year data with default values
      console.log('📅 EmployeeSetupStep - Creating employee year data');
      const { error: yearDataError } = await supabase
        .from('rd_employee_year_data')
        .insert({
          employee_id: newEmployee.id,
          business_year_id: selectedYear,
          applied_percent: 0, // default, will be updated in step 3
          calculated_qre: 0, // default, will be updated in step 3
          activity_roles: JSON.stringify([]) // default, will be updated in step 3
        });
      
      if (yearDataError) {
        console.error('❌ EmployeeSetupStep - Error creating employee year data:', yearDataError);
        throw yearDataError;
      }

      console.log('✅ EmployeeSetupStep - Employee year data created successfully');

      // Step 3: Initialize employee subcomponent data with practice, frequency, year percentages
      console.log('🔧 EmployeeSetupStep - Initializing employee subcomponent data');
      await initializeEmployeeSubcomponentData({ employeeId: newEmployee.id, roleId: newEmployee.role_id, businessYearId: selectedYear });

      console.log('✅ EmployeeSetupStep - Employee subcomponent data initialized successfully');

      // Reload data
      console.log('🔄 EmployeeSetupStep - Reloading data after employee creation');
      await loadData();
      
      console.log('✅ EmployeeSetupStep - handleQuickAddEmployee completed successfully');
    } catch (error) {
      console.error('❌ EmployeeSetupStep - Error in handleQuickAddEmployee:', error);
    }
  };

  // Enhanced subcomponent initialization logic
  async function initializeEmployeeSubcomponentData({ employeeId, roleId, businessYearId }: { employeeId: string, roleId: string, businessYearId: string }) {
    try {
      console.log('🟡 [initSubcomponents] Starting for employeeId:', employeeId, 'roleId:', roleId, 'businessYearId:', businessYearId);
      
      // First, let's see what data exists in rd_selected_subcomponents for this business year
      console.log('🔍 [initSubcomponents] Checking all rd_selected_subcomponents for businessYearId:', businessYearId);
      const { data: allSubcomponents, error: allError } = await supabase
        .from('rd_selected_subcomponents')
        .select('*')
        .eq('business_year_id', businessYearId);
      
      if (allError) {
        console.error('🔴 [initSubcomponents] Error getting all subcomponents:', allError);
        return;
      }
      
      console.log('📊 [initSubcomponents] All subcomponents for this business year:', allSubcomponents);
      
      // Query selected subcomponents for this year and role
      const filterValue = `["${roleId}"]`;
      console.log('🔍 [initSubcomponents] Querying rd_selected_subcomponents with businessYearId:', businessYearId, 'roleId:', roleId, 'filterValue:', filterValue);
      const { data: selectedSubcomponents, error: selectError } = await supabase
        .from('rd_selected_subcomponents')
        .select('*')
        .eq('business_year_id', businessYearId)
        .filter('selected_roles', 'cs', filterValue); // JSONB array contains roleId
      if (selectError) {
        console.error('🔴 [initSubcomponents] Error selecting from rd_selected_subcomponents:', selectError);
        return;
      }
      console.log('🟢 [initSubcomponents] Selected subcomponents:', selectedSubcomponents);
      if (!selectedSubcomponents || selectedSubcomponents.length === 0) {
        console.warn('🟠 [initSubcomponents] No subcomponents found for this role/year.');
        return;
      }
      // Prepare insert rows
      const rowsToInsert = selectedSubcomponents.map((sub) => ({
        employee_id: employeeId,
        subcomponent_id: sub.subcomponent_id,
        business_year_id: businessYearId,
        time_percentage: sub.time_percentage ?? 0,
        applied_percentage: sub.applied_percentage ?? 0,
        is_included: true,
        baseline_applied_percent: sub.applied_percentage ?? 0,
        practice_percentage: sub.practice_percentage ?? 0,
        year_percentage: sub.year_percentage ?? 0,
        frequency_percentage: sub.frequency_percentage ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      console.log('🟢 [initSubcomponents] Rows to insert into rd_employee_subcomponents:', rowsToInsert);
      // Insert into rd_employee_subcomponents
      const { error: insertError } = await supabase
        .from('rd_employee_subcomponents')
        .insert(rowsToInsert);
      if (insertError) {
        console.error('🔴 [initSubcomponents] Error inserting into rd_employee_subcomponents:', insertError);
        return;
      }
      console.log('✅ [initSubcomponents] Successfully inserted subcomponent rows for employee:', employeeId);
    } catch (err) {
      console.error('🔴 [initSubcomponents] Unexpected error:', err);
    }
  }

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

  const totalQRE = expenses.reduce((sum, expense) => sum + (expense.total_cost || 0), 0);

  console.log('📊 EmployeeSetupStep - Render state:', {
    loading,
    employeesWithDataLength: employeesWithData.length,
    rolesLength: roles.length,
    selectedYear,
    businessId,
    showEmployeeDetailModal,
    selectedEmployee: selectedEmployee?.id
  });

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
      {/* Year Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <label className="text-sm font-medium text-gray-700">Business Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => {
              console.log('📅 EmployeeSetupStep - Year changed from', selectedYear, 'to', e.target.value);
              setSelectedYear(e.target.value);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employeesWithData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calculator className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total QRE</p>
              <p className="text-2xl font-bold text-gray-900">${totalQRE.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expense Records</p>
              <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Employee Entry Form */}
      <QuickEmployeeEntryForm onAdd={handleQuickAddEmployee} roles={roles} />

      {/* Employees List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Employees</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage employees and their R&D involvement
          </p>
        </div>

        <div className="p-6">
          {employeesWithData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees</h3>
              <p className="text-gray-500 mb-4">
                Add employees using the form above to start tracking their R&D involvement
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {employeesWithData.map((employee) => {
                console.log('👤 EmployeeSetupStep - Rendering employee:', {
                  id: employee.id,
                  firstName: employee.first_name,
                  lastName: employee.last_name,
                  annualWage: employee.annual_wage,
                  roleName: employee.role?.name,
                  isOwner: employee.is_owner
                });
                
                return (
                  <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{employee.first_name} {employee.last_name}</h4>
                          <p className="text-sm text-gray-500">
                            {employee.role?.name || 'No role assigned'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Annual Wage: ${employee.annual_wage?.toLocaleString() || '0'}
                          </p>
                          {employee.is_owner && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Owner
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Manage Allocations
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Next
        </button>
      </div>

      {/* Employee Detail Modal */}
      {(() => {
        console.log('🔍 EmployeeSetupStep - Modal condition check:', {
          showEmployeeDetailModal,
          selectedEmployee: selectedEmployee?.id,
          shouldRender: showEmployeeDetailModal && selectedEmployee
        });
        return null;
      })()}
      {showEmployeeDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Allocations - {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h3>
                <button
                  onClick={() => {
                    setShowEmployeeDetailModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Employee Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Role:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {selectedEmployee.role?.name || 'No role assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Annual Wage:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        ${selectedEmployee.annual_wage?.toLocaleString() || '0'}
                      </span>
                    </div>
                    {selectedEmployee.is_owner && (
                      <div>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Owner
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subcomponent Allocations */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">R&D Allocations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Practice Percentage:</span>
                      <span className="text-sm text-gray-900">
                        {selectedEmployee.practice_percentage || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Time Percentage:</span>
                      <span className="text-sm text-gray-900">
                        {selectedEmployee.time_percentage || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Applied Percentage:</span>
                      <span className="text-sm text-gray-900">
                        {selectedEmployee.applied_percentage || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Baseline Applied:</span>
                      <span className="text-sm text-gray-900">
                        {selectedEmployee.baseline_applied_percent || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEmployeeDetailModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement edit functionality
                    console.log('🔧 Edit allocations for employee:', selectedEmployee.id);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Allocations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSetupStep; 