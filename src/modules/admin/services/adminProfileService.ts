// Epic 3 Sprint 3 + 4: Admin Profile Service with Billing
// File: adminProfileService.ts
// Purpose: Comprehensive profile management with CRUD operations, auth sync, role management, and billing
// Stories: 3.1-3.5 (Profile Management) + 4.1 (Billing Management System)

import { supabase } from '../../../lib/supabase';

// Types for profile management
export interface ProfileSummary {
  id: string;
  full_name: string | null;
  email: string;
  role: 'admin' | 'affiliate';
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'locked';
  account_id: string | null;
  account_name: string | null;
  account_type: string | null;
  last_login_at: string | null;
  login_count: number;
  is_verified: boolean;
  auth_sync_status: 'synced' | 'pending' | 'conflict' | 'error' | 'requires_attention';
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  days_since_last_login: number | null;
  total_activities: number;
  active_roles: number;
  active_permissions: number;
  unresolved_conflicts: number;
}

export interface ProfileDetails extends ProfileSummary {
  admin_notes: string | null;
  timezone: string;
  preferences: Record<string, any>;
  metadata: Record<string, any>;
  last_seen_at: string | null;
  two_factor_enabled: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  verification_token: string | null;
  backup_codes: string[] | null;
  roles: ProfileRole[];
  permissions: ProfilePermission[];
  recent_activities: ProfileActivity[];
}

export interface ProfileRole {
  id: string;
  role_name: string;
  scope: 'global' | 'account' | 'tool' | 'client' | 'project';
  scope_id: string | null;
  granted_by: string | null;
  granted_by_name: string | null;
  granted_at: string;
  expires_at: string | null;
  is_expired: boolean;
  expires_soon: boolean | null;
  is_active: boolean;
  notes: string | null;
  metadata: Record<string, any>;
  role_display_name: string | null;
  role_description: string | null;
  role_hierarchy_level: number | null;
}

export interface ProfilePermission {
  id: string;
  permission_name: string;
  resource_type: string;
  resource_id: string | null;
  action: string;
  granted_by: string | null;
  granted_by_name: string | null;
  granted_at: string;
  expires_at: string | null;
  conditions: Record<string, any>;
  metadata: Record<string, any>;
  is_active: boolean;
}

