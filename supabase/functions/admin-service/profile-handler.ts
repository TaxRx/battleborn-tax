// Epic 3 Sprint 3 Day 1: Admin Service Profile Handler
// File: profile-handler.ts
// Purpose: Complete CRUD operations for profile management with auth synchronization
// Story: 3.1 - Profile Management CRUD Operations

import {
  validateProfileData,
  validateProfileUpdate,
  validateBulkProfileOperation,
  validateRequestRate,
  validatePaginationParams,
  validateSortParams,
  isValidUUID,
  sanitizeStringInput
} from './validation-utils.ts'

import {
  handleDatabaseError,
  handleValidationError,
  handleRateLimitError,
  handleServerError,
  handleNotFoundError,
  handleConflictError,
  withErrorHandling
} from './error-handler.ts'

import {
  CacheManager,
  PerformanceMonitor,
  executeOptimizedQuery,
  invalidateRelatedCache,
  createCacheKey,
  optimizePagination,
  prefetchRelatedData
} from './performance-utils.ts'

interface CreateProfileRequest {
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

interface UpdateProfileRequest {
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

interface ProfileFilters {
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

interface BulkProfileOperation {
  profileIds: string[];
  operation: 'update_status' | 'assign_role' | 'remove_role' | 'sync_auth' | 'reset_password' | 'verify_email';
  data?: Record<string, any>;
}

// Global rate limiting cache
const requestCache = new Map<string, number[]>();

export async function handleProfileOperations(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  try {
    // Profile routes mapping
    if (method === 'GET' && url.pathname.includes('/profiles/') && !url.pathname.includes('/activities')) {
      return await getProfile(request, supabase, corsHeaders);
    } else if (method === 'GET' && url.pathname.includes('/profiles/metrics')) {
      return await getProfileMetrics(request, supabase, corsHeaders);
    } else if (method === 'GET' && url.pathname.includes('/profiles')) {
      return await getProfiles(request, supabase, corsHeaders);
    } else if (method === 'POST' && url.pathname.includes('/profiles/bulk')) {
      return await bulkProfileOperation(request, supabase, corsHeaders);
    } else if (method === 'POST' && url.pathname.includes('/profiles/sync')) {
      return await syncProfiles(request, supabase, corsHeaders);
    } else if (method === 'POST' && url.pathname.includes('/profiles')) {
      return await createProfile(request, supabase, corsHeaders);
    } else if (method === 'PUT' && url.pathname.includes('/profiles/')) {
      return await updateProfile(request, supabase, corsHeaders);
    } else if (method === 'DELETE' && url.pathname.includes('/profiles/')) {
      return await deleteProfile(request, supabase, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Profile endpoint not found' }), 
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Profile handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function getProfiles(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  
  // Validate pagination parameters
  const paginationValidation = validatePaginationParams(
    url.searchParams.get('page') || undefined,
    url.searchParams.get('limit') || undefined
  );
  
  if (paginationValidation.errors.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid pagination parameters', details: paginationValidation.errors }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate sort parameters
  const sortValidation = validateSortParams(
    url.searchParams.get('sortBy') || undefined,
    url.searchParams.get('sortOrder') || undefined
  );
  
  if (sortValidation.errors.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid sort parameters', details: sortValidation.errors }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Rate limiting check
  const rateLimitValidation = validateRequestRate('list', 'global', requestCache);
  if (!rateLimitValidation.isValid) {
    return new Response(
      JSON.stringify({ error: rateLimitValidation.errors[0] }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { page, limit } = paginationValidation;
  const { sortBy: safeSortBy, sortOrder: safeSortOrder } = sortValidation;
  
  // Extract filters
  const filters: ProfileFilters = {
    search: url.searchParams.get('search')?.trim(),
    status: url.searchParams.get('status') || undefined,
    role: url.searchParams.get('role') || undefined,
    accountType: url.searchParams.get('accountType') || undefined,
    syncStatus: url.searchParams.get('syncStatus') || undefined,
    verificationStatus: url.searchParams.get('verificationStatus') as any || undefined,
    lastLoginRange: url.searchParams.get('lastLoginRange') as any || undefined
  };

  try {
    // Create cache key for this query
    const cacheKey = createCacheKey('profiles', filters, { page, limit, sortBy: safeSortBy, sortOrder: safeSortOrder });

    // Execute optimized query with caching
    const result = await executeOptimizedQuery(
      async () => {
        // Build the query using the profile management summary view
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
        const ascending = safeSortOrder === 'asc';
        query = query.order(safeSortBy, { ascending });

        // Apply optimized pagination
        const pagination = optimizePagination(page, limit);
        query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

        return await query;
      },
      cacheKey,
      'getProfiles',
      { enableCaching: true }
    );

    if (result.error) {
      return handleDatabaseError(result.error, {
        operation: 'fetch',
        resource: 'profiles',
        request_path: '/profiles'
      }, corsHeaders);
    }

    // Prefetch related data for better performance
    const profileIds = result.data?.map((profile: any) => profile.id) || [];
    if (profileIds.length > 0) {
      prefetchRelatedData(supabase, profileIds).catch(console.warn);
    }

    return new Response(
      JSON.stringify({
        profiles: result.data || [],
        pagination: {
          page,
          limit,
          total: result.count || 0,
          pages: Math.ceil((result.count || 0) / limit)
        },
        filters,
        fromCache: result.fromCache
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'fetch',
      resource: 'profiles',
      request_path: '/profiles'
    }, corsHeaders);
  }
}

async function getProfile(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  
  // Extract profile ID from path: /admin-service/profiles/:id
  const pathParts = url.pathname.split('/');
  const profileIdIndex = pathParts.findIndex(part => part === 'profiles') + 1;
  const profileId = pathParts[profileIdIndex];
  
  if (!profileId || !isValidUUID(profileId)) {
    return new Response(
      JSON.stringify({ error: 'Valid profile ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get detailed profile data using the function
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_profile_summary', { p_profile_id: profileId });

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw profileError;
    }

    if (!profileData || profileData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get additional details
    const [rolesResult, permissionsResult, activitiesResult] = await Promise.all([
      // Get profile roles
      supabase
        .from('active_profile_roles')
        .select('*')
        .eq('profile_id', profileId),
      
      // Get profile permissions
      supabase
        .from('profile_permissions')
        .select(`
          *,
          granted_by_profile:profiles!profile_permissions_granted_by_fkey(full_name)
        `)
        .eq('profile_id', profileId)
        .eq('is_active', true),
      
      // Get recent activities
      supabase
        .from('profile_activities')
        .select(`
          *,
          actor:profiles!profile_activities_actor_id_fkey(full_name)
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    if (rolesResult.error) throw rolesResult.error;
    if (permissionsResult.error) throw permissionsResult.error;
    if (activitiesResult.error) throw activitiesResult.error;

    const profile = {
      ...profileData[0],
      roles: rolesResult.data?.map(role => ({
        ...role,
        granted_by_name: role.granted_by_name || null
      })) || [],
      permissions: permissionsResult.data?.map(permission => ({
        ...permission,
        granted_by_name: permission.granted_by_profile?.full_name || null
      })) || [],
      recent_activities: activitiesResult.data?.map(activity => ({
        ...activity,
        actor_name: activity.actor?.full_name || null
      })) || []
    };

    return new Response(
      JSON.stringify({ profile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in getProfile:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function createProfile(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: CreateProfileRequest = await request.json();
    
    // Rate limiting check
    const rateLimitValidation = validateRequestRate('create', 'global', requestCache);
    if (!rateLimitValidation.isValid) {
      return new Response(
        JSON.stringify({ error: rateLimitValidation.errors[0] }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize input data
    if (body.email) body.email = sanitizeStringInput(body.email).toLowerCase();
    if (body.full_name) body.full_name = sanitizeStringInput(body.full_name);
    if (body.phone) body.phone = sanitizeStringInput(body.phone);
    if (body.timezone) body.timezone = sanitizeStringInput(body.timezone);
    if (body.admin_notes) body.admin_notes = sanitizeStringInput(body.admin_notes);
    
    // Comprehensive validation
    const validation = validateProfileData(body, { checkUniqueness: true });
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.errors,
          warnings: validation.warnings 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing profile with same email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Profile with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check auth.users for existing user
    try {
      const { data: authUser } = await supabase.auth.admin.getUserByEmail(body.email);
      if (authUser?.user) {
        return new Response(
          JSON.stringify({ error: 'User with this email already exists in authentication system' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (authError) {
      // Auth check failed - continue with profile creation but note sync status
      console.warn('Auth check failed during profile creation:', authError);
    }

    // Create the profile
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        email: body.email,
        full_name: body.full_name,
        role: body.role,
        account_id: body.account_id || null,
        phone: body.phone || null,
        timezone: body.timezone || 'UTC',
        status: body.status || 'pending',
        admin_notes: body.admin_notes || null,
        metadata: body.metadata || {},
        preferences: body.preferences || {},
        is_verified: false,
        auth_sync_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return handleDatabaseError(error, {
        operation: 'create',
        resource: 'profile'
      }, corsHeaders);
    }

    // Log the activity
    try {
      await supabase.rpc('log_profile_activity', {
        p_profile_id: newProfile.id,
        p_activity_type: 'profile_created',
        p_target_type: 'profile',
        p_target_id: newProfile.id,
        p_description: `Profile created for ${body.full_name} (${body.email})`,
        p_metadata: {
          action: 'create_profile',
          created_via: 'admin_interface',
          role: body.role,
          account_id: body.account_id,
          send_invitation: body.send_invitation
        }
      });
    } catch (logError) {
      console.warn('Failed to log profile activity:', logError);
    }

    // Send invitation if requested
    if (body.send_invitation) {
      try {
        await supabase.functions.invoke('user-service', {
          body: {
            pathname: '/user-service/send-invitation',
            profileId: newProfile.id,
            email: body.email,
            role: body.role,
            accountId: body.account_id,
            inviterMessage: `Welcome to the platform! Your profile has been created with ${body.role} privileges.`
          }
        });
      } catch (inviteError) {
        console.warn('Failed to send invitation:', inviteError);
      }
    }

    // Invalidate cache after successful creation
    invalidateRelatedCache('create', newProfile.id);

    return new Response(
      JSON.stringify({ 
        profile: newProfile,
        message: 'Profile created successfully'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'create',
      resource: 'profile'
    }, corsHeaders);
  }
}

async function updateProfile(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  
  // Extract profile ID from path
  const pathParts = url.pathname.split('/');
  const profileIdIndex = pathParts.findIndex(part => part === 'profiles') + 1;
  const profileId = pathParts[profileIdIndex];
  
  if (!profileId || !isValidUUID(profileId)) {
    return new Response(
      JSON.stringify({ error: 'Valid profile ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: UpdateProfileRequest = await request.json();
    
    // Rate limiting check
    const rateLimitValidation = validateRequestRate('update', profileId, requestCache);
    if (!rateLimitValidation.isValid) {
      return new Response(
        JSON.stringify({ error: rateLimitValidation.errors[0] }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize input data
    if (body.full_name) body.full_name = sanitizeStringInput(body.full_name);
    if (body.email) body.email = sanitizeStringInput(body.email).toLowerCase();
    if (body.phone) body.phone = sanitizeStringInput(body.phone);
    if (body.timezone) body.timezone = sanitizeStringInput(body.timezone);
    if (body.admin_notes) body.admin_notes = sanitizeStringInput(body.admin_notes);

    // Check if profile exists first
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

    // Validate update data
    const validation = validateProfileUpdate(body, existingProfile);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.errors,
          warnings: validation.warnings 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for email conflicts if email is changing
    if (body.email && body.email !== existingProfile.email) {
      const { data: conflictingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', body.email)
        .neq('id', profileId)
        .single();

      if (conflictingProfile) {
        return new Response(
          JSON.stringify({ error: 'Another profile with this email already exists' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.account_id !== undefined) updateData.account_id = body.account_id;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.admin_notes !== undefined) updateData.admin_notes = body.admin_notes;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.preferences !== undefined) updateData.preferences = body.preferences;
    if (body.is_verified !== undefined) updateData.is_verified = body.is_verified;
    if (body.two_factor_enabled !== undefined) updateData.two_factor_enabled = body.two_factor_enabled;
    if (body.reset_failed_attempts) {
      updateData.failed_login_attempts = 0;
      updateData.locked_until = null;
    }

    // Perform the update
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      return handleDatabaseError(error, {
        operation: 'update',
        resource: 'profile',
        profile_id: profileId
      }, corsHeaders);
    }

    // Log the update activity
    try {
      const changedFields = Object.keys(updateData).filter(key => key !== 'updated_at');
      await supabase.rpc('log_profile_activity', {
        p_profile_id: profileId,
        p_activity_type: 'profile_updated',
        p_target_type: 'profile',
        p_target_id: profileId,
        p_description: `Profile updated: ${changedFields.join(', ')} changed`,
        p_metadata: {
          action: 'update_profile',
          changed_fields: changedFields,
          old_values: Object.fromEntries(changedFields.map(field => [field, existingProfile[field]])),
          new_values: Object.fromEntries(changedFields.map(field => [field, updateData[field]])),
          updated_via: 'admin_interface'
        }
      });
    } catch (logError) {
      console.warn('Failed to log profile activity:', logError);
    }

    // Invalidate cache after successful update
    invalidateRelatedCache('update', profileId);

    return new Response(
      JSON.stringify({ 
        profile: updatedProfile,
        message: 'Profile updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'update',
      resource: 'profile',
      profile_id: profileId
    }, corsHeaders);
  }
}

async function deleteProfile(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  
  // Extract profile ID from path
  const pathParts = url.pathname.split('/');
  const profileIdIndex = pathParts.findIndex(part => part === 'profiles') + 1;
  const profileId = pathParts[profileIdIndex];
  
  if (!profileId || !isValidUUID(profileId)) {
    return new Response(
      JSON.stringify({ error: 'Valid profile ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Rate limiting check
    const rateLimitValidation = validateRequestRate('delete', profileId, requestCache);
    if (!rateLimitValidation.isValid) {
      return new Response(
        JSON.stringify({ error: rateLimitValidation.errors[0] }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if profile can be deleted
    const canDelete = await validateProfileDeletion(profileId, supabase);
    if (!canDelete.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Profile deletion not allowed', 
          details: canDelete.errors 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get profile data for logging
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    // Log the deletion activity before deletion
    try {
      await supabase.rpc('log_profile_activity', {
        p_profile_id: profileId,
        p_activity_type: 'profile_deleted',
        p_target_type: 'profile',
        p_target_id: profileId,
        p_description: `Profile deleted: ${existingProfile?.full_name} (${existingProfile?.email})`,
        p_metadata: {
          action: 'delete_profile',
          deleted_profile_data: existingProfile,
          deletion_reason: 'admin_request',
          deleted_via: 'admin_interface'
        }
      });
    } catch (logError) {
      console.warn('Failed to log deletion activity:', logError);
    }

    // Perform the deletion
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      return handleDatabaseError(error, {
        operation: 'delete',
        resource: 'profile',
        profile_id: profileId
      }, corsHeaders);
    }

    // Invalidate cache after successful deletion
    invalidateRelatedCache('delete', profileId);

    return new Response(
      JSON.stringify({ 
        message: 'Profile deleted successfully',
        deleted_profile: {
          id: existingProfile?.id,
          full_name: existingProfile?.full_name,
          email: existingProfile?.email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'delete',
      resource: 'profile',
      profile_id: profileId
    }, corsHeaders);
  }
}

async function bulkProfileOperation(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: BulkProfileOperation = await request.json();
    
    // Validate bulk operation
    const validation = validateBulkProfileOperation(body);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const operationId = crypto.randomUUID();
    let processed = 0;
    let failed = 0;
    const errors: { profileId: string; error: string }[] = [];
    const results: any[] = [];

    // Process operations in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < body.profileIds.length; i += batchSize) {
      const batch = body.profileIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (profileId) => {
        try {
          let result;
          switch (body.operation) {
            case 'update_status':
              result = await updateProfileStatus(supabase, profileId, body.data?.status);
              break;
            case 'sync_auth':
              result = await syncProfileWithAuth(supabase, profileId);
              break;
            case 'verify_email':
              result = await updateProfileVerification(supabase, profileId, true);
              break;
            default:
              throw new Error(`Unsupported bulk operation: ${body.operation}`);
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
      });

      await Promise.allSettled(batchPromises);
    }

    // Log bulk operation
    try {
      await supabase.rpc('log_profile_activity', {
        p_profile_id: body.profileIds[0], // Use first profile for activity logging
        p_activity_type: 'bulk_operation',
        p_target_type: 'profile',
        p_target_id: 'bulk_operation',
        p_description: `Bulk ${body.operation}: ${processed} successful, ${failed} failed`,
        p_metadata: {
          action: 'bulk_operation',
          operation_type: body.operation,
          operation_id: operationId,
          total_profiles: body.profileIds.length,
          processed,
          failed,
          errors
        }
      });
    } catch (logError) {
      console.warn('Failed to log bulk operation activity:', logError);
    }

    return new Response(
      JSON.stringify({
        success: failed === 0,
        processed,
        failed,
        errors,
        operationId,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'bulk',
      resource: 'profiles'
    }, corsHeaders);
  }
}

async function getProfileMetrics(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { data: metrics, error } = await supabase.rpc('get_profile_metrics');
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({
        metrics: metrics[0] || {
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
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'metrics',
      resource: 'profiles'
    }, corsHeaders);
  }
}

// Helper functions
async function validateProfileDeletion(profileId: string, supabase: any): Promise<{ isValid: boolean; errors: string[] }> {
  try {
    // Check if profile is the only admin
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('status', 'active');

    if (adminProfiles?.length === 1 && adminProfiles[0].id === profileId) {
      return { isValid: false, errors: ['Cannot delete the last active admin profile'] };
    }

    return { isValid: true, errors: [] };
  } catch (error) {
    return { isValid: false, errors: ['Error checking deletion constraints'] };
  }
}

async function updateProfileStatus(supabase: any, profileId: string, status: string): Promise<any> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateProfileVerification(supabase: any, profileId: string, isVerified: boolean): Promise<any> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_verified: isVerified, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function syncProfileWithAuth(supabase: any, profileId: string): Promise<any> {
  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (!profile) throw new Error('Profile not found');

  // Get auth user data
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(profile.email);
  
  if (authError || !authUser?.user) {
    // Update sync status to conflict
    await supabase
      .from('profiles')
      .update({ 
        auth_sync_status: 'conflict',
        auth_sync_last_attempted: new Date().toISOString()
      })
      .eq('id', profileId);
    
    throw new Error('Auth user not found - sync conflict created');
  }

  // Update sync status to synced
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      auth_sync_status: 'synced',
      auth_sync_last_attempted: new Date().toISOString()
    })
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function syncProfiles(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { profileIds } = await request.json();
    
    let targetProfiles = profileIds;
    if (!targetProfiles) {
      // Get all profiles needing sync
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .in('auth_sync_status', ['pending', 'conflict', 'error']);
      
      targetProfiles = profiles?.map(p => p.id) || [];
    }

    let processed = 0;
    let failed = 0;
    const errors: { profileId: string; error: string }[] = [];

    for (const profileId of targetProfiles) {
      try {
        await syncProfileWithAuth(supabase, profileId);
        processed++;
      } catch (error) {
        failed++;
        errors.push({
          profileId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: failed === 0,
        processed,
        failed,
        errors,
        operationId: crypto.randomUUID()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'sync',
      resource: 'profiles'
    }, corsHeaders);
  }
}