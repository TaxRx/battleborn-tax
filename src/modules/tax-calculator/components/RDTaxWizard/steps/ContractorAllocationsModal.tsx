import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ContractorAllocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: {
    id: string;
    name: string;
    role_id?: string;
    cost_amount?: number;
  } | null;
  businessYearId: string;
  onUpdate?: () => void;
}

interface SubcomponentAllocation {
  id: string;
  name: string;
  stepName: string;
  timePercentage: number;
  maxTimePercentage: number;
  yearPercentage: number;
  frequencyPercentage: number;
  isIncluded: boolean;
  baselineTimePercentage: number;
  baselinePracticePercentage: number;
}

interface ResearchActivityAllocation {
  id: string;
  name: string;
  isEnabled: boolean;
  practicePercentage: number;
  subcomponents: SubcomponentAllocation[];
}

const formatPercentage = (value: number): string => {
  return (Math.round(value * 100) / 100).toString();
};

const ContractorAllocationsModal: React.FC<ContractorAllocationsModalProps> = ({
  isOpen,
  onClose,
  contractor,
  businessYearId,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ResearchActivityAllocation[]>([]);
  const [nonRdPercentage, setNonRdPercentage] = useState(0);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  
  // Color palette for activities
  const activityColors = [
    '#F97316', // orange-500 (contractor theme)
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#3B82F6', // blue-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
  ];

  // Load data only when modal opens
  useEffect(() => {
    if (isOpen && contractor) {
      loadAllocationData();
    }
  }, [isOpen, contractor]);

  // Recalculate total when non-R&D percentage changes
  useEffect(() => {
    calculateTotalAllocated(activities);
  }, [nonRdPercentage, activities]);

  const loadAllocationData = async () => {
    if (!contractor) return;
    setLoading(true);
    
    try {
      // Get research activities
      const { data: selectedActivities, error: activitiesError } = await supabase
        .from('rd_selected_activities')
        .select(`
          *,
          activity:rd_research_activities (
            id,
            title
          )
        `)
        .eq('business_year_id', businessYearId);

      if (activitiesError) {
        console.error('Error loading activities:', activitiesError);
        return;
      }

      let activitiesWithSubcomponents: ResearchActivityAllocation[] = [];
      
      for (const selectedActivity of selectedActivities || []) {
        const { data: subcomponents } = await supabase
          .from('rd_selected_subcomponents')
          .select(`
            *,
            subcomponent:rd_research_subcomponents (
              id,
              name
            ),
            step:rd_research_steps (
              id,
              name
            )
          `)
          .eq('business_year_id', businessYearId)
          .eq('research_activity_id', selectedActivity.activity_id);

        const { data: contractorAllocations } = await supabase
          .from('rd_contractor_subcomponents')
          .select('*')
          .eq('contractor_id', contractor.id)
          .eq('business_year_id', businessYearId)
          .in('subcomponent_id', subcomponents?.map(s => s.subcomponent_id) || []);

        const subcomponentAllocations: SubcomponentAllocation[] = (subcomponents || []).map(sub => {
          const contractorAlloc = contractorAllocations?.find(ca => ca.subcomponent_id === sub.subcomponent_id);
          
          return {
            id: sub.subcomponent_id,
            name: sub.subcomponent?.name || 'Unknown',
            stepName: sub.step?.name || 'Unknown',
            timePercentage: contractorAlloc?.time_percentage ?? sub.time_percentage ?? 0,
            maxTimePercentage: sub.time_percentage || 0,
            yearPercentage: contractorAlloc?.year_percentage ?? sub.year_percentage ?? 0,
            frequencyPercentage: contractorAlloc?.frequency_percentage ?? sub.frequency_percentage ?? 0,
            isIncluded: contractorAlloc?.is_included ?? true,
            baselineTimePercentage: sub.time_percentage ?? 0,
            baselinePracticePercentage: selectedActivity.practice_percent ?? 0
          };
        });

        activitiesWithSubcomponents.push({
          id: selectedActivity.activity_id,
          name: selectedActivity.activity?.title || 'Unknown Activity',
          isEnabled: selectedActivity.is_enabled ?? subcomponentAllocations.some(s => s.isIncluded),
          practicePercentage: selectedActivity.practice_percent ?? 0,
          subcomponents: subcomponentAllocations
        });
      }
      
      setActivities(activitiesWithSubcomponents);
      calculateTotalAllocated(activitiesWithSubcomponents);
      
    } catch (error) {
      console.error('Error in loadAllocationData:', error);
      setActivities([]);
      calculateTotalAllocated([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAllocated = (activitiesData: ResearchActivityAllocation[]) => {
    const total = activitiesData.reduce((sum, activity) => {
      if (activity.isEnabled) {
        return sum + activity.practicePercentage;
      }
      return sum;
    }, 0) + nonRdPercentage;
    setTotalAllocated(total);
  };

  // FIXED: Calculate practice percentage segments showing remaining space
  const getPracticePercentageSegments = () => {
    const enabledActivities = activities.filter(a => a.isEnabled);
    const segments: any[] = [];
    let currentPosition = 0;
    
    // Add enabled research activities
    enabledActivities.forEach((activity, index) => {
      if (activity.practicePercentage > 0) {
        segments.push({
          activityId: activity.id,
          name: activity.name,
          percentage: activity.practicePercentage,
          color: activityColors[index % activityColors.length],
          startPosition: currentPosition,
          width: activity.practicePercentage
        });
        currentPosition += activity.practicePercentage;
      }
    });
    
    // Add non-R&D segment
    if (nonRdPercentage > 0) {
      segments.push({
        activityId: 'non-rd',
        name: 'Non-R&D Time',
        percentage: nonRdPercentage,
        color: '#6B7280',
        startPosition: currentPosition,
        width: nonRdPercentage
      });
      currentPosition += nonRdPercentage;
    }
    
    // Add remaining/available time if under 100%
    const remainingPercentage = 100 - currentPosition;
    if (remainingPercentage > 0) {
      segments.push({
        activityId: 'remaining',
        name: 'Available Time',
        percentage: remainingPercentage,
        color: '#E5E7EB',
        startPosition: currentPosition,
        width: remainingPercentage
      });
    }
    
    return segments;
  };

  const getAppliedPercentageSegments = () => {
    const segments: any[] = [];
    let currentPosition = 0;
    
    for (const activity of activities) {
      if (activity.isEnabled) {
        let activityTotalApplied = 0;
        
        for (const subcomponent of activity.subcomponents) {
          if (subcomponent.isIncluded) {
            const appliedPercentage = (activity.practicePercentage / 100) * 
                                   (subcomponent.yearPercentage / 100) * 
                                   (subcomponent.frequencyPercentage / 100) * 
                                   (subcomponent.timePercentage / 100) * 100;
            
            activityTotalApplied += appliedPercentage;
          }
        }
        
        if (activityTotalApplied > 0) {
          segments.push({
            activityId: activity.id,
            name: activity.name,
            percentage: activityTotalApplied,
            color: activityColors[activities.indexOf(activity) % activityColors.length],
            startPosition: currentPosition,
            width: activityTotalApplied
          });
          currentPosition += activityTotalApplied;
        }
      }
    }
    
    return segments;
  };

  const updateActivityEnabled = (activityId: string, isEnabled: boolean) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          isEnabled,
          subcomponents: activity.subcomponents.map(sub => ({
            ...sub,
            isIncluded: isEnabled ? sub.isIncluded : false
          }))
        };
      }
      return activity;
    }));
  };

  const updateActivityPracticePercentage = (activityId: string, percentage: number) => {
    setActivities(prev => {
      const updated = prev.map(activity => {
        if (activity.id === activityId) {
          return { ...activity, practicePercentage: percentage };
        }
        return activity;
      });
      
      // FIXED: Force redistribution to maintain 100% total
      const enabledActivities = updated.filter(a => a.isEnabled);
      const totalAllocated = enabledActivities.reduce((sum, a) => sum + a.practicePercentage, 0) + nonRdPercentage;
      
      if (totalAllocated > 100) {
        const availableForResearch = 100 - nonRdPercentage;
        const totalResearchTime = enabledActivities.reduce((sum, a) => sum + a.practicePercentage, 0);
        const scaleFactor = availableForResearch / totalResearchTime;
        
        return updated.map(activity => {
          if (activity.isEnabled) {
            return { ...activity, practicePercentage: Math.round(activity.practicePercentage * scaleFactor * 100) / 100 };
          }
          return activity;
        });
      }
      
      return updated;
    });
  };

  const updateSubcomponentTimePercentage = (activityId: string, subcomponentId: string, percentage: number) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          subcomponents: activity.subcomponents.map(sub => {
            if (sub.id === subcomponentId) {
              return { ...sub, timePercentage: Math.max(0, Math.min(percentage, 100)) };
            }
            return sub;
          })
        };
      }
      return activity;
    }));
  };

  const saveAllocations = async () => {
    if (!contractor) return;
    
    setLoading(true);
    try {
      // FIRST: Save activity enabled states
      for (const activity of activities) {
        try {
          const { error: activityError } = await supabase
            .from('rd_selected_activities')
            .update({ 
              is_enabled: activity.isEnabled,
              practice_percent: activity.practicePercentage 
            })
            .eq('business_year_id', businessYearId)
            .eq('activity_id', activity.id);
          
          if (activityError) {
            console.error('Error saving activity enabled state:', activityError);
          }
        } catch (error) {
          console.error('Error in activity state update:', error);
        }
      }
      
      // Handle disabled activities by removing their allocations
      for (const activity of activities) {
        if (!activity.isEnabled) {
          const subcomponentIds = activity.subcomponents.map(sub => sub.id);
          
          if (subcomponentIds.length > 0) {
            await supabase
              .from('rd_contractor_subcomponents')
              .delete()
              .eq('contractor_id', contractor.id)
              .eq('business_year_id', businessYearId)
              .in('subcomponent_id', subcomponentIds);
          }
        }
      }
      
      // Save enabled activities
      for (const activity of activities) {
        if (activity.isEnabled) {
          for (const subcomponent of activity.subcomponents) {
            if (subcomponent.isIncluded) {
              const appliedPercentage = (activity.practicePercentage / 100) * 
                                     (subcomponent.yearPercentage / 100) * 
                                     (subcomponent.frequencyPercentage / 100) * 
                                     (subcomponent.timePercentage / 100) * 100;
              
              const upsertData = {
                contractor_id: contractor.id,
                business_year_id: businessYearId,
                subcomponent_id: subcomponent.id,
                time_percentage: subcomponent.timePercentage,
                applied_percentage: appliedPercentage,
                practice_percentage: activity.practicePercentage,
                year_percentage: subcomponent.yearPercentage,
                frequency_percentage: subcomponent.frequencyPercentage,
                is_included: subcomponent.isIncluded
              };
              
              await supabase
                .from('rd_contractor_subcomponents')
                .upsert(upsertData, {
                  onConflict: 'contractor_id,business_year_id,subcomponent_id'
                });
            }
          }
        }
      }
      
      console.log('✅ Allocations saved successfully');
      onUpdate?.();
      onClose();
      
    } catch (error) {
      console.error('❌ Error saving allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const revertToBaseline = () => {
    setActivities(prev => prev.map(activity => ({
      ...activity,
      subcomponents: activity.subcomponents.map(sub => ({
        ...sub,
        timePercentage: sub.baselineTimePercentage
      }))
    })));
  };

  if (!isOpen || !contractor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Allocations for {contractor.name}
              </h3>
              <p className="text-sm text-gray-500">
                Manage research activity allocations and time percentages
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-2 text-gray-600">Loading allocations...</span>
            </div>
          ) : (
            <>
              {/* Practice Percentage Bar */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Practice Percentage Distribution</h4>
                    <p className="text-xs text-gray-500">Shows remaining available time for allocation</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{formatPercentage(totalAllocated)}%</span>
                    <div className="text-xs text-gray-500">Total Allocated</div>
                  </div>
                </div>
                
                <div className="relative w-full bg-gray-200 rounded-full h-6 mb-3 overflow-hidden">
                  {getPracticePercentageSegments().map((segment, index) => (
                    <div
                      key={`practice-${segment.activityId}`}
                      className="absolute h-6 rounded-full transition-all duration-300 hover:opacity-80"
                      style={{
                        left: `${segment.startPosition}%`,
                        width: `${segment.width}%`,
                        backgroundColor: segment.color
                      }}
                      title={`${segment.name}: ${formatPercentage(segment.percentage)}%`}
                    />
                  ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getPracticePercentageSegments().map((segment, index) => (
                    <div key={`legend-practice-${segment.activityId}`} className="flex items-center space-x-2 p-2 bg-white rounded border">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: segment.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{segment.name}</div>
                        <div className="text-xs text-gray-500">{formatPercentage(segment.percentage)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {totalAllocated > 100 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-600 text-sm">⚠️ Total exceeds 100%. Allocations will be redistributed proportionally.</p>
                  </div>
                )}
              </div>

              {/* Applied Percentage Bar */}
              <div className="mb-8 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Applied Percentage (Research Activities)</h4>
                    <p className="text-xs text-gray-500">Direct calculation from subcomponent allocations</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-orange-900">{formatPercentage(getAppliedPercentageSegments().reduce((sum, seg) => sum + seg.percentage, 0))}%</span>
                    <div className="text-xs text-orange-600">Total Applied</div>
                  </div>
                </div>
                
                <div className="relative w-full bg-gray-200 rounded-full h-6 mb-3 overflow-hidden">
                  {getAppliedPercentageSegments().map((segment, index) => (
                    <div
                      key={`applied-${segment.activityId}`}
                      className="absolute h-6 rounded-full transition-all duration-300 hover:opacity-80"
                      style={{
                        left: `${segment.startPosition}%`,
                        width: `${segment.width}%`,
                        backgroundColor: segment.color
                      }}
                      title={`${segment.name}: ${formatPercentage(segment.percentage)}%`}
                    />
                  ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getAppliedPercentageSegments().map((segment, index) => (
                    <div key={`legend-applied-${segment.activityId}`} className="flex items-center space-x-2 p-2 bg-white rounded border">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: segment.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{segment.name}</div>
                        <div className="text-xs text-orange-600">{formatPercentage(segment.percentage)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Non-R&D Time Allocation */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Non-R&D Time Allocation</h4>
                    <p className="text-xs text-gray-500">Time spent on non-research activities</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-orange-900">{formatPercentage(nonRdPercentage)}%</span>
                    <div className="text-xs text-orange-600">Non-R&D Time</div>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.01"
                  value={nonRdPercentage}
                  onChange={(e) => setNonRdPercentage(parseFloat(e.target.value))}
                  className="w-full h-3 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Research Activities */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Research Activities</h4>
                {activities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={activity.isEnabled}
                            onChange={(e) => updateActivityEnabled(activity.id, e.target.checked)}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                          />
                          <h5 className="font-medium text-gray-900">{activity.name}</h5>
                        </div>
                        <button
                          onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedActivity === activity.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Practice Percentage</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatPercentage(activity.practicePercentage)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.01"
                          value={activity.practicePercentage}
                          onChange={(e) => updateActivityPracticePercentage(activity.id, parseFloat(e.target.value))}
                          disabled={!activity.isEnabled}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                        />
                      </div>

                      {/* Subcomponents */}
                      {expandedActivity === activity.id && (
                        <div className="mt-4 space-y-3">
                          <h6 className="text-sm font-medium text-gray-700">Subcomponents</h6>
                          {activity.subcomponents.map((subcomponent) => (
                            <div key={subcomponent.id} className="pl-4 border-l-2 border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={subcomponent.isIncluded}
                                    onChange={(e) => {
                                      setActivities(prev => prev.map(a => {
                                        if (a.id === activity.id) {
                                          return {
                                            ...a,
                                            subcomponents: a.subcomponents.map(s => {
                                              if (s.id === subcomponent.id) {
                                                return { ...s, isIncluded: e.target.checked };
                                              }
                                              return s;
                                            })
                                          };
                                        }
                                        return a;
                                      }));
                                    }}
                                    disabled={!activity.isEnabled}
                                    className="w-3 h-3 text-orange-600 rounded focus:ring-orange-500 disabled:opacity-50"
                                  />
                                  <span className="text-sm text-gray-700">{subcomponent.name}</span>
                                  <span className="text-xs text-gray-500">({subcomponent.stepName})</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  Baseline: {formatPercentage(subcomponent.maxTimePercentage)}%
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="range"
                                  min="0"
                                  max={100}
                                  step="0.01"
                                  value={subcomponent.timePercentage}
                                  onChange={(e) => updateSubcomponentTimePercentage(activity.id, subcomponent.id, parseFloat(e.target.value))}
                                  disabled={!subcomponent.isIncluded || !activity.isEnabled}
                                  className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                                />
                                <span className="text-xs text-gray-600 w-12 text-right">
                                  {formatPercentage(subcomponent.timePercentage)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-between">
                <div className="flex space-x-3">
                  <button
                    onClick={revertToBaseline}
                    disabled={loading}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Revert to Baseline
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAllocations}
                    disabled={loading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Allocations'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ContractorAllocationsModal;