import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BusinessState {
  yearStarted: number;
  availableYears: number[];
  generateAvailableYears: () => void;
  setYearStarted: (year: number) => void;
  addYear: (year: number) => void;
  removeYear: (year: number) => void;
}

const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      yearStarted: new Date().getFullYear(),
      availableYears: [],

      generateAvailableYears: () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = get().yearStarted; year <= currentYear; year++) {
          years.push(year);
        }
        set({ availableYears: years });
      },

      setYearStarted: (year) => {
        set({ yearStarted: year });
        get().generateAvailableYears();
      },

      addYear: (year) => set((state) => ({
        availableYears: [...state.availableYears, year].sort((a, b) => a - b)
      })),

      removeYear: (year) => set((state) => ({
        availableYears: state.availableYears.filter(y => y !== year)
      }))
    }),
    {
      name: 'business-storage'
    }
  )
);

export default useBusinessStore; 