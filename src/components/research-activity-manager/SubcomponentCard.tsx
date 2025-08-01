import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save, Undo, Move, Archive, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { SubcomponentCardProps } from './types';
import { ResearchActivitiesService } from '../../modules/tax-calculator/services/researchActivitiesService';

const SubcomponentCard: React.FC<SubcomponentCardProps> = ({
  subcomponent,
  stepId,
  onEdit,
  onMove,
  onDeactivate,
  onRefresh
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editableData, setEditableData] = useState({
    name: subcomponent.name || '',
    description: subcomponent.description || '',
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: subcomponent.id,
    data: {
      type: 'subcomponent',
      subcomponent,
      stepId
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  useEffect(() => {
    // Reset editable data when subcomponent changes
    setEditableData({
      name: subcomponent.name || '',
      description: subcomponent.description || '',
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
    setHasChanges(false);
  }, [subcomponent]);

  const handleFieldChange = (field: string, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await ResearchActivitiesService.updateResearchSubcomponent(subcomponent.id, {
        ...editableData,
        step_id: subcomponent.step_id,
        subcomponent_order: subcomponent.subcomponent_order,
        is_active: subcomponent.is_active
      });
      setHasChanges(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating subcomponent:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditableData({
      name: subcomponent.name || '',
      description: subcomponent.description || '',
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
    setHasChanges(false);
  };

  const EditableField: React.FC<{
    label: string;
    field: keyof typeof editableData;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
  }> = ({ label, field, multiline = false, rows = 2, placeholder }) => (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      {multiline ? (
        <textarea
          value={editableData[field]}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          rows={rows}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      ) : (
        <input
          type="text"
          value={editableData[field]}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      )}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white border border-gray-200 rounded-lg shadow-sm
        hover:shadow-md transition-shadow duration-200
        ${isDragging ? 'z-50' : ''}
        ${!subcomponent.is_active ? 'opacity-60 bg-gray-50' : ''}
        ${hasChanges ? 'border-blue-300 shadow-blue-100' : ''}
      `}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        {/* Top row with controls and status badges */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Status badges */}
            {!subcomponent.is_active && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                Inactive
              </span>
            )}

            {hasChanges && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                Modified
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {hasChanges && (
              <>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Reset changes"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="Save changes"
                >
                  <Save className="w-4 h-4" />
                </button>
              </>
            )}
            
            <button
              onClick={() => onMove(subcomponent.id, stepId)}
              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Move to another step"
            >
              <Move className="w-4 h-4" />
            </button>

            {subcomponent.is_active && (
              <button
                onClick={() => onDeactivate(subcomponent)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Deactivate subcomponent"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Full-width title field */}
        <div className="w-full">
          <input
            type="text"
            value={editableData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Subcomponent name..."
            className="w-full px-2 py-2 text-base font-medium bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Basic Description */}
          <EditableField 
            label="Description" 
            field="description" 
            multiline 
            rows={2}
            placeholder="Brief description of this subcomponent..."
          />

          {/* Research Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Research Context</h4>
              <EditableField 
                label="General Description" 
                field="general_description" 
                multiline 
                rows={3}
              />
              <EditableField 
                label="Hint" 
                field="hint" 
                multiline 
                rows={2}
              />
              <EditableField 
                label="Goal" 
                field="goal" 
                multiline 
                rows={2}
              />
              <EditableField 
                label="Primary Goal" 
                field="primary_goal" 
                multiline 
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Research Methodology</h4>
              <EditableField 
                label="Hypothesis" 
                field="hypothesis" 
                multiline 
                rows={3}
              />
              <EditableField 
                label="Alternatives" 
                field="alternatives" 
                multiline 
                rows={2}
              />
              <EditableField 
                label="Uncertainties" 
                field="uncertainties" 
                multiline 
                rows={2}
              />
              <EditableField 
                label="Developmental Process" 
                field="developmental_process" 
                multiline 
                rows={2}
              />
            </div>
          </div>

          {/* Outcomes and Codes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Expected Outcomes</h4>
              <EditableField 
                label="Expected Outcome Type" 
                field="expected_outcome_type"
              />
              <EditableField 
                label="Alternative Paths" 
                field="alternative_paths" 
                multiline 
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Procedure Codes</h4>
              <EditableField 
                label="CPT Codes" 
                field="cpt_codes"
                placeholder="e.g., 12345, 67890"
              />
              <EditableField 
                label="CDT Codes" 
                field="cdt_codes"
                placeholder="e.g., D1234, D5678"
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Order: {subcomponent.subcomponent_order}</span>
              {subcomponent.deactivated_at && (
                <span>Deactivated: {new Date(subcomponent.deactivated_at).toLocaleDateString()}</span>
              )}
              <span>Last updated: {new Date(subcomponent.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubcomponentCard; 