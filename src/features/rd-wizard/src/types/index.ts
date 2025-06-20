// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'admin' | 'master-admin';
  created_at: string;
  updated_at: string;
  businesses?: Array<{
    id: string;
    name: string;
    user_id: string;
    created_at: string;
    updated_at: string;
  }>;
}

// Client related types
export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  entityId?: string;
  assignedAdminId?: string;
  engagementStatus: 'unsigned' | 'signed' | 'paid' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Entity {
  id: string;
  clientId: string;
  businessName: string;
  ein: string;
  address: string;
  state: string;
  practiceType: 
    | 'dentistry' 
    | 'orthodontics' 
    | 'optometry' 
    | 'dermatology' 
    | 'family medicine'
    | 'cardiology'
    | 'pediatrics'
    | 'other';
  specialty?: string;
  website?: string;
  startYear: number;
  grossReceipts: Record<string, number>; // Year to amount mapping
  createdAt: string;
  updatedAt: string;
}

// R&D Activity and Expense types
export interface QualifiedResearchActivity {
  id: string;
  title: string;
  description: string;
  defaultUtilizationPercentage: number;
  defaultTimeAllocationPercentage: number;
  subcomponents: Subcomponent[];
  hypothesis: string;
  yearAdded: number;
  createdAt: string;
  updatedAt: string;
  aiGenerated?: boolean;
}

export interface Subcomponent {
  id: string;
  qraId: string;
  title: string;
  description: string;
  defaultUtilizationPercentage: number;
  defaultTimeAllocationPercentage: number;
  standardStaffRoleAssignments: StaffRoleAssignment[];
  hypothesis: string;
  patientFeedbackRequired: boolean;
  createdAt: string;
  updatedAt: string;
  aiGenerated?: boolean;
}

export interface StaffRoleAssignment {
  roleTitle: string;
  defaultInvolvementPercentage: number;
}

export interface QualifiedResearchExpense {
  id: string;
  entityId: string;
  year: number;
  referenceId?: string; // Either qraId or subcomponentId
  referenceType: 'qra' | 'subcomponent';
  wageData: number;
  contractorData: number;
  supplyData: number;
  allocationPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface QualifiedExpense {
  id: string;
  year: number;
  type: 'wage' | 'contractor' | 'supply';
  amount: number;
  description: string;
  documentation?: File[];
  createdAt: string;
  updatedAt: string;
}

export interface WageExpense extends QualifiedExpense {
  type: 'wage';
  staffMemberId: string;
  allocationPercentage: number;
}

export type EmployeeRole = 'Research Leader' | 'Clinician' | 'Midlevel' | 'Clinical Assistant';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  annualWage: number;
  isBusinessOwner: boolean;
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
  }
}

export interface ContractorExpense {
  id: string;
  contractorName: string;
  role: string;
  amount: number;
  researchPercentage: number;
  subcomponentId: string;
  year: number;
  contractorType: 'individual' | 'company';
  taxId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyExpense {
  id: string;
  supplierName: string;
  vendor: string;
  category: string;
  amount: number;
  researchPercentage: number;
  subcomponentId: string;
  year: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

// Document and Payment types
export interface Document {
  id: string;
  clientId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  documentType: 'tax-return' | 'w2' | 'engagement' | 'production' | 'payroll' | 'other';
  uploadStatus: 'pending' | 'processing' | 'completed' | 'failed';
  reviewStatus: 'pending' | 'reviewed' | 'approved' | 'rejected';
  downloadUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  clientId: string;
  type: 'engagement' | 'final';
  amount: number;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  stripePaymentId?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Audit and Calculation types
export interface AuditLog {
  id: string;
  userId: string;
  userType: 'client' | 'admin' | 'system';
  action: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  aiSuggested: boolean;
  timestamp: string;
}

export interface CreditCalculation {
  entityId: string;
  year: number;
  totalQREs: number;
  baseAmount: number;
  standardMethodCredit: number;
  ascMethodCredit: number;
  stateCredit: number;
  selectedMethod: 'standard' | 'asc';
  calculatedAt: string;
}

// Form types
export interface Option {
  value: string;
  label: string;
}

export interface AreaMap {
  [key: string]: Option[];
}

export interface FocusMap {
  [key: string]: Option[];
}

export interface BusinessInfoFormData {
  businessName: string;
  businessDBA: string;
  ein: string;
  yearStarted: number;
  state: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  entityType: string;
  category: string;
  area: string;
  focus: string;
  naicsCode: string;
  practiceType: string;
  specialty: string;
  website: string;
  contactName: string;
  contactEmail: string;
}

export interface RegistrationFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// R&D Activity Selection types
export interface Category {
  id: string;
  name: string;
  areas: Area[];
}

export interface Area {
  id: string;
  name: string;
  categoryId: string;
  focuses: Focus[];
}

export interface Focus {
  id: string;
  name: string;
  areaId: string;
  researchActivities: ResearchActivity[];
}

export interface ResearchActivity {
  id: string;
  name: string;
  description: string;
  focusId: string;
  subcomponents: ResearchSubcomponent[];
  hypothesis?: string;
  methodology?: string;
  isExpanded?: boolean;
}

export interface ResearchSubcomponent {
  id: string;
  name: string;
  description?: string;
  generalDescription?: string;
  hypothesis?: string;
  methodology?: string;
  developmentalProcess?: string;
  isSelected?: boolean;
  frequencyPercentage: number;
  timePercentage: number;
  yearPercentage: number;
  appliedPercentage: number;
  documents?: File[];
}

export interface SelectedActivity extends ResearchActivity {
  year: number;
  practicePercentage: number;
  subcomponents: SelectedSubcomponent[];
}

export interface SelectedSubcomponent extends ResearchSubcomponent {
  isSelected: boolean;
  generalDescription: string;
  hypothesis: string;
  methodology: string;
  documents: File[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  allocations: SubcomponentAllocation[];
}

export interface SubcomponentAllocation {
  subcomponentId: string;
  allocationPercentage: number;
  year?: number;
}

// Business Owner types
export interface BusinessOwner {
  id: string;
  name: string;
  ownershipPercentage: number;
  year: number;
}

// QRE Data types
export interface QREData {
  year: number;
  total: number;
}

// Month type for implementation period
export interface Month {
  value: number;
  label: string;
  percentage: number;
}

export interface HistoricalData {
  [year: number]: {
    qre: number;
    grossReceipts: number;
    completed?: boolean;
    paid?: boolean;
    lastUpdated?: string;
  };
}

export interface BusinessState {
  businessName: string;
  businessDBA: string;
  ein: string;
  yearStarted: number;
  state: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  entityType: string;
  category: string;
  area: string;
  focus: string;
  naicsCode: string;
  practiceType: string;
  specialty: string;
  website: string;
  contactName: string;
  contactEmail: string;
  historicalData: HistoricalData;
  currentYear: number;
  availableYears: number[];
  owners: BusinessOwner[];
  
  // Functions
  setBusinessInfo: (info: BusinessInfoFormData) => void;
  setCurrentYear: (year: number) => void;
  generateAvailableYears: () => void;
  updateName: (name: string) => void;
  updateEIN: (ein: string) => void;
  updateYearStarted: (year: number) => void;
  updateState: (state: string) => void;
  updateAddress: (address: string) => void;
  updateContactName: (name: string) => void;
  updateContactEmail: (email: string) => void;
  updatePhone: (phone: string) => void;
  updateHistoricalData: (data: HistoricalData) => void;
  setQreTotal: (year: number, amount: number) => void;
  addOwner: (owner: { name: string; ownershipPercentage: number; year: number }) => void;
  removeOwner: (ownerId: string) => void;
  updateOwner: (ownerId: string, owner: { name: string; ownershipPercentage: number; year: number }) => void;
}

export interface BusinessLink {
  id: string;
  user_id: string;
  business_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChangelogEntry {
  id?: string;
  actor_id: string;
  target_user_id: string;
  action: string;
  details: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

export interface Business {
  id: string;
  name: string;
  businessDBA: string;
  ein: string;
  yearStarted: number;
  state: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  entityType: string;
  category: string;
  area: string;
  focus: string;
  naicsCode: string;
  practiceType: string;
  specialty: string;
  website: string;
  contactName: string;
  contactEmail: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}