import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { ContractorWithExpenses } from '../../../../../services/contractorManagementService';

const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0.00';
  return value.toFixed(2);
};

interface ContractorAllocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: ContractorWithExpenses | null;
  businessYearId: string;
  onUpdate: () => void;
}

interface ResearchActivityAllocation {
  id: string;
  name: string;
  isEnabled: boolean;
  practicePercentage: number;
  subcomponents: SubcomponentAllocation[];
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
  baselineTimePercentage?: number;
  baselinePracticePercentage?: number;
}

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
    if (!contractor) {
      console.log('⚠️ No contractor provided to loadAllocationData');
      return;
    }
    
    console.log('🔍 loadAllocationData called for contractor:', contractor.id, 'role:', contractor.role_id);
    
    if (!businessYearId) {
      console.log('⚠️ No businessYearId provided to loadAllocationData');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 Loading allocation data for contractor:', contractor.id, 'role:', contractor.role_id);
      
      if (!supabase) {
        console.error('❌ Supabase client not available');
        setLoading(false);
        return;
      }
      
      // Test basic table access
      const { data: testData, error: testError } = await supabase
        .from('rd_contractor_subcomponents')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Error testing table access:', testError);
      } else {
        console.log('✅ Table access test successful');
      }
      
      // Test rd_selected_activities table access
      const { data: activitiesTestData, error: activitiesTestError } = await supabase
        .from('rd_selected_activities')
        .select('selected_roles')
        .limit(1);
      
      if (activitiesTestError) {
        console.error('❌ Error testing rd_selected_activities access:', activitiesTestError);
      } else {
        console.log('✅ rd_selected_activities table access successful');
        console.log('📋 Sample selected_roles data:', activitiesTestData);
      }
      
      // Get research activities that match the contractor's role
      let selectedActivities;
      let activitiesError;
      
      try {
        // Check if contractor has a role before trying role filter
        if (!contractor.role_id) {
          console.log('⚠️ Contractor has no role, skipping role filter');
          activitiesError = new Error('No role assigned to contractor');
        } else {
          // First try with role filter using proper JSON syntax
          console.log('🔍 Trying role filter with role ID:', contractor.role_id);
          console.log('🔍 JSON query:', JSON.stringify([contractor.role_id]));
          
          const { data, error } = await supabase
            .from('rd_selected_activities')
            .select(`
              *,
              activity:rd_research_activities (
                id,
                title
              )
            `)
            .eq('business_year_id', businessYearId)
            .contains('selected_roles', JSON.stringify([contractor.role_id]));
          
          selectedActivities = data;
          activitiesError = error;
        }
      } catch (error) {
        console.error('❌ Error with role filter query:', error);
        activitiesError = error;
      }

      if (activitiesError) {
        console.error('❌ Error loading activities with role filter:', activitiesError);
        
        // Try different JSON formats for the role filter
        let fallbackAttempts = [
          () => {
            console.log('🔄 Fallback 1: JSON.stringify([roleId])');
            return supabase.from('rd_selected_activities').select('*').eq('business_year_id', businessYearId).contains('selected_roles', JSON.stringify([contractor.role_id]));
          },
          () => {
            console.log('🔄 Fallback 2: JSON.stringify(roleId)');
            return supabase.from('rd_selected_activities').select('*').eq('business_year_id', businessYearId).contains('selected_roles', JSON.stringify(contractor.role_id));
          },
          () => {
            console.log('🔄 Fallback 3: roleId directly');
            return supabase.from('rd_selected_activities').select('*').eq('business_year_id', businessYearId).contains('selected_roles', contractor.role_id);
          },
          () => {
            console.log('🔄 Fallback 4: ["roleId"] string');
            return supabase.from('rd_selected_activities').select('*').eq('business_year_id', businessYearId).contains('selected_roles', `["${contractor.role_id}"]`);
          },
          () => {
            console.log('🔄 Fallback 5: "roleId" string');
            return supabase.from('rd_selected_activities').select('*').eq('business_year_id', businessYearId).contains('selected_roles', `"${contractor.role_id}"`);
          }
        ];
        
        for (let i = 0; i < fallbackAttempts.length; i++) {
          try {
            console.log(`🔄 Trying fallback attempt ${i + 1} for role filter`);
            const { data: fallbackData, error: fallbackError } = await fallbackAttempts[i]();
            
            if (!fallbackError && fallbackData && fallbackData.length > 0) {
              console.log(`✅ Fallback attempt ${i + 1} successful:`, fallbackData);
              selectedActivities = fallbackData;
              break;
            }
          } catch (attemptError) {
            console.log(`❌ Fallback attempt ${i + 1} failed:`, attemptError);
          }
        }
        
        // If all role filter attempts failed, try without role filter
        if (!selectedActivities) {
          try {
            console.log('🔄 Trying without role filter...');
            const { data: allActivities, error: allActivitiesError } = await supabase
              .from('rd_selected_activities')
              .select(`
                *,
                activity:rd_research_activities (
                  id,
                  title
                )
              `)
              .eq('business_year_id', businessYearId);
            
            if (allActivitiesError) {
              console.error('❌ Error loading all activities:', allActivitiesError);
              // Try a simpler query as last resort
              console.log('🔄 Trying simple query as last resort...');
              const { data: simpleActivities, error: simpleError } = await supabase
                .from('rd_selected_activities')
                .select('*')
                .eq('business_year_id', businessYearId);
              
              if (simpleError) {
                console.error('❌ Error loading simple activities:', simpleError);
                // Create empty activities array as final fallback
                console.log('⚠️ Creating empty activities array as final fallback');
                selectedActivities = [];
              } else {
                console.log('⚠️ Using simple activities as fallback:', simpleActivities);
                selectedActivities = simpleActivities;
              }
            } else {
              console.log('⚠️ Using all activities as fallback:', allActivities);
              selectedActivities = allActivities;
            }
          } catch (fallbackError) {
            console.error('❌ Error in fallback queries:', fallbackError);
            // Create empty activities array as final fallback
            console.log('⚠️ Creating empty activities array as final fallback due to error');
            selectedActivities = [];
          }
        }
      }

      console.log('📋 Found activities:', selectedActivities);

      // Ensure selectedActivities is always defined
      if (!selectedActivities) {
        console.log('⚠️ No activities found, creating empty array');
        selectedActivities = [];
      }

      // Get subcomponents for each activity
      let activitiesWithSubcomponents: ResearchActivityAllocation[] = [];
      
      for (const selectedActivity of selectedActivities || []) {
        console.log('🔍 Processing activity:', selectedActivity.activity?.title);
        
        const { data: subcomponents, error: subError } = await supabase
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

        if (subError) {
          console.error('❌ Error loading subcomponents:', subError);
          continue;
        }

        console.log('📋 Found subcomponents for activity:', subcomponents?.length);

        // Get contractor's current allocations for this activity
        const { data: contractorAllocations, error: allocError } = await supabase
          .from('rd_contractor_subcomponents')
          .select('*, subcomponent:rd_research_subcomponents(name)')
          .eq('contractor_id', contractor.id)
          .eq('business_year_id', businessYearId)
          .in('subcomponent_id', subcomponents?.map(s => s.subcomponent_id) || []);

        if (allocError) {
          console.error('❌ Error loading contractor allocations:', allocError);
          // Continue without contractor allocations
        }

        console.log('📋 Found contractor allocations:', contractorAllocations?.length);

        const subcomponentAllocations: SubcomponentAllocation[] = (subcomponents || []).map(sub => {
          const contractorAlloc = contractorAllocations?.find(ca => ca.subcomponent_id === sub.subcomponent_id);
          
          // If no contractor allocation exists, use subcomponent baseline values
          const baselineTimePercentage = contractorAlloc?.baseline_time_percentage ?? sub.time_percentage ?? 0;
          const baselinePracticePercentage = contractorAlloc?.baseline_practice_percentage ?? selectedActivity.practice_percent ?? 0;
          
          // Use contractor's custom time percentage if it exists, otherwise use baseline
          const timePercentage = contractorAlloc?.time_percentage ?? baselineTimePercentage;
          
          // Handle null values in database by using subcomponent baseline values
          const yearPercentage = contractorAlloc?.year_percentage ?? sub.year_percentage ?? 0;
          const frequencyPercentage = contractorAlloc?.frequency_percentage ?? sub.frequency_percentage ?? 0;
          const practicePercentage = contractorAlloc?.practice_percentage ?? selectedActivity.practice_percent ?? 0;
          
          return {
            id: sub.subcomponent_id,
            name: sub.subcomponent?.name || 'Unknown',
            stepName: sub.step?.name || 'Unknown',
            timePercentage: timePercentage,
            maxTimePercentage: sub.time_percentage || 0,
            yearPercentage: yearPercentage,
            frequencyPercentage: frequencyPercentage,
            isIncluded: contractorAlloc?.is_included ?? true,
            baselineTimePercentage: baselineTimePercentage,
            baselinePracticePercentage: baselinePracticePercentage
          };
        });

        // Get the activity's practice percentage from contractor allocations or use baseline
        const activityContractorAlloc = contractorAllocations?.find(ca => 
          subcomponents?.some(sub => sub.subcomponent_id === ca.subcomponent_id)
        );
        const activityPracticePercentage = activityContractorAlloc?.practice_percentage ?? selectedActivity.practice_percent ?? 0;

        activitiesWithSubcomponents.push({
          id: selectedActivity.activity_id,
          name: selectedActivity.activity?.title || 'Unknown Activity',
          isEnabled: subcomponentAllocations.some(s => s.isIncluded),
          practicePercentage: activityPracticePercentage,
          subcomponents: subcomponentAllocations
        });
      }

      console.log('📋 Final activitiesWithSubcomponents:', activitiesWithSubcomponents);
      
      setActivities(activitiesWithSubcomponents);
      calculateTotalAllocated(activitiesWithSubcomponents);
      
      console.log('✅ Allocation data loaded:', activitiesWithSubcomponents);
    } catch (error) {
      console.error('❌ Error in loadAllocationData:', error);
      // Set empty activities as fallback
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

  // Calculate practice percentage segments for visualization (including non-R&D)
  const getPracticePercentageSegments = () => {
    const enabledActivities = activities.filter(a => a.isEnabled);
    const segments = [];
    let currentPosition = 0;
    
    // Calculate total research time (excluding non-R&D)
    const totalResearchTime = enabledActivities.reduce((sum, a) => sum + a.practicePercentage, 0);
    const totalTime = totalResearchTime + nonRdPercentage;
    
    // Add research activities
    enabledActivities.forEach((activity, index) => {
      if (activity.practicePercentage > 0) {
        const normalizedPercentage = (activity.practicePercentage / totalResearchTime) * (100 - nonRdPercentage);
        segments.push({
          activityId: activity.id,
          name: activity.name,
          percentage: normalizedPercentage,
          color: activityColors[index % activityColors.length],
          startPosition: currentPosition,
          width: normalizedPercentage
        });
        currentPosition += normalizedPercentage;
      }
    });
    
    // Add non-R&D segment
    if (nonRdPercentage > 0) {
      segments.push({
        activityId: 'non-rd',
        name: 'Non-R&D Time',
        percentage: nonRdPercentage,
        color: '#6B7280', // gray-500
        startPosition: currentPosition,
        width: nonRdPercentage
      });
    }
    
    return segments;
  };

  // Calculate applied percentage segments for visualization (based on custom allocations or baseline)
  const getAppliedPercentageSegments = () => {
    const segments = [];
    let currentPosition = 0;
    
    // Get the contractor's role baseline applied percentage
    const roleBaseline = contractor?.baseline_applied_percent || 0;
    
    // Check if we have any custom allocations by looking at subcomponent time percentages
    const hasCustomAllocations = activities.some(activity => 
      activity.isEnabled && activity.subcomponents.some(sub => 
        sub.isIncluded && sub.timePercentage !== sub.maxTimePercentage
      )
    );
    
    if (hasCustomAllocations) {
      // Calculate custom applied percentages based on subcomponent time percentages
      const subcomponentSegments = [];
      
      for (const activity of activities) {
        if (activity.isEnabled) {
          for (const subcomponent of activity.subcomponents) {
            if (subcomponent.isIncluded) {
              // Calculate applied percentage using the correct formula: Practice% × Year% × Frequency% × Time%
              const appliedPercentage = (activity.practicePercentage / 100) * 
                                     (subcomponent.yearPercentage / 100) * 
                                     (subcomponent.frequencyPercentage / 100) * 
                                     (subcomponent.timePercentage / 100) * 100;
              
              if (appliedPercentage > 0) {
                subcomponentSegments.push({
                  activityId: activity.id,
                  subcomponentId: subcomponent.id,
                  name: `${activity.name} - ${subcomponent.name}`,
                  percentage: appliedPercentage,
                  color: activityColors[activities.indexOf(activity) % activityColors.length],
                  startPosition: currentPosition,
                  width: appliedPercentage
                });
                currentPosition += appliedPercentage;
              }
            }
          }
        }
      }
      
      // Group by activity for visualization
      const activityGroups = {};
      subcomponentSegments.forEach(segment => {
        if (!activityGroups[segment.activityId]) {
          activityGroups[segment.activityId] = {
            activityId: segment.activityId,
            name: segment.name.split(' - ')[0], // Get activity name
            percentage: 0,
            color: segment.color,
            startPosition: segment.startPosition,
            width: 0
          };
        }
        activityGroups[segment.activityId].percentage += segment.percentage;
        activityGroups[segment.activityId].width += segment.width;
      });
      
      return Object.values(activityGroups);
    } else {
      // No custom allocations - show baseline distribution across enabled activities
      const enabledActivities = activities.filter(a => a.isEnabled);
      const totalResearchTime = enabledActivities.reduce((sum, a) => sum + a.practicePercentage, 0);
      
      enabledActivities.forEach((activity, index) => {
        // Calculate applied percentage based on proportion of research time
        const activityAppliedPercentage = totalResearchTime > 0 
          ? (roleBaseline * activity.practicePercentage) / totalResearchTime 
          : 0;
        
        if (activityAppliedPercentage > 0) {
          segments.push({
            activityId: activity.id,
            name: activity.name,
            percentage: activityAppliedPercentage,
            color: activityColors[index % activityColors.length],
            startPosition: currentPosition,
            width: activityAppliedPercentage
          });
          currentPosition += activityAppliedPercentage;
        }
      });
      
      return segments;
    }
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
      
      // Redistribute to maintain 100% total (including non-R&D time)
      const enabledActivities = updated.filter(a => a.isEnabled);
      const totalAllocated = enabledActivities.reduce((sum, a) => sum + a.practicePercentage, 0) + nonRdPercentage;
      
      if (totalAllocated > 100) {
        // Reduce other activities proportionally
        const excess = totalAllocated - 100;
        const otherActivities = enabledActivities.filter(a => a.id !== activityId);
        const totalOther = otherActivities.reduce((sum, a) => sum + a.practicePercentage, 0);
        
        if (totalOther > 0) {
          return updated.map(activity => {
            if (activity.isEnabled && activity.id !== activityId) {
              const reduction = (activity.practicePercentage / totalOther) * excess;
              return { ...activity, practicePercentage: Math.max(0, activity.practicePercentage - reduction) };
            }
            return activity;
          });
        }
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
              // Allow up to 100% for any subcomponent, not limited by baseline
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
      console.log('💾 Saving allocations for contractor:', contractor.id);
      
      // Calculate and save allocations using modal's math (allows exceeding baseline)
      for (const activity of activities) {
        if (activity.isEnabled) {
          for (const subcomponent of activity.subcomponents) {
            if (subcomponent.isIncluded) {
              // Calculate applied percentage using modal's formula: Practice% × Year% × Frequency% × Time%
              const appliedPercentage = (activity.practicePercentage / 100) * 
                                     (subcomponent.yearPercentage / 100) * 
                                     (subcomponent.frequencyPercentage / 100) * 
                                     (subcomponent.timePercentage / 100) * 100;
              
              console.log('🔍 Calculated applied percentage for subcomponent:', {
                subcomponent: subcomponent.name,
                practicePercentage: activity.practicePercentage,
                yearPercentage: subcomponent.yearPercentage,
                frequencyPercentage: subcomponent.frequencyPercentage,
                timePercentage: subcomponent.timePercentage,
                appliedPercentage: appliedPercentage
              });
              
              // Check if this subcomponent already exists to preserve baseline values
              const { data: existingAllocations, error: queryError } = await supabase
                .from('rd_contractor_subcomponents')
                .select('baseline_applied_percent, baseline_time_percentage, baseline_practice_percentage')
                .eq('contractor_id', contractor.id)
                .eq('subcomponent_id', subcomponent.id)
                .eq('business_year_id', businessYearId);
              
              if (queryError) {
                console.error('❌ Error querying existing allocation:', queryError);
              }
              
              // Get existing baseline values or use subcomponent original values as baseline
              const existingAllocation = existingAllocations?.[0];
              const baselineAppliedPercent = existingAllocation?.baseline_applied_percent ?? subcomponent.maxTimePercentage;
              const baselineTimePercentage = existingAllocation?.baseline_time_percentage ?? subcomponent.baselineTimePercentage ?? subcomponent.maxTimePercentage;
              const baselinePracticePercentage = existingAllocation?.baseline_practice_percentage ?? subcomponent.baselinePracticePercentage ?? activity.practicePercentage;
              
              // Prepare upsert data - save exact values from modal calculations
              const upsertData: any = {
                contractor_id: contractor.id,
                business_year_id: businessYearId,
                subcomponent_id: subcomponent.id,
                time_percentage: subcomponent.timePercentage,
                applied_percentage: appliedPercentage, // Use exact calculated value (no normalization)
                practice_percentage: activity.practicePercentage,
                year_percentage: subcomponent.yearPercentage,
                frequency_percentage: subcomponent.frequencyPercentage,
                is_included: subcomponent.isIncluded,
                updated_at: new Date().toISOString()
              };
              
              // Only set baseline values if no existing record (to preserve original)
              if (!existingAllocation) {
                upsertData.baseline_applied_percent = baselineAppliedPercent;
                upsertData.baseline_time_percentage = baselineTimePercentage;
                upsertData.baseline_practice_percentage = baselinePracticePercentage;
                upsertData.created_at = new Date().toISOString();
              }
              
              const { error } = await supabase
                .from('rd_contractor_subcomponents')
                .upsert(upsertData, {
                  onConflict: 'contractor_id,subcomponent_id,business_year_id'
                });

              if (error) {
                console.error('❌ Error saving subcomponent allocation:', error);
              }
            }
          }
        }
      }

      // Save subcomponent allocations to rd_contractor_subcomponents
      const subcomponentUpserts = activities.flatMap(activity =>
        activity.subcomponents.map(subcomponent => ({
          contractor_id: contractor.id,
          subcomponent_id: subcomponent.id,
          business_year_id: businessYearId,
          time_percentage: subcomponent.timePercentage,
          applied_percentage: (
            (activity.practicePercentage || 0) *
            (subcomponent.timePercentage || 0) *
            (subcomponent.yearPercentage || 0) *
            (subcomponent.frequencyPercentage || 0)
          ) / 1000000,
          is_included: subcomponent.isIncluded,
          baseline_applied_percent: subcomponent.baselineTimePercentage || 0,
          practice_percentage: activity.practicePercentage,
          year_percentage: subcomponent.yearPercentage,
          frequency_percentage: subcomponent.frequencyPercentage,
          baseline_practice_percentage: subcomponent.baselinePracticePercentage || 0,
          baseline_time_percentage: subcomponent.baselineTimePercentage || 0
        }))
      );

      // Delete existing allocations for this contractor and business year
      await supabase
        .from('rd_contractor_subcomponents')
        .delete()
        .eq('contractor_id', contractor.id)
        .eq('business_year_id', businessYearId);

      // Insert new allocations
      if (subcomponentUpserts.length > 0) {
        await supabase
          .from('rd_contractor_subcomponents')
          .insert(subcomponentUpserts);
      }

      // Calculate total applied percentage from all subcomponents
      let totalAppliedPercentage = 0;
      for (const activity of activities) {
        if (activity.isEnabled) {
          for (const subcomponent of activity.subcomponents) {
            if (subcomponent.isIncluded) {
              const appliedPercentage = (activity.practicePercentage / 100) * 
                                     (subcomponent.yearPercentage / 100) * 
                                     (subcomponent.frequencyPercentage / 100) * 
                                     (subcomponent.timePercentage / 100) * 100;
              totalAppliedPercentage += appliedPercentage;
            }
          }
        }
      }

      // Update rd_contractor_year_data with new applied percentage and calculated QRE (65% of wage)
      const contractorAmount = contractor.amount || 0;
      const fullQRE = Math.round((contractorAmount * totalAppliedPercentage) / 100);
      const calculatedQRE = Math.round(fullQRE * 0.65); // Apply 65% reduction for contractors

      const { error: yearDataError } = await supabase
        .from('rd_contractor_year_data')
        .update({
          applied_percent: totalAppliedPercentage,
          calculated_qre: calculatedQRE,
          updated_at: new Date().toISOString()
        })
        .eq('contractor_id', contractor.id)
        .eq('business_year_id', businessYearId);

      if (yearDataError) {
        console.error('❌ Error updating contractor year data:', yearDataError);
      } else {
        console.log('✅ Updated contractor year data with new applied percentage:', totalAppliedPercentage, 'and QRE:', calculatedQRE);
      }

      console.log('✅ Allocations and year data saved successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('❌ Error saving allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const revertToBaseline = async () => {
    if (!contractor) return;
    
    setLoading(true);
    try {
      console.log('🔄 Reverting to baseline for contractor:', contractor.id);
      
      // Delete all custom allocations
      const { error } = await supabase
        .from('rd_contractor_subcomponents')
        .delete()
        .eq('contractor_id', contractor.id)
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('❌ Error reverting to baseline:', error);
      } else {
        console.log('✅ Reverted to baseline successfully');
        
        // Reset rd_contractor_year_data to baseline values
        const baselinePercent = contractor.baseline_applied_percent || 0;
        const contractorAmount = contractor.amount || 0;
        const fullQRE = Math.round((contractorAmount * baselinePercent) / 100);
        const calculatedQRE = Math.round(fullQRE * 0.65); // Apply 65% reduction for contractors

        const { error: yearDataError } = await supabase
          .from('rd_contractor_year_data')
          .update({
            applied_percent: baselinePercent,
            calculated_qre: calculatedQRE,
            updated_at: new Date().toISOString()
          })
          .eq('contractor_id', contractor.id)
          .eq('business_year_id', businessYearId);

        if (yearDataError) {
          console.error('❌ Error updating contractor year data on revert:', yearDataError);
        } else {
          console.log('✅ Reset contractor year data to baseline:', baselinePercent, 'and QRE:', calculatedQRE);
        }
        
        // Reset subcomponent time percentages back to baseline
        setActivities(prev => prev.map(activity => ({
          ...activity,
          subcomponents: activity.subcomponents.map(sub => ({
            ...sub,
            timePercentage: sub.baselineTimePercentage || sub.maxTimePercentage // Reset to baseline
          }))
        })));
        
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('❌ Error reverting to baseline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !contractor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Manage Allocations - {contractor.first_name} {contractor.last_name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
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
                    <p className="text-xs text-gray-500">How time is allocated across activities and non-R&D work</p>
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
                
                {/* Enhanced Legend */}
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
                    <p className="text-red-600 text-sm">⚠️ Total exceeds 100%. Please adjust allocations.</p>
                  </div>
                )}
              </div>

              {/* Applied Percentage Bar */}
              <div className="mb-8 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Applied Percentage (Research Activities)</h4>
                    <p className="text-xs text-gray-500">Based on role baseline: {formatPercentage(contractor?.baseline_applied_percent || 0)}%</p>
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
                
                {/* Enhanced Legend */}
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
                <p className="text-xs text-orange-600 mt-2">
                  ℹ️ This time is automatically redistributed across research activities in the practice percentage bar
                </p>
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

                      {/* Practice Percentage Slider */}
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
                    disabled={loading || totalAllocated > 100}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Allocations'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractorAllocationsModal; 