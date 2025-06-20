import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BusinessInfoFormData, BusinessState, HistoricalData } from '../types';
import { v4 as uuidv4 } from 'uuid';

const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      businessName: '',
      businessDBA: '',
      ein: '',
      yearStarted: new Date().getFullYear(),
      state: '',
      address: '',
      city: '',
      zipCode: '',
      phone: '',
      entityType: '',
      category: '',
      area: '',
      focus: '',
      naicsCode: '',
      practiceType: '',
      specialty: '',
      website: '',
      contactName: '',
      contactEmail: '',
      historicalData: {},
      currentYear: new Date().getFullYear(),
      availableYears: [],
      owners: [],
      
      setBusinessInfo: (info: BusinessInfoFormData) => set((state) => ({
        ...state,
        ...info
      })),
      
      setCurrentYear: (year: number) => set({ currentYear: year }),
      
      generateAvailableYears: () => set((state) => {
        const currentYear = new Date().getFullYear();
        const years = Array.from(
          { length: currentYear - state.yearStarted + 1 },
          (_, i) => state.yearStarted + i
        );
        return { availableYears: years };
      }),
      
      updateName: (name: string) => set({ businessName: name }),
      updateEIN: (ein: string) => set({ ein }),
      updateYearStarted: (year: number) => set({ yearStarted: year }),
      updateState: (state: string) => set({ state }),
      updateAddress: (address: string) => set({ address }),
      updateContactName: (name: string) => set({ contactName: name }),
      updateContactEmail: (email: string) => set({ contactEmail: email }),
      updatePhone: (phone: string) => set({ phone }),
      updateHistoricalData: (data: HistoricalData) => set({ historicalData: data }),
      setQreTotal: (year: number, amount: number) => set((state) => ({
        historicalData: {
          ...state.historicalData,
          [year]: {
            ...state.historicalData[year],
            qre: amount
          }
        }
      })),
      addOwner: (owner: { name: string; ownershipPercentage: number; year: number }) => set((state) => ({
        ...state,
        owners: [...state.owners, { ...owner, id: uuidv4() }]
      })),
      removeOwner: (ownerId: string) => set((state) => ({
        ...state,
        owners: state.owners.filter(owner => owner.id !== ownerId)
      })),
      updateOwner: (ownerId: string, owner: { name: string; ownershipPercentage: number; year: number }) => set((state) => ({
        ...state,
        owners: state.owners.map(o => 
          o.id === ownerId ? { ...o, ...owner } : o
        )
      }))
    }),
    {
      name: 'business-storage',
      partialize: (state) => ({
        businessName: state.businessName,
        businessDBA: state.businessDBA,
        ein: state.ein,
        yearStarted: state.yearStarted,
        state: state.state,
        address: state.address,
        city: state.city,
        zipCode: state.zipCode,
        phone: state.phone,
        entityType: state.entityType,
        category: state.category,
        area: state.area,
        focus: state.focus,
        naicsCode: state.naicsCode,
        practiceType: state.practiceType,
        specialty: state.specialty,
        website: state.website,
        contactName: state.contactName,
        contactEmail: state.contactEmail,
        currentYear: state.currentYear,
        availableYears: state.availableYears,
        historicalData: state.historicalData,
        owners: state.owners
      })
    }
  )
);

export default useBusinessStore;