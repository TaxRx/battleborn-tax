// Epic 3: Security Monitoring Dashboard
// Component for comprehensive admin security monitoring and management

import React, { useState, useEffect, useCallback } from 'react';
import { adminSecurityService, SecurityAlert, AdminSession } from '../../services/adminSecurityService';

interface SecurityMetrics {
  totalEvents: number;
  highSeverityEvents: number;
  activeSessions: number;
  failedLogins: number;
  unresolvedAlerts: number;
  eventsByType: Record<string, number>;
}

export const SecurityDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [activeSessions, setActiveSessions] = useState<AdminSession[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'sessions'>('overview');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  const loadSecurityData = useCallback(async () => {
    try {
      const [alertsResult, sessionsResult] = await Promise.all([
        adminSecurityService.getSecurityAlerts(25, false),
        adminSecurityService.getActiveSessions()
      ]);

      if (!alertsResult.error) {
        setAlerts(alertsResult.alerts);
      }

      if (!sessionsResult.error) {
        setActiveSessions(sessionsResult.sessions);
      }

      // Mock metrics for now - would come from the security metrics endpoint
      setMetrics({
        totalEvents: alertsResult.alerts.length + 150,
        highSeverityEvents: alertsResult.alerts.filter(a => ['high', 'critical'].includes(a.severity)).length,
        activeSessions: sessionsResult.sessions.length,
        failedLogins: 12,
        unresolvedAlerts: alertsResult.alerts.filter(a => !a.resolved).length,
        eventsByType: {
          'login_attempt': 45,
          'access_denied': 8,
          'suspicious_activity': 3,
          'session_timeout': 12,
          'admin_action': 67
        }
      });
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecurityData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadSecurityData]);

  const handleRevokeSession = async (sessionId: string, userId: string) => {
    const result = await adminSecurityService.revokeSession(sessionId, userId);
    if (result.success) {
      setActiveSessions(prev => prev.filter(s => s.session_id !== sessionId));
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-100';
      case 'high': return 'text-orange-800 bg-orange-100';
      case 'medium': return 'text-yellow-800 bg-yellow-100';
      case 'low': return 'text-green-800 bg-green-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'failed_login': return '🔒';
      case 'suspicious_ip': return '🌐';
      case 'privilege_abuse': return '⚠️';
      case 'data_breach': return '🛡️';
      case 'session_anomaly': return '⏰';
      case 'brute_force': return '🔨';
      default: return '📝';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins <= 0) return 'Expired';
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Auto-refresh: 30s
          </div>
          <button
            onClick={loadSecurityData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Security Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{metrics.activeSessions}</div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{metrics.unresolvedAlerts}</div>
            <div className="text-sm text-gray-600">Unresolved Alerts</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{metrics.highSeverityEvents}</div>
            <div className="text-sm text-gray-600">High Severity Events</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{metrics.failedLogins}</div>
            <div className="text-sm text-gray-600">Failed Logins (24h)</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{metrics.totalEvents}</div>
            <div className="text-sm text-gray-600">Total Events (7d)</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'alerts', label: `Alerts (${alerts.length})` },
            { key: 'sessions', label: `Active Sessions (${activeSessions.length})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Recent Security Alerts</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.alert_id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getAlertTypeIcon(alert.alert_type)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {alert.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(alert.created_at)}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No recent alerts
                </div>
              )}
            </div>
          </div>

          {/* Event Types Chart */}
          {metrics && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium">Event Types (7 days)</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {Object.entries(metrics.eventsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 capitalize">
                        {type.replace('_', ' ')}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">{count}</div>
                        <div 
                          className="h-2 bg-blue-200 rounded"
                          style={{ 
                            width: `${Math.max(20, (count / Math.max(...Object.values(metrics.eventsByType))) * 100)}px` 
                          }}
                        >
                          <div 
                            className="h-2 bg-blue-600 rounded"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(metrics.eventsByType))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'alerts' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Security Alerts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts.map(alert => (
                  <tr key={alert.alert_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getAlertTypeIcon(alert.alert_type)}</span>
                        <div className="text-sm text-gray-900">{alert.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {alert.alert_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(alert.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {alert.resolved ? 'Resolved' : 'Open'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {alerts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No security alerts found
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'sessions' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Active Admin Sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeSessions.map(session => (
                  <tr key={session.session_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(session as any).profiles?.email || session.user_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        session.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                        session.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {session.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(session.last_activity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTimeRemaining(session.expires_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRevokeSession(session.session_id, session.user_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activeSessions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No active admin sessions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};