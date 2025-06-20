import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Employee, EmployeeRole, Subcomponent } from '../types/staff';
import useActivitiesStore from './activitiesStore';
import useBusinessStore from './businessStore';

interface SelectedSubcomponent {
  id: string;
  name: string;
  defaultRoleDescription?: string;
  roleDescription?: string;
  percentage: number;
}

interface Activity {
  id: string;
  name: string;
  subcomponents: SelectedSubcomponent[];
  isExpanded?: boolean;
}

interface SubcomponentData {
  percentage: number;
  isSelected: boolean;
  roleDescription?: string;
}

interface ActivityData {
  percentage: number;
  isSelected: boolean;
  subcomponents: {
    [subcomponentId: string]: SubcomponentData;
  };
}

interface YearlyActivity {
  percentage: number;
  isSelected: boolean;
  subcomponents: {
    [key: string]: {
      percentage: number;
      isSelected: boolean;
      roleDescription?: string;
    };
  };
}

interface YearlyActivities {
  [year: string]: {
    [activityId: string]: YearlyActivity;
  };
}

interface StoreState {
  employees: Employee[];
  activities: Activity[];
  addEmployee: (employee: Omit<Employee, 'id' | 'yearlyActivities'>) => void;
  removeEmployee: (employeeId: string) => void;
  updateEmployeeRole: (employeeId: string, role: EmployeeRole) => void;
  updateEmployeeWage: (employeeId: string, wage: number) => void;
  updateActivityPercentage: (employeeId: string, year: number, activityId: string, percentage: number) => void;
  updateSubcomponentPercentage: (
    employeeId: string, 
    year: number,
    activityId: string, 
    subcomponentId: string, 
    percentage: number
  ) => void;
  updateSubcomponentRoleDescription: (
    employeeId: string,
    year: number,
    activityId: string,
    subcomponentId: string,
    description: string
  ) => void;
  toggleActivityExpansion: (activityId: string) => void;
  copyAllocationsToYear: (fromYear: number, toYear: number) => void;
  toggleEmployeeActivitySelection: (employeeId: string, year: number, activityId: string) => void;
  toggleEmployeeSubcomponentSelection: (employeeId: string, year: number, activityId: string, subcomponentId: string) => void;
  updateEmployees: (employees: Employee[]) => void;
  recalculateWages: () => void;
  calculateTotalQualifiedWages: () => number;
}

// Add this helper function before the store creation
const getRoleDescription = (subcomponent: any, role: EmployeeRole) => {
  switch (role) {
    case 'Research Leader':
      return subcomponent.researchLeaderRole || '';
    case 'Clinician':
      return subcomponent.clinicianRole || '';
    case 'Midlevel':
      return subcomponent.midlevelRole || '';
    case 'Clinical Assistant':
      return subcomponent.clinicalAssistantRole || '';
    default:
      return subcomponent.description || '';
  }
};

const useStaffStore = create<StoreState>()(
  persist(
    (set, get) => ({
      employees: [],
      activities: [],

      addEmployee: (employee: { name: string; role: EmployeeRole; isBusinessOwner: boolean; annualWage: number }) => {
        const activitiesStore = useActivitiesStore.getState();
        const businessStore = useBusinessStore.getState();
        const availableYears = businessStore.availableYears;

        // Initialize activities for all available years
        const yearlyActivities = availableYears.reduce((acc, year) => {
          // Get activities for this year
          const yearActivities = activitiesStore.selectedActivities
            .filter(activity => activity.year === year)
            .reduce((actAcc, activity) => {
              // Build subcomponents with preloaded roleDescription
              const subcomponents = activity.subcomponents.reduce((subAcc, subcomponent) => ({
                ...subAcc,
                [subcomponent.id]: {
                  percentage: subcomponent.appliedPercentage ?? 0,
                  isSelected: true,
                  roleDescription: getRoleDescription(subcomponent, employee.role)
                }
              }), {});
              // Calculate total percentage for the activity
              const totalPercentage = Object.values(subcomponents)
                .filter((sub: any) => sub.isSelected)
                .reduce((sum: number, sub: any) => sum + (sub.percentage || 0), 0);
              return {
                ...actAcc,
                [activity.id]: {
                  percentage: totalPercentage,
                  isSelected: true,
                  subcomponents
                }
              };
            }, {});

          return {
            ...acc,
            [year]: yearActivities
          };
        }, {});

        const newEmployee: Employee = {
          id: uuidv4(),
          name: employee.name,
          role: employee.role,
          isBusinessOwner: employee.isBusinessOwner,
          annualWage: employee.annualWage,
          yearlyActivities
        };

        set((state) => ({
          employees: [...state.employees, newEmployee]
        }));
      },

      removeEmployee: (employeeId: string) => set((state) => ({
        employees: state.employees.filter((emp) => emp.id !== employeeId),
      })),

      updateEmployeeRole: (employeeId: string, role: EmployeeRole) => set((state) => ({
        employees: state.employees.map((emp) =>
          emp.id === employeeId ? { ...emp, role } : emp
        ),
      })),

      updateEmployeeWage: (employeeId: string, wage: number) => set((state) => ({
        employees: state.employees.map((emp) =>
          emp.id === employeeId ? { ...emp, annualWage: wage } : emp
        ),
      })),

      updateActivityPercentage: (employeeId: string, year: number, activityId: string, percentage: number) => {
        const state = get();
        const employee = state.employees.find(emp => emp.id === employeeId);
        if (!employee) return;

        const activity = employee.yearlyActivities[year]?.[activityId];
        if (!activity) return;

        // Pro rata: distribute the new total equally across all subcomponents
        const subcomponentIds = Object.keys(activity.subcomponents);
        const numSubcomponents = subcomponentIds.length;
        const evenShare = numSubcomponents > 0 ? Math.floor(percentage / numSubcomponents) : 0;
        let remainder = percentage - evenShare * numSubcomponents;

        const updatedSubcomponents = subcomponentIds.reduce((acc, subId, idx) => ({
          ...acc,
          [subId]: {
            ...activity.subcomponents[subId],
            percentage: evenShare + (remainder-- > 0 ? 1 : 0)
          }
        }), {});

        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === employeeId
              ? {
                  ...emp,
                  yearlyActivities: {
                    ...emp.yearlyActivities,
                    [year]: {
                      ...emp.yearlyActivities[year],
                      [activityId]: {
                        ...emp.yearlyActivities[year][activityId],
                        percentage,
                        subcomponents: updatedSubcomponents
                      }
                    }
                  }
                }
              : emp
          ),
        }));
      },

      updateSubcomponentPercentage: (employeeId: string, year: number, activityId: string, subcomponentId: string, percentage: number) => 
        set((state) => ({
          employees: state.employees.map((emp) => {
            if (emp.id !== employeeId) return emp;
            const activity = emp.yearlyActivities[year][activityId];
            const updatedSubcomponents = {
              ...activity.subcomponents,
              [subcomponentId]: {
                ...activity.subcomponents[subcomponentId],
                percentage
              }
            };
            // Recalculate total percentage for the activity
            const newTotal = Object.values(updatedSubcomponents)
              .filter((s: any) => s.isSelected)
              .reduce((sum: number, s: any) => sum + (s.percentage || 0), 0);
            return {
              ...emp,
              yearlyActivities: {
                ...emp.yearlyActivities,
                [year]: {
                  ...emp.yearlyActivities[year],
                  [activityId]: {
                    ...activity,
                    subcomponents: updatedSubcomponents,
                    percentage: newTotal
                  }
                }
              }
            };
          })
        })),

      updateSubcomponentRoleDescription: (employeeId: string, year: number, activityId: string, subcomponentId: string, description: string) =>
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === employeeId
              ? {
                  ...emp,
                  yearlyActivities: {
                    ...emp.yearlyActivities,
                    [year]: {
                      ...emp.yearlyActivities[year],
                      [activityId]: {
                        ...emp.yearlyActivities[year][activityId],
                        subcomponents: {
                          ...emp.yearlyActivities[year][activityId].subcomponents,
                          [subcomponentId]: {
                            ...emp.yearlyActivities[year][activityId].subcomponents[subcomponentId],
                            roleDescription: description
                          }
                        }
                      }
                    }
                  }
                }
              : emp
          ),
        })),

      toggleActivityExpansion: (activityId: string) => set((state) => ({
        activities: state.activities.map((activity) =>
          activity.id === activityId
            ? { ...activity, isExpanded: !activity.isExpanded }
            : activity
        ),
      })),

      copyAllocationsToYear: (fromYear: number, toYear: number) => {
        const state = get();
        set({
          employees: state.employees.map(emp => ({
            ...emp,
            yearlyActivities: {
              ...emp.yearlyActivities,
              [toYear]: emp.yearlyActivities[fromYear]
            }
          }))
        });
      },

      // Toggle isSelected for an activity
      toggleEmployeeActivitySelection: (employeeId, year, activityId) => set((state) => ({
        employees: state.employees.map(emp =>
          emp.id === employeeId
            ? {
                ...emp,
                yearlyActivities: {
                  ...emp.yearlyActivities,
                  [year]: {
                    ...emp.yearlyActivities[year],
                    [activityId]: {
                      ...emp.yearlyActivities[year][activityId],
                      isSelected: !emp.yearlyActivities[year][activityId].isSelected
                    }
                  }
                }
              }
            : emp
        )
      })),

      // Toggle isSelected for a subcomponent
      toggleEmployeeSubcomponentSelection: (employeeId, year, activityId, subcomponentId) => set((state) => ({
        employees: state.employees.map(emp => {
          if (emp.id !== employeeId) return emp;
          const activity = emp.yearlyActivities[year][activityId];
          const sub = activity.subcomponents[subcomponentId];
          // Toggle isSelected
          const updatedSub = {
            ...sub,
            isSelected: !sub.isSelected
          };
          // Update subcomponents
          const updatedSubcomponents = {
            ...activity.subcomponents,
            [subcomponentId]: updatedSub
          };
          // Recalculate total percentage for the activity
          const newTotal = Object.values(updatedSubcomponents)
            .filter((s: any) => s.isSelected)
            .reduce((sum: number, s: any) => sum + (s.percentage || 0), 0);
          return {
            ...emp,
            yearlyActivities: {
              ...emp.yearlyActivities,
              [year]: {
                ...emp.yearlyActivities[year],
                [activityId]: {
                  ...activity,
                  subcomponents: updatedSubcomponents,
                  percentage: newTotal
                }
              }
            }
          };
        })
      })),

      updateEmployees: (employees: Employee[]) => set({ employees }),

      recalculateWages: () => {
        set((state) => {
          const activitiesStore = useActivitiesStore.getState();
          const selectedActivities = activitiesStore.selectedActivities;
          
          // Calculate total applied percentage for each employee
          const updatedEmployees = state.employees.map(employee => {
            // Deep clone yearlyActivities to avoid mutation
            const yearlyActivities = JSON.parse(JSON.stringify(employee.yearlyActivities)) as YearlyActivities;
            
            // Reset all percentages first
            Object.keys(yearlyActivities).forEach(year => {
              Object.keys(yearlyActivities[year] || {}).forEach(activityId => {
                const activity = yearlyActivities[year][activityId];
                if (activity) {
                  Object.keys(activity.subcomponents || {}).forEach(subId => {
                    activity.subcomponents[subId].percentage = 0;
                  });
                  activity.percentage = 0;
                }
              });
            });
            
            // Update with new percentages from selected activities
            selectedActivities.forEach(activity => {
              const yearActivities = yearlyActivities[activity.year.toString()] || {};
              const employeeActivity = yearActivities[activity.id];
              
              if (employeeActivity?.isSelected) {
                activity.subcomponents.forEach(subcomponent => {
                  if (employeeActivity.subcomponents[subcomponent.id]?.isSelected) {
                    // Update subcomponent percentage from activities
                    employeeActivity.subcomponents[subcomponent.id].percentage = 
                      subcomponent.appliedPercentage || 0;
                  }
                });
                
                // Recalculate total percentage for the activity
                const activityPercentage = Object.values(employeeActivity.subcomponents)
                  .filter(sub => sub.isSelected)
                  .reduce((sum, sub) => sum + (sub.percentage || 0), 0);
                
                employeeActivity.percentage = activityPercentage;
              }
            });
            
            // Calculate total applied percentage across all activities
            const totalAppliedPercentage = Object.values(yearlyActivities)
              .reduce((yearSum, yearData) => {
                return yearSum + Object.values(yearData)
                  .reduce((activitySum, activity) => {
                    if (activity?.isSelected) {
                      return activitySum + (activity.percentage || 0);
                    }
                    return activitySum;
                  }, 0);
              }, 0);

            // Calculate qualified wages based on total applied percentage
            const qualifiedWages = (employee.annualWage * totalAppliedPercentage) / 100;
            
            return {
              ...employee,
              yearlyActivities,
              qualifiedWages,
              totalAppliedPercentage
            };
          });

          return {
            ...state,
            employees: updatedEmployees
          };
        });
      },

      calculateTotalQualifiedWages: () => {
        const { employees } = get();
        return employees.reduce((total, employee) => {
          const qualifiedWage = (employee.annualWage * (employee.totalAppliedPercentage || 0)) / 100;
          return total + qualifiedWage;
        }, 0);
      },
    }),
    {
      name: 'staff-storage',
      partialize: (state) => ({
        employees: state.employees,
        activities: state.activities
      })
    }
  )
);

export default useStaffStore;