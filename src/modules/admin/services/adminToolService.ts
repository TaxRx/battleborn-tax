// Epic 3 Sprint 2 Day 2: Admin Tool Service
// File: adminToolService.ts
// Purpose: Service layer for tool assignment matrix and subscription management operations

import { supabase } from '../../../lib/supabase';

// Types for tool assignments
export interface ToolAssignment {
  account_id: string;
  tool_id: string;
  account_name: string;
  account_type: string;
  tool_name: string;
  tool_slug: string;
  access_level: string;
  subscription_level: 'basic' | 'premium' | 'enterprise' | 'trial' | 'custom';
  status: 'active' | 'inactive' | 'expired' | 'suspended';
  expires_at: string | null;
  granted_at: string;
  last_accessed_at: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  notes: string | null;
  features_enabled: Record<string, any>;
  usage_limits: Record<string, any>;
  is_expired: boolean;
  expires_soon: boolean | null;
}

export interface ToolAssignmentFilters {
  search?: string;
  accountType?: string;
  toolCategory?: string;
  subscriptionLevel?: string;
  status?: string;
  expirationStatus?: 'active' | 'expires_soon' | 'expired';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ToolAssignmentMatrix {
  assignments: ToolAssignment[];
  accounts: Account[];
  tools: Tool[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Account {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
}

export interface ToolAssignmentData {
  accountId: string;
  toolId: string;
  subscriptionLevel: 'basic' | 'premium' | 'enterprise' | 'trial' | 'custom';
  accessLevel: string;
  expiresAt?: string;
  notes?: string;
  featuresEnabled?: Record<string, any>;
  usageLimits?: Record<string, any>;
  notificationSettings?: Record<string, any>;
  autoRenewal?: boolean;
  renewalPeriod?: 'monthly' | 'quarterly' | 'yearly';
}

export interface ToolAssignmentUpdate {
  subscriptionLevel?: 'basic' | 'premium' | 'enterprise' | 'trial' | 'custom';
  accessLevel?: string;
  expiresAt?: string | null;
  notes?: string;
  featuresEnabled?: Record<string, any>;
  usageLimits?: Record<string, any>;
  notificationSettings?: Record<string, any>;
  autoRenewal?: boolean;
  renewalPeriod?: 'monthly' | 'quarterly' | 'yearly';
  status?: 'active' | 'inactive' | 'expired' | 'suspended';
}

export interface BulkToolAssignment {
  accountId: string;
  toolId: string;
  subscriptionLevel: 'basic' | 'premium' | 'enterprise' | 'trial' | 'custom';
  accessLevel: string;
  expiresAt?: string;
}

export interface BulkAssignmentUpdate {
  accountIds: string[];
  toolId?: string;
  subscriptionLevel?: 'basic' | 'premium' | 'enterprise' | 'trial' | 'custom';
  accessLevel?: string;
  expiresAt?: string | null;
  status?: 'active' | 'inactive' | 'expired' | 'suspended';
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: { accountId: string; error: string }[];
  operationId: string;
}

// Analytics Interfaces
export interface UsageMetricsFilters {
  timeRange?: 'last_24_hours' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
  accountId?: string;
  toolId?: string;
  interval?: 'hour' | 'day' | 'week' | 'month';
}

export interface ToolUsageMetrics {
  overview: {
    total_events: number;
    unique_accounts: number;
    unique_users: number;
    avg_session_duration: number;
    success_rate: number;
    data_volume_mb: number;
  };
  trends: UsageTrend[];
  topTools: ToolUsageSummary[];
  timeRange: string;
}

export interface UsageTrend {
  date: string;
  total_events: number;
  unique_accounts: number;
  avg_duration: number;
  success_rate: number;
}

export interface ToolUsageSummary {
  tool_id: string;
  tool_name: string;
  tool_slug: string;
  total_usage_events: number;
  unique_accounts: number;
  unique_users: number;
  failed_events: number;
  avg_duration_seconds: number;
  total_data_volume_mb: number;
  last_usage: string;
  usage_last_24h: number;
  usage_last_7d: number;
  usage_last_30d: number;
}

export interface UsageAnalyticsFilters {
  timeRange?: 'last_24_hours' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
  accountType?: string;
  toolCategory?: string;
}

export interface UsageAnalytics {
  accountAnalytics: AccountUsageAnalytics[];
  toolAnalytics: ToolAnalyticsData[];
  featureUsage: FeatureUsageData[];
  timeRange: string;
  totalPeriod: number;
}

export interface AccountUsageAnalytics {
  account_id: string;
  account_name: string;
  account_type: string;
  total_events: number;
  unique_tools: number;
  avg_session_duration: number;
  last_activity: string;
  most_used_tool: string;
}

export interface ToolAnalyticsData {
  tool_id: string;
  tool_name: string;
  category: string;
  total_events: number;
  unique_accounts: number;
  avg_duration: number;
  success_rate: number;
  growth_rate: number;
}

export interface FeatureUsageData {
  action: string;
  feature_used: string;
  usage_count: number;
}

export interface ExportFilters {
  timeRange?: 'last_24_hours' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
  accountId?: string;
  toolId?: string;
  format: 'csv' | 'pdf';
  includeMetadata?: boolean;
}

// Tool CRUD Interfaces
export interface ToolData {
  name: string;
  slug: string;
  category: string;
  description: string;
  icon?: string;
  config: Record<string, any>;
  features: ToolFeature[];
  pricing: ToolPricing;
  status: 'active' | 'inactive' | 'beta' | 'deprecated';
  version: string;
  metadata?: Record<string, any>;
}

export interface ToolFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  subscription_levels: ('basic' | 'premium' | 'enterprise')[];
  config?: Record<string, any>;
}

export interface ToolPricing {
  basic: {
    price: number;
    features: string[];
    limits: Record<string, number>;
  };
  premium: {
    price: number;
    features: string[];
    limits: Record<string, number>;
  };
  enterprise: {
    price: number;
    features: string[];
    limits: Record<string, number>;
  };
}

export interface ToolUpdate {
  name?: string;
  description?: string;
  category?: string;
  icon?: string;
  config?: Record<string, any>;
  features?: ToolFeature[];
  pricing?: ToolPricing;
  status?: 'active' | 'inactive' | 'beta' | 'deprecated';
  version?: string;
  metadata?: Record<string, any>;
}

class AdminToolService {
  private static instance: AdminToolService;

  private constructor() {}

  public static getInstance(): AdminToolService {
    if (!AdminToolService.instance) {
      AdminToolService.instance = new AdminToolService();
    }
    return AdminToolService.instance;
  }

  // Matrix Operations
  async getToolAssignmentMatrix(filters: ToolAssignmentFilters = {}): Promise<ToolAssignmentMatrix> {
    try {
      // Load ALL active tools first
      const toolsResult = await supabase
        .from('tools')
        .select('id, name, slug, description, status')
        .eq('status', 'active');

      if (toolsResult.error) throw toolsResult.error;
      const tools = toolsResult.data || [];

      // Load assignments first to get accounts that have assignments
      let assignmentsQuery = supabase
        .from('active_tool_assignments')
        .select('*');

      // Apply assignment-specific filters
      if (filters.subscriptionLevel) {
        assignmentsQuery = assignmentsQuery.eq('subscription_level', filters.subscriptionLevel);
      }
      if (filters.status) {
        assignmentsQuery = assignmentsQuery.eq('status', filters.status);
      }
      if (filters.expirationStatus) {
        switch (filters.expirationStatus) {
          case 'active':
            assignmentsQuery = assignmentsQuery.eq('is_expired', false);
            break;
          case 'expires_soon':
            assignmentsQuery = assignmentsQuery.eq('expires_soon', true);
            break;
          case 'expired':
            assignmentsQuery = assignmentsQuery.eq('is_expired', true);
            break;
        }
      }

      const { data: assignments, error: assignmentsError } = await assignmentsQuery;
      if (assignmentsError) throw assignmentsError;

      // Get unique account IDs that have assignments
      const accountIdsWithAssignments = [...new Set(assignments?.map(a => a.account_id) || [])];
      
      if (accountIdsWithAssignments.length === 0) {
        return {
          assignments: [],
          accounts: [],
          tools: tools,
          pagination: {
            page: 1,
            limit: 100,
            total: 0,
            pages: 0
          }
        };
      }

      // Load accounts that have assignments
      const accountsResult = await supabase
        .from('accounts')
        .select('id, name, type, status, created_at')
        .in('id', accountIdsWithAssignments);

      if (accountsResult.error) throw accountsResult.error;
      let accounts = accountsResult.data || [];

      // Apply account type filter
      if (filters.accountType) {
        accounts = accounts.filter(acc => acc.type === filters.accountType);
      }

      // Apply search filter to accounts
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        accounts = accounts.filter(acc => 
          acc.name.toLowerCase().includes(searchLower) ||
          acc.type.toLowerCase().includes(searchLower)
        );
      }

      // Sort accounts
      const ascending = filters.sortOrder === 'asc';
      accounts.sort((a, b) => {
        const sortBy = filters.sortBy || 'name';
        const aVal = a[sortBy as keyof typeof a] || '';
        const bVal = b[sortBy as keyof typeof b] || '';
        return ascending ? 
          aVal.toString().localeCompare(bVal.toString()) :
          bVal.toString().localeCompare(aVal.toString());
      });

      // Apply pagination to accounts (tools are always shown in full)
      const page = filters.page || 1;
      const limit = filters.limit || 100;
      const totalAccounts = accounts.length;
      const from = (page - 1) * limit;
      const paginatedAccounts = accounts.slice(from, from + limit);

      // Filter assignments to only include the paginated accounts
      const paginatedAccountIds = paginatedAccounts.map(acc => acc.id);
      const filteredAssignments = assignments?.filter(a => paginatedAccountIds.includes(a.account_id)) || [];

      return {
        assignments: filteredAssignments,
        accounts: paginatedAccounts,
        tools: tools,
        pagination: {
          page,
          limit,
          total: totalAccounts,
          pages: Math.ceil(totalAccounts / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching tool assignment matrix:', error);
      throw error;
    }
  }

  // Tool Operations
  async getAllTools(): Promise<Tool[]> {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, name, slug, description, status')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tools:', error);
      throw error;
    }
  }

  async getToolMetrics(): Promise<{
    activeTools: number;
    totalAssignments: number;
    premiumSubscriptions: number;
    expiringSoon: number;
  }> {
    try {
      const [toolsResult, assignmentsResult] = await Promise.all([
        supabase.from('tools').select('status'),
        supabase.from('active_tool_assignments').select('subscription_level, expires_soon')
      ]);

      if (toolsResult.error) throw toolsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;

      const tools = toolsResult.data || [];
      const assignments = assignmentsResult.data || [];

      const activeTools = tools.filter(tool => tool.status === 'active').length;
      const totalAssignments = assignments.length;
      const premiumSubscriptions = assignments.filter(assignment => 
        ['premium', 'enterprise', 'custom'].includes(assignment.subscription_level)
      ).length;
      const expiringSoon = assignments.filter(assignment => 
        assignment.expires_soon === true
      ).length;

      return {
        activeTools,
        totalAssignments,
        premiumSubscriptions,
        expiringSoon
      };
    } catch (error) {
      console.error('Error fetching tool metrics:', error);
      throw error;
    }
  }

  // Individual Assignment Operations
  async assignTool(assignment: ToolAssignmentData): Promise<ToolAssignment> {
    try {
      // Get current user ID for created_by field
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('account_tool_access')
        .insert({
          account_id: assignment.accountId,
          tool_id: assignment.toolId,
          access_level: assignment.accessLevel,
          subscription_level: assignment.subscriptionLevel,
          expires_at: assignment.expiresAt || null,
          notes: assignment.notes || null,
          features_enabled: assignment.featuresEnabled || {},
          usage_limits: assignment.usageLimits || {},
          status: 'active',
          granted_at: new Date().toISOString(),
          created_by: userData.user?.id,
          granted_by: userData.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Log the assignment activity with enhanced details
      await this.logToolActivity({
        accountId: assignment.accountId,
        activityType: 'admin_action',
        targetType: 'tool',
        targetId: assignment.toolId,
        description: `Tool access granted with ${assignment.subscriptionLevel} subscription${assignment.expiresAt ? ` until ${assignment.expiresAt}` : ' (permanent)'}`,
        metadata: {
          action: 'assign_tool',
          subscription_level: assignment.subscriptionLevel,
          access_level: assignment.accessLevel,
          expires_at: assignment.expiresAt,
          features_enabled: assignment.featuresEnabled,
          usage_limits: assignment.usageLimits
        }
      });

      // Return the assignment from the view for consistent format
      const { data: viewData, error: viewError } = await supabase
        .from('active_tool_assignments')
        .select('*')
        .eq('account_id', assignment.accountId)
        .eq('tool_id', assignment.toolId)
        .single();

      if (viewError) throw viewError;

      return viewData;
    } catch (error) {
      console.error('Error assigning tool:', error);
      throw error;
    }
  }

  async unassignTool(accountId: string, toolId: string): Promise<void> {
    try {
      // Get the current assignment for logging
      const { data: currentAssignment } = await supabase
        .from('active_tool_assignments')
        .select('*')
        .eq('account_id', accountId)
        .eq('tool_id', toolId)
        .single();

      const { error } = await supabase
        .from('account_tool_access')
        .delete()
        .eq('account_id', accountId)
        .eq('tool_id', toolId);

      if (error) throw error;

      // Log the unassignment activity
      await this.logToolActivity({
        accountId,
        activityType: 'admin_action',
        targetType: 'tool',
        targetId: toolId,
        description: `Tool access removed (was ${currentAssignment?.subscription_level} subscription)`,
        metadata: {
          action: 'unassign_tool',
          previous_subscription_level: currentAssignment?.subscription_level,
          previous_access_level: currentAssignment?.access_level
        }
      });
    } catch (error) {
      console.error('Error unassigning tool:', error);
      throw error;
    }
  }

  async updateAssignment(accountId: string, toolId: string, updates: ToolAssignmentUpdate): Promise<ToolAssignment> {
    try {
      // Get current assignment for comparison
      const { data: currentAssignment } = await supabase
        .from('active_tool_assignments')
        .select('*')
        .eq('account_id', accountId)
        .eq('tool_id', toolId)
        .single();

      // Get current user ID for updated_by field
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('account_tool_access')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userData.user?.id
        })
        .eq('account_id', accountId)
        .eq('tool_id', toolId)
        .select()
        .single();

      if (error) throw error;

      // Log the update activity
      const changes: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (currentAssignment && currentAssignment[key] !== value) {
          changes[key] = { from: currentAssignment[key], to: value };
        }
      });

      await this.logToolActivity({
        accountId,
        activityType: 'admin_action',
        targetType: 'tool',
        targetId: toolId,
        description: `Tool access updated: ${Object.keys(changes).join(', ')}`,
        metadata: {
          action: 'update_assignment',
          changes
        }
      });

      // Return the updated assignment from the view
      const { data: viewData, error: viewError } = await supabase
        .from('active_tool_assignments')
        .select('*')
        .eq('account_id', accountId)
        .eq('tool_id', toolId)
        .single();

      if (viewError) throw viewError;

      return viewData;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }

  // Bulk Operations
  async bulkAssignTools(assignments: BulkToolAssignment[]): Promise<BulkOperationResult> {
    const operationId = crypto.randomUUID();
    let processed = 0;
    let failed = 0;
    const errors: { accountId: string; error: string }[] = [];

    try {
      // Process assignments in batches of 10 for better performance
      const batchSize = 10;
      for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (assignment) => {
          try {
            await this.assignTool(assignment);
            processed++;
          } catch (error) {
            failed++;
            errors.push({
              accountId: assignment.accountId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        });

        await Promise.allSettled(batchPromises);
      }

      // Log bulk operation
      await this.logToolActivity({
        accountId: assignments[0]?.accountId, // Use first account for activity logging
        activityType: 'admin_action',
        targetType: 'tool',
        targetId: 'bulk_operation',
        description: `Bulk tool assignment: ${processed} successful, ${failed} failed`,
        metadata: {
          action: 'bulk_assign',
          operation_id: operationId,
          total_assignments: assignments.length,
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
        operationId
      };
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      throw error;
    }
  }

  async bulkUpdateAssignments(updates: BulkAssignmentUpdate[]): Promise<BulkOperationResult> {
    const operationId = crypto.randomUUID();
    let processed = 0;
    let failed = 0;
    const errors: { accountId: string; error: string }[] = [];

    try {
      for (const update of updates) {
        for (const accountId of update.accountIds) {
          try {
            if (update.toolId) {
              await this.updateAssignment(accountId, update.toolId, {
                subscriptionLevel: update.subscriptionLevel,
                accessLevel: update.accessLevel,
                expiresAt: update.expiresAt,
                status: update.status
              });
            }
            processed++;
          } catch (error) {
            failed++;
            errors.push({
              accountId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      return {
        success: failed === 0,
        processed,
        failed,
        errors,
        operationId
      };
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }

  // Activity Logging
  private async logToolActivity(activityData: {
    accountId: string;
    activityType: string;
    targetType: string;
    targetId: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await supabase.rpc('log_account_activity', {
        p_account_id: activityData.accountId,
        p_activity_type: activityData.activityType,
        p_target_type: activityData.targetType,
        p_target_id: activityData.targetId,
        p_description: activityData.description,
        p_metadata: activityData.metadata || {}
      });
    } catch (error) {
      console.error('Error logging tool activity:', error);
      // Don't throw here to avoid breaking the main operation
    }
  }

  // Utility Methods
  async getActiveTools(): Promise<Tool[]> {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, name, slug, description, status')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching active tools:', error);
      throw error;
    }
  }

  async getAccountsForMatrix(filters: { search?: string; type?: string } = {}): Promise<Account[]> {
    try {
      let query = supabase
        .from('accounts')
        .select('id, name, type, created_at');

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      query = query.order('name').limit(1000); // Limit for performance

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching accounts for matrix:', error);
      throw error;
    }
  }

  // Expiration Management
  async getExpiringAssignments(days: number = 7): Promise<ToolAssignment[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabase
        .from('active_tool_assignments')
        .select('*')
        .not('expires_at', 'is', null)
        .lte('expires_at', futureDate.toISOString())
        .eq('status', 'active')
        .order('expires_at');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching expiring assignments:', error);
      throw error;
    }
  }

  // Analytics Methods
  async getToolUsageMetrics(filters: UsageMetricsFilters = {}): Promise<ToolUsageMetrics> {
    try {
      const timeRange = filters.timeRange || 'last_30_days';
      const dateFilter = this.getDateFilter(timeRange);
      
      // Get overall metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_tool_usage_metrics', {
          p_start_date: dateFilter.startDate,
          p_end_date: dateFilter.endDate,
          p_account_id: filters.accountId || null,
          p_tool_id: filters.toolId || null
        });

      if (metricsError) throw metricsError;

      // Get usage trends
      const { data: trendsData, error: trendsError } = await supabase
        .rpc('get_usage_trends', {
          p_start_date: dateFilter.startDate,
          p_end_date: dateFilter.endDate,
          p_interval: filters.interval || 'day'
        });

      if (trendsError) throw trendsError;

      // Get top tools
      const { data: topToolsData, error: topToolsError } = await supabase
        .from('tool_usage_summary')
        .select('*')
        .order('total_usage_events', { ascending: false })
        .limit(10);

      if (topToolsError) throw topToolsError;

      return {
        overview: metricsData[0] || {
          total_events: 0,
          unique_accounts: 0,
          unique_users: 0,
          avg_session_duration: 0,
          success_rate: 100,
          data_volume_mb: 0
        },
        trends: trendsData || [],
        topTools: topToolsData || [],
        timeRange
      };
    } catch (error) {
      console.error('Error fetching tool usage metrics:', error);
      throw error;
    }
  }

  async getUsageAnalytics(filters: UsageAnalyticsFilters = {}): Promise<UsageAnalytics> {
    try {
      const timeRange = filters.timeRange || 'last_30_days';
      const dateFilter = this.getDateFilter(timeRange);

      // Get detailed analytics by account
      const { data: accountData, error: accountError } = await supabase
        .rpc('get_account_usage_analytics', {
          p_start_date: dateFilter.startDate,
          p_end_date: dateFilter.endDate,
          p_account_type: filters.accountType || null
        });

      if (accountError) throw accountError;

      // Get analytics by tool
      const { data: toolData, error: toolError } = await supabase
        .rpc('get_tool_usage_analytics', {
          p_start_date: dateFilter.startDate,
          p_end_date: dateFilter.endDate,
          p_tool_category: filters.toolCategory || null
        });

      if (toolError) throw toolError;

      // Get feature usage analytics
      const { data: featureData, error: featureError } = await supabase
        .from('tool_usage_logs')
        .select('action, feature_used, COUNT(*) as usage_count')
        .gte('created_at', dateFilter.startDate)
        .lte('created_at', dateFilter.endDate)
        .not('feature_used', 'is', null)
        .group('action, feature_used')
        .order('usage_count', { ascending: false })
        .limit(20);

      if (featureError) throw featureError;

      return {
        accountAnalytics: accountData || [],
        toolAnalytics: toolData || [],
        featureUsage: featureData || [],
        timeRange,
        totalPeriod: this.calculatePeriodDays(timeRange)
      };
    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      throw error;
    }
  }

  async exportUsageReport(filters: ExportFilters): Promise<Blob> {
    try {
      const timeRange = filters.timeRange || 'last_30_days';
      const dateFilter = this.getDateFilter(timeRange);

      // Get comprehensive usage data
      const { data, error } = await supabase
        .rpc('get_usage_export_data', {
          p_start_date: dateFilter.startDate,
          p_end_date: dateFilter.endDate,
          p_account_id: filters.accountId || null,
          p_tool_id: filters.toolId || null,
          p_format: filters.format || 'csv'
        });

      if (error) throw error;

      if (filters.format === 'csv') {
        return this.generateCSVReport(data);
      } else if (filters.format === 'pdf') {
        return this.generatePDFReport(data, filters);
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting usage report:', error);
      throw error;
    }
  }

  // Utility methods for analytics
  private getDateFilter(timeRange: string): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'last_24_hours':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case 'last_7_days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last_30_days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last_90_days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'last_year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }

  private calculatePeriodDays(timeRange: string): number {
    switch (timeRange) {
      case 'last_24_hours': return 1;
      case 'last_7_days': return 7;
      case 'last_30_days': return 30;
      case 'last_90_days': return 90;
      case 'last_year': return 365;
      default: return 30;
    }
  }

  private generateCSVReport(data: any[]): Blob {
    if (!data || data.length === 0) {
      return new Blob(['No data available'], { type: 'text/csv' });
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    return new Blob([csvContent], { type: 'text/csv' });
  }

  private generatePDFReport(data: any[], filters: ExportFilters): Blob {
    // For now, return CSV as PDF generation would require additional dependencies
    // In a real implementation, you would use a PDF library like jsPDF
    const csvBlob = this.generateCSVReport(data);
    return csvBlob;
  }

  // Tool CRUD Operations
  async createTool(toolData: ToolData): Promise<Tool> {
    try {
      // Validate tool data
      this.validateToolData(toolData);

      // Check if slug already exists
      const { data: existingTool } = await supabase
        .from('tools')
        .select('id')
        .eq('slug', toolData.slug)
        .single();

      if (existingTool) {
        throw new Error(`Tool with slug '${toolData.slug}' already exists`);
      }

      // Create the tool
      const { data, error } = await supabase
        .from('tools')
        .insert({
          name: toolData.name,
          slug: toolData.slug,
          category: toolData.category,
          description: toolData.description,
          icon: toolData.icon,
          config: toolData.config,
          features: toolData.features,
          pricing: toolData.pricing,
          status: toolData.status,
          version: toolData.version,
          metadata: toolData.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log the tool creation activity
      await this.logToolActivity({
        accountId: '', // System activity - no specific account
        activityType: 'admin_action',
        targetType: 'tool',
        targetId: data.id,
        description: `Tool created: ${toolData.name} (${toolData.slug})`,
        metadata: {
          action: 'create_tool',
          tool_name: toolData.name,
          tool_slug: toolData.slug,
          tool_category: toolData.category,
          tool_status: toolData.status,
          tool_version: toolData.version
        }
      });

      return data;
    } catch (error) {
      console.error('Error creating tool:', error);
      throw error;
    }
  }

  async updateTool(toolId: string, updates: ToolUpdate): Promise<Tool> {
    try {
      // Get current tool for comparison
      const { data: currentTool, error: fetchError } = await supabase
        .from('tools')
        .select('*')
        .eq('id', toolId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentTool) throw new Error('Tool not found');

      // Validate slug uniqueness if it's being updated
      if (updates.slug && updates.slug !== currentTool.slug) {
        const { data: existingTool } = await supabase
          .from('tools')
          .select('id')
          .eq('slug', updates.slug)
          .neq('id', toolId)
          .single();

        if (existingTool) {
          throw new Error(`Tool with slug '${updates.slug}' already exists`);
        }
      }

      // Update the tool
      const { data, error } = await supabase
        .from('tools')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', toolId)
        .select()
        .single();

      if (error) throw error;

      // Log the tool update activity
      const changes: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (currentTool[key] !== value) {
          changes[key] = { from: currentTool[key], to: value };
        }
      });

      await this.logToolActivity({
        accountId: '', // System activity
        activityType: 'admin_action',
        targetType: 'tool',
        targetId: toolId,
        description: `Tool updated: ${currentTool.name} - ${Object.keys(changes).join(', ')}`,
        metadata: {
          action: 'update_tool',
          tool_name: currentTool.name,
          changes
        }
      });

      return data;
    } catch (error) {
      console.error('Error updating tool:', error);
      throw error;
    }
  }

  async deleteTool(toolId: string): Promise<void> {
    try {
      // Get tool info for logging
      const { data: tool, error: fetchError } = await supabase
        .from('tools')
        .select('name, slug')
        .eq('id', toolId)
        .single();

      if (fetchError) throw fetchError;
      if (!tool) throw new Error('Tool not found');

      // Check if tool has active assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('account_tool_access')
        .select('id')
        .eq('tool_id', toolId)
        .eq('status', 'active')
        .limit(1);

      if (assignmentsError) throw assignmentsError;

      if (assignments && assignments.length > 0) {
        throw new Error('Cannot delete tool with active assignments. Please remove all assignments first.');
      }

      // Delete the tool
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolId);

      if (error) throw error;

      // Log the tool deletion activity
      await this.logToolActivity({
        accountId: '', // System activity
        activityType: 'admin_action',
        targetType: 'tool',
        targetId: toolId,
        description: `Tool deleted: ${tool.name} (${tool.slug})`,
        metadata: {
          action: 'delete_tool',
          tool_name: tool.name,
          tool_slug: tool.slug
        }
      });
    } catch (error) {
      console.error('Error deleting tool:', error);
      throw error;
    }
  }

  async deactivateTool(toolId: string, reason?: string): Promise<Tool> {
    try {
      const updates: ToolUpdate = {
        status: 'inactive',
        metadata: {
          deactivated_at: new Date().toISOString(),
          deactivation_reason: reason || 'Manual deactivation'
        }
      };

      const tool = await this.updateTool(toolId, updates);

      // Deactivate all active assignments for this tool
      await supabase
        .from('account_tool_access')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('tool_id', toolId)
        .eq('status', 'active');

      return tool;
    } catch (error) {
      console.error('Error deactivating tool:', error);
      throw error;
    }
  }

  async duplicateTool(toolId: string, newName: string, newSlug: string): Promise<Tool> {
    try {
      // Get the original tool
      const { data: originalTool, error: fetchError } = await supabase
        .from('tools')
        .select('*')
        .eq('id', toolId)
        .single();

      if (fetchError) throw fetchError;
      if (!originalTool) throw new Error('Tool not found');

      // Create the duplicate tool data
      const duplicateData: ToolData = {
        name: newName,
        slug: newSlug,
        category: originalTool.category,
        description: `Copy of ${originalTool.description}`,
        icon: originalTool.icon,
        config: originalTool.config,
        features: originalTool.features,
        pricing: originalTool.pricing,
        status: 'inactive', // Start as inactive
        version: '1.0.0', // Reset version
        metadata: {
          ...originalTool.metadata,
          duplicated_from: toolId,
          duplicated_at: new Date().toISOString()
        }
      };

      return await this.createTool(duplicateData);
    } catch (error) {
      console.error('Error duplicating tool:', error);
      throw error;
    }
  }

  // Tool validation
  private validateToolData(toolData: ToolData): void {
    if (!toolData.name || toolData.name.trim().length === 0) {
      throw new Error('Tool name is required');
    }

    if (!toolData.slug || toolData.slug.trim().length === 0) {
      throw new Error('Tool slug is required');
    }

    // Validate slug format (lowercase, hyphens, no spaces)
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(toolData.slug)) {
      throw new Error('Tool slug must be lowercase with hyphens (no spaces or special characters)');
    }

    if (!toolData.category || toolData.category.trim().length === 0) {
      throw new Error('Tool category is required');
    }

    if (!toolData.description || toolData.description.trim().length === 0) {
      throw new Error('Tool description is required');
    }

    if (!toolData.version || toolData.version.trim().length === 0) {
      throw new Error('Tool version is required');
    }

    // Validate version format (semantic versioning)
    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(toolData.version)) {
      throw new Error('Tool version must follow semantic versioning (e.g., 1.0.0)');
    }

    if (!['active', 'inactive', 'beta', 'deprecated'].includes(toolData.status)) {
      throw new Error('Invalid tool status');
    }

    // Validate features array
    if (!Array.isArray(toolData.features)) {
      throw new Error('Tool features must be an array');
    }

    // Validate each feature
    toolData.features.forEach((feature, index) => {
      if (!feature.id || !feature.name) {
        throw new Error(`Feature at index ${index} is missing required fields (id, name)`);
      }
    });

    // Validate pricing structure
    if (!toolData.pricing || typeof toolData.pricing !== 'object') {
      throw new Error('Tool pricing configuration is required');
    }

    const requiredPricingTiers = ['basic', 'premium', 'enterprise'];
    requiredPricingTiers.forEach(tier => {
      if (!toolData.pricing[tier as keyof ToolPricing]) {
        throw new Error(`Pricing tier '${tier}' is required`);
      }
    });
  }

  // Category management
  async getToolCategories(): Promise<string[]> {
    try {
      // Categories not needed - return empty array
      return [];
    } catch (error) {
      console.error('Error fetching tool categories:', error);
      throw error;
    }
  }

  async getToolsByCategory(category: string): Promise<Tool[]> {
    try {
      // Category filtering not needed - return all tools
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching tools by category:', error);
      throw error;
    }
  }
}

export default AdminToolService;