import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { isDemoMode } from '../../utils/demoMode';
import { v4 as uuidv4 } from 'uuid';

// Local types for the wizard (namespaced)
export namespace RDTWizardTypes {
  export interface QRAEntry {
    id: string;
    Category: string;
    Area: string;
    Focus: string;
    ResearchActivity: string;
    Subcomponent: string;
    Phase: string;
    Hint: string;
    GeneralDescription: string;
    Goal: string;
    Hypothesis: string;
    Alternatives: string;
    Uncertainties: string;
    DevelopmentProcess: string;
    ResearchLeaderRole: string;
    ClinicianRole: string;
    MidlevelRole: string;
    ClinicalAssistantRole: string;
    InclusionCriteriaAge: string;
    InclusionCriteriaSex: string;
    InclusionCriteriaConsent: string;
    InclusionOther: string;
    ExclusionCriteria1: string;
    ExclusionCriteria2: string;
    ExclusionCriteria3: string;
    OutcomeMeasure1: string;
    OutcomeMeasure2: string;
    StudyType: string;
    Allocation: string;
    PrimaryPurpose: string;
    Enrollment: string;
    TechnicalCategory: string;
    TimePercent: string;
  }
  export interface Employee {
    id: string;
    name: string;
    role: string;
    salary: number;
  }
  export interface Contractor {
    id: string;
    name: string;
    amount: number;
    description?: string;
  }
  export interface Supply {
    id: string;
    item: string;
    amount: number;
    description?: string;
  }
  export interface Calculation {
    id: string;
    userId: string;
    year: number;
    qras: QRAEntry[];
    employees: Employee[];
    contractors: Contractor[];
    supplies: Supply[];
    totalCredit: number;
    createdAt: string;
    updatedAt: string;
  }
}

// Mock data for fallback
const mockQRA: RDTWizardTypes.QRAEntry = {
  id: uuidv4(),
  Category: 'Healthcare',
  Area: 'Medical Innovations',
  Focus: 'Aesthetic Treatments',
  ResearchActivity: 'Aesthetic Services',
  Subcomponent: 'Peptide Therapy for Growth Hormone Management',
  Phase: '',
  Hint: '',
  GeneralDescription: 'Demo QRA',
  Goal: 'Demo goal',
  Hypothesis: '',
  Alternatives: '',
  Uncertainties: '',
  DevelopmentProcess: '',
  ResearchLeaderRole: '',
  ClinicianRole: '',
  MidlevelRole: '',
  ClinicalAssistantRole: '',
  InclusionCriteriaAge: '',
  InclusionCriteriaSex: '',
  InclusionCriteriaConsent: '',
  InclusionOther: '',
  ExclusionCriteria1: '',
  ExclusionCriteria2: '',
  ExclusionCriteria3: '',
  OutcomeMeasure1: '',
  OutcomeMeasure2: '',
  StudyType: '',
  Allocation: '',
  PrimaryPurpose: '',
  Enrollment: '',
  TechnicalCategory: '',
  TimePercent: ''
};

const mockEmployee: RDTWizardTypes.Employee = {
  id: uuidv4(),
  name: 'Demo Employee',
  role: 'Engineer',
  salary: 80000
};
const mockContractor: RDTWizardTypes.Contractor = {
  id: uuidv4(),
  name: 'Demo Contractor',
  amount: 20000,
  description: 'Demo contractor description'
};
const mockSupply: RDTWizardTypes.Supply = {
  id: uuidv4(),
  item: 'Demo Supply',
  amount: 5000,
  description: 'Demo supply description'
};

interface RDTWizardState {
  qras: RDTWizardTypes.QRAEntry[];
  employees: RDTWizardTypes.Employee[];
  contractors: RDTWizardTypes.Contractor[];
  supplies: RDTWizardTypes.Supply[];
  loading: boolean;
  error: string | null;
  fetchWizardData: (userId: string) => Promise<void>;
  updateQRA: (qra: RDTWizardTypes.QRAEntry) => void;
  updateEmployee: (employee: RDTWizardTypes.Employee) => void;
  updateContractor: (contractor: RDTWizardTypes.Contractor) => void;
  updateSupply: (supply: RDTWizardTypes.Supply) => void;
  saveCalculation: (calc: RDTWizardTypes.Calculation) => void;
}

export const useRDTWizardStore = create<RDTWizardState>((set, get) => ({
  qras: [],
  employees: [],
  contractors: [],
  supplies: [],
  loading: false,
  error: null,
  fetchWizardData: async (userId: string) => {
    set({ loading: true, error: null });
    if (isDemoMode()) {
      set({
        qras: [mockQRA],
        employees: [mockEmployee],
        contractors: [mockContractor],
        supplies: [mockSupply],
        loading: false,
      });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('rd_credit_calculations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        set({
          qras: data.qras || [],
          employees: data.employees || [],
          contractors: data.contractors || [],
          supplies: data.supplies || [],
          loading: false,
        });
      } else {
        set({
          qras: [],
          employees: [],
          contractors: [],
          supplies: [],
          loading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  updateQRA: (qra) => set(state => ({ qras: [qra] })),
  updateEmployee: (employee) => set(state => ({ employees: [employee] })),
  updateContractor: (contractor) => set(state => ({ contractors: [contractor] })),
  updateSupply: (supply) => set(state => ({ supplies: [supply] })),
  saveCalculation: async (calc) => {
    set({ loading: true, error: null });
    if (isDemoMode()) {
      set({
        qras: calc.qras,
        employees: calc.employees,
        contractors: calc.contractors,
        supplies: calc.supplies,
        loading: false,
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('rd_credit_calculations')
        .insert([{
          user_id: calc.userId,
          year: calc.year,
          qras: calc.qras,
          employees: calc.employees,
          contractors: calc.contractors,
          supplies: calc.supplies,
          total_credit: calc.totalCredit,
        }]);
      if (error) throw error;
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
})); 