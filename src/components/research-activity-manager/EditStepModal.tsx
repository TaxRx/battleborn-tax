import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { ResearchActivitiesService, ResearchStep } from '../../modules/tax-calculator/services/researchActivitiesService';

interface EditStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  step?: ResearchStep | null;
  activityId: string;
}

const EditStepModal: React.FC<EditStepModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  step,
  activityId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    step_order: 1
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    console.log('EditStepModal useEffect - step:', step, 'activityId:', activityId);
    
    if (step) {
      setFormData({
        name: step.name || '',
        description: step.description || '',
        step_order: step.step_order || 1
      });
    } else if (activityId && activityId.trim() !== '') {
      // For new steps, get the next order number only if we have a valid activityId
      getNextStepOrder();
    } else {
      // Default for invalid activityId
      setFormData(prev => ({ ...prev, step_order: 1 }));
    }
    setErrors({});
  }, [step, activityId]);

  const getNextStepOrder = async () => {
    try {
      // Validate activityId before making API call
      if (!activityId || activityId.trim() === '') {
        console.warn('Invalid activityId provided to getNextStepOrder:', activityId);
        setFormData(prev => ({ ...prev, step_order: 1 }));
        return;
      }

      const steps = await ResearchActivitiesService.getResearchSteps(activityId);
      const maxOrder = Math.max(...steps.map(s => s.step_order || 0), 0);
      setFormData(prev => ({ ...prev, step_order: maxOrder + 1 }));
    } catch (error) {
      console.error('Error getting next step order:', error);
      setFormData(prev => ({ ...prev, step_order: 1 }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Step name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Step name must be at least 3 characters long';
    }

    if (formData.step_order < 1) {
      newErrors.step_order = 'Step order must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Validate activityId before submission
    if (!activityId || activityId.trim() === '') {
      setErrors({ general: 'Invalid activity ID. Please close and try again.' });
      return;
    }

    setLoading(true);
    try {
      const stepData = {
        research_activity_id: activityId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        step_order: formData.step_order,
        is_active: true
      };

      if (step) {
        // For updates, only send the fields that can be updated
        const updateData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          step_order: formData.step_order
        };
        await ResearchActivitiesService.updateResearchStep(step.id, updateData);
      } else {
        await ResearchActivitiesService.createResearchStep(stepData);
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving step:', error);
      setErrors({ general: 'Failed to save step. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', step_order: 1 });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step ? 'Edit Step' : 'Add New Step'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Step Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter step name..."
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter step description..."
            />
          </div>

          {/* Step Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step Order *
            </label>
            <input
              type="number"
              min="1"
              value={formData.step_order}
              onChange={(e) => setFormData(prev => ({ ...prev, step_order: parseInt(e.target.value) || 1 }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.step_order ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.step_order && (
              <p className="mt-1 text-sm text-red-600">{errors.step_order}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers appear first in the step sequence
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {step ? 'Update Step' : 'Create Step'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStepModal; 