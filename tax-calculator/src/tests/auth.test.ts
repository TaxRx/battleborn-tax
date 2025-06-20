import { jest, test, expect, beforeAll, afterAll, describe } from '@jest/globals';
import { supabase } from '../lib/supabaseClient';
import { useUserStore } from '../store/userStore';
import { User } from '../types/user';
import { MockResponse, UserData, ProfileData } from './__mocks__/supabase';
import { SupabaseClient, SignUpWithPasswordCredentials, UserResponse } from '@supabase/supabase-js';

interface UserStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
  reset: () => void;
}

type AuthResponse = MockResponse<{ user: UserData; session: { user: UserData } }>;
type ProfileResponse = MockResponse<ProfileData>;

interface MockSupabaseAuth {
  signUp: jest.Mock;
  signIn: jest.Mock;
  getUser: jest.Mock;
}

interface MockSupabaseClient {
  auth: MockSupabaseAuth;
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
}

// Mock responses for new user
const mockSignUpResponse: AuthResponse = {
  data: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
    session: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      }
    }
  },
  error: null,
};

const mockNewProfileData: ProfileResponse = {
  data: {
    id: 'test-user-id',
    user_id: 'test-user-id',
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
    updated_at: new Date().toISOString()
  },
  error: null,
};

// Mock responses for existing user
const mockExistingUserData: AuthResponse = {
  data: {
    user: {
      id: 'existing-user-id',
      email: 'existing@example.com',
    },
    session: {
      user: {
        id: 'existing-user-id',
        email: 'existing@example.com',
      }
    }
  },
  error: null,
};

const mockExistingProfileData: ProfileResponse = {
  data: {
    id: 'existing-user-id',
    user_id: 'existing-user-id',
    email: 'existing@example.com',
    full_name: 'John Doe',
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
    updated_at: new Date().toISOString()
  },
  error: null,
};

// Mock the Supabase client
jest.mock('../lib/supabaseClient', () => {
  const mockSupabase: MockSupabaseClient = {
    auth: {
      signUp: jest.fn(() => Promise.resolve(mockSignUpResponse)),
      signIn: jest.fn(() => Promise.resolve(mockSignUpResponse)),
      getUser: jest.fn(() => Promise.resolve(mockExistingUserData)),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve(mockNewProfileData)),
  };

  return {
    supabase: mockSupabase,
  };
});

describe('User Authentication', () => {
  let userStore: UserStore;
  let mockSupabase: MockSupabaseClient;

  beforeAll(() => {
    userStore = useUserStore.getState() as UserStore;
    mockSupabase = supabase as unknown as MockSupabaseClient;
  });

  afterAll(() => {
    userStore.reset();
  });

  test('should sign up a new user', async () => {
    // Mock the signUp response
    mockSupabase.auth.signUp.mockImplementationOnce(() => Promise.resolve(mockSignUpResponse));
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockImplementationOnce(() => Promise.resolve(mockNewProfileData));

    await userStore.fetchUserProfile();
    expect(userStore.user).toBeDefined();
    expect(userStore.user?.email).toBe('test@example.com');
  });

  test('should sign in an existing user', async () => {
    // Mock the getUser response
    mockSupabase.auth.getUser.mockImplementationOnce(() => Promise.resolve(mockExistingUserData));
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockImplementationOnce(() => Promise.resolve(mockExistingProfileData));

    await userStore.fetchUserProfile();
    expect(userStore.user).toBeDefined();
    expect(userStore.user?.email).toBe('existing@example.com');
  });
}); 