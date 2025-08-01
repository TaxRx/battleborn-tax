import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { SubcomponentModalProps } from './types';

const SubcomponentModal: React.FC<SubcomponentModalProps> = ({
  isOpen,
  subcomponent,
  stepId,
  steps,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    step_id: stepId,
    name: '',
    description: '',
    subcomponent_order: 1,
    hint: '',
    general_description: '',
    goal: '',
    hypothesis: '',
    alternatives: '',
    uncertainties: '',
    developmental_process: '',
    primary_goal: '',
    expected_outcome_type: '',
    cpt_codes: '',
    cdt_codes: '',
    alternative_paths: ''
  });

  const [loading, setSaving] = useState(false);

  useEffect(() => {
    if (subcomponent) {
      setFormData({
        step_id: subcomponent.step_id,
        name: subcomponent.name || '',
        description: subcomponent.description || '',
        subcomponent_order: subcomponent.subcomponent_order || 1,
        hint: subcomponent.hint || '',
        general_description: subcomponent.general_description || '',
        goal: subcomponent.goal || '',
        hypothesis: subcomponent.hypothesis || '',
        alternatives: subcomponent.alternatives || '',
        uncertainties: subcomponent.uncertainties || '',
        developmental_process: subcomponent.developmental_process || '',
        primary_goal: subcomponent.primary_goal || '',
        expected_outcome_type: subcomponent.expected_outcome_type || '',
        cpt_codes: subcomponent.cpt_codes || '',
        cdt_codes: subcomponent.cdt_codes || '',
        alternative_paths: subcomponent.alternative_paths || ''
      });
    } else {
      // Find the highest order for new subcomponents
      const step = steps.find(s => s.id === stepId);
      const maxOrder = step ? Math.max(...(step as any).subcomponents?.map((s: any) => s.subcomponent_order) || [0], 0) : 0;
      
      setFormData(prev => ({
        ...prev,
        step_id: stepId,
        subcomponent_order: maxOrder + 1
      }));
    }
  }, [subcomponent, stepId, steps]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave({
        ...formData,
        is_active: true
      });
      onClose();
    } catch (error) {
      console.error('Error saving subcomponent:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {subcomponent ? 'Edit Subcomponent' : 'Add New Subcomponent'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Step
                  </label>
                  <select
                    value={formData.step_id}
                    onChange={(e) => handleChange('step_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {steps.filter(step => step.is_active).map(step => (
                      <option key={step.id} value={step.id}>
                        {step.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.subcomponent_order}
                    onChange={(e) => handleChange('subcomponent_order', parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Detailed Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Detailed Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hint
                  </label>
                  <textarea
                    value={formData.hint}
                    onChange={(e) => handleChange('hint', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal
                  </label>
                  <textarea
                    value={formData.goal}
                    onChange={(e) => handleChange('goal', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hypothesis
                  </label>
                  <textarea
                    value={formData.hypothesis}
                    onChange={(e) => handleChange('hypothesis', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Outcome Type
                  </label>
                  <input
                    type="text"
                    value={formData.expected_outcome_type}
                    onChange={(e) => handleChange('expected_outcome_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Additional Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternatives
                  </label>
                  <textarea
                    value={formData.alternatives}
                    onChange={(e) => handleChange('alternatives', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uncertainties
                  </label>
                  <textarea
                    value={formData.uncertainties}
                    onChange={(e) => handleChange('uncertainties', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPT Codes
                  </label>
                  <input
                    type="text"
                    value={formData.cpt_codes}
                    onChange={(e) => handleChange('cpt_codes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CDT Codes
                  </label>
                  <input
                    type="text"
                    value={formData.cdt_codes}
                    onChange={(e) => handleChange('cdt_codes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Subcomponent'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubcomponentModal; 