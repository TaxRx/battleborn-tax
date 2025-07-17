// Epic 3 Sprint 2 Day 3: Enhanced Tool Management Integration Component
// File: EnhancedToolManagement.tsx
// Purpose: Main integration component for Story 2.2 and 2.3 - Individual and Bulk Tool Management

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CogIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { ToolAssignmentMatrix } from './ToolAssignmentMatrix';
import { ToolAssignmentModal } from './ToolAssignmentModal';
import { BulkToolOperations } from './BulkToolOperations';
import AdminToolService, { 
  ToolAssignment, 
  BulkOperationResult,
  ToolAssignmentFilters 
} from '../../services/adminToolService';

interface EnhancedToolManagementProps {
  onNavigate?: (section: string) => void;
}

interface NotificationItem {
  id: string;
  type: 'expiring' | 'expired' | 'limit_reached' | 'bulk_complete';
  title: string;
  message: string;
  timestamp: string;
  accountId?: string;
  toolId?: string;
  operationId?: string;
}

interface ToolManagementStats {
  totalAssignments: number;
  activeAssignments: number;
  expiringAssignments: number;
  recentBulkOperations: number;
  subscription_distribution: Record<string, number>;
}

export const EnhancedToolManagement: React.FC<EnhancedToolManagementProps> = ({
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'analytics' | 'notifications'>('matrix');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [assignmentModalData, setAssignmentModalData] = useState<{
    accountId?: string;
    toolId?: string;
    existingAssignment?: ToolAssignment;
    mode: 'create' | 'edit';
  }>({ mode: 'create' });
  
  // Data states
  const [stats, setStats] = useState<ToolManagementStats>({
    totalAssignments: 0,
    activeAssignments: 0,
    expiringAssignments: 0,
    recentBulkOperations: 0,
    subscription_distribution: {}
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [recentOperations, setRecentOperations] = useState<BulkOperationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const adminToolService = AdminToolService.getInstance();

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate loading stats and notifications
      // In production, these would be real API calls
      const [assignmentsData, expiringData] = await Promise.all([
        adminToolService.getToolAssignmentMatrix({ limit: 1000 }),
        adminToolService.getExpiringAssignments(7)
      ]);

      // Calculate stats
      const newStats: ToolManagementStats = {
        totalAssignments: assignmentsData.assignments.length,
        activeAssignments: assignmentsData.assignments.filter(a => a.status === 'active').length,
        expiringAssignments: expiringData.length,
        recentBulkOperations: 0, // This would come from a real API
        subscription_distribution: assignmentsData.assignments.reduce((acc, assignment) => {
          acc[assignment.subscription_level] = (acc[assignment.subscription_level] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      setStats(newStats);

      // Generate sample notifications
      const newNotifications: NotificationItem[] = [
        ...expiringData.slice(0, 5).map((assignment, index) => ({
          id: `exp-${index}`,
          type: 'expiring' as const,
          title: 'Assignment Expiring Soon',
          message: `${assignment.tool_name} access for ${assignment.account_name} expires in ${Math.ceil((new Date(assignment.expires_at!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          accountId: assignment.account_id,
          toolId: assignment.tool_id
        }))
      ];
      setNotifications(newNotifications);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Event handlers
  const handleAssignmentChange = useCallback((accountId: string, toolId: string, action: 'assign' | 'unassign') => {
    setRefreshTrigger(prev => prev + 1);
    
    // Add a success notification
    const newNotification: NotificationItem = {
      id: `assign-${Date.now()}`,
      type: 'bulk_complete',
      title: `Tool ${action === 'assign' ? 'Assigned' : 'Unassigned'}`,
      message: `Tool access ${action === 'assign' ? 'granted' : 'removed'} successfully`,
      timestamp: new Date().toISOString(),
      accountId,
      toolId
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
  }, []);

  const handleBulkAction = useCallback((accountIds: string[], action: string) => {
    setSelectedAccountIds(accountIds);
    if (action === 'assign_tool' || action === 'update_subscription') {
      setShowBulkModal(true);
    }
  }, []);

  const handleIndividualAssignment = useCallback((accountId: string, toolId: string, existingAssignment?: ToolAssignment) => {
    setAssignmentModalData({
      accountId,
      toolId,
      existingAssignment,
      mode: existingAssignment ? 'edit' : 'create'
    });
    setShowAssignmentModal(true);
  }, []);

  const handleBulkOperationComplete = useCallback((result: BulkOperationResult) => {
    setRecentOperations(prev => [result, ...prev.slice(0, 9)]);
    setRefreshTrigger(prev => prev + 1);
    
    // Add completion notification
    const newNotification: NotificationItem = {
      id: `bulk-${result.operationId}`,
      type: 'bulk_complete',
      title: 'Bulk Operation Complete',
      message: `${result.processed} assignments processed successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
      timestamp: new Date().toISOString(),
      operationId: result.operationId
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
  }, []);

  const handleAssignmentComplete = useCallback((assignment: ToolAssignment) => {
    setRefreshTrigger(prev => prev + 1);
    setShowAssignmentModal(false);
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'expiring':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'limit_reached':
        return <ChartBarIcon className="h-5 w-5 text-orange-500" />;
      case 'bulk_complete':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CogIcon className="h-8 w-8 mr-3" />
            Enhanced Tool Management
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive tool assignment management with individual and bulk operations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <CogIcon className="h-4 w-4 mr-2" />
            New Assignment
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <UserGroupIcon className="h-4 w-4 mr-2" />
            Bulk Operations
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
            </div>
            <CogIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Assignments</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeAssignments}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiringAssignments}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Operations</p>
              <p className="text-2xl font-bold text-purple-600">{recentOperations.length}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'matrix', label: 'Assignment Matrix', icon: CogIcon },
            { key: 'analytics', label: 'Analytics', icon: ChartBarIcon },
            { key: 'notifications', label: 'Notifications', icon: BellIcon }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.key === 'notifications' && notifications.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs rounded-full px-2 py-0.5">
                    {notifications.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'matrix' && (
          <div className="p-6">
            <ToolAssignmentMatrix
              onAssignmentChange={handleAssignmentChange}
              onBulkAction={handleBulkAction}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Subscription Distribution
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(stats.subscription_distribution).map(([level, count]) => (
                  <div key={level} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 capitalize">{level}</p>
                        <p className="text-xl font-bold text-gray-900">{count}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {stats.totalAssignments > 0 ? Math.round((count / stats.totalAssignments) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Recent Bulk Operations
              </h3>
              
              <div className="space-y-3">
                {recentOperations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No recent bulk operations
                  </div>
                ) : (
                  recentOperations.map((operation, index) => (
                    <div key={operation.operationId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            {operation.success ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                            ) : (
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                            )}
                            <span className="font-medium">
                              Operation {operation.operationId.slice(0, 8)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {operation.processed} processed, {operation.failed} failed
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTimeAgo(new Date().toISOString())}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BellIcon className="h-5 w-5 mr-2" />
                Recent Notifications
              </h3>
              
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No notifications
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <span className="text-sm text-gray-500">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ToolAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        accountId={assignmentModalData.accountId}
        toolId={assignmentModalData.toolId}
        existingAssignment={assignmentModalData.existingAssignment}
        mode={assignmentModalData.mode}
        onAssignmentComplete={handleAssignmentComplete}
        showRenewalOptions={true}
      />

      <BulkToolOperations
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedAccountIds={selectedAccountIds}
        onOperationComplete={handleBulkOperationComplete}
        allowCancel={true}
        showExportImport={true}
      />
    </div>
  );
};

export default EnhancedToolManagement;