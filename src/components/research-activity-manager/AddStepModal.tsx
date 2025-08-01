import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { ResearchActivitiesService } from '../../modules/tax-calculator/services/researchActivitiesService';
import { supabase } from '../../lib/supabase';

interface AddStepModalProps {
  isOpen: boolean;
  activityId: string;
  businessId?: string;
  onClose: () => void;
  onSuccess: () => void;
  existingSteps: Array<{ step_order: number }>;
}

const AddStepModal: React.FC<AddStepModalProps> = ({
  isOpen,
  activityId,
  businessId,
  onClose,
  onSuccess,
  existingSteps
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Step name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newOrder = Math.max(...existingSteps.map(s => s.step_order), 0) + 1;
      
      // Get the research activity to check if it has a business_id
      const { data: activity, error: activityError } = await supabase
        .from('rd_research_activities')
        .select('business_id')
        .eq('id', activityId)
        .single();

      if (activityError) {
        console.error('Error fetching activity:', activityError);
        throw new Error('Failed to fetch activity details');
      }

      // Determine the business_id to use (from activity or prop)
      const stepBusinessId = activity?.business_id || businessId;

      // Create the step data with business context if available
      const stepData: any = {
        research_activity_id: activityId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        step_order: newOrder,
        is_active: true
      };

      // Include business_id if available (for RLS policy)
      if (stepBusinessId) {
        stepData.business_id = stepBusinessId;
      }

      await ResearchActivitiesService.createResearchStep(stepData);

      onSuccess();
      onClose();
      setFormData({ name: '', description: '' });
    } catch (err: any) {
      console.error('Error creating step:', err);
      setError(err.message || 'Failed to create step');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Add New Step</h2>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Step Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter step name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter step description (optional)..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-sm text-gray-600">
              <p>Step order: {Math.max(...existingSteps.map(s => s.step_order), 0) + 1}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
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
              <span>{loading ? 'Creating...' : 'Create Step'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStepModal; 