// Epic 3: Admin Service Activity Handler
// File: activity-handler.ts
// Purpose: Handle account activity operations for the admin platform

interface ActivityRequest {
  accountId: string;
  activityType: string;
  targetType: string;
  targetId: string;
  description: string;
  metadata?: Record<string, any>;
}

interface ActivityFilters {
  accountId?: string;
  activityType?: string[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function handleActivityOperations(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  try {
    // GET /admin-service/accounts/:id/activities - List activities
    if (method === 'GET' && url.pathname.includes('/activities')) {
      return await getAccountActivities(request, supabase, corsHeaders);
    }

    // POST /admin-service/accounts/:id/activities - Log activity
    if (method === 'POST' && url.pathname.includes('/activities')) {
      return await logActivity(request, supabase, corsHeaders);
    }

    // GET /admin-service/activity-summary - Get activity summary
    if (method === 'GET' && url.pathname.includes('/activity-summary')) {
      return await getActivitySummary(request, supabase, corsHeaders);
    }

    // GET /admin-service/recent-activities - Get recent activities across all accounts
    if (method === 'GET' && url.pathname.includes('/recent-activities')) {
      return await getRecentActivities(request, supabase, corsHeaders);
    }

    // GET /admin-service/activity-metrics - Get activity performance metrics
    if (method === 'GET' && url.pathname.includes('/activity-metrics')) {
      return await getActivityMetrics(request, supabase, corsHeaders);
    }

    // POST /admin-service/bulk-activity-report - Generate bulk activity report
    if (method === 'POST' && url.pathname.includes('/bulk-activity-report')) {
      return await generateBulkActivityReport(request, supabase, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Activity endpoint not found' }), 
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Activity handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function getAccountActivities(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  
  // Extract account ID from path: /admin-service/accounts/:id/activities
  const pathParts = url.pathname.split('/');
  const accountIdIndex = pathParts.findIndex(part => part === 'accounts') + 1;
  const accountId = pathParts[accountIdIndex];
  
  if (!accountId) {
    return new Response(
      JSON.stringify({ error: 'Account ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Extract query parameters with defaults
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100); // Cap at 100
  const activityType = url.searchParams.get('type');
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');
  const sortBy = url.searchParams.get('sortBy') || 'created_at';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';

  try {
    // Build the query
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
        created_at,
        profiles:actor_id (
          id,
          full_name,
          email
        )
      `, { count: 'exact' })
      .eq('account_id', accountId);

    // Apply filters
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: activities, error, count } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activities' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform data to include actor names
    const transformedActivities = activities?.map(activity => ({
      ...activity,
      actor_name: activity.profiles?.full_name || activity.profiles?.email || 'System',
      actor_email: activity.profiles?.email
    })) || [];

    return new Response(
      JSON.stringify({
        activities: transformedActivities,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function logActivity(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: ActivityRequest = await request.json();
    const { accountId, activityType, targetType, targetId, description, metadata } = body;

    // Validate required fields
    if (!accountId || !activityType || !targetType || !targetId || !description) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: accountId, activityType, targetType, targetId, description' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate activity type
    const validActivityTypes = [
      'account_created', 'account_updated', 'account_deleted',
      'profile_added', 'profile_removed', 'profile_updated',
      'status_changed', 'type_changed', 'access_granted', 'access_revoked',
      'tool_assigned', 'tool_removed', 'tool_access_modified',
      'billing_updated', 'subscription_changed', 'payment_processed',
      'login_success', 'login_failed', 'password_changed',
      'data_export', 'bulk_operation', 'admin_action'
    ];

    if (!validActivityTypes.includes(activityType)) {
      return new Response(
        JSON.stringify({ error: `Invalid activity type: ${activityType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call the logging function
    const { data, error } = await supabase.rpc('log_account_activity', {
      p_account_id: accountId,
      p_activity_type: activityType,
      p_target_type: targetType,
      p_target_id: targetId,
      p_description: description,
      p_metadata: metadata || {}
    });

    if (error) {
      console.error('Error logging activity:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log activity' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        activityId: data,
        message: 'Activity logged successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in logActivity:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getActivitySummary(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Use the pre-built view for activity summary
    const { data: summary, error } = await supabase
      .from('activity_summary_by_type')
      .select('*')
      .order('total_count', { ascending: false });

    if (error) {
      console.error('Error fetching activity summary:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activity summary' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in getActivitySummary:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getRecentActivities(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100); // Cap at 100

  try {
    // Use the pre-built view for recent activities
    const { data: activities, error } = await supabase
      .from('recent_account_activities')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activities:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch recent activities' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ activities }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in getRecentActivities:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getActivityMetrics(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const accountId = url.searchParams.get('accountId');

  try {
    // Get total activities count
    let totalQuery = supabase
      .from('account_activities')
      .select('*', { count: 'exact', head: true });

    let recentQuery = supabase
      .from('account_activities')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (accountId) {
      totalQuery = totalQuery.eq('account_id', accountId);
      recentQuery = recentQuery.eq('account_id', accountId);
    }

    const [totalResult, recentResult] = await Promise.all([
      totalQuery,
      recentQuery
    ]);

    // Get top activity types (last 30 days)
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
    typeData?.forEach((activity: any) => {
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

      return trendQuery.then((result: any) => ({
        date: dayStart.split('T')[0],
        count: result.count || 0
      }));
    });

    const activityTrends = await Promise.all(trendPromises);

    const metrics = {
      totalActivities: totalResult.count || 0,
      recentActivities: recentResult.count || 0,
      topActivityTypes,
      activityTrends: activityTrends.reverse() // Most recent first
    };

    return new Response(
      JSON.stringify({ metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in getActivityMetrics:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function generateBulkActivityReport(
  request: Request,
  supabase: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();
    const { 
      dateFrom, 
      dateTo, 
      activityTypes, 
      accountTypes, 
      includeSystem = true 
    } = body;

    // Build base query
    let query = supabase
      .from('account_activities')
      .select(`
        id,
        activity_type,
        target_type,
        created_at,
        actor_id,
        account_id,
        accounts:account_id (
          type,
          name
        )
      `);

    // Apply filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }
    if (activityTypes?.length > 0) {
      query = query.in('activity_type', activityTypes);
    }
    if (!includeSystem) {
      query = query.not('actor_id', 'is', null);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error('Error fetching bulk activities:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activities for report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the data for report
    const report = {
      totalActivities: activities?.length || 0,
      uniqueAccounts: new Set(activities?.map((a: any) => a.account_id)).size,
      timeRange: `${dateFrom || 'beginning'} to ${dateTo || 'now'}`,
      generatedAt: new Date().toISOString(),
      activities: activities || [],
      summary: {
        byType: {} as Record<string, number>,
        byAccountType: {} as Record<string, number>,
        byDate: {} as Record<string, number>
      }
    };

    // Generate summary statistics
    activities?.forEach((activity: any) => {
      // By activity type
      report.summary.byType[activity.activity_type] = 
        (report.summary.byType[activity.activity_type] || 0) + 1;

      // By account type
      const accountType = activity.accounts?.type || 'unknown';
      report.summary.byAccountType[accountType] = 
        (report.summary.byAccountType[accountType] || 0) + 1;

      // By date
      const date = activity.created_at.split('T')[0];
      report.summary.byDate[date] = (report.summary.byDate[date] || 0) + 1;
    });

    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in generateBulkActivityReport:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}