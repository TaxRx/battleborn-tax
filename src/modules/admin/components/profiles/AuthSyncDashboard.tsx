// Epic 3 Sprint 3: Auth Synchronization Dashboard
// File: AuthSyncDashboard.tsx
// Purpose: Comprehensive auth.users synchronization monitoring and management
// Story: 3.2 - Auth.Users Synchronization Dashboard

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Database,
  TrendingUp,
  AlertCircle,
  Play,
  Eye,
  Settings,
  BarChart3
} from 'lucide-react';
import AdminProfileService from '../../services/adminProfileService';

interface AuthSyncStatus {
  totalProfiles: number;
  totalAuthUsers: number;
  syncedProfiles: number;
  pendingSync: number;
  conflictProfiles: number;
  errorProfiles: number;
  unresolvedConflicts: number;
  syncHealthScore: number;
  lastSyncCheck: string;
}

interface SyncDiscrepancies {
  profileMissingAuth: Array<{ profileId: string; email: string; severity: string }>;
  authMissingProfile: Array<{ authUserId: string; email: string; severity: string }>;
  emailMismatches: Array<{ profileId: string; authUserId: string; profileEmail: string; authEmail: string }>;
  metadataInconsistencies: Array<{ profileId: string; authUserId: string; description: string }>;
}

interface SyncConflict {
  id: string;
  profile_id: string | null;
  auth_user_id: string | null;
  conflict_type: string;
  profile_data: Record<string, any>;
  auth_data: Record<string, any>;
  created_at: string;
  resolution_strategy?: string;
}

interface HealthCheckResult {
  timestamp: string;
  healthScore: number;
  totalDiscrepancies: number;
  criticalIssues: number;
  recommendations: string[];
  autoActionsTaken: number;
}

const AuthSyncDashboard: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<AuthSyncStatus | null>(null);
  const [discrepancies, setDiscrepancies] = useState<SyncDiscrepancies | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkSyncLoading, setBulkSyncLoading] = useState(false);
  const [healthCheckLoading, setHealthCheckLoading] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [showDiscrepanciesModal, setShowDiscrepanciesModal] = useState(false);

  const profileService = AdminProfileService.getInstance();

  const loadAuthSyncData = async () => {
    try {
      setLoading(true);
      const [statusData, discrepancyData, conflictData] = await Promise.all([
        profileService.getAuthSyncStatus(),
        profileService.detectSyncDiscrepancies(),
        profileService.getSyncConflicts()
      ]);

      setSyncStatus(statusData);
      setDiscrepancies(discrepancyData);
      setConflicts(conflictData);
    } catch (error) {
      console.error('Error loading auth sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performHealthCheck = async () => {
    try {
      setHealthCheckLoading(true);
      const result = await profileService.performSyncHealthCheck();
      setHealthCheck(result);
      // Reload data after health check
      await loadAuthSyncData();
    } catch (error) {
      console.error('Error performing health check:', error);
    } finally {
      setHealthCheckLoading(false);
    }
  };

  const runBulkSync = async () => {
    try {
      setBulkSyncLoading(true);
      await profileService.bulkSyncProfiles();
      // Reload data after bulk sync
      await loadAuthSyncData();
    } catch (error) {
      console.error('Error running bulk sync:', error);
    } finally {
      setBulkSyncLoading(false);
    }
  };

  const resolveConflict = async (conflictId: string, strategy: string) => {
    try {
      await profileService.resolveSyncConflict(conflictId, strategy as any);
      await loadAuthSyncData();
      setSelectedConflict(null);
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 90) return CheckCircle;
    if (score >= 70) return AlertTriangle;
    return XCircle;
  };

  useEffect(() => {
    loadAuthSyncData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading auth sync status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-600" />
            Auth Synchronization Dashboard
          </h2>
          <p className="text-gray-600">Monitor and manage profile synchronization with auth.users</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={performHealthCheck}
            disabled={healthCheckLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {healthCheckLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4 mr-2" />
            )}
            Health Check
          </button>
          <button
            onClick={runBulkSync}
            disabled={bulkSyncLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            {bulkSyncLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Bulk Sync
          </button>
          <button
            onClick={loadAuthSyncData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Sync Status Overview */}
      {syncStatus && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Synchronization Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{syncStatus.totalProfiles}</div>
              <div className="text-sm text-gray-600">Total Profiles</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{syncStatus.totalAuthUsers}</div>
              <div className="text-sm text-gray-600">Auth Users</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{syncStatus.syncedProfiles}</div>
              <div className="text-sm text-gray-600">Synced</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">{syncStatus.conflictProfiles + syncStatus.errorProfiles}</div>
              <div className="text-sm text-gray-600">Issues</div>
            </div>
          </div>

          {/* Health Score */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {React.createElement(getHealthScoreIcon(syncStatus.syncHealthScore), {
                  className: `w-6 h-6 mr-2 ${getHealthScoreColor(syncStatus.syncHealthScore)}`
                })}
                <span className="font-medium">Sync Health Score</span>
              </div>
              <div className={`text-2xl font-bold ${getHealthScoreColor(syncStatus.syncHealthScore)}`}>
                {syncStatus.syncHealthScore}%
              </div>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  syncStatus.syncHealthScore >= 90 ? 'bg-green-500' :
                  syncStatus.syncHealthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${syncStatus.syncHealthScore}%` }}
              />
            </div>
          </div>

          {/* Detailed Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <div className="font-semibold text-yellow-800">{syncStatus.pendingSync}</div>
                  <div className="text-sm text-yellow-600">Pending Sync</div>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <div className="font-semibold text-red-800">{syncStatus.conflictProfiles}</div>
                  <div className="text-sm text-red-600">Conflicts</div>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <div className="font-semibold text-red-800">{syncStatus.errorProfiles}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-orange-600 mr-2" />
                <div>
                  <div className="font-semibold text-orange-800">{syncStatus.unresolvedConflicts}</div>
                  <div className="text-sm text-orange-600">Unresolved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health Check Results */}
      {healthCheck && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Latest Health Check</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-800">{healthCheck.totalDiscrepancies}</div>
              <div className="text-sm text-blue-600">Total Discrepancies</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-800">{healthCheck.criticalIssues}</div>
              <div className="text-sm text-red-600">Critical Issues</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-800">{healthCheck.autoActionsTaken}</div>
              <div className="text-sm text-green-600">Auto-Fixed</div>
            </div>
          </div>
          
          {healthCheck.recommendations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {healthCheck.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-yellow-700 flex items-start">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Discrepancies Summary */}
      {discrepancies && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Sync Discrepancies</h3>
            <button
              onClick={() => setShowDiscrepanciesModal(true)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center text-sm"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{discrepancies.profileMissingAuth.length}</div>
              <div className="text-sm text-red-600">Missing Auth</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{discrepancies.authMissingProfile.length}</div>
              <div className="text-sm text-yellow-600">Missing Profile</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{discrepancies.emailMismatches.length}</div>
              <div className="text-sm text-purple-600">Email Mismatch</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{discrepancies.metadataInconsistencies.length}</div>
              <div className="text-sm text-blue-600">Metadata Issues</div>
            </div>
          </div>
        </div>
      )}

      {/* Active Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Active Sync Conflicts</h3>
          <div className="space-y-3">
            {conflicts.slice(0, 5).map((conflict) => (
              <div key={conflict.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <div className="font-medium text-red-800">
                    {conflict.conflict_type.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="text-sm text-red-600">
                    Created: {new Date(conflict.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedConflict(conflict)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
            {conflicts.length > 5 && (
              <div className="text-center text-gray-600 text-sm">
                And {conflicts.length - 5} more conflicts...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {syncStatus ? new Date(syncStatus.lastSyncCheck).toLocaleString() : 'Never'}
      </div>

      {/* Conflict Resolution Modal */}
      {selectedConflict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Resolve Sync Conflict</h3>
            <div className="mb-4">
              <div className="text-sm text-gray-600">Conflict Type:</div>
              <div className="font-medium">{selectedConflict.conflict_type.replace('_', ' ').toUpperCase()}</div>
            </div>
            <div className="flex space-x-3 mb-4">
              <button
                onClick={() => resolveConflict(selectedConflict.id, 'profile_wins')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Profile Wins
              </button>
              <button
                onClick={() => resolveConflict(selectedConflict.id, 'auth_wins')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Auth Wins
              </button>
              <button
                onClick={() => resolveConflict(selectedConflict.id, 'manual')}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Manual Review
              </button>
              <button
                onClick={() => resolveConflict(selectedConflict.id, 'ignore')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Ignore
              </button>
            </div>
            <button
              onClick={() => setSelectedConflict(null)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Discrepancies Detail Modal */}
      {showDiscrepanciesModal && discrepancies && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sync Discrepancies Detail</h3>
              <button
                onClick={() => setShowDiscrepanciesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {discrepancies.profileMissingAuth.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Profiles Missing Auth Users</h4>
                  <div className="space-y-1">
                    {discrepancies.profileMissingAuth.map((item, index) => (
                      <div key={index} className="text-sm p-2 bg-red-50 rounded">
                        {item.email} ({item.severity} severity)
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {discrepancies.authMissingProfile.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-600 mb-2">Auth Users Missing Profiles</h4>
                  <div className="space-y-1">
                    {discrepancies.authMissingProfile.map((item, index) => (
                      <div key={index} className="text-sm p-2 bg-yellow-50 rounded">
                        {item.email} ({item.severity} severity)
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {discrepancies.emailMismatches.length > 0 && (
                <div>
                  <h4 className="font-medium text-purple-600 mb-2">Email Mismatches</h4>
                  <div className="space-y-1">
                    {discrepancies.emailMismatches.map((item, index) => (
                      <div key={index} className="text-sm p-2 bg-purple-50 rounded">
                        Profile: {item.profileEmail} ↔ Auth: {item.authEmail}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthSyncDashboard;