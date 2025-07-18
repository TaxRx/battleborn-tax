// Epic 3 Sprint 2 Day 2: Tool Assignment Matrix Component
// File: ToolAssignmentMatrix.tsx
// Purpose: Interactive matrix view for managing tool assignments with virtualization

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import AdminToolService, { 
  ToolAssignmentMatrix as MatrixData, 
  ToolAssignmentFilters,
  ToolAssignment,
  Account,
  Tool
} from '../../services/adminToolService';

interface ToolAssignmentMatrixProps {
  onAssignmentChange?: (accountId: string, toolId: string, action: 'assign' | 'unassign') => void;
  onBulkAction?: (selectedAccounts: string[], action: string) => void;
}

// Subscription level color mappings
const subscriptionColors = {
  basic: 'bg-gray-100 text-gray-700',
  premium: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
  trial: 'bg-yellow-100 text-yellow-700',
  custom: 'bg-green-100 text-green-700'
};

// Status indicator components
const StatusIndicator: React.FC<{ assignment: ToolAssignment | null }> = ({ assignment }) => {
  if (!assignment) {
    return (
      <div className="w-8 h-8 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
        <span className="text-xs text-gray-400">—</span>
      </div>
    );
  }

  if (assignment.is_expired) {
    return (
      <div className="w-8 h-8 rounded bg-red-100 border-2 border-red-200 flex items-center justify-center">
        <XCircleIcon className="w-4 h-4 text-red-600" />
      </div>
    );
  }

  if (assignment.expires_soon) {
    return (
      <div className="w-8 h-8 rounded bg-yellow-100 border-2 border-yellow-200 flex items-center justify-center">
        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
      </div>
    );
  }

  return (
    <div className={`w-8 h-8 rounded border-2 flex items-center justify-center ${
      subscriptionColors[assignment.subscription_level]
    }`}>
      <CheckCircleIcon className="w-4 h-4" />
    </div>
  );
};

// Cell component for the virtualized grid
interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    accounts: Account[];
    tools: Tool[];
    assignments: ToolAssignment[];
    onCellClick: (accountId: string, toolId: string) => void;
    selectedAccounts: Set<string>;
    onAccountSelect: (accountId: string, selected: boolean) => void;
  };
}

const Cell: React.FC<CellProps> = ({ columnIndex, rowIndex, style, data }) => {
  const { accounts, tools, assignments, onCellClick, selectedAccounts, onAccountSelect } = data;

  // Header row
  if (rowIndex === 0) {
    if (columnIndex === 0) {
      return (
        <div style={style} className="border-r border-b bg-gray-50 p-2 font-medium text-sm flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            onChange={(e) => {
              // Select/deselect all accounts
              accounts.forEach(account => {
                onAccountSelect(account.id, e.target.checked);
              });
            }}
          />
          Account
        </div>
      );
    }

    const tool = tools[columnIndex - 1];
    if (!tool) return <div style={style}></div>;

    return (
      <div style={style} className="border-r border-b bg-gray-50 p-2 font-medium text-sm text-center">
        <div className="truncate" title={tool.name}>
          {tool.name}
        </div>
        <div className="text-xs text-gray-500 truncate" title={tool.category}>
          {tool.category}
        </div>
      </div>
    );
  }

  const account = accounts[rowIndex - 1];
  if (!account) return <div style={style}></div>;

  // Account name column
  if (columnIndex === 0) {
    const isSelected = selectedAccounts.has(account.id);
    return (
      <div style={style} className="border-r border-b p-2 bg-white flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onAccountSelect(account.id, e.target.checked)}
          className="mr-2"
        />
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium text-sm" title={account.name}>
            {account.name}
          </div>
          <div className="truncate text-xs text-gray-500" title={account.email}>
            {account.email}
          </div>
          <div className="flex items-center mt-1">
            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
              account.type === 'admin' ? 'bg-purple-100 text-purple-700' :
              account.type === 'partner' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {account.type}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Assignment cells
  const tool = tools[columnIndex - 1];
  if (!tool) return <div style={style}></div>;

  const assignment = assignments.find(a => a.account_id === account.id && a.tool_id === tool.id);

  return (
    <div 
      style={style} 
      className="border-r border-b p-2 bg-white flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onCellClick(account.id, tool.id)}
    >
      <StatusIndicator assignment={assignment} />
      {assignment && (
        <div className="mt-1 text-xs text-center">
          <div className={`px-1 py-0.5 rounded text-xs ${subscriptionColors[assignment.subscription_level]}`}>
            {assignment.subscription_level}
          </div>
          {assignment.expires_at && (
            <div className="text-gray-500 flex items-center justify-center mt-0.5">
              <ClockIcon className="w-3 h-3 mr-1" />
              {new Date(assignment.expires_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ToolAssignmentMatrix: React.FC<ToolAssignmentMatrixProps> = ({
  onAssignmentChange,
  onBulkAction
}) => {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ToolAssignmentFilters>({
    page: 1,
    limit: 100,
    sortBy: 'account_name',
    sortOrder: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const adminToolService = AdminToolService.getInstance();

  // Load matrix data
  const loadMatrixData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminToolService.getToolAssignmentMatrix(filters);
      setMatrixData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matrix data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadMatrixData();
  }, [loadMatrixData]);

  // Handle cell clicks (assign/unassign)
  const handleCellClick = useCallback(async (accountId: string, toolId: string) => {
    if (!matrixData) return;

    const existingAssignment = matrixData.assignments.find(
      a => a.account_id === accountId && a.tool_id === toolId
    );

    try {
      if (existingAssignment) {
        await adminToolService.unassignTool(accountId, toolId);
        onAssignmentChange?.(accountId, toolId, 'unassign');
      } else {
        await adminToolService.assignTool({
          accountId,
          toolId,
          subscriptionLevel: 'basic',
          accessLevel: 'limited'
        });
        onAssignmentChange?.(accountId, toolId, 'assign');
      }
      
      // Reload data to reflect changes
      await loadMatrixData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
    }
  }, [matrixData, adminToolService, onAssignmentChange, loadMatrixData]);

  // Handle account selection
  const handleAccountSelect = useCallback((accountId: string, selected: boolean) => {
    setSelectedAccounts(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(accountId);
      } else {
        newSet.delete(accountId);
      }
      return newSet;
    });
  }, []);

  // Memoized grid data
  const gridData = useMemo(() => {
    if (!matrixData) return null;

    return {
      accounts: matrixData.accounts,
      tools: matrixData.tools,
      assignments: matrixData.assignments,
      onCellClick: handleCellClick,
      selectedAccounts,
      onAccountSelect: handleAccountSelect
    };
  }, [matrixData, handleCellClick, selectedAccounts, handleAccountSelect]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ToolAssignmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  // Handle bulk actions
  const handleBulkAction = useCallback((action: string) => {
    onBulkAction?.(Array.from(selectedAccounts), action);
  }, [selectedAccounts, onBulkAction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading tool assignment matrix...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">Error loading matrix: {error}</span>
        </div>
        <button
          onClick={loadMatrixData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!matrixData || !gridData) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  const columnCount = matrixData.tools.length + 1; // +1 for account column
  const rowCount = matrixData.accounts.length + 1; // +1 for header row
  const columnWidth = 150;
  const rowHeight = 80;

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Cog6ToothIcon className="h-6 w-6 mr-2" />
            Tool Assignment Matrix
          </h2>
          <span className="text-sm text-gray-500">
            {matrixData.accounts.length} accounts × {matrixData.tools.length} tools
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts or tools..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg border flex items-center space-x-1 text-sm ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filters</span>
          </button>

          {/* Refresh */}
          <button
            onClick={loadMatrixData}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <select
                value={filters.accountType || ''}
                onChange={(e) => handleFilterChange({ accountType: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="client">Client</option>
                <option value="partner">Partner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Level</label>
              <select
                value={filters.subscriptionLevel || ''}
                onChange={(e) => handleFilterChange({ subscriptionLevel: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
                <option value="trial">Trial</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration</label>
              <select
                value={filters.expirationStatus || ''}
                onChange={(e) => handleFilterChange({ expirationStatus: e.target.value as any || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="active">Active (Not Expiring)</option>
                <option value="expires_soon">Expires Soon</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedAccounts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                {selectedAccounts.size} account{selectedAccounts.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('assign_tool')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Bulk Assign
              </button>
              <button
                onClick={() => handleBulkAction('update_subscription')}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Update Subscription
              </button>
              <button
                onClick={() => setSelectedAccounts(new Set())}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <Grid
          columnCount={columnCount}
          columnWidth={columnWidth}
          height={Math.min(600, rowHeight * Math.min(rowCount, 10))} // Max height with scrolling
          width={Math.min(1200, columnWidth * columnCount)} // Max width with horizontal scrolling
          rowCount={rowCount}
          rowHeight={rowHeight}
          itemData={gridData}
          overscanColumnCount={2}
          overscanRowCount={2}
        >
          {Cell}
        </Grid>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-200 flex items-center justify-center">
              <CheckCircleIcon className="w-3 h-3 text-green-600" />
            </div>
            <span>Active Assignment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-200 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-3 h-3 text-yellow-600" />
            </div>
            <span>Expires Soon</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-200 flex items-center justify-center">
              <XCircleIcon className="w-3 h-3 text-red-600" />
            </div>
            <span>Expired</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-xs text-gray-400">—</span>
            </div>
            <span>No Assignment</span>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {matrixData.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((matrixData.pagination.page - 1) * matrixData.pagination.limit) + 1} to{' '}
            {Math.min(matrixData.pagination.page * matrixData.pagination.limit, matrixData.pagination.total)} of{' '}
            {matrixData.pagination.total} assignments
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleFilterChange({ page: Math.max(1, matrixData.pagination.page - 1) })}
              disabled={matrixData.pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {matrixData.pagination.page} of {matrixData.pagination.pages}
            </span>
            <button
              onClick={() => handleFilterChange({ page: Math.min(matrixData.pagination.pages, matrixData.pagination.page + 1) })}
              disabled={matrixData.pagination.page === matrixData.pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolAssignmentMatrix;