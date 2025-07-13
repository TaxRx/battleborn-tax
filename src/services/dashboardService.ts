import { supabase } from '../lib/supabase';

export interface Activity {
  id: string;
  client_id: string;
  user_id: string;
  activity_type: 'login' | 'document_upload' | 'proposal_view' | 'profile_update' | 'calculation_run' | 'message_sent' | 'meeting_scheduled' | 'payment_made' | 'tool_enrollment' | 'status_update';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  client_name?: string;
  user_name?: string;
}

export interface EngagementStatus {
  id: string;
  client_id: string;
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'on_hold' | 'cancelled';
  last_activity_at?: string;
  last_login_at?: string;
  total_activities: number;
  pending_actions: number;
  completion_percentage: number;
  next_action_due?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total_proposals: number;
  active_proposals: number;
  total_savings: number;
  recent_activities: number;
  completion_rate: number;
  calculated_at: string;
}

export interface ClientDashboardData {
  activities: Activity[];
  engagementStatus: EngagementStatus | null;
  metrics: DashboardMetrics;
}

class DashboardService {
  /**
   * Get recent activities for a client
   */
  async getClientActivities(clientId: string, limit: number = 20): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('recent_client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching client activities:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get engagement status for a client
   */
  async getEngagementStatus(clientId: string): Promise<EngagementStatus | null> {
    const { data, error } = await supabase
      .from('client_engagement_status')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No engagement status found, return null
        return null;
      }
      console.error('Error fetching engagement status:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get dashboard metrics for a client
   */
  async getDashboardMetrics(clientId: string): Promise<DashboardMetrics> {
    const { data, error } = await supabase
      .rpc('calculate_dashboard_metrics', { p_client_id: clientId });

    if (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }

    return data || {
      total_proposals: 0,
      active_proposals: 0,
      total_savings: 0,
      recent_activities: 0,
      completion_rate: 0,
      calculated_at: new Date().toISOString()
    };
  }

  /**
   * Get complete dashboard data for a client
   */
  async getClientDashboardData(clientId: string): Promise<ClientDashboardData> {
    const [activities, engagementStatus, metrics] = await Promise.all([
      this.getClientActivities(clientId),
      this.getEngagementStatus(clientId),
      this.getDashboardMetrics(clientId)
    ]);

    return {
      activities,
      engagementStatus,
      metrics
    };
  }

  /**
   * Log a new activity for a client
   */
  async logActivity(
    clientId: string,
    userId: string,
    activityType: Activity['activity_type'],
    title: string,
    description?: string,
    priority: Activity['priority'] = 'medium',
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('log_client_activity', {
        p_client_id: clientId,
        p_user_id: userId,
        p_activity_type: activityType,
        p_title: title,
        p_description: description,
        p_priority: priority,
        p_metadata: metadata
      });

    if (error) {
      console.error('Error logging activity:', error);
      throw error;
    }

    return data;
  }

  /**
   * Mark an activity as read
   */
  async markActivityAsRead(activityId: string): Promise<void> {
    const { error } = await supabase
      .from('client_activities')
      .update({ is_read: true })
      .eq('id', activityId);

    if (error) {
      console.error('Error marking activity as read:', error);
      throw error;
    }
  }

  /**
   * Mark multiple activities as read
   */
  async markActivitiesAsRead(activityIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('client_activities')
      .update({ is_read: true })
      .in('id', activityIds);

    if (error) {
      console.error('Error marking activities as read:', error);
      throw error;
    }
  }

  /**
   * Update engagement status for a client
   */
  async updateEngagementStatus(
    clientId: string,
    status?: EngagementStatus['status'],
    pendingActions?: number,
    completionPercentage?: number,
    nextActionDue?: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('update_client_engagement_status', {
        p_client_id: clientId,
        p_status: status,
        p_pending_actions: pendingActions,
        p_completion_percentage: completionPercentage,
        p_next_action_due: nextActionDue
      });

    if (error) {
      console.error('Error updating engagement status:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get unread activities count for a client
   */
  async getUnreadActivitiesCount(clientId: string): Promise<number> {
    const { count, error } = await supabase
      .from('client_activities')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread activities count:', error);
      throw error;
    }

    return count || 0;
  }

  /**
   * Get activities by type for a client
   */
  async getActivitiesByType(clientId: string, activityType: Activity['activity_type'], limit: number = 10): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('recent_client_activities')
      .select('*')
      .eq('client_id', clientId)
      .eq('activity_type', activityType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities by type:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get activities in date range for a client
   */
  async getActivitiesInDateRange(
    clientId: string,
    startDate: string,
    endDate: string,
    limit: number = 50
  ): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('recent_client_activities')
      .select('*')
      .eq('client_id', clientId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities in date range:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get client dashboard summary view
   */
  async getClientDashboardSummary(clientId: string): Promise<any> {
    const { data, error } = await supabase
      .from('client_dashboard_summary')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('Error fetching client dashboard summary:', error);
      throw error;
    }

    return data;
  }

  /**
   * Subscribe to real-time activity updates for a client
   */
  subscribeToActivities(clientId: string, callback: (activity: Activity) => void) {
    return supabase
      .channel(`client_activities:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_activities',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          callback(payload.new as Activity);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to real-time engagement status updates for a client
   */
  subscribeToEngagementStatus(clientId: string, callback: (status: EngagementStatus) => void) {
    return supabase
      .channel(`client_engagement_status:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_engagement_status',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          callback(payload.new as EngagementStatus);
        }
      )
      .subscribe();
  }

  /**
   * Format activity for display
   */
  formatActivity(activity: Activity): { icon: string; color: string; displayText: string } {
    const activityFormats = {
      login: {
        icon: '👤',
        color: 'blue',
        displayText: 'User logged in'
      },
      document_upload: {
        icon: '📄',
        color: 'green',
        displayText: 'Document uploaded'
      },
      proposal_view: {
        icon: '👁️',
        color: 'purple',
        displayText: 'Proposal viewed'
      },
      profile_update: {
        icon: '⚙️',
        color: 'orange',
        displayText: 'Profile updated'
      },
      calculation_run: {
        icon: '🧮',
        color: 'indigo',
        displayText: 'Calculation performed'
      },
      message_sent: {
        icon: '💬',
        color: 'pink',
        displayText: 'Message sent'
      },
      meeting_scheduled: {
        icon: '📅',
        color: 'teal',
        displayText: 'Meeting scheduled'
      },
      payment_made: {
        icon: '💳',
        color: 'emerald',
        displayText: 'Payment processed'
      },
      tool_enrollment: {
        icon: '🔧',
        color: 'yellow',
        displayText: 'Tool enrolled'
      },
      status_update: {
        icon: '📊',
        color: 'gray',
        displayText: 'Status updated'
      }
    };

    return activityFormats[activity.activity_type] || {
      icon: '📝',
      color: 'gray',
      displayText: 'Activity occurred'
    };
  }

  /**
   * Get activity statistics for a client
   */
  async getActivityStatistics(clientId: string, days: number = 30): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    activitiesByDay: Record<string, number>;
    averageActivitiesPerDay: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await this.getActivitiesInDateRange(
      clientId,
      startDate.toISOString(),
      new Date().toISOString(),
      1000 // Get all activities in range
    );

    const activitiesByType: Record<string, number> = {};
    const activitiesByDay: Record<string, number> = {};

    activities.forEach(activity => {
      // Count by type
      activitiesByType[activity.activity_type] = (activitiesByType[activity.activity_type] || 0) + 1;

      // Count by day
      const day = new Date(activity.created_at).toISOString().split('T')[0];
      activitiesByDay[day] = (activitiesByDay[day] || 0) + 1;
    });

    return {
      totalActivities: activities.length,
      activitiesByType,
      activitiesByDay,
      averageActivitiesPerDay: activities.length / days
    };
  }
}

export const dashboardService = new DashboardService(); 