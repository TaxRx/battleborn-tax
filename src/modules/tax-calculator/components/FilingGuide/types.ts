export interface FilingGuideData {
  businessData: any;
  selectedYear: any;
  calculations: any;
}

export interface QREBreakdown {
  wages: number;
  supplies: number;
  contractors: number;
}

export interface EmployeeQRE {
  name: string;
  role: string;
  qre_percentage: number;
  qre_amount: number;
}

export interface ResearchActivity {
  name: string;
  subcomponent_count: number;
  utilization_percentage: number;
  shrinkback_factor: number;
  final_weight: number;
}

export interface Form6765Data {
  total_qre: number;
  avg_qre_prior_3_years: number;
  base_period_avg: number;
  fixed_base_percentage: number;
  avg_gross_receipts: number;
  incremental_qre: number;
  regular_credit: number;
  asc_credit: number;
}

export interface FilingGuideExportOptions {
  format: 'pdf' | 'html';
  fileName: string;
}

// Editable override for a single Form 6765 line
export interface Form6765Override {
  id?: string;
  client_id: string;
  business_year: number;
  section: string; // e.g., 'A', 'B', 'C', 'D'
  line_number: number;
  value: number;
  last_modified_by?: string;
  created_at?: string;
  updated_at?: string;
} 