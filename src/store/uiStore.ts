import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      setOnboardingComplete: (v) => set({ onboardingComplete: v }),
    }),
    { name: 'ui-storage' }
  )
); 