import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Archive, 
  Plus,
  Building,
  Calendar,
  FileText,
  Users,
  GripVertical,
  Lock,
  Unlock
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
  dragDisabled = false,
  onToggleExpanded,
  onEdit,
  onDeactivate,
  onRefresh,
  onEditStep,
  onAddStep,
  onEditSubcomponent,
  onMoveSubcomponent,
  onUpdateStepPercentages,
  onMoveStepUp,
  onMoveStepDown
}) => {
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showAddSubcomponentModal, setShowAddSubcomponentModal] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string>('');
  const [timePercentageLocked, setTimePercentageLocked] = useState(activity.time_percentage_locked || false);
  const [isUpdatingLock, setIsUpdatingLock] = useState(false);
  const [hasAutoAllocated, setHasAutoAllocated] = useState(false);

  // Auto-allocate time percentages when activity steps are first loaded
  useEffect(() => {
    const autoAllocateTimePercentages = async () => {
      if (!activity.steps || activity.steps.length === 0 || hasAutoAllocated) return;
      
      const activeSteps = activity.steps.filter(s => s.is_active);
      if (activeSteps.length === 0) return;
      
      // Check if any steps already have time percentages set
      const hasExistingPercentages = activeSteps.some(s => (s.default_time_percentage || 0) > 0);
      if (hasExistingPercentages) {
        setHasAutoAllocated(true);
        return;
      }
      
      // Calculate equal percentages for all active steps
      const equalPercentage = 100 / activeSteps.length;
      
      try {
        // Set equal time percentages for all active steps
        for (let i = 0; i < activeSteps.length; i++) {
          const step = activeSteps[i];
          await ResearchActivitiesService.updateResearchStepTimePercentage(step.id, equalPercentage);
          // No delay for faster loading
        }
        
        setHasAutoAllocated(true);
        
        // Quick refresh to show updated percentages
        setTimeout(() => {
          onRefresh();
        }, 50);
      } catch (error) {
        console.error('Error auto-allocating time percentages:', error);
      }
    };

    autoAllocateTimePercentages();
  }, [activity.steps, hasAutoAllocated, onRefresh]);

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

  // Handle time percentage lock toggle
  const handleToggleTimePercentageLock = async () => {
    setIsUpdatingLock(true);
    try {
      const newLockState = !timePercentageLocked;
      await ResearchActivitiesService.updateResearchActivity(activity.id, {
        time_percentage_locked: newLockState
      });
      setTimePercentageLocked(newLockState);
      onRefresh(); // Refresh to update the activity data
    } catch (error) {
      console.error('Error updating time percentage lock:', error);
    } finally {
      setIsUpdatingLock(false);
    }
  };

  // Handle time percentage change for steps with automatic rebalancing
  const handleStepTimePercentageChange = async (stepId: string, newPercentage: number) => {
    try {
      // Get all active steps for this activity
      const activeSteps = activity.steps?.filter(s => s.is_active) || [];
      const targetStep = activeSteps.find(s => s.id === stepId);
      const otherSteps = activeSteps.filter(s => s.id !== stepId);
      
      // Prepare optimistic updates
      const stepUpdates: { stepId: string; newPercentage: number }[] = [];
      
      if (!targetStep || otherSteps.length === 0) {
        // If no other steps to rebalance, just update this step
        stepUpdates.push({ stepId, newPercentage });
      } else {
        // Calculate current total of other steps
        const currentOtherTotal = otherSteps.reduce((sum, step) => sum + (step.default_time_percentage || 0), 0);
        const currentTargetPercentage = targetStep.default_time_percentage || 0;
        
        // Calculate current total and available room
        const currentTotal = currentTargetPercentage + currentOtherTotal;
        const availableRoom = 100 - currentTotal;
        const percentageChange = newPercentage - currentTargetPercentage;
        
        // If increasing the target step
        if (percentageChange > 0) {
          // First, use any available room (under-allocated space)
          const roomToUse = Math.min(percentageChange, availableRoom);
          const remainingIncrease = percentageChange - roomToUse;
          
          if (remainingIncrease <= 0) {
            // We can accommodate the full increase with available room
            stepUpdates.push({ stepId, newPercentage });
          } else {
            // We need to reduce other steps for the remaining increase
            if (currentOtherTotal > 0) {
              // Calculate how much we need to take from other steps
              const reductionNeeded = Math.min(remainingIncrease, currentOtherTotal);
              const reductionRatio = reductionNeeded / currentOtherTotal;
              
              // Cap the new percentage if we can't get enough from other steps
              const actualNewPercentage = currentTargetPercentage + roomToUse + reductionNeeded;
              stepUpdates.push({ stepId, newPercentage: actualNewPercentage });
              
              // Proportionally reduce other steps
              for (const step of otherSteps) {
                const currentStepPercentage = step.default_time_percentage || 0;
                const reduction = currentStepPercentage * reductionRatio;
                const newStepPercentage = Math.max(0, currentStepPercentage - reduction);
                
                if (Math.abs(newStepPercentage - currentStepPercentage) > 0.01) {
                  stepUpdates.push({ stepId: step.id, newPercentage: newStepPercentage });
                }
              }
            } else {
              // No other steps to reduce, cap at current + available room
              stepUpdates.push({ stepId, newPercentage: currentTargetPercentage + roomToUse });
            }
          }
        } else {
          // Decreasing the target step - just update it (creates more available room)
          stepUpdates.push({ stepId, newPercentage });
        }
      }

      // Apply optimistic updates to local state immediately
      if (onUpdateStepPercentages) {
        onUpdateStepPercentages(activity.id, stepUpdates);
      }

      // Update database in background
      for (const update of stepUpdates) {
        await ResearchActivitiesService.updateResearchStepTimePercentage(update.stepId, update.newPercentage);
      }

    } catch (error) {
      console.error('Error updating step time percentage:', error);
      // Revert optimistic update on error by refreshing
      onRefresh();
      throw error;
    }
  };

  // Handle step deletion with time reallocation
  const handleDeleteStep = async (step: ResearchStep) => {
    if (window.confirm(`Are you sure you want to delete the step "${step.name}"? This action cannot be undone.`)) {
      try {
        // Delete the step
        await ResearchActivitiesService.deleteResearchStep(step.id);
        
        // Get remaining active steps after deletion
        const remainingActiveSteps = activity.steps?.filter(s => s.is_active && s.id !== step.id) || [];
        
        // If there are remaining steps, redistribute time percentages equally
        if (remainingActiveSteps.length > 0) {
          const equalPercentage = 100 / remainingActiveSteps.length;
          
          // Update each remaining step with equal percentage
          for (const remainingStep of remainingActiveSteps) {
            await ResearchActivitiesService.updateResearchStepTimePercentage(remainingStep.id, equalPercentage);
          }
        }
        
        onRefresh(); // Refresh to update the activity data
      } catch (error) {
        console.error('Error deleting step:', error);
        alert('Failed to delete step. Please try again.');
      }
    }
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
              {/* Time Percentage Lock Toggle */}
              <button
                onClick={handleToggleTimePercentageLock}
                disabled={isUpdatingLock}
                className={`flex items-center space-x-1 px-3 py-1 text-sm rounded transition-colors ${
                  timePercentageLocked
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
                title={timePercentageLocked ? 'Time percentages are locked' : 'Lock time percentages'}
              >
                {timePercentageLocked ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Unlock className="w-3 h-3" />
                )}
                <span>
                  {isUpdatingLock ? 'Updating...' : (timePercentageLocked ? 'Locked' : 'Unlocked')}
                </span>
              </button>

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
          <div>
            {/* Research Step Time Allocation Header - Research Design Style */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Research Step Time Allocation</h3>
                  <p className="text-blue-100">Allocate time across your research steps. Click to expand and configure subcomponents.</p>
                  {(() => {
                    const activeSteps = activity.steps?.filter(s => s.is_active) || [];
                    const totalPercentage = activeSteps.reduce((sum, step) => sum + (step.default_time_percentage || 0), 0);
                    const isOverAllocated = totalPercentage > 100;
                    const isUnderAllocated = totalPercentage < 100 && activeSteps.length > 0;
                    
                    return (
                      <div className={`mt-2 text-sm font-medium ${
                        isOverAllocated ? 'text-red-200' : 
                        isUnderAllocated ? 'text-yellow-200' : 
                        'text-green-200'
                      }`}>
                        Total: {totalPercentage.toFixed(1)}% 
                        {isOverAllocated && ' (Over-allocated)'}
                        {isUnderAllocated && ' (Under-allocated)'}
                        {totalPercentage === 100 && ' ✓'}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex space-x-2">
                  {(() => {
                    const activeSteps = activity.steps?.filter(s => s.is_active) || [];
                    const totalPercentage = activeSteps.reduce((sum, step) => sum + (step.default_time_percentage || 0), 0);
                    const remainingPercentage = 100 - totalPercentage;
                    
                    return remainingPercentage > 0.1 && (
                      <button
                        onClick={async () => {
                          // Find the step with the highest percentage and add the remaining to it
                          if (activeSteps.length > 0) {
                            const stepWithHighest = activeSteps.reduce((max, step) => 
                              (step.default_time_percentage || 0) > (max.default_time_percentage || 0) ? step : max
                            );
                            const newPercentage = (stepWithHighest.default_time_percentage || 0) + remainingPercentage;
                            try {
                              await handleStepTimePercentageChange(stepWithHighest.id, newPercentage);
                            } catch (error) {
                              console.error('Error filling remaining percentage:', error);
                            }
                          }
                        }}
                        className="px-3 py-2 bg-green-500 bg-opacity-80 hover:bg-opacity-100 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
                        title={`Add remaining ${remainingPercentage.toFixed(1)}% to highest step`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Fill Remaining</span>
                      </button>
                    );
                  })()}
                  
                  <button
                    onClick={async () => {
                      // Auto-calculate equal percentages for all active steps
                      const activeSteps = activity.steps?.filter(s => s.is_active) || [];
                      const equalPercentage = activeSteps.length > 0 ? 100 / activeSteps.length : 0;
                      
                      // Process steps sequentially to avoid conflicts
                      for (const step of activeSteps) {
                        try {
                          await handleStepTimePercentageChange(step.id, equalPercentage);
                        } catch (error) {
                          console.error('Error auto-calculating step percentage:', error);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
                    title="Force recalculate all time percentages with equal distribution"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Force Recalculate</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
              {activity.steps && activity.steps.length > 0 ? (
                <>
                  {/* Active Steps */}
                  <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
                  {sortedActiveSteps.map((step, index) => (
                    <SortableStepCard
                      key={step.id}
                      step={{
                        ...step,
                        expanded: expandedSteps.has(step.id)
                      }}
                      dragDisabled={dragDisabled}
                      activityId={activity.id}
                      businessId={businessId}
                      activityTimePercentageLocked={timePercentageLocked}
                      activitySteps={activity.steps}
                      stepNumber={index + 1} // Calculate step number from position
                      onToggleExpanded={handleToggleStepExpanded}
                      onEdit={handleEditStep}
                      onDeactivate={handleDeactivateStep}
                      onDeleteStep={handleDeleteStep}
                      onAddSubcomponent={handleAddSubcomponent}
                      onTimePercentageChange={handleStepTimePercentageChange}
                      onMoveStepUp={onMoveStepUp}
                      onMoveStepDown={onMoveStepDown}
                      onRefresh={onRefresh}
                    />
                  ))}
                  </SortableContext>

                  {/* Inactive Steps */}
                  {sortedInactiveSteps.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 mb-3">Inactive Steps</h4>
                      {sortedInactiveSteps.map((step, index) => (
                        <StepCard
                          key={step.id}
                          step={{
                            ...step,
                            expanded: expandedSteps.has(step.id)
                          }}
                          activityId={activity.id}
                          businessId={businessId}
                          activityTimePercentageLocked={timePercentageLocked}
                          activitySteps={activity.steps}
                          stepNumber={sortedActiveSteps.length + index + 1} // Continue numbering after active steps
                          onToggleExpanded={handleToggleStepExpanded}
                          onEdit={handleEditStep}
                          onDeactivate={handleDeactivateStep}
                          onDeleteStep={handleDeleteStep}
                          onAddSubcomponent={handleAddSubcomponent}
                          onEditSubcomponent={onEditSubcomponent}
                          onMoveSubcomponent={onMoveSubcomponent}
                          onTimePercentageChange={handleStepTimePercentageChange}
                          onMoveStepUp={onMoveStepUp}
                          onMoveStepDown={onMoveStepDown}
                          onRefresh={onRefresh}
                        />
                      ))}
                    </div>
                  )}
                </>
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
const SortableStepCard = ({ step, dragDisabled, ...props }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: step.id,
    disabled: dragDisabled, // Disable sorting when dragDisabled is true
    data: {
      type: 'step',
      stepId: step.id,
      activityId: step.research_activity_id
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
        {...(dragDisabled ? {} : attributes)}
        {...(dragDisabled ? {} : listeners)}
        className={`absolute left-2 top-4 z-10 transition-colors touch-none ${
          dragDisabled 
            ? 'cursor-not-allowed text-gray-300 opacity-50' 
            : 'cursor-move text-gray-400 hover:text-gray-600'
        }`}
        title={dragDisabled ? "Drag temporarily disabled" : "Drag to reorder"}
        onMouseDown={(e) => {
          if (dragDisabled) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚨 [DRAG HANDLE] Mouse down prevented - drag disabled');
            return;
          }
          // Only start drag if clicking directly on the drag handle
          console.log('🔧 [DRAG HANDLE] Mouse down on drag handle');
        }}
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