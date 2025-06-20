import { jest, beforeAll, afterAll, test, expect, describe, beforeEach } from '@jest/globals';
import { User } from '../types/user';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { useUserStore } from '../store/userStore';
import { supabase as mockSupabase } from '../tests/__mocks__/supabase';

// Mock the Supabase client
jest.mock('../lib/supabaseClient', () => ({
  __esModule: true,
  default: mockSupabase,
}));

describe('User Profile', () => {
  let userStore: ReturnType<typeof useUserStore.getState>;

  beforeEach(() => {
    // Reset the store before each test
    userStore = useUserStore.getState();
    userStore.reset();
  });

  test('should load existing user data on login', async () => {
    await userStore.fetchUserProfile();
    expect(userStore.user).toBeDefined();
    expect(userStore.user?.email).toBe('test@example.com');
    expect(userStore.profile).toBeDefined();
    expect(userStore.profile.email).toBe('test@example.com');
    expect(userStore.profile.fullName).toBe('Test User');
  });

  test('should update user profile', async () => {
    const updates = {
      fullName: 'Updated Name',
      homeAddress: '123 Main St',
    };

    await userStore.updateUserProfile(updates);
    expect(userStore.profile.fullName).toBe('Updated Name');
    expect(userStore.profile.homeAddress).toBe('123 Main St');
  });
});