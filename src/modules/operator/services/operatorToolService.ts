// Operator Tool Service - Service layer for operator tool access
// File: operatorToolService.ts
// Purpose: Handle tool access queries for operators from account_tool_access table

import { supabase } from '../../../lib/supabase';

export interface AssignedTool {
  tool_id: string;
  tool_name: string;
  tool_slug: string;
  tool_description: string;
  access_level: string;
  subscription_level: 'trial' | 'basic' | 'premium' | 'enterprise' | 'custom';
  status: 'active' | 'inactive' | 'expired' | 'suspended';
  expires_at: string | null;
  granted_at: string;
  last_accessed_at: string | null;
  is_expired: boolean;
  expires_soon: boolean;
}

class OperatorToolService {
  private static instance: OperatorToolService;

  static getInstance(): OperatorToolService {
    if (!OperatorToolService.instance) {
      OperatorToolService.instance = new OperatorToolService();
    }
    return OperatorToolService.instance;
  }

  /**
   * Get all tools assigned to an operator account
   */
  async getAssignedTools(
    accountId: string, 
    filter: 'all' | 'active' | 'expired' | 'expires_soon' = 'all'
  ): Promise<AssignedTool[]> {
    try {
      console.log('Fetching assigned tools for account:', accountId);

      let query = supabase
        .from('account_tool_access')
        .select(`
          tool_id,
          access_level,
          subscription_level,
          status,
          expires_at,
          granted_at,
          last_accessed_at,
          tools!inner (
            id,
            name,
            slug,
            description
          )
        `)
        .eq('account_id', accountId);

      // Apply status filters
      if (filter === 'active') {
        query = query.eq('status', 'active');
      } else if (filter === 'expired') {
        query = query.eq('status', 'expired');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching assigned tools:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Transform data and add computed fields
      const currentDate = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

      return data.map((item: any) => {
        const expiresAt = item.expires_at ? new Date(item.expires_at) : null;
        const isExpired = expiresAt ? expiresAt < currentDate : false;
        const expiresSoon = expiresAt ? (expiresAt > currentDate && expiresAt <= oneWeekFromNow) : false;

        return {
          tool_id: item.tool_id,
          tool_name: item.tools.name,
          tool_slug: item.tools.slug,
          tool_description: item.tools.description || '',
          access_level: item.access_level,
          subscription_level: item.subscription_level,
          status: isExpired ? 'expired' : item.status,
          expires_at: item.expires_at,
          granted_at: item.granted_at,
          last_accessed_at: item.last_accessed_at,
          is_expired: isExpired,
          expires_soon: expiresSoon
        };
      }).filter((tool: AssignedTool) => {
        // Apply client-side filtering for computed fields
        if (filter === 'expires_soon') return tool.expires_soon;
        if (filter === 'expired') return tool.is_expired;
        if (filter === 'active') return !tool.is_expired && !tool.expires_soon && tool.status === 'active';
        return true;
      });

    } catch (error) {
      console.error('Error in getAssignedTools:', error);
      throw new Error('Failed to fetch assigned tools');
    }
  }

  /**
   * Update last accessed timestamp for a tool
   */
  async updateLastAccessed(accountId: string, toolId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('account_tool_access')
        .update({
          last_accessed_at: new Date().toISOString()
        })
        .eq('account_id', accountId)
        .eq('tool_id', toolId);

      if (error) {
        console.error('Error updating last accessed:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateLastAccessed:', error);
      // Don't throw error for this operation as it's not critical
    }
  }

  /**
   * Get tool access summary/metrics for an operator
   */
  async getToolAccessSummary(accountId: string): Promise<{
    totalTools: number;
    activeTools: number;
    expiredTools: number;
    expiringSoon: number;
    recentlyUsed: number;
  }> {
    try {
      const tools = await this.getAssignedTools(accountId);
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      return {
        totalTools: tools.length,
        activeTools: tools.filter(t => t.status === 'active' && !t.is_expired && !t.expires_soon).length,
        expiredTools: tools.filter(t => t.is_expired).length,
        expiringSoon: tools.filter(t => t.expires_soon).length,
        recentlyUsed: tools.filter(t => 
          t.last_accessed_at && new Date(t.last_accessed_at) >= oneWeekAgo
        ).length
      };
    } catch (error) {
      console.error('Error in getToolAccessSummary:', error);
      throw new Error('Failed to fetch tool access summary');
    }
  }
}

export default OperatorToolService;