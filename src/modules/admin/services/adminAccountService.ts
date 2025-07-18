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
  address?: string;
  logo_url?: string;
  website_url?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: { count: number }[];
}

export interface AccountFilters {
  search?: string;
  type?: string;
  // Note: status filtering would need to be done via profiles table
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

  // Account Management Methods
  async getAccounts(filters: AccountFilters = {}): Promise<AccountResponse> {
    try {
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
          created_at,
          updated_at,
          profiles(count)
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      // Note: status field is in profiles table, not accounts table
      // if (filters.status) {
      //   query = query.eq('status', filters.status);
      // }

      // Apply sorting - validate sort field to prevent SQL errors
      let sortField = filters.sortBy || 'created_at';
      const validSortFields = ['name', 'type', 'created_at', 'updated_at'];
      
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
          address,
          logo_url,
          website_url,
          stripe_customer_id,
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
}

export default AdminAccountService;