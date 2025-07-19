import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Category, 
  Area, 
  Focus, 
  ResearchActivity, 
  ResearchSubcomponent,
  SelectedActivity,
  SelectedSubcomponent,
  Month
} from '../types';

interface ActivitiesState {
  categories: Category[];
  selectedCategoryId: string | null;
  selectedAreaIds: string[];
  selectedFocusIds: string[];
  selectedActivities: SelectedActivity[];
  availableActivities: ResearchActivity[];
  setCategories: (categories: Category[]) => void;
  selectCategory: (categoryId: string) => void;
  toggleAreaSelection: (areaId: string) => void;
  toggleFocusSelection: (focusId: string) => void;
  getAvailableAreas: () => Area[];
  getAvailableFocuses: () => Focus[];
  getAvailableActivities: () => ResearchActivity[];
  addSelectedActivity: (activity: SelectedActivity) => void;
  removeSelectedActivity: (activityId: string) => void;
  updateActivityPracticePercentage: (activityId: string, percentage: number) => void;
  updateSubcomponentFrequencyPercentage: (activityId: string, subcomponentId: string, percentage: number) => void;
  updateSubcomponentTimePercentage: (activityId: string, subcomponentId: string, percentage: number) => void;
  updateSubcomponentYearPercentage: (activityId: string, subcomponentId: string, percentage: number) => void;
  toggleSubcomponentSelection: (activityId: string, subcomponentId: string) => void;
  updateSubcomponentDescription: (activityId: string, subcomponentId: string, field: string, value: string) => void;
  addSubcomponentDocument: (activityId: string, subcomponentId: string, document: any) => void;
  removeSubcomponentDocument: (activityId: string, subcomponentId: string, documentId: string) => void;
  copyActivitiesToPreviousYears: (fromYear: number, toYear: number) => void;
  setAvailableActivities: (activities: ResearchActivity[]) => void;
  updateQualifiedExpenses: (activityId: string, expenses: any) => void;
  calculateAppliedPercentage: (activityId: string) => number;
}

