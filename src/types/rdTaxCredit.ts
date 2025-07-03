// R&D Tax Credit Types based on Supabase schema

export type RoleType = 'ADMIN' | 'CLIENT' | 'STAFF';
export type EntityType = 'LLC' | 'SCORP' | 'CCORP' | 'PARTNERSHIP' | 'SOLEPROP' | 'OTHER';
export type RDReportType = 'RESEARCH_DESIGN' | 'RESEARCH_SUMMARY' | 'FILING_GUIDE';

export interface User {
  id: string;
  email: string;
  name: string;
  roleType: RoleType;
  createdAt: string;
  updatedAt: string;
}

export interface RDClient {
  id: string;
  userId: string;
  user?: User;
  businesses: RDBusiness[];
  createdAt: string;
  updatedAt: string;
}

export interface RDBusiness {
  id: string;
  clientId: string;
  client?: RDClient;
  name: string;
  ein: string;
  entityType: EntityType;
  startYear: number;
  domicileState: string;
  contactInfo: Record<string, any>;
  isControlledGrp: boolean;
  years: RDBusinessYear[];
  roles: RDRole[];
  employees: RDEmployee[];
  reports: RDReport[];
  createdAt: string;
  updatedAt: string;
}

export interface RDBusinessYear {
  id: string;
  businessId: string;
  business?: RDBusiness;
  year: number;
  grossReceipts: number;
  totalQRE: number;
  selectedActivities: RDSelectedActivity[];
  employees: RDEmployeeYearData[];
  supplies: RDSupplyYearData[];
  contractors: RDContractorYearData[];
  reports: RDReport[];
}

export interface RDRole {
  id: string;
  businessId: string;
  business?: RDBusiness;
  name: string;
  parentId?: string;
  parent?: RDRole;
  children: RDRole[];
}

export interface RDEmployee {
  id: string;
  businessId: string;
  business?: RDBusiness;
  name: string;
  roleId: string;
  role?: RDRole;
  isOwner: boolean;
  annualWage: number;
  yearData: RDEmployeeYearData[];
}

export interface RDEmployeeYearData {
  id: string;
  employeeId: string;
  employee?: RDEmployee;
  businessYearId: string;
  businessYear?: RDBusinessYear;
  appliedPercent: number;
  calculatedQRE: number;
  activityRoles: Record<string, any>;
}

export interface RDSupplyYearData {
  id: string;
  businessYearId: string;
  businessYear?: RDBusinessYear;
  name: string;
  costAmount: number;
  appliedPercent: number;
  activityLink: Record<string, any>;
}

export interface RDContractorYearData {
  id: string;
  businessYearId: string;
  businessYear?: RDBusinessYear;
  name: string;
  costAmount: number;
  appliedPercent: number;
  activityLink: Record<string, any>;
}

// Research Library Types
export interface RDResearchCategory {
  id: string;
  name: string;
  areas: RDArea[];
}

export interface RDArea {
  id: string;
  name: string;
  categoryId: string;
  category?: RDResearchCategory;
  focuses: RDFocus[];
}

export interface RDFocus {
  id: string;
  name: string;
  areaId: string;
  area?: RDArea;
  activities: RDResearchActivity[];
}

export interface RDResearchActivity {
  id: string;
  title: string;
  focusId: string;
  focus?: RDFocus;
  generalDescription?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  uncertainties?: string;
  developmentalProcess?: string;
  primaryGoal?: string;
  expectedOutcomeType?: string;
  cptCodes?: string;
  cdtCodes?: string;
  alternativePaths?: string;
  isActive: boolean;
  defaultRoles: Record<string, any>;
  defaultSteps: Record<string, any>;
  subcomponents: RDSubcomponent[];
}

export interface RDSubcomponent {
  id: string;
  activityId: string;
  activity?: RDResearchActivity;
  title: string;
  phase: string;
  step?: string;
  hint?: string;
}

export interface RDSelectedActivity {
  id: string;
  businessYearId: string;
  businessYear?: RDBusinessYear;
  activityId: string;
  activity?: RDResearchActivity;
  practicePercent: number;
  selectedRoles: Record<string, any>;
  config: Record<string, any>;
}

export interface RDReport {
  id: string;
  businessId?: string;
  business?: RDBusiness;
  businessYearId?: string;
  businessYear?: RDBusinessYear;
  type: RDReportType;
  generatedText: string;
  editableText?: string;
  aiVersion: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Wizard State Types
export interface RDWizardState {
  currentStep: number;
  business?: RDBusiness;
  selectedYear?: RDBusinessYear;
  selectedActivities: RDSelectedActivity[];
  employees: RDEmployee[];
  supplies: RDSupplyYearData[];
  contractors: RDContractorYearData[];
  isComplete: boolean;
}

// Form Types
export interface BusinessFormData {
  name: string;
  ein: string;
  entityType: EntityType;
  startYear: number;
  domicileState: string;
  contactInfo: {
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
  };
  isControlledGrp: boolean;
}

export interface EmployeeFormData {
  name: string;
  roleId: string;
  isOwner: boolean;
  annualWage: number;
  appliedPercent: number;
}

export interface ActivitySelectionData {
  activityId: string;
  practicePercent: number;
  selectedRoles: string[];
  config: Record<string, any>;
} 