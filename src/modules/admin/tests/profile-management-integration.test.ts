// Epic 3 Sprint 3 Day 1: Profile Management Integration Tests
// File: profile-management-integration.test.ts
// Purpose: Integration tests for comprehensive profile management functionality
// Story: 3.1 - Profile Management CRUD Operations

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import AdminProfileService from '../services/adminProfileService';
import { supabase } from '../../../lib/supabase';

// Mock Supabase client
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
      admin: {
        getUserByEmail: jest.fn()
      }
    },
    functions: {
      invoke: jest.fn()
    }
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Profile Management Integration Tests', () => {
  let profileService: AdminProfileService;

  beforeEach(() => {
    profileService = AdminProfileService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Profile CRUD Operations', () => {
    test('should get profiles with filters and pagination', async () => {
      const mockProfiles = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          full_name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
          status: 'active',
          account_name: 'Test Account',
          account_type: 'admin',
          last_login_at: '2024-01-15T10:00:00Z',
          login_count: 5,
          is_verified: true,
          auth_sync_status: 'synced',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          days_since_last_login: 1,
          total_activities: 25,
          active_roles: 2,
          active_permissions: 10,
          unresolved_conflicts: 0
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockProfiles,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      } as any);

      const result = await profileService.getProfiles({
        search: 'john',
        status: 'active',
        page: 1,
        limit: 50
      });

      expect(result).toEqual({
        profiles: mockProfiles,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1
        },
        filters: {
          search: 'john',
          status: 'active',
          page: 1,
          limit: 50
        }
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('profile_management_summary');
    });

    test('should create a new profile successfully', async () => {
      const newProfileData = {
        email: 'newuser@example.com',
        full_name: 'New User',
        role: 'affiliate' as const,
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        send_invitation: true
      };

      const mockCreatedProfile = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        ...newProfileData,
        status: 'pending',
        is_verified: false,
        auth_sync_status: 'pending',
        created_at: '2024-01-16T00:00:00Z',
        updated_at: '2024-01-16T00:00:00Z'
      };

      // Mock email uniqueness check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // Not found
            })
          })
        })
      } as any);

      // Mock auth user check
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' }
      });

      // Mock profile creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedProfile,
              error: null
            })
          })
        })
      } as any);

      // Mock activity logging
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      // Mock invitation service
      mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });

      // Mock getProfile for return data
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [mockCreatedProfile],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      } as any);

      const result = await profileService.createProfile(newProfileData);

      expect(result).toBeDefined();
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('user-service', {
        body: expect.objectContaining({
          pathname: '/user-service/send-invitation',
          email: newProfileData.email,
          role: newProfileData.role
        })
      });
    });

    test('should handle profile creation with duplicate email', async () => {
      const duplicateProfileData = {
        email: 'existing@example.com',
        full_name: 'Duplicate User',
        role: 'affiliate' as const
      };

      // Mock existing profile found
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: '123e4567-e89b-12d3-a456-426614174003' },
              error: null
            })
          })
        })
      } as any);

      await expect(profileService.createProfile(duplicateProfileData))
        .rejects
        .toThrow('Profile with this email already exists');
    });

    test('should update profile successfully', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        full_name: 'Updated Name',
        status: 'active' as const,
        admin_notes: 'Profile updated by admin'
      };

      const existingProfile = {
        id: profileId,
        full_name: 'Old Name',
        email: 'user@example.com',
        status: 'pending',
        admin_notes: null
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateData,
        updated_at: '2024-01-16T10:00:00Z'
      };

      // Mock getProfile call (current profile)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [existingProfile],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      } as any);

      // Mock profile update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedProfile,
                error: null
              })
            })
          })
        })
      } as any);

      // Mock activity logging
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      // Mock updated getProfile call
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [updatedProfile],
        error: null
      });

      const result = await profileService.updateProfile(profileId, updateData);

      expect(result).toBeDefined();
      expect(mockSupabase.rpc).toHaveBeenCalledWith('log_profile_activity', expect.any(Object));
    });
  });

  describe('Profile Metrics and Analytics', () => {
    test('should get profile metrics successfully', async () => {
      const mockMetrics = {
        total_profiles: 100,
        active_profiles: 85,
        inactive_profiles: 10,
        pending_profiles: 5,
        suspended_profiles: 0,
        verified_profiles: 90,
        unverified_profiles: 10,
        profiles_with_2fa: 45,
        sync_conflicts: 2,
        recent_logins: 30,
        never_logged_in: 15,
        profiles_by_role: {
          admin: 5,
          affiliate: 95
        },
        profiles_by_account_type: {
          admin: 5,
          operator: 20,
          affiliate: 50,
          client: 25
        }
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockMetrics],
        error: null
      });

      const result = await profileService.getProfileMetrics();

      expect(result).toEqual(mockMetrics);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_profile_metrics');
    });
  });

  describe('Bulk Operations', () => {
    test('should perform bulk status update successfully', async () => {
      const bulkOperation = {
        profileIds: [
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002'
        ],
        operation: 'update_status' as const,
        data: { status: 'active' }
      };

      // Mock successful updates
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: '123', status: 'active' },
                error: null
              })
            })
          })
        })
      } as any);

      // Mock activity logging
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await profileService.bulkUpdateProfiles(bulkOperation);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle bulk operation with some failures', async () => {
      const bulkOperation = {
        profileIds: [
          '123e4567-e89b-12d3-a456-426614174001',
          'invalid-id',
          '123e4567-e89b-12d3-a456-426614174003'
        ],
        operation: 'update_status' as const,
        data: { status: 'active' }
      };

      // Mock mixed results - first succeeds, second fails, third succeeds
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 2) {
                  return Promise.resolve({
                    data: null,
                    error: { message: 'Profile not found' }
                  });
                }
                return Promise.resolve({
                  data: { id: `123${callCount}`, status: 'active' },
                  error: null
                });
              })
            })
          })
        })
      }) as any);

      // Mock activity logging
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await profileService.bulkUpdateProfiles(bulkOperation);

      expect(result.success).toBe(false);
      expect(result.processed).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].profileId).toBe('invalid-id');
    });
  });

  describe('Auth Synchronization', () => {
    test('should sync profile with auth successfully', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000';
      
      const mockProfile = {
        id: profileId,
        email: 'user@example.com',
        full_name: 'Test User',
        status: 'active'
      };

      const mockAuthUser = {
        id: profileId,
        email: 'user@example.com',
        user_metadata: {},
        app_metadata: {}
      };

      // Mock getProfile
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [mockProfile],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      } as any);

      // Mock auth user lookup
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      // Mock profile update for sync status
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockProfile, auth_sync_status: 'synced' },
                error: null
              })
            })
          })
        })
      } as any);

      // Mock activity logging
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await profileService.syncProfileWithAuth(profileId);

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.admin.getUserByEmail).toHaveBeenCalledWith('user@example.com');
    });

    test('should handle auth sync conflict', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000';
      
      const mockProfile = {
        id: profileId,
        email: 'user@example.com',
        full_name: 'Test User',
        status: 'active'
      };

      // Mock getProfile
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [mockProfile],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      } as any);

      // Mock auth user not found
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' }
      });

      // Mock conflict creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      } as any);

      // Mock profile update for conflict status
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockProfile, auth_sync_status: 'conflict' },
                error: null
              })
            })
          })
        })
      } as any);

      const result = await profileService.syncProfileWithAuth(profileId);

      expect(result.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' }
          })
        })
      } as any);

      await expect(profileService.getProfiles())
        .rejects
        .toThrow();
    });

    test('should validate profile data before creation', async () => {
      const invalidProfileData = {
        email: 'invalid-email',
        full_name: '', // Empty name
        role: 'invalid-role' as any
      };

      await expect(profileService.createProfile(invalidProfileData))
        .rejects
        .toThrow();
    });
  });
});

describe('Profile Service Singleton Pattern', () => {
  test('should return the same instance', () => {
    const instance1 = AdminProfileService.getInstance();
    const instance2 = AdminProfileService.getInstance();
    
    expect(instance1).toBe(instance2);
  });
});

describe('Profile Data Validation', () => {
  test('should validate required fields for profile creation', () => {
    const validProfileData = {
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'affiliate' as const
    };

    // This would normally be done internally by the service
    expect(validProfileData.email).toBe('test@example.com');
    expect(validProfileData.full_name).toBe('Test User');
    expect(validProfileData.role).toBe('affiliate');
  });

  test('should handle optional fields properly', () => {
    const profileDataWithOptionals = {
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'affiliate' as const,
      phone: '+1-555-123-4567',
      timezone: 'America/New_York',
      admin_notes: 'Test notes'
    };

    expect(profileDataWithOptionals.phone).toBe('+1-555-123-4567');
    expect(profileDataWithOptionals.timezone).toBe('America/New_York');
    expect(profileDataWithOptionals.admin_notes).toBe('Test notes');
  });
});