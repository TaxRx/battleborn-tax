export interface ResearchStep {
  id: string;
  research_activity_id: string;
  name: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ResearchSubcomponent {
  id: string;
  step_id: string;
  name: string;
  description?: string;
  order_index: number;
  hint?: string;
  general_description?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  uncertainties?: string;
  developmental_process?: string;
  primary_goal?: string;
  expected_outcome_type?: string;
  cpt_codes?: string;
  cdt_codes?: string;
  alternative_paths?: string;
  created_at: string;
  updated_at: string;
}

export interface SelectedStep {
  id: string;
  business_year_id: string;
  research_activity_id: string;
  step_id: string;
  time_percentage: number;
  applied_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface SelectedSubcomponent {
  id: string;
  business_year_id: string;
  research_activity_id: string;
  step_id: string;
  subcomponent_id: string;
  frequency_percentage: number;
  year_percentage: number;
  step_percentage?: number;
  start_month: number;
  start_year: number;
  selected_roles: string[];
  non_rd_percentage: number;
  applied_percentage?: number;
  time_percentage?: number;
  step_name?: string;
  user_notes?: string;
  hint?: string;
  general_description?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  uncertainties?: string;
  developmental_process?: string;
  primary_goal?: string;
  expected_outcome_type?: string;
  cpt_codes?: string;
  cdt_codes?: string;
  alternative_paths?: string;
  approval_data?: {
    timestamp?: string;
    ip_address?: string;
    approved_by?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface StepWithSubcomponents extends ResearchStep {
  subcomponents: ResearchSubcomponent[];
}

export interface SubcomponentWithDetails extends ResearchSubcomponent {
  selectedSubcomponent?: SelectedSubcomponent;
}

export interface ResearchActivityWithSteps {
  activityId: string;
  activityName: string;
  steps: StepWithSubcomponents[];
}

export interface ResearchDesignData {
  activities: ResearchActivityWithSteps[];
  selectedSteps: SelectedStep[];
  selectedSubcomponents: SelectedSubcomponent[];
}

// Color palette for steps and subcomponents
export const STEP_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899', // Pink
];

export const SUBCOMPONENT_COLORS = [
  '#60A5FA', // Light Blue
  '#34D399', // Light Green
  '#FBBF24', // Light Yellow
  '#F87171', // Light Red
  '#A78BFA', // Light Purple
  '#22D3EE', // Light Cyan
  '#FB923C', // Light Orange
  '#F472B6', // Light Pink
  '#93C5FD', // Lighter Blue
  '#6EE7B7', // Lighter Green
  '#FCD34D', // Lighter Yellow
  '#FCA5A5', // Lighter Red
];

export interface MonthOption {
  value: number;
  label: string;
  percentage: number;
}

export const MONTH_OPTIONS: MonthOption[] = [
  { value: 1, label: 'January', percentage: 100 },
  { value: 2, label: 'February', percentage: 91.67 },
  { value: 3, label: 'March', percentage: 83.33 },
  { value: 4, label: 'April', percentage: 75 },
  { value: 5, label: 'May', percentage: 66.67 },
  { value: 6, label: 'June', percentage: 58.33 },
  { value: 7, label: 'July', percentage: 50 },
  { value: 8, label: 'August', percentage: 41.67 },
  { value: 9, label: 'September', percentage: 33.33 },
  { value: 10, label: 'October', percentage: 25 },
  { value: 11, label: 'November', percentage: 16.67 },
  { value: 12, label: 'December', percentage: 8.33 },
];

// Year options (current year and next 5 years)
export const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => ({
    value: currentYear + i,
    label: (currentYear + i).toString()
  }));
};

export interface EmployeeSubcomponent {
  id: string;
  employee_id: string;
  business_year_id: string;
  subcomponent_id: string;
  step_id: string;
  research_activity_id: string;
  employee_time_percentage: number;
  baseline_time_percentage: number;
  is_included: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithSubcomponents {
  id: string;
  business_id: string;
  name: string;
  role_id: string;
  is_owner: boolean;
  annual_wage: number;
  created_at: string;
  updated_at: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  subcomponents?: EmployeeSubcomponent[];
}

export interface RDExpense {
  id: string;
  business_year_id: string;
  research_activity_id: string;
  step_id: string;
  subcomponent_id: string;
  employee_id?: string;
  contractor_id?: string;
  supply_id?: string;
  category: 'Employee' | 'Contractor' | 'Supply';
  first_name?: string;
  last_name?: string;
  role_name?: string;
  supply_name?: string;
  research_activity_title: string;
  research_activity_practice_percent: number;
  step_name: string;
  subcomponent_title: string;
  subcomponent_year_percent: number;
  subcomponent_frequency_percent: number;
  subcomponent_time_percent: number;
  total_cost: number;
  applied_percent: number;
  baseline_applied_percent: number;
  employee_practice_percent?: number;
  employee_time_percent?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RDContractor {
  id: string;
  business_id: string;
  first_name: string;
  last_name?: string;
  role_id?: string;
  is_owner?: boolean;
  amount: number;
  created_at: string;
  updated_at: string;
  role?: {
    name: string;
  };
}

export interface RDSupply {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  annual_cost: number;
  created_at: string;
  updated_at: string;
}

export interface RDEmployeeSubcomponent {
  id: string;
  employee_id: string;
  subcomponent_id: string;
  business_year_id: string;
  time_percentage: number;
  applied_percentage: number;
  is_included: boolean;
  baseline_applied_percent: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithExpenses {
  id: string;
  business_id: string;
  name: string;
  role_id: string;
  is_owner: boolean;
  annual_wage: number;
  created_at: string;
  updated_at: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  employee_subcomponents?: RDEmployeeSubcomponent[];
  practice_percent?: number;
  time_percentages?: Record<string, number>;
} 