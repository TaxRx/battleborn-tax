import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import YearSelector from '../../components/common/YearSelector';
import { 
  UsersIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  TrashIcon,
  BriefcaseIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import useActivitiesStore from '../../store/activitiesStore';
import useStaffStore from '../../store/staffStore';
import useBusinessStore from '../../store/businessStore';
import { motion } from 'framer-motion';
import { Employee, EmployeeRole } from '../../types/staff';
import { formatPercentage, formatCurrency } from '../../utils/numberFormatting';

const employeeRoles: EmployeeRole[] = [
  'Research Leader',
  'Clinician',
  'Midlevel',
  'Clinical Assistant'
];

interface NewEmployeeForm {
  name: string;
  role: EmployeeRole;
  isBusinessOwner: boolean;
  annualWage: number;
}

interface RoleDescriptionModalState {
  isOpen: boolean;
  employeeId: string;
  activityId: string;
  subcomponentId: string;
  description: string;
}

const StaffReview: React.FC = () => {
  const navigate = useNavigate();
  const { yearStarted, availableYears } = useBusinessStore();

  // Expansion state for employees and activities
  const [expandedEmployees, setExpandedEmployees] = useState<{ [employeeId: string]: boolean }>({});
  const [expandedActivities, setExpandedActivities] = useState<{ [employeeId: string]: { [activityId: string]: boolean } }>({});

  // Initialize selectedYear to the most recent available year, or fallback to current year
  const [selectedYear, setSelectedYear] = useState(
    availableYears && availableYears.length > 0 ? Math.max(...availableYears) : new Date().getFullYear()
  );
  const [showApplyToPreviousYearsModal, setShowApplyToPreviousYearsModal] = useState(false);
  const [roleDescriptionModal, setRoleDescriptionModal] = useState<RoleDescriptionModalState>({
    isOpen: false,
    employeeId: '',
    activityId: '',
    subcomponentId: '',
    description: ''
  });
  
  // Get state from stores
  const { selectedActivities } = useActivitiesStore();
  const { 
    employees,
    activities,
    addEmployee,
    removeEmployee,
    updateEmployeeRole,
    updateEmployeeWage,
    updateActivityPercentage,
    updateSubcomponentPercentage,
    updateSubcomponentRoleDescription,
    toggleActivityExpansion,
    copyAllocationsToYear,
    toggleEmployeeActivitySelection,
    toggleEmployeeSubcomponentSelection,
  } = useStaffStore();

  // Filter selected activities by year
  const filteredActivities = selectedActivities.filter(activity => 
    activity.year === selectedYear
  );

  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm>({
    name: '',
    role: 'Clinician',
    isBusinessOwner: false,
    annualWage: 0
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmployee.name.trim()) {
      const role = newEmployee.isBusinessOwner ? 'Research Leader' : newEmployee.role;
      
      addEmployee({
        name: newEmployee.name,
        role,
        isBusinessOwner: newEmployee.isBusinessOwner,
        annualWage: newEmployee.annualWage
      });
      
      setNewEmployee({
        name: '',
        role: 'Clinician',
        isBusinessOwner: false,
        annualWage: 0
      });
    }
  };

  const calculateTotalActivityPercentage = (employee: Employee, year: number, activityId: string) => {
    const activity = employee.yearlyActivities[year]?.[activityId];
    if (!activity) return 0;

    return Object.values(activity.subcomponents).reduce(
      (total, sub) => total + sub.percentage,
      0
    );
  };

  const handleActivitySliderChange = (
    employee: Employee,
    year: number,
    activityId: string,
    newPercentage: number
  ) => {
    updateActivityPercentage(employee.id, year, activityId, newPercentage);
  };

  const handleSubcomponentSliderChange = (
    employee: Employee,
    year: number,
    activityId: string,
    subcomponentId: string,
    newPercentage: number
  ) => {
    updateSubcomponentPercentage(employee.id, year, activityId, subcomponentId, newPercentage);
  };

  const handleWageChange = (employeeId: string, wage: string) => {
    const numericWage = parseFloat(wage.replace(/[^0-9.]/g, ''));
    if (!isNaN(numericWage)) {
      updateEmployeeWage(employeeId, numericWage);
    }
  };

  const handleOpenRoleDescriptionModal = (
    employeeId: string,
    activityId: string,
    subcomponentId: string
  ) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const activity = selectedActivities.find(act => act.id === activityId);
    const subcomponent = activity?.subcomponents.find(sub => sub.id === subcomponentId);
    
    const description = employee.yearlyActivities[selectedYear]?.[activityId]?.subcomponents[subcomponentId]?.roleDescription || '';
    
    setRoleDescriptionModal({
      isOpen: true,
      employeeId,
      activityId,
      subcomponentId,
      description
    });
  };

  const handleRoleDescriptionSave = () => {
    const { employeeId, activityId, subcomponentId, description } = roleDescriptionModal;
    updateSubcomponentRoleDescription(employeeId, selectedYear, activityId, subcomponentId, description);
    setRoleDescriptionModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleApplyToPreviousYears = (apply: boolean) => {
    if (apply) {
      availableYears.forEach(year => {
        if (year < selectedYear) {
          copyAllocationsToYear(selectedYear, year);
        }
      });
    }
    setShowApplyToPreviousYearsModal(false);
  };

  // Toggle employee card expansion
  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  // Toggle activity expansion for a specific employee
  const toggleActivityExpansionLocal = (employeeId: string, activityId: string) => {
    setExpandedActivities(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [activityId]: !prev[employeeId]?.[activityId]
      }
    }));
  };

  // Sort employees by last name
  const sortedEmployees = [...employees].sort((a, b) => {
    const getLast = (name: string) => name.trim().split(' ').slice(-1)[0].toLowerCase();
    return getLast(a.name).localeCompare(getLast(b.name));
  });

  const calculateEmployeeAllocation = (employee: Employee, year: number) => {
    const totalPercentage = Object.values(employee.yearlyActivities[year] || {})
      .filter(activity => activity.isSelected)
      .reduce((sum, activity) => sum + (activity.percentage || 0), 0);
    return totalPercentage;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Review</h1>
            <p className="mt-1 text-gray-500">
              Review and manage staff involvement in research activities.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <YearSelector
              years={availableYears}
              selectedYear={selectedYear}
              onChange={handleYearChange}
            />
            <Button
              variant="outline"
              onClick={() => navigate('/client/qualified-activities')}
              icon={<ArrowLeftIcon className="h-5 w-5" />}
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Add Employee Form */}
      <Card>
        <form onSubmit={handleAddEmployee} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Name
              </label>
              <Input
                type="text"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as EmployeeRole })}
                className="block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent py-2 px-3"
                disabled={newEmployee.isBusinessOwner}
              >
                {employeeRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Wage
              </label>
              <Input
                type="text"
                value={newEmployee.annualWage ? formatCurrency(newEmployee.annualWage) : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  const numericValue = parseFloat(value);
                  if (!isNaN(numericValue)) {
                    setNewEmployee({ ...newEmployee, annualWage: numericValue });
                  }
                }}
                required
              />
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newEmployee.isBusinessOwner}
                  onChange={(e) => {
                    const isBusinessOwner = e.target.checked;
                    setNewEmployee({
                      ...newEmployee,
                      isBusinessOwner,
                      role: isBusinessOwner ? 'Research Leader' : newEmployee.role
                    });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Business Owner</span>
              </label>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              type="submit"
              variant="primary"
              icon={<PlusIcon className="h-5 w-5" />}
            >
              Add Employee
            </Button>
          </div>
        </form>
      </Card>

      {/* Employee List */}
      {sortedEmployees.map(employee => {
        // Initialize yearlyActivities for the selected year if it doesn't exist
        if (!employee.yearlyActivities[selectedYear]) {
          employee.yearlyActivities[selectedYear] = {};
        }

        const isEmployeeExpanded = expandedEmployees[employee.id] || false;
        
        // Calculate total allocation percentage and amount
        const totalAllocationPercent = calculateEmployeeAllocation(employee, selectedYear);
        const totalAllocationAmount = (employee.annualWage * (totalAllocationPercent / 100));

        return (
          <React.Fragment key={employee.id}>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">{employee.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {employee.role}
                  {employee.isBusinessOwner && <span className="ml-1 text-xs text-blue-600">(Owner)</span>}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">${employee.annualWage.toLocaleString()}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  <span className="font-medium text-blue-600">${totalAllocationAmount.toLocaleString()}</span>
                  <span className="text-gray-500">/{totalAllocationPercent}%</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button onClick={() => toggleEmployeeExpansion(employee.id)} className="text-blue-600 hover:text-blue-900">
                  {isEmployeeExpanded ? <ChevronUpIcon className="h-5 w-5 inline" /> : <ChevronDownIcon className="h-5 w-5 inline" />}
                </button>
                <button onClick={() => removeEmployee(employee.id)} className="text-red-600 hover:text-red-900">
                  <TrashIcon className="h-5 w-5 inline" />
                </button>
              </td>
            </tr>
            {isEmployeeExpanded && (
              <tr>
                <td colSpan={5} className="px-6 py-4 bg-gray-50">
                  <div className="space-y-4">
                    {filteredActivities.map(activity => {
                      const yearly = employee.yearlyActivities[selectedYear] || {};
                      const employeeActivity = yearly[activity.id];
                      if (!employeeActivity?.isSelected) return null;
                      const totalPercentage = calculateTotalActivityPercentage(employee, selectedYear, activity.id);
                      const isActivityExpanded = expandedActivities[employee.id]?.[activity.id] || false;
                      
                      return (
                        <div key={activity.id} className="bg-white rounded-lg shadow p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                              <h4 className="font-semibold text-blue-800">{activity.name}</h4>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-blue-600">${(employee.annualWage * (totalPercentage / 100)).toLocaleString()}</span>
                              <span className="text-gray-500">/{totalPercentage}%</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={employeeActivity?.percentage || 0}
                              onChange={e => updateActivityPercentage(employee.id, selectedYear, activity.id, parseFloat(e.target.value))}
                              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          <div className="pl-6 space-y-3 mt-4">
                            {activity.subcomponents.map(subcomponent => {
                              const sub = employeeActivity?.subcomponents?.[subcomponent.id];
                              if (!sub?.isSelected) return null;
                              const subcomponentAmount = (employee.annualWage * ((sub?.percentage || 0) / 100));
                              
                              return (
                                <div key={subcomponent.id} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                      {employee.role === 'Research Leader' && <UsersIcon className="h-5 w-5 text-purple-600" />}
                                      {employee.role === 'Clinician' && <BriefcaseIcon className="h-5 w-5 text-blue-600" />}
                                      {employee.role === 'Midlevel' && <CubeIcon className="h-5 w-5 text-green-600" />}
                                      {employee.role === 'Clinical Assistant' && <UsersIcon className="h-5 w-5 text-gray-600" />}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{subcomponent.name}</div>
                                      {sub?.roleDescription && (
                                        <div className="text-sm text-gray-500">{sub.roleDescription}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="text-sm">
                                      <span className="font-medium text-blue-600">${subcomponentAmount.toLocaleString()}</span>
                                      <span className="text-gray-500">/{sub?.percentage || 0}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={sub?.percentage || 0}
                                      onChange={e => updateSubcomponentPercentage(employee.id, selectedYear, activity.id, subcomponent.id, parseFloat(e.target.value))}
                                      className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}

      <Card className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/client/qualified-activities')}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (selectedYear > Math.min(...availableYears)) {
              setShowApplyToPreviousYearsModal(true);
            } else {
              navigate('/client/finalize-calculations');
            }
          }}
          icon={<ArrowRightIcon className="h-5 w-5" />}
          iconPosition="right"
        >
          Continue to Calculations
        </Button>
      </Card>

      {/* Role Description Modal */}
      <Modal
        isOpen={roleDescriptionModal.isOpen}
        onClose={() => setRoleDescriptionModal(prev => ({ ...prev, isOpen: false }))}
        title="Role Description"
        maxWidth="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setRoleDescriptionModal(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRoleDescriptionSave}
            >
              Save Description
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <textarea
            value={roleDescriptionModal.description}
            onChange={(e) => setRoleDescriptionModal(prev => ({ ...prev, description: e.target.value }))}
            className="w-full h-64 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent p-3"
            placeholder="Describe the employee's role in this research activity..."
          />
        </div>
      </Modal>

      {/* Apply to Previous Years Modal */}
      <Modal
        isOpen={showApplyToPreviousYearsModal}
        onClose={() => setShowApplyToPreviousYearsModal(false)}
        title="Apply to Previous Years"
        maxWidth="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => handleApplyToPreviousYears(false)}
            >
              No, Skip
            </Button>
            <Button
              variant="primary"
              onClick={() => handleApplyToPreviousYears(true)}
            >
              Yes, Apply
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start">
            <QuestionMarkCircleIcon className="h-6 w-6 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-gray-700">
                Would you like to apply these staff allocations to previous years?
              </p>
              <p className="mt-2 text-sm text-gray-500">
                This will copy your current staff allocations to previous years, maintaining the same percentages.
              </p>
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> This will apply to years {availableYears
                    .filter(year => year < selectedYear)
                    .join(', ')}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default StaffReview;