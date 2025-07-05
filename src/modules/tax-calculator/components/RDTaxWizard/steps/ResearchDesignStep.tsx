import React, { useState, useEffect } from 'react';
import { ResearchDesignService } from "../../../../../services/researchDesignService";
import {
  ResearchActivityWithSteps,
  SelectedStep,
  SelectedSubcomponent,
  STEP_COLORS,
  SUBCOMPONENT_COLORS
} from "../../../../../types/researchDesign";
import SubcomponentCard from './SubcomponentCard';
import { supabase } from "../../../../../lib/supabase";

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
  onUpdate,
  onNext,
  onPrevious
}) => {
  console.log('ResearchDesignStep: Component mounted with props:', {
    selectedActivitiesProp,
    businessYearId,
    businessId,
    year,
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

  // Accordion state management
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Non-R&D modal state
  const [showNonRdModal, setShowNonRdModal] = useState(false);
  const [selectedStepForNonRd, setSelectedStepForNonRd] = useState<string | null>(null);

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

  // Helper functions to handle both old and new data structures
  const getActivityName = (activity: any) => {
    return activity.activity_name || activity.name || 'Unknown Activity';
  };

  const getActivityPercentage = (activity: any) => {
    return activity.practice_percent || activity.percentage || 0;
  };

  const getActivityId = (activity: any) => {
    return activity.activity_id || activity.id;
  };

  // Load selected activities from database
  const loadSelectedActivities = async () => {
    console.log('ResearchDesignStep: loadSelectedActivities called with businessYearId:', businessYearId);
    
    if (!businessYearId) {
      console.log('ResearchDesignStep: No businessYearId provided, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      console.log('ResearchDesignStep: Calling ResearchDesignService.getSelectedActivities...');
      const activities = await ResearchDesignService.getSelectedActivities(businessYearId);
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
  }, [selectedActivities, businessYearId]);

  const loadResearchDesignData = async () => {
    if (!selectedActivities.length || !businessYearId) {
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
      setActivitiesWithSteps(activitiesData);

      // Load existing selections
      const [stepsData, subcomponentsData] = await Promise.all([
        ResearchDesignService.getSelectedSteps(businessYearId),
        ResearchDesignService.getSelectedSubcomponents(businessYearId)
      ]);

      console.log('ResearchDesignStep: Loaded steps data:', stepsData);
      console.log('ResearchDesignStep: Loaded subcomponents data:', subcomponentsData);

      // Check if we need to initialize steps for any activities
      const existingStepActivityIds = stepsData.map(step => step.research_activity_id);
      const activitiesNeedingSteps = activitiesData.filter(activity => 
        !existingStepActivityIds.includes(activity.activityId)
      );

      console.log('Activities needing steps initialization:', activitiesNeedingSteps);

      // Initialize steps for activities that don't have them
      for (const activity of activitiesNeedingSteps) {
        console.log('Initializing steps for activity:', activity.activityName);
        await initializeSteps(activity);
      }

      // Reload steps data after initialization
      const updatedStepsData = await ResearchDesignService.getSelectedSteps(businessYearId);
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
        activityId: activity.activityId,
        activityName: activity.activityName,
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
            .eq('business_year_id', businessYearId);
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
        .eq('business_year_id', businessYearId);
        
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

    const practicePercent = getActivityPercentage(selectedActivities[activeActivityIndex]) || 0;
    const selectedStep = selectedSteps.find(s => s.step_id === stepId);
    const stepTimePercent = selectedStep?.time_percentage ?? 0;
    const selectedSub = selectedSubcomponents.find(
      s => s.subcomponent_id === subcomponentId && s.step_id === stepId
    );
    
    console.log('Applied percentage calculation for subcomponent:', subcomponentId, {
      practicePercent,
      stepTimePercent,
      selectedSub: selectedSub ? {
        frequency_percentage: selectedSub.frequency_percentage,
        year_percentage: selectedSub.year_percentage
      } : null
    });
    
    if (selectedSub && practicePercent > 0 && stepTimePercent > 0) {
      const freq = selectedSub.frequency_percentage ?? 0;
      const year = selectedSub.year_percentage ?? 0;
      
      if (freq > 0 && year > 0) {
        const applied = (practicePercent / 100) * (stepTimePercent / 100) * (freq / 100) * (year / 100) * 100;
        console.log('Calculated applied percentage:', applied, 'for subcomponent:', subcomponentId);
        
        // Save both applied percentage and step percentage
        try {
          const { error } = await supabase
            .from('rd_selected_subcomponents')
            .update({ 
              applied_percentage: applied,
              step_percentage: stepTimePercent
            })
            .eq('subcomponent_id', subcomponentId)
            .eq('business_year_id', businessYearId);
            
          if (error) {
            console.error('Error saving applied percentage and step percentage:', error);
          } else {
            console.log('Successfully saved applied percentage and step percentage for subcomponent:', subcomponentId, {
              applied_percentage: applied,
              step_percentage: stepTimePercent
            });
          }
        } catch (error) {
          console.error('Error saving applied percentage and step percentage:', error);
        }
      } else {
        console.log('Skipping applied percentage calculation - freq or year is 0:', { freq, year });
      }
    } else {
      console.log('Skipping applied percentage calculation - missing data:', {
        hasSelectedSub: !!selectedSub,
        practicePercent,
        stepTimePercent
      });
    }
  };

  // Helper function to recalculate and save applied percentages for all subcomponents
  const recalculateAllAppliedPercentages = async () => {
    console.log('Recalculating all applied percentages...');
    
    for (const subcomponent of selectedSubcomponents) {
      await calculateAndSaveAppliedPercentage(subcomponent.subcomponent_id, subcomponent.step_id);
    }
    
    console.log('Finished recalculating all applied percentages');
  };

  // 2. When updating a step's time percentage, upsert to rd_selected_steps
  const updateStepTimePercentage = async (stepId: string, timePercentage: number) => {
    console.log('Updating step time percentage:', { stepId, timePercentage, businessYearId });
    setSelectedSteps(prev => prev.map(step => step.step_id === stepId ? { ...step, time_percentage: timePercentage } : step));
    try {
      const { error } = await supabase
        .from('rd_selected_steps')
        .upsert({
          business_year_id: businessYearId,
          research_activity_id: activitiesWithSteps[activeActivityIndex]?.activityId,
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
    const currentActivity = activitiesWithSteps[activeActivityIndex];
    if (!currentActivity) return;

    const existing = selectedSubcomponents.find(s => s.subcomponent_id === subcomponentId);
    const currentYear = new Date().getFullYear();
    const currentStepId = currentActivity.steps[activeStepIndex]?.id;

    if (!currentStepId) {
      console.error('No current step ID found');
      return;
    }

    const subcomponentData: Omit<SelectedSubcomponent, 'id' | 'created_at' | 'updated_at'> = {
      business_year_id: businessYearId,
      research_activity_id: currentActivity.activityId,
      step_id: currentStepId,
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

  // Step allocation functions
  const initializeSteps = async (activity: any) => {
    if (!activity.steps || activity.steps.length === 0) return;
    
    const stepCount = activity.steps.length;
    const equalPercentage = 100 / stepCount;
    
    const steps: ResearchStep[] = activity.steps.map((step: any, index: number) => ({
      id: step.id,
      name: step.name,
      percentage: equalPercentage,
      isLocked: false,
      isEnabled: true,
      order: index,
      subcomponents: step.subcomponents || [],
      nonRdPercentage: 0
    }));
    
    setResearchSteps(steps);
    
    // Save step time percentages to database if they don't exist yet
    console.log('Saving initial step time percentages to database...');
    console.log('Activity data for initialization:', activity);
    
    // Get the correct activity ID from activitiesWithSteps structure
    const activityId = activity.activityId;
    console.log('Using activity ID for step initialization:', activityId);
    
    for (const step of steps) {
      try {
        const { error } = await supabase
          .from('rd_selected_steps')
          .upsert({
            business_year_id: businessYearId,
            research_activity_id: activityId,
            step_id: step.id,
            time_percentage: step.percentage
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
    
    // Refresh selectedSteps state to include the newly saved data
    try {
      const stepsData = await ResearchDesignService.getSelectedSteps(businessYearId);
      setSelectedSteps(stepsData);
      console.log('Refreshed selectedSteps with database data:', stepsData);
    } catch (error) {
      console.error('Error refreshing selectedSteps:', error);
    }
  };

  const adjustStepPercentage = (stepId: string, newPercentage: number) => {
    setResearchSteps(prevSteps => {
      const stepIndex = prevSteps.findIndex(s => s.id === stepId);
      if (stepIndex === -1) return prevSteps;
      
      const step = prevSteps[stepIndex];
      if (step.isLocked) return prevSteps;
      
      const unlockedSteps = prevSteps.filter(s => !s.isLocked && s.isEnabled);
      const lockedSteps = prevSteps.filter(s => s.isLocked && s.isEnabled);
      
      const lockedTotal = lockedSteps.reduce((sum, s) => sum + s.percentage, 0);
      const availablePercentage = 100 - lockedTotal - newPercentage;
      
      if (availablePercentage < 0) return prevSteps; // Invalid adjustment
      
      const remainingUnlockedSteps = unlockedSteps.filter(s => s.id !== stepId);
      const equalDistribution = remainingUnlockedSteps.length > 0 ? availablePercentage / remainingUnlockedSteps.length : 0;
      
      const newSteps = prevSteps.map(s => {
        if (s.id === stepId) {
          return { ...s, percentage: newPercentage };
        } else if (!s.isLocked && s.isEnabled && s.id !== stepId) {
          return { ...s, percentage: equalDistribution };
        }
        return s;
      });
      
      return newSteps;
    });
  };

  const toggleStepLock = (stepId: string) => {
    setResearchSteps(prevSteps => 
      prevSteps.map(s => 
        s.id === stepId ? { ...s, isLocked: !s.isLocked } : s
      )
    );
  };

  const toggleStepEnabled = (stepId: string) => {
    setResearchSteps(prevSteps => {
      const step = prevSteps.find(s => s.id === stepId);
      if (!step) return prevSteps;
      
      if (step.isEnabled) {
        // Disabling step - redistribute its percentage
        const remainingSteps = prevSteps.filter(s => s.id !== stepId && s.isEnabled);
        const equalDistribution = remainingSteps.length > 0 ? (100 - step.percentage) / remainingSteps.length : 0;
        
        return prevSteps.map(s => {
          if (s.id === stepId) {
            return { ...s, isEnabled: false, percentage: 0 };
          } else if (s.isEnabled) {
            return { ...s, percentage: equalDistribution };
          }
          return s;
        });
      } else {
        // Enabling step - give it equal share
        const enabledSteps = prevSteps.filter(s => s.isEnabled);
        const equalDistribution = 100 / (enabledSteps.length + 1);
        
        return prevSteps.map(s => {
          if (s.id === stepId) {
            return { ...s, isEnabled: true, percentage: equalDistribution };
          } else if (s.isEnabled) {
            return { ...s, percentage: equalDistribution };
          }
          return s;
        });
      }
    });
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

  const resetToEqual = () => {
    setResearchSteps(prevSteps => {
      const enabledSteps = prevSteps.filter(s => s.isEnabled);
      const equalDistribution = enabledSteps.length > 0 ? 100 / enabledSteps.length : 0;
      
      return prevSteps.map(s => ({
        ...s,
        percentage: s.isEnabled ? equalDistribution : 0,
        isLocked: false
      }));
    });

    // Also reset subcomponent frequencies to equal distribution
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

    // Save the reset frequencies to database
    setTimeout(() => {
      normalizeSubcomponentFrequencies();
    }, 100);
  };

  // Initialize steps when activity changes
  useEffect(() => {
    if (activitiesWithSteps.length > 0 && activeActivityIndex >= 0) {
      const currentActivity = activitiesWithSteps[activeActivityIndex];
      if (currentActivity) {
        initializeSteps(currentActivity);
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
  }, [activitiesWithSteps, activeActivityIndex, selectedActivities.length]);

  // Load existing subcomponent data
  useEffect(() => {
    const loadSubcomponentData = async () => {
      if (!businessYearId) return;

      try {
        console.log('ResearchDesignStep: Loading subcomponent data for businessYearId:', businessYearId);
        
        const { data: selectedSubcomponents, error } = await supabase
          .from('rd_selected_subcomponents')
          .select('*')
          .eq('business_year_id', businessYearId);

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
        
        // Recalculate and save applied percentages for all subcomponents
        setTimeout(() => {
          recalculateAllAppliedPercentages();
        }, 100);
        
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
          .eq('business_year_id', businessYearId);
          
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
    return (practicePercent * stepTimePercent * frequencyPercent * yearPercent) / 10000;
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
        .eq('business_year_id', businessYearId);
        
      if (changedError) {
        console.error('Error updating changed subcomponent frequency:', changedError);
      }

      // Save the redistributed subcomponents
      for (const sub of selectedSubcomponents) {
        const { error } = await supabase
          .from('rd_selected_subcomponents')
          .update({ frequency_percentage: equalShare })
          .eq('subcomponent_id', sub.id)
          .eq('business_year_id', businessYearId);
          
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
    
    // Get the current activity to get the correct research_activity_id
    const currentActivity = activitiesWithSteps[activeActivityIndex];
    if (!currentActivity) {
      console.error('No current activity found');
      return;
    }
    
    console.log('Toggling subcomponent:', { subcomponentId, stepId, isCurrentlySelected, businessYearId, researchActivityId: currentActivity.activityId });
    
    if (isCurrentlySelected) {
      // Remove from study
      try {
        console.log('Removing subcomponent from database...');
        const { error } = await supabase
          .from('rd_selected_subcomponents')
          .delete()
          .eq('subcomponent_id', subcomponentId)
          .eq('business_year_id', businessYearId);
          
        if (error) {
          console.error('Error removing subcomponent:', error);
        } else {
          console.log('Successfully removed subcomponent:', subcomponentId);
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
        
        // Insert the new subcomponent
        const { error } = await supabase
          .from('rd_selected_subcomponents')
          .insert({
            business_year_id: businessYearId,
            research_activity_id: currentActivity.activityId,
            step_id: stepId,
            subcomponent_id: subcomponentId,
            frequency_percentage: initialFrequencyPercent,
            year_percentage: 100,
            start_month: 1,
            start_year: getDefaultStartYear(),
            selected_roles: [],
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
          console.log('Successfully added subcomponent:', subcomponentId, 'with frequency:', initialFrequencyPercent);
          
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
                .eq('business_year_id', businessYearId);
                
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
            .eq('business_year_id', businessYearId);
            
          if (refreshError) {
            console.error('Error refreshing subcomponent data:', refreshError);
          } else {
            console.log('Refreshed subcomponent data:', refreshedData);
            setSelectedSubcomponents(refreshedData || []);
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
        // Initialize new subcomponent
        updated[subcomponentId] = {
          isSelected: true,
          frequencyPercent: 0,
          yearPercent: 100,
          startYear: getDefaultStartYear(),
          startMonth: 1,
          monthName: 'January',
          selectedRoles: [],
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
            
            selectedSubcomponents.forEach(sub => {
              updated[sub.id] = {
                ...updated[sub.id],
                frequencyPercent: equalShare
              };
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
        .eq('business_year_id', businessYearId);
        
      if (error) {
        console.error('Error updating year percent:', error);
      } else {
        console.log('Successfully updated year percent for subcomponent:', subcomponentId);
        
        // Find the step ID for this subcomponent and save applied percentage
        const selectedSub = selectedSubcomponents.find(s => s.subcomponent_id === subcomponentId);
        if (selectedSub) {
          await calculateAndSaveAppliedPercentage(subcomponentId, selectedSub.step_id);
        }
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
        .eq('business_year_id', businessYearId);
        
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
        .eq('business_year_id', businessYearId);
        
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
    setSubcomponentStates(prev => {
      const currentRoles = prev[subcomponentId]?.selectedRoles || [];
      const newRoles = currentRoles.includes(role)
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role];

      // Save to database immediately with the new roles
      supabase
        .from('rd_selected_subcomponents')
        .update({ selected_roles: newRoles })
        .eq('subcomponent_id', subcomponentId)
        .eq('business_year_id', businessYearId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating selected roles:', error);
          } else {
            console.log('Successfully updated roles for subcomponent:', subcomponentId, 'New roles:', newRoles);
          }
        });

      return {
        ...prev,
        [subcomponentId]: {
          ...prev[subcomponentId],
          selectedRoles: newRoles
        }
      };
    });
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
        .eq('business_year_id', businessYearId);
        
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
    console.log('Updating step non-R&D percentage:', { stepId, nonRdPercentage, businessYearId });
    
    // Update local state
    setResearchSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, nonRdPercentage }
        : step
    ));

    // Save to database - we'll need to create a new table or add a column to existing table
    try {
      // For now, we'll store this in a new table or add to existing step table
      // This is a placeholder - you may need to adjust based on your database schema
      const { error } = await supabase
        .from('rd_research_steps')
        .upsert({
          business_year_id: businessYearId,
          step_id: stepId,
          non_rd_percentage: nonRdPercentage
        }, {
          onConflict: 'business_year_id,step_id'
        });
        
      if (error) {
        console.error('Error updating step non-R&D percentage:', error);
      } else {
        console.log('Successfully updated step non-R&D percentage for step:', stepId);
      }
    } catch (error) {
      console.error('Error updating step non-R&D percentage:', error);
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
          .eq('business_year_id', businessYearId);
          
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

  // Helper function to format percentages with max 2 decimal places
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate total applied percentage for an activity (matches SubcomponentCard logic)
  const calculateActivityAppliedPercentage = (activity: any): number => {
    console.log('=== CALCULATING ACTIVITY APPLIED PERCENTAGE ===');
    console.log('Activity being calculated:', activity);
    console.log('Activity ID:', getActivityId(activity));
    console.log('Practice percentage:', getActivityPercentage(activity));
    
    // Get the practice percentage for this activity
    const practicePercent = getActivityPercentage(activity) || 0;
    console.log('Practice percent:', practicePercent);
    
    if (!practicePercent) {
      console.log('No practice percentage found, returning 0');
      return 0;
    }
    
    // Check if data is still loading
    if (selectedSteps.length === 0) {
      console.log('Data still loading, selectedSteps is empty, returning 0');
      return 0;
    }
    
    // Find all steps that belong to this activity using research_activity_id
    const activityId = getActivityId(activity);
    const stepsForActivity = selectedSteps.filter(step => step.research_activity_id === activityId);
    console.log('Steps for this activity:', stepsForActivity);
    console.log('All selectedSteps:', selectedSteps);
    console.log('Looking for activity ID:', activityId);
    
    if (stepsForActivity.length === 0) {
      console.log('No steps found for this activity, returning 0');
      return 0;
    }
    
    let totalApplied = 0;
    
    // For each step, calculate the total applied percentage from its subcomponents
    stepsForActivity.forEach(step => {
      console.log(`Processing step ${step.step_id} with time percentage ${step.time_percentage}%`);
      
      // Find all subcomponents for this step
      const subcomponentsForStep = selectedSubcomponents.filter(sub => sub.step_id === step.step_id);
      console.log(`Found ${subcomponentsForStep.length} subcomponents for step ${step.step_id}`);
      
      subcomponentsForStep.forEach(sub => {
        console.log(`Processing subcomponent ${sub.subcomponent_id}:`, {
          frequency_percentage: sub.frequency_percentage,
          year_percentage: sub.year_percentage,
          step_percentage: sub.step_percentage,
          applied_percentage: sub.applied_percentage
        });
        
        // Use stored applied_percentage if available, otherwise calculate it
        let applied = 0;
        if (sub.applied_percentage && sub.applied_percentage > 0) {
          applied = sub.applied_percentage;
          console.log(`Using stored applied percentage: ${applied}%`);
        } else {
          // Calculate using stored step_percentage if available, otherwise use step.time_percentage
          const stepTimePercent = sub.step_percentage || step.time_percentage || 0;
          const freq = sub.frequency_percentage || 0;
          const year = sub.year_percentage || 0;
          
          if (stepTimePercent > 0 && freq > 0 && year > 0) {
            // Use the same calculation as SubcomponentCard
            const practice = practicePercent / 100;
            const stepPercent = stepTimePercent / 100;
            const freqPercent = freq / 100;
            const yearPercent = year / 100;
            applied = +(practice * stepPercent * freqPercent * yearPercent * 100).toFixed(2);
            console.log(`Calculated applied percentage: ${applied}% (practice: ${practicePercent}%, step: ${stepTimePercent}%, freq: ${freq}%, year: ${year}%)`);
          } else {
            console.log(`Skipping calculation - missing values: stepTimePercent=${stepTimePercent}, freq=${freq}, year=${year}`);
          }
        }
        
        console.log(`Calculated applied percentage for subcomponent ${sub.subcomponent_id}: ${applied}%`);
        totalApplied += applied;
      });
    });
    
    console.log('Total applied percentage for activity', getActivityName(activity), ':', totalApplied);
    console.log('=== END CALCULATION ===');
    
    return totalApplied;
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

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
      
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
              </div>
            </div>
            {/* Applied Percentage Stacked Bar for Activities */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-blue-100 mb-2">
                <span>Applied Percentage by Activity</span>
                <span>100%</span>
              </div>
              <div className="w-full h-5 rounded-full bg-blue-500/30 flex overflow-hidden">
                {selectedActivities.map((activity, idx) => {
                  const applied = calculateActivityAppliedPercentage(activity);
                  const totalApplied = selectedActivities.reduce((sum, a) => sum + calculateActivityAppliedPercentage(a), 0);
                  const width = totalApplied > 0 ? (applied / totalApplied) * 100 : 0;
                  const color = [
                    'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500',
                    'bg-indigo-500', 'bg-teal-500', 'bg-yellow-500', 'bg-pink-500'
                  ][idx % 8];
                  return (
                    <div
              key={activity.id}
                      className={`${color} h-full flex items-center justify-center transition-all duration-300`}
                      style={{ width: `${width}%` }}
                    >
                      {width > 8 && (
                        <span className="text-xs font-semibold text-white px-2 truncate">
                          {getActivityName(activity)} ({applied.toFixed(2)}%)
                        </span>
                      )}
        </div>
                  );
                })}
                {/* Fill unused portion if total < 100% */}
                {(() => {
                  const totalApplied = selectedActivities.reduce((sum, a) => sum + calculateActivityAppliedPercentage(a), 0);
                  if (totalApplied < 100) {
                    return (
                      <div
                        className="bg-gray-300 h-full flex-1"
                        style={{ width: `${100 - totalApplied}%` }}
                      />
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            {/* End Applied Percentage Stacked Bar */}
            {/* Progress Bar (existing) */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-blue-100 mb-2">
                <span>Configuration Progress</span>
                <span>{Math.round((selectedSubcomponents.length / (activitiesWithSteps.reduce((sum, activity) => sum + activity.steps.reduce((stepSum, step) => stepSum + step.subcomponents.length, 0), 0) || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-500/30 rounded-full h-3">
                <div 
                  className="bg-green-400 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${(selectedSubcomponents.length / (activitiesWithSteps.reduce((sum, activity) => sum + activity.steps.reduce((stepSum, step) => stepSum + step.subcomponents.length, 0), 0) || 1)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        </div>

      {/* Activity Navigation with Modern Cards */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Research Activities</h3>
          <p className="text-gray-600">Select an activity to configure its research design</p>
        </div>

        {/* Activity Cards Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedActivities.map((activity, index) => {
              const isActive = activeActivityIndex === index;
              // Only calculate applied percentage if data is loaded
              const appliedPercentage = loading ? 0 : calculateActivityAppliedPercentage(activity);
              const practicePercentage = getActivityPercentage(activity);
              const colorGradient = ACTIVITY_COLORS[index % ACTIVITY_COLORS.length];
              
              console.log(`Activity card ${index}:`, {
                activityName: getActivityName(activity),
                activityId: getActivityId(activity),
                practicePercentage,
                appliedPercentage,
                isActive,
                loading
              });
              
              return (
                <div
                  key={activity.id}
                  onClick={() => setActiveActivityIndex(index)}
                  className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                >
                  <div className={`bg-gradient-to-br rounded-xl p-6 shadow-lg border-2 transition-all duration-300 ${
                    isActive 
                      ? `from-blue-500 to-blue-600 border-blue-400 text-white` 
                      : `${colorGradient} border-gray-200 hover:shadow-xl text-white`
                  }`}>
                    {/* Activity Name */}
                    <h4 className={`font-bold text-xl mb-3 ${isActive ? 'text-white' : 'text-white'}`}>
                      {getActivityName(activity)}
                    </h4>
                    {/* Practice/Applied Percentages Combined */}
                    <div className="mb-4">
                      <div className="text-sm opacity-90 mb-1">Practice/Applied</div>
                      <div className="text-2xl font-bold">
                        {practicePercentage}% / {loading ? '...' : `${appliedPercentage.toFixed(2)}%`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
            return { id: sub.id, title: sub.title, name: sub.name, applied, stepId: step.id, stepMax, stepName: step.name };
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
                <h3 className="text-xl font-semibold text-white mb-2">Research Step Time Allocation</h3>
                <p className="text-blue-100">Allocate time across your research steps. Click to expand and configure subcomponents.</p>
              </div>
              <div className="p-4 space-y-2">
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
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}>
                        <div className="px-4 pb-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                          <div className="pt-3">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-700">Subcomponent Configuration</h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Total: {totalSubcomponents}</span>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                                
                                {/* Non-R&D Chip */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); openNonRdModal(step.id); }}
                                  className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition-colors flex items-center space-x-1"
                                  title="Configure Non-R&D Time"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Non-R&D: {step.nonRdPercentage}%</span>
                                </button>
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
                                      stepTimePercent={step.percentage}
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
    </div>
  );
};

export default ResearchDesignStep; 