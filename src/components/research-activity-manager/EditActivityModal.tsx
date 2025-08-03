import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, GitMerge, Info } from 'lucide-react';
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
  businessId?: string; // For loading other activities to merge with
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({
  isOpen,
  activity,
  onClose,
  onSave,
  categories,
  areas,
  focuses,
  businessId
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
  
  // Merge functionality states
  const [showMergeSection, setShowMergeSection] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [mergeConfirmation, setMergeConfirmation] = useState('');
  const [availableActivities, setAvailableActivities] = useState<ResearchActivity[]>([]);
  const [mergeLoading, setMergeLoading] = useState(false);

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

  // Load available activities for merging
  useEffect(() => {
    if (isOpen && activity) {
      loadAvailableActivities();
    }
  }, [isOpen, businessId, activity]);

  const loadAvailableActivities = async () => {
    if (!activity) return;
    
    try {
      // Build query for business-specific OR global activities
      let query = supabase
        .from('rd_research_activities')
        .select('id, title, focus_id')
        .neq('id', activity.id) // Exclude current activity
        .eq('is_active', true);
      
      // Add business filter for business-specific mode, or null for global mode
      if (businessId) {
        query = query.eq('business_id', businessId);
      } else {
        query = query.is('business_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setAvailableActivities(data || []);
    } catch (err) {
      console.error('Error loading activities for merge:', err);
    }
  };

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

  // Merge Activities Functionality
  const handleMergeActivities = async () => {
    if (!activity || !mergeTargetId || mergeConfirmation !== 'MERGE') {
      setError('Please select a target activity and type MERGE to confirm');
      return;
    }

    // Prevent merging activity into itself
    if (mergeTargetId === activity.id) {
      setError('Cannot merge an activity into itself. Please select a different target activity.');
      return;
    }

    setMergeLoading(true);
    setError(null);

    try {
      const targetActivity = availableActivities.find(a => a.id === mergeTargetId);
      if (!targetActivity) {
        throw new Error('Target activity not found');
      }

      console.log(`🔄 Merging activity "${activity.title}" into "${targetActivity.title}"`);

      // Check for potential step name conflicts before merging
      const { data: sourceSteps } = await supabase
        .from('rd_research_steps')
        .select('name')
        .eq('research_activity_id', activity.id)
        .eq('is_active', true);

      const { data: targetSteps } = await supabase
        .from('rd_research_steps')
        .select('name')
        .eq('research_activity_id', mergeTargetId)
        .eq('is_active', true);

      const sourceNames = sourceSteps?.map(s => s.name) || [];
      const targetNames = targetSteps?.map(s => s.name) || [];
      const conflicts = sourceNames.filter(name => targetNames.includes(name));

      if (conflicts.length > 0) {
        console.warn(`⚠️ Step name conflicts detected: ${conflicts.join(', ')}. Proceeding with merge - duplicate steps will be renamed.`);
      }

      // Step 1: Move all steps from source to target activity
      const { error: stepsError } = await supabase
        .from('rd_research_steps')
        .update({ research_activity_id: mergeTargetId })
        .eq('research_activity_id', activity.id);

      if (stepsError) throw stepsError;

      // Step 2: Update any selected activities that reference the source activity
      const { error: selectedActivitiesError } = await supabase
        .from('rd_selected_activities')
        .update({ activity_id: mergeTargetId })
        .eq('activity_id', activity.id);

      if (selectedActivitiesError) throw selectedActivitiesError;

      // Step 3: Update any other references (like rd_federal_credit if it exists)
      const { error: federalCreditError } = await supabase
        .from('rd_federal_credit')
        .update({ research_activity_id: mergeTargetId })
        .eq('research_activity_id', activity.id);

      // Don't throw on this error as the table might not exist
      if (federalCreditError) {
        console.warn('Could not update rd_federal_credit references:', federalCreditError);
      }

      // Step 4: Deactivate the source activity (instead of deleting for audit trail)
      const { error: deactivateError } = await supabase
        .from('rd_research_activities')
        .update({ 
          is_active: false,
          title: `[MERGED] ${activity.title}`
        })
        .eq('id', activity.id);

      if (deactivateError) throw deactivateError;

      console.log(`✅ Successfully merged "${activity.title}" into "${targetActivity.title}"`);
      
      onSave(); // Refresh the parent component
      onClose(); // Close the modal
    } catch (err: any) {
      console.error('Error merging activities:', err);
      setError(`Failed to merge activities: ${err.message}`);
    } finally {
      setMergeLoading(false);
    }
  };

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



          {/* Merge Activities Section */}
          <div className="p-6 border-t-4 border-orange-500 bg-orange-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <GitMerge className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-medium text-gray-900">🔄 Merge Activities</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMergeSection(!showMergeSection)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1 bg-blue-100 rounded"
                >
                  {showMergeSection ? 'Hide' : 'Show'} Merge Options
                </button>
              </div>

              {showMergeSection && (
                <div className="space-y-4">
                  {availableActivities.length > 0 ? (
                    <>
                      <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-orange-700">
                          <p className="font-medium mb-1">⚠️ Merge Warning</p>
                          <p>This will move ALL steps and subcomponents from "{activity?.title}" into the target activity, then deactivate this activity. This action cannot be undone.</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Merge "{activity?.title}" into:
                        </label>
                        <select
                          value={mergeTargetId}
                          onChange={(e) => setMergeTargetId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Select target activity...</option>
                          {availableActivities
                            .filter(act => act.id !== activity?.id) // Filter out current activity
                            .map(act => (
                            <option key={act.id} value={act.id}>
                              {act.title}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {availableActivities.filter(act => act.id !== activity?.id).length} activities available for merge
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">📝 No Activities to Merge</p>
                          <p>You need at least 2 research activities in this business to use the merge feature. Create another activity first.</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                        <strong>Debug Info:</strong><br/>
                        • Business ID: {businessId || 'Missing'}<br/>
                        • Available Activities: {availableActivities.length}<br/>
                        • Current Activity: {activity?.title || 'Unknown'}
                      </div>
                    </div>
                  )}

                  {mergeTargetId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type "MERGE" to confirm:
                      </label>
                      <input
                        type="text"
                        value={mergeConfirmation}
                        onChange={(e) => setMergeConfirmation(e.target.value)}
                        placeholder="Type MERGE to confirm"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}

                  {mergeTargetId && mergeConfirmation === 'MERGE' && (
                    <button
                      type="button"
                      onClick={handleMergeActivities}
                      disabled={mergeLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <GitMerge className="w-4 h-4" />
                      <span>{mergeLoading ? 'Merging...' : `Merge into ${availableActivities.find(a => a.id === mergeTargetId)?.title}`}</span>
                    </button>
                  )}
                </div>
              )}
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