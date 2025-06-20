import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CreditStore {
  qualifiedExpenses: number;
  setQualifiedExpenses: (amount: number) => void;
  calculateCredit: () => number;
}

const useCreditStore = create<CreditStore>()(
  persist(
    (set, get) => ({
      qualifiedExpenses: 0,
      
      setQualifiedExpenses: (amount) => set({ qualifiedExpenses: amount }),
      
      calculateCredit: () => {
        const { qualifiedExpenses } = get();
        const baseCredit = qualifiedExpenses * 0.15; // 15% of qualified expenses
        return Math.max(0, baseCredit); // Ensure credit is never negative
      },
    }),
    {
      name: 'credit-storage',
      partialize: (state) => ({
        qualifiedExpenses: state.qualifiedExpenses,
      }),
    }
  )
);

export default useCreditStore; 