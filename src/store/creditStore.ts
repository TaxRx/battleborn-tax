import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CreditState {
  creditAmount: number;
  setCreditAmount: (amount: number) => void;
  calculateCredit: (
    qualifiedExpenses: number,
    averageGrossReceipts: number
  ) => number;
}

const useCreditStore = create<CreditState>()(
  persist(
    (set) => ({
      creditAmount: 0,

      setCreditAmount: (amount) => set({ creditAmount: amount }),

      calculateCredit: (qualifiedExpenses, averageGrossReceipts) => {
        // Simplified credit calculation based on Section 41
        // This is a basic implementation - actual calculation may be more complex
        const baseAmount = Math.max(
          0,
          averageGrossReceipts * 0.5 - qualifiedExpenses
        );
        const incrementalExpenses = Math.max(0, qualifiedExpenses - baseAmount);
        const creditRate = 0.14; // 14% credit rate for qualified research expenses
        const creditAmount = incrementalExpenses * creditRate;

        set({ creditAmount });
        return creditAmount;
      }
    }),
    {
      name: 'credit-storage'
    }
  )
);

export default useCreditStore; 