export interface RoleDefinition {
  id: string;
  role_name: string;
  display_name: string;
  description: string;
  is_system_role: boolean;
  default_permissions: string[];
  role_hierarchy_level: number;
  can_assign_roles: string[];
  max_scope: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleAssignmentData {
  role_name: string;
  scope?: 'global' | 'account' | 'tool' | 'client' | 'project';
  scope_id?: string;
  expires_at?: string;
  notes?: string;
}

export interface PermissionGrantData {
  permission_name: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  expires_at?: string;
  conditions?: Record<string, any>;
}

export interface EffectivePermission {
  permission_source: 'direct' | 'role';
  permission_name: string;
  resource_type: string;
  resource_id: string | null;
  action: string;
  scope: string;
  expires_at: string | null;
  conditions: Record<string, any>;
}

export interface ProfileActivity {
  id: string;
  activity_type: string;
  target_type: string;
  target_id: string;
  description: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  success: boolean;
  error_details: string | null;
  duration_ms: number | null;
  created_at: string;
  actor_name: string | null;
}

export interface ProfileFilters {
  search?: string;
  status?: string;
  role?: string;
  accountType?: string;
  syncStatus?: string;
  verificationStatus?: 'verified' | 'unverified';
  lastLoginRange?: 'never' | 'last_7_days' | 'last_30_days' | 'over_30_days';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProfileData {
  email: string;
  full_name: string;
  role: 'admin' | 'affiliate';
  account_id?: string;
  phone?: string;
  timezone?: string;
  status?: 'active' | 'pending';
  admin_notes?: string;
  metadata?: Record<string, any>;
  preferences?: Record<string, any>;
  send_invitation?: boolean;
}

export interface UpdateProfileData {
  full_name?: string;
  email?: string;
  role?: 'admin' | 'affiliate';
  status?: 'active' | 'inactive' | 'suspended' | 'pending' | 'locked';
  account_id?: string;
  phone?: string;
  timezone?: string;
  admin_notes?: string;
  metadata?: Record<string, any>;
  preferences?: Record<string, any>;
  is_verified?: boolean;
  two_factor_enabled?: boolean;
  reset_failed_attempts?: boolean;
}

export interface AuthSyncData {
  email: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncConflict {
  id: string;
  profile_id: string | null;
  auth_user_id: string | null;
  conflict_type: 'email_mismatch' | 'profile_missing' | 'auth_missing' | 'data_inconsistency' | 'role_mismatch' | 'status_mismatch' | 'metadata_conflict';
  profile_data: Record<string, any>;
  auth_data: Record<string, any>;
  resolution_strategy: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BulkProfileOperation {
  profileIds: string[];
  operation: 'update_status' | 'assign_role' | 'remove_role' | 'sync_auth' | 'reset_password' | 'verify_email';
  data?: Record<string, any>;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: { profileId: string; error: string }[];
  operationId: string;
  results?: any[];
}

export interface EnhancedBulkOperation {
  id: string;
  operationType: 'update_status' | 'assign_role' | 'revoke_role' | 'grant_permission' | 'revoke_permission' | 'sync_auth' | 'verify_email' | 'reset_password' | 'update_metadata' | 'merge_profiles' | 'archive_profiles' | 'transfer_ownership' | 'bulk_invite';
  operationName: string;
  targetProfileIds: string[];
  operationData: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface BulkOperationStatus {
  id: string;
  operationType: string;
  operationName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
  totalTargets: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  progressPercentage: number;
  canRollback: boolean;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedCompletionAt: string | null;
  initiatedByName: string | null;
  initiatedByEmail: string | null;
  durationSeconds: number | null;
  overallStatus: 'success' | 'partial' | 'failed' | 'rolled_back' | 'pending' | 'running';
}

export interface BulkOperationDetails extends BulkOperationStatus {
  results: BulkOperationTargetResult[];
  errors: Record<string, any>[];
  rollbackData: Record<string, any>;
  metadata: Record<string, any>;
}

export interface BulkOperationTargetResult {
  id: string;
  targetProfileId: string;
  sequenceNumber: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'rolled_back';
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  success: boolean;
  resultData: Record<string, any>;
  errorMessage: string | null;
  errorCode: string | null;
  retryCount: number;
  rolledBack: boolean;
}

export interface ActivitySummary {
  totalActivities: number;
  successfulActivities: number;
  failedActivities: number;
  successRate: number;
  uniqueProfiles: number;
  activityTypes: Record<string, number>;
  activityCategories: Record<string, number>;
  riskDistribution: Record<string, number>;
  peakActivityHour: number | null;
  mostActiveProfile: {
    profileId: string;
    profileName: string;
    profileEmail: string;
    activityCount: number;
  } | null;
}

// ========= EPIC 4 SPRINT 4: BILLING MANAGEMENT INTERFACES =========

export interface SubscriptionPlan {
  id: string;
  planCode: string;
  planName: string;
  description: string | null;
  planType: 'one_time' | 'recurring' | 'usage_based';
  billingInterval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  intervalCount: number;
  priceCents: number;
  currency: string;
  trialPeriodDays: number;
  maxUsers: number | null;
  maxTools: number | null;
  features: Record<string, any>;
  isActive: boolean;
  stripePriceId: string | null;
  squareCatalogId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSubscription {
  id: string;
  accountId: string;
  planId: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  endedAt: string | null;
  stripeSubscriptionId: string | null;
  squareSubscriptionId: string | null;
  paymentMethodId: string | null;
  billingContactProfileId: string | null;
  quantity: number;
  discountPercent: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  plan: {
    planCode: string;
    planName: string;
    description: string | null;
    priceCents: number;
    currency: string;
    billingInterval: string;
  } | null;
  paymentMethod: {
    methodType: string;
    lastFour: string | null;
    brand: string | null;
    expMonth: number | null;
    expYear: number | null;
  } | null;
}

export interface AccountInvoice {
  id: string;
  accountId: string;
  subscriptionId: string | null;
  invoiceNumber: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  dueDate: string | null;
  paidAt: string | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  billingAddress: Record<string, any>;
  notes: string | null;
  pdfUrl: string | null;
  stripeInvoiceId: string | null;
  squareInvoiceId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  subscription: {
    id: string;
    status: string;
    planId: string;
  } | null;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface PaymentHistory {
  id: string;
  accountId: string;
  subscriptionId: string | null;
  invoiceId: string | null;
  paymentMethodId: string | null;
  amountCents: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded' | 'partially_refunded';
  paymentType: 'subscription' | 'invoice' | 'one_time' | 'setup' | 'refund';
  description: string | null;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  squarePaymentId: string | null;
  gatewayResponse: Record<string, any>;
  failureReason: string | null;
  processedAt: string | null;
  refundedAt: string | null;
  refundAmountCents: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  paymentMethod: {
    methodType: string;
    lastFour: string | null;
    brand: string | null;
  } | null;
  subscription: {
    id: string;
    status: string;
  } | null;
}

export interface BillingEvent {
  id: string;
  accountId: string;
  eventType: string;
  eventData: Record<string, any>;
  subscriptionId: string | null;
  paymentId: string | null;
  invoiceId: string | null;
  gatewayEventId: string | null;
  processed: boolean;
  processedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
}

export interface ActivityTimelineEntry {
  id: string;
  activityType: string;
  activityCategory: string;
  targetType: string;
  targetId: string | null;
  description: string;
  resultStatus: string;
  riskLevel: string;
  durationMs: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  timeAgo: string;
}

export interface SuspiciousActivity {
  profileId: string;
  profileName: string;
  profileEmail: string;
  suspiciousPattern: string;
  activityCount: number;
  riskScore: number;
  details: Record<string, any>;
  detectedAt: string;
}

export interface ActivityTrend {
  timeBucket: string;
  totalActivities: number;
  successfulActivities: number;
  failedActivities: number;
  uniqueProfiles: number;
  highRiskActivities: number;
}

export interface ProfileListResponse {
  profiles: ProfileSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: ProfileFilters;
}

export interface ProfileMetrics {
  total_profiles: number;
  active_profiles: number;
  inactive_profiles: number;
  pending_profiles: number;
  suspended_profiles: number;
  verified_profiles: number;
  unverified_profiles: number;
  profiles_with_2fa: number;
  sync_conflicts: number;
  recent_logins: number;
  never_logged_in: number;
  profiles_by_role: Record<string, number>;
  profiles_by_account_type: Record<string, number>;
}

class AdminProfileService {
  private static instance: AdminProfileService;

  private constructor() {}

  public static getInstance(): AdminProfileService {
    if (!AdminProfileService.instance) {
      AdminProfileService.instance = new AdminProfileService();
    }
    return AdminProfileService.instance;
  }

  // ========= PROFILE CRUD OPERATIONS =========

  async getProfiles(filters: ProfileFilters = {}): Promise<ProfileListResponse> {
    try {
      // Build the query with filters
      let query = supabase
        .from('profile_management_summary')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,account_name.ilike.%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.accountType) {
        query = query.eq('account_type', filters.accountType);
      }
      if (filters.syncStatus) {
        query = query.eq('auth_sync_status', filters.syncStatus);
      }
      if (filters.verificationStatus) {
        query = query.eq('is_verified', filters.verificationStatus === 'verified');
      }
      if (filters.lastLoginRange) {
        const now = new Date();
        switch (filters.lastLoginRange) {
          case 'never':
            query = query.is('last_login_at', null);
            break;
          case 'last_7_days':
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            query = query.gte('last_login_at', sevenDaysAgo.toISOString());
            break;
          case 'last_30_days':
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            query = query.gte('last_login_at', thirtyDaysAgo.toISOString());
            break;
          case 'over_30_days':
            const thirtyDaysAgoForOver = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            query = query.lt('last_login_at', thirtyDaysAgoForOver.toISOString());
            break;
        }
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'updated_at';
      const ascending = filters.sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: profiles, error, count } = await query;

      if (error) throw error;

      return {
        profiles: profiles || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        filters
      };
    } catch (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }
  }

  async getProfile(profileId: string): Promise<ProfileDetails> {
    try {
      // Get basic profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          account:accounts(id, name, type)
        `)
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // Get profile roles
      const { data: roles, error: rolesError } = await supabase
        .from('active_profile_roles')
        .select('*')
        .eq('profile_id', profileId);

      if (rolesError) throw rolesError;

      // Get profile permissions
      const { data: permissions, error: permissionsError } = await supabase
        .from('profile_permissions')
        .select(`
          *,
          granted_by_profile:profiles!profile_permissions_granted_by_fkey(full_name)
        `)
        .eq('profile_id', profileId)
        .eq('is_active', true);

      if (permissionsError) throw permissionsError;

      // Get recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('profile_activities')
        .select(`
          *,
          actor:profiles!profile_activities_actor_id_fkey(full_name)
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activitiesError) throw activitiesError;

      // Transform the data
      return {
        ...profile,
        account_name: profile.account?.name || null,
        account_type: profile.account?.type || null,
        days_since_last_login: profile.last_login_at 
          ? Math.floor((Date.now() - new Date(profile.last_login_at).getTime()) / (1000 * 60 * 60 * 24))
          : null,
        total_activities: activities?.length || 0,
        active_roles: roles?.length || 0,
        active_permissions: permissions?.length || 0,
        unresolved_conflicts: 0, // Would need separate query
        roles: roles?.map(role => ({
          ...role,
          granted_by_name: role.granted_by_name || null
        })) || [],
        permissions: permissions?.map(permission => ({
          ...permission,
          granted_by_name: permission.granted_by_profile?.full_name || null
        })) || [],
        recent_activities: activities?.map(activity => ({
          ...activity,
          actor_name: activity.actor?.full_name || null
        })) || []
      };
    } catch (error) {
      console.error('Error fetching profile details:', error);
      throw error;
    }
  }

  async createProfile(data: CreateProfileData): Promise<ProfileDetails> {
    try {
      // Validate email uniqueness
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single();

      if (existingProfile) {
        throw new Error('Profile with this email already exists');
      }

      // Check auth.users for existing user
      const { data: authUser } = await supabase.auth.admin.getUserByEmail(data.email);

      if (authUser?.user) {
        throw new Error('User with this email already exists in authentication system');
      }

      // Create the profile
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          email: data.email.toLowerCase(),
          full_name: data.full_name,
          role: data.role,
          account_id: data.account_id || null,
          phone: data.phone || null,
          timezone: data.timezone || 'UTC',
          status: data.status || 'pending',
          admin_notes: data.admin_notes || null,
          metadata: data.metadata || {},
          preferences: data.preferences || {},
          is_verified: false,
          auth_sync_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Log the creation activity
      await this.logProfileActivity({
        profileId: newProfile.id,
        activityType: 'profile_created',
        targetType: 'profile',
        targetId: newProfile.id,
        description: `Profile created for ${data.full_name} (${data.email})`,
        metadata: {
          action: 'create_profile',
          created_via: 'admin_interface',
          role: data.role,
          account_id: data.account_id,
          send_invitation: data.send_invitation
        }
      });

      // Send invitation if requested
      if (data.send_invitation) {
        await this.sendProfileInvitation(newProfile.id, {
          inviter_message: `Welcome to the platform! Your profile has been created with ${data.role} privileges.`
        });
      }

      return await this.getProfile(newProfile.id);
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(profileId: string, data: UpdateProfileData): Promise<ProfileDetails> {
    try {
      // Get current profile for comparison
      const currentProfile = await this.getProfile(profileId);

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.full_name !== undefined) updateData.full_name = data.full_name;
      if (data.email !== undefined) updateData.email = data.email.toLowerCase();
      if (data.role !== undefined) updateData.role = data.role;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.account_id !== undefined) updateData.account_id = data.account_id;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.timezone !== undefined) updateData.timezone = data.timezone;
      if (data.admin_notes !== undefined) updateData.admin_notes = data.admin_notes;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;
      if (data.preferences !== undefined) updateData.preferences = data.preferences;
      if (data.is_verified !== undefined) updateData.is_verified = data.is_verified;
      if (data.two_factor_enabled !== undefined) updateData.two_factor_enabled = data.two_factor_enabled;
      if (data.reset_failed_attempts) {
        updateData.failed_login_attempts = 0;
        updateData.locked_until = null;
      }

      // Check for email conflicts if email is changing
      if (data.email && data.email.toLowerCase() !== currentProfile.email) {
        const { data: conflictingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', data.email.toLowerCase())
          .neq('id', profileId)
          .single();

        if (conflictingProfile) {
          throw new Error('Another profile with this email already exists');
        }
      }

      // Perform the update
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;

      // Log the update activity
      const changedFields = Object.keys(updateData).filter(key => key !== 'updated_at');
      await this.logProfileActivity({
        profileId,
        activityType: 'profile_updated',
        targetType: 'profile',
        targetId: profileId,
        description: `Profile updated: ${changedFields.join(', ')} changed`,
        metadata: {
          action: 'update_profile',
          changed_fields: changedFields,
          old_values: Object.fromEntries(changedFields.map(field => [field, currentProfile[field as keyof ProfileDetails]])),
          new_values: Object.fromEntries(changedFields.map(field => [field, updateData[field]])),
          updated_via: 'admin_interface'
        }
      });

      return await this.getProfile(profileId);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async deleteProfile(profileId: string): Promise<void> {
    try {
      // Get profile for logging
      const profile = await this.getProfile(profileId);

      // Check for dependencies that prevent deletion
      const canDelete = await this.canDeleteProfile(profileId);
      if (!canDelete.allowed) {
        throw new Error(`Cannot delete profile: ${canDelete.reason}`);
      }

      // Log the deletion before deleting
      await this.logProfileActivity({
        profileId,
        activityType: 'profile_deleted',
        targetType: 'profile',
        targetId: profileId,
        description: `Profile deleted: ${profile.full_name} (${profile.email})`,
        metadata: {
          action: 'delete_profile',
          deleted_profile_data: profile,
          deletion_reason: 'admin_request',
          deleted_via: 'admin_interface'
        }
      });

      // Delete the profile (CASCADE will handle related records)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  // ========= ROLE AND PERMISSION MANAGEMENT =========

  async getRoleDefinitions(): Promise<RoleDefinition[]> {
    try {
      const { data: roles, error } = await supabase
        .from('role_definitions')
        .select('*')
        .eq('is_active', true)
        .order('role_hierarchy_level', { ascending: false });

      if (error) throw error;

      return roles || [];
    } catch (error) {
      console.error('Error fetching role definitions:', error);
      throw error;
    }
  }

  async assignRole(profileId: string, roleData: RoleAssignmentData): Promise<{ success: boolean; roleId?: string; message: string }> {
    try {
      const { data: result, error } = await supabase.rpc('assign_profile_role', {
        p_profile_id: profileId,
        p_role_name: roleData.role_name,
        p_scope: roleData.scope || 'global',
        p_scope_id: roleData.scope_id || null,
        p_expires_at: roleData.expires_at || null,
        p_notes: roleData.notes || null
      });

      if (error) throw error;

      const assignmentResult = result[0];
      return {
        success: assignmentResult.success,
        roleId: assignmentResult.role_id,
        message: assignmentResult.message
      };
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  async revokeRole(roleId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: result, error } = await supabase.rpc('revoke_profile_role', {
        p_role_id: roleId,
        p_reason: reason || null
      });

      if (error) throw error;

      const revocationResult = result[0];
      return {
        success: revocationResult.success,
        message: revocationResult.message
      };
    } catch (error) {
      console.error('Error revoking role:', error);
      throw error;
    }
  }

  async grantPermission(profileId: string, permissionData: PermissionGrantData): Promise<{ success: boolean; permissionId?: string; message: string }> {
    try {
      const { data: result, error } = await supabase.rpc('grant_profile_permission', {
        p_profile_id: profileId,
        p_permission_name: permissionData.permission_name,
        p_resource_type: permissionData.resource_type,
        p_action: permissionData.action,
        p_resource_id: permissionData.resource_id || null,
        p_expires_at: permissionData.expires_at || null,
        p_conditions: permissionData.conditions || {}
      });

      if (error) throw error;

      const grantResult = result[0];
      return {
        success: grantResult.success,
        permissionId: grantResult.permission_id,
        message: grantResult.message
      };
    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  }

  async revokePermission(permissionId: string): Promise<void> {
    try {
      // Get permission details for logging
      const { data: permission } = await supabase
        .from('profile_permissions')
        .select('*')
        .eq('id', permissionId)
        .single();

      // Deactivate the permission instead of deleting
      const { error } = await supabase
        .from('profile_permissions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', permissionId);

      if (error) throw error;

      if (permission) {
        await this.logProfileActivity({
          profileId: permission.profile_id,
          activityType: 'permission_revoked',
          targetType: 'permission',
          targetId: permissionId,
          description: `Permission revoked: ${permission.permission_name} on ${permission.resource_type}`,
          metadata: {
            action: 'revoke_permission',
            permission_name: permission.permission_name,
            resource_type: permission.resource_type,
            resource_id: permission.resource_id,
            permission_action: permission.action
          }
        });
      }
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw error;
    }
  }

  async getProfileRoles(profileId: string): Promise<ProfileRole[]> {
    try {
      const { data: roles, error } = await supabase
        .from('active_profile_roles')
        .select('*')
        .eq('profile_id', profileId)
        .order('granted_at', { ascending: false });

      if (error) throw error;

      return roles || [];
    } catch (error) {
      console.error('Error fetching profile roles:', error);
      throw error;
    }
  }

  async getProfilePermissions(profileId: string): Promise<ProfilePermission[]> {
    try {
      const { data: permissions, error } = await supabase
        .from('profile_permissions')
        .select(`
          *,
          granted_by_profile:profiles!profile_permissions_granted_by_fkey(full_name)
        `)
        .eq('profile_id', profileId)
        .eq('is_active', true)
        .order('granted_at', { ascending: false });

      if (error) throw error;

      return permissions?.map(permission => ({
        ...permission,
        granted_by_name: permission.granted_by_profile?.full_name || null
      })) || [];
    } catch (error) {
      console.error('Error fetching profile permissions:', error);
      throw error;
    }
  }

  async getEffectivePermissions(profileId: string): Promise<EffectivePermission[]> {
    try {
      const { data: permissions, error } = await supabase.rpc('get_profile_effective_permissions', {
        p_profile_id: profileId
      });

      if (error) throw error;

      return permissions || [];
    } catch (error) {
      console.error('Error fetching effective permissions:', error);
      throw error;
    }
  }

  async checkPermission(profileId: string, resourceType: string, action: string, resourceId?: string): Promise<boolean> {
    try {
      const { data: hasPermission, error } = await supabase.rpc('check_profile_permission', {
        p_profile_id: profileId,
        p_resource_type: resourceType,
        p_action: action,
        p_resource_id: resourceId || null
      });

      if (error) throw error;

      return hasPermission || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  async bulkAssignRoles(profileIds: string[], roleData: RoleAssignmentData): Promise<BulkOperationResult> {
    const operationId = crypto.randomUUID();
    let processed = 0;
    let failed = 0;
    const errors: { profileId: string; error: string }[] = [];
    const results: any[] = [];

    try {
      for (const profileId of profileIds) {
        try {
          const result = await this.assignRole(profileId, roleData);
          results.push({ profileId, result });
          processed++;
        } catch (error) {
          failed++;
          errors.push({
            profileId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        success: failed === 0,
        processed,
        failed,
        errors,
        operationId,
        results
      };
    } catch (error) {
      console.error('Error in bulk role assignment:', error);
      throw error;
    }
  }

  // ========= BULK OPERATIONS =========

  async bulkUpdateProfiles(operation: BulkProfileOperation): Promise<BulkOperationResult> {
    const operationId = crypto.randomUUID();
    let processed = 0;
    let failed = 0;
    const errors: { profileId: string; error: string }[] = [];
    const results: any[] = [];

    try {
      for (const profileId of operation.profileIds) {
        try {
          let result;
          switch (operation.operation) {
            case 'update_status':
              result = await this.updateProfile(profileId, { status: operation.data?.status });
              break;
            case 'assign_role':
              result = await this.assignRole(profileId, operation.data as any);
              break;
            case 'remove_role':
              await this.removeRole(profileId, operation.data?.roleId);
              result = { success: true };
              break;
            case 'sync_auth':
              result = await this.syncProfileWithAuth(profileId);
              break;
            case 'verify_email':
              result = await this.updateProfile(profileId, { is_verified: true });
              break;
            default:
              throw new Error(`Unsupported bulk operation: ${operation.operation}`);
          }
          
          results.push({ profileId, result });
          processed++;
        } catch (error) {
          failed++;
          errors.push({
            profileId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Log bulk operation
      await this.logProfileActivity({
        profileId: operation.profileIds[0], // Use first profile for activity logging
        activityType: 'bulk_operation',
        targetType: 'profile',
        targetId: 'bulk_operation',
        description: `Bulk ${operation.operation}: ${processed} successful, ${failed} failed`,
        metadata: {
          action: 'bulk_operation',
          operation_type: operation.operation,
          operation_id: operationId,
          total_profiles: operation.profileIds.length,
          processed,
          failed,
          errors
        }
      });

      return {
        success: failed === 0,
        processed,
        failed,
        errors,
        operationId,
        results
      };
    } catch (error) {
      console.error('Error in bulk operation:', error);
      throw error;
    }
  }

  // ========= AUTH SYNCHRONIZATION =========

  async syncProfileWithAuth(profileId: string, strategy: 'auto' | 'create_auth' | 'manual' = 'auto'): Promise<{ 
    success: boolean; 
    action: string;
    conflicts?: SyncConflict[];
    details?: Record<string, any>;
  }> {
    try {
      const { data: syncResult, error } = await supabase.rpc('sync_profile_with_auth', {
        p_profile_id: profileId,
        p_strategy: strategy,
        p_force_sync: false
      });

      if (error) throw error;

      const result = syncResult[0];
      
      return {
        success: result.success,
        action: result.action_taken,
        conflicts: result.conflicts_created > 0 ? await this.getSyncConflicts(profileId) : undefined,
        details: result.sync_details
      };
    } catch (error) {
      console.error('Error syncing profile with auth:', error);
      throw error;
    }
  }

  async detectSyncDiscrepancies(): Promise<{
    profileMissingAuth: Array<{ profileId: string; email: string; severity: string }>;
    authMissingProfile: Array<{ authUserId: string; email: string; severity: string }>;
    emailMismatches: Array<{ profileId: string; authUserId: string; profileEmail: string; authEmail: string }>;
    metadataInconsistencies: Array<{ profileId: string; authUserId: string; description: string }>;
  }> {
    try {
      const { data: discrepancies, error } = await supabase.rpc('detect_profile_sync_discrepancies');
      
      if (error) throw error;

      const result = {
        profileMissingAuth: [],
        authMissingProfile: [],
        emailMismatches: [],
        metadataInconsistencies: []
      } as any;

      discrepancies?.forEach((item: any) => {
        switch (item.discrepancy_type) {
          case 'profile_missing_auth':
            result.profileMissingAuth.push({
              profileId: item.profile_id,
              email: item.profile_email,
              severity: item.severity
            });
            break;
          case 'auth_missing_profile':
            result.authMissingProfile.push({
              authUserId: item.auth_user_id,
              email: item.auth_email,
              severity: item.severity
            });
            break;
          case 'email_mismatch':
            result.emailMismatches.push({
              profileId: item.profile_id,
              authUserId: item.auth_user_id,
              profileEmail: item.profile_email,
              authEmail: item.auth_email
            });
            break;
          case 'metadata_inconsistency':
            result.metadataInconsistencies.push({
              profileId: item.profile_id,
              authUserId: item.auth_user_id,
              description: item.description
            });
            break;
        }
      });

      return result;
    } catch (error) {
      console.error('Error detecting sync discrepancies:', error);
      throw error;
    }
  }

  async getAuthSyncStatus(): Promise<{
    totalProfiles: number;
    totalAuthUsers: number;
    syncedProfiles: number;
    pendingSync: number;
    conflictProfiles: number;
    errorProfiles: number;
    unresolvedConflicts: number;
    syncHealthScore: number;
    lastSyncCheck: string;
  }> {
    try {
      const { data: status, error } = await supabase.rpc('get_auth_sync_status_summary');
      
      if (error) throw error;

      const result = status[0];
      return {
        totalProfiles: result.total_profiles,
        totalAuthUsers: result.total_auth_users,
        syncedProfiles: result.synced_profiles,
        pendingSync: result.pending_sync,
        conflictProfiles: result.conflict_profiles,
        errorProfiles: result.error_profiles,
        unresolvedConflicts: result.unresolved_conflicts,
        syncHealthScore: result.sync_health_score,
        lastSyncCheck: result.last_sync_check
      };
    } catch (error) {
      console.error('Error getting auth sync status:', error);
      throw error;
    }
  }

  async getSyncConflicts(profileId?: string): Promise<SyncConflict[]> {
    try {
      let query = supabase
        .from('profile_sync_conflicts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data: conflicts, error } = await query;
      
      if (error) throw error;

      return conflicts || [];
    } catch (error) {
      console.error('Error getting sync conflicts:', error);
      throw error;
    }
  }

  async resolveSyncConflict(
    conflictId: string, 
    strategy: 'profile_wins' | 'auth_wins' | 'manual' | 'ignore',
    notes?: string
  ): Promise<{ success: boolean; action: string; profileId?: string }> {
    try {
      const { data: result, error } = await supabase.rpc('resolve_sync_conflict', {
        p_conflict_id: conflictId,
        p_resolution_strategy: strategy,
        p_resolution_notes: notes
      });

      if (error) throw error;

      const resolution = result[0];
      return {
        success: resolution.success,
        action: resolution.action_taken,
        profileId: resolution.resolved_profile_id
      };
    } catch (error) {
      console.error('Error resolving sync conflict:', error);
      throw error;
    }
  }

  async performSyncHealthCheck(): Promise<{
    timestamp: string;
    healthScore: number;
    totalDiscrepancies: number;
    criticalIssues: number;
    recommendations: string[];
    autoActionsTaken: number;
  }> {
    try {
      const { data: healthCheck, error } = await supabase.rpc('perform_sync_health_check');
      
      if (error) throw error;

      const result = healthCheck[0];
      return {
        timestamp: result.check_timestamp,
        healthScore: result.health_score,
        totalDiscrepancies: result.total_discrepancies,
        criticalIssues: result.critical_issues,
        recommendations: result.recommendations,
        autoActionsTaken: result.auto_actions_taken
      };
    } catch (error) {
      console.error('Error performing sync health check:', error);
      throw error;
    }
  }

  async bulkSyncProfiles(profileIds?: string[], strategy: 'auto' | 'create_auth' | 'manual' = 'auto'): Promise<BulkOperationResult> {
    try {
      const { data: result, error } = await supabase.rpc('bulk_sync_profiles', {
        p_profile_ids: profileIds || null,
        p_sync_strategy: strategy,
        p_max_conflicts: 10
      });

      if (error) throw error;

      const syncResult = result[0];
      return {
        success: syncResult.errors_encountered === 0 && syncResult.conflicts_created <= 5,
        processed: syncResult.total_processed,
        failed: syncResult.errors_encountered,
        errors: [], // Detailed errors would need separate query
        operationId: syncResult.operation_id,
        results: [{
          successfulSyncs: syncResult.successful_syncs,
          conflictsCreated: syncResult.conflicts_created,
          processingTimeMs: syncResult.processing_time_ms,
          summary: syncResult.summary
        }]
      };
    } catch (error) {
      console.error('Error in bulk sync:', error);
      throw error;
    }
  }

  // ========= UTILITY METHODS =========

  async getProfileMetrics(): Promise<ProfileMetrics> {
    try {
      const { data: metrics, error } = await supabase.rpc('get_profile_metrics');
      
      if (error) throw error;
      
      return metrics[0] || {
        total_profiles: 0,
        active_profiles: 0,
        inactive_profiles: 0,
        pending_profiles: 0,
        suspended_profiles: 0,
        verified_profiles: 0,
        unverified_profiles: 0,
        profiles_with_2fa: 0,
        sync_conflicts: 0,
        recent_logins: 0,
        never_logged_in: 0,
        profiles_by_role: {},
        profiles_by_account_type: {}
      };
    } catch (error) {
      console.error('Error fetching profile metrics:', error);
      throw error;
    }
  }

  async sendProfileInvitation(profileId: string, options: {
    inviter_message?: string;
    expiry_hours?: number;
  } = {}): Promise<void> {
    try {
      const profile = await this.getProfile(profileId);
      
      // Call invitation service
      const { error } = await supabase.functions.invoke('user-service', {
        body: {
          pathname: '/user-service/send-invitation',
          profileId,
          email: profile.email,
          role: profile.role,
          accountId: profile.account_id,
          inviterMessage: options.inviter_message,
          expiryHours: options.expiry_hours || 72
        }
      });

      if (error) throw error;

      await this.logProfileActivity({
        profileId,
        activityType: 'invitation_sent',
        targetType: 'profile',
        targetId: profileId,
        description: `Invitation sent to ${profile.email}`,
        metadata: {
          action: 'send_invitation',
          email: profile.email,
          inviter_message: options.inviter_message,
          expiry_hours: options.expiry_hours
        }
      });
    } catch (error) {
      console.error('Error sending profile invitation:', error);
      throw error;
    }
  }

  // ========= PRIVATE HELPER METHODS =========

  private async canDeleteProfile(profileId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Check if profile is the only admin
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .eq('status', 'active');

      if (adminProfiles?.length === 1 && adminProfiles[0].id === profileId) {
        return { allowed: false, reason: 'Cannot delete the last active admin profile' };
      }

      // Add other checks as needed (active sessions, pending operations, etc.)
      
      return { allowed: true };
    } catch (error) {
      return { allowed: false, reason: 'Error checking deletion constraints' };
    }
  }


  // ========= ENHANCED BULK OPERATIONS =========

  async createBulkOperation(operation: EnhancedBulkOperation): Promise<{ operationId: string; totalTargets: number; estimatedDurationMinutes: number }> {
    try {
      const { data, error } = await supabase.rpc('create_bulk_operation', {
        p_operation_type: operation.operationType,
        p_operation_name: operation.operationName,
        p_target_profile_ids: operation.targetProfileIds,
        p_operation_data: operation.operationData,
        p_metadata: operation.metadata || {}
      });

      if (error) throw error;

      const result = data[0];
      return {
        operationId: result.operation_id,
        totalTargets: result.total_targets,
        estimatedDurationMinutes: result.estimated_duration_minutes
      };
    } catch (error) {
      console.error('Error creating bulk operation:', error);
      throw error;
    }
  }

  async getBulkOperations(limit: number = 50, offset: number = 0): Promise<BulkOperationStatus[]> {
    try {
      const { data: operations, error } = await supabase
        .from('bulk_operation_summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return (operations || []).map(op => ({
        id: op.id,
        operationType: op.operation_type,
        operationName: op.operation_name,
        status: op.status,
        totalTargets: op.total_targets,
        processedCount: op.processed_count,
        successCount: op.success_count,
        failedCount: op.failed_count,
        progressPercentage: op.progress_percentage,
        canRollback: op.can_rollback,
        createdAt: op.created_at,
        startedAt: op.started_at,
        completedAt: op.completed_at,
        estimatedCompletionAt: op.estimated_completion_at,
        initiatedByName: op.initiated_by_name,
        initiatedByEmail: op.initiated_by_email,
        durationSeconds: op.duration_seconds,
        overallStatus: op.overall_status
      }));
    } catch (error) {
      console.error('Error fetching bulk operations:', error);
      throw error;
    }
  }

  async getBulkOperationDetails(operationId: string): Promise<BulkOperationDetails> {
    try {
      // Get operation summary
      const { data: operation, error: opError } = await supabase
        .from('bulk_operation_summaries')
        .select('*')
        .eq('id', operationId)
        .single();

      if (opError) throw opError;

      // Get detailed results
      const { data: results, error: resultsError } = await supabase
        .from('bulk_operation_results')
        .select('*')
        .eq('bulk_operation_id', operationId)
        .order('sequence_number');

      if (resultsError) throw resultsError;

      // Get full operation data
      const { data: fullOperation, error: fullError } = await supabase
        .from('bulk_operations')
        .select('results, errors, rollback_data, metadata')
        .eq('id', operationId)
        .single();

      if (fullError) throw fullError;

      return {
        id: operation.id,
        operationType: operation.operation_type,
        operationName: operation.operation_name,
        status: operation.status,
        totalTargets: operation.total_targets,
        processedCount: operation.processed_count,
        successCount: operation.success_count,
        failedCount: operation.failed_count,
        progressPercentage: operation.progress_percentage,
        canRollback: operation.can_rollback,
        createdAt: operation.created_at,
        startedAt: operation.started_at,
        completedAt: operation.completed_at,
        estimatedCompletionAt: operation.estimated_completion_at,
        initiatedByName: operation.initiated_by_name,
        initiatedByEmail: operation.initiated_by_email,
        durationSeconds: operation.duration_seconds,
        overallStatus: operation.overall_status,
        results: (results || []).map(r => ({
          id: r.id,
          targetProfileId: r.target_profile_id,
          sequenceNumber: r.sequence_number,
          status: r.status,
          startedAt: r.started_at,
          completedAt: r.completed_at,
          durationMs: r.duration_ms,
          success: r.success,
          resultData: r.result_data,
          errorMessage: r.error_message,
          errorCode: r.error_code,
          retryCount: r.retry_count,
          rolledBack: r.rolled_back
        })),
        errors: fullOperation.errors || [],
        rollbackData: fullOperation.rollback_data || {},
        metadata: fullOperation.metadata || {}
      };
    } catch (error) {
      console.error('Error fetching bulk operation details:', error);
      throw error;
    }
  }

  async processBulkOperation(operationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get operation details
      const { data: operation, error: opError } = await supabase
        .from('bulk_operations')
        .select('*')
        .eq('id', operationId)
        .single();

      if (opError) throw opError;

      if (operation.status !== 'pending') {
        throw new Error(`Operation is not in pending status: ${operation.status}`);
      }

      // Update status to running
      await supabase
        .from('bulk_operations')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', operationId);

      // Process each target profile
      for (const profileId of operation.target_profile_ids) {
        try {
          await supabase.rpc('process_bulk_operation_target', {
            p_bulk_operation_id: operationId,
            p_target_profile_id: profileId,
            p_operation_type: operation.operation_type,
            p_operation_data: operation.operation_data
          });
        } catch (error) {
          console.error(`Error processing profile ${profileId}:`, error);
          // Continue with next profile
        }
      }

      // Complete the operation
      const { data: completionResult, error: completeError } = await supabase.rpc('complete_bulk_operation', {
        p_bulk_operation_id: operationId
      });

      if (completeError) throw completeError;

      const result = completionResult[0];
      return {
        success: true,
        message: `Operation completed: ${result.total_successful} successful, ${result.total_failed} failed`
      };
    } catch (error) {
      console.error('Error processing bulk operation:', error);
      
      // Update operation status to failed
      await supabase
        .from('bulk_operations')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', operationId);

      throw error;
    }
  }

  async rollbackBulkOperation(operationId: string, reason?: string): Promise<{ success: boolean; rolledBackCount: number; message: string }> {
    try {
      const { data, error } = await supabase.rpc('rollback_bulk_operation', {
        p_bulk_operation_id: operationId,
        p_rollback_reason: reason
      });

      if (error) throw error;

      const result = data[0];
      return {
        success: result.success,
        rolledBackCount: result.rolled_back_count,
        message: result.message
      };
    } catch (error) {
      console.error('Error rolling back bulk operation:', error);
      throw error;
    }
  }

  async cancelBulkOperation(operationId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('bulk_operations')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          metadata: { cancellation_reason: reason }
        })
        .eq('id', operationId)
        .in('status', ['pending', 'running']);

      if (error) throw error;

      return {
        success: true,
        message: 'Bulk operation cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling bulk operation:', error);
      throw error;
    }
  }

  // ========= ACTIVITY MONITORING =========

  async getActivitySummary(
    startDate?: string, 
    endDate?: string, 
    profileId?: string
  ): Promise<ActivitySummary> {
    try {
      const { data, error } = await supabase.rpc('get_profile_activity_summary', {
        p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: endDate || new Date().toISOString(),
        p_profile_id: profileId || null
      });

      if (error) throw error;

      const summary = data[0];
      return {
        totalActivities: summary.total_activities,
        successfulActivities: summary.successful_activities,
        failedActivities: summary.failed_activities,
        successRate: summary.success_rate,
        uniqueProfiles: summary.unique_profiles,
        activityTypes: summary.activity_types || {},
        activityCategories: summary.activity_categories || {},
        riskDistribution: summary.risk_distribution || {},
        peakActivityHour: summary.peak_activity_hour,
        mostActiveProfile: summary.most_active_profile?.profile_id ? {
          profileId: summary.most_active_profile.profile_id,
          profileName: summary.most_active_profile.profile_name,
          profileEmail: summary.most_active_profile.profile_email,
          activityCount: summary.most_active_profile.activity_count
        } : null
      };
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      throw error;
    }
  }

  async getActivityTimeline(
    profileId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ActivityTimelineEntry[]> {
    try {
      const { data: timeline, error } = await supabase.rpc('get_profile_activity_timeline', {
        p_profile_id: profileId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) throw error;

      return (timeline || []).map(entry => ({
        id: entry.id,
        activityType: entry.activity_type,
        activityCategory: entry.activity_category,
        targetType: entry.target_type,
        targetId: entry.target_id,
        description: entry.description,
        resultStatus: entry.result_status,
        riskLevel: entry.risk_level,
        durationMs: entry.duration_ms,
        ipAddress: entry.ip_address,
        userAgent: entry.user_agent,
        sessionId: entry.session_id,
        metadata: entry.metadata || {},
        createdAt: entry.created_at,
        timeAgo: entry.time_ago
      }));
    } catch (error) {
      console.error('Error fetching activity timeline:', error);
      throw error;
    }
  }

  async detectSuspiciousActivity(
    lookbackHours: number = 24, 
    minThreshold: number = 10
  ): Promise<SuspiciousActivity[]> {
    try {
      const { data: suspicious, error } = await supabase.rpc('detect_suspicious_activity', {
        p_lookback_hours: lookbackHours,
        p_min_threshold: minThreshold
      });

      if (error) throw error;

      return (suspicious || []).map(activity => ({
        profileId: activity.profile_id,
        profileName: activity.profile_name,
        profileEmail: activity.profile_email,
        suspiciousPattern: activity.suspicious_pattern,
        activityCount: activity.activity_count,
        riskScore: activity.risk_score,
        details: activity.details || {},
        detectedAt: activity.detected_at
      }));
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      throw error;
    }
  }

  async getActivityTrends(
    days: number = 7, 
    granularity: 'hourly' | 'daily' | 'weekly' = 'daily'
  ): Promise<ActivityTrend[]> {
    try {
      const { data: trends, error } = await supabase.rpc('get_activity_trends', {
        p_days: days,
        p_granularity: granularity
      });

      if (error) throw error;

      return (trends || []).map(trend => ({
        timeBucket: trend.time_bucket,
        totalActivities: trend.total_activities,
        successfulActivities: trend.successful_activities,
        failedActivities: trend.failed_activities,
        uniqueProfiles: trend.unique_profiles,
        highRiskActivities: trend.high_risk_activities
      }));
    } catch (error) {
      console.error('Error fetching activity trends:', error);
      throw error;
    }
  }

  async createActivityAlert(
    profileId: string,
    alertType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      const { data: alertId, error } = await supabase.rpc('create_activity_alert', {
        p_profile_id: profileId,
        p_alert_type: alertType,
        p_severity: severity,
        p_title: title,
        p_description: description,
        p_metadata: metadata
      });

      if (error) throw error;

      return alertId;
    } catch (error) {
      console.error('Error creating activity alert:', error);
      throw error;
    }
  }

  async getRecentActivities(limit: number = 20): Promise<ActivityTimelineEntry[]> {
    try {
      const { data: activities, error } = await supabase
        .from('profile_activity_monitoring')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (activities || []).map(activity => ({
        id: activity.id,
        activityType: activity.activity_type,
        activityCategory: activity.activity_category,
        targetType: activity.target_type,
        targetId: activity.target_id,
        description: activity.description,
        resultStatus: activity.result_status,
        riskLevel: activity.risk_level,
        durationMs: activity.duration_ms,
        ipAddress: activity.ip_address,
        userAgent: activity.user_agent,
        sessionId: activity.session_id,
        metadata: activity.metadata || {},
        createdAt: activity.created_at,
        timeAgo: activity.time_category
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  private async logProfileActivity(activityData: {
    profileId: string;
    activityType: string;
    targetType: string;
    targetId: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await supabase.rpc('log_profile_activity', {
        p_profile_id: activityData.profileId,
        p_activity_type: activityData.activityType,
        p_target_type: activityData.targetType,
        p_target_id: activityData.targetId,
        p_description: activityData.description,
        p_metadata: activityData.metadata || {}
      });
    } catch (error) {
      console.error('Error logging profile activity:', error);
      // Don't throw here to avoid breaking the main operation
    }
  }

  // ========= EPIC 4 SPRINT 4: BILLING MANAGEMENT METHODS =========

  // Billing Management - Story 4.1
  async createSubscription(accountId: string, planId: string, options?: {
    paymentMethodId?: string;
    trialDays?: number;
    billingContactProfileId?: string;
  }): Promise<{ subscriptionId: string; success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('create_subscription', {
        p_account_id: accountId,
        p_plan_id: planId,
        p_payment_method_id: options?.paymentMethodId || null,
        p_trial_days: options?.trialDays || null,
        p_billing_contact_profile_id: options?.billingContactProfileId || null
      });

      if (error) throw error;

      const result = data[0];
      await this.logProfileActivity({
        profileId: this.getCurrentProfileId(),
        activityType: 'subscription_created',
        targetType: 'subscription',
        targetId: result.subscription_id,
        description: `Created subscription for account ${accountId}`,
        metadata: { planId, ...options }
      });

      return {
        subscriptionId: result.subscription_id,
        success: result.success,
        message: result.message
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async getSubscriptionPlans(activeOnly: boolean = true): Promise<SubscriptionPlan[]> {
    try {
      let query = supabase
        .from('subscription_plans')
        .select('*')
        .order('plan_name');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data: plans, error } = await query;

      if (error) throw error;

      return (plans || []).map(plan => ({
        id: plan.id,
        planCode: plan.plan_code,
        planName: plan.plan_name,
        description: plan.description,
        planType: plan.plan_type,
        billingInterval: plan.billing_interval,
        intervalCount: plan.interval_count,
        priceCents: plan.price_cents,
        currency: plan.currency,
        trialPeriodDays: plan.trial_period_days,
        maxUsers: plan.max_users,
        maxTools: plan.max_tools,
        features: plan.features || {},
        isActive: plan.is_active,
        stripePriceId: plan.stripe_price_id,
        squareCatalogId: plan.square_catalog_id,
        metadata: plan.metadata || {},
        createdAt: plan.created_at,
        updatedAt: plan.updated_at
      }));
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  async getAccountSubscriptions(accountId: string): Promise<AccountSubscription[]> {
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans:plan_id (
            plan_code,
            plan_name,
            description,
            price_cents,
            currency,
            billing_interval
          ),
          payment_methods:payment_method_id (
            method_type,
            last_four,
            brand,
            exp_month,
            exp_year
          )
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (subscriptions || []).map(sub => ({
        id: sub.id,
        accountId: sub.account_id,
        planId: sub.plan_id,
        status: sub.status,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        trialStart: sub.trial_start,
        trialEnd: sub.trial_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: sub.canceled_at,
        endedAt: sub.ended_at,
        stripeSubscriptionId: sub.stripe_subscription_id,
        squareSubscriptionId: sub.square_subscription_id,
        paymentMethodId: sub.payment_method_id,
        billingContactProfileId: sub.billing_contact_profile_id,
        quantity: sub.quantity,
        discountPercent: sub.discount_percent,
        metadata: sub.metadata || {},
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
        plan: sub.subscription_plans ? {
          planCode: sub.subscription_plans.plan_code,
          planName: sub.subscription_plans.plan_name,
          description: sub.subscription_plans.description,
          priceCents: sub.subscription_plans.price_cents,
          currency: sub.subscription_plans.currency,
          billingInterval: sub.subscription_plans.billing_interval
        } : null,
        paymentMethod: sub.payment_methods ? {
          methodType: sub.payment_methods.method_type,
          lastFour: sub.payment_methods.last_four,
          brand: sub.payment_methods.brand,
          expMonth: sub.payment_methods.exp_month,
          expYear: sub.payment_methods.exp_year
        } : null
      }));
    } catch (error) {
      console.error('Error fetching account subscriptions:', error);
      throw error;
    }
  }

  async processPayment(accountId: string, amount: number, options?: {
    currency?: string;
    paymentMethodId?: string;
    subscriptionId?: string;
    description?: string;
  }): Promise<{ paymentId: string; success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('process_payment', {
        p_account_id: accountId,
        p_amount_cents: Math.round(amount * 100), // Convert to cents
        p_currency: options?.currency || 'USD',
        p_payment_method_id: options?.paymentMethodId || null,
        p_subscription_id: options?.subscriptionId || null,
        p_description: options?.description || null
      });

      if (error) throw error;

      const result = data[0];
      await this.logProfileActivity({
        profileId: this.getCurrentProfileId(),
        activityType: 'payment_processed',
        targetType: 'payment',
        targetId: result.payment_id,
        description: `Processed payment for account ${accountId}: $${amount}`,
        metadata: { amount, ...options }
      });

      return {
        paymentId: result.payment_id,
        success: result.success,
        message: result.message
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  async generateInvoice(subscriptionId: string, options?: {
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
  }): Promise<{ invoiceId: string; success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('generate_invoice', {
        p_subscription_id: subscriptionId,
        p_billing_period_start: options?.billingPeriodStart || null,
        p_billing_period_end: options?.billingPeriodEnd || null
      });

      if (error) throw error;

      const result = data[0];
      await this.logProfileActivity({
        profileId: this.getCurrentProfileId(),
        activityType: 'invoice_generated',
        targetType: 'invoice',
        targetId: result.invoice_id,
        description: `Generated invoice for subscription ${subscriptionId}`,
        metadata: { subscriptionId, ...options }
      });

      return {
        invoiceId: result.invoice_id,
        success: result.success,
        message: result.message
      };
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  async getAccountInvoices(accountId: string, options?: {
    limit?: number;
    status?: string;
  }): Promise<AccountInvoice[]> {
    try {
      let query = supabase
        .from('billing_invoices')
        .select(`
          *,
          subscriptions:subscription_id (
            id,
            status,
            plan_id
          ),
          invoice_line_items (
            id,
            description,
            quantity,
            unit_price_cents,
            total_cents,
            period_start,
            period_end
          )
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      return (invoices || []).map(invoice => ({
        id: invoice.id,
        accountId: invoice.account_id,
        subscriptionId: invoice.subscription_id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        subtotalCents: invoice.subtotal_cents,
        taxCents: invoice.tax_cents,
        discountCents: invoice.discount_cents,
        totalCents: invoice.total_cents,
        currency: invoice.currency,
        dueDate: invoice.due_date,
        paidAt: invoice.paid_at,
        billingPeriodStart: invoice.billing_period_start,
        billingPeriodEnd: invoice.billing_period_end,
        billingAddress: invoice.billing_address || {},
        notes: invoice.notes,
        pdfUrl: invoice.pdf_url,
        stripeInvoiceId: invoice.stripe_invoice_id,
        squareInvoiceId: invoice.square_invoice_id,
        metadata: invoice.metadata || {},
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        subscription: invoice.subscriptions ? {
          id: invoice.subscriptions.id,
          status: invoice.subscriptions.status,
          planId: invoice.subscriptions.plan_id
        } : null,
        lineItems: (invoice.invoice_line_items || []).map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unit_price_cents,
          totalCents: item.total_cents,
          periodStart: item.period_start,
          periodEnd: item.period_end
        }))
      }));
    } catch (error) {
      console.error('Error fetching account invoices:', error);
      throw error;
    }
  }

  async getPaymentHistory(accountId: string, options?: {
    limit?: number;
    status?: string;
    subscriptionId?: string;
  }): Promise<PaymentHistory[]> {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          payment_methods:payment_method_id (
            method_type,
            last_four,
            brand
          ),
          subscriptions:subscription_id (
            id,
            status
          )
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.subscriptionId) {
        query = query.eq('subscription_id', options.subscriptionId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: payments, error } = await query;

      if (error) throw error;

      return (payments || []).map(payment => ({
        id: payment.id,
        accountId: payment.account_id,
        subscriptionId: payment.subscription_id,
        invoiceId: payment.invoice_id,
        paymentMethodId: payment.payment_method_id,
        amountCents: payment.amount_cents,
        currency: payment.currency,
        status: payment.status,
        paymentType: payment.payment_type,
        description: payment.description,
        stripePaymentIntentId: payment.stripe_payment_intent_id,
        stripeChargeId: payment.stripe_charge_id,
        squarePaymentId: payment.square_payment_id,
        gatewayResponse: payment.gateway_response || {},
        failureReason: payment.failure_reason,
        processedAt: payment.processed_at,
        refundedAt: payment.refunded_at,
        refundAmountCents: payment.refund_amount_cents,
        metadata: payment.metadata || {},
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
        paymentMethod: payment.payment_methods ? {
          methodType: payment.payment_methods.method_type,
          lastFour: payment.payment_methods.last_four,
          brand: payment.payment_methods.brand
        } : null,
        subscription: payment.subscriptions ? {
          id: payment.subscriptions.id,
          status: payment.subscriptions.status
        } : null
      }));
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  async getBillingEvents(accountId: string, options?: {
    limit?: number;
    eventType?: string;
    processed?: boolean;
  }): Promise<BillingEvent[]> {
    try {
      let query = supabase
        .from('billing_events')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (options?.eventType) {
        query = query.eq('event_type', options.eventType);
      }

      if (options?.processed !== undefined) {
        query = query.eq('processed', options.processed);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: events, error } = await query;

      if (error) throw error;

      return (events || []).map(event => ({
        id: event.id,
        accountId: event.account_id,
        eventType: event.event_type,
        eventData: event.event_data || {},
        subscriptionId: event.subscription_id,
        paymentId: event.payment_id,
        invoiceId: event.invoice_id,
        gatewayEventId: event.gateway_event_id,
        processed: event.processed,
        processedAt: event.processed_at,
        errorMessage: event.error_message,
        retryCount: event.retry_count,
        createdAt: event.created_at
      }));
    } catch (error) {
      console.error('Error fetching billing events:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, updates: {
    status?: string;
    quantity?: number;
    cancelAtPeriodEnd?: boolean;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      await this.logProfileActivity({
        profileId: this.getCurrentProfileId(),
        activityType: 'subscription_updated',
        targetType: 'subscription',
        targetId: subscriptionId,
        description: `Updated subscription ${subscriptionId}`,
        metadata: updates
      });

      return {
        success: true,
        message: 'Subscription updated successfully'
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  private getCurrentProfileId(): string {
    // This would typically get the current user's profile ID from authentication context
    // For now, return a placeholder - this should be implemented based on your auth system
    return 'current-user-profile-id';
  }
}

export default AdminProfileService;