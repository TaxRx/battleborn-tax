import { jest, beforeAll, afterAll, test, expect, describe, beforeEach } from '@jest/globals';
import { supabase } from '../lib/supabaseClient';
import { User } from '../types/user';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

// Import types from mock Supabase client
import { MockResponse, UserData, ProfileData, MockQuery } from '../tests/__mocks__/supabase';

// Mock responses for new user
const mockSignUpResponse: MockResponse<{ user: UserData; session: { user: UserData } }> = {
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

const mockProfileData: MockResponse<ProfileData> = {
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

const mockDeleteResponse: MockResponse<null> = { 
  data: null, 
  error: null,
};

// Mock responses for existing user
const mockExistingUserData: MockResponse<{ user: UserData; session: { user: UserData } }> = {
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

const mockExistingProfileData: MockResponse<ProfileData> = {
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

interface MockUser {
  id: string;
  email: string;
}

interface MockProfile {
  id: string;
  email: string;
  full_name: string;
}

type GetUserResponse = { data: { user: MockUser }; error: null };
type GetProfileResponse = { data: MockProfile; error: null };

interface MockSupabase {
  auth: {
    getUser: jest.MockedFunction<() => Promise<GetUserResponse>>;
    signOut: jest.MockedFunction<() => Promise<void>>;
    onAuthStateChange: jest.MockedFunction<() => void>;
  };
  from: jest.MockedFunction<(table: string) => MockSupabase>;
  select: jest.MockedFunction<() => MockSupabase>;
  eq: jest.MockedFunction<(column: string, value: string) => MockSupabase>;
  single: jest.MockedFunction<() => Promise<GetProfileResponse>>;
  upsert: jest.MockedFunction<(data: any) => Promise<any>>;
}

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn<() => Promise<GetUserResponse>>(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn<() => Promise<GetProfileResponse>>(),
  upsert: jest.fn(),
} as unknown as MockSupabase;

// Mock createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('User Profile Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should handle user profile data correctly', async () => {
    const mockUser: MockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    const mockProfile: MockProfile = {
      id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
    };

    // Mock successful user fetch
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    // Mock successful profile fetch
    mockSupabase.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });

    // Create a new Supabase client instance
    const supabase = createClient('test-url', 'test-key');

    // Test user fetch
    const { data, error: userError } = await supabase.auth.getUser();
    expect(userError).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user).toEqual(mockUser);

    if (!data.user) {
      throw new Error('User should be defined');
    }

    // Test profile fetch
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select()
      .eq('id', data.user.id)
      .single();

    expect(profileError).toBeNull();
    expect(profile).toEqual(mockProfile);
  });
});

test('should load existing user data on login', async () => {
  // Setup mocks for sign in
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() => Promise.resolve(mockExistingProfileData)),
    delete: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };

  (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

  // 1. Sign in existing user
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'existing@example.com',
    password: 'password123',
  });

  expect(signInError).toBeNull();
  expect(signInData).toBeDefined();
  expect(signInData?.user).toBeDefined();
  const existingUserId = signInData?.user?.id;

  // 2. Verify the profile data is loaded correctly
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', existingUserId)
    .single();

  expect(profileError).toBeNull();
  expect(profileData).toBeDefined();
  expect(profileData?.email).toBe('existing@example.com');
  expect(profileData?.full_name).toBe('John Doe');
  expect(profileData?.has_completed_tax_profile).toBe(true);
  expect(profileData?.tax_info).toBeDefined();
  expect(profileData?.tax_info?.filing_status).toBe('Single');
  expect(profileData?.tax_info?.entity_type).toBe('LLC');
  expect(profileData?.tax_info?.income_sources).toEqual(['W2', '1099']);

  // Verify mock calls
  expect(supabase.from).toHaveBeenCalledWith('profiles');
  expect(mockQuery.select).toHaveBeenCalledWith('*');
  expect(mockQuery.eq).toHaveBeenCalledWith('user_id', existingUserId);
  expect(mockQuery.single).toHaveBeenCalled();
});