import React, { useState } from 'react';

interface Supply {
  id: string;
  name: string;
  description: string;
  cost: number;
  date: string;
  activityId?: string;
}

interface Contractor {
  id: string;
  name: string;
  description: string;
  cost: number;
  date: string;
  activityId?: string;
  contractType: 'domestic' | 'foreign';
}

interface ExpenseEntryStepProps {
  supplies: Supply[];
  contractors: Contractor[];
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const ExpenseEntryStep: React.FC<ExpenseEntryStepProps> = ({
  supplies,
  contractors,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [activeTab, setActiveTab] = useState<'supplies' | 'contractors'>('supplies');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Supply | Contractor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '',
    date: '',
    activityId: '',
    contractType: 'domestic' as 'domestic' | 'foreign'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      newErrors.cost = 'Cost must be greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (activeTab === 'supplies') {
      const supplyData: Supply = {
        id: editingItem?.id || `supply_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        cost: parseFloat(formData.cost),
        date: formData.date,
        activityId: formData.activityId || undefined
      };

      let updatedSupplies: Supply[];
      if (editingItem) {
        updatedSupplies = supplies.map(item => 
          item.id === editingItem.id ? supplyData : item
        );
      } else {
        updatedSupplies = [...supplies, supplyData];
      }

      onUpdate({ supplies: updatedSupplies });
    } else {
      const contractorData: Contractor = {
        id: editingItem?.id || `contractor_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        cost: parseFloat(formData.cost),
        date: formData.date,
        activityId: formData.activityId || undefined,
        contractType: formData.contractType
      };

      let updatedContractors: Contractor[];
      if (editingItem) {
        updatedContractors = contractors.map(item => 
          item.id === editingItem.id ? contractorData : item
        );
      } else {
        updatedContractors = [...contractors, contractorData];
      }

      onUpdate({ contractors: updatedContractors });
    }

    resetForm();
  };

  const handleEdit = (item: Supply | Contractor) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      cost: item.cost.toString(),
      date: item.date,
      activityId: item.activityId || '',
      contractType: 'contractType' in item ? item.contractType : 'domestic'
    });
    setShowAddForm(true);
  };

  const handleDelete = (itemId: string) => {
    if (activeTab === 'supplies') {
      const updatedSupplies = supplies.filter(item => item.id !== itemId);
      onUpdate({ supplies: updatedSupplies });
    } else {
      const updatedContractors = contractors.filter(item => item.id !== itemId);
      onUpdate({ contractors: updatedContractors });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cost: '',
      date: '',
      activityId: '',
      contractType: 'domestic'
    });
    setErrors({});
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateTotalSupplies = () => {
    return supplies.reduce((total, item) => total + item.cost, 0);
  };

  const calculateTotalContractors = () => {
    return contractors.reduce((total, item) => total + item.cost, 0);
  };

  const calculateTotalExpenses = () => {
    return calculateTotalSupplies() + calculateTotalContractors();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Expense Entry</h3>
        <p className="text-gray-600">
          Enter supplies and contractor costs related to your R&D activities.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">{supplies.length}</div>
          <div className="text-sm text-gray-600">Supply Items</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">{contractors.length}</div>
          <div className="text-sm text-gray-600">Contractors</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">
            ${calculateTotalSupplies().toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Supplies</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-orange-600">
            ${calculateTotalContractors().toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Contractors</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('supplies')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'supplies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Supplies & Materials
            </button>
            <button
              onClick={() => setActiveTab('contractors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contractors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contractors
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-semibold text-gray-900">
              {activeTab === 'supplies' ? 'Supplies & Materials' : 'Contractors'}
            </h4>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add {activeTab === 'supplies' ? 'Supply' : 'Contractor'}
            </button>
          </div>

          {activeTab === 'supplies' ? (
            supplies.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📦</div>
                <p className="text-gray-600 mb-4">No supplies added yet.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Supply
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {supplies.map(supply => (
                  <div key={supply.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="font-semibold text-gray-900">{supply.name}</h5>
                          <span className="text-lg font-bold text-green-600">
                            ${supply.cost.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{supply.description}</p>
                        <div className="text-xs text-gray-500">
                          Date: {new Date(supply.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(supply)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supply.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            contractors.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">👷</div>
                <p className="text-gray-600 mb-4">No contractors added yet.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Contractor
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {contractors.map(contractor => (
                  <div key={contractor.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="font-semibold text-gray-900">{contractor.name}</h5>
                          <span className="text-lg font-bold text-orange-600">
                            ${contractor.cost.toLocaleString()}
                          </span>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            contractor.contractType === 'domestic'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {contractor.contractType === 'domestic' ? 'Domestic' : 'Foreign'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{contractor.description}</p>
                        <div className="text-xs text-gray-500">
                          Date: {new Date(contractor.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(contractor)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(contractor.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Total Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Expense Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Supplies & Materials</div>
            <div className="text-2xl font-bold text-blue-900">
              ${calculateTotalSupplies().toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">Contractors</div>
            <div className="text-2xl font-bold text-orange-900">
              ${calculateTotalContractors().toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Total Expenses</div>
            <div className="text-2xl font-bold text-green-900">
              ${calculateTotalExpenses().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {editingItem ? 'Edit' : 'Add'} {activeTab === 'supplies' ? 'Supply' : 'Contractor'}
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {activeTab === 'supplies' ? 'Supply' : 'Contractor'} Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={activeTab === 'supplies' ? 'e.g., Lab equipment, software licenses' : 'e.g., Research consultant, testing lab'}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe how this expense relates to your R&D activities..."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.cost}
                        onChange={(e) => handleInputChange('cost', e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {errors.cost && (
                      <p className="text-red-600 text-sm mt-1">{errors.cost}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.date && (
                      <p className="text-red-600 text-sm mt-1">{errors.date}</p>
                    )}
                  </div>
                </div>

                {activeTab === 'contractors' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Type *
                    </label>
                    <select
                      value={formData.contractType}
                      onChange={(e) => handleInputChange('contractType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="domestic">Domestic (65% credit)</option>
                      <option value="foreign">Foreign (0% credit)</option>
                    </select>
                  </div>
                )}
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
                      About {activeTab === 'supplies' ? 'Supplies' : 'Contractors'}
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      {activeTab === 'supplies' ? (
                        <p>
                          Include materials, supplies, and equipment used directly in R&D activities. 
                          These expenses are generally 100% qualified.
                        </p>
                      ) : (
                        <p>
                          Domestic contractors receive 65% credit, while foreign contractors receive 0%. 
                          Only payments for qualified research services are eligible.
                        </p>
                      )}
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
                  {editingItem ? 'Update' : 'Add'} {activeTab === 'supplies' ? 'Supply' : 'Contractor'}
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue (${calculateTotalExpenses().toLocaleString()} total expenses)
        </button>
      </div>
    </div>
  );
};

export default ExpenseEntryStep; 