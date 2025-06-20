import { jest } from '@jest/globals';

export interface MockResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface UserData {
  id: string;
  email: string;
}

export interface ProfileData {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  is_admin: boolean;
  home_address: string | null;
  business_name: string | null;
  business_address: string | null;
  entity_type: string | null;
  filing_status: string | null;
  state: string | null;
  dependents: number;
  created_at: string;
  updated_at: string;
}

export interface MockQuery {
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  delete: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
}

const mockUser: UserData = {
  id: '123',
  email: 'test@example.com',
};

const mockProfile: ProfileData = {
  id: '456',
  user_id: '123',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user',
  is_admin: false,
  home_address: null,
  business_name: null,
  business_address: null,
  entity_type: null,
  filing_status: null,
  state: null,
  dependents: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

type MockReturnValue<T> = Promise<{ data: T; error: null }>;
type MockVoidReturnValue = Promise<{ error: null }>;

const mockQuery: MockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockImplementation((): MockReturnValue<ProfileData> => Promise.resolve({ data: mockProfile, error: null })),
  delete: jest.fn().mockImplementation((): MockVoidReturnValue => Promise.resolve({ error: null })),
  insert: jest.fn().mockImplementation((): MockReturnValue<ProfileData> => Promise.resolve({ data: mockProfile, error: null })),
  update: jest.fn().mockImplementation((): MockReturnValue<ProfileData> => Promise.resolve({ data: mockProfile, error: null })),
};

export const supabase = {
  auth: {
    signUp: jest.fn().mockImplementation((): MockReturnValue<{ user: UserData }> => Promise.resolve({ data: { user: mockUser }, error: null })),
    signIn: jest.fn().mockImplementation((): MockReturnValue<{ user: UserData }> => Promise.resolve({ data: { user: mockUser }, error: null })),
    signOut: jest.fn().mockImplementation((): MockVoidReturnValue => Promise.resolve({ error: null })),
    getUser: jest.fn().mockImplementation((): MockReturnValue<{ user: UserData }> => Promise.resolve({ data: { user: mockUser }, error: null })),
  },
  from: jest.fn().mockReturnValue(mockQuery),
}; 