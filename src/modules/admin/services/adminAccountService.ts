// Epic 3: Admin Account Service
// File: adminAccountService.ts
// Purpose: Service layer for admin account and activity management operations

import { supabase } from '../../../lib/supabase';

// Types for account activities
export interface Activity {
  id: string;
  actor_id: string | null;
  account_id: string;
  activity_type: string;
  target_type: string;
  target_id: string;
  description: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
  actor_name?: string;
  actor_email?: string;
}

export interface ActivityFilters {
  accountId?: string;
  activityType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityResponse {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ActivitySummary {
  activity_type: string;
  total_count: number;
  affected_accounts: number;
  last_occurrence: string;
  first_occurrence: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  address?: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  stripe_customer_id?: string;
  auto_link_new_clients?: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { count: number }[];
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  account_id?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'locked';
  phone?: string;
  avatar_url?: string;
  last_login_at?: string;
  login_count: number;
  is_verified: boolean;
  admin_notes?: string;
  auth_sync_status: 'synced' | 'pending' | 'conflict' | 'error' | 'requires_attention';
  metadata: Record<string, any>;
  preferences: Record<string, any>;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileFilters {
  search?: string;
  status?: string;
  role?: string;
  accountId?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProfileResponse {
  profiles: Profile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AccountFilters {
  search?: string;
  type?: string;
  status?: string;
  includeDeleted?: boolean; // Whether to include deleted accounts in results
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AccountResponse {
  accounts: Account[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AdminAccountService {
  private static instance: AdminAccountService;
  private readonly baseUrl = '/functions/v1/admin-service';

  private constructor() {}

  public static getInstance(): AdminAccountService {
    if (!AdminAccountService.instance) {
      AdminAccountService.instance = new AdminAccountService();
    }
    return AdminAccountService.instance;
  }

  // Account Activities Methods
  async getAccountActivities(accountId: string, filters: ActivityFilters = {}): Promise<ActivityResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.activityType) params.append('type', filters.activityType);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      // Query directly from Supabase for account activities
      let query = supabase
        .from('account_activities')
        .select(`
          id,
          actor_id,
          activity_type,
          target_type,
          target_id,
          description,
          metadata,
          ip_address,
          user_agent,
          session_id,
          created_at,
          profiles:actor_id (
            id,
            full_name,
            email
          )
        `, { count: 'exact' })
        .eq('account_id', accountId);

      // Apply filters
      if (filters.activityType) {
        query = query.eq('activity_type', filters.activityType);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply sorting
      const ascending = filters.sortOrder === 'asc';
      query = query.order(filters.sortBy || 'created_at', { ascending });

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: activities, error: activitiesError, count } = await query;

      if (activitiesError) throw activitiesError;

      // Transform data to include actor names
      const transformedActivities = activities?.map(activity => ({
        ...activity,
        actor_name: activity.profiles?.full_name || activity.profiles?.email || 'System',
        actor_email: activity.profiles?.email
      })) || [];

      return {
        activities: transformedActivities,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching account activities:', error);
      throw error;
    }
  }

  async logActivity(activityData: {
    accountId: string;
    activityType: string;
    targetType: string;
    targetId: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; activityId?: string }> {
    try {
      const { data, error } = await supabase.rpc('log_account_activity', {
        p_account_id: activityData.accountId,
        p_activity_type: activityData.activityType,
        p_target_type: activityData.targetType,
        p_target_id: activityData.targetId,
        p_description: activityData.description,
        p_metadata: activityData.metadata || {}
      });

      if (error) throw error;

      return { success: true, activityId: data };
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  async getActivitySummary(): Promise<ActivitySummary[]> {
    try {
      const { data, error } = await supabase
        .from('activity_summary_by_type')
        .select('*')
        .order('total_count', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      throw error;
    }
  }

  async getRecentActivities(limit: number = 25): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('recent_account_activities')
        .select('*')
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  // ========= PROFILE MANAGEMENT METHODS =========

  async getProfiles(filters: ProfileFilters = {}): Promise<ProfileResponse> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          account_id,
          status,
          phone,
          avatar_url,
          last_login_at,
          login_count,
          is_verified,
          admin_notes,
          auth_sync_status,
          metadata,
          preferences,
          timezone,
          created_at,
          updated_at
        `, { count: 'exact' });

      // Filter by account if specified
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }

      // Filter out deleted profiles by default
      if (!filters.includeDeleted) {
        query = query.neq('status', 'deleted');
      }

      // Apply other filters
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      // Apply sorting
      let sortField = filters.sortBy || 'created_at';
      const validSortFields = ['email', 'full_name', 'role', 'status', 'last_login_at', 'created_at', 'updated_at'];
      
      if (!validSortFields.includes(sortField)) {
        console.warn(`Invalid sort field '${sortField}', defaulting to 'created_at'`);
        sortField = 'created_at';
      }
      
      const ascending = filters.sortOrder === 'asc';
      query = query.order(sortField, { ascending });

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 25;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: profiles, error, count } = await query;

      if (error) {
        console.error('Database error in getProfiles:', error);
        throw error;
      }

      return {
        profiles: profiles || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }
  }

  async getProfile(profileId: string): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          account_id,
          status,
          phone,
          avatar_url,
          last_login_at,
          login_count,
          is_verified,
          admin_notes,
          auth_sync_status,
          metadata,
          preferences,
          timezone,
          created_at,
          updated_at
        `)
        .eq('id', profileId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async createProfile(profileData: {
    email: string;
    full_name?: string;
    role?: string;
    account_id: string;
    phone?: string;
    admin_notes?: string;
  }): Promise<{ success: boolean; profile?: Profile; message: string }> {
    try {
      // Validate profile data
      const validation = await this.validateProfileData(profileData, false);
      if (!validation.isValid) {
        return {
          success: false,
          message: Object.values(validation.errors).flat().join(', ')
        };
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert([{
          email: profileData.email.trim().toLowerCase(),
          full_name: profileData.full_name?.trim() || null,
          role: profileData.role || 'user',
          account_id: profileData.account_id,
          phone: profileData.phone?.trim() || null,
          admin_notes: profileData.admin_notes?.trim() || null,
          status: 'pending', // New profiles start as pending
          auth_sync_status: 'pending',
          metadata: {},
          preferences: {},
          timezone: 'UTC',
          login_count: 0,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return {
          success: false,
          message: error.message || 'Failed to create profile'
        };
      }

      // Log activity
      await this.logActivity({
        accountId: profileData.account_id,
        activityType: 'profile_created',
        targetType: 'profile',
        targetId: profile.id,
        description: `Profile "${profile.email}" was created`,
        metadata: { 
          email: profile.email,
          role: profile.role
        }
      });

      return {
        success: true,
        profile,
        message: 'Profile created successfully'
      };
    } catch (error) {
      console.error('Error creating profile:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while creating the profile'
      };
    }
  }

  async updateProfile(profileId: string, updates: {
    email?: string;
    full_name?: string;
    role?: string;
    phone?: string;
    admin_notes?: string;
    status?: string;
  }): Promise<{ success: boolean; profile?: Profile; message: string }> {
    try {
      // Get current profile for comparison
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (fetchError || !currentProfile) {
        return {
          success: false,
          message: 'Profile not found'
        };
      }

      // Validate profile data if email is being updated
      if (updates.email) {
        const validation = await this.validateProfileData(
          { ...currentProfile, ...updates } as any,
          true,
          profileId
        );
        if (!validation.isValid) {
          return {
            success: false,
            message: Object.values(validation.errors).flat().join(', ')
          };
        }
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.email !== undefined) updateData.email = updates.email.trim().toLowerCase();
      if (updates.full_name !== undefined) updateData.full_name = updates.full_name?.trim() || null;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.phone !== undefined) updateData.phone = updates.phone?.trim() || null;
      if (updates.admin_notes !== undefined) updateData.admin_notes = updates.admin_notes?.trim() || null;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return {
          success: false,
          message: error.message || 'Failed to update profile'
        };
      }

      // Log activity with changes
      const changes = Object.keys(updates).filter(key => 
        updates[key as keyof typeof updates] !== currentProfile[key]
      );

      if (changes.length > 0) {
        await this.logActivity({
          accountId: currentProfile.account_id,
          activityType: 'profile_updated',
          targetType: 'profile',
          targetId: profile.id,
          description: `Profile "${profile.email}" was updated (${changes.join(', ')})`,
          metadata: { 
            changes,
            previousValues: Object.fromEntries(
              changes.map(key => [key, currentProfile[key]])
            ),
            newValues: Object.fromEntries(
              changes.map(key => [key, updates[key as keyof typeof updates]])
            )
          }
        });
      }

      return {
        success: true,
        profile,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while updating the profile'
      };
    }
  }

  async deleteProfile(profileId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get profile details before deletion for logging
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .neq('status', 'deleted')
        .single();

      if (fetchError || !profile) {
        return {
          success: false,
          message: 'Profile not found or already deleted'
        };
      }

      // Soft delete: Update status to 'deleted' instead of removing record
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (updateError) {
        console.error('Error soft deleting profile:', updateError);
        return {
          success: false,
          message: updateError.message || 'Failed to delete profile'
        };
      }

      // Log activity after successful soft deletion
      await this.logActivity({
        accountId: profile.account_id,
        activityType: 'profile_deleted',
        targetType: 'profile',
        targetId: profile.id,
        description: `Profile "${profile.email}" was soft deleted (status set to deleted)`,
        metadata: { 
          email: profile.email,
          role: profile.role,
          previousStatus: profile.status,
          deletedAt: new Date().toISOString(),
          softDelete: true
        }
      });

      return {
        success: true,
        message: 'Profile deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting profile:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while deleting the profile'
      };
    }
  }

  async restoreProfile(profileId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get profile details to verify it's deleted
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .eq('status', 'deleted')
        .single();

      if (fetchError || !profile) {
        return {
          success: false,
          message: 'Profile not found or not deleted'
        };
      }

      // Restore profile by setting status back to pending (requires admin review)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (updateError) {
        console.error('Error restoring profile:', updateError);
        return {
          success: false,
          message: updateError.message || 'Failed to restore profile'
        };
      }

      // Log activity after successful restoration
      await this.logActivity({
        accountId: profile.account_id,
        activityType: 'profile_restored',
        targetType: 'profile',
        targetId: profile.id,
        description: `Profile "${profile.email}" was restored from deleted status`,
        metadata: { 
          email: profile.email,
          role: profile.role,
          restoredAt: new Date().toISOString()
        }
      });

      return {
        success: true,
        message: 'Profile restored successfully'
      };
    } catch (error) {
      console.error('Error restoring profile:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while restoring the profile'
      };
    }
  }

  async validateProfileData(profileData: {
    email: string;
    full_name?: string;
    role?: string;
    account_id: string;
    phone?: string;
  }, isUpdate: boolean = false, profileId?: string): Promise<{ 
    isValid: boolean; 
    errors: Record<string, string[]> 
  }> {
    const errors: Record<string, string[]> = {};

    // Validate email
    if (!profileData.email || profileData.email.trim().length === 0) {
      errors.email = ['Email is required'];
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email.trim())) {
        errors.email = ['Invalid email format'];
      }
    }

    // Validate account_id
    if (!profileData.account_id) {
      errors.account_id = ['Account ID is required'];
    }

    // Validate phone if provided
    if (profileData.phone && profileData.phone.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(profileData.phone.trim())) {
        errors.phone = ['Invalid phone number format'];
      }
    }

    // Check for duplicate email (case-insensitive)
    if (profileData.email && profileData.email.trim()) {
      try {
        let query = supabase
          .from('profiles')
          .select('id, email')
          .ilike('email', profileData.email.trim());

        // Exclude current profile when updating
        if (isUpdate && profileId) {
          query = query.neq('id', profileId);
        }

        const { data: existingProfiles } = await query;

        if (existingProfiles && existingProfiles.length > 0) {
          errors.email = errors.email || [];
          errors.email.push('A profile with this email already exists');
        }
      } catch (error) {
        console.error('Error checking email uniqueness:', error);
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Account Management Methods
  async getAccounts(filters: AccountFilters = {}): Promise<AccountResponse> {
    try {
      let query = supabase
        .from('accounts')
        .select(`
          id,
          name,
          type,
          status,
          address,
          logo_url,
          website_url,
          contact_email,
          stripe_customer_id,
          auto_link_new_clients,
          created_at,
          updated_at,
          profiles(count)
        `, { count: 'exact' });

      // Filter out deleted accounts by default (unless includeDeleted is true)
      if (!filters.includeDeleted) {
        query = query.neq('status', 'deleted');
      }

      // Filter out admin and client account types (managed elsewhere)
      query = query.not('type', 'in', '(admin,client)');

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply sorting - validate sort field to prevent SQL errors
      let sortField = filters.sortBy || 'created_at';
      const validSortFields = ['name', 'type', 'status', 'created_at', 'updated_at'];
      
      // Ensure the sort field is valid
      if (!validSortFields.includes(sortField)) {
        console.warn(`Invalid sort field '${sortField}', defaulting to 'created_at'`);
        sortField = 'created_at';
      }
      
      const ascending = filters.sortOrder === 'asc';
      query = query.order(sortField, { ascending });

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 25; // Match the frontend default
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: accounts, error, count } = await query;

      if (error) {
        console.error('Database error in getAccounts:', error);
        throw error;
      }

      return {
        accounts: accounts || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  async getAccount(accountId: string): Promise<Account> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          id,
          name,
          type,
          status,
          address,
          logo_url,
          website_url,
          stripe_customer_id,
          auto_link_new_clients,
          created_at,
          updated_at,
          profiles(count)
        `)
        .eq('id', accountId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  }

  // Bulk Operations
  async exportActivities(
    accountId: string, 
    filters: ActivityFilters & { format: 'csv' | 'pdf' | 'json' }
  ): Promise<{ success: boolean; downloadUrl?: string }> {
    try {
      // Get all activities for export (without pagination)
      const { activities } = await this.getAccountActivities(accountId, {
        ...filters,
        limit: 10000, // Large limit for export
        page: 1
      });

      // Format data based on requested format
      if (filters.format === 'csv') {
        const csvData = this.formatActivitiesAsCsv(activities);
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `account_activities_${accountId}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true };
      }

      // For other formats, implement as needed
      throw new Error(`Export format ${filters.format} not yet implemented`);
    } catch (error) {
      console.error('Error exporting activities:', error);
      throw error;
    }
  }

  private formatActivitiesAsCsv(activities: Activity[]): string {
    const headers = [
      'Date', 'Activity Type', 'Description', 'Actor', 'Target Type', 'Target ID', 'IP Address'
    ];

    const rows = activities.map(activity => [
      new Date(activity.created_at).toISOString(),
      activity.activity_type,
      activity.description,
      activity.actor_name || 'System',
      activity.target_type,
      activity.target_id,
      activity.ip_address || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // Performance monitoring
  async getActivityMetrics(accountId?: string): Promise<{
    totalActivities: number;
    recentActivities: number;
    topActivityTypes: { type: string; count: number }[];
    activityTrends: { date: string; count: number }[];
  }> {
    try {
      // Get basic counts
      let countQuery = supabase
        .from('account_activities')
        .select('*', { count: 'exact', head: true });

      let recentQuery = supabase
        .from('account_activities')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (accountId) {
        countQuery = countQuery.eq('account_id', accountId);
        recentQuery = recentQuery.eq('account_id', accountId);
      }

      const [totalResult, recentResult] = await Promise.all([
        countQuery,
        recentQuery
      ]);

      // Get top activity types
      let typesQuery = supabase
        .from('account_activities')
        .select('activity_type')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (accountId) {
        typesQuery = typesQuery.eq('account_id', accountId);
      }

      const { data: typeData } = await typesQuery;

      // Process activity types
      const typeCounts: Record<string, number> = {};
      typeData?.forEach(activity => {
        typeCounts[activity.activity_type] = (typeCounts[activity.activity_type] || 0) + 1;
      });

      const topActivityTypes = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get activity trends (daily counts for last 30 days)
      const trendPromises = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

        let trendQuery = supabase
          .from('account_activities')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart)
          .lt('created_at', dayEnd);

        if (accountId) {
          trendQuery = trendQuery.eq('account_id', accountId);
        }

        return trendQuery.then(result => ({
          date: dayStart.split('T')[0],
          count: result.count || 0
        }));
      });

      const activityTrends = await Promise.all(trendPromises);

      return {
        totalActivities: totalResult.count || 0,
        recentActivities: recentResult.count || 0,
        topActivityTypes,
        activityTrends: activityTrends.reverse() // Most recent first
      };
    } catch (error) {
      console.error('Error fetching activity metrics:', error);
      throw error;
    }
  }

  // ========= ACCOUNT CRUD OPERATIONS =========

  async createAccount(accountData: {
    name: string;
    type: string;
    address?: string;
    website_url?: string;
    logo_url?: string;
    contact_email?: string;
    auto_link_new_clients?: boolean;
  }): Promise<{ success: boolean; account?: Account; message: string }> {
    try {
      // Use the admin-service edge function for account creation with Stripe integration
      const { data, error } = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/create-account',
          name: accountData.name.trim(),
          type: accountData.type,
          address: accountData.address?.trim() || null,
          website_url: accountData.website_url?.trim() || null,
          logo_url: accountData.logo_url?.trim() || null,
          contact_email: accountData.contact_email?.trim() || null,
          auto_link_new_clients: accountData.auto_link_new_clients || false,
        },
      });

      if (error) {
        console.error('Error creating account via edge function:', error);
        return {
          success: false,
          message: error.message || 'Failed to create account'
        };
      }

      const account = data.account;

      // Log activity
      await this.logActivity({
        accountId: account.id,
        activityType: 'account_created',
        targetType: 'account',
        targetId: account.id,
        description: `Account "${account.name}" was created${data.stripe_customer_id ? ' with Stripe integration' : ''}`,
        metadata: { 
          accountType: account.type,
          hasStripeCustomer: !!data.stripe_customer_id,
          stripeCustomerId: data.stripe_customer_id || null
        }
      });

      return {
        success: true,
        account,
        message: data.message || 'Account created successfully'
      };
    } catch (error) {
      console.error('Error creating account:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while creating the account'
      };
    }
  }

  async updateAccount(accountId: string, updates: {
    name?: string;
    type?: string;
    address?: string;
    website_url?: string;
    logo_url?: string;
    contact_email?: string;
    auto_link_new_clients?: boolean;
  }): Promise<{ success: boolean; account?: Account; message: string }> {
    try {
      // Get current account for comparison
      const { data: currentAccount, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (fetchError || !currentAccount) {
        return {
          success: false,
          message: 'Account not found'
        };
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name.trim();
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.address !== undefined) updateData.address = updates.address?.trim() || null;
      if (updates.website_url !== undefined) updateData.website_url = updates.website_url?.trim() || null;
      if (updates.logo_url !== undefined) updateData.logo_url = updates.logo_url?.trim() || null;
      if (updates.contact_email !== undefined) updateData.contact_email = updates.contact_email?.trim() || null;
      if (updates.auto_link_new_clients !== undefined) updateData.auto_link_new_clients = updates.auto_link_new_clients;

      const { data: account, error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', accountId)
        .select()
        .single();

      if (error) {
        console.error('Error updating account:', error);
        return {
          success: false,
          message: error.message || 'Failed to update account'
        };
      }

      // Log activity with changes
      const changes = Object.keys(updates).filter(key => 
        updates[key as keyof typeof updates] !== currentAccount[key]
      );

      if (changes.length > 0) {
        await this.logActivity({
          accountId: account.id,
          activityType: 'account_updated',
          targetType: 'account',
          targetId: account.id,
          description: `Account "${account.name}" was updated (${changes.join(', ')})`,
          metadata: { 
            changes,
            previousValues: Object.fromEntries(
              changes.map(key => [key, currentAccount[key]])
            ),
            newValues: Object.fromEntries(
              changes.map(key => [key, updates[key as keyof typeof updates]])
            )
          }
        });
      }

      return {
        success: true,
        account,
        message: 'Account updated successfully'
      };
    } catch (error) {
      console.error('Error updating account:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while updating the account'
      };
    }
  }

  async deleteAccount(accountId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get account details before deletion for logging
      const { data: account, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .neq('status', 'deleted') // Only get non-deleted accounts
        .single();

      if (fetchError || !account) {
        return {
          success: false,
          message: 'Account not found or already deleted'
        };
      }

      // Soft delete: Update status to 'deleted' instead of removing record
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (updateError) {
        console.error('Error soft deleting account:', updateError);
        return {
          success: false,
          message: updateError.message || 'Failed to delete account'
        };
      }

      // Log activity after successful soft deletion
      await this.logActivity({
        accountId: account.id,
        activityType: 'account_deleted',
        targetType: 'account',
        targetId: account.id,
        description: `Account "${account.name}" was soft deleted (status set to deleted)`,
        metadata: { 
          accountType: account.type,
          previousStatus: account.status,
          deletedAt: new Date().toISOString(),
          softDelete: true
        }
      });

      return {
        success: true,
        message: 'Account deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting account:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while deleting the account'
      };
    }
  }

  async validateAccountData(accountData: {
    name: string;
    type: string;
    address?: string;
    website_url?: string;
    logo_url?: string;
    contact_email?: string;
    auto_link_new_clients?: boolean;
  }, isUpdate: boolean = false, accountId?: string): Promise<{ 
    isValid: boolean; 
    errors: Record<string, string[]> 
  }> {
    const errors: Record<string, string[]> = {};

    // Validate name
    if (!accountData.name || accountData.name.trim().length === 0) {
      errors.name = ['Account name is required'];
    } else if (accountData.name.trim().length < 2) {
      errors.name = ['Account name must be at least 2 characters long'];
    } else if (accountData.name.trim().length > 100) {
      errors.name = ['Account name must be less than 100 characters'];
    }

    // Validate type
    const validTypes = ['admin', 'client', 'affiliate', 'expert', 'operator'];
    if (!accountData.type || !validTypes.includes(accountData.type)) {
      errors.type = [`Account type must be one of: ${validTypes.join(', ')}`];
    }

    // Validate contact email
    if (accountData.type !== 'admin') {
      // Contact email is required for non-admin accounts (for Stripe integration)
      if (!accountData.contact_email || accountData.contact_email.trim().length === 0) {
        errors.contact_email = ['Contact email is required for billing integration'];
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(accountData.contact_email.trim())) {
          errors.contact_email = ['Invalid email format'];
        }
      }
    } else if (accountData.contact_email && accountData.contact_email.trim()) {
      // If provided for admin accounts, validate format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(accountData.contact_email.trim())) {
        errors.contact_email = ['Invalid email format'];
      }
    }

    // Validate website URL if provided
    if (accountData.website_url && accountData.website_url.trim()) {
      try {
        new URL(accountData.website_url.trim());
      } catch {
        errors.website_url = ['Invalid website URL format'];
      }
    }

    // Validate auto_link_new_clients setting
    if (accountData.auto_link_new_clients === true) {
      // Only operator, affiliate, and expert accounts can auto-link to clients
      if (!['operator', 'affiliate', 'expert'].includes(accountData.type)) {
        errors.auto_link_new_clients = ['Auto-linking to new clients is only available for operator, affiliate, and expert account types'];
      }
    }

    // Check for duplicate account names (case-insensitive)
    if (accountData.name && accountData.name.trim()) {
      try {
        let query = supabase
          .from('accounts')
          .select('id, name')
          .ilike('name', accountData.name.trim());

        // Exclude current account when updating
        if (isUpdate && accountId) {
          query = query.neq('id', accountId);
        }

        const { data: existingAccounts } = await query;

        if (existingAccounts && existingAccounts.length > 0) {
          errors.name = errors.name || [];
          errors.name.push('An account with this name already exists');
        }
      } catch (error) {
        console.error('Error checking account name uniqueness:', error);
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  async restoreAccount(accountId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get account details to verify it's deleted
      const { data: account, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('status', 'deleted')
        .single();

      if (fetchError || !account) {
        return {
          success: false,
          message: 'Account not found or not deleted'
        };
      }

      // Restore account by setting status back to active
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (updateError) {
        console.error('Error restoring account:', updateError);
        return {
          success: false,
          message: updateError.message || 'Failed to restore account'
        };
      }

      // Log activity after successful restoration
      await this.logActivity({
        accountId: account.id,
        activityType: 'account_restored',
        targetType: 'account',
        targetId: account.id,
        description: `Account "${account.name}" was restored from deleted status`,
        metadata: { 
          accountType: account.type,
          restoredAt: new Date().toISOString()
        }
      });

      return {
        success: true,
        message: 'Account restored successfully'
      };
    } catch (error) {
      console.error('Error restoring account:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while restoring the account'
      };
    }
  }

  // Auth User Management Methods
  async checkAuthUserExists(email: string): Promise<boolean> {
    try {
      // Call the secure edge function endpoint instead of direct supabase.auth.admin
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
      const response = await fetch(`${functionsUrl}/admin-service/check-auth-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      if (!response.ok) {
        console.error('Error checking auth user existence via edge function:', response.status, response.statusText);
        return false;
      }

      const data = await response.json();
      return data?.exists || false;
    } catch (error) {
      console.error('Error checking auth user existence:', error);
      return false;
    }
  }

  async createAuthUser(email: string, password: string = 'TempPass123!'): Promise<{ 
    success: boolean; 
    userId?: string; 
    message: string; 
    temporaryPassword?: string;
  }> {
    try {
      // Call the secure edge function endpoint instead of direct supabase.auth.admin
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
      const response = await fetch(`${functionsUrl}/admin-service/create-auth-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(),
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error creating auth user via edge function:', response.status, response.statusText, errorData);
        return {
          success: false,
          message: errorData.error || 'Failed to create user login'
        };
      }

      const data = await response.json();

      if (!data?.success) {
        return {
          success: false,
          message: data?.error || 'Failed to create user login'
        };
      }

      return {
        success: true,
        userId: data.userId,
        message: data.message || 'User login created successfully',
        temporaryPassword: data.temporaryPassword
      };
    } catch (error) {
      console.error('Error creating auth user:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while creating user login'
      };
    }
  }

  async createProfileWithAuth(profileData: {
    email: string;
    full_name?: string;
    role?: string;
    account_id: string;
    phone?: string;
    status?: string;
  }, createLogin: boolean = false): Promise<{ 
    success: boolean; 
    profile?: Profile; 
    message: string;
    temporaryPassword?: string;
  }> {
    try {
      if (createLogin) {
        // Call the secure edge function endpoint instead of direct supabase.auth.admin
        const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
        const response = await fetch(`${functionsUrl}/admin-service/create-profile-with-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            email: profileData.email.trim().toLowerCase(),
            full_name: profileData.full_name?.trim() || null,
            role: profileData.role || 'user',
            account_id: profileData.account_id,
            phone: profileData.phone?.trim() || null,
            status: profileData.status || 'pending',
            createLogin: true,
            password: 'TempPass123!'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error creating profile with auth via edge function:', response.status, response.statusText, errorData);
          return {
            success: false,
            message: errorData.error || 'Failed to create profile with login'
          };
        }

        const data = await response.json();

        if (!data?.success) {
          return {
            success: false,
            message: data?.error || 'Failed to create profile with login'
          };
        }

        return {
          success: true,
          profile: data.profile,
          message: data.message || 'Profile and user login created successfully',
          temporaryPassword: data.temporaryPassword
        };
      } else {
        // Create profile only (without login) - use existing method
        const profileResult = await this.createProfile(profileData);
        return profileResult;
      }
    } catch (error) {
      console.error('Error creating profile with auth:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while creating the profile'
      };
    }
  }

  // ========= CLIENT LINK OPERATIONS =========

  async getAccountClientLinks(accountId: string): Promise<{
    success: boolean;
    links: any[];
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('account_client_access')
        .select(`
          id,
          client_id,
          access_level,
          granted_at,
          granted_by,
          clients!inner(
            id,
            full_name,
            email,
            account:accounts!inner(name)
          )
        `)
        .eq('account_id', accountId);

      if (error) {
        console.error('Error fetching client links:', error);
        return {
          success: false,
          links: [],
          message: 'Failed to fetch client links'
        };
      }

      const links = data?.map(link => ({
        id: link.id,
        client_id: link.client_id,
        client_name: link.clients.full_name,
        client_email: link.clients.email,
        client_account_name: link.clients.account?.name || 'Unknown',
        access_level: link.access_level,
        granted_at: link.granted_at,
        granted_by: link.granted_by
      })) || [];

      return {
        success: true,
        links
      };
    } catch (error) {
      console.error('Error in getAccountClientLinks:', error);
      return {
        success: false,
        links: [],
        message: 'An unexpected error occurred'
      };
    }
  }

  async getUnlinkedClients(accountId: string): Promise<{
    success: boolean;
    clients: any[];
    message?: string;
  }> {
    try {
      // First, get all client IDs that are already linked to this account
      const { data: linkedClientIds, error: linkedError } = await supabase
        .from('account_client_access')
        .select('client_id')
        .eq('account_id', accountId);

      if (linkedError) {
        console.error('Error fetching linked client IDs:', linkedError);
        return {
          success: false,
          clients: [],
          message: 'Failed to fetch linked clients'
        };
      }

      const linkedIds = linkedClientIds?.map(link => link.client_id) || [];

      // Then get all clients that are NOT in the linked IDs list
      let query = supabase
        .from('clients')
        .select(`
          id,
          full_name,
          email,
          account:accounts!inner(name)
        `);

      // If there are linked clients, exclude them
      if (linkedIds.length > 0) {
        query = query.not('id', 'in', `(${linkedIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching unlinked clients:', error);
        return {
          success: false,
          clients: [],
          message: 'Failed to fetch unlinked clients'
        };
      }

      const clients = data?.map(client => ({
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        account_name: client.account?.name || 'Unknown'
      })) || [];

      return {
        success: true,
        clients
      };
    } catch (error) {
      console.error('Error in getUnlinkedClients:', error);
      return {
        success: false,
        clients: [],
        message: 'An unexpected error occurred'
      };
    }
  }

  async updateAutoLinkSetting(accountId: string, autoLink: boolean): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ auto_link_new_clients: autoLink })
        .eq('id', accountId);

      if (error) {
        console.error('Error updating auto-link setting:', error);
        return {
          success: false,
          message: 'Failed to update auto-link setting'
        };
      }

      return {
        success: true,
        message: 'Auto-link setting updated successfully'
      };
    } catch (error) {
      console.error('Error in updateAutoLinkSetting:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  async createClientLinks(accountId: string, clientIds: string[], accessLevel: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const grantedBy = user?.id || null;

      const linkRecords = clientIds.map(clientId => ({
        account_id: accountId,
        client_id: clientId,
        access_level: accessLevel,
        granted_by: grantedBy,
        granted_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('account_client_access')
        .insert(linkRecords);

      if (error) {
        console.error('Error creating client links:', error);
        return {
          success: false,
          message: 'Failed to create client links'
        };
      }

      return {
        success: true,
        message: `Successfully linked ${clientIds.length} client${clientIds.length !== 1 ? 's' : ''}`
      };
    } catch (error) {
      console.error('Error in createClientLinks:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  async updateClientLinkAccess(linkId: string, accessLevel: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('account_client_access')
        .update({ access_level: accessLevel })
        .eq('id', linkId);

      if (error) {
        console.error('Error updating client link access:', error);
        return {
          success: false,
          message: 'Failed to update access level'
        };
      }

      return {
        success: true,
        message: 'Access level updated successfully'
      };
    } catch (error) {
      console.error('Error in updateClientLinkAccess:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  async deleteClientLink(linkId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('account_client_access')
        .delete()
        .eq('id', linkId);

      if (error) {
        console.error('Error deleting client link:', error);
        return {
          success: false,
          message: 'Failed to delete client link'
        };
      }

      return {
        success: true,
        message: 'Client link deleted successfully'
      };
    } catch (error) {
      console.error('Error in deleteClientLink:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }
}

export default AdminAccountService;