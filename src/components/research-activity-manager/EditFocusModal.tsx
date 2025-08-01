import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Info, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditFocusModalProps {
  isOpen: boolean;
  focus: { id: string; name: string; area_id: string; } | null;
  onClose: () => void;
  onSave: () => void;
  categories: Array<{ id: string; name: string; }>;
  areas: Array<{ id: string; name: string; category_id: string; }>;
}

interface AffectedBusinessYear {
  id: string;
  business_name: string;
  year: number;
  activity_count: number;
}

const EditFocusModal: React.FC<EditFocusModalProps> = ({
  isOpen,
  focus,
  onClose,
  onSave,
  categories,
  areas
}) => {
  const [formData, setFormData] = useState({
    name: '',
    area_id: '',
    category_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [impactWarning, setImpactWarning] = useState<number>(0);
  const [affectedBusinessYears, setAffectedBusinessYears] = useState<AffectedBusinessYear[]>([]);
  const [updateSnapshots, setUpdateSnapshots] = useState(false);

  useEffect(() => {
    if (focus) {
      const currentArea = areas.find(a => a.id === focus.area_id);
      const currentCategory = currentArea ? categories.find(c => c.id === currentArea.category_id) : null;

      setFormData({
        name: focus.name,
        area_id: focus.area_id,
        category_id: currentCategory?.id || ''
      });
      setError(null);
      setConflictWarning(null);
      checkImpact();
      checkAffectedBusinessYears();
    }
  }, [focus, areas, categories]);

  // Check impact of changing focus area
  const checkImpact = async () => {
    if (!focus) return;
    
    try {
      const { data, error } = await supabase
        .from('rd_research_activities')
        .select('id')
        .eq('focus_id', focus.id);

      if (error) {
        console.error('Error checking focus impact:', error);
        return;
      }

      setImpactWarning(data?.length || 0);
    } catch (err) {
      console.error('Error checking focus impact:', err);
    }
  };

  // Check which business years have snapshots that will be affected
  const checkAffectedBusinessYears = async () => {
    if (!focus) return;

    try {
      const { data, error } = await supabase
        .from('rd_selected_activities')
        .select(`
          business_year_id,
          activity_focus_snapshot,
          rd_business_years!inner(
            id,
            year,
            rd_businesses!inner(
              name
            )
          )
        `)
        .eq('activity_focus_snapshot', focus.name);

      if (error) {
        console.error('Error checking affected business years:', error);
        return;
      }

      // Group by business year and count activities
      const groupedData = data?.reduce((acc, item) => {
        const yearKey = `${item.business_year_id}`;
        if (!acc[yearKey]) {
          acc[yearKey] = {
            id: item.business_year_id,
            business_name: item.rd_business_years.rd_businesses.name,
            year: item.rd_business_years.year,
            activity_count: 0
          };
        }
        acc[yearKey].activity_count++;
        return acc;
      }, {} as Record<string, AffectedBusinessYear>);

      setAffectedBusinessYears(Object.values(groupedData || {}));
    } catch (err) {
      console.error('Error checking affected business years:', err);
    }
  };

  // Check for naming conflicts when area changes
  useEffect(() => {
    const checkConflict = async () => {
      if (!formData.name.trim() || !formData.area_id || !focus) {
        setConflictWarning(null);
        return;
      }

      // Skip check if nothing changed
      if (formData.name === focus.name && formData.area_id === focus.area_id) {
        setConflictWarning(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('rd_focuses')
          .select('id, name')
          .eq('name', formData.name.trim())
          .eq('area_id', formData.area_id)
          .neq('id', focus.id)
          .limit(1);

        if (error) {
          console.error('Error checking for conflicts:', error);
          return;
        }

        if (data && data.length > 0) {
          const currentArea = areas.find(a => a.id === formData.area_id);
          setConflictWarning(
            `A focus with the name "${formData.name}" already exists in the "${currentArea?.name}" area. Please choose a different name or area.`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.error('Error checking for conflicts:', err);
      }
    };

    const timeoutId = setTimeout(checkConflict, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.name, formData.area_id, focus, areas]);

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      area_id: ''
    }));
  };

  const handleAreaChange = (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      area_id: areaId
    }));
  };

  const availableAreas = formData.category_id 
    ? areas.filter(area => area.category_id === formData.category_id)
    : areas;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focus || !formData.name.trim() || !formData.area_id) {
      setError('Please fill in all required fields');
      return;
    }

    if (conflictWarning) {
      setError('Please resolve the naming conflict before saving');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the focus
      const { error: focusError } = await supabase
        .from('rd_focuses')
        .update({
          name: formData.name.trim(),
          area_id: formData.area_id
        })
        .eq('id', focus.id);

      if (focusError) throw focusError;

      // Optionally update snapshots if requested
      if (updateSnapshots && affectedBusinessYears.length > 0) {
        const newArea = areas.find(a => a.id === formData.area_id);
        const newCategory = newArea ? categories.find(c => c.id === newArea.category_id) : null;

        // Update snapshots for affected business years
        const { error: snapshotError } = await supabase
          .from('rd_selected_activities')
          .update({
            activity_focus_snapshot: formData.name.trim(),
            activity_area_snapshot: newArea?.name || '',
            activity_category_snapshot: newCategory?.name || ''
          })
          .eq('activity_focus_snapshot', focus.name);

        if (snapshotError) {
          console.error('Error updating snapshots:', snapshotError);
          // Don't fail the whole operation if snapshot update fails
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error updating focus:', err);
      
      if (err.code === '23505') {
        const areaName = areas.find(a => a.id === formData.area_id)?.name || 'this area';
        setError(
          `A focus with the name "${formData.name}" already exists in "${areaName}". Please choose a different name or area to avoid duplication.`
        );
      } else {
        setError(err.message || 'Failed to update focus');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !focus) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Focus</h2>
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

            {impactWarning > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex">
                  <Info className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Research Activities Impact</p>
                    <p>This focus is currently used by {impactWarning} research {impactWarning === 1 ? 'activity' : 'activities'}. The master hierarchy will be updated, but existing reports will continue to use their snapshot data.</p>
                  </div>
                </div>
              </div>
            )}

            {affectedBusinessYears.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <div className="flex">
                  <Calendar className="w-5 h-5 text-orange-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-700 flex-1">
                    <p className="font-medium mb-2">Protected Business Year Reports</p>
                    <p className="mb-3">
                      The following business years have snapshot data for this focus. Their reports are protected and will continue to show the original hierarchy:
                    </p>
                    <div className="space-y-1 mb-3">
                      {affectedBusinessYears.map(year => (
                        <div key={year.id} className="text-xs bg-orange-100 px-2 py-1 rounded">
                          {year.business_name} ({year.year}) - {year.activity_count} activities
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={updateSnapshots}
                        onChange={(e) => setUpdateSnapshots(e.target.checked)}
                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-xs">
                        Also update snapshots to new hierarchy (will change historical reports)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Focus Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter focus name..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  conflictWarning ? 'border-yellow-300' : 'border-gray-300'
                }`}
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
              disabled={loading || !formData.name.trim() || !formData.area_id || !!conflictWarning}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Focus'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFocusModal; 