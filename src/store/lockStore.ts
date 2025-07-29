import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LockState {
  // Lock states for different sections
  isResearchActivitiesLocked: boolean;
  isExpenseManagementLocked: boolean;
  isResearchDesignLocked: boolean;
  
  // Metadata
  lockedBy: string | null;
  lockedAt: string | null;
  lockReason: string | null;
  
  // Actions
  lockResearchActivities: (reason?: string) => void;
  unlockResearchActivities: () => void;
  
  lockExpenseManagement: (reason?: string) => void;
  unlockExpenseManagement: () => void;
  
  lockResearchDesign: (reason?: string) => void;
  unlockResearchDesign: () => void;
  
  lockAll: (reason?: string) => void;
  unlockAll: () => void;
  
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
      }
    }),
    {
      name: 'rd-lock-storage',
      partialize: (state) => ({
        isResearchActivitiesLocked: state.isResearchActivitiesLocked,
        isExpenseManagementLocked: state.isExpenseManagementLocked,
        isResearchDesignLocked: state.isResearchDesignLocked,
        lockedBy: state.lockedBy,
        lockedAt: state.lockedAt,
        lockReason: state.lockReason
      })
    }
  )
);

export default useLockStore; 