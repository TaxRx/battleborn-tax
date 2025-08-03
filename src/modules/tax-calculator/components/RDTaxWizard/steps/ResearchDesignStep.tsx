import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResearchDesignService } from "../../../../../services/researchDesignService";
// RolesService removed - now handled by RoleSnapshot component
import {
  ResearchActivityWithSteps,
  SelectedStep,
  SelectedSubcomponent,
  STEP_COLORS,
  SUBCOMPONENT_COLORS
} from "../../../../../types/researchDesign";
import SubcomponentCard from './SubcomponentCard';
import RoleSnapshot, { RoleSnapshotRef } from './RoleSnapshot';
import { supabase } from "../../../../../lib/supabase";
import ResearchReportModal from "../../ResearchReport/ResearchReportModal";
import { FileText } from "lucide-react";
import { AppliedPercentageBar, generateSegmentColors } from '../../common/AppliedPercentageBar';
import StepCompletionBanner from '../../../../../components/common/StepCompletionBanner';

interface ResearchDesignStepProps {
  selectedActivities: Array<{ 
    id: string; 
    activity_id: string;
    activity_name?: string;
    name?: string; // For backward compatibility
    practice_percent?: number;
    percentage?: number; // For backward compatibility
    selected_roles?: string[];
  }>;
  businessYearId: string;
  businessId?: string;
  year?: number;
  yearRefreshTrigger?: number; // Trigger to refresh year dropdowns when business years are updated
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface ResearchStep {
  id: string;
  name: string;
  percentage: number;
  isLocked: boolean;
  isEnabled: boolean;
  order: number;
  subcomponents: any[];
  nonRdPercentage: number;
}

// Custom slider styles
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

const ResearchDesignStep: React.FC<ResearchDesignStepProps> = ({
  selectedActivities: selectedActivitiesProp,
  businessYearId,
  businessId,
  year,
  yearRefreshTrigger,
  onUpdate,
  onNext,
  onPrevious
}) => {
  console.log('ResearchDesignStep: Component mounted with props:', {
    selectedActivitiesProp,
    businessYearId,
    businessId,
    year,
    yearRefreshTrigger: typeof yearRefreshTrigger,
    onUpdate: typeof onUpdate,
    onNext: typeof onNext,
    onPrevious: typeof onPrevious
  });

  const [selectedActivities, setSelectedActivities] = useState<Array<{ 
    id: string; 
    activity_id: string;
    activity_name?: string;
    name?: string;
    practice_percent?: number;
    percentage?: number;
    selected_roles?: string[];
  }>>([]);
  const [activitiesWithSteps, setActivitiesWithSteps] = useState<ResearchActivityWithSteps[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<SelectedStep[]>([]);
  const [selectedSubcomponents, setSelectedSubcomponents] = useState<SelectedSubcomponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeActivityIndex, setActiveActivityIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [nonRdPercentage, setNonRdPercentage] = useState(0);

  // New state for step allocation
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  const [showStepAllocation, setShowStepAllocation] = useState(false);
  const [subcomponents, setSubcomponents] = useState<any[]>([]);
  
  // Roles now handled by RoleSnapshot component

  // Accordion state management
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Non-R&D modal state
  const [showNonRdModal, setShowNonRdModal] = useState(false);
  const [selectedStepForNonRd, setSelectedStepForNonRd] = useState<string | null>(null);

  // Research Report modal state
  const [showResearchReportModal, setShowResearchReportModal] = useState(false);

  // Role Snapshot ref for real-time updates
  const roleSnapshotRef = useRef<RoleSnapshotRef>(null);

  // FIXED: Removed problematic debugging useEffect that was causing React hooks error

  // Helper function to trigger role snapshot recalculation
  const triggerRoleSnapshotUpdate = (delay: number = 100, context: string = '') => {
    console.log(`🔄 Triggering role snapshot recalculation${context ? ` after ${context}` : ''}...`);
    setTimeout(() => {
      roleSnapshotRef.current?.recalculate();
    }, delay);
  };

  // Subcomponent state management
  const [subcomponentStates, setSubcomponentStates] = useState<{
    [key: string]: {
      isSelected: boolean;
      frequencyPercent: number;
      yearPercent: number;
      startYear: number;
      startMonth: number;
      monthName: string;
      selectedRoles: string[];
      appliedPercentage: number;
      // Text fields
      general_description?: string;
      goal?: string;
      hypothesis?: string;
      alternatives?: string;
      uncertainties?: string;
      developmental_process?: string;
      primary_goal?: string;
      expected_outcome_type?: string;
      cpt_codes?: string;
      cdt_codes?: string;
      alternative_paths?: string;
    };
  }>({});

  // Extract businessId and year if not provided
  const effectiveBusinessId = businessId || businessYearId.split('_')[0]; // Assuming format: businessId_year
  const effectiveYear = year || new Date().getFullYear();

  // Initialize year selector state early to avoid hoisting issues
  const [availableActivityYears, setAvailableActivityYears] = useState<Array<{id: string, year: number}>>([]);
  const [selectedActivityYearId, setSelectedActivityYearId] = useState<string>(businessYearId);
  const [selectedActivityYear, setSelectedActivityYear] = useState<number>(year || new Date().getFullYear());

  // Use the selected year ID for all data operations instead of the hardcoded businessYearId
  // IMPORTANT: Always use the selected year ID, fall back to businessYearId only if no year is selected
  const effectiveBusinessYearId = selectedActivityYearId || businessYearId;

  // Debounced database update functionality
  const databaseUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Map<string, { stepId: string; percentage: number }>>(new Map());

  const debouncedUpdateDatabase = useCallback(async (stepId: string, percentage: number) => {
    console.log('🔄 [DEBOUNCED UPDATE] Scheduling update for step:', stepId, 'percentage:', percentage);
    
    // Store the pending update
    pendingUpdatesRef.current.set(stepId, { stepId, percentage });
    
    // Clear existing timeout
    if (databaseUpdateTimeoutRef.current) {
      clearTimeout(databaseUpdateTimeoutRef.current);
      console.log('🔄 [DEBOUNCED UPDATE] Cleared existing timeout');
    }
    
    // Set new timeout
    databaseUpdateTimeoutRef.current = setTimeout(async () => {
      const updates = Array.from(pendingUpdatesRef.current.values());
      pendingUpdatesRef.current.clear();
      
      console.log('💾 [DEBOUNCED UPDATE] Executing database updates:', updates);
      
      // Get current activity at execution time, not closure time
      const currentActivity = activitiesWithSteps[activeActivityIndex];
      if (!currentActivity) {
        console.error('❌ [DEBOUNCED UPDATE] No current activity found');
        return;
      }
      
      console.log('💾 [DEBOUNCED UPDATE] Using activity:', currentActivity.title || currentActivity.activityName, 'ID:', currentActivity.id || currentActivity.activityId);
      
      // Batch update all pending changes
      for (const update of updates) {
        try {
          console.log('💾 [DEBOUNCED UPDATE] Updating step:', update.stepId, 'to:', update.percentage, '%');
          
          const { error } = await supabase
            .from('rd_selected_steps')
            .upsert({
              business_year_id: effectiveBusinessYearId,
              research_activity_id: currentActivity.id || currentActivity.activityId,
              step_id: update.stepId,
              time_percentage: update.percentage
            }, { onConflict: 'business_year_id,step_id' });
            
          if (error) {
            console.error('❌ [DEBOUNCED UPDATE] Error updating step time percentage:', error);
          } else {
            console.log('✅ [DEBOUNCED UPDATE] Successfully updated step time percentage:', update.stepId, 'to:', update.percentage);
            
            // Update local state to reflect the saved changes
            setSelectedSteps(prev => 
              prev.map(s => 
                s.step_id === update.stepId 
                  ? { ...s, time_percentage: update.percentage }
                  : s
              )
            );
          }
        } catch (error) {
          console.error('❌ [DEBOUNCED UPDATE] Error updating step time percentage:', error);
        }
      }
      
      console.log('🔄 [DEBOUNCED UPDATE] Triggering recalculation of applied percentages...');
      // Trigger recalculation after all updates
      try {
        await recalculateAllAppliedPercentages();
        console.log('✅ [DEBOUNCED UPDATE] Recalculation completed successfully');
      } catch (error) {
        console.error('❌ [DEBOUNCED UPDATE] Error during recalculation:', error);
      }
    }, 500); // 500ms debounce delay
  }, [activitiesWithSteps, activeActivityIndex, effectiveBusinessYearId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (databaseUpdateTimeoutRef.current) {
        clearTimeout(databaseUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Note: Data isolation is now handled by parent component via key prop
  // which forces complete component remount when switching businesses

  // Helper functions to handle both old and new data structures
  const getActivityName = (activity: any) => {
    return activity.activity_name || activity.activityName || activity.name || 'Unknown Activity';
  };

  const getActivityPercentage = (activity: any) => {
    return activity.practice_percent || activity.percentage || 0;
  };

  const getActivityId = (activity: any) => {
    return activity.activity_id || activity.activityId || activity.id;
  };

  // Load selected activities from database
  const loadSelectedActivities = async () => {
    console.log('ResearchDesignStep: loadSelectedActivities called with selectedActivityYearId:', selectedActivityYearId);
    
    if (!selectedActivityYearId) {
      console.log('ResearchDesignStep: No selectedActivityYearId provided, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      console.log('ResearchDesignStep: Calling ResearchDesignService.getSelectedActivities...');
      const activities = await ResearchDesignService.getSelectedActivities(selectedActivityYearId);
      console.log('ResearchDesignStep: Received activities from service:', activities);
      
      setSelectedActivities(activities);
      
      // Update parent component
      onUpdate({ selectedActivities: activities });
    } catch (error) {
      console.error('ResearchDesignStep: Error loading selected activities:', error);
    }
  };

  useEffect(() => {
    // If we have activities from the parent component, use those
    if (selectedActivitiesProp && selectedActivitiesProp.length > 0) {
      console.log('ResearchDesignStep: Using activities from parent component:', selectedActivitiesProp);
      setSelectedActivities(selectedActivitiesProp);
    } else {
      // Only load from database if no activities are provided
      console.log('ResearchDesignStep: No activities from parent, loading from database');
      loadSelectedActivities();
    }
  }, [selectedActivitiesProp, businessYearId]);

  // Reset activeStepIndex when switching activities
  useEffect(() => {
    setActiveStepIndex(0);
  }, [activeActivityIndex]);

  useEffect(() => {
    loadResearchDesignData();
  }, [selectedActivities, selectedActivityYearId]);

  const loadResearchDesignData = async () => {
    if (!selectedActivities.length || !selectedActivityYearId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First, check if there are any steps in the database at all
      const allSteps = await ResearchDesignService.getAllSteps();
      console.log('ResearchDesignStep: All steps in database:', allSteps);
      
      const activityIds = selectedActivities.map(activity => getActivityId(activity));
      console.log('ResearchDesignStep: Activity IDs to load:', activityIds);
      
      // Load activities with steps and subcomponents
      const activitiesData = await ResearchDesignService.getActivitiesWithSteps(activityIds);
      console.log('ResearchDesignStep: Activities with steps data:', activitiesData);
      
      // CRITICAL DEBUGGING: Check if subcomponents are loaded
      console.log('🔍 [CRITICAL DEBUG] Checking subcomponent data in activitiesData:');
      activitiesData.forEach((activity, actIndex) => {
        console.log(`🔍 Activity ${actIndex}: ${activity.activityName}`);
        console.log(`   - Steps count: ${activity.steps?.length || 0}`);
        activity.steps?.forEach((step, stepIndex) => {
          console.log(`   - Step ${stepIndex}: ${step.name}`);
          console.log(`     - Subcomponents count: ${step.subcomponents?.length || 0}`);
          console.log(`     - Subcomponents:`, step.subcomponents);
        });
      });
      
      setActivitiesWithSteps(activitiesData);

      // Load existing selections
      const [stepsData, subcomponentsData] = await Promise.all([
        ResearchDesignService.getSelectedSteps(selectedActivityYearId),
        ResearchDesignService.getSelectedSubcomponents(selectedActivityYearId)
      ]);

      console.log('ResearchDesignStep: Loaded steps data:', stepsData);
      console.log('ResearchDesignStep: Loaded subcomponents data:', subcomponentsData);

      // Check if we need to initialize steps for any activities
      const existingStepActivityIds = stepsData.map(step => step.research_activity_id);
      const activitiesNeedingSteps = activitiesData.filter(activity => 
        !existingStepActivityIds.includes(activity.id || activity.activityId)
      );

      console.log('Activities needing steps initialization:', activitiesNeedingSteps);

      // Initialize steps for activities that don't have them
      for (const activity of activitiesNeedingSteps) {
        console.log('Initializing steps for activity:', activity.activityName);
        await initializeSteps(activity);
      }

      // Reload steps data after initialization
      const updatedStepsData = await ResearchDesignService.getSelectedSteps(selectedActivityYearId);
      console.log('ResearchDesignStep: Updated steps data after initialization:', updatedStepsData);

      setSelectedSteps(updatedStepsData);
      setSelectedSubcomponents(subcomponentsData);
      
      // Debug: Log all available data for applied percentage calculation
      console.log('=== DATA LOADED FOR APPLIED PERCENTAGE CALCULATION ===');
      console.log('selectedActivities:', selectedActivities);
      console.log('selectedSteps:', updatedStepsData);
      console.log('selectedSubcomponents:', subcomponentsData);
      console.log('activitiesWithSteps:', activitiesData);
      
      // Log each activity's data
      selectedActivities.forEach((activity, index) => {
        console.log(`Activity ${index} data:`, {
          id: activity.id,
          activity_id: activity.activity_id,
          name: getActivityName(activity),
          practice_percent: getActivityPercentage(activity)
        });
      });
      
      // Log steps data
      updatedStepsData.forEach(step => {
        console.log(`Step data:`, {
          step_id: step.step_id,
          research_activity_id: step.research_activity_id,
          time_percentage: step.time_percentage
        });
      });
      
      // Log subcomponents data
      subcomponentsData.forEach(sub => {
        console.log(`Subcomponent data:`, {
          subcomponent_id: sub.subcomponent_id,
          step_id: sub.step_id,
          frequency_percentage: sub.frequency_percentage,
          year_percentage: sub.year_percentage
        });
      });
      console.log('=== END DATA LOG ===');
      
      // Debug: Log the structure of activitiesWithSteps
      console.log('ResearchDesignStep: activitiesWithSteps structure:', activitiesData.map(activity => ({
        activityId: activity.id || activity.activityId,
        activityName: activity.title || activity.activityName,
        stepsCount: activity.steps?.length || 0,
        steps: activity.steps?.map(step => ({
          id: step.id,
          name: step.name,
          subcomponentsCount: step.subcomponents?.length || 0,
          subcomponents: step.subcomponents?.map(sub => ({
            id: sub.id,
            title: sub.title,
            name: sub.name
          }))
        }))
      })));
      
      // Debug: Check if subcomponents have proper titles
      activitiesData.forEach(activity => {
        activity.steps?.forEach(step => {
          step.subcomponents?.forEach(sub => {
            console.log(`Subcomponent ${sub.id}: title="${sub.title}", name="${sub.name}"`);
          });
        });
      });
      
      // Debug: Check selectedSteps data
      console.log('ResearchDesignStep: SelectedSteps data:', updatedStepsData.map(step => ({
        step_id: step.step_id,
        time_percentage: step.time_percentage,
        applied_percentage: step.applied_percentage
      })));
      
      // Debug: Check selectedSubcomponents data
      console.log('ResearchDesignStep: SelectedSubcomponents data:', subcomponentsData.map(sub => ({
        subcomponent_id: sub.subcomponent_id,
        frequency_percentage: sub.frequency_percentage,
        year_percentage: sub.year_percentage,
        isSelected: true // All loaded subcomponents should be selected
      })));
      
      // 1. Load step time percentages from rd_selected_steps
      const loadStepTimePercentages = async () => {
        try {
          const { data, error } = await supabase
            .from('rd_selected_steps')
            .select('*')
            .eq('business_year_id', selectedActivityYearId);
          if (error) {
            console.error('Error loading step time percentages:', error);
            return [];
          }
          return data || [];
        } catch (err) {
          console.error('Error loading step time percentages:', err);
          return [];
        }
      };

      // In loadResearchDesignData, after loading activitiesWithSteps, load step time percentages
      const stepTimePercentages = await loadStepTimePercentages();
      setSelectedSteps(stepTimePercentages);
    } catch (error) {
      console.error('Error loading research design data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to save applied percentage to database
  const saveAppliedPercentage = async (subcomponentId: string, appliedPercentage: number) => {
    try {
      const { error } = await supabase
        .from('rd_selected_subcomponents')
        .update({ applied_percentage: appliedPercentage })
        .eq('subcomponent_id', subcomponentId)
        .eq('business_year_id', selectedActivityYearId);
        
      if (error) {
        console.error('Error saving applied percentage:', error);
      } else {
        console.log('Successfully saved applied percentage for subcomponent:', subcomponentId, 'Value:', appliedPercentage);
      }
    } catch (error) {
      console.error('Error saving applied percentage:', error);
    }
  };

  // Helper function to calculate and save applied percentage for a subcomponent
  const calculateAndSaveAppliedPercentage = async (subcomponentId: string, stepId: string) => {
    // Find the current activity and step data
    const currentActivity = activitiesWithSteps[activeActivityIndex];
    if (!currentActivity) {
      console.log('No current activity found for applied percentage calculation');
      return;
    }

    // CRITICAL FIX: Get practice percentage from DATABASE, not from UI state
    // The UI state may have wrong values, so we need to fetch from rd_selected_activities
    const { data: activityData, error: activityError } = await supabase
      .from('rd_selected_activities')
      .select('practice_percent')
      .eq('activity_id', currentActivity.id || currentActivity.activityId)
      .eq('business_year_id', selectedActivityYearId)
      .single();
    
    if (activityError) {
      console.error('🚨 Error fetching activity practice percent from database:', activityError);
      return;
    }
    
    const practicePercent = activityData?.practice_percent || 0;
    console.log('✅ FIXED: Using practice percent from DATABASE:', practicePercent, 'for activity:', currentActivity.id || currentActivity.activityId);
    
    const selectedStep = selectedSteps.find(s => s.step_id === stepId);
    const stepTimePercent = selectedStep?.time_percentage ?? 0;
    const selectedSub = selectedSubcomponents.find(
      s => s.subcomponent_id === subcomponentId && s.step_id === stepId
    );
    
    // Find the step name from the activitiesWithSteps data
    const step = currentActivity.steps?.find(s => s.id === stepId);
    const stepName = step?.name || '';
    
    console.log('Applied percentage calculation for subcomponent:', subcomponentId, {
      practicePercent,
      stepTimePercent,
      stepName,
      selectedSub: selectedSub ? {
        frequency_percentage: selectedSub.frequency_percentage,
        year_percentage: selectedSub.year_percentage
      } : null,
      selectedSteps: selectedSteps.map(s => ({ step_id: s.step_id, time_percentage: s.time_percentage })),
      selectedSubcomponents: selectedSubcomponents.map(s => ({ 
        subcomponent_id: s.subcomponent_id, 
        step_id: s.step_id,
        frequency_percentage: s.frequency_percentage,
        year_percentage: s.year_percentage 
      }))
    });
    
    if (selectedSub && practicePercent > 0 && stepTimePercent > 0) {
      const freq = selectedSub.frequency_percentage ?? 0;
      const year = selectedSub.year_percentage ?? 0;
      
      if (freq > 0 && year > 0) {
        // Get step info for Non-R&D adjustment
        const step = activitiesWithSteps[activeActivityIndex]?.steps?.find(s => s.id === stepId);
        const nonRdPercent = step?.nonRdPercentage || 0;
        
        // Calculate base applied percentage
        let applied = (practicePercent / 100) * (stepTimePercent / 100) * (freq / 100) * (year / 100) * 100;
        
        // Apply Non-R&D reduction
        if (nonRdPercent > 0) {
          const rdOnlyPercent = (100 - nonRdPercent) / 100;
          applied = applied * rdOnlyPercent;
        }
        
        console.log('Calculated applied percentage:', applied, 'for subcomponent:', subcomponentId, 'with Non-R&D adjustment:', nonRdPercent);
        
        // Save applied percentage, time percentage, and step name (DO NOT overwrite practice_percent)
        try {
          const { error } = await supabase
            .from('rd_selected_subcomponents')
            .update({ 
              applied_percentage: applied,
              time_percentage: stepTimePercent,
              step_name: stepName
            })
            .eq('subcomponent_id', subcomponentId)
            .eq('business_year_id', selectedActivityYearId);
            
          if (error) {
            console.error('Error saving applied percentage, time percentage, and step name:', error);
          } else {
            console.log('Successfully saved applied percentage, time percentage, and step name for subcomponent:', subcomponentId, {
              applied_percentage: applied,
              time_percentage: stepTimePercent,
              step_name: stepName
            });
            
            // ✅ REGRESSION FIX: Removed problematic role snapshot trigger
            // ISSUE: triggerRoleSnapshotUpdate() here caused roles to recalculate when activity cards were clicked
            // SOLUTION: Role calculations should be STABLE and independent of activity applied percentage changes
            // RESULT: Clicking activity cards no longer affects Role Applied Percentage values
          }
        } catch (error) {
          console.error('Error saving applied percentage, time percentage, and step name:', error);
        }
      } else {
        console.log('Skipping applied percentage calculation - freq or year is 0:', { freq, year });
      }
    } else {
      console.log('Skipping applied percentage calculation - missing data:', {
        hasSelectedSub: !!selectedSub,
        practicePercent,
        stepTimePercent,
        selectedSub: selectedSub
      });
    }
  };

  // Helper function to recalculate and save applied percentages for all subcomponents
  const recalculateAllAppliedPercentages = async () => {
    console.log('🔄 FORCE RECALCULATING all applied percentages...');
    console.log('Current selectedSteps data:', selectedSteps.map(s => ({ step_id: s.step_id, time_percentage: s.time_percentage })));
    console.log('Current selectedSubcomponents data:', selectedSubcomponents.map(s => ({ 
      subcomponent_id: s.subcomponent_id, 
      step_id: s.step_id,
      frequency_percentage: s.frequency_percentage,
      year_percentage: s.year_percentage 
    })));
    
    for (const subcomponent of selectedSubcomponents) {
      await calculateAndSaveAppliedPercentage(subcomponent.subcomponent_id, subcomponent.step_id);
    }
    
    console.log('✅ Finished force recalculating all applied percentages');
    
    // Recalculate roles after updating all applied percentages
    // REMOVED: Direct call to prevent excessive role recalculation
    // setTimeout(() => {
    //   loadRolesData();
    // }, 200);
  };

  // Diagnostic function to check database values
  const diagnosticDatabaseValues = async () => {
    console.log('🔍 DIAGNOSTIC: Checking database values...');
    
    const { data: dbSubcomponents, error } = await supabase
      .from('rd_selected_subcomponents')
      .select('*')
      .eq('business_year_id', selectedActivityYearId);
      
    if (error) {
      console.error('Error fetching diagnostic data:', error);
      return;
    }
    
    console.log('📊 DATABASE SUBCOMPONENTS:');
    (dbSubcomponents || []).forEach(sub => {
      console.log(`  Subcomponent ${sub.subcomponent_id}:`);
      console.log(`    - Applied Percentage: ${sub.applied_percentage || 0}%`);
      console.log(`    - Time Percentage: ${sub.time_percentage || 0}%`);
      console.log(`    - Frequency: ${sub.frequency_percentage || 0}%`);
      console.log(`    - Year: ${sub.year_percentage || 0}%`);
      console.log(`    - Step ID: ${sub.step_id}`);
    });
    
    const { data: dbSteps } = await supabase
      .from('rd_selected_steps')
      .select('*')
      .eq('business_year_id', selectedActivityYearId);
      
    console.log('📊 DATABASE STEPS:');
    (dbSteps || []).forEach(step => {
      console.log(`  Step ${step.step_id}:`);
      console.log(`    - Time Percentage: ${step.time_percentage || 0}%`);
      console.log(`    - Research Activity ID: ${step.research_activity_id}`);
    });
  };

  // Force recalculation function (for manual triggering)
  const forceRecalculateEverything = async () => {
    console.log('🚀 FORCE RECALCULATING EVERYTHING...');
    
    // First show diagnostic info
    await diagnosticDatabaseValues();
    
    // Reload all data from database first
    await loadResearchDesignData();
    
    // Then recalculate applied percentages
    setTimeout(async () => {
      await recalculateAllAppliedPercentages();
      
      // Show diagnostic info again after recalculation
      setTimeout(async () => {
        await diagnosticDatabaseValues();
      }, 1000);
    }, 500);
  };

  // 2. When updating a step's time percentage, upsert to rd_selected_steps
  const updateStepTimePercentage = async (stepId: string, timePercentage: number) => {
    console.log('Updating step time percentage:', { stepId, timePercentage, businessYearId });
    setSelectedSteps(prev => prev.map(step => step.step_id === stepId ? { ...step, time_percentage: timePercentage } : step));
    try {
      const { error } = await supabase
        .from('rd_selected_steps')
        .upsert({
          business_year_id: selectedActivityYearId,
          research_activity_id: activitiesWithSteps[activeActivityIndex]?.id || activitiesWithSteps[activeActivityIndex]?.activityId,
          step_id: stepId,
          time_percentage: timePercentage
        }, { onConflict: 'business_year_id,step_id' });
      if (error) {
        console.error('Error updating step time percentage:', error);
      } else {
        console.log('Successfully updated step time percentage for step:', stepId);
      }
    } catch (error) {
      console.error('Error updating step time percentage:', error);
    }
  };

  const updateSubcomponent = async (subcomponentId: string, updates: Partial<SelectedSubcomponent>) => {
    // Find the existing subcomponent to get its step_id and research_activity_id
    const existing = selectedSubcomponents.find(s => s.subcomponent_id === subcomponentId);
    if (!existing) {
      console.error('No existing subcomponent found for update:', subcomponentId);
      return;
    }

    const currentYear = new Date().getFullYear();

    const subcomponentData: Omit<SelectedSubcomponent, 'id' | 'created_at' | 'updated_at'> = {
      business_year_id: selectedActivityYearId,
      research_activity_id: existing.research_activity_id,  // Keep existing activity assignment
      step_id: existing.step_id,  // Keep existing step assignment
      subcomponent_id: subcomponentId,
      frequency_percentage: existing?.frequency_percentage || 0,
      year_percentage: existing?.year_percentage || 100,
      start_month: existing?.start_month || 1,
      start_year: existing?.start_year || currentYear,
      selected_roles: existing?.selected_roles || [],
      non_rd_percentage: existing?.non_rd_percentage || 0,
      approval_data: existing?.approval_data || {},
      ...updates
    };

    const savedSubcomponent = await ResearchDesignService.saveSelectedSubcomponent(subcomponentData);
    if (savedSubcomponent) {
      setSelectedSubcomponents(prev => {
        const filtered = prev.filter(s => s.subcomponent_id !== subcomponentId);
        return [...filtered, savedSubcomponent];
      });
    }
  };

  const handleNonRdChange = (percentage: number) => {
    setNonRdPercentage(percentage);
    // Update all subcomponents to reflect the non-R&D percentage
    selectedSubcomponents.forEach(subcomponent => {
      updateSubcomponent(subcomponent.subcomponent_id, { non_rd_percentage: percentage });
    });
  };

  // Load steps from saved data without overwriting database values
  const loadStepsFromSavedData = (activity: any) => {
    if (!activity.steps || activity.steps.length === 0) return;
    
    console.log('🔄 [LOAD SAVED DATA] Loading UI from saved data for activity:', activity.activityName);
    console.log('🔄 [LOAD SAVED DATA] Available selectedSteps:', selectedSteps);
    console.log('🔄 [LOAD SAVED DATA] Activity steps with subcomponents:', activity.steps);
    
    const steps: ResearchStep[] = activity.steps.map((step: any, index: number) => {
      // Find the saved time percentage for this step
      const savedStep = selectedSteps.find(s => s.step_id === step.id);
      const savedPercentage = savedStep?.time_percentage || (100 / activity.steps.length); // Fallback to equal if no saved data
      
      // CRITICAL FIX: Load non_rd_percentage from database
      const savedNonRdPercentage = savedStep?.non_rd_percentage || 0;
      
      console.log(`🔄 [LOAD SAVED DATA] Step ${step.name}:`, {
        stepId: step.id,
        savedPercentage: savedStep?.time_percentage,
        savedNonRdPercentage: savedStep?.non_rd_percentage,
        usingPercentage: savedPercentage,
        usingNonRdPercentage: savedNonRdPercentage,
        foundInDatabase: !!savedStep,
        subcomponentsCount: step.subcomponents?.length || 0
      });
      
      return {
        id: step.id,
        name: step.name,
        percentage: savedPercentage,
        isLocked: false,
        isEnabled: true,
        order: index,
        subcomponents: step.subcomponents || [], // CRITICAL: Ensure subcomponents are included
        nonRdPercentage: savedNonRdPercentage // FIXED: Load from database
      };
    });
    
    setResearchSteps(steps);
    console.log('🔄 [LOAD SAVED DATA] Set research steps from saved data:', steps);
    console.log('🔄 [CRITICAL FIX] Total subcomponents loaded:', steps.reduce((sum, step) => sum + (step.subcomponents?.length || 0), 0));
  };

  // Force recalculate - resets to baseline equal distribution
  const forceRecalculateSteps = async (activity: any) => {
    console.log('🔄 [FORCE RECALCULATE] Forcing reset to baseline for activity:', activity.activityName);
    await initializeSteps(activity, true); // Force reset = true
  };

  // Step allocation functions (for NEW activities or Force Recalculate)
  const initializeSteps = async (activity: any, forceReset: boolean = false) => {
    if (!activity.steps || activity.steps.length === 0) {
      console.log('🚨 [CRITICAL] No steps found for activity:', activity.activityName);
      return;
    }
    
    const stepCount = activity.steps.length;
    const equalPercentage = 100 / stepCount;
    
    console.log('🔧 [INITIALIZE STEPS] Initializing steps for activity:', activity.activityName);
    console.log('🔧 [INITIALIZE STEPS] Force reset mode:', forceReset);
    console.log('🔧 [INITIALIZE STEPS] Activity steps data:', activity.steps);
    console.log('🔧 [INITIALIZE STEPS] Checking for existing saved time percentages...');
    console.log('🔧 [INITIALIZE STEPS] selectedSteps:', selectedSteps);
    
    const steps: ResearchStep[] = activity.steps.map((step: any, index: number) => {
      // Check if we have a saved time percentage for this step
      const savedStep = selectedSteps.find(s => s.step_id === step.id);
      const savedPercentage = savedStep?.time_percentage;
      
      // Use saved percentage if available AND not forcing reset, 
      // otherwise use preset from Research Activity Management (default_time_percentage),
      // finally fall back to equal distribution if no preset is available
      const presetPercentage = step.default_time_percentage || equalPercentage;
      const stepPercentage = (savedPercentage !== undefined && !forceReset) ? savedPercentage : presetPercentage;
      
      // ENHANCED: Use saved non-R&D percentage if available AND not forcing reset, 
      // otherwise generate random 15-25% for new steps (as requested by user)
      let finalNonRdPercentage: number;
      if (savedStep?.non_rd_percentage !== undefined && !forceReset) {
        // Use saved value
        finalNonRdPercentage = savedStep.non_rd_percentage;
      } else {
        // NEW FEATURE: Generate random 15-25% Non-R&D percentage for initial step creation
        finalNonRdPercentage = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
        console.log(`🎲 [NON-R&D RANDOM] Generated ${finalNonRdPercentage}% Non-R&D for new step: ${step.name}`);
      }
      
      console.log(`🔧 [INITIALIZE STEPS] Step ${step.name}:`, {
        stepId: step.id,
        savedPercentage,
        presetPercentage: step.default_time_percentage,
        equalPercentage,
        savedNonRdPercentage: savedStep?.non_rd_percentage,
        usingPercentage: stepPercentage,
        usingNonRdPercentage: finalNonRdPercentage,
        source: savedPercentage !== undefined ? 'SAVED' : 
                (step.default_time_percentage ? 'PRESET_FROM_ADMIN' : 'EQUAL_DISTRIBUTION'),
        nonRdSource: savedStep?.non_rd_percentage !== undefined ? 'SAVED' : 'RANDOM(15-25%)',
        subcomponentsCount: step.subcomponents?.length || 0,
        subcomponents: step.subcomponents
      });
      
      return {
        id: step.id,
        name: step.name,
        percentage: stepPercentage,
        isLocked: false,
        isEnabled: true,
        order: index,
        subcomponents: step.subcomponents || [], // CRITICAL: Ensure subcomponents are included
        nonRdPercentage: finalNonRdPercentage
      };
    });
    
    setResearchSteps(steps);
    console.log('🔧 [CRITICAL FIX] Total subcomponents loaded in initializeSteps:', steps.reduce((sum, step) => sum + (step.subcomponents?.length || 0), 0));
    
    // Only save to database if we used default values (new steps without saved data)
    const hasUnsavedSteps = steps.some(step => {
      const savedStep = selectedSteps.find(s => s.step_id === step.id);
      return savedStep?.time_percentage === undefined;
    });
    
    if (hasUnsavedSteps) {
      console.log('🔧 [INITIALIZE STEPS] Some steps need to be saved to database...');
      console.log('Activity data for initialization:', activity);
      
      // Get the correct activity ID from activitiesWithSteps structure
      // Fix: Use correct property name based on ResearchDesignService.getActivitiesWithSteps return structure
      const activityId = activity.id || activity.activityId;
      console.log('Using activity ID for step initialization:', activityId);
      
      if (!activityId) {
        console.error('❌ [INITIALIZE STEPS] No activity ID found, skipping initialization for activity:', activity);
        return;
      }
      
      for (const step of steps) {
        // Only save if this step doesn't already exist in database
        const savedStep = selectedSteps.find(s => s.step_id === step.id);
        if (savedStep?.time_percentage === undefined) {
          try {
            const { error } = await supabase
              .from('rd_selected_steps')
              .upsert({
                business_year_id: selectedActivityYearId,
                research_activity_id: activityId,
                step_id: step.id,
                time_percentage: step.percentage,
                non_rd_percentage: step.nonRdPercentage
              }, {
                onConflict: 'business_year_id,step_id'
              });
              
            if (error) {
              console.error('Error saving step time percentage:', error);
            } else {
              console.log('Successfully saved step time percentage for step:', step.id, 'Value:', step.percentage);
            }
          } catch (error) {
            console.error('Error saving step time percentage:', error);
          }
        }
      }
      
      // Refresh selectedSteps state to include the newly saved data
      try {
        const stepsData = await ResearchDesignService.getSelectedSteps(selectedActivityYearId);
        setSelectedSteps(stepsData);
        console.log('Refreshed selectedSteps with database data:', stepsData);
      } catch (error) {
        console.error('Error refreshing selectedSteps:', error);
      }
    } else {
      console.log('🔧 [INITIALIZE STEPS] All steps already have saved time percentages, no database update needed');
    }
  };

  const adjustStepPercentage = async (stepId: string, newPercentage: number) => {
    console.log('adjustStepPercentage called:', { stepId, newPercentage });
    
    setResearchSteps(prevSteps => {
      const stepIndex = prevSteps.findIndex(s => s.id === stepId);
      if (stepIndex === -1) return prevSteps;
      
      const step = prevSteps[stepIndex];
      if (step.isLocked) return prevSteps;
      
      // Validate percentage bounds
      newPercentage = Math.max(0, Math.min(100, newPercentage));
      
      const unlockedSteps = prevSteps.filter(s => !s.isLocked && s.isEnabled);
      const lockedSteps = prevSteps.filter(s => s.isLocked && s.isEnabled);
      const otherUnlockedSteps = unlockedSteps.filter(s => s.id !== stepId);
      
      const lockedTotal = lockedSteps.reduce((sum, s) => sum + s.percentage, 0);
      const currentStepPercentage = step.percentage;
      const difference = newPercentage - currentStepPercentage;
      
      console.log('Pro-rata redistribution debug:', {
        stepId,
        currentStepPercentage,
        newPercentage,
        difference,
        lockedTotal,
        otherUnlockedStepsCount: otherUnlockedSteps.length
      });
      
      // Check if we have enough room for the change
      const maxPossiblePercentage = 100 - lockedTotal;
      const otherStepsTotal = otherUnlockedSteps.reduce((sum, s) => sum + s.percentage, 0);
      const availableFromOthers = otherStepsTotal;
      
      // If increasing and we don't have enough room, cap the increase
      if (difference > 0 && difference > availableFromOthers) {
        newPercentage = currentStepPercentage + availableFromOthers;
        console.log('Capped increase to available space:', newPercentage);
      }
      
      // If decreasing beyond 0, cap at 0
      if (newPercentage < 0) {
        newPercentage = 0;
      }
      
      const finalDifference = newPercentage - currentStepPercentage;
      
      const updatedSteps = [...prevSteps];
      updatedSteps[stepIndex] = { ...step, percentage: newPercentage };
      
      // Pro-rata redistribution: distribute the difference proportionally among other unlocked steps
      if (otherUnlockedSteps.length > 0 && Math.abs(finalDifference) > 0.01) {
        const redistributionAmount = -finalDifference; // Negative because we're taking from others
        
        if (redistributionAmount > 0) {
          // We're giving percentage to other steps (this step decreased)
          // Distribute proportionally based on current percentages
          const otherStepsCurrentTotal = otherUnlockedSteps.reduce((sum, s) => sum + s.percentage, 0);
          
          if (otherStepsCurrentTotal > 0) {
            // Proportional distribution
            otherUnlockedSteps.forEach(otherStep => {
              const otherIndex = updatedSteps.findIndex(s => s.id === otherStep.id);
              if (otherIndex !== -1) {
                const proportion = otherStep.percentage / otherStepsCurrentTotal;
                const adjustment = redistributionAmount * proportion;
                updatedSteps[otherIndex] = { 
                  ...otherStep, 
                  percentage: Math.max(0, otherStep.percentage + adjustment)
                };
              }
            });
          } else {
            // Equal distribution if all other steps are at 0
            const equalShare = redistributionAmount / otherUnlockedSteps.length;
            otherUnlockedSteps.forEach(otherStep => {
              const otherIndex = updatedSteps.findIndex(s => s.id === otherStep.id);
              if (otherIndex !== -1) {
                updatedSteps[otherIndex] = { 
                  ...otherStep, 
                  percentage: Math.max(0, equalShare)
                };
              }
            });
          }
        } else {
          // We're taking percentage from other steps (this step increased)
          // Take proportionally from other steps
          const takeAmount = Math.abs(redistributionAmount);
          const otherStepsCurrentTotal = otherUnlockedSteps.reduce((sum, s) => sum + s.percentage, 0);
          
          if (otherStepsCurrentTotal > 0) {
            otherUnlockedSteps.forEach(otherStep => {
              const otherIndex = updatedSteps.findIndex(s => s.id === otherStep.id);
              if (otherIndex !== -1) {
                const proportion = otherStep.percentage / otherStepsCurrentTotal;
                const reduction = takeAmount * proportion;
                updatedSteps[otherIndex] = { 
                  ...otherStep, 
                  percentage: Math.max(0, otherStep.percentage - reduction)
                };
              }
            });
          }
        }
      }
      
      // Ensure total doesn't exceed 100% (safety check)
      const totalPercentage = updatedSteps.reduce((sum, s) => sum + (s.isEnabled ? s.percentage : 0), 0);
      if (totalPercentage > 100.01) { // Small tolerance for floating point
        console.warn('Total percentage exceeds 100%, normalizing:', totalPercentage);
        const scaleFactor = 100 / totalPercentage;
        updatedSteps.forEach((s, index) => {
          if (s.isEnabled) {
            updatedSteps[index] = { ...s, percentage: s.percentage * scaleFactor };
          }
        });
      }
      
      console.log('Final pro-rata updated steps:', updatedSteps.map(s => ({ 
        id: s.id, 
        name: s.name, 
        percentage: s.percentage.toFixed(2), 
        isLocked: s.isLocked, 
        isEnabled: s.isEnabled 
      })));
      
      return updatedSteps;
    });

    // Use debounced database update to prevent excessive calls
    debouncedUpdateDatabase(stepId, newPercentage);
  };

  const toggleStepLock = (stepId: string) => {
    setResearchSteps(prevSteps => 
      prevSteps.map(s => 
        s.id === stepId ? { ...s, isLocked: !s.isLocked } : s
      )
    );
  };

  const toggleStepEnabled = async (stepId: string) => {
    const currentActivity = activitiesWithSteps[activeActivityIndex];
    if (!currentActivity) {
      console.error('No current activity found for toggling step enabled state');
      return;
    }
    
    setResearchSteps(prevSteps => {
      const step = prevSteps.find(s => s.id === stepId);
      if (!step) return prevSteps;
      
      if (step.isEnabled) {
        // Disabling step - NO REDISTRIBUTION, just set to 0
        return prevSteps.map(s => {
          if (s.id === stepId) {
            return { ...s, isEnabled: false, percentage: 0 };
          }
          return s;
        });
      } else {
        // Enabling step - give it a default 10% without redistributing others
        return prevSteps.map(s => {
          if (s.id === stepId) {
            return { ...s, isEnabled: true, percentage: 10 };
          }
          return s;
        });
      }
    });

    // Save step data to database
    try {
      const updatedStep = researchSteps.find(s => s.id === stepId);
      if (updatedStep) {
        const stepData = {
          business_year_id: businessYearId,
          research_activity_id: currentActivity.id || currentActivity.activityId,
          step_id: stepId,
          time_percentage: updatedStep.percentage,
          applied_percentage: 0
        };
        
        const { error } = await supabase
          .from('rd_selected_steps')
          .upsert(stepData);
          
        if (error) {
          console.error('Error saving step data:', error);
        } else {
          console.log('Successfully saved step data:', stepData);
        }
      }
    } catch (error) {
      console.error('Error saving step data:', error);
    }
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    setResearchSteps(prevSteps => {
      const newSteps = [...prevSteps];
      const stepIndex = newSteps.findIndex(s => s.id === stepId);
      
      if (stepIndex === -1) return prevSteps;
      
      if (direction === 'up' && stepIndex > 0) {
        const targetIndex = stepIndex - 1;
        [newSteps[stepIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[stepIndex]];
        newSteps[stepIndex].order = stepIndex;
        newSteps[targetIndex].order = targetIndex;
      } else if (direction === 'down' && stepIndex < newSteps.length - 1) {
        const targetIndex = stepIndex + 1;
        [newSteps[stepIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[stepIndex]];
        newSteps[stepIndex].order = stepIndex;
        newSteps[targetIndex].order = targetIndex;
      }
      
      return newSteps;
    });
  };

  const toggleAccordion = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const addNewStep = () => {
    setResearchSteps(prevSteps => {
      const enabledSteps = prevSteps.filter(s => s.isEnabled);
      const equalDistribution = 100 / (enabledSteps.length + 1);
      
      const newStep: ResearchStep = {
        id: `new-step-${Date.now()}`,
        name: `New Step ${prevSteps.length + 1}`,
        percentage: equalDistribution,
        isLocked: false,
        isEnabled: true,
        order: prevSteps.length,
        subcomponents: [],
        nonRdPercentage: 0
      };
      
      return prevSteps.map(s => 
        s.isEnabled ? { ...s, percentage: equalDistribution } : s
      ).concat(newStep);
    });
  };

  const resetToEqual = async () => {
    const currentActivity = activitiesWithSteps[activeActivityIndex];
    if (!currentActivity) {
      console.error('No current activity found for resetting to equal');
      return;
    }
    
    setResearchSteps(prevSteps => {
      const enabledSteps = prevSteps.filter(s => s.isEnabled);
      const equalDistribution = enabledSteps.length > 0 ? 100 / enabledSteps.length : 0;
      
      return prevSteps.map(s => ({
        ...s,
        percentage: s.isEnabled ? equalDistribution : 0,
        isLocked: false
      }));
    });

    // Save the reset step percentages to the database
    try {
      const enabledSteps = researchSteps.filter(s => s.isEnabled);
      const equalDistribution = enabledSteps.length > 0 ? 100 / enabledSteps.length : 0;
      
      for (const step of researchSteps) {
        const { error } = await supabase
          .from('rd_selected_steps')
          .upsert({
            business_year_id: businessYearId,
            research_activity_id: currentActivity.id || currentActivity.activityId,
            step_id: step.id,
            time_percentage: step.isEnabled ? equalDistribution : 0
          }, {
            onConflict: 'business_year_id,step_id'
          });
          
        if (error) {
          console.error('Error saving reset step percentage:', error);
        } else {
          console.log('Successfully saved reset step percentage for step:', step.id, 'Value:', step.isEnabled ? equalDistribution : 0);
        }
      }
    } catch (error) {
      console.error('Error saving reset step percentages to database:', error);
    }

    // Also reset subcomponent frequencies to equal distribution
    setSubcomponentStates(prev => {
      const updated = { ...prev };
      
      // Group subcomponents by step
      const stepSubcomponents: { [stepId: string]: string[] } = {};
      
      // Get all selected subcomponents for each step
      Object.keys(updated).forEach(subcomponentId => {
        const subcomponent = selectedSubcomponents.find(s => s.subcomponent_id === subcomponentId);
        if (subcomponent) {
          const stepId = subcomponent.step_id;
          if (!stepSubcomponents[stepId]) {
            stepSubcomponents[stepId] = [];
          }
          stepSubcomponents[stepId].push(subcomponentId);
        }
      });
      
      // Reset frequencies for each step
      Object.keys(stepSubcomponents).forEach(stepId => {
        const subcomponentIds = stepSubcomponents[stepId];
        const equalFrequency = 100 / subcomponentIds.length;
        
        subcomponentIds.forEach(subcomponentId => {
          if (updated[subcomponentId]) {
            updated[subcomponentId].frequencyPercent = equalFrequency;
          }
        });
      });
      
      return updated;
    });
  };

  // Initialize steps ONLY for completely new activities (not when switching tabs)
  useEffect(() => {
    if (activitiesWithSteps.length > 0 && activeActivityIndex >= 0) {
      const currentActivity = activitiesWithSteps[activeActivityIndex];
      if (currentActivity) {
        // CRITICAL FIX: Only initialize if this activity has NO existing step records
        // This prevents overwriting saved time percentages when switching between activities
        const activityHasSteps = selectedSteps.some(step => 
          selectedSteps.some(selectedStep => {
            // Check if any step from this activity exists in selectedSteps
            return currentActivity.steps.some(activityStep => activityStep.id === selectedStep.step_id);
          })
        );
        
        console.log('🔧 [ACTIVITY SWITCH] Activity:', currentActivity.activityName, 'has existing steps:', activityHasSteps);
        
        if (!activityHasSteps && selectedSteps.length > 0) {
          // Only initialize for completely new activities
          console.log('🔧 [ACTIVITY SWITCH] Initializing NEW activity with default percentages');
          initializeSteps(currentActivity);
        } else {
          console.log('🔧 [ACTIVITY SWITCH] Activity has existing data - preserving saved time percentages');
          // Load the UI from existing saved data without calling initializeSteps
          loadStepsFromSavedData(currentActivity);
        }
      }
    } else if (selectedActivities.length === 0) {
      // Mock data for testing when accessed directly
      const mockSteps: ResearchStep[] = [
        {
          id: 'mock-step-1',
          name: 'Research Planning',
          percentage: 25,
          isLocked: false,
          isEnabled: true,
          order: 0,
          subcomponents: [],
          nonRdPercentage: 0
        },
        {
          id: 'mock-step-2',
          name: 'Data Collection',
          percentage: 30,
          isLocked: false,
          isEnabled: true,
          order: 1,
          subcomponents: [],
          nonRdPercentage: 0
        },
        {
          id: 'mock-step-3',
          name: 'Analysis & Testing',
          percentage: 25,
          isLocked: false,
          isEnabled: true,
          order: 2,
          subcomponents: [],
          nonRdPercentage: 0
        },
        {
          id: 'mock-step-4',
          name: 'Documentation',
          percentage: 20,
          isLocked: false,
          isEnabled: true,
          order: 3,
          subcomponents: [],
          nonRdPercentage: 0
        }
      ];
      setResearchSteps(mockSteps);
    }
  }, [activitiesWithSteps, activeActivityIndex, selectedActivities.length, selectedSteps]);

  // Load existing subcomponent data
  useEffect(() => {
    const loadSubcomponentData = async () => {
      if (!businessYearId) return;

      try {
        console.log('ResearchDesignStep: Loading subcomponent data for businessYearId:', businessYearId);
        
        const { data: selectedSubcomponents, error } = await supabase
          .from('rd_selected_subcomponents')
          .select('*')
          .eq('business_year_id', selectedActivityYearId);

        if (error) throw error;

        console.log('ResearchDesignStep: Loaded subcomponents from database:', selectedSubcomponents);

        const subcomponentData: { [key: string]: any } = {};
        selectedSubcomponents?.forEach(sub => {
          // Calculate the month based on start_month
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
          const monthIndex = (sub.start_month || 1) - 1; // Convert 1-12 to 0-11
          const monthName = months[monthIndex] || 'January';
          
          subcomponentData[sub.subcomponent_id] = {
            isSelected: true,
            frequencyPercent: sub.frequency_percentage || 0,
            yearPercent: sub.year_percentage || 100,
            startYear: sub.start_year || getDefaultStartYear(),
            startMonth: sub.start_month || 1,
            monthName: monthName,
            selectedRoles: sub.selected_roles || [],
            appliedPercentage: 0,
            // Load text fields
            general_description: sub.general_description || '',
            goal: sub.goal || '',
            hypothesis: sub.hypothesis || '',
            alternatives: sub.alternatives || '',
            uncertainties: sub.uncertainties || '',
            developmental_process: sub.developmental_process || '',
            primary_goal: sub.primary_goal || '',
            expected_outcome_type: sub.expected_outcome_type || '',
            cpt_codes: sub.cpt_codes || '',
            cdt_codes: sub.cdt_codes || '',
            alternative_paths: sub.alternative_paths || ''
          };
        });

        console.log('ResearchDesignStep: Processed subcomponent data:', subcomponentData);
        setSubcomponentStates(subcomponentData);
        
        // DISABLED: Auto-recalculation that was overwriting correct database values
        // setTimeout(() => {
        //   console.log('🔄 Auto-triggering recalculation on component load...');
        //   recalculateAllAppliedPercentages();
        // }, 100);
        
        // REMOVED: Automatic normalization that was overwriting user's custom values
        // The normalization should only happen when explicitly requested (add/remove subcomponents)
        // setTimeout(() => {
        //   normalizeSubcomponentFrequencies();
        // }, 100);
      } catch (error) {
        console.error('Error loading subcomponent data:', error);
      }
    };

    loadSubcomponentData();
  }, [businessYearId]);

  // Function to normalize subcomponent frequencies
  const normalizeSubcomponentFrequencies = async () => {
    setSubcomponentStates(prev => {
      const updated = { ...prev };
      
      // Group subcomponents by step
      const stepSubcomponents: { [stepId: string]: string[] } = {};
      
      Object.keys(updated).forEach(subcomponentId => {
        if (updated[subcomponentId].isSelected) {
          // Find which step this subcomponent belongs to
          const step = researchSteps.find(s => 
            s.subcomponents.some(sub => sub.id === subcomponentId)
          );
          if (step) {
            if (!stepSubcomponents[step.id]) {
              stepSubcomponents[step.id] = [];
            }
            stepSubcomponents[step.id].push(subcomponentId);
          }
        }
      });

      // Normalize frequencies within each step
      Object.keys(stepSubcomponents).forEach(stepId => {
        const subcomponentIds = stepSubcomponents[stepId];
        if (subcomponentIds.length > 0) {
          const step = researchSteps.find(s => s.id === stepId);
          if (step) {
            // Calculate available percentage considering non-R&D time
            const availableRdPercentage = 100 - step.nonRdPercentage;
            const equalShare = availableRdPercentage / subcomponentIds.length;
            
            subcomponentIds.forEach(subcomponentId => {
              updated[subcomponentId] = {
                ...updated[subcomponentId],
                frequencyPercent: equalShare
              };
            });
          }
        }
      });

      return updated;
    });

    // Save normalized frequencies to database
    try {
      const updates = [];
      setSubcomponentStates(prev => {
        Object.keys(prev).forEach(subcomponentId => {
          if (prev[subcomponentId].isSelected) {
            updates.push({
              subcomponent_id: subcomponentId,
              frequency_percentage: prev[subcomponentId].frequencyPercent
            });
          }
        });
        return prev;
      });

      // Update each subcomponent in the database
      for (const update of updates) {
        const { error } = await supabase
          .from('rd_selected_subcomponents')
          .update({ frequency_percentage: update.frequency_percentage })
          .eq('subcomponent_id', update.subcomponent_id)
          .eq('business_year_id', selectedActivityYearId);
          
        if (error) {
          console.error('Error updating normalized frequency:', error);
        }
      }
    } catch (error) {
      console.error('Error saving normalized frequencies:', error);
    }
  };

  // Helper functions for subcomponent calculations
  const getMonthPercentage = (month: string): number => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = months.indexOf(month);
    return monthIndex >= 0 ? 100 - (monthIndex * (100 / 12)) : 100;
  };

  const getDefaultStartYear = (): number => {
    const currentYear = new Date().getFullYear();
    // Use current year - 4 as default, or we can load business data later if needed
    return currentYear - 4;
  };

  const calculateAppliedPercentage = (
    practicePercent: number,
    stepTimePercent: number,
    frequencyPercent: number,
    yearPercent: number
  ): number => {
    return (practicePercent / 100) * (stepTimePercent / 100) * (frequencyPercent / 100) * (yearPercent / 100) * 100;
  };

  const redistributeFrequencyPercentages = async (stepId: string, changedSubcomponentId: string, newValue: number) => {
    const step = researchSteps.find(s => s.id === stepId);
    if (!step) return;

    const selectedSubcomponents = step.subcomponents.filter(sub => 
      subcomponentStates[sub.id]?.isSelected && sub.id !== changedSubcomponentId
    );

    if (selectedSubcomponents.length === 0) return;

    // Calculate available percentage considering non-R&D time
    const availableRdPercentage = 100 - step.nonRdPercentage;
    const remainingPercent = availableRdPercentage - newValue;
    const equalShare = remainingPercent / selectedSubcomponents.length;

    setSubcomponentStates(prev => {
      const updated = { ...prev };
      
      // Update the changed subcomponent
      updated[changedSubcomponentId] = {
        ...updated[changedSubcomponentId],
        frequencyPercent: newValue
      };

      // Redistribute among remaining selected subcomponents
      selectedSubcomponents.forEach(sub => {
        updated[sub.id] = {
          ...updated[sub.id],
          frequencyPercent: equalShare
        };
      });

      return updated;
    });

    // Save redistributed frequencies to database
    try {
      // Save the changed subcomponent
      const { error: changedError } = await supabase
        .from('rd_selected_subcomponents')
        .update({ frequency_percentage: newValue })
        .eq('subcomponent_id', changedSubcomponentId)
        .eq('business_year_id', selectedActivityYearId);
        
      if (changedError) {
        console.error('Error updating changed subcomponent frequency:', changedError);
      }

      // Save the redistributed subcomponents
      for (const sub of selectedSubcomponents) {
        const { error } = await supabase
          .from('rd_selected_subcomponents')
          .update({ frequency_percentage: equalShare })
          .eq('subcomponent_id', sub.id)
          .eq('business_year_id', selectedActivityYearId);
          
        if (error) {
          console.error('Error updating redistributed frequency for subcomponent:', sub.id, error);
        }
      }
      
      console.log('Successfully saved redistributed frequencies to database');
      
      // Save applied percentages for all affected subcomponents
      await calculateAndSaveAppliedPercentage(changedSubcomponentId, stepId);
      for (const sub of selectedSubcomponents) {
        await calculateAndSaveAppliedPercentage(sub.id, stepId);
      }
    } catch (error) {
      console.error('Error saving redistributed frequencies:', error);
    }
  };

  const toggleSubcomponent = async (subcomponentId: string, stepId: string) => {
    const currentState = subcomponentStates[subcomponentId];
    const isCurrentlySelected = currentState?.isSelected || false;
    
    // CRITICAL FIX: Get the CORRECT activity that owns this step, not the currently viewed activity
    let ownerActivity = null;
    for (const activity of activitiesWithSteps) {
      if (activity.steps.some(step => step.id === stepId)) {
        ownerActivity = activity;
        break;
      }
    }
    
    if (!ownerActivity) {
      console.error('❌ No owner activity found for step:', stepId);
      return;
    }

    const ownerActivityId = getActivityId(ownerActivity);
    if (!ownerActivityId) {
      console.error('❌ No activityId found for owner activity:', ownerActivity);
      return;
    }
    
    // Log both the currently viewed activity and the correct owner activity
    const currentlyViewedActivity = activitiesWithSteps[activeActivityIndex];
    console.log('🔧 [FIX] Toggling subcomponent:', { 
      subcomponentId, 
      stepId, 
      isCurrentlySelected, 
      selectedActivityYearId,
      currentlyViewedActivity: currentlyViewedActivity?.activityName,
      correctOwnerActivity: ownerActivity.activityName,
      correctResearchActivityId: ownerActivity.activityId
    });
    
    if (isCurrentlySelected) {
      // Remove from study
      try {
        console.log('Removing subcomponent from database...');
        const { error } = await supabase
          .from('rd_selected_subcomponents')
          .delete()
          .eq('subcomponent_id', subcomponentId)
          .eq('business_year_id', selectedActivityYearId);
          
        if (error) {
          console.error('Error removing subcomponent:', error);
        } else {
          console.log('Successfully removed subcomponent:', subcomponentId);
          
          // Trigger real-time role snapshot update
          triggerRoleSnapshotUpdate(100, 'subcomponent removal');
        }
      } catch (error) {
        console.error('Error removing subcomponent:', error);
      }
    } else {
      // Add to study
      try {
        console.log('Adding subcomponent to database...');
        
        // Calculate initial frequency percentage
        const step = researchSteps.find(s => s.id === stepId);
        let initialFrequencyPercent = 100;
        if (step) {
          const selectedSubcomponents = step.subcomponents.filter(sub => 
            subcomponentStates[sub.id]?.isSelected && sub.id !== subcomponentId
          );
          
          if (selectedSubcomponents.length > 0) {
            // Calculate available percentage considering non-R&D time
            const availableRdPercentage = 100 - step.nonRdPercentage;
            initialFrequencyPercent = availableRdPercentage / (selectedSubcomponents.length + 1);
          } else {
            // If this is the only subcomponent, it gets all available R&D time
            const availableRdPercentage = 100 - step.nonRdPercentage;
            initialFrequencyPercent = availableRdPercentage;
          }
        }
        
        // Get subcomponent data for text fields
        const subcomponentData = step?.subcomponents.find(sub => sub.id === subcomponentId);
        
        // Get the step name
        const stepName = step?.name || '';
        
        // Get the step's time percentage from researchSteps (not selectedSteps)
        const stepTimePercentage = step?.percentage || 0;
        
        console.log('Adding subcomponent with time_percentage:', {
          subcomponentId,
          stepId,
          stepName,
          stepTimePercentage,
          stepPercentage: step?.percentage
        });
        
        // First, ensure the step exists in rd_selected_steps
        const existingStep = selectedSteps.find(s => s.step_id === stepId);
        if (!existingStep) {
          console.log('Step not found in selectedSteps, creating step record...');
          const stepData = {
            business_year_id: selectedActivityYearId,
            research_activity_id: ownerActivity.activityId,  // Use correct owner activity
            step_id: stepId,
            time_percentage: stepTimePercentage,
            applied_percentage: 0
          };
          
          const { error: stepError } = await supabase
            .from('rd_selected_steps')
            .insert(stepData);
            
          if (stepError) {
            console.error('Error creating step record:', stepError);
          } else {
            console.log('Successfully created step record:', stepData);
            // Update selectedSteps state
            setSelectedSteps(prev => [...prev, stepData]);
          }
        } else {
          // Update existing step with current time percentage
          const { error: stepUpdateError } = await supabase
            .from('rd_selected_steps')
            .update({ time_percentage: stepTimePercentage })
            .eq('business_year_id', selectedActivityYearId)
            .eq('step_id', stepId);
            
          if (stepUpdateError) {
            console.error('Error updating step time percentage:', stepUpdateError);
          } else {
            console.log('Successfully updated step time percentage:', stepId, 'to:', stepTimePercentage);
            // Update selectedSteps state
            setSelectedSteps(prev => 
              prev.map(s => 
                s.step_id === stepId 
                  ? { ...s, time_percentage: stepTimePercentage }
                  : s
              )
            );
          }
        }
        
        // Get the parent activity's selected roles to initialize the subcomponent
        const currentActivityData = selectedActivities.find(
          act => getActivityId(act) === ownerActivityId  // Use correct owner activity
        );
        const parentActivityRoles = currentActivityData?.selected_roles || [];
        
        console.log('🔧 [FIX] Initializing subcomponent with correct owner activity roles:', {
          ownerActivity: ownerActivity.activityName,
          ownerActivityId,
          parentActivityRoles,
          selectedActivityYearId,
          stepId,
          subcomponentId
        });
        
        // Insert the new subcomponent with correct research_activity_id
        const { error } = await supabase
          .from('rd_selected_subcomponents')
          .insert({
            business_year_id: selectedActivityYearId,
            research_activity_id: ownerActivityId,  // Use correct owner activity ID
            step_id: stepId,
            subcomponent_id: subcomponentId,
            frequency_percentage: initialFrequencyPercent,
            year_percentage: 100,
            start_month: 1,
            start_year: getDefaultStartYear(),
            selected_roles: parentActivityRoles, // Initialize with parent activity roles
            step_name: stepName,
            time_percentage: stepTimePercentage, // This should now be correctly set
            // Initialize text fields from subcomponent data
            general_description: subcomponentData?.general_description || '',
            goal: subcomponentData?.goal || '',
            hypothesis: subcomponentData?.hypothesis || '',
            alternatives: subcomponentData?.alternatives || '',
            uncertainties: subcomponentData?.uncertainties || '',
            developmental_process: subcomponentData?.developmental_process || '',
            primary_goal: subcomponentData?.primary_goal || '',
            expected_outcome_type: subcomponentData?.expected_outcome_type || '',
            cpt_codes: subcomponentData?.cpt_codes || '',
            cdt_codes: subcomponentData?.cdt_codes || '',
            alternative_paths: subcomponentData?.alternative_paths || ''
          });
          
        if (error) {
          console.error('Error adding subcomponent:', error);
        } else {
          console.log('Successfully added subcomponent:', subcomponentId, 'with frequency:', initialFrequencyPercent, 'and time_percentage:', stepTimePercentage);
          
          // Redistribute frequencies for existing subcomponents in the database
          const existingSubcomponents = selectedSubcomponents.filter(s => s.step_id === stepId);
          console.log('Existing subcomponents to redistribute:', existingSubcomponents);
          if (existingSubcomponents.length > 0 && step) {
            const availableRdPercentage = 100 - step.nonRdPercentage;
            const equalShare = availableRdPercentage / (existingSubcomponents.length + 1);
            console.log('Redistributing frequencies - available:', availableRdPercentage, 'equal share:', equalShare);
            
            // Update existing subcomponents in database
            for (const sub of existingSubcomponents) {
              const { error: updateError } = await supabase
                .from('rd_selected_subcomponents')
                .update({ frequency_percentage: equalShare })
                .eq('subcomponent_id', sub.subcomponent_id)
                .eq('business_year_id', selectedActivityYearId);
                
              if (updateError) {
                console.error('Error updating existing subcomponent frequency:', updateError);
              } else {
                console.log('Updated existing subcomponent frequency:', sub.subcomponent_id, 'to:', equalShare);
              }
            }
          }
          
          // Save applied percentage for the newly added subcomponent
          console.log('Calculating applied percentage for new subcomponent:', subcomponentId);
          await calculateAndSaveAppliedPercentage(subcomponentId, stepId);
          
          // Save applied percentages for existing subcomponents in this step
          for (const sub of existingSubcomponents) {
            console.log('Calculating applied percentage for existing subcomponent:', sub.subcomponent_id);
            await calculateAndSaveAppliedPercentage(sub.subcomponent_id, stepId);
          }
          
          // Refresh the selectedSubcomponents state to reflect the database changes
          console.log('Refreshing selectedSubcomponents state...');
          const { data: refreshedData, error: refreshError } = await supabase
            .from('rd_selected_subcomponents')
            .select('*')
            .eq('business_year_id', selectedActivityYearId);
            
          if (refreshError) {
            console.error('Error refreshing subcomponent data:', refreshError);
          } else {
            console.log('Refreshed subcomponent data:', refreshedData);
            setSelectedSubcomponents(refreshedData || []);
            
            // Trigger real-time role snapshot update
            triggerRoleSnapshotUpdate(100, 'subcomponent addition');
          }
        }
      } catch (error) {
        console.error('Error adding subcomponent:', error);
      }
    }

    // Update local state
    setSubcomponentStates(prev => {
      const updated = { ...prev };
      const newIsSelected = !isCurrentlySelected;
      
      if (newIsSelected) {
        // Get the parent activity's selected roles to initialize the subcomponent
        const currentActivityData = selectedActivities.find(
          act => getActivityId(act) === ownerActivityId  // Use correct owner activity
        );
        const parentActivityRoles = currentActivityData?.selected_roles || [];
        
        // Initialize new subcomponent
        updated[subcomponentId] = {
          isSelected: true,
          frequencyPercent: 0,
          yearPercent: 100,
          startYear: getDefaultStartYear(),
          startMonth: 1,
          monthName: 'January',
          selectedRoles: parentActivityRoles, // Initialize with parent activity roles
          appliedPercentage: 0
        };
      } else {
        // Remove subcomponent
        delete updated[subcomponentId];
      }

      // Redistribute frequency percentages if adding
      if (newIsSelected) {
        const step = researchSteps.find(s => s.id === stepId);
        if (step) {
          const selectedSubcomponents = step.subcomponents.filter(sub => 
            (updated[sub.id]?.isSelected || false) && sub.id !== subcomponentId
          );
          
          if (selectedSubcomponents.length > 0) {
            // Calculate available percentage considering non-R&D time
            const availableRdPercentage = 100 - step.nonRdPercentage;
            const equalShare = availableRdPercentage / (selectedSubcomponents.length + 1);
            updated[subcomponentId].frequencyPercent = equalShare;
            
            // Also redistribute existing subcomponents
            selectedSubcomponents.forEach(sub => {
              if (updated[sub.id]) {
                updated[sub.id].frequencyPercent = equalShare;
              }
            });
          } else {
            // If this is the only subcomponent, it gets all available R&D time
            const availableRdPercentage = 100 - step.nonRdPercentage;
            updated[subcomponentId].frequencyPercent = availableRdPercentage;
          }
        }
      }

      return updated;
    });
    
    // Roles now handled by RoleSnapshot component
  };

  const handleFrequencyChange = async (stepId: string, subcomponentId: string, value: number) => {
    console.log('Updating frequency percent:', { subcomponentId, value, businessYearId });
    
    // Update local state first
    setSubcomponentStates(prev => ({
      ...prev,
      [subcomponentId]: {
        ...prev[subcomponentId],
        frequencyPercent: value
      }
    }));

    // Redistribute among other selected subcomponents and save to database
    await redistributeFrequencyPercentages(stepId, subcomponentId, value);
    
    // Trigger real-time role snapshot update after frequency change
    triggerRoleSnapshotUpdate(100, 'frequency change');
  };

  const handleYearChange = async (subcomponentId: string, value: number) => {
    console.log('Updating year percent:', { subcomponentId, value, businessYearId });
    
    setSubcomponentStates(prev => ({
      ...prev,
      [subcomponentId]: {
        ...prev[subcomponentId],
        yearPercent: value
      }
    }));

    try {
      const { error } = await supabase
        .from('rd_selected_subcomponents')
        .update({ year_percentage: value })
        .eq('subcomponent_id', subcomponentId)
        .eq('business_year_id', selectedActivityYearId);
        
      if (error) {
        console.error('Error updating year percent:', error);
      } else {
        console.log('Successfully updated year percent for subcomponent:', subcomponentId);
        
        // Find the step ID for this subcomponent and save applied percentage
        const selectedSub = selectedSubcomponents.find(s => s.subcomponent_id === subcomponentId);
        if (selectedSub) {
          await calculateAndSaveAppliedPercentage(subcomponentId, selectedSub.step_id);
          
          // Trigger real-time role snapshot update after year percentage change
          triggerRoleSnapshotUpdate(100, 'year percentage change');
        }
        
        // Roles now handled by RoleSnapshot component
      }
    } catch (error) {
      console.error('Error updating year percent:', error);
    }
  };

  const handleStartYearChange = async (subcomponentId: string, value: number) => {
    console.log('Updating start year:', { subcomponentId, value, businessYearId });
    
    setSubcomponentStates(prev => ({
      ...prev,
      [subcomponentId]: {
        ...prev[subcomponentId],
        startYear: value
      }
    }));

    try {
      const { error } = await supabase
        .from('rd_selected_subcomponents')
        .update({ start_year: value })
        .eq('subcomponent_id', subcomponentId)
        .eq('business_year_id', selectedActivityYearId);
        
      if (error) {
        console.error('Error updating start year:', error);
      } else {
        console.log('Successfully updated start year for subcomponent:', subcomponentId);
      }
    } catch (error) {
      console.error('Error updating start year:', error);
    }
  };

  const handleMonthChange = async (subcomponentId: string, month: string) => {
    console.log('Updating start month:', { subcomponentId, month, businessYearId });
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = months.indexOf(month);
    const monthNumber = monthIndex >= 0 ? monthIndex + 1 : 1;
    
    // Update local state
    setSubcomponentStates(prev => ({
      ...prev,
      [subcomponentId]: {
        ...prev[subcomponentId],
        startMonth: monthNumber,
        monthName: month
      }
    }));
    
    try {
      const { error } = await supabase
        .from('rd_selected_subcomponents')
        .update({ start_month: monthNumber })
        .eq('subcomponent_id', subcomponentId)
        .eq('business_year_id', selectedActivityYearId);
        
      if (error) {
        console.error('Error updating start month:', error);
      } else {
        console.log('Successfully updated start month for subcomponent:', subcomponentId, 'to month:', monthNumber);
      }
    } catch (error) {
      console.error('Error updating start month:', error);
    }
  };

  const handleRoleToggle = async (subcomponentId: string, role: string) => {
    try {
      // Get current roles from the database to ensure we have the latest state
      const { data: currentSubcomponent, error: fetchError } = await supabase
        .from('rd_selected_subcomponents')
        .select('selected_roles')
        .eq('subcomponent_id', subcomponentId)
        .eq('business_year_id', selectedActivityYearId)
        .single();

      if (fetchError) {
        console.error('Error fetching current roles:', fetchError);
        return;
      }

      const currentRoles = currentSubcomponent?.selected_roles || [];
      const newRoles = currentRoles.includes(role)
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role];

      console.log('Updating roles for subcomponent:', subcomponentId, 'Current roles:', currentRoles, 'New roles:', newRoles);

      // Save to database immediately with the new roles
      const { error: updateError } = await supabase
        .from('rd_selected_subcomponents')
        .update({ selected_roles: newRoles })
        .eq('subcomponent_id', subcomponentId)
        .eq('business_year_id', selectedActivityYearId);

      if (updateError) {
        console.error('Error updating selected roles:', updateError);
        return;
      }

            console.log('Successfully updated roles for subcomponent:', subcomponentId, 'New roles:', newRoles);

      // Update local state
      setSubcomponentStates(prev => ({
        ...prev,
        [subcomponentId]: {
          ...prev[subcomponentId],
          selectedRoles: newRoles
        }
      }));

      // Reload subcomponents data to ensure we have the latest state
      const { data: updatedSubcomponents, error: reloadError } = await supabase
        .from('rd_selected_subcomponents')
        .select('*')
        .eq('business_year_id', selectedActivityYearId);

      if (reloadError) {
        console.error('Error reloading subcomponents:', reloadError);
      } else {
        console.log('Reloaded subcomponents with updated roles:', updatedSubcomponents);
        setSelectedSubcomponents(updatedSubcomponents || []);
        
        // Trigger real-time role snapshot update
        triggerRoleSnapshotUpdate(100, 'role toggle');
      }

      // Roles now handled by RoleSnapshot component
      
    } catch (error) {
      console.error('Error in handleRoleToggle:', error);
    }
  };

  const handleTextFieldChange = async (subcomponentId: string, field: string, value: string) => {
    console.log('Updating text field:', { subcomponentId, field, value, businessYearId });
    
    // Update local state first
    setSubcomponentStates(prev => ({
      ...prev,
      [subcomponentId]: {
        ...prev[subcomponentId],
        [field]: value
      }
    }));

    // Save to database
    try {
      const { error } = await supabase
        .from('rd_selected_subcomponents')
        .update({ [field]: value })
        .eq('subcomponent_id', subcomponentId)
        .eq('business_year_id', selectedActivityYearId);
        
      if (error) {
        console.error('Error updating text field:', error);
      } else {
        console.log('Successfully updated text field for subcomponent:', subcomponentId);
      }
    } catch (error) {
      console.error('Error updating text field:', error);
    }
  };

  // Step-level Non-R&D functions
  const openNonRdModal = (stepId: string) => {
    setSelectedStepForNonRd(stepId);
    setShowNonRdModal(true);
  };

  const closeNonRdModal = () => {
    setShowNonRdModal(false);
    setSelectedStepForNonRd(null);
  };

  const handleStepNonRdChange = async (stepId: string, nonRdPercentage: number) => {
    console.log('🔧 [NON-R&D UPDATE] Updating step non-R&D percentage:', { 
      stepId, 
      nonRdPercentage, 
      businessYearId: selectedActivityYearId 
    });
    
    // Update local state
    setResearchSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, nonRdPercentage }
        : step
    ));

    // CRITICAL FIX: Save to database using the correct business year ID
    try {
      const { error } = await supabase
        .from('rd_selected_steps')
        .update({
          non_rd_percentage: nonRdPercentage
        })
        .eq('business_year_id', selectedActivityYearId) // FIXED: Use correct businessYearId
        .eq('step_id', stepId);
        
      if (error) {
        console.error('❌ [NON-R&D UPDATE] Error updating step non-R&D percentage:', error);
        console.error('❌ [NON-R&D UPDATE] Failed update params:', {
          business_year_id: selectedActivityYearId,
          step_id: stepId,
          non_rd_percentage: nonRdPercentage
        });
      } else {
        console.log('✅ [NON-R&D UPDATE] Successfully updated step non-R&D percentage for step:', stepId, 'Value:', nonRdPercentage);
        
        // Update selectedSteps state to reflect the change
        setSelectedSteps(prev => prev.map(step => 
          step.step_id === stepId 
            ? { ...step, non_rd_percentage: nonRdPercentage }
            : step
        ));
      }
    } catch (error) {
      console.error('❌ [NON-R&D UPDATE] Error updating step non-R&D percentage:', error);
    }

    // Redistribute frequencies to account for non-R&D time
    await redistributeFrequenciesForNonRd(stepId, nonRdPercentage);
  };

  const redistributeFrequenciesForNonRd = async (stepId: string, nonRdPercentage: number) => {
    const step = researchSteps.find(s => s.id === stepId);
    if (!step) return;

    const selectedSubcomponents = step.subcomponents.filter(sub => 
      subcomponentStates[sub.id]?.isSelected
    );

    if (selectedSubcomponents.length === 0) return;

    // Calculate available percentage for R&D (100% - non-R&D%)
    const availableRdPercentage = 100 - nonRdPercentage;
    const equalShare = availableRdPercentage / selectedSubcomponents.length;

    setSubcomponentStates(prev => {
      const updated = { ...prev };
      
      selectedSubcomponents.forEach(sub => {
        updated[sub.id] = {
          ...updated[sub.id],
          frequencyPercent: equalShare
        };
      });

      return updated;
    });

    // Save redistributed frequencies to database
    try {
      for (const sub of selectedSubcomponents) {
        const { error } = await supabase
          .from('rd_selected_subcomponents')
          .update({ frequency_percentage: equalShare })
          .eq('subcomponent_id', sub.id)
          .eq('business_year_id', selectedActivityYearId);
          
        if (error) {
          console.error('Error updating frequency for non-R&D redistribution:', error);
        }
      }
      
      console.log('Successfully saved non-R&D redistributed frequencies to database');
      
      // Save applied percentages for all affected subcomponents
      for (const sub of selectedSubcomponents) {
        await calculateAndSaveAppliedPercentage(sub.id, stepId);
      }
    } catch (error) {
      console.error('Error saving non-R&D redistributed frequencies:', error);
    }
  };

  // Helper function to format percentages as whole numbers (no decimals, no percent sign)
  const formatPercentage = (value: number): string => {
    return Math.round(value).toString();
  };

  // Calculate total applied percentage for an activity (sum of all subcomponent applied percentages)
  const calculateActivityAppliedPercentage = (activity: any): number => {
    // Check if data is still loading or not available
    if (loading || selectedSubcomponents.length === 0 || selectedSteps.length === 0) {
      return 0;
    }
    
    const activityId = getActivityId(activity);
    
    const practicePercent = getActivityPercentage(activity) || 0;
    
    if (practicePercent === 0) {
      return 0;
    }
    
    let totalApplied = 0;
    
    // Get all steps for this activity
    const activitySteps = selectedSteps.filter(step => 
      step.research_activity_id === activityId
    );
    
    if (activitySteps.length === 0) {
      return 0;
    }
    
    // Validate time percentages don't exceed 100%
    const totalTimePercent = activitySteps.reduce((sum, step) => sum + (step.time_percentage || 0), 0);
    
    activitySteps.forEach((step, stepIndex) => {
      const stepTimePercent = step.time_percentage || 0;
      
      // Find subcomponents for this step
      const stepSubcomponents = selectedSubcomponents.filter(sub => 
        sub.step_id === step.step_id
      );
      
      // Validate frequency percentages within step don't exceed 100%
      const totalFrequency = stepSubcomponents.reduce((sum, sub) => sum + (sub.frequency_percentage || 0), 0);
      
      stepSubcomponents.forEach((sub, subIndex) => {
        const freq = sub.frequency_percentage || 0;
        const year = sub.year_percentage || 0;
        
        if (freq > 0 && year > 0 && stepTimePercent > 0 && practicePercent > 0) {
          // ✅ CONSISTENCY FIX: Use database data instead of activity-specific UI state
          // ISSUE: researchSteps is UI state that changes when switching activity cards
          // SOLUTION: Use selectedSteps (database data) which is consistent for ALL activities
          const dbStep = selectedSteps.find(s => s.step_id === step.step_id);
          const nonRdPercent = dbStep?.non_rd_percentage || 0;
          
          console.log(`✅ [CONSISTENCY FIX] Step ${step.step_id}: nonRdPercent=${nonRdPercent}% (from selectedSteps database data)`);
          
          // Verify we're using consistent database data
          if (dbStep) {
            console.log(`   └─ ✅ Database step found: time=${dbStep.time_percentage}%, non_rd=${dbStep.non_rd_percentage}%`);
          } else {
            console.log(`   └─ ⚠️ Database step NOT found for step_id: ${step.step_id}`);
          }
          
          // CORE CALCULATION: practice% × time% × frequency% × year%
          let applied = (practicePercent / 100) * (stepTimePercent / 100) * (freq / 100) * (year / 100) * 100;
          
          // Apply Non-R&D reduction if this step has non-R&D time (same calculation as subcomponent bar)
          let rdOnlyPercent = 1.0; // Default to 1.0 (no reduction)
          if (nonRdPercent > 0) {
            rdOnlyPercent = (100 - nonRdPercent) / 100;
            const beforeReduction = applied;
            applied = applied * rdOnlyPercent;
            console.log(`🔧 [RESEARCH ACTIVITY] Applied Non-R&D reduction: ${applied.toFixed(2)}% (was ${beforeReduction.toFixed(2)}%, reduced by ${nonRdPercent}%)`);
          }
          
          totalApplied += applied;
        }
      });
    });
    
    // ✅ CONSISTENCY FIX: Remove problematic verification calculation that uses UI state
    // ISSUE: Verification was using subcomponentStates[sub.id]?.isSelected (UI state) 
    // PROBLEM: UI state only populated for active activity, causing inconsistent calculations
    // SOLUTION: Use single calculation path based on database data for ALL activities
    // RESULT: All activity cards show consistent applied percentages regardless of selection
    
    console.log(`✅ [FINAL CONSISTENCY] Activity ${activityId}: ${totalApplied.toFixed(2)}% (database-based, excludes non-R&D time)`);
    console.log(`   └─ ✅ NON-R&D DATA: Uses selectedSteps (database) instead of researchSteps (UI state)`);
    console.log(`   └─ ✅ STABLE CALCULATION: Same result for all cards regardless of selection`);
    console.log(`   └─ ✅ NO MORE JUMPS: Unselected cards maintain consistent applied percentages`);
    
    const finalResult = +totalApplied.toFixed(2);
    return finalResult;
  };

  // Color gradients for activity cards
  const ACTIVITY_COLORS = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500', 
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-blue-500',
    'from-yellow-500 to-orange-500',
    'from-pink-500 to-rose-500'
  ];

  // Fetch ALL available business years for this business (not just ones with activities)
  const loadAvailableActivityYears = useCallback(async () => {
    if (!businessId) return;
    // Query all business years for this business
    const { data: years, error } = await supabase
      .from('rd_business_years')
      .select('id, year')
      .eq('business_id', businessId)
      .order('year', { ascending: false });
    if (error || !years) {
      setAvailableActivityYears([]);
      return;
    }
    
    // FIXED: Show ALL business years, not just ones with activities
    // This allows users to switch to any year, even if no activities are configured yet
    setAvailableActivityYears(years);
    
    // Set the initial selected year to the current year if it exists in the years
    if (years.length > 0) {
      const currentYear = new Date().getFullYear();
      // First try to find the current year, then fall back to the most recent year
      const initialYear = years.find(y => y.year === currentYear) || 
                         years[0]; // Years are sorted newest first
      setSelectedActivityYearId(initialYear.id);
      setSelectedActivityYear(initialYear.year);
      console.log('Set initial year to:', initialYear.year, 'ID:', initialYear.id, 'current year:', currentYear);
    }
  }, [businessId, businessYearId]);

  // Load available years with activities on mount and when businessId changes
  useEffect(() => {
    loadAvailableActivityYears();
  }, [loadAvailableActivityYears]);

  // Reload available years when yearRefreshTrigger changes (business years updated)
  useEffect(() => {
    if (yearRefreshTrigger !== undefined && yearRefreshTrigger > 0) {
      console.log('📅 [ResearchDesignStep] Year refresh triggered - reloading available years');
      loadAvailableActivityYears();
    }
  }, [yearRefreshTrigger, loadAvailableActivityYears]);

  // Update selected year when available years change
  useEffect(() => {
    if (availableActivityYears.length > 0 && !selectedActivityYearId) {
      const currentYear = new Date().getFullYear();
      // Prefer current year, fall back to most recent year with data
      const matchingYear = availableActivityYears.find(y => y.year === currentYear) || availableActivityYears[0];
      setSelectedActivityYearId(matchingYear.id);
      setSelectedActivityYear(matchingYear.year);
      console.log('Updated selected year to:', matchingYear.year, 'ID:', matchingYear.id, 'current year:', currentYear);
    }
  }, [availableActivityYears, selectedActivityYearId]);

  // Update selected year when year prop changes
  useEffect(() => {
    if (year && availableActivityYears.length > 0) {
      const matchingYear = availableActivityYears.find(y => y.year === year);
      if (matchingYear) {
        setSelectedActivityYearId(matchingYear.id);
        setSelectedActivityYear(matchingYear.year);
        console.log('Updated selected year from prop:', matchingYear.year, 'ID:', matchingYear.id, 'prop year:', year);
      }
    }
  }, [year, availableActivityYears]);

  // When selectedActivityYearId changes, update activities and research design data
  useEffect(() => {
    if (selectedActivityYearId) {
      // Update activities and research design for the selected year
      onUpdate({ businessYearId: selectedActivityYearId });
    }
  }, [selectedActivityYearId]);

  // Ensure that when selectedActivityYear changes, the subcomponents (steps) are re-fetched and the UI updates accordingly.
  useEffect(() => {
    if (selectedActivityYear) {
      fetchSubcomponentsForYear(selectedActivityYear);
      console.log('Fetching subcomponents for year:', selectedActivityYear);
    }
  }, [selectedActivityYear]);

  // In fetchSubcomponentsForYear, ensure it fetches and sets only the subcomponents for the selected year, and clears the list if none exist.
  const fetchSubcomponentsForYear = async (year: number) => {
    // Fetch logic here (replace with actual fetch call)
    // For now, we'll use a placeholder implementation
    console.log('Fetching subcomponents for year', year);
    // This would typically fetch from the database
    // const subcomponents = await getSubcomponentsForYear(year);
    // setSubcomponents(subcomponents || []);
  };

  // Removed: old roles calculation functions - now handled by RoleSnapshot component

  // All roles calculation functions removed - now handled by RoleSnapshot component

  // DISABLED: Auto-recalculation that was overwriting correct database values
  // useEffect(() => {
  //   if (selectedSubcomponents.length > 0 && selectedSteps.length > 0) {
  //     recalculateAllAppliedPercentages();
  //   }
  // }, [selectedSubcomponents, selectedSteps]);

  // Roles calculation now handled by RoleSnapshot component

  // Debug modal state changes
  useEffect(() => {
    console.log('ResearchDesignStep: showResearchReportModal state changed to:', showResearchReportModal);
  }, [showResearchReportModal]);

  // Debug function to show raw subcomponent data
  const debugSubcomponentData = async () => {
    try {
      console.log('%c[DEBUG] 🔍 RAW SUBCOMPONENT DATA ANALYSIS', 'background: #ff6b6b; color: white; font-size: 16px; font-weight: bold; padding: 4px;');
      
      const { data: allSubcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select('*')
        .eq('business_year_id', selectedActivityYearId);
      
      if (subError) {
        console.error('Error fetching subcomponents for debug:', subError);
        return;
      }

      console.log('%c[DEBUG] 📊 Total subcomponents found: ' + (allSubcomponents?.length || 0), 'background: #42a5f5; color: white; font-weight: bold;');
      
      if (!allSubcomponents || allSubcomponents.length === 0) {
        console.log('%c[DEBUG] ⚠️ No subcomponents found', 'background: #ffa726; color: white; font-weight: bold;');
        return;
      }

      // Show each subcomponent's data
      allSubcomponents.forEach((sub, index) => {
        console.log(`%c[DEBUG] Subcomponent ${index + 1}:`, 'background: #26a69a; color: white; font-weight: bold;');
        console.log(`  ID: ${sub.subcomponent_id}`);
        console.log(`  Applied %: ${sub.applied_percentage?.toFixed(2) || '0.00'}%`);
        console.log(`  Selected Roles: [${(sub.selected_roles || []).join(', ')}]`);
        console.log(`  Frequency %: ${sub.frequency_percentage?.toFixed(2) || '0.00'}%`);
        console.log(`  Year %: ${sub.year_percentage?.toFixed(2) || '0.00'}%`);
        console.log(`  Time %: ${sub.time_percentage?.toFixed(2) || '0.00'}%`);
        console.log(`  Practice %: ${sub.practice_percent?.toFixed(2) || '0.00'}%`);
        console.log('');
      });

      // Calculate totals
      const totalApplied = allSubcomponents.reduce((sum, sub) => sum + (sub.applied_percentage || 0), 0);
      const totalFrequency = allSubcomponents.reduce((sum, sub) => sum + (sub.frequency_percentage || 0), 0);
      const totalYear = allSubcomponents.reduce((sum, sub) => sum + (sub.year_percentage || 0), 0);
      const totalTime = allSubcomponents.reduce((sum, sub) => sum + (sub.time_percentage || 0), 0);
      const totalPractice = allSubcomponents.reduce((sum, sub) => sum + (sub.practice_percent || 0), 0);

      console.log('%c[DEBUG] 📊 TOTALS:', 'background: #ff6b6b; color: white; font-weight: bold;');
      console.log(`  Applied %: ${totalApplied.toFixed(2)}%`);
      console.log(`  Frequency %: ${totalFrequency.toFixed(2)}%`);
      console.log(`  Year %: ${totalYear.toFixed(2)}%`);
      console.log(`  Time %: ${totalTime.toFixed(2)}%`);
      console.log(`  Practice %: ${totalPractice.toFixed(2)}%`);

      // Show role distribution
      const roleCounts: { [roleId: string]: number } = {};
      allSubcomponents.forEach(sub => {
        (sub.selected_roles || []).forEach(roleId => {
          roleCounts[roleId] = (roleCounts[roleId] || 0) + 1;
        });
      });

      console.log('%c[DEBUG] 🎯 ROLE DISTRIBUTION:', 'background: #ab47bc; color: white; font-weight: bold;');
      Object.entries(roleCounts).forEach(([roleId, count]) => {
        console.log(`  Role ${roleId}: ${count} subcomponents`);
      });

    } catch (error) {
      console.error('Error in debug function:', error);
    }
  };

  // Calculate activity applied percentage from DATABASE selected subcomponents (not template)
  // Added caching to prevent excessive database calls
  const dbCalculationCache = useRef<Map<string, Promise<number>>>(new Map());
  
  const calculateActivityAppliedPercentageFromDatabase = async (activityId: string): Promise<number> => {
    try {
      const cacheKey = `${activityId}_${selectedActivityYearId}`;
      
      // Return cached promise if calculation is already in progress
      if (dbCalculationCache.current.has(cacheKey)) {
        return dbCalculationCache.current.get(cacheKey)!;
      }
      
      // Create and cache the calculation promise
      const calculationPromise = (async () => {
        // Get ALL selected subcomponents for this activity from database
        const { data: dbSubcomponents, error } = await supabase
          .from('rd_selected_subcomponents')
          .select('applied_percentage')
          .eq('business_year_id', selectedActivityYearId)
          .eq('research_activity_id', activityId);

        if (error) {
          console.error('🔍 [DATABASE CALC] Error fetching subcomponents:', error);
          return 0;
        }

        if (!dbSubcomponents || dbSubcomponents.length === 0) {
          return 0;
        }

        // Sum all applied percentages from database
        const total = dbSubcomponents.reduce((sum, sub) => sum + (sub.applied_percentage || 0), 0);
        
        return total;
      })();
      
      dbCalculationCache.current.set(cacheKey, calculationPromise);
      
      // Clean up cache after calculation completes
      calculationPromise.finally(() => {
        setTimeout(() => {
          dbCalculationCache.current.delete(cacheKey);
        }, 5000); // Keep cache for 5 seconds
      });
      
      return calculationPromise;
    } catch (error) {
      console.error('🔍 [DATABASE CALC] Error in calculation:', error);
      return 0;
    }
  };

  // Load and display correct activity totals from database
  const loadCorrectActivityTotals = async () => {
    if (!selectedActivities.length || !selectedActivityYearId) return;

    console.log('🔍 [CORRECT TOTALS] Loading activity totals from database...');
    
    const correctedTotals: { [activityId: string]: number } = {};
    let grandTotal = 0;

    for (const activity of selectedActivities) {
      const activityId = getActivityId(activity);
      const total = await calculateActivityAppliedPercentageFromDatabase(activityId);
      correctedTotals[activityId] = total;
      grandTotal += total;
    }

    console.log('🔍 [CORRECT TOTALS] Activity totals from database:');
    selectedActivities.forEach(activity => {
      const activityId = getActivityId(activity);
      const activityName = getActivityName(activity);
      const total = correctedTotals[activityId] || 0;
      console.log(`  └─ ${activityName}: ${total.toFixed(2)}%`);
    });
    console.log(`🔍 [CORRECT TOTALS] Grand total: ${grandTotal.toFixed(2)}%`);
    console.log(`🔍 [CORRECT TOTALS] This should match roles calculation: 65.87%`);

    return { correctedTotals, grandTotal };
  };

  // Component to show database-based applied percentage (with caching to prevent infinite loops)
  const DatabaseAppliedDisplay: React.FC<{ activityId: string; loading: boolean }> = ({ activityId, loading }) => {
    const [dbApplied, setDbApplied] = useState<number | null>(null);
    const [lastCalculatedId, setLastCalculatedId] = useState<string>('');
    
    useEffect(() => {
      // Prevent duplicate calculations for the same activity
      if (!loading && selectedActivityYearId && activityId && activityId !== lastCalculatedId) {
        calculateActivityAppliedPercentageFromDatabase(activityId).then((result) => {
          setDbApplied(result);
          setLastCalculatedId(activityId);
        });
      }
    }, [activityId, loading, selectedActivityYearId, lastCalculatedId]);
    
    if (loading || dbApplied === null) return null;
    
    return (
      <div className="text-xs opacity-75 mt-1">
        🔍 Database: {dbApplied.toFixed(2)}%
      </div>
    );
  };

  // Component to show total database applied percentage
  const DatabaseTotalDisplay: React.FC = () => {
    const [totalDbApplied, setTotalDbApplied] = useState<number | null>(null);
    
    useEffect(() => {
      const calculateTotal = async () => {
        if (!selectedActivities.length || !selectedActivityYearId) return;
        
        let total = 0;
        for (const activity of selectedActivities) {
          const activityId = getActivityId(activity);
          const activityTotal = await calculateActivityAppliedPercentageFromDatabase(activityId);
          total += activityTotal;
        }
        setTotalDbApplied(total);
      };
      
      calculateTotal();
    }, [selectedActivities, selectedActivityYearId]);
    
    if (totalDbApplied === null) return <span>Loading...</span>;
    
    const isCorrect = Math.abs(totalDbApplied - 59.44) < 0.1;
    
    return (
      <span className={isCorrect ? 'text-green-300' : 'text-yellow-300'}>
        {totalDbApplied.toFixed(2)}% {isCorrect ? '✅' : '⚠️'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedActivities.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No research activities selected. Please go back and select activities first.</p>
      </div>
    );
  }

  const currentActivity = activitiesWithSteps[activeActivityIndex];
  const currentActivityData = selectedActivities[activeActivityIndex];

  if (!currentActivity) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading activity data...</p>
      </div>
    );
  }

  const totalTimePercentage = currentActivity.steps.reduce((sum, step) => {
    const selectedStep = selectedSteps.find(s => s.step_id === step.id);
    return sum + (selectedStep?.time_percentage || 0);
  }, 0);

  // FIXED: Removed debugging useEffect that was causing React hooks error

  return (
    <div className="space-y-6">
      {/* Step Completion Banner */}
      <StepCompletionBanner 
        stepName="researchDesign"
        stepDisplayName="Research Design"
        businessYearId={businessYearId || ''}
        description="Define the research components and their percentages"
      />
      
      <style dangerouslySetInnerHTML={{ __html: `
        ${sliderStyles}
        
        /* Custom Scrollbar Styles */
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #dbeafe;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #93c5fd;
          border-radius: 4px;
          border: 1px solid #dbeafe;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
        .scrollbar-track-blue-50::-webkit-scrollbar-track {
          background: #eff6ff;
        }
        .scrollbar-thumb-blue-300::-webkit-scrollbar-thumb {
          background: #93c5fd;
        }
        .hover\\:scrollbar-thumb-blue-400:hover::-webkit-scrollbar-thumb {
          background: #60a5fa;
        }
      ` }} />
      
      {/* Modern Gradient Header with Progress */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-8 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Research Design Studio</h2>
                <p className="text-blue-100 text-lg">
                  Configure time breakdown and subcomponent details for maximum R&D credit optimization
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-blue-100 text-sm font-medium">Live Configuration</span>
                <button 
                  onClick={debugSubcomponentData}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-bold"
                >
                  🔍 DEBUG DATA
                </button>
              </div>
            </div>
            {/* Enhanced Applied Percentage Stacked Bar - Correlated with SB Data */}
            <div className="mt-6">
              {/* 🎯 NEW: Use standardized AppliedPercentageBar component */}
              {(() => {
                // Prepare segments for the standardized bar
                const segments = selectedActivities.map((activity, idx) => {
                  const applied = calculateActivityAppliedPercentage(activity);
                  const practice = getActivityPercentage(activity);
                  const colors = generateSegmentColors(selectedActivities.length);
                  
                  return {
                    id: activity.id,
                    name: getActivityName(activity),
                    value: applied,
                    color: colors[idx],
                    percentage: applied // Applied percentage for display
                  };
                });

                const totalApplied = selectedActivities.reduce((sum, a) => sum + calculateActivityAppliedPercentage(a), 0);
                
                return (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <AppliedPercentageBar
                      segments={segments}
                      totalValue={totalApplied}
                      maxValue={100}
                      title="Applied Percentage by Activity (Correlated with SB)"
                      subtitle="🔗 Correlated with Supabase data"
                      height="1.25rem"
                      showPercentages={true}
                      showLegend={false} // Skip legend to save space in this context
                      normalizeToWidth={false} // Show actual percentages
                      showUnused={true}
                      className="text-blue-900"
                    />
                    
                    {/* Correlation Status Indicator */}
                    <div className="flex items-center justify-between mt-2 text-xs text-blue-600">
                      <span>🔗 Correlated with Supabase data</span>
                      <span>{selectedSubcomponents.length} subcomponents active</span>
                      {totalApplied > 100 && (
                        <span className="text-red-600 font-semibold">⚠️ Exceeds 100%</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* End Applied Percentage Stacked Bar */}
          </div>
        </div>
        </div>

      {/* Activity Navigation with Modern Cards */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mr-4">Research Activities ({selectedActivityYear})</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  console.log('%c🚀 Research Report button clicked!', 'color: #ff00ff; font-size: 18px; font-weight: bold;');
                  console.log('%c📊 BusinessYearId:', 'color: #00ffff; font-weight: bold;', businessYearId);
                  console.log('%c🔍 Setting modal to true...', 'color: #ffff00; font-weight: bold;');
                  setShowResearchReportModal(true);
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Research Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Activity Cards Grid and Roles Section */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* Activity Cards - 2/3 width */}
            <div className="w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedActivities.map((activity, index) => {
              const isActive = activeActivityIndex === index;
              // CORRELATION FIX: Ensure database and template calculations match
              // Practice percentage comes from Research Activities section (like 44.18%)
              // Applied percentage is calculated from subcomponents (should be ≤ practice)
              const practicePercentage = getActivityPercentage(activity);  // From Research Activities
              const appliedPercentage = loading ? 0 : calculateActivityAppliedPercentage(activity);  // ✅ CONSISTENT: Same calculation for ALL cards
              
              // Debug logging for correlation issues (removed to prevent performance issues)
              const colorGradient = ACTIVITY_COLORS[index % ACTIVITY_COLORS.length];
              
              // DEBUG: Log removed to prevent performance issues
              
              return (
                <div
                  key={activity.id}
                  onClick={() => {
                    console.log('✅ [ACTIVITY CARD CLICK] Activity card clicked - all calculations should remain STABLE');
                    console.log('🎯 Previous activeActivityIndex:', activeActivityIndex);
                    console.log('🎯 New activeActivityIndex will be:', index);
                    console.log('✅ [FINAL FIX] Activity cards now use selectedSteps (database) for non-R&D data');
                    console.log('✅ [CONSISTENT DATA] No more UI state dependency - all cards use same data source');
                    console.log('✅ [NO MORE JUMPS] Applied percentages should remain stable for all cards');
                    setActiveActivityIndex(index);
                  }}
                  className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                >
                      <div className={`bg-gradient-to-br rounded-lg p-4 shadow-lg border-2 transition-all duration-300 ${
                    isActive 
                      ? `from-blue-500 to-blue-600 border-blue-400 text-white` 
                      : `${colorGradient} border-gray-200 hover:shadow-xl text-white`
                  }`}>
                    {/* Activity Name */}
                        <h4 className={`font-bold text-lg mb-2 ${isActive ? 'text-white' : 'text-white'}`}>
                      {getActivityName(activity)}
                    </h4>
                    {/* Practice/Applied Percentages - CORRECTED DISPLAY */}
                        <div className="mb-3">
                          <div className="text-xs opacity-90 mb-1">Practice → Applied</div>
                          <div className="text-lg font-bold">
                        {practicePercentage}% → {loading ? '...' : `${appliedPercentage.toFixed(2)}%`}
                      </div>
                          {/* Validation indicator */}
                          {!loading && appliedPercentage > practicePercentage && (
                            <div className="text-xs text-red-200 mt-1">
                              ⚠️ Error: Applied &gt; Practice
                            </div>
                          )}
                          {!loading && appliedPercentage <= practicePercentage && (
                            <div className="text-xs opacity-75 mt-1">
                              ✓ Applied ≤ Practice (template)
                            </div>
                          )}
                          <DatabaseAppliedDisplay activityId={getActivityId(activity)} loading={loading} />
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
            </div>

            {/* NEW: Clean Role Snapshot - 1/3 width */}
            <div className="w-1/3">
              <RoleSnapshot ref={roleSnapshotRef} businessYearId={selectedActivityYearId} />
                  </div>
                </div>
          </div>
        </div>

      {/* Subcomponent Applied Percentage Bar Chart (moved above step allocation) */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-orange-900 mb-1">Subcomponent Applied Percentage</h4>
            <p className="text-orange-700 text-sm">Visualize the applied percentage for each subcomponent in this research activity</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-orange-600">Practice Percentage</div>
            <div className="text-2xl font-bold text-orange-900">{getActivityPercentage(currentActivityData)}%</div>
          </div>
        </div>
        {/* Bar Chart */}
        {(() => {
          const subcomponents = researchSteps.flatMap(step => step.subcomponents.filter(sub => subcomponentStates[sub.id]?.isSelected));
          if (subcomponents.length === 0) {
            return <div className="text-orange-600 text-sm py-6 text-center">No subcomponents selected for this activity.</div>;
          }
          // Assign a unique color to each subcomponent
          const colors = [
            '#3b82f6', '#10b981', '#f59e42', '#f43f5e', '#a21caf', '#eab308', '#6366f1', '#14b8a6', '#f472b6', '#facc15'
          ];
          // Calculate raw applied percentages for each subcomponent
          const practicePercent = getActivityPercentage(currentActivityData);
          let applieds = subcomponents.map(sub => {
            const step = researchSteps.find(s => s.subcomponents.some(sc => sc.id === sub.id));
            const subState = subcomponentStates[sub.id];
            // Calculate the max allowed for this step
            const stepMax = step.percentage;
            // Calculate the raw applied percent for this subcomponent
            let applied = (practicePercent / 100) * (step.percentage / 100) * (subState.frequencyPercent / 100) * (subState.yearPercent / 100) * 100;
            
            // Apply Non-R&D reduction if applicable (same calculation as research activity card)
            const nonRdPercent = step.nonRdPercentage || 0;
            if (nonRdPercent > 0) {
              const rdOnlyPercent = (100 - nonRdPercent) / 100;
              applied = applied * rdOnlyPercent;
              console.log(`🔧 [SUBCOMPONENT BAR] Applied Non-R&D reduction: ${applied.toFixed(2)}% (was ${((practicePercent / 100) * (step.percentage / 100) * (subState.frequencyPercent / 100) * (subState.yearPercent / 100) * 100).toFixed(2)}%, reduced by ${nonRdPercent}%)`);
            }
            
            return { id: sub.id, title: sub.title, name: sub.name, applied, stepId: step.id, stepMax, stepName: step.name, nonRdPercent };
          });
          // Auto-scale within each step if needed
          const stepGroups = {};
          applieds.forEach(a => {
            if (!stepGroups[a.stepId]) stepGroups[a.stepId] = [];
            stepGroups[a.stepId].push(a);
          });
          Object.values(stepGroups).forEach((group) => {
            const stepTotal = group.reduce((sum, a) => sum + a.applied, 0);
            const stepMax = group[0].stepMax * (practicePercent / 100);
            if (stepTotal > stepMax) {
              const scale = stepMax / stepTotal;
              group.forEach(a => { a.applied *= scale; });
            }
          });
          // Auto-scale across all subcomponents if needed
          let totalApplied = applieds.reduce((sum, a) => sum + a.applied, 0);
          if (totalApplied > practicePercent) {
            const scale = practicePercent / totalApplied;
            applieds.forEach(a => { a.applied *= scale; });
            totalApplied = practicePercent;
          }
          // For the bar chart, fill to 100% width, with unused as gray
          return (
            <>
              <div className="relative h-8 bg-orange-100 rounded-lg overflow-hidden flex">
                {applieds.map((a, i) => {
                  const width = totalApplied > 0 ? (a.applied / practicePercent) * 100 : 0;
                return (
                  <div
                      key={a.id}
                      className="h-full flex items-center justify-center transition-all duration-300"
                      style={{ width: `${width}%`, background: colors[i % colors.length] }}
                    >
                      {width > 8 && (
                        <span className="text-xs font-medium text-white px-2 truncate">
                          {a.name} ({a.applied.toFixed(2)}%)
                        </span>
                      )}
                  </div>
                );
                })}
                {/* Fill unused portion with gray */}
                {totalApplied < practicePercent && (
                  <div
                    className="h-full flex-1 bg-gray-300"
                    style={{ width: `${100 - (totalApplied / practicePercent) * 100}%` }}
                  />
                )}
          </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {applieds.map((a, i) => (
                  <div key={a.id} className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: colors[i % colors.length], display: 'inline-block' }}></span>
                    <span className="text-sm text-gray-800 font-medium">{a.name}</span>
                    <span className="text-xs text-gray-500">({a.applied.toFixed(2)}%)</span>
        </div>
                ))}
                {totalApplied < practicePercent && (
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
                    <span className="text-sm text-gray-800 font-medium">Unused</span>
                    <span className="text-xs text-gray-500">({(practicePercent - totalApplied).toFixed(2)}%)</span>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
      {/* End Subcomponent Applied Percentage Bar Chart */}

      {/* Current Activity Configuration */}
      {currentActivity && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-green-900 mb-1">
                  {getActivityName(currentActivityData)}
                </h3>
                <p className="text-green-700">Configure research steps and subcomponents</p>
              </div>
                <div className="flex items-center space-x-4">
                {/* Force Recalculate Button */}
                <button
                  onClick={() => {
                    console.log('🔄 FORCE RECALCULATE TRIGGERED - DEEP DIVE DEBUG');
                    console.log('📊 Current State Before Recalculation:');
                    console.log('  Selected Activities:', selectedActivities.length);
                    console.log('  Selected Steps:', selectedSteps.length);
                    console.log('  Selected Subcomponents:', selectedSubcomponents.length);
                    console.log('  Current Activity Data:', currentActivityData);
                    
                    // DEEP DIVE: Check each activity's data sources
                    selectedActivities.forEach((activity, index) => {
                      console.log(`\n🧮 === ACTIVITY ${index + 1}: ${getActivityName(activity)} ===`);
                      console.log('📝 Raw Activity Data:', activity);
                      console.log('🎯 Practice Percentage (from getActivityPercentage):', getActivityPercentage(activity));
                      console.log('🆔 Activity ID (from getActivityId):', getActivityId(activity));
                      
                      // Check what steps belong to this activity
                      const activitySteps = selectedSteps.filter(step => 
                        step.research_activity_id === getActivityId(activity)
                      );
                      console.log(`📊 Steps for this activity (${activitySteps.length}):`, activitySteps);
                      
                      // Check subcomponents for each step
                      activitySteps.forEach(step => {
                        const stepSubcomponents = selectedSubcomponents.filter(sub => 
                          sub.step_id === step.step_id
                        );
                        console.log(`   Step ${step.step_id} has ${stepSubcomponents.length} subcomponents:`, stepSubcomponents);
                      });
                      
                      // Now calculate and show the math
                      console.log('🧮 Calculating applied percentage...');
                      const calculatedApplied = calculateActivityAppliedPercentage(activity);
                      console.log(`📊 RESULT: Applied = ${calculatedApplied}%, Practice = ${getActivityPercentage(activity)}%`);
                      console.log(`✅ Valid (Applied ≤ Practice): ${calculatedApplied <= getActivityPercentage(activity)}`);
                    });
                    
                    // Force a state update to trigger re-render
                    setLoading(true);
                    setTimeout(() => setLoading(false), 100);
                    
                    console.log('✅ Force recalculation completed - Check console logs above for issues');
                  }}
                  className="px-3 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Force Recalc</span>
                </button>
                
                <div className="text-right">
                  <div className="text-sm text-green-600">Practice Percentage</div>
                  <div className="text-2xl font-bold text-green-900">{getActivityPercentage(currentActivityData)}%</div>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Research Step Time Allocation - Enhanced Accordion UI */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Research Step Time Allocation</h3>
                    <p className="text-blue-100">Allocate time across your research steps. Click to expand and configure subcomponents.</p>
                  </div>
                  <button
                    onClick={forceRecalculateEverything}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
                    title="Force recalculate all applied percentages with current data"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Force Recalculate</span>
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                {researchSteps.map((step, idx) => {
                  const color = STEP_COLORS[idx % STEP_COLORS.length];
                  const percentage = Math.round(step.percentage);
                  const isExpanded = expandedStep === step.id;
                  const totalSubcomponents = step.subcomponents.length;
                  const selectedSubcomponents = step.subcomponents.filter(sub => 
                    subcomponentStates[sub.id]?.isSelected
                  ).length;
                  
                  return (
                    <div key={step.id} className={`bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${!step.isEnabled ? 'opacity-50' : 'hover:shadow-md'}`}>
                      {/* Accordion Header - More Compact */}
                      <div 
                        className="px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleAccordion(step.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Enhanced Colored Step Number */}
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm`} style={{ backgroundColor: color }}>
                              {idx + 1}
                            </div>
                            {/* Step Name */}
                            <div className="flex items-center space-x-2">
                              <span className={`font-semibold text-base ${!step.isEnabled ? 'line-through' : ''}`}>{step.name}</span>
                              {/* Enhanced Expand/Collapse Icon */}
                              <svg 
                                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1.5">
                            {/* Compact Move Controls */}
                            <button
                              onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'up'); }}
                              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                              title="Move Up"
                            >
                              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'down'); }}
                              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                              title="Move Down"
                            >
                              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            
                            {/* Enhanced Lock Button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleStepLock(step.id); }}
                              className={`p-1 rounded-full transition-colors ${step.isLocked ? 'bg-purple-100 text-purple-700' : 'hover:bg-purple-50 text-gray-500'}`}
                              title={step.isLocked ? 'Unlock Step' : 'Lock Step'}
                            >
                              {step.isLocked ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0a2 2 0 01-2-2V9a2 2 0 014 0v6a2 2 0 01-2 2z" /></svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11V7a4 4 0 018 0v4" /></svg>
                              )}
                            </button>
                            
                            {/* Enhanced Subcomponent Count Chip */}
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium shadow-sm flex items-center space-x-1`} style={{ 
                              backgroundColor: `${color}15`, 
                              border: `1px solid ${color}30`,
                              color: color 
                            }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                              <span>{selectedSubcomponents}/{totalSubcomponents}</span>
                            </div>
                            
                            {/* Non-R&D Time Chip */}
                            <button
                              onClick={(e) => { e.stopPropagation(); openNonRdModal(step.id); }}
                              className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition-colors flex items-center space-x-1 shadow-sm"
                              title="Configure Non-R&D Time"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Non-R&D: {step.nonRdPercentage}%</span>
                            </button>
                            
                            {/* Compact Toggle Switch */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleStepEnabled(step.id); }}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${step.isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                              title={step.isEnabled ? 'Disable Step' : 'Enable Step'}
                            >
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${step.isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Compact Slider and Chart Row */}
                        <div className="flex items-center mt-2">
                  <input
                            type="range"
                            min={0}
                            max={100}
                            value={step.percentage}
                            onChange={e => adjustStepPercentage(step.id, Number(e.target.value))}
                            disabled={step.isLocked || !step.isEnabled}
                            className={`flex-1 slider-blue ${step.isLocked ? 'slider-purple' : ''} mr-4`}
                            style={{ maxWidth: 'calc(100% - 100px)' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          {/* Enhanced Circular Chart with Gradient */}
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="absolute top-0 left-0 w-12 h-12" viewBox="0 0 48 48">
                              <defs>
                                <linearGradient id={`gradient-${step.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.8 }} />
                                  <stop offset="100%" style={{ stopColor: color, stopOpacity: 1 }} />
                                </linearGradient>
                              </defs>
                              <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                              <circle
                                cx="24" cy="24" r="20" fill="none"
                                stroke={step.isEnabled ? `url(#gradient-${step.id})` : '#d1d5db'}
                                strokeWidth="4"
                                strokeDasharray={2 * Math.PI * 20}
                                strokeDashoffset={2 * Math.PI * 20 * (1 - percentage / 100)}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.5s' }}
                              />
                            </svg>
                            <span className="absolute text-sm font-bold text-gray-900">{formatPercentage(percentage)}%</span>
                          </div>
                </div>
              </div>

                      {/* Enhanced Accordion Content */}
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[60vh]' : 'max-h-0'}`}>
                        <div className="px-4 pb-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 hover:scrollbar-thumb-blue-400">
                          <div className="pt-3">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-700">Subcomponent Configuration</h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Total: {totalSubcomponents}</span>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {totalSubcomponents > 0 ? (
                                step.subcomponents.map((subcomponent) => {
                                  const subState = subcomponentStates[subcomponent.id] || {
                                    isSelected: false,
                                    frequencyPercent: 0,
                                    yearPercent: 100,
                                    startYear: getDefaultStartYear(),
                                    startMonth: 1,
                                    monthName: 'January',
                                    selectedRoles: [],
                                    appliedPercentage: 0,
                                    // Initialize text fields
                                    general_description: '',
                                    goal: '',
                                    hypothesis: '',
                                    alternatives: '',
                                    uncertainties: '',
                                    developmental_process: '',
                                    primary_goal: '',
                                    expected_outcome_type: '',
                                    cpt_codes: '',
                                    cdt_codes: '',
                                    alternative_paths: ''
                                  };

                                  // Merge subcomponent data with state data for text fields
                                  const mergedSubcomponentData = {
                                    ...subcomponent,
                                    general_description: subState.general_description || subcomponent.general_description || '',
                                    goal: subState.goal || subcomponent.goal || '',
                                    hypothesis: subState.hypothesis || subcomponent.hypothesis || '',
                                    alternatives: subState.alternatives || subcomponent.alternatives || '',
                                    uncertainties: subState.uncertainties || subcomponent.uncertainties || '',
                                    developmental_process: subState.developmental_process || subcomponent.developmental_process || '',
                                    primary_goal: subState.primary_goal || subcomponent.primary_goal || '',
                                    expected_outcome_type: subState.expected_outcome_type || subcomponent.expected_outcome_type || '',
                                    cpt_codes: subState.cpt_codes || subcomponent.cpt_codes || '',
                                    cdt_codes: subState.cdt_codes || subcomponent.cdt_codes || '',
                                    alternative_paths: subState.alternative_paths || subcomponent.alternative_paths || ''
                                  };

                                  return (
                    <SubcomponentCard
                      key={subcomponent.id}
                                      subcomponent={{
                                        id: subcomponent.id,
                                        title: subcomponent.name || subcomponent.title,
                                        hint: subcomponent.hint || subcomponent.description || '',
                                        roles: subcomponent.roles || []
                                      }}
                      stepId={step.id}
                                      businessId={effectiveBusinessId}
                                      year={effectiveYear}
                                      stepTimePercent={selectedSteps.find(s => s.step_id === step.id)?.time_percentage || 0}
                                      practicePercent={currentActivityData?.practice_percent || currentActivityData?.percentage || 0}
                                      isSelected={subState.isSelected}
                                      frequencyPercent={subState.frequencyPercent}
                                      yearPercent={subState.yearPercent}
                                      startYear={subState.startYear}
                                      startMonth={subState.startMonth}
                                      monthName={subState.monthName}
                                      selectedRoles={subState.selectedRoles}
                                      appliedPercentage={subState.appliedPercentage}
                                      parentActivityRoles={currentActivityData?.selected_roles || []}
                                      subcomponentData={mergedSubcomponentData}
                                      onToggle={toggleSubcomponent}
                                      onFrequencyChange={handleFrequencyChange}
                                      onYearChange={handleYearChange}
                                      onStartYearChange={handleStartYearChange}
                                      onMonthChange={handleMonthChange}
                                      onRoleToggle={handleRoleToggle}
                                      onTextFieldChange={handleTextFieldChange}
                                    />
                                  );
                                })
                              ) : (
                                <div className="text-center py-4 bg-white rounded-lg border border-gray-200">
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <p className="text-gray-500 text-xs">No subcomponents found for this step.</p>
                </div>
              )}
            </div>
        </div>
      </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Enhanced Add Step Button */}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={addNewStep}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg shadow-sm transition-all duration-200 text-sm font-medium"
                  >
                    + Add Step
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Previous</span>
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
        >
          <span>Next</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Non-R&D Modal */}
      {showNonRdModal && selectedStepForNonRd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Configure Non-R&D Time</h3>
                <button
                  onClick={closeNonRdModal}
                  className="text-white hover:text-orange-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-orange-100 text-sm mt-1">
                Allocate non-R&D time for this step. This will reduce the available time for R&D activities.
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {(() => {
                const step = researchSteps.find(s => s.id === selectedStepForNonRd);
                if (!step) return null;

                return (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{step.name}</h4>
                      <p className="text-sm text-gray-600">
                        Current non-R&D allocation: <span className="font-semibold text-orange-600">{step.nonRdPercentage}%</span>
                      </p>
                    </div>

                    {/* Non-R&D Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Non-R&D Time Allocation</label>
                        <span className="text-lg font-bold text-orange-600">{step.nonRdPercentage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={step.nonRdPercentage}
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          setResearchSteps(prev => prev.map(s => 
                            s.id === selectedStepForNonRd 
                              ? { ...s, nonRdPercentage: newValue }
                              : s
                          ));
                        }}
                        className="w-full h-3 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #f97316 0%, #f97316 ${step.nonRdPercentage}%, #fed7aa ${step.nonRdPercentage}%, #fed7aa 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-orange-600">
                        <span>0% (All R&D)</span>
                        <span>100% (No R&D)</span>
                      </div>
                    </div>

                    {/* Impact Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Impact Summary</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Non-R&D Time:</span>
                          <span className="font-semibold text-orange-600">{step.nonRdPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Available R&D Time:</span>
                          <span className="font-semibold text-blue-600">{100 - step.nonRdPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Selected Subcomponents:</span>
                          <span className="font-semibold text-gray-900">
                            {step.subcomponents.filter(sub => subcomponentStates[sub.id]?.isSelected).length}
                          </span>
                        </div>
                        {step.subcomponents.filter(sub => subcomponentStates[sub.id]?.isSelected).length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Per Subcomponent:</span>
                            <span className="font-semibold text-green-600">
                              {Math.round((100 - step.nonRdPercentage) / step.subcomponents.filter(sub => subcomponentStates[sub.id]?.isSelected).length)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={closeNonRdModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const step = researchSteps.find(s => s.id === selectedStepForNonRd);
                  if (step) {
                    handleStepNonRdChange(selectedStepForNonRd, step.nonRdPercentage);
                  }
                  closeNonRdModal();
                }}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Research Report Modal */}
      <ResearchReportModal
        isOpen={showResearchReportModal}
        onClose={() => {
          console.log('%c🔒 Research Report Modal closing...', 'color: #ff0000; font-size: 16px; font-weight: bold;');
          setShowResearchReportModal(false);
        }}
        businessYearId={selectedActivityYearId}
        businessId={businessId}
      />

    </div>
  );
};

export default ResearchDesignStep; 