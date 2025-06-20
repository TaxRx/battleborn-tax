import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ContractorExpense, SupplyExpense } from '../types';

interface ExpenseStore {
  contractorExpenses: { [id: string]: ContractorExpense };
  supplyExpenses: { [id: string]: SupplyExpense };
  addContractorExpense: (expense: Omit<ContractorExpense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContractorExpense: (id: string, expense: Partial<ContractorExpense>) => void;
  removeContractorExpense: (id: string) => void;
  addSupplyExpense: (expense: Omit<SupplyExpense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupplyExpense: (id: string, expense: Partial<SupplyExpense>) => void;
  removeSupplyExpense: (id: string) => void;
}

const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set) => ({
      contractorExpenses: {},
      supplyExpenses: {},

      addContractorExpense: (expense) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        set((state) => ({
          contractorExpenses: {
            ...state.contractorExpenses,
            [id]: {
              ...expense,
              id,
              createdAt: now,
              updatedAt: now
            }
          }
        }));
      },

      updateContractorExpense: (id, expense) => {
        set((state) => ({
          contractorExpenses: {
            ...state.contractorExpenses,
            [id]: {
              ...state.contractorExpenses[id],
              ...expense,
              updatedAt: new Date().toISOString()
            }
          }
        }));
      },

      removeContractorExpense: (id) => {
        set((state) => {
          const { [id]: _, ...remaining } = state.contractorExpenses;
          return { contractorExpenses: remaining };
        });
      },

      addSupplyExpense: (expense) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        set((state) => ({
          supplyExpenses: {
            ...state.supplyExpenses,
            [id]: {
              ...expense,
              id,
              createdAt: now,
              updatedAt: now
            }
          }
        }));
      },

      updateSupplyExpense: (id, expense) => {
        set((state) => ({
          supplyExpenses: {
            ...state.supplyExpenses,
            [id]: {
              ...state.supplyExpenses[id],
              ...expense,
              updatedAt: new Date().toISOString()
            }
          }
        }));
      },

      removeSupplyExpense: (id) => {
        set((state) => {
          const { [id]: _, ...remaining } = state.supplyExpenses;
          return { supplyExpenses: remaining };
        });
      }
    }),
    {
      name: 'expense-storage',
      partialize: (state) => ({
        contractorExpenses: state.contractorExpenses,
        supplyExpenses: state.supplyExpenses
      })
    }
  )
);

export default useExpenseStore; 