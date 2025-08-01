import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ResearchActivity } from '../../modules/tax-calculator/services/researchActivitiesService';

interface EditActivityModalProps {
  isOpen: boolean;
  activity: ResearchActivity | null;
  onClose: () => void;
  onSave: () => void;
  categories: Array<{ id: string; name: string; }>;
  areas: Array<{ id: string; name: string; category_id: string; }>;
  focuses: Array<{ id: string; name: string; area_id: string; }>;
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({
  isOpen,
  activity,
  onClose,
  onSave,
  categories,
  areas,
  focuses
}) => {
  const [formData, setFormData] = useState({
    title: '',
    focus_id: '',
    area_id: '',
    category_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (activity) {
      const currentFocus = focuses.find(f => f.id === activity.focus_id);
      const currentArea = currentFocus ? areas.find(a => a.id === currentFocus.area_id) : null;
      const currentCategory = currentArea ? categories.find(c => c.id === currentArea.category_id) : null;

      setFormData({
        title: activity.title || '',
        focus_id: activity.focus_id || '',
        area_id: currentArea?.id || '',
        category_id: currentCategory?.id || ''
      });
      setError(null);
      setConflictWarning(null);
    }
  }, [activity, focuses, areas, categories]);

  // Check for potential conflicts when title or focus changes
  useEffect(() => {
    const checkConflict = async () => {
      if (!formData.title.trim() || !formData.focus_id || !activity) {
        setConflictWarning(null);
        return;
      }

      // Skip check if nothing changed
      if (formData.title === activity.title && formData.focus_id === activity.focus_id) {
        setConflictWarning(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('rd_research_activities')
          .select('id, title')
          .eq('title', formData.title.trim())
          .eq('focus_id', formData.focus_id)
          .neq('id', activity.id)
          .limit(1);

        if (error) {
          console.error('Error checking for conflicts:', error);
          return;
        }

        if (data && data.length > 0) {
          const currentFocus = focuses.find(f => f.id === formData.focus_id);
          setConflictWarning(
            `An activity with the title "${formData.title}" already exists in the "${currentFocus?.name}" focus. Please choose a different title or focus.`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.error('Error checking for conflicts:', err);
      }
    };

    const timeoutId = setTimeout(checkConflict, 500); // Debounce the check
    return () => clearTimeout(timeoutId);
  }, [formData.title, formData.focus_id, activity, focuses]);

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      area_id: '',
      focus_id: ''
    }));
  };

  const handleAreaChange = (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      area_id: areaId,
      focus_id: ''
    }));
  };

  const handleFocusChange = (focusId: string) => {
    setFormData(prev => ({
      ...prev,
      focus_id: focusId
    }));
  };

  const availableAreas = formData.category_id 
    ? areas.filter(area => area.category_id === formData.category_id)
    : [];

  const availableFocuses = formData.area_id 
    ? focuses.filter(focus => focus.area_id === formData.area_id)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity || !formData.title.trim() || !formData.focus_id) {
      setError('Please fill in all required fields');
      return;
    }

    if (conflictWarning) {
      setError('Please resolve the conflict before saving');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('rd_research_activities')
        .update({
          title: formData.title.trim(),
          focus_id: formData.focus_id
        })
        .eq('id', activity.id);

      if (error) throw error;

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error updating activity:', err);
      
      // Handle specific database errors
      if (err.code === '23505' && err.details?.includes('unique_activity_per_focus')) {
        const focusName = focuses.find(f => f.id === formData.focus_id)?.name || 'this focus';
        setError(
          `An activity with the title "${formData.title}" already exists in "${focusName}". Please choose a different title or focus to avoid duplication.`
        );
      } else {
        setError(err.message || 'Failed to update activity');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Research Activity</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {conflictWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">{conflictWarning}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter activity title..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  conflictWarning ? 'border-yellow-300' : 'border-gray-300'
                }`}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select category...</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <select
                value={formData.area_id}
                onChange={(e) => handleAreaChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.category_id}
              >
                <option value="">Select area...</option>
                {availableAreas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              {!formData.category_id && (
                <p className="text-xs text-gray-500 mt-1">Select a category first</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Focus *
              </label>
              <select
                value={formData.focus_id}
                onChange={(e) => handleFocusChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  conflictWarning ? 'border-yellow-300' : 'border-gray-300'
                }`}
                required
                disabled={!formData.area_id}
              >
                <option value="">Select focus...</option>
                {availableFocuses.map(focus => (
                  <option key={focus.id} value={focus.id}>
                    {focus.name}
                  </option>
                ))}
              </select>
              {!formData.area_id && (
                <p className="text-xs text-gray-500 mt-1">Select an area first</p>
              )}
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
              disabled={loading || !formData.title.trim() || !formData.focus_id || !!conflictWarning}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Activity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditActivityModal; 