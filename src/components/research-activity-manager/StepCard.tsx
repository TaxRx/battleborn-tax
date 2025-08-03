import React, { useState, useEffect, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Archive, 
  Plus,
  Package,
  Calendar,
  Percent,
  Save,
  RotateCcw,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  X,
  Check
} from 'lucide-react';
import { StepCardProps } from './types';
import SubcomponentCard from './SubcomponentCard';
import { STEP_COLORS } from '../../types/researchDesign';
import { ResearchActivitiesService } from '../../modules/tax-calculator/services/researchActivitiesService';

// Slider styles for Research Design-style interface
const sliderStyles = `
  .slider-blue::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider-purple::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider-blue::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider-purple::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

const StepCard: React.FC<StepCardProps> = ({
  step,
  activityId,
  businessId,
  activityTimePercentageLocked = false,
  activitySteps = [],
  stepNumber,
  onToggleExpanded,
  onEdit,
  onDeactivate,
  onDeleteStep,
  onAddSubcomponent,
  onEditSubcomponent,
  onMoveSubcomponent,
  onTimePercentageChange,
  onMoveStepUp,
  onMoveStepDown,
  onRefresh
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: step.id, // Use step.id directly to match SortableStepCard
    data: {
      type: 'step',
      stepId: step.id
    }
  });

  // Time percentage state management
  const [timePercentage, setTimePercentage] = useState<number>(step.default_time_percentage || 0);
  const [isEditingPercentage, setIsEditingPercentage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Step name editing state management
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(step.name);
  const [isSavingName, setIsSavingName] = useState(false);

  // Rebalancing state
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceTimeout, setRebalanceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Update edited name when step name changes
  useEffect(() => {
    if (!isEditingName) {
      setEditedName(step.name);
    }
  }, [step.name, isEditingName]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (rebalanceTimeout) {
        clearTimeout(rebalanceTimeout);
      }
    };
  }, [rebalanceTimeout]);

  // Calculate total percentage for this activity
  const totalActivityPercentage = useMemo(() => {
    return activitySteps
      .filter(s => s.is_active)
      .reduce((total, s) => total + (s.default_time_percentage || 0), 0);
  }, [activitySteps]);

  // Calculate remaining percentage available for distribution
  const remainingPercentage = useMemo(() => {
    const otherStepsTotal = activitySteps
      .filter(s => s.is_active && s.id !== step.id)
      .reduce((total, s) => total + (s.default_time_percentage || 0), 0);
    return 100 - otherStepsTotal;
  }, [activitySteps, step.id]);

  // Update local state when step prop changes
  useEffect(() => {
    setTimePercentage(step.default_time_percentage || 0);
  }, [step.default_time_percentage]);

  // Handle time percentage change with debounced rebalancing
  const handleTimePercentageChange = (newPercentage: number) => {
    // Clamp percentage to valid range (0-100)
    const clampedPercentage = Math.min(Math.max(0, newPercentage), 100);
    setTimePercentage(clampedPercentage);

    // Trigger rebalancing with debounce to avoid too many API calls
    if (onTimePercentageChange && !activityTimePercentageLocked && step.is_active) {
      setIsRebalancing(true);
      
      // Clear existing timeout
      if (rebalanceTimeout) {
        clearTimeout(rebalanceTimeout);
      }
      
      // Set new timeout for rebalancing
      const newTimeout = setTimeout(async () => {
        try {
          await onTimePercentageChange(step.id, clampedPercentage);
        } catch (error) {
          console.error('Error during rebalancing:', error);
          // Revert to original value on error
          setTimePercentage(step.default_time_percentage || 0);
        } finally {
          setIsRebalancing(false);
        }
      }, 300); // 300ms debounce
      
      setRebalanceTimeout(newTimeout);
    }
  };

  // Save time percentage to database
  const saveTimePercentage = async () => {
    if (!onTimePercentageChange) return;
    
    setIsSaving(true);
    try {
      await onTimePercentageChange(step.id, timePercentage);
      setIsEditingPercentage(false);
    } catch (error) {
      console.error('Error saving time percentage:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to original value
  const resetTimePercentage = () => {
    setTimePercentage(step.default_time_percentage || 0);
    setIsEditingPercentage(false);
  };

  // Auto-calculate equal distribution
  const autoCalculatePercentage = () => {
    const activeStepsCount = activitySteps.filter(s => s.is_active).length;
    if (activeStepsCount > 0) {
      const equalPercentage = Math.round((100 / activeStepsCount) * 100) / 100; // Round to 2 decimals
      setTimePercentage(equalPercentage);
    }
  };

  // Helper function to format percentages with one decimal place (no percent sign)
  const formatPercentage = (value: number): string => {
    return value.toFixed(1);
  };

  // Step name editing functions
  const handleStartEditing = () => {
    setIsEditingName(true);
    setEditedName(step.name);
  };

  const handleSaveName = async () => {
    if (editedName.trim() === '' || editedName.trim() === step.name) {
      setIsEditingName(false);
      setEditedName(step.name);
      return;
    }

    setIsSavingName(true);
    try {
      await ResearchActivitiesService.updateResearchStep(step.id, { 
        name: editedName.trim() 
      });
      
      // Refresh the parent to show updated name
      onRefresh();
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating step name:', error);
      // Revert name on error
      setEditedName(step.name);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEditing = () => {
    setIsEditingName(false);
    setEditedName(step.name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  };

  // Get step color for UI elements
  const stepIndex = activitySteps.findIndex(s => s.id === step.id);
  const stepColor = STEP_COLORS[stepIndex % STEP_COLORS.length];

  const subcomponentIds = step.subcomponents?.map(sub => sub.id) || [];
  const activeSubcomponents = step.subcomponents?.filter(sub => sub.is_active) || [];
  const inactiveSubcomponents = step.subcomponents?.filter(sub => !sub.is_active) || [];

  return (
    <>
      {/* Add slider styles */}
      <style>{sliderStyles}</style>
      
      {/* Research Design-style Step Card */}
      <div className={`bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 mb-2 ${!step.is_active ? 'opacity-50' : 'hover:shadow-md'}`}>
        {/* Accordion Header - Research Design Style */}
        <div 
          className="px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors group"
          onClick={() => onToggleExpanded(step.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Enhanced Colored Step Number */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm`} style={{ backgroundColor: stepColor }}>
                {stepNumber || step.step_order}
              </div>
              {/* Step Name */}
              <div className="flex items-center space-x-2">
                {isEditingName ? (
                  <>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="font-semibold text-base bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                      disabled={isSavingName}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                      title="Save name"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEditing}
                      disabled={isSavingName}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`font-semibold text-base ${!step.is_active ? 'line-through text-gray-400' : ''}`}>
                      {step.name}
                    </span>
                    {step.is_active && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditing();
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Rename step"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Enhanced Expand/Collapse Icon */}
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${step.expanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5">
              {/* Compact Move Controls */}
              {step.is_active && ( // Only show move buttons for active steps
                <>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      e.preventDefault();
                      console.log('🔧 [STEP CARD] Move Up button clicked:', { stepId: step.id, activityId, stepName: step.name, timestamp: Date.now() });
                      // Small delay to prevent conflict with drag events
                      setTimeout(() => {
                        onMoveStepUp?.(step.id, activityId);
                      }, 10);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-20"
                    title="Move Up"
                    disabled={!onMoveStepUp}
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      e.preventDefault();
                      console.log('🔧 [STEP CARD] Move Down button clicked:', { stepId: step.id, activityId, stepName: step.name, timestamp: Date.now() });
                      // Small delay to prevent conflict with drag events
                      setTimeout(() => {
                        onMoveStepDown?.(step.id, activityId);
                      }, 10);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-20"
                    title="Move Down"
                    disabled={!onMoveStepDown}
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </>
              )}
              
              {/* Enhanced Lock Button */}
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  // Individual step locking can be added later
                }}
                className={`p-1 rounded-full transition-colors ${activityTimePercentageLocked ? 'bg-purple-100 text-purple-700' : 'hover:bg-purple-50 text-gray-500'}`}
                title={activityTimePercentageLocked ? 'Activity Locked' : 'Lock Individual Step'}
              >
                {activityTimePercentageLocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
              </button>
              
              {/* Enhanced Subcomponent Count Chip */}
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium shadow-sm flex items-center space-x-1`} style={{ 
                backgroundColor: `${stepColor}15`, 
                border: `1px solid ${stepColor}30`,
                color: stepColor 
              }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stepColor }}></span>
                <span>{activeSubcomponents.length}/{step.subcomponents?.length || 0}</span>
              </div>
              
              {/* Status Chip */}
              {!step.is_active && (
                <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                  Inactive
                </div>
              )}
              
              {/* Delete Step Button */}
              {step.is_active && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (onDeleteStep) {
                      onDeleteStep(step);
                    }
                  }}
                  className="p-1 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                  title="Delete Step"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Compact Slider and Chart Row */}
          <div className="flex items-center mt-2">
            <div className="flex-1 mr-4">
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={timePercentage}
                onChange={e => handleTimePercentageChange(Number(e.target.value))}
                disabled={activityTimePercentageLocked || !step.is_active}
                className={`w-full slider-blue ${activityTimePercentageLocked ? 'slider-purple' : ''} ${isRebalancing ? 'opacity-75' : ''}`}
                onClick={(e) => e.stopPropagation()}
              />
              {isRebalancing && (
                <div className="text-xs text-blue-600 mt-1 animate-pulse">
                  Rebalancing other steps...
                </div>
              )}
            </div>
            
            {/* Enhanced Circular Chart with Gradient */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="absolute top-0 left-0 w-12 h-12" viewBox="0 0 48 48">
                <defs>
                  <linearGradient id={`gradient-${step.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: stepColor, stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: stepColor, stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="20" fill="none"
                  stroke={step.is_active ? `url(#gradient-${step.id})` : '#d1d5db'}
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - timePercentage / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s' }}
                />
              </svg>
              <span className={`absolute text-sm font-bold ${isRebalancing ? 'text-blue-600' : 'text-gray-900'}`}>
                {isRebalancing ? '...' : `${formatPercentage(timePercentage)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Accordion Content */}
        <div className={`overflow-hidden transition-all duration-300 ${step.expanded ? 'max-h-[60vh]' : 'max-h-0'}`}>
          <div className="px-4 pb-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50 max-h-[50vh] overflow-y-auto">
            <div className="pt-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Subcomponent Configuration</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Total: {step.subcomponents?.length || 0}</span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stepColor }}></div>
                </div>
              </div>
              
              {/* Step Actions */}
              <div className="flex items-center space-x-2 mb-4">
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

              {/* Subcomponents List */}
              <div 
                ref={setNodeRef}
                className={`space-y-2 min-h-[60px] p-2 rounded-lg transition-all duration-200 ${
                  isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'border-2 border-transparent'
                }`}
              >
                {/* Drop Zone Indicator */}
                {isOver && (
                  <div className="text-center py-4 text-blue-600 text-sm font-medium">
                    📁 Drop subcomponent here
                  </div>
                )}
                
                {(step.subcomponents?.length || 0) > 0 ? (
                  <>
                    {/* Active Subcomponents */}
                    {activeSubcomponents.length > 0 && (
                      <SortableContext items={subcomponentIds} strategy={verticalListSortingStrategy}>
                        {activeSubcomponents.map((subcomponent) => (
                          <SubcomponentCard
                            key={subcomponent.id}
                            subcomponent={subcomponent}
                            stepId={step.id}
                            onEdit={onEditSubcomponent}
                            onMove={(subcomponentId, fromStepId) => onMoveSubcomponent && onMoveSubcomponent(subcomponentId, fromStepId)}
                            onDeactivate={async () => {}} // Placeholder for now
                            onRefresh={onRefresh}
                          />
                        ))}
                      </SortableContext>
                    )}

                    {/* Inactive Subcomponents */}
                    {inactiveSubcomponents.length > 0 && (
                      <div className="mt-4 pt-2 border-t border-gray-200">
                        <h5 className="text-xs font-medium text-gray-500 mb-2">Inactive Subcomponents</h5>
                        {inactiveSubcomponents.map((subcomponent) => (
                          <SubcomponentCard
                            key={subcomponent.id}
                            subcomponent={subcomponent}
                            stepId={step.id}
                            onEdit={onEditSubcomponent}
                            onMove={(subcomponentId, fromStepId) => onMoveSubcomponent && onMoveSubcomponent(subcomponentId, fromStepId)}
                            onDeactivate={async () => {}} // Placeholder for now
                            onRefresh={onRefresh}
                          />
                        ))}
                      </div>
                    )}
                  </>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StepCard; 