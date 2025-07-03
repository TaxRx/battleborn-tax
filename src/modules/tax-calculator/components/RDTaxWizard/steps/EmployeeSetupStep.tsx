import React, { useState } from 'react';

interface Employee {
  id: string;
  name: string;
  title: string;
  email: string;
  salary: number;
  hoursPerWeek: number;
  rdPercentage: number;
  startDate: string;
  endDate?: string;
}

interface EmployeeSetupStepProps {
  employees: Employee[];
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const EmployeeSetupStep: React.FC<EmployeeSetupStepProps> = ({
  employees,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    salary: '',
    hoursPerWeek: '',
    rdPercentage: '',
    startDate: '',
    endDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Employee name is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      newErrors.salary = 'Salary must be greater than 0';
    }

    if (!formData.hoursPerWeek || parseFloat(formData.hoursPerWeek) <= 0) {
      newErrors.hoursPerWeek = 'Hours per week must be greater than 0';
    }

    if (!formData.rdPercentage || parseFloat(formData.rdPercentage) <= 0 || parseFloat(formData.rdPercentage) > 100) {
      newErrors.rdPercentage = 'R&D percentage must be between 0 and 100';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const employeeData: Employee = {
      id: editingEmployee?.id || `emp_${Date.now()}`,
      name: formData.name,
      title: formData.title,
      email: formData.email,
      salary: parseFloat(formData.salary),
      hoursPerWeek: parseFloat(formData.hoursPerWeek),
      rdPercentage: parseFloat(formData.rdPercentage),
      startDate: formData.startDate,
      endDate: formData.endDate || undefined
    };

    let updatedEmployees: Employee[];
    if (editingEmployee) {
      updatedEmployees = employees.map(emp => 
        emp.id === editingEmployee.id ? employeeData : emp
      );
    } else {
      updatedEmployees = [...employees, employeeData];
    }

    onUpdate({ employees: updatedEmployees });
    resetForm();
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      title: employee.title,
      email: employee.email,
      salary: employee.salary.toString(),
      hoursPerWeek: employee.hoursPerWeek.toString(),
      rdPercentage: employee.rdPercentage.toString(),
      startDate: employee.startDate,
      endDate: employee.endDate || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (employeeId: string) => {
    const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
    onUpdate({ employees: updatedEmployees });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      email: '',
      salary: '',
      hoursPerWeek: '',
      rdPercentage: '',
      startDate: '',
      endDate: ''
    });
    setErrors({});
    setEditingEmployee(null);
    setShowAddForm(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateTotalRDHours = () => {
    return employees.reduce((total, emp) => {
      const weeklyRDHours = (emp.hoursPerWeek * emp.rdPercentage) / 100;
      return total + weeklyRDHours;
    }, 0);
  };

  const calculateTotalRDSalary = () => {
    return employees.reduce((total, emp) => {
      const rdSalary = (emp.salary * emp.rdPercentage) / 100;
      return total + rdSalary;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Employee Setup</h3>
        <p className="text-gray-600">
          Add employees who performed R&D activities and specify their time allocation.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
          <div className="text-sm text-gray-600">Total Employees</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">
            {calculateTotalRDHours().toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Total R&D Hours/Week</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">
            ${calculateTotalRDSalary().toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total R&D Salary</div>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Employees</h4>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Employee
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">👥</div>
            <p className="text-gray-600 mb-4">No employees added yet.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Employee
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {employees.map(employee => (
              <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="font-semibold text-gray-900">{employee.name}</h5>
                      <span className="text-sm text-gray-500">{employee.title}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <div className="font-medium">{employee.email}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Salary:</span>
                        <div className="font-medium">${employee.salary.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Hours/Week:</span>
                        <div className="font-medium">{employee.hoursPerWeek}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">R&D %:</span>
                        <div className="font-medium">{employee.rdPercentage}%</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      R&D Hours: {((employee.hoursPerWeek * employee.rdPercentage) / 100).toFixed(1)}/week | 
                      R&D Salary: ${((employee.salary * employee.rdPercentage) / 100).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Employee Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-white hover:text-blue-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Software Engineer"
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="employee@company.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Salary *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="75000"
                    />
                  </div>
                  {errors.salary && (
                    <p className="text-red-600 text-sm mt-1">{errors.salary}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hours per Week *
                  </label>
                  <input
                    type="number"
                    value={formData.hoursPerWeek}
                    onChange={(e) => handleInputChange('hoursPerWeek', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="40"
                    min="1"
                    max="168"
                  />
                  {errors.hoursPerWeek && (
                    <p className="text-red-600 text-sm mt-1">{errors.hoursPerWeek}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    R&D Time Percentage *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.rdPercentage}
                      onChange={(e) => handleInputChange('rdPercentage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="25"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">%</span>
                  </div>
                  {errors.rdPercentage && (
                    <p className="text-red-600 text-sm mt-1">{errors.rdPercentage}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.startDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Information Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      About R&D Time Percentage
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        This should reflect the percentage of time the employee spent on qualified research activities during the tax year.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={employees.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue ({employees.length} employees)
        </button>
      </div>
    </div>
  );
};

export default EmployeeSetupStep; 