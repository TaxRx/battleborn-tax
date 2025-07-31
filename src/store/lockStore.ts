import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StepCompletionStatus {
  businessSetup: boolean;
  researchActivities: boolean;
  researchDesign: boolean;
  calculations: boolean;
  qres: boolean;
}

interface LockState {
  // Lock states for different sections (existing)
  isResearchActivitiesLocked: boolean;
  isExpenseManagementLocked: boolean;
  isResearchDesignLocked: boolean;
  
  // Step completion states (new)
  stepCompletion: { [businessYearId: string]: StepCompletionStatus };
  
  // Metadata
  lockedBy: string | null;
  lockedAt: string | null;
  lockReason: string | null;
  
  // Actions (existing)
  lockResearchActivities: (reason?: string) => void;
  unlockResearchActivities: () => void;
  
  lockExpenseManagement: (reason?: string) => void;
  unlockExpenseManagement: () => void;
  
  lockResearchDesign: (reason?: string) => void;
  unlockResearchDesign: () => void;
  
  lockAll: (reason?: string) => void;
  unlockAll: () => void;
  
  // Step completion actions (new)
  setStepCompletion: (businessYearId: string, step: keyof StepCompletionStatus, completed: boolean) => void;
  getStepCompletion: (businessYearId: string, step: keyof StepCompletionStatus) => boolean;
  getCompletionPercentage: (businessYearId: string) => number;
  getCompletedSteps: (businessYearId: string) => string[];
  isStepLocked: (businessYearId: string, step: keyof StepCompletionStatus) => boolean;
  
  // Utility functions
  isAnyLocked: () => boolean;
  getLockedSections: () => string[];
}

const useLockStore = create<LockState>()(
  persist(
    (set, get) => ({
      // Initial state
      isResearchActivitiesLocked: false,
      isExpenseManagementLocked: false,
      isResearchDesignLocked: false,
      stepCompletion: {},
      lockedBy: null,
      lockedAt: null,
      lockReason: null,

      // Research Activities lock actions
      lockResearchActivities: (reason = 'Data protection') => {
        set({
          isResearchActivitiesLocked: true,
          lockedBy: 'Admin',
          lockedAt: new Date().toISOString(),
          lockReason: reason
        });
      },
      
      unlockResearchActivities: () => {
        set({
          isResearchActivitiesLocked: false,
          lockedBy: null,
          lockedAt: null,
          lockReason: null
        });
      },

      // Expense Management lock actions
      lockExpenseManagement: (reason = 'Data protection') => {
        set({
          isExpenseManagementLocked: true,
          lockedBy: 'Admin',
          lockedAt: new Date().toISOString(),
          lockReason: reason
        });
      },
      
      unlockExpenseManagement: () => {
        set({
          isExpenseManagementLocked: false,
          lockedBy: null,
          lockedAt: null,
          lockReason: null
        });
      },

      // Research Design lock actions
      lockResearchDesign: (reason = 'Data protection') => {
        set({
          isResearchDesignLocked: true,
          lockedBy: 'Admin',
          lockedAt: new Date().toISOString(),
          lockReason: reason
        });
      },
      
      unlockResearchDesign: () => {
        set({
          isResearchDesignLocked: false,
          lockedBy: null,
          lockedAt: null,
          lockReason: null
        });
      },

      // Lock all sections
      lockAll: (reason = 'Data protection - All sections locked') => {
        const timestamp = new Date().toISOString();
        set({
          isResearchActivitiesLocked: true,
          isExpenseManagementLocked: true,
          isResearchDesignLocked: true,
          lockedBy: 'Admin',
          lockedAt: timestamp,
          lockReason: reason
        });
      },

      // Unlock all sections
      unlockAll: () => {
        set({
          isResearchActivitiesLocked: false,
          isExpenseManagementLocked: false,
          isResearchDesignLocked: false,
          lockedBy: null,
          lockedAt: null,
          lockReason: null
        });
      },

      // Utility functions
      isAnyLocked: () => {
        const state = get();
        return state.isResearchActivitiesLocked || 
               state.isExpenseManagementLocked || 
               state.isResearchDesignLocked;
      },

      getLockedSections: () => {
        const state = get();
        const locked: string[] = [];
        
        if (state.isResearchActivitiesLocked) locked.push('Research Activities');
        if (state.isExpenseManagementLocked) locked.push('Expense Management');
        if (state.isResearchDesignLocked) locked.push('Research Design');
        
        return locked;
      },

      // Step completion methods
      setStepCompletion: (businessYearId: string, step: keyof StepCompletionStatus, completed: boolean) => {
        set((state) => {
          const currentCompletion = state.stepCompletion[businessYearId] || {
            businessSetup: false,
            researchActivities: false,
            researchDesign: false,
            calculations: false,
            qres: false
          };

          return {
            stepCompletion: {
              ...state.stepCompletion,
              [businessYearId]: {
                ...currentCompletion,
                [step]: completed
              }
            }
          };
        });
      },

      getStepCompletion: (businessYearId: string, step: keyof StepCompletionStatus) => {
        const state = get();
        return state.stepCompletion[businessYearId]?.[step] || false;
      },

      getCompletionPercentage: (businessYearId: string) => {
        const state = get();
        const completion = state.stepCompletion[businessYearId];
        if (!completion) return 0;

        const steps = Object.values(completion);
        const completedCount = steps.filter(Boolean).length;
        return Math.round((completedCount / steps.length) * 100);
      },

      getCompletedSteps: (businessYearId: string) => {
        const state = get();
        const completion = state.stepCompletion[businessYearId];
        if (!completion) return [];

        const stepNames = {
          businessSetup: 'Business Setup',
          researchActivities: 'Research Activities', 
          researchDesign: 'Research Design',
          calculations: 'Calculations',
          qres: 'QREs'
        };

        return Object.entries(completion)
          .filter(([_, completed]) => completed)
          .map(([step]) => stepNames[step as keyof StepCompletionStatus]);
      },

      isStepLocked: (businessYearId: string, step: keyof StepCompletionStatus) => {
        const state = get();
        return state.stepCompletion[businessYearId]?.[step] || false;
      }
    }),
    {
      name: 'rd-lock-storage',
      partialize: (state) => ({
        isResearchActivitiesLocked: state.isResearchActivitiesLocked,
        isExpenseManagementLocked: state.isExpenseManagementLocked,
        isResearchDesignLocked: state.isResearchDesignLocked,
        stepCompletion: state.stepCompletion,
        lockedBy: state.lockedBy,
        lockedAt: state.lockedAt,
        lockReason: state.lockReason
      })
    }
  )
);

export default useLockStore; 