const useActivitiesStore = create<ActivitiesState>()(
  persist(
    (set, get) => ({
      categories: [],
      selectedCategoryId: null,
      selectedAreaIds: [],
      selectedFocusIds: [],
      selectedActivities: [],
      availableActivities: [],

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

      getAvailableAreas: () => {
        const state = get();
        if (!state.selectedCategoryId) return [];
        const category = state.categories.find(c => c.id === state.selectedCategoryId);
        return category?.areas || [];
      },

      getAvailableFocuses: () => {
        const state = get();
        if (!state.selectedCategoryId || state.selectedAreaIds.length === 0) return [];
        const category = state.categories.find(c => c.id === state.selectedCategoryId);
        return category?.areas
          .filter(area => state.selectedAreaIds.includes(area.id))
          .flatMap(area => area.focuses) || [];
      },

      getAvailableActivities: () => {
        const state = get();
        if (!state.selectedCategoryId || state.selectedAreaIds.length === 0 || state.selectedFocusIds.length === 0) {
          return [];
        }
        return state.availableActivities.filter(activity => 
          state.selectedFocusIds.includes(activity.focusId)
        );
      },

      addSelectedActivity: (activity) => set((state) => ({
        selectedActivities: [...state.selectedActivities, activity]
      })),

      removeSelectedActivity: (activityId) => set((state) => ({
        selectedActivities: state.selectedActivities.filter(a => a.id !== activityId)
      })),

      updateActivityPracticePercentage: (activityId, percentage) => set((state) => ({
        selectedActivities: state.selectedActivities.map(activity =>
          activity.id === activityId
            ? { ...activity, practicePercentage: percentage }
            : activity
        )
      })),

      updateSubcomponentFrequencyPercentage: (activityId, subcomponentId, percentage) => set((state) => ({
        selectedActivities: state.selectedActivities.map(activity =>
          activity.id === activityId
            ? {
                ...activity,
                subcomponents: activity.subcomponents.map(sub =>
                  sub.id === subcomponentId
                    ? { ...sub, frequencyPercentage: percentage }
                    : sub
                )
              }
            : activity
        )
      })),

      updateSubcomponentTimePercentage: (activityId, subcomponentId, percentage) => set((state) => ({
        selectedActivities: state.selectedActivities.map(activity =>
          activity.id === activityId
            ? {
                ...activity,
                subcomponents: activity.subcomponents.map(sub =>
                  sub.id === subcomponentId
                    ? { ...sub, timePercentage: percentage }
                    : sub
                )
              }
            : activity
        )
      })),

      updateSubcomponentYearPercentage: (activityId, subcomponentId, percentage) => set((state) => ({
        selectedActivities: state.selectedActivities.map(activity =>
          activity.id === activityId
            ? {
                ...activity,
                subcomponents: activity.subcomponents.map(sub =>
                  sub.id === subcomponentId
                    ? { ...sub, yearPercentage: percentage }
                    : sub
                )
              }
            : activity
        )
      })),

      toggleSubcomponentSelection: (activityId, subcomponentId) => set((state) => ({
        selectedActivities: state.selectedActivities.map(activity =>
          activity.id === activityId
            ? {
                ...activity,
                subcomponents: activity.subcomponents.map(sub =>
                  sub.id === subcomponentId
                    ? { ...sub, isSelected: !sub.isSelected }
                    : sub
                )
              }
            : activity
        )
      })),

      updateSubcomponentDescription: (activityId, subcomponentId, field, value) => set((state) => ({
        selectedActivities: state.selectedActivities.map(activity =>
          activity.id === activityId
            ? {
                ...activity,
                subcomponents: activity.subcomponents.map(sub =>
                  sub.id === subcomponentId
                    ? { ...sub, [field]: value }
                    : sub
                )
              }
            : activity
        )
      })),

      addSubcomponentDocument: (activityId, subcomponentId, document) => set((state) => ({
        selectedActivities: state.selectedActivities.map(activity =>
          activity.id === activityId
            ? {
                ...activity,
                subcomponents: activity.subcomponents.map(sub =>
                  sub.id === subcomponentId
                    ? { ...sub, documents: [...(sub.documents || []), document] }
                    : sub
                )
              }
            : activity
        )
      })),

      removeSubcomponentDocument: (activityId, subcomponentId, documentId) => set((state) => ({
        selectedActivities: state.selectedActivities.map(activity =>
          activity.id === activityId
            ? {
                ...activity,
                subcomponents: activity.subcomponents.map(sub =>
                  sub.id === subcomponentId
                    ? { ...sub, documents: (sub.documents || []).filter(d => d.id !== documentId) }
                    : sub
                )
              }
            : activity
        )
      })),

      copyActivitiesToPreviousYears: (fromYear, toYear) => set((state) => ({
        selectedActivities: [
          ...state.selectedActivities,
          ...state.selectedActivities
            .filter(a => a.year === fromYear)
            .map(a => ({
              ...a,
              id: `${a.id}-${toYear}`,
              year: toYear,
              subcomponents: a.subcomponents.map(sub => ({
                ...sub,
                id: `${sub.id}-${toYear}`
              }))
            }))
        ]
      })),

      setAvailableActivities: (activities) => set({ availableActivities: activities }),

      updateQualifiedExpenses: (activityId, expenses) => set((state) => ({
        selectedActivities: state.selectedActivities.map(activity =>
          activity.id === activityId
            ? { ...activity, qualifiedExpenses: expenses }
            : activity
        )
      })),

      calculateAppliedPercentage: (activityId) => {
        const state = get();
        const activity = state.selectedActivities.find(a => a.id === activityId);
        if (!activity) return 0;

        const subcomponentPercentages = activity.subcomponents
          .filter(sub => sub.isSelected)
          .map(sub => {
            const practice = activity.practicePercentage || 0;
            const frequency = sub.frequencyPercentage || 0;
            const time = sub.timePercentage || 0;
            const year = sub.yearPercentage || 0;
            return (practice / 100) * (frequency / 100) * (time / 100) * (year / 100) * 100;
          });

        return subcomponentPercentages.reduce((sum, p) => sum + p, 0);
      }
    }),
    {
      name: 'activities-storage'
    }
  )
);

export default useActivitiesStore; 