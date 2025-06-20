import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AugustaState {
  partiesInfo: any | null;
  rentalInfo: any | null;
  datesInfo: any | null;
  setPartiesInfo: (data: any) => void;
  setRentalInfo: (data: any) => void;
  setDatesInfo: (data: any) => void;
  reset: () => void;
}

export const useAugustaStore = create<AugustaState>()(
  persist(
    (set) => ({
      partiesInfo: null,
      rentalInfo: null,
      datesInfo: null,
      setPartiesInfo: (data) => set({ partiesInfo: data }),
      setRentalInfo: (data) => set({ rentalInfo: data }),
      setDatesInfo: (data) => set({ datesInfo: data }),
      reset: () => set({ 
        partiesInfo: null, 
        rentalInfo: null,
        datesInfo: null 
      }),
    }),
    { 
      name: 'augusta-wizard',
      partialize: (state) => ({
        partiesInfo: state.partiesInfo,
        rentalInfo: state.rentalInfo,
        datesInfo: state.datesInfo
      })
    }
  )
);