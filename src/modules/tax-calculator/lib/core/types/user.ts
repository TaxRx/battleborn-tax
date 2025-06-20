export interface User {
  id: string;
  email: string;
  fullName: string;
  homeAddress?: string;
  businessName?: string;
  businessAddress?: string;
  entityType?: 'LLC' | 'S-Corp' | 'C-Corp' | 'Sole Prop';
  filingStatus?: 'single' | 'married_joint' | 'married_separate' | 'head_household';
  state?: string;
  dependents?: number;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}