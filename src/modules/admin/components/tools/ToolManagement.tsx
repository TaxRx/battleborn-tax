// Epic 3 Sprint 2 Day 2: Tool Management Main Page
// File: ToolManagement.tsx
// Purpose: Main page for tool assignment management with integrated components

import React, { useState, useCallback } from 'react';
import { 
  CogIcon,
  PlusIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import ToolAssignmentMatrix from './ToolAssignmentMatrix';
import ToolAssignmentModal from './ToolAssignmentModal';
import BulkToolOperations from './BulkToolOperations';
import AdminToolService, { 
  ToolAssignment, 
  BulkOperationResult 
} from '../../services/adminToolService';
import { toast } from 'react-toastify';

export const ToolManagement: React.FC = () => {
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<ToolAssignment | null>(null);
  const [refreshMatrix, setRefreshMatrix] = useState(0);

  const adminToolService = AdminToolService.getInstance();

  // Handle assignment changes from matrix
  const handleAssignmentChange = useCallback((accountId: string, toolId: string, action: 'assign' | 'unassign') => {
    const message = action === 'assign' 
      ? 'Tool assigned successfully' 
      : 'Tool unassigned successfully';
    
    toast.success(message);
    
    // Trigger matrix refresh
    setRefreshMatrix(prev => prev + 1);
  }, []);

  // Handle bulk operations
  const handleBulkAction = useCallback((accountIds: string[], action: string) => {
    setSelectedAccounts(accountIds);
    
    switch (action) {
      case 'assign_tool':
      case 'update_subscription':
      case 'extend_expiration':
        setShowBulkOperations(true);
        break;
      default:
        console.log('Bulk action:', action, 'for accounts:', accountIds);
    }
  }, []);

  // Handle bulk operation completion
  const handleBulkOperationComplete = useCallback((result: BulkOperationResult) => {
    if (result.success) {
      toast.success(`Bulk operation completed successfully! ${result.processed} items processed.`);
    } else {
      toast.warning(`Bulk operation completed with ${result.failed} failures. ${result.processed} items processed successfully.`);
    }
    
    // Trigger matrix refresh
    setRefreshMatrix(prev => prev + 1);
    setShowBulkOperations(false);
  }, []);

  // Handle assignment modal completion
  const handleAssignmentComplete = useCallback((assignment: ToolAssignment) => {
    toast.success('Tool assignment saved successfully!');
    setShowAssignmentModal(false);
    setEditingAssignment(null);
    
    // Trigger matrix refresh
    setRefreshMatrix(prev => prev + 1);
  }, []);

  // Handle assignment editing (from matrix or other components)
  const handleEditAssignment = useCallback((assignment: ToolAssignment) => {
    setEditingAssignment(assignment);
    setShowAssignmentModal(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <CogIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tool Management</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage tool assignments, subscription levels, and access permissions across all accounts
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Assign Tool
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CogIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Active Tools</div>
              <div className="text-2xl font-bold text-gray-900">6</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Assignments</div>
              <div className="text-2xl font-bold text-gray-900">247</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Premium Subscriptions</div>
              <div className="text-2xl font-bold text-gray-900">89</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Expiring Soon</div>
              <div className="text-2xl font-bold text-gray-900">12</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Assignment Matrix */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Assignment Matrix</h2>
          <p className="text-sm text-gray-600 mt-1">
            Interactive view of all tool assignments with quick assignment capabilities
          </p>
        </div>
        <div className="p-6">
          <ToolAssignmentMatrix
            key={refreshMatrix} // Force re-render on refresh
            onAssignmentChange={handleAssignmentChange}
            onBulkAction={handleBulkAction}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-600 mt-1">
            Latest tool assignment changes and activities
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Activity items would be loaded from the activity service */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Tool assigned: Tax Calculator</div>
                <div className="text-sm text-gray-500">Account: ABC Corp • Premium subscription • 2 minutes ago</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Subscription updated: R&D Credit Wizard</div>
                <div className="text-sm text-gray-500">Account: XYZ LLC • Basic → Enterprise • 15 minutes ago</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Bulk operation completed</div>
                <div className="text-sm text-gray-500">25 accounts • Tool assignments updated • 1 hour ago</div>
              </div>
            </div>

            <div className="text-center pt-4">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all activity →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ToolAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false);
          setEditingAssignment(null);
        }}
        existingAssignment={editingAssignment || undefined}
        mode={editingAssignment ? 'edit' : 'create'}
        onAssignmentComplete={handleAssignmentComplete}
      />

      <BulkToolOperations
        isOpen={showBulkOperations}
        onClose={() => setShowBulkOperations(false)}
        selectedAccountIds={selectedAccounts}
        onOperationComplete={handleBulkOperationComplete}
      />
    </div>
  );
};

export default ToolManagement;