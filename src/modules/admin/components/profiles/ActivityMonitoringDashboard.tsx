// Epic 3 Sprint 3: Activity Monitoring Dashboard Component
// File: ActivityMonitoringDashboard.tsx
// Purpose: Comprehensive activity monitoring and analytics dashboard
// Story: 3.5 - Profile Activity Monitoring

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Users, 
  Eye, 
  BarChart3,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Search,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import AdminProfileService, { 
  ActivitySummary, 
  ActivityTimelineEntry, 
  SuspiciousActivity,
  ActivityTrend 
} from '../../services/adminProfileService';

interface ActivityMonitoringDashboardProps {
  profileId?: string;
  showControls?: boolean;
}

const ActivityMonitoringDashboard: React.FC<ActivityMonitoringDashboardProps> = ({
  profileId,
  showControls = true
}) => {
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [timeline, setTimeline] = useState<ActivityTimelineEntry[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [trends, setTrends] = useState<ActivityTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedActivity, setSelectedActivity] = useState<ActivityTimelineEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const profileService = AdminProfileService.getInstance();

  const loadActivityData = async () => {
    try {
      setLoading(true);
      
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const [summaryData, timelineData, suspiciousData, trendsData] = await Promise.all([
        profileService.getActivitySummary(startDate, endDate, profileId),
        profileId 
          ? profileService.getActivityTimeline(profileId, 50, 0)
          : profileService.getRecentActivities(50),
        profileService.detectSuspiciousActivity(days * 24, 10),
        profileService.getActivityTrends(days, days === 1 ? 'hourly' : 'daily')
      ]);

      setSummary(summaryData);
      setTimeline(timelineData);
      setSuspiciousActivities(suspiciousData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login':
      case 'logout':
        return <Users className="w-4 h-4" />;
      case 'profile_created':
      case 'profile_updated':
      case 'profile_deleted':
        return <Activity className="w-4 h-4" />;
      case 'role_assigned':
      case 'role_removed':
        return <Shield className="w-4 h-4" />;
      case 'bulk_operation':
        return <BarChart3 className="w-4 h-4" />;
      case 'security_alert':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (resultStatus: string) => {
    switch (resultStatus) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const viewActivityDetails = (activity: ActivityTimelineEntry) => {
    setSelectedActivity(activity);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    loadActivityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadActivityData, 30000);
    return () => clearInterval(interval);
  }, [timeRange, profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading activity data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-blue-600" />
            Activity Monitoring
            {profileId && <span className="text-lg text-gray-600 ml-2">- Profile Specific</span>}
          </h2>
          <p className="text-gray-600">Monitor and analyze profile management activities</p>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={loadActivityData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{summary.totalActivities}</div>
                <div className="text-sm text-gray-600">Total Activities</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.successRate}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{summary.uniqueProfiles}</div>
                <div className="text-sm text-gray-600">Active Profiles</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-red-600">{suspiciousActivities.length}</div>
                <div className="text-sm text-gray-600">Suspicious</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Categories */}
      {summary && Object.keys(summary.activityCategories).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary.activityCategories).map(([category, count]) => (
              <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{category.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspicious Activities Alert */}
      {suspiciousActivities.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-800">Suspicious Activities Detected</h3>
          </div>
          <div className="space-y-2">
            {suspiciousActivities.slice(0, 3).map((activity) => (
              <div key={`${activity.profileId}-${activity.suspiciousPattern}`} className="flex items-center justify-between p-2 bg-white rounded">
                <div>
                  <div className="font-medium text-red-800">
                    {activity.profileName || activity.profileEmail}
                  </div>
                  <div className="text-sm text-red-600">
                    {activity.suspiciousPattern.replace('_', ' ')} - {activity.activityCount} activities
                  </div>
                </div>
                <div className="text-sm font-medium text-red-700">
                  Risk: {activity.riskScore}
                </div>
              </div>
            ))}
            {suspiciousActivities.length > 3 && (
              <div className="text-sm text-red-600 text-center">
                And {suspiciousActivities.length - 3} more suspicious activities...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        
        {timeline.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No activities found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {timeline.slice(0, 10).map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(activity.resultStatus)}`}>
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {activity.activityType.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskColor(activity.riskLevel)}`}>
                          {activity.riskLevel}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(activity.resultStatus)}`}>
                          {activity.resultStatus}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {activity.timeAgo}
                        </span>
                        {activity.durationMs && (
                          <span>{activity.durationMs}ms</span>
                        )}
                        {activity.ipAddress && (
                          <span>IP: {activity.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => viewActivityDetails(activity)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Details Modal */}
      {showDetailsModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Activity Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Activity Type</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedActivity.activityType}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedActivity.activityCategory}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedActivity.resultStatus)}`}>
                      {selectedActivity.resultStatus}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskColor(selectedActivity.riskLevel)}`}>
                      {selectedActivity.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <div className="mt-1 text-sm text-gray-900">{selectedActivity.description}</div>
              </div>
              
              {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Metadata</label>
                  <div className="mt-1 bg-gray-50 rounded p-3">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <div className="mt-1 text-gray-900">{new Date(selectedActivity.createdAt).toLocaleString()}</div>
                </div>
                {selectedActivity.durationMs && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <div className="mt-1 text-gray-900">{selectedActivity.durationMs}ms</div>
                  </div>
                )}
                {selectedActivity.ipAddress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IP Address</label>
                    <div className="mt-1 text-gray-900">{selectedActivity.ipAddress}</div>
                  </div>
                )}
                {selectedActivity.sessionId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session ID</label>
                    <div className="mt-1 text-gray-900 font-mono text-xs">{selectedActivity.sessionId}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityMonitoringDashboard;