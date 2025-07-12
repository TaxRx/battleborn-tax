import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Settings, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { EmployeeManagementService } from '../../../../../services/employeeManagementService';
import { EmployeeWithSubcomponents, EmployeeSubcomponent } from '../../../../../types/researchDesign';

interface EmployeeManagementStepProps {
  businessId: string;
  businessYearId: string;
  onNext: () => void;
  onPrevious: () => void;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: any) => void;
  roles: Role[];
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSave, roles }) => {
  const [name, setName] = useState('');
  const [annualWage, setAnnualWage] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      annual_wage: parseFloat(annualWage) || 0,
      is_owner: isOwner,
      role_ids: selectedRoles
    });
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setAnnualWage('');
    setIsOwner(false);
    setSelectedRoles([]);
    onClose();
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Employee</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter employee name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Wage *
            </label>
            <input
              type="number"
              value={annualWage}
              onChange={(e) => setAnnualWage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter annual wage"
              required
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isOwner}
                onChange={(e) => setIsOwner(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Is Owner</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Roles *
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {roles.map(role => (
                <label key={role.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{role.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || !annualWage || selectedRoles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EmployeeSubcomponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeWithSubcomponents | null;
  businessYearId: string;
  onUpdate: () => void;
}

const EmployeeSubcomponentModal: React.FC<EmployeeSubcomponentModalProps> = ({
  isOpen,
  onClose,
  employee,
  businessYearId,
  onUpdate
}) => {
  const [subcomponents, setSubcomponents] = useState<EmployeeSubcomponent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employee) {
      loadEmployeeSubcomponents();
    }
  }, [isOpen, employee]);

  const loadEmployeeSubcomponents = async () => {
    if (!employee) return;
    
    setLoading(true);
    try {
      const data = await EmployeeManagementService.getEmployeeSubcomponents(employee.id, businessYearId);
      setSubcomponents(data);
    } catch (error) {
      console.error('Error loading employee subcomponents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubcomponent = async (subcomponentId: string, updates: any) => {
    if (!employee) return;

    try {
      await EmployeeManagementService.updateEmployeeSubcomponent(
        employee.id,
        subcomponentId,
        businessYearId,
        updates
      );
      
      // Update local state
      setSubcomponents(prev => 
        prev.map(sub => 
          sub.subcomponent_id === subcomponentId 
            ? { ...sub, ...updates }
            : sub
        )
      );
      
      onUpdate();
    } catch (error) {
      console.error('Error updating subcomponent:', error);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Employee Subcomponents: {employee.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading subcomponents...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subcomponents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No subcomponents found for this employee. Please assign roles first.
              </p>
            ) : (
              subcomponents.map((subcomponent) => (
                <div key={subcomponent.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={subcomponent.is_included}
                        onChange={(e) => updateSubcomponent(subcomponent.subcomponent_id, {
                          is_included: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <h3 className="font-medium">Subcomponent {subcomponent.subcomponent_id}</h3>
                    </div>
                    <span className="text-sm text-gray-500">
                      Baseline: {subcomponent.baseline_time_percentage}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee Time Percentage
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={subcomponent.employee_time_percentage}
                        onChange={(e) => updateSubcomponent(subcomponent.subcomponent_id, {
                          employee_time_percentage: parseFloat(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={subcomponent.notes || ''}
                        onChange={(e) => updateSubcomponent(subcomponent.subcomponent_id, {
                          notes: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        placeholder="Add notes about this subcomponent..."
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EmployeeManagementStep: React.FC<EmployeeManagementStepProps> = ({
  businessId,
  businessYearId,
  onNext,
  onPrevious
}) => {
  const [employees, setEmployees] = useState<EmployeeWithSubcomponents[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showSubcomponentModal, setShowSubcomponentModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithSubcomponents | null>(null);

  useEffect(() => {
    loadData();
  }, [businessId, businessYearId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesData, rolesData] = await Promise.all([
        EmployeeManagementService.getEmployeesWithRoles(businessId),
        EmployeeManagementService.getRoles(businessYearId)
      ]);
      
      setEmployees(employeesData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (employeeData: any) => {
    try {
      // Step 1: Create employee with selected role
      const { data: newEmployee, error } = await supabase
        .from('rd_employees')
        .insert({
          business_id: businessId,
          name: employeeData.name,
          annual_wage: employeeData.annual_wage,
          is_owner: employeeData.is_owner,
          role_id: employeeData.role_ids[0] || null // For now, use first role as primary
        })
        .select(`
          *,
          role:rd_roles (
            id,
            name,
            description
          )
        `)
        .single();

      if (error) throw error;

      // Step 2: Create employee year data with default values
      const { error: yearDataError } = await supabase
        .from('rd_employee_year_data')
        .insert({
          employee_id: newEmployee.id,
          business_year_id: businessYearId,
          applied_percent: 0, // default, will be updated in step 3
          calculated_qre: 0, // default, will be updated in step 3
          activity_roles: JSON.stringify([]) // default, will be updated in step 3
        });
      if (yearDataError) throw yearDataError;

      // Step 2 continued: Create baseline subcomponent entries with default percentage components
      await EmployeeManagementService.createBaselineSubcomponentEntries(
        newEmployee.id,
        businessYearId
      );

      // Step 2 continued: Initialize employee subcomponent data with practice, frequency, year percentages
      await initializeEmployeeSubcomponentData(newEmployee.id, businessYearId);

      // Reload employees
      await loadData();
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  // Helper function to initialize employee subcomponent data with percentage components
  const initializeEmployeeSubcomponentData = async (employeeId: string, businessYearId: string) => {
    try {
      // Get all selected subcomponents for this business year
      const { data: selectedSubcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select('*')
        .eq('business_year_id', businessYearId);

      if (subError) throw subError;

      // Create initial subcomponent entries with default percentage values
      const initialEntries = selectedSubcomponents?.map(subcomponent => ({
        employee_id: employeeId,
        business_year_id: businessYearId,
        subcomponent_id: subcomponent.subcomponent_id,
        step_id: subcomponent.step_id,
        research_activity_id: subcomponent.research_activity_id,
        employee_time_percentage: 0, // Default practice percentage
        baseline_time_percentage: 0, // Will be calculated based on role
        practice_percentage: 0, // Default practice percentage
        frequency_percentage: 0, // Default frequency percentage
        year_percentage: 0, // Default year percentage
        step_percentage: 0, // Default step percentage
        is_included: true, // Default to included
        notes: ''
      })) || [];

      if (initialEntries.length > 0) {
        const { error } = await supabase
          .from('rd_employee_subcomponents')
          .insert(initialEntries);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error initializing employee subcomponent data:', error);
      throw error;
    }
  };

  const handleEditEmployee = (employee: EmployeeWithSubcomponents) => {
    setSelectedEmployee(employee);
    setShowSubcomponentModal(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      await supabase
        .from('rd_employees')
        .delete()
        .eq('id', employeeId);

      await loadData();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
        <button
          onClick={() => setShowAddEmployeeModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Employees</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage employees and their R&D involvement
          </p>
        </div>

        <div className="p-6">
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees</h3>
              <p className="text-gray-500 mb-4">
                Add employees to start tracking their R&D involvement
              </p>
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Employee
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{employee.name}</h4>
                        <p className="text-sm text-gray-500">
                          {employee.role?.name || 'No role assigned'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Annual Wage: ${employee.annual_wage?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Manage Subcomponents
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
              ))}
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

      <AddEmployeeModal
        isOpen={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        onSave={handleAddEmployee}
        roles={roles}
      />

      <EmployeeSubcomponentModal
        isOpen={showSubcomponentModal}
        onClose={() => setShowSubcomponentModal(false)}
        employee={selectedEmployee}
        businessYearId={businessYearId}
        onUpdate={loadData}
      />
    </div>
  );
};

export default EmployeeManagementStep; 