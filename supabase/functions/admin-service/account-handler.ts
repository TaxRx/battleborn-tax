// Epic 3: Admin Service Account Handler
// File: account-handler.ts
// Purpose: Complete CRUD operations for account management with integrated activity logging
// Story: 1.2 - Account CRUD Operations

import {
  validateAccountData,
  validateAccountTypeTransition,
  validateAccountDeletion,
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

interface AccountRequest {
  name: string;
  type: 'admin' | 'operator' | 'affiliate' | 'client' | 'expert';
  address?: string;
  logo_url?: string;
  website_url?: string;
  stripe_customer_id?: string;
  contact_email?: string;
  auto_link_new_clients?: boolean;
}

interface AccountFilters {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface Account {
  id: string;
  name: string;
  type: string;
  address?: string;
  logo_url?: string;
  website_url?: string;
  stripe_customer_id?: string;
  contact_email?: string;
  auto_link_new_clients?: boolean;
  created_at: string;
  updated_at: string;
  profile_count?: number;
}

// Global rate limiting cache
const requestCache = new Map<string, number[]>();

export async function handleAccountOperations(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  try {
    // Account routes mapping
    if (method === 'GET' && url.pathname.includes('/accounts/') && !url.pathname.includes('/activities')) {
      return await getAccount(request, supabase, corsHeaders);
    } else if (method === 'GET' && url.pathname.includes('/accounts')) {
      return await getAccounts(request, supabase, corsHeaders);
    } else if (method === 'POST' && url.pathname.includes('/accounts')) {
      return await createAccount(request, supabase, corsHeaders);
    } else if (method === 'PUT' && url.pathname.includes('/accounts/')) {
      return await updateAccount(request, supabase, corsHeaders);
    } else if (method === 'DELETE' && url.pathname.includes('/accounts/')) {
      return await deleteAccount(request, supabase, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Account endpoint not found' }), 
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Account handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function getAccounts(
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
  const search = url.searchParams.get('search')?.trim();
  const type = url.searchParams.get('type');

  try {
    // Create cache key for this query
    const filters = { search, type };
    const cacheKey = createCacheKey('accounts', filters, { page, limit: safeSortBy + ':' + safeSortOrder });

    // Execute optimized query with caching
    const result = await executeOptimizedQuery(
      async () => {
        // Build the query with profile count
        let query = supabase
          .from('accounts')
          .select(`
            id,
            name,
            type,
            address,
            logo_url,
            website_url,
            stripe_customer_id,
            contact_email,
            auto_link_new_clients,
            created_at,
            updated_at,
            profiles:profiles(count)
          `, { count: 'exact' });

        // Apply filters
        if (search) {
          query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
        }
        if (type && ['admin', 'operator', 'affiliate', 'client', 'expert'].includes(type)) {
          query = query.eq('type', type);
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
      'getAccounts',
      { enableCaching: true }
    );

    if (result.error) {
      return handleDatabaseError(result.error, {
        operation: 'fetch',
        resource: 'accounts',
        request_path: '/accounts'
      }, corsHeaders);
    }

    // Transform data to include profile count
    const transformedAccounts = result.data?.map((account: any) => ({
      ...account,
      profile_count: account.profiles?.[0]?.count || 0
    })) || [];

    // Prefetch related data for better performance
    const accountIds = transformedAccounts.map((account: any) => account.id);
    if (accountIds.length > 0) {
      prefetchRelatedData(supabase, accountIds).catch(console.warn);
    }

    return new Response(
      JSON.stringify({
        accounts: transformedAccounts,
        pagination: {
          page,
          limit,
          total: result.count || 0,
          pages: Math.ceil((result.count || 0) / limit)
        },
        fromCache: result.fromCache
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'fetch',
      resource: 'accounts',
      request_path: '/accounts'
    }, corsHeaders);
  }
}

async function getAccount(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  
  // Extract account ID from path: /admin-service/accounts/:id
  const pathParts = url.pathname.split('/');
  const accountIdIndex = pathParts.findIndex(part => part === 'accounts') + 1;
  const accountId = pathParts[accountIdIndex];
  
  if (!accountId || !isValidUUID(accountId)) {
    return new Response(
      JSON.stringify({ error: 'Valid account ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { data: account, error } = await supabase
      .from('accounts')
      .select(`
        id,
        name,
        type,
        address,
        logo_url,
        website_url,
        stripe_customer_id,
        contact_email,
        auto_link_new_clients,
        created_at,
        updated_at,
        profiles:profiles(
          id,
          full_name,
          email,
          role,
          created_at
        )
      `)
      .eq('id', accountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Account not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Error fetching account:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ account }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in getAccount:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function createAccount(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: AccountRequest = await request.json();
    
    // Rate limiting check
    const rateLimitValidation = validateRequestRate('create', 'global', requestCache);
    if (!rateLimitValidation.isValid) {
      return new Response(
        JSON.stringify({ error: rateLimitValidation.errors[0] }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize input data
    if (body.name) body.name = sanitizeStringInput(body.name);
    if (body.address) body.address = sanitizeStringInput(body.address);
    if (body.website_url) body.website_url = sanitizeStringInput(body.website_url);
    if (body.logo_url) body.logo_url = sanitizeStringInput(body.logo_url);
    if (body.stripe_customer_id) body.stripe_customer_id = sanitizeStringInput(body.stripe_customer_id);
    if (body.contact_email) body.contact_email = sanitizeStringInput(body.contact_email);
    
    // Comprehensive validation
    const validation = validateAccountData(body, { checkUniqueness: true });
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

    // Check for existing account with same name
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('name', body.name.trim())
      .single();

    if (existingAccount) {
      return new Response(
        JSON.stringify({ error: 'Account with this name already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing stripe_customer_id if provided
    if (body.stripe_customer_id) {
      const { data: existingStripeAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('stripe_customer_id', body.stripe_customer_id)
        .single();

      if (existingStripeAccount) {
        return new Response(
          JSON.stringify({ error: 'Account with this Stripe customer ID already exists' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create the account
    const { data: newAccount, error } = await supabase
      .from('accounts')
      .insert([{
        name: body.name.trim(),
        type: body.type,
        address: body.address?.trim() || null,
        logo_url: body.logo_url?.trim() || null,
        website_url: body.website_url?.trim() || null,
        stripe_customer_id: body.stripe_customer_id?.trim() || null,
        contact_email: body.contact_email?.trim() || null,
        auto_link_new_clients: body.auto_link_new_clients || false
      }])
      .select()
      .single();

    if (error) {
      return handleDatabaseError(error, {
        operation: 'create',
        resource: 'account'
      }, corsHeaders);
    }

    // Log the activity (the database trigger will also log automatically, but this provides manual control)
    try {
      await supabase.rpc('log_account_activity', {
        p_account_id: newAccount.id,
        p_activity_type: 'admin_action',
        p_target_type: 'account',
        p_target_id: newAccount.id,
        p_description: `Manual account creation via admin interface: ${newAccount.name}`,
        p_metadata: {
          action: 'create_account',
          account_type: newAccount.type,
          created_via: 'admin_service'
        }
      });
    } catch (logError) {
      console.warn('Failed to log manual activity:', logError);
    }

    // Invalidate cache after successful creation
    invalidateRelatedCache('create', newAccount.id);

    return new Response(
      JSON.stringify({ 
        account: newAccount,
        message: 'Account created successfully'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'create',
      resource: 'account'
    }, corsHeaders);
  }
}

async function updateAccount(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  
  // Extract account ID from path
  const pathParts = url.pathname.split('/');
  const accountIdIndex = pathParts.findIndex(part => part === 'accounts') + 1;
  const accountId = pathParts[accountIdIndex];
  
  if (!accountId || !isValidUUID(accountId)) {
    return new Response(
      JSON.stringify({ error: 'Valid account ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: Partial<AccountRequest> = await request.json();
    
    // Rate limiting check
    const rateLimitValidation = validateRequestRate('update', accountId, requestCache);
    if (!rateLimitValidation.isValid) {
      return new Response(
        JSON.stringify({ error: rateLimitValidation.errors[0] }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize input data
    if (body.name) body.name = sanitizeStringInput(body.name);
    if (body.address) body.address = sanitizeStringInput(body.address);
    if (body.website_url) body.website_url = sanitizeStringInput(body.website_url);
    if (body.logo_url) body.logo_url = sanitizeStringInput(body.logo_url);
    if (body.stripe_customer_id) body.stripe_customer_id = sanitizeStringInput(body.stripe_customer_id);
    if (body.contact_email) body.contact_email = sanitizeStringInput(body.contact_email);

    // Check if account exists first
    const { data: existingAccount, error: fetchError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Account not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Error fetching account for update:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Comprehensive validation with context
    const validation = validateAccountData(body, { 
      isUpdate: true, 
      existingAccount, 
      checkUniqueness: true 
    });
    
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

    // Validate account type transition if type is changing
    if (body.type && body.type !== existingAccount.type) {
      const transitionValidation = validateAccountTypeTransition(existingAccount.type, body.type);
      if (!transitionValidation.isValid) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid account type transition', 
            details: transitionValidation.errors,
            warnings: transitionValidation.warnings 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for name conflicts if name is being changed
    if (body.name && body.name.trim() !== existingAccount.name) {
      const { data: conflictingAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('name', body.name.trim())
        .neq('id', accountId)
        .single();

      if (conflictingAccount) {
        return new Response(
          JSON.stringify({ error: 'Another account with this name already exists' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare update data - only include fields that are actually being updated
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url?.trim() || null;
    if (body.website_url !== undefined) updateData.website_url = body.website_url?.trim() || null;
    if (body.stripe_customer_id !== undefined) updateData.stripe_customer_id = body.stripe_customer_id?.trim() || null;
    if (body.contact_email !== undefined) updateData.contact_email = body.contact_email?.trim() || null;
    if (body.auto_link_new_clients !== undefined) updateData.auto_link_new_clients = body.auto_link_new_clients;

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Perform the update
    const { data: updatedAccount, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', accountId)
      .select()
      .single();

    if (error) {
      return handleDatabaseError(error, {
        operation: 'update',
        resource: 'account',
        account_id: accountId
      }, corsHeaders);
    }

    // Log the manual update activity
    try {
      const changedFields = Object.keys(updateData).filter(key => key !== 'updated_at');
      await supabase.rpc('log_account_activity', {
        p_account_id: accountId,
        p_activity_type: 'admin_action',
        p_target_type: 'account',
        p_target_id: accountId,
        p_description: `Manual account update via admin interface: ${changedFields.join(', ')} changed`,
        p_metadata: {
          action: 'update_account',
          changed_fields: changedFields,
          old_values: Object.fromEntries(changedFields.map(field => [field, existingAccount[field]])),
          new_values: Object.fromEntries(changedFields.map(field => [field, updateData[field]])),
          updated_via: 'admin_service'
        }
      });
    } catch (logError) {
      console.warn('Failed to log manual activity:', logError);
    }

    // Invalidate cache after successful update
    invalidateRelatedCache('update', accountId);

    return new Response(
      JSON.stringify({ 
        account: updatedAccount,
        message: 'Account updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'update',
      resource: 'account',
      account_id: accountId
    }, corsHeaders);
  }
}

async function deleteAccount(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  
  // Extract account ID from path
  const pathParts = url.pathname.split('/');
  const accountIdIndex = pathParts.findIndex(part => part === 'accounts') + 1;
  const accountId = pathParts[accountIdIndex];
  
  if (!accountId || !isValidUUID(accountId)) {
    return new Response(
      JSON.stringify({ error: 'Valid account ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Rate limiting check
    const rateLimitValidation = validateRequestRate('delete', accountId, requestCache);
    if (!rateLimitValidation.isValid) {
      return new Response(
        JSON.stringify({ error: rateLimitValidation.errors[0] }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Comprehensive deletion safety validation
    const deletionValidation = await validateAccountDeletion(accountId, supabase);
    if (!deletionValidation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Account deletion not allowed', 
          details: deletionValidation.errors,
          warnings: deletionValidation.warnings 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get account data for logging (validation already confirmed it exists)
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    // Log the deletion activity before deletion (since the trigger might not capture admin context)
    try {
      await supabase.rpc('log_account_activity', {
        p_account_id: accountId,
        p_activity_type: 'admin_action',
        p_target_type: 'account',
        p_target_id: accountId,
        p_description: `Manual account deletion via admin interface: ${existingAccount.name}`,
        p_metadata: {
          action: 'delete_account',
          deleted_account_data: existingAccount,
          deletion_reason: 'admin_request',
          deleted_via: 'admin_service'
        }
      });
    } catch (logError) {
      console.warn('Failed to log deletion activity:', logError);
    }

    // Perform the deletion
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      return handleDatabaseError(error, {
        operation: 'delete',
        resource: 'account',
        account_id: accountId
      }, corsHeaders);
    }

    // Invalidate cache after successful deletion
    invalidateRelatedCache('delete', accountId);

    return new Response(
      JSON.stringify({ 
        message: 'Account deleted successfully',
        deleted_account: {
          id: existingAccount.id,
          name: existingAccount.name,
          type: existingAccount.type
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleServerError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'delete',
      resource: 'account',
      account_id: accountId
    }, corsHeaders);
  }
}

// All validation functions have been moved to validation-utils.ts for better organization and reusability