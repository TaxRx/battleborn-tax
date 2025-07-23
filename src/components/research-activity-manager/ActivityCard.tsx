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
  Users
} from 'lucide-react';
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
  onRefresh
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
    setShowAddStepModal(true);
  };

  const handleEditStep = (step: any) => {
    // This would open a step edit modal
    console.log('Edit step:', step);
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

  const handleEditSubcomponent = (subcomponent: any) => {
    // This would open a subcomponent edit modal
    console.log('Edit subcomponent:', subcomponent);
  };

  const handleMoveSubcomponent = (subcomponentId: string, fromStepId: string) => {
    // This would open a move subcomponent modal
    console.log('Move subcomponent:', subcomponentId, 'from step:', fromStepId);
  };

  const activeSteps = activity.steps?.filter(step => step.is_active) || [];
  const inactiveSteps = activity.steps?.filter(step => !step.is_active) || [];

  return (
    <div className={`border border-gray-200 rounded-lg mb-6 ${!activity.is_active ? 'opacity-60 bg-gray-50' : 'bg-white'} shadow-sm`}>
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
                <h2 className={`text-lg font-bold ${!activity.is_active ? 'text-gray-500' : 'text-gray-900'}`}>
                  {activity.title}
                </h2>
                {!activity.is_active && (
                  <span className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-full">
                    Inactive
                  </span>
                )}
                {activity.business_id && (
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-full flex items-center space-x-1">
                    <Building className="w-3 h-3" />
                    <span>Business-Specific</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                {activity.focus && (
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>Focus: {activity.focus}</span>
                  </div>
                )}
                {activity.category && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>Category: {activity.category}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{activity.steps?.length || 0} steps</span>
                </div>
                {activity.deactivated_at && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Deactivated: {new Date(activity.deactivated_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddStep}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Add step"
            >
              <Plus className="w-4 h-4" />
              <span>Add Step</span>
            </button>

            <button
              onClick={() => onEdit(activity)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit activity"
            >
              <Edit className="w-5 h-5" />
            </button>

            <button
              onClick={() => onDuplicate(activity)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Duplicate activity"
            >
              <Copy className="w-5 h-5" />
            </button>

            {activity.is_active && (
              <button
                onClick={() => onDeactivate(activity)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Deactivate activity"
              >
                <Archive className="w-5 h-5" />
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
              {activeSteps.map((step) => (
                <StepCard
                  key={step.id}
                  step={{...step, expanded: expandedSteps.has(step.id)}}
                  activityId={activity.id}
                  businessId={businessId}
                  onToggleExpanded={handleToggleStepExpanded}
                  onEdit={handleEditStep}
                  onDeactivate={handleDeactivateStep}
                  onAddSubcomponent={handleAddSubcomponent}
                  onEditSubcomponent={handleEditSubcomponent}
                  onMoveSubcomponent={handleMoveSubcomponent}
                  onRefresh={onRefresh}
                />
              ))}

              {/* Inactive Steps (if any) */}
              {inactiveSteps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-500 mb-4">Inactive Steps</h4>
                  {inactiveSteps.map((step) => (
                    <StepCard
                      key={step.id}
                      step={{...step, expanded: expandedSteps.has(step.id)}}
                      activityId={activity.id}
                      businessId={businessId}
                      onToggleExpanded={handleToggleStepExpanded}
                      onEdit={handleEditStep}
                      onDeactivate={handleDeactivateStep}
                      onAddSubcomponent={handleAddSubcomponent}
                      onEditSubcomponent={handleEditSubcomponent}
                      onMoveSubcomponent={handleMoveSubcomponent}
                      onRefresh={onRefresh}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No steps yet</p>
              <p className="text-sm mb-4">Steps define the research phases for this activity</p>
              <button
                onClick={handleAddStep}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Step</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Step Modal */}
      <AddStepModal
        isOpen={showAddStepModal}
        activityId={activity.id}
        businessId={businessId}
        existingSteps={activity.steps}
        onClose={() => setShowAddStepModal(false)}
        onSuccess={() => {
          setShowAddStepModal(false);
          onRefresh();
        }}
      />

      {/* Add Subcomponent Modal */}
      <AddSubcomponentModal
        isOpen={showAddSubcomponentModal}
        stepId={selectedStepId}
        businessId={businessId}
        existingSubcomponents={activity.steps?.find(s => s.id === selectedStepId)?.subcomponents || []}
        onClose={() => setShowAddSubcomponentModal(false)}
        onSuccess={() => {
          setShowAddSubcomponentModal(false);
          onRefresh();
        }}
      />
    </div>
  );
};

export default ActivityCard; 