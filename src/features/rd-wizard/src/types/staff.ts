export enum EmployeeRole {
  RESEARCH_LEADER = 'Research Leader',
  CLINICIAN = 'Clinician',
  MIDLEVEL = 'Midlevel',
  CLINICAL_ASSISTANT = 'Clinical Assistant'
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  isBusinessOwner: boolean;
  annualWage: number;
  totalAppliedPercentage?: number;
  qualifiedWages?: number;
  yearlyActivities: {
    [year: number]: {
      [activityId: string]: {
        percentage: number;
        isSelected: boolean;
        subcomponents: {
          [subcomponentId: string]: {
            percentage: number;
            isSelected: boolean;
            roleDescription?: string;
          }
        }
      }
    }
  };
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  isExpanded: boolean;
  subcomponents: Subcomponent[];
}

export interface Subcomponent {
  id: string;
  name: string;
  description: string;
  defaultRoleDescription?: string;
  percentage: number;
}

export interface SelectedSubcomponent extends Subcomponent {
  roleDescription?: string;
  isSelected: boolean;
}

export interface StoreState {
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
} 