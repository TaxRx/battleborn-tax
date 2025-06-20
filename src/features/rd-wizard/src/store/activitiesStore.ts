import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Category, 
  Area, 
  Focus, 
  ResearchActivity, 
  ResearchSubcomponent,
  SelectedActivity,
  SelectedSubcomponent
} from '../types';
import useStaffStore from './staffStore';

export interface ActivitiesStore {
  // Data
  categories: Category[];
  selectedCategoryId: string | null;
  selectedAreaIds: string[];
  selectedFocusIds: string[];
  selectedActivities: SelectedActivity[];
  availableActivities: ResearchActivity[];
  
  // Actions
  setCategories: (categories: Category[]) => void;
  selectCategory: (categoryId: string) => void;
  toggleAreaSelection: (areaId: string) => void;
  toggleFocusSelection: (focusId: string) => void;
  addSelectedActivity: (activity: ResearchActivity, practicePercentage: number, year: number) => void;
  removeSelectedActivity: (activityId: string) => void;
  updateActivityPracticePercentage: (activityId: string, percentage: number) => void;
  updateSubcomponentFrequencyPercentage: (activityId: string, subcomponentId: string, percentage: number) => void;
  updateSubcomponentTimePercentage: (activityId: string, subcomponentId: string, percentage: number) => void;
  updateSubcomponentYearPercentage: (activityId: string, subcomponentId: string, percentage: number) => void;
  calculateAppliedPercentage: (activityId: string, subcomponentId: string) => void;
  toggleSubcomponentSelection: (activityId: string, subcomponentId: string) => void;
  updateSubcomponentDescription: (
    activityId: string,
    subcomponentId: string,
    field: 'generalDescription' | 'hypothesis' | 'methodology',
    value: string
  ) => void;
  addSubcomponentDocument: (activityId: string, subcomponentId: string, file: File) => void;
  removeSubcomponentDocument: (activityId: string, subcomponentId: string, fileName: string) => void;
  copyActivitiesToPreviousYears: (currentYear: number, previousYears: number[]) => void;
  setAvailableActivities: (activities: ResearchActivity[]) => void;
  updateQualifiedExpenses: () => void;
  
  // Getters
  getAvailableAreas: () => Area[];
  getAvailableFocuses: () => Focus[];
  getAvailableActivities: () => ResearchActivity[];
}

const useActivitiesStore = create<ActivitiesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      categories: [],
      selectedCategoryId: null,
      selectedAreaIds: [],
      selectedFocusIds: [],
      selectedActivities: [],
      availableActivities: [],
      
      // Actions
      setCategories: (categories) => set({ categories }),
      
      selectCategory: (categoryId) => set({ 
        selectedCategoryId: categoryId,
        selectedAreaIds: [],
        selectedFocusIds: []
      }),
      
      toggleAreaSelection: (areaId) => set((state) => ({
        selectedAreaIds: state.selectedAreaIds.includes(areaId)
          ? state.selectedAreaIds.filter(id => id !== areaId)
          : [...state.selectedAreaIds, areaId],
        selectedFocusIds: []
      })),
      
      toggleFocusSelection: (focusId) => set((state) => ({
        selectedFocusIds: state.selectedFocusIds.includes(focusId)
          ? state.selectedFocusIds.filter(id => id !== focusId)
          : [...state.selectedFocusIds, focusId]
      })),
      
      addSelectedActivity: (activity, practicePercentage, year) => {
        set((state) => {
          // Calculate per-subcomponent limits based on practice percentage
          const selectedSubcomponents = activity.subcomponents.filter(sub => sub.isSelected !== false);
          const subcomponentCount = selectedSubcomponents.length;
          const maxPerSubcomponent = practicePercentage / subcomponentCount;

          const newActivity: SelectedActivity = {
            ...activity,
            year,
            practicePercentage,
            subcomponents: activity.subcomponents.map(sub => {
              if (sub.isSelected === false) {
                return {
                  ...sub,
                  isSelected: false,
                  generalDescription: '',
                  hypothesis: '',
                  methodology: '',
                  documents: [],
                  frequencyPercentage: 0,
                  timePercentage: 0,
                  yearPercentage: 0,
                  appliedPercentage: 0
                };
              }

              // Generate truly random percentages within specified ranges
              const frequencyPercentage = Math.round(Math.random() * (50 - 20) + 20); // 20-50%
              const timePercentage = Math.round(Math.random() * (10 - 4) + 4);       // 4-10%
              
              // Calculate applied percentage with scaling to respect practice percentage limit
              const appliedPercentage = Math.round(
                Math.min(
                  (practicePercentage * frequencyPercentage * timePercentage) / 10000,
                  maxPerSubcomponent
                )
              );
              
              return {
                ...sub,
                isSelected: true,
                generalDescription: sub.generalDescription || '',
                hypothesis: sub.hypothesis || '',
                methodology: sub.methodology || '',
                documents: [],
                frequencyPercentage,
                timePercentage,
                yearPercentage: 100,
                appliedPercentage
              };
            }) as SelectedSubcomponent[]
          };

          // Remove this activity from available activities
          const updatedAvailableActivities = state.availableActivities.filter(a => a.id !== activity.id);

          // Trigger staff store update
          const staffStore = useStaffStore.getState();
          if (staffStore.recalculateWages) {
            staffStore.recalculateWages();
          }

          return {
            selectedActivities: [...state.selectedActivities, newActivity],
            availableActivities: updatedAvailableActivities
          };
        });
      },
      
      removeSelectedActivity: (activityId) => {
        const { selectedActivities } = get();
        set({
          selectedActivities: selectedActivities.filter(a => a.id !== activityId)
        });
      },
      
      updateActivityPracticePercentage: (activityId, percentage) => {
        const { selectedActivities } = get();
        const updatedActivities = selectedActivities.map(activity => {
          if (activity.id === activityId) {
            const updatedActivity = { ...activity, practicePercentage: parseFloat(percentage.toFixed(2)) };
            
            // Recalculate applied percentages for all subcomponents
            updatedActivity.subcomponents = updatedActivity.subcomponents.map(sub => {
              if (!sub.isSelected) return sub;
              const applied = (percentage * sub.frequencyPercentage * sub.timePercentage * sub.yearPercentage) / 1000000;
              return {
                ...sub,
                appliedPercentage: parseFloat(applied.toFixed(2))
              };
            });
            
            return updatedActivity;
          }
          return activity;
        });
        
        set({ selectedActivities: updatedActivities });
        
        // Trigger staff store update
        const staffStore = useStaffStore.getState();
        if (staffStore.recalculateWages) {
          staffStore.recalculateWages();
        }
      },
      
      updateSubcomponentFrequencyPercentage: (activityId, subcomponentId, percentage) => {
        const { selectedActivities } = get();
        const updatedActivities = selectedActivities.map(activity => {
          if (activity.id === activityId) {
            const selectedSubcomponents = activity.subcomponents.filter(sub => sub.isSelected !== false);
            const subcomponentCount = selectedSubcomponents.length;
            const maxPerSubcomponent = activity.practicePercentage / subcomponentCount;

            const updatedSubcomponents = activity.subcomponents.map(sub => {
              if (sub.id === subcomponentId) {
                const applied = (activity.practicePercentage * percentage * sub.timePercentage * sub.yearPercentage) / 1000000;
                return {
                  ...sub,
                  frequencyPercentage: parseFloat(percentage.toFixed(2)),
                  appliedPercentage: parseFloat(applied.toFixed(2))
                };
              }
              return sub;
            });
            
            return {
              ...activity,
              subcomponents: updatedSubcomponents
            };
          }
          return activity;
        });
        
        set({ selectedActivities: updatedActivities });
      },
      
      updateSubcomponentTimePercentage: (activityId, subcomponentId, percentage) => {
        const { selectedActivities } = get();
        const updatedActivities = selectedActivities.map(activity => {
          if (activity.id === activityId) {
            const selectedSubcomponents = activity.subcomponents.filter(sub => sub.isSelected !== false);
            const subcomponentCount = selectedSubcomponents.length;
            const maxPerSubcomponent = activity.practicePercentage / subcomponentCount;

            const updatedSubcomponents = activity.subcomponents.map(sub => {
              if (sub.id === subcomponentId) {
                const applied = (activity.practicePercentage * sub.frequencyPercentage * percentage * sub.yearPercentage) / 1000000;
                return {
                  ...sub,
                  timePercentage: parseFloat(percentage.toFixed(2)),
                  appliedPercentage: parseFloat(applied.toFixed(2))
                };
              }
              return sub;
            });
            
            return {
              ...activity,
              subcomponents: updatedSubcomponents
            };
          }
          return activity;
        });
        
        set({ selectedActivities: updatedActivities });
      },
      
      updateSubcomponentYearPercentage: (activityId, subcomponentId, percentage) => {
        const { selectedActivities } = get();
        const updatedActivities = selectedActivities.map(activity => {
          if (activity.id === activityId) {
            const updatedSubcomponents = activity.subcomponents.map(sub => {
              if (sub.id === subcomponentId) {
                const applied = (activity.practicePercentage * sub.frequencyPercentage * sub.timePercentage * percentage) / 1000000;
                return {
                  ...sub,
                  yearPercentage: percentage,
                  appliedPercentage: parseFloat(applied.toFixed(2))
                };
              }
              return sub;
            });
            
            return {
              ...activity,
              subcomponents: updatedSubcomponents
            };
          }
          return activity;
        });
        
        set({ selectedActivities: updatedActivities });
      },
      
      calculateAppliedPercentage: (activityId, subcomponentId) => {
        const { selectedActivities } = get();
        const updatedActivities = selectedActivities.map(activity => {
          if (activity.id === activityId) {
            const updatedSubcomponents = activity.subcomponents.map(sub => {
              if (sub.id === subcomponentId) {
                const applied = (activity.practicePercentage * sub.frequencyPercentage * sub.timePercentage * sub.yearPercentage) / 1000000;
                return {
                  ...sub,
                  appliedPercentage: parseFloat(applied.toFixed(2))
                };
              }
              return sub;
            });
            
            return {
              ...activity,
              subcomponents: updatedSubcomponents
            };
          }
          return activity;
        });
        
        set({ selectedActivities: updatedActivities });
      },

      toggleSubcomponentSelection: (activityId, subcomponentId) => {
        const { selectedActivities } = get();
        const updatedActivities = selectedActivities.map(activity => {
          if (activity.id === activityId) {
            const updatedSubcomponents = activity.subcomponents.map(sub => {
              if (sub.id === subcomponentId) {
                return {
                  ...sub,
                  isSelected: !sub.isSelected
                };
              }
              return sub;
            });
            
            return {
              ...activity,
              subcomponents: updatedSubcomponents
            };
          }
          return activity;
        });
        
        set({ selectedActivities: updatedActivities });
      },

      updateSubcomponentDescription: (activityId, subcomponentId, field, value) => {
        set((state) => {
          const activities = state.selectedActivities.map((activity) => {
          if (activity.id === activityId) {
              return {
                ...activity,
                subcomponents: activity.subcomponents.map((sub) => {
              if (sub.id === subcomponentId) {
                return {
                  ...sub,
                      [field]: value,
                      methodology: field === 'methodology' ? value : (sub.methodology || '')
                };
              }
              return sub;
                }),
            };
          }
          return activity;
        });
        
          return { ...state, selectedActivities: activities };
        });
      },

      addSubcomponentDocument: (activityId, subcomponentId, file) => {
        const { selectedActivities } = get();
        const updatedActivities = selectedActivities.map(activity => {
          if (activity.id === activityId) {
            const updatedSubcomponents = activity.subcomponents.map(sub => {
              if (sub.id === subcomponentId) {
                const documents = sub.documents || [];
                return {
                  ...sub,
                  documents: [...documents, file]
                };
              }
              return sub;
            });
            
            return {
              ...activity,
              subcomponents: updatedSubcomponents
            };
          }
          return activity;
        });
        
        set({ selectedActivities: updatedActivities });
      },

      removeSubcomponentDocument: (activityId, subcomponentId, fileName) => {
        const { selectedActivities } = get();
        const updatedActivities = selectedActivities.map(activity => {
          if (activity.id === activityId) {
            const updatedSubcomponents = activity.subcomponents.map(sub => {
              if (sub.id === subcomponentId && sub.documents) {
                return {
                  ...sub,
                  documents: sub.documents.filter(doc => doc.name !== fileName)
                };
              }
              return sub;
            });
            
            return {
              ...activity,
              subcomponents: updatedSubcomponents
            };
          }
          return activity;
        });
        
        set({ selectedActivities: updatedActivities });
      },

      copyActivitiesToPreviousYears: (currentYear, previousYears) => {
        const { selectedActivities } = get();
        
        // Get activities for the current year
        const currentYearActivities = selectedActivities.filter(activity => 
          activity.year === currentYear
        );
        
        if (currentYearActivities.length === 0) return;
        
        // Remove any existing activities for the target years
        let newActivities = selectedActivities.filter(activity => 
          !previousYears.includes(activity.year) && activity.year !== currentYear
        );
        
        previousYears.forEach((year, index) => {
          // Create copies with reduced percentages
          currentYearActivities.forEach(activity => {
            // Reduce percentage by 5% for each previous year
            const yearIndex = index + 1; // How many years back
            const reductionPercent = 5; // 5% reduction per year
            
            let newPracticePercentage = activity.practicePercentage;
            for (let i = 0; i < yearIndex; i++) {
              const reduction = Math.round(newPracticePercentage * (reductionPercent / 100));
              newPracticePercentage = Math.max(4, newPracticePercentage - reduction);
            }
            
            // Create a copy of the activity with new random percentages
            const newActivity: SelectedActivity = {
              ...activity,
              year,
              practicePercentage: newPracticePercentage,
              subcomponents: activity.subcomponents.map(sub => {
                if (!sub.isSelected) return sub;
                
                // Generate new random percentages for each subcomponent
                const frequencyPercentage = Math.round(Math.random() * (50 - 20) + 20); // 20-50%
                const timePercentage = Math.round(Math.random() * (10 - 4) + 4);       // 4-10%
                
                // Calculate applied percentage
                const appliedPercentage = Math.round(
                  Math.min(
                    (newPracticePercentage * frequencyPercentage * timePercentage) / 10000,
                    newPracticePercentage / activity.subcomponents.filter(s => s.isSelected).length
                  )
                );
                
                return {
                  ...sub,
                  frequencyPercentage,
                  timePercentage,
                  yearPercentage: 100,
                  appliedPercentage
                };
              })
            };
            
            newActivities.push(newActivity);
          });
        });
        
        set({ selectedActivities: newActivities });
        
        // Trigger staff store update
        const staffStore = useStaffStore.getState();
        if (staffStore.recalculateWages) {
          staffStore.recalculateWages();
        }
      },
      
      // Getters
      getAvailableAreas: () => {
        const { categories, selectedCategoryId } = get();
        if (!selectedCategoryId) return [];
        
        const category = categories.find(c => c.id === selectedCategoryId);
        return category ? category.areas : [];
      },
      
      getAvailableFocuses: () => {
        const { getAvailableAreas, selectedAreaIds } = get();
        const areas = getAvailableAreas();
        
        if (selectedAreaIds.length === 0) return [];
        
        return areas
          .filter(area => selectedAreaIds.includes(area.id))
          .flatMap(area => area.focuses);
      },
      
      getAvailableActivities: () => {
        const { getAvailableFocuses, selectedFocusIds } = get();
        const focuses = getAvailableFocuses();
        
        if (selectedFocusIds.length === 0) return [];
        
        return focuses
          .filter(focus => selectedFocusIds.includes(focus.id))
          .flatMap(focus => focus.researchActivities);
      },

      setAvailableActivities: (activities) => set({ availableActivities: activities }),

      // Add a new function to handle updates to qualified expenses
      updateQualifiedExpenses: () => {
        const state = get();
        const staffStore = useStaffStore.getState();
        
        // First recalculate all applied percentages
        const updatedActivities = state.selectedActivities.map(activity => {
          const updatedSubcomponents = activity.subcomponents.map(sub => {
            if (!sub.isSelected) return sub;
            const applied = (activity.practicePercentage * sub.frequencyPercentage * sub.timePercentage * sub.yearPercentage) / 1000000;
            const newAppliedPercentage = parseFloat(applied.toFixed(2));
            
            // Only update if the value has changed
            if (newAppliedPercentage === sub.appliedPercentage) {
              return sub;
            }
            
            return {
              ...sub,
              appliedPercentage: newAppliedPercentage
            };
          });
          
          // Only update if any subcomponents changed
          if (JSON.stringify(updatedSubcomponents) === JSON.stringify(activity.subcomponents)) {
            return activity;
          }
          
          return {
            ...activity,
            subcomponents: updatedSubcomponents
          };
        });
        
        // Only update if any activities changed
        if (JSON.stringify(updatedActivities) !== JSON.stringify(state.selectedActivities)) {
          set({ selectedActivities: updatedActivities });
          
          // Then recalculate wages
          if (staffStore.recalculateWages) {
            staffStore.recalculateWages();
          }
        }
      },
    }),
    {
      name: 'activities-storage',
      partialize: (state) => ({
        selectedCategoryId: state.selectedCategoryId,
        selectedAreaIds: state.selectedAreaIds,
        selectedFocusIds: state.selectedFocusIds,
        selectedActivities: state.selectedActivities
      })
    }
  )
);

export default useActivitiesStore;