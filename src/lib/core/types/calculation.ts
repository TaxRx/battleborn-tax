import { TaxInfo, TaxBreakdown, TaxStrategy } from './';

export interface SavedCalculation {
  id: string;
  year: number;
  date: string;
  taxInfo: TaxInfo;
  breakdown: TaxBreakdown;
  strategies: TaxStrategy[];
}