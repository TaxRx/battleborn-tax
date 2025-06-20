import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Fee {
  transactionFee: number;
  serviceFee: number;
}

interface AdminStore {
  fees: Fee;
  setFees: (fees: Fee) => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      fees: {
        transactionFee: 2.5,
        serviceFee: 1.00
      },
      setFees: (fees) => set({ fees })
    }),
    {
      name: 'admin-storage'
    }
  )
);