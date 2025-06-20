import { jest } from '@jest/globals';
import { SupabaseClient } from '@supabase/supabase-js';

// Test environment configuration
export const testEnv = {
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-key',
};

// Mock import.meta.env for test environment
if (process.env.NODE_ENV === 'test') {
  (global as any).import = {
    meta: {
      env: testEnv,
    },
  };
}

interface MockUser {
  id: string;
  email: string;
}

interface MockProfile {
  id: string;
  email: string;
  fullName: string;
}

type MockResponse<T> = {
  data: T;
  error: null;
};

// Mock Supabase client for tests
export const mockSupabaseClient = {
  auth: {
    signUp: jest.fn<Promise<MockResponse<{ user: MockUser }>>>().mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    }),
    signIn: jest.fn<Promise<MockResponse<{ user: MockUser }>>>().mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    }),
    signOut: jest.fn<Promise<{ error: null }>>().mockResolvedValue({ error: null }),
    getUser: jest.fn<Promise<MockResponse<{ user: MockUser }>>>().mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn<Promise<MockResponse<MockProfile>>>().mockResolvedValue({
      data: {
        id: '123',
        email: 'test@example.com',
        fullName: 'Test User',
      },
      error: null,
    }),
    delete: jest.fn<Promise<{ data: null; error: null }>>().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn<Promise<MockResponse<MockProfile>>>().mockResolvedValue({
      data: {
        id: '123',
        email: 'test@example.com',
        fullName: 'Test User',
      },
      error: null,
    }),
    update: jest.fn<Promise<MockResponse<MockProfile>>>().mockResolvedValue({
      data: {
        id: '123',
        email: 'test@example.com',
        fullName: 'Updated Name',
      },
      error: null,
    }),
  }),
} as unknown as SupabaseClient;

export default testEnv; 