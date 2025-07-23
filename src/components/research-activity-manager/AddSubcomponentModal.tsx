import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { ResearchActivitiesService } from '../../modules/tax-calculator/services/researchActivitiesService';
import { supabase } from '../../lib/supabase';

interface AddSubcomponentModalProps {
  isOpen: boolean;
  stepId: string;
  businessId?: string;
  onClose: () => void;
  onSuccess: () => void;
  existingSubcomponents: Array<{ subcomponent_order: number }>;
}

const AddSubcomponentModal: React.FC<AddSubcomponentModalProps> = ({
  isOpen,
  stepId,
  businessId,
  onClose,
  onSuccess,
  existingSubcomponents
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    general_description: '',
    goal: '',
    hypothesis: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Subcomponent name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newOrder = Math.max(...existingSubcomponents.map(s => s.subcomponent_order), 0) + 1;
      
      // Get business context from the step's research activity if needed
      let subcomponentBusinessId = businessId;
      
      if (!subcomponentBusinessId) {
        // Get the research activity through the step to check for business_id
        const { data: step, error: stepError } = await supabase
          .from('rd_research_steps')
          .select(`
            research_activity_id,
            rd_research_activities!inner(business_id)
          `)
          .eq('id', stepId)
          .single();

        if (stepError) {
          console.error('Error fetching step details:', stepError);
        } else if (step?.rd_research_activities?.business_id) {
          subcomponentBusinessId = step.rd_research_activities.business_id;
        }
      }

      // Create subcomponent data with business context if available
      const subcomponentData: any = {
        step_id: stepId,
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        subcomponent_order: newOrder,
        is_active: true,
        general_description: formData.general_description.trim() || '',
        goal: formData.goal.trim() || '',
        hypothesis: formData.hypothesis.trim() || '',
        hint: '',
        alternatives: '',
        uncertainties: '',
        developmental_process: '',
        primary_goal: '',
        expected_outcome_type: '',
        cpt_codes: '',
        cdt_codes: '',
        alternative_paths: ''
      };

      // Include business_id if available (for RLS policy)
      if (subcomponentBusinessId) {
        subcomponentData.business_id = subcomponentBusinessId;
      }

      await ResearchActivitiesService.createResearchSubcomponent(subcomponentData);

      onSuccess();
      onClose();
      setFormData({
        name: '',
        description: '',
        general_description: '',
        goal: '',
        hypothesis: ''
      });
    } catch (err: any) {
      console.error('Error creating subcomponent:', err);
      setError(err.message || 'Failed to create subcomponent');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      general_description: '',
      goal: '',
      hypothesis: ''
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Add New Subcomponent</h2>
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
                Subcomponent Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter subcomponent name..."
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
                placeholder="Brief description of this subcomponent..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                General Description
              </label>
              <textarea
                value={formData.general_description}
                onChange={(e) => setFormData(prev => ({ ...prev, general_description: e.target.value }))}
                placeholder="Detailed general description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal
                </label>
                <textarea
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  placeholder="Research goal..."
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
                  onChange={(e) => setFormData(prev => ({ ...prev, hypothesis: e.target.value }))}
                  placeholder="Research hypothesis..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>Order: {Math.max(...existingSubcomponents.map(s => s.subcomponent_order), 0) + 1}</p>
              <p className="text-xs text-gray-500 mt-1">
                You can edit additional fields (alternatives, uncertainties, etc.) after creating the subcomponent.
              </p>
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
              <span>{loading ? 'Creating...' : 'Create Subcomponent'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubcomponentModal; 