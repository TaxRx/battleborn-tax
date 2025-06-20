import type { TaxInfo, TaxBreakdown, BracketCalculation } from './tax';

export type { TaxInfo, TaxBreakdown, BracketCalculation };

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  has_completed_tax_profile: boolean;
  created_at: string;
  updated_at: string;
} 