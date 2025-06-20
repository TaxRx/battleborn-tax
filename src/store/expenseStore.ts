import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ContractorExpense, SupplyExpense } from '../types';

interface ExpenseState {
  contractorExpenses: { [id: string]: ContractorExpense };
  supplyExpenses: { [id: string]: SupplyExpense };
  addContractorExpense: (expense: ContractorExpense) => void;
  updateContractorExpense: (id: string, updates: Partial<ContractorExpense>) => void;
  removeContractorExpense: (id: string) => void;
  addSupplyExpense: (expense: SupplyExpense) => void;
  updateSupplyExpense: (id: string, updates: Partial<SupplyExpense>) => void;
  removeSupplyExpense: (id: string) => void;
  getContractorExpensesByYear: (year: number) => ContractorExpense[];
  getSupplyExpensesByYear: (year: number) => SupplyExpense[];
  getContractorExpensesByActivity: (activityId: string) => ContractorExpense[];
  getSupplyExpensesByActivity: (activityId: string) => SupplyExpense[];
  getContractorExpensesBySubcomponent: (subcomponentId: string) => ContractorExpense[];
  getSupplyExpensesBySubcomponent: (subcomponentId: string) => SupplyExpense[];
}

const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      contractorExpenses: {},
      supplyExpenses: {},

      addContractorExpense: (expense) => set((state) => ({
        contractorExpenses: {
          ...state.contractorExpenses,
          [expense.id]: expense
        }
      })),

      updateContractorExpense: (id, updates) => set((state) => ({
        contractorExpenses: {
          ...state.contractorExpenses,
          [id]: {
            ...state.contractorExpenses[id],
            ...updates
          }
        }
      })),

      removeContractorExpense: (id) => set((state) => {
        const { [id]: removed, ...rest } = state.contractorExpenses;
        return { contractorExpenses: rest };
      }),

      addSupplyExpense: (expense) => set((state) => ({
        supplyExpenses: {
          ...state.supplyExpenses,
          [expense.id]: expense
        }
      })),

      updateSupplyExpense: (id, updates) => set((state) => ({
        supplyExpenses: {
          ...state.supplyExpenses,
          [id]: {
            ...state.supplyExpenses[id],
            ...updates
          }
        }
      })),

      removeSupplyExpense: (id) => set((state) => {
        const { [id]: removed, ...rest } = state.supplyExpenses;
        return { supplyExpenses: rest };
      }),

      getContractorExpensesByYear: (year) => {
        const state = get();
        return Object.values(state.contractorExpenses).filter(expense => expense.year === year);
      },

      getSupplyExpensesByYear: (year) => {
        const state = get();
        return Object.values(state.supplyExpenses).filter(expense => expense.year === year);
      },

      getContractorExpensesByActivity: (activityId) => {
        const state = get();
        return Object.values(state.contractorExpenses).filter(expense => expense.activityId === activityId);
      },

      getSupplyExpensesByActivity: (activityId) => {
        const state = get();
        return Object.values(state.supplyExpenses).filter(expense => expense.activityId === activityId);
      },

      getContractorExpensesBySubcomponent: (subcomponentId) => {
        const state = get();
        return Object.values(state.contractorExpenses).filter(expense => expense.subcomponentId === subcomponentId);
      },

      getSupplyExpensesBySubcomponent: (subcomponentId) => {
        const state = get();
        return Object.values(state.supplyExpenses).filter(expense => expense.subcomponentId === subcomponentId);
      }
    }),
    {
      name: 'expense-storage'
    }
  )
);

export default useExpenseStore; 