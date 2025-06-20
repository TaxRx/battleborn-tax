import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Employee, EmployeeRole } from '../types';

interface StaffState {
  employees: { [id: string]: Employee };
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  getEmployeesByYear: (year: number) => Employee[];
  updateEmployeeActivityPercentage: (
    employeeId: string,
    year: number,
    activityId: string,
    percentage: number
  ) => void;
  updateEmployeeSubcomponentPercentage: (
    employeeId: string,
    year: number,
    activityId: string,
    subcomponentId: string,
    percentage: number
  ) => void;
  toggleEmployeeActivitySelection: (
    employeeId: string,
    year: number,
    activityId: string
  ) => void;
  toggleEmployeeSubcomponentSelection: (
    employeeId: string,
    year: number,
    activityId: string,
    subcomponentId: string
  ) => void;
  updateEmployeeSubcomponentRoleDescription: (
    employeeId: string,
    year: number,
    activityId: string,
    subcomponentId: string,
    roleDescription: string
  ) => void;
  calculateEmployeeAllocation: (employeeId: string, year: number) => number;
}

const useStaffStore = create<StaffState>()(
  persist(
    (set, get) => ({
      employees: {},

      addEmployee: (employee) => set((state) => ({
        employees: {
          ...state.employees,
          [employee.id]: employee
        }
      })),

      updateEmployee: (id, updates) => set((state) => ({
        employees: {
          ...state.employees,
          [id]: {
            ...state.employees[id],
            ...updates
          }
        }
      })),

      removeEmployee: (id) => set((state) => {
        const { [id]: removed, ...rest } = state.employees;
        return { employees: rest };
      }),

      getEmployeesByYear: (year) => {
        const state = get();
        return Object.values(state.employees).filter(employee => 
          Object.keys(employee.yearlyActivities).includes(year.toString())
        );
      },

      updateEmployeeActivityPercentage: (employeeId, year, activityId, percentage) => set((state) => ({
        employees: {
          ...state.employees,
          [employeeId]: {
            ...state.employees[employeeId],
            yearlyActivities: {
              ...state.employees[employeeId].yearlyActivities,
              [year]: {
                ...state.employees[employeeId].yearlyActivities[year],
                [activityId]: {
                  ...state.employees[employeeId].yearlyActivities[year][activityId],
                  percentage
                }
              }
            }
          }
        }
      })),

      updateEmployeeSubcomponentPercentage: (employeeId, year, activityId, subcomponentId, percentage) => set((state) => ({
        employees: {
          ...state.employees,
          [employeeId]: {
            ...state.employees[employeeId],
            yearlyActivities: {
              ...state.employees[employeeId].yearlyActivities,
              [year]: {
                ...state.employees[employeeId].yearlyActivities[year],
                [activityId]: {
                  ...state.employees[employeeId].yearlyActivities[year][activityId],
                  subcomponents: {
                    ...state.employees[employeeId].yearlyActivities[year][activityId].subcomponents,
                    [subcomponentId]: {
                      ...state.employees[employeeId].yearlyActivities[year][activityId].subcomponents[subcomponentId],
                      percentage
                    }
                  }
                }
              }
            }
          }
        }
      })),

      toggleEmployeeActivitySelection: (employeeId, year, activityId) => set((state) => ({
        employees: {
          ...state.employees,
          [employeeId]: {
            ...state.employees[employeeId],
            yearlyActivities: {
              ...state.employees[employeeId].yearlyActivities,
              [year]: {
                ...state.employees[employeeId].yearlyActivities[year],
                [activityId]: {
                  ...state.employees[employeeId].yearlyActivities[year][activityId],
                  isSelected: !state.employees[employeeId].yearlyActivities[year][activityId].isSelected
                }
              }
            }
          }
        }
      })),

      toggleEmployeeSubcomponentSelection: (employeeId, year, activityId, subcomponentId) => set((state) => ({
        employees: {
          ...state.employees,
          [employeeId]: {
            ...state.employees[employeeId],
            yearlyActivities: {
              ...state.employees[employeeId].yearlyActivities,
              [year]: {
                ...state.employees[employeeId].yearlyActivities[year],
                [activityId]: {
                  ...state.employees[employeeId].yearlyActivities[year][activityId],
                  subcomponents: {
                    ...state.employees[employeeId].yearlyActivities[year][activityId].subcomponents,
                    [subcomponentId]: {
                      ...state.employees[employeeId].yearlyActivities[year][activityId].subcomponents[subcomponentId],
                      isSelected: !state.employees[employeeId].yearlyActivities[year][activityId].subcomponents[subcomponentId].isSelected
                    }
                  }
                }
              }
            }
          }
        }
      })),

      updateEmployeeSubcomponentRoleDescription: (employeeId, year, activityId, subcomponentId, roleDescription) => set((state) => ({
        employees: {
          ...state.employees,
          [employeeId]: {
            ...state.employees[employeeId],
            yearlyActivities: {
              ...state.employees[employeeId].yearlyActivities,
              [year]: {
                ...state.employees[employeeId].yearlyActivities[year],
                [activityId]: {
                  ...state.employees[employeeId].yearlyActivities[year][activityId],
                  subcomponents: {
                    ...state.employees[employeeId].yearlyActivities[year][activityId].subcomponents,
                    [subcomponentId]: {
                      ...state.employees[employeeId].yearlyActivities[year][activityId].subcomponents[subcomponentId],
                      roleDescription
                    }
                  }
                }
              }
            }
          }
        }
      })),

      calculateEmployeeAllocation: (employeeId, year) => {
        const state = get();
        const employee = state.employees[employeeId];
        if (!employee) return 0;

        const yearActivities = employee.yearlyActivities[year] || {};
        let totalAllocation = 0;

        Object.values(yearActivities).forEach(activity => {
          if (activity?.isSelected) {
            Object.values(activity.subcomponents || {}).forEach(subcomponent => {
              if (subcomponent?.isSelected) {
                totalAllocation += subcomponent.percentage || 0;
              }
            });
          }
        });

        return Number(totalAllocation.toFixed(2));
      }
    }),
    {
      name: 'staff-storage'
    }
  )
);

export default useStaffStore; 