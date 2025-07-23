import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Archive, 
  Plus,
  Package,
  Calendar
} from 'lucide-react';
import { StepCardProps } from './types';
import SubcomponentCard from './SubcomponentCard';

const StepCard: React.FC<StepCardProps> = ({
  step,
  activityId,
  businessId,
  onToggleExpanded,
  onEdit,
  onDeactivate,
  onAddSubcomponent,
  onEditSubcomponent,
  onMoveSubcomponent,
  onRefresh
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `step-${step.id}`,
    data: {
      type: 'step',
      stepId: step.id
    }
  });

  const subcomponentIds = step.subcomponents?.map(sub => sub.id) || [];
  const activeSubcomponents = step.subcomponents?.filter(sub => sub.is_active) || [];
  const inactiveSubcomponents = step.subcomponents?.filter(sub => !sub.is_active) || [];

  return (
    <div className={`border border-gray-200 rounded-lg mb-4 ${!step.is_active ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
      {/* Step Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <button
              onClick={() => onToggleExpanded(step.id)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {step.expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`font-semibold ${!step.is_active ? 'text-gray-500' : 'text-gray-900'}`}>
                  {step.name}
                </h3>
                {!step.is_active && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              
              {step.description && (
                <p className={`text-sm ${!step.is_active ? 'text-gray-400' : 'text-gray-600'}`}>
                  {step.description}
                </p>
              )}

              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Package className="w-3 h-3" />
                  <span>{step.subcomponents?.length || 0} subcomponents</span>
                </span>
                <span>Order: {step.step_order}</span>
                {step.deactivated_at && (
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Deactivated: {new Date(step.deactivated_at).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Step Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAddSubcomponent(step.id)}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="Add subcomponent"
            >
              <Plus className="w-3 h-3" />
              <span>Add Subcomponent</span>
            </button>

            <button
              onClick={() => onEdit(step)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit step"
            >
              <Edit className="w-4 h-4" />
            </button>

            {step.is_active && (
              <button
                onClick={() => onDeactivate(step)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Deactivate step"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subcomponents List (when expanded) */}
      {step.expanded && (
        <div 
          ref={setNodeRef}
          className={`p-4 min-h-[100px] transition-colors ${isOver ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          {step.subcomponents && step.subcomponents.length > 0 ? (
            <SortableContext items={subcomponentIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {/* Active Subcomponents */}
                {activeSubcomponents.map((subcomponent) => (
                  <SubcomponentCard
                    key={subcomponent.id}
                    subcomponent={subcomponent}
                    stepId={step.id}
                    onEdit={onEditSubcomponent}
                    onMove={onMoveSubcomponent}
                    onDeactivate={async (sub) => {
                      try {
                        await import('../../modules/tax-calculator/services/researchActivitiesService')
                          .then(module => module.ResearchActivitiesService.deactivateResearchSubcomponent(sub.id, 'Deactivated via UI'));
                        onRefresh();
                      } catch (error) {
                        console.error('Error deactivating subcomponent:', error);
                      }
                    }}
                    onRefresh={onRefresh}
                  />
                ))}

                {/* Inactive Subcomponents (if any) */}
                {inactiveSubcomponents.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-500 mb-2">Inactive Subcomponents</h5>
                    {inactiveSubcomponents.map((subcomponent) => (
                      <SubcomponentCard
                        key={subcomponent.id}
                        subcomponent={subcomponent}
                        stepId={step.id}
                        onEdit={onEditSubcomponent}
                        onMove={onMoveSubcomponent}
                        onDeactivate={async () => {}} // Already inactive
                        onRefresh={onRefresh}
                      />
                    ))}
                  </div>
                )}
              </div>
            </SortableContext>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No subcomponents yet</p>
              <button
                onClick={() => onAddSubcomponent(step.id)}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Add the first subcomponent
              </button>
            </div>
          )}

          {/* Drop Zone Indicator */}
          {isOver && (
            <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Drop subcomponent here
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StepCard; 