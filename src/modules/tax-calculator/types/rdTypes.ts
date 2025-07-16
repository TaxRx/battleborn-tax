export interface HistoricalData {
  year: number;
  gross_receipts: number;
  qre: number;
}

export interface RDBusiness {
  id: string;
  client_id: string;
  name: string;
  ein: string | null; // EIN can be null during initial enrollment
  entity_type: 'LLC' | 'SCORP' | 'CCORP' | 'PARTNERSHIP' | 'SOLEPROP' | 'OTHER';
  start_year: number;
  domicile_state: string;
  contact_info: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  website?: string;
  naics_code?: string;
  image_path?: string;
  is_controlled_grp: boolean;
  created_at: string;
  updated_at: string;
}

export interface RDBusinessYear {
  id: string;
  business_id: string;
  year: number;
  gross_receipts: number;
  total_qre: number;
  created_at: string;
  updated_at: string;
}

export interface RDEmployee {
  id: string;
  business_id: string;
  name: string;
  title: string;
  rd_time_percentage: number;
  salary: number;
  created_at: string;
  updated_at: string;
}

export interface RDExpense {
  id: string;
  business_year_id: string;
  type: 'SUPPLIES' | 'CONTRACTOR' | 'EQUIPMENT' | 'OTHER';
  description: string;
  amount: number;
  rd_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface RDCalculation {
  id: string;
  business_year_id: string;
  total_qre: number;
  base_amount: number;
  incremental_qre: number;
  federal_credit_rate: number;
  federal_credit_amount: number;
  state_credit_rate: number;
  state_credit_amount: number;
  total_credit_amount: number;
  created_at: string;
  updated_at: string;
}

export interface RDReport {
  id: string;
  business_year_id: string;
  report_data: any;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

// Form interfaces for the wizard
export interface BusinessSetupData {
  business: {
    name: string;
    ein: string;
    entityType: string;
    startYear: number;
    address: string;
    city: string;
    state: string;
    zip: string;
    website?: string;
    naicsCode?: string;
    imagePath?: string;
    historicalData: HistoricalData[];
  };
  selectedYear: {
    year: number;
    grossReceipts: number;
  };
}

export interface ResearchActivity {
  id: string;
  category: string;
  area: string;
  focus: string;
  activity: string;
  subcomponent?: string;
  description: string;
  narrative: string;
}

export interface EmployeeData {
  name: string;
  title: string;
  rdTimePercentage: number;
  salary: number;
}

export interface ExpenseData {
  type: 'SUPPLIES' | 'CONTRACTOR' | 'EQUIPMENT' | 'OTHER';
  description: string;
  amount: number;
  rdPercentage: number;
}

export interface CalculationResult {
  totalQRE: number;
  baseAmount: number;
  incrementalQRE: number;
  federalCreditRate: number;
  federalCreditAmount: number;
  stateCreditRate: number;
  stateCreditAmount: number;
  totalCreditAmount: number;
} 