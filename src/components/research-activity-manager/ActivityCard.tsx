import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Copy, 
  Archive, 
  Plus,
  Building,
  Calendar,
  FileText,
  Users,
  GripVertical
} from 'lucide-react';
import { 
  useSortable,
  SortableContext,
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActivityCardProps } from './types';
import StepCard from './StepCard';
import { ResearchActivitiesService } from '../../modules/tax-calculator/services/researchActivitiesService';
import AddStepModal from './AddStepModal';
import AddSubcomponentModal from './AddSubcomponentModal';

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  businessId,
  onToggleExpanded,
  onEdit,
  onDuplicate,
  onDeactivate,
  onRefresh,
  onEditStep,
  onAddStep
}) => {
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showAddSubcomponentModal, setShowAddSubcomponentModal] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string>('');

  const handleToggleStepExpanded = (stepId: string) => {
    console.log('Toggle step expanded:', stepId);
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const handleAddStep = () => {
    if (onAddStep) {
      onAddStep(activity.id);
    } else {
      setShowAddStepModal(true);
    }
  };

  const handleEditStep = (step: any) => {
    if (onEditStep) {
      onEditStep(step, activity.id);
    } else {
      console.log('Edit step:', step);
    }
  };

  const handleDeactivateStep = async (step: any) => {
    try {
      await ResearchActivitiesService.deactivateResearchStep(step.id, 'Deactivated via UI');
      onRefresh();
    } catch (error) {
      console.error('Error deactivating step:', error);
    }
  };

  const handleAddSubcomponent = (stepId: string) => {
    setSelectedStepId(stepId);
    setShowAddSubcomponentModal(true);
  };

  const activeSteps = (activity.steps || []).filter(step => step.is_active);
  const inactiveSteps = (activity.steps || []).filter(step => !step.is_active);

  // Sort steps by step_order
  const sortedActiveSteps = [...activeSteps].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
  const sortedInactiveSteps = [...inactiveSteps].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));

  // Create step IDs array for drag and drop
  const stepIds = sortedActiveSteps.map(step => step.id);

  return (
    <>
      <div className={`border border-gray-200 rounded-lg mb-6 ${!activity.is_active ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
        {/* Activity Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <button
                onClick={() => onToggleExpanded(activity.id)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {activity.expanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className={`text-xl font-semibold ${!activity.is_active ? 'text-gray-500' : 'text-gray-900'}`}>
                    {activity.title}
                  </h2>
                  {!activity.is_active && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>{activity.focus_name || 'No focus'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{activity.steps?.length || 0} steps</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{activity.steps?.reduce((acc, step) => acc + (step.subcomponents?.length || 0), 0) || 0} subcomponents</span>
                  </span>
                  {activity.deactivated_at && (
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Deactivated: {new Date(activity.deactivated_at).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>

                {activity.general_description && (
                  <p className={`mt-2 text-sm ${!activity.is_active ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.general_description}
                  </p>
                )}
              </div>
            </div>

            {/* Activity Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddStep}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                title="Add step"
              >
                <Plus className="w-3 h-3" />
                <span>Add Step</span>
              </button>

              <button
                onClick={() => onEdit(activity)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit activity"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => onDuplicate(activity)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Duplicate activity"
              >
                <Copy className="w-4 h-4" />
              </button>

              {activity.is_active && (
                <button
                  onClick={() => onDeactivate(activity)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Deactivate activity"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Steps List (when expanded) */}
        {activity.expanded && (
          <div className="p-6">
            {activity.steps && activity.steps.length > 0 ? (
              <div className="space-y-4">
                {/* Active Steps */}
                <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
                  {sortedActiveSteps.map((step) => (
                    <SortableStepCard
                      key={step.id}
                      step={{
                        ...step,
                        expanded: expandedSteps.has(step.id)
                      }}
                      activityId={activity.id}
                      businessId={businessId}
                      onToggleExpanded={handleToggleStepExpanded}
                      onEdit={handleEditStep}
                      onDeactivate={handleDeactivateStep}
                      onAddSubcomponent={handleAddSubcomponent}
                      onRefresh={onRefresh}
                    />
                  ))}
                </SortableContext>

                {/* Inactive Steps */}
                {sortedInactiveSteps.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Inactive Steps</h4>
                    {sortedInactiveSteps.map((step) => (
                      <StepCard
                        key={step.id}
                        step={{
                          ...step,
                          expanded: expandedSteps.has(step.id)
                        }}
                        activityId={activity.id}
                        businessId={businessId}
                        onToggleExpanded={handleToggleStepExpanded}
                        onEdit={handleEditStep}
                        onDeactivate={handleDeactivateStep}
                        onAddSubcomponent={handleAddSubcomponent}
                        onEditSubcomponent={() => {}}
                        onMoveSubcomponent={() => {}}
                        onRefresh={onRefresh}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No steps yet</p>
                <button
                  onClick={handleAddStep}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Add the first step
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddStepModal
        isOpen={showAddStepModal}
        onClose={() => setShowAddStepModal(false)}
        onSuccess={() => {
          setShowAddStepModal(false);
          onRefresh();
        }}
        activityId={activity.id}
      />

      <AddSubcomponentModal
        isOpen={showAddSubcomponentModal}
        onClose={() => setShowAddSubcomponentModal(false)}
        onSuccess={() => {
          setShowAddSubcomponentModal(false);
          onRefresh();
        }}
        stepId={selectedStepId}
      />
    </>
  );
};

// Sortable wrapper for step cards
const SortableStepCard = ({ step, ...props }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: step.id,
    data: {
      type: 'step',
      step: step
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-4 z-10 cursor-move text-gray-400 hover:text-gray-600 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      {/* Add left margin to accommodate drag handle */}
      <div className="ml-8">
        <StepCard step={step} {...props} />
      </div>
    </div>
  );
};

export default ActivityCard